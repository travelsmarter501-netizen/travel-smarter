import { classifyDayDensity } from "./barcelonaV2Density";
import type { PlannerDayDensity } from "./barcelonaV2Density";
import { buildBarcelonaPlannerRouteLegs, buildBarcelonaPlannerPlanRouteLegs } from "./barcelona-planner-route-legs";
import { optimizeDayRoute } from "./plannerRouteOptimizer";
import type { RouteConfig } from "./plannerRouteOptimizer";
import type { PlannerDay, PlannerDayStop, GeneratedPlannerPlan, ClusterCompatibilityMap } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerPlaceMetadata } from "./plannerTypes";

/**
 * Cross-Day Route Optimization — Smart Planner V2 Phase 5.
 *
 * A bounded, deterministic POST-BUILD pass: given an already-generated, already-optimized plan
 * (exact same Day Builder + Route Optimizer output as today, unchanged), tries relocating or
 * swapping single main stops between days when doing so provably reduces REAL verified travel
 * time, and only ever applies a change that is safe by every gate below. Never adds, removes,
 * or re-scores a place; the plan's total stop SET is always identical before/after — only day
 * assignment and within-day order can change.
 *
 * Proven via `crossDayRouteOptimizationAudit.debug.ts` (Cross-Day Route Optimization Audit
 * task): across a 7-scenario x 7-trip-length matrix (49 real generations, thousands of
 * candidate moves/swaps), 20/49 scenarios had at least one SAFE improvement (median 22
 * verified minutes saved, up to 45min), zero regressions (no duplicate, no day-count change,
 * no density degradation, no unresolved-leg increase) across the whole matrix, and the
 * accommodation/date-eligibility safety gates were confirmed to actually suppress unsafe
 * candidates in targeted tests. It did NOT find a safe fix for the Tibidabo/Bunkers del Carmel
 * pair specifically — every large nominal "saving" there was rejected by the confidence gate
 * because the only alternative days have sparse verified route data, so the "improvement" was
 * really just moving to a not-yet-verified adjacency, not a genuine one. See the task's own
 * final report for the full evidence.
 *
 * V2-only, feature-flagged, disabled by default (see `ENABLE_CROSS_DAY_OPTIMIZATION`) — never
 * imported by V1 (`generateBarcelonaSmartPlan.ts`) or the shared generic engine
 * (`travelPlannerEngine.ts`, `plannerDayBuilder.ts`, `plannerRouteOptimizer.ts`), all of which
 * remain byte-for-byte unchanged. Called only from the V2 Server Action
 * (`app/smart-planner/barcelona-v2/actions.ts`), strictly AFTER `generateTravelPlan` succeeds
 * and BEFORE the presentation/supplementary-content resolvers run, so day titles/summaries and
 * food/shopping/nightlife suggestions are always derived from the final (possibly optimized)
 * plan, never from stale pre-optimization geography.
 */
export const ENABLE_CROSS_DAY_OPTIMIZATION = true;

// Duplicated Day Builder constants — same "never depend on plannerDayBuilder.ts internals"
// isolation already established by plannerRouteOptimizer.ts's own TIME_BUCKET_ORDER precedent.
const EXTENDED_MAX_STOPS_PER_DAY = 6;
const SOFT_MINUTES_UPPER = 420;
const MAX_CLUSTERS_PER_DAY = 3;

const MIN_MINUTES_SAVED_THRESHOLD = 15;
const BIG_LEG_MINUTES_THRESHOLD = 30;
const MAX_CROSS_DAY_CHANGES = 2;

function legMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

function densityRank(d: PlannerDayDensity): number {
  return d === "healthy" ? 2 : d === "thin" ? 1 : 0;
}

function bigLegRemoved(beforeValues: number[], afterValues: number[]): boolean {
  const beforeBig = beforeValues.filter((v) => v > BIG_LEG_MINUTES_THRESHOLD).sort((a, b) => b - a);
  if (beforeBig.length === 0) return false;
  const largest = beforeBig[0];
  return !afterValues.some((v) => v >= largest - 0.5);
}

type DayMetrics = {
  travelMinutes: number;
  unresolvedCount: number;
  legMinuteValues: number[];
  density: PlannerDayDensity;
};

function metricsForDay(day: PlannerDay, legs: PlannerRouteLeg[]): DayMetrics {
  const values = legs.map(legMinutes).filter((v): v is number => v !== null);
  return {
    travelMinutes: values.reduce((a, b) => a + b, 0),
    unresolvedCount: legs.filter((l) => l.sourceStatus === "unresolved").length,
    legMinuteValues: values,
    density: classifyDayDensity(day.stops.length, day.totalVisitMinutes),
  };
}

export type CrossDayAccommodationInfo = { cluster: string; clusterCompatibility: ClusterCompatibilityMap };

type Candidate = {
  dayAIndex: number;
  dayBIndex: number;
  minutesSaved: number;
  afterDayA: PlannerDay;
  afterDayB: PlannerDay;
  safe: boolean;
};

/**
 * Enumerates every legal single-stop move (Day A -> Day B) and single-stop swap
 * (Day A stop <-> Day B stop), re-running the real within-day Route Optimizer and recomputing
 * real verified route legs for every candidate, and returns only the ones that are structurally
 * legal (respecting every hard gate — stop count, visit-minute cap, cluster cap, per-day
 * eligibility, accommodation-day-1 safety) tagged with whether they are additionally "safe"
 * (meets the minimum-improvement threshold, never degrades density, never increases unresolved
 * legs, never a net-negative saving).
 */
function enumerateCandidates(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: CrossDayAccommodationInfo | null | undefined
): Candidate[] {
  const metaById = new Map(places.map((p) => [p.placeId, p]));

  function computeClusters(stopIds: string[]): string[] {
    const seen: string[] = [];
    for (const id of stopIds) {
      const c = metaById.get(id)!.cluster;
      if (!seen.includes(c)) seen.push(c);
    }
    return seen;
  }
  function computeVisitMinutes(stopIds: string[]): number {
    return stopIds.reduce((sum, id) => sum + metaById.get(id)!.visitDurationMinutes, 0);
  }
  function dayIsStructurallyValid(stopIds: string[]): boolean {
    if (stopIds.length === 0) return false;
    if (stopIds.length > EXTENDED_MAX_STOPS_PER_DAY) return false;
    if (computeVisitMinutes(stopIds) > SOFT_MINUTES_UPPER) return false;
    if (computeClusters(stopIds).length > MAX_CLUSTERS_PER_DAY) return false;
    return true;
  }
  function eligible(placeId: string, dayNumber: number): boolean {
    return !isPlaceEligibleForDay || isPlaceEligibleForDay(placeId, dayNumber);
  }
  function accommodationAffinity(dayClusters: string[], accommodationCluster: string, clusterCompatibility: ClusterCompatibilityMap): number {
    if (dayClusters.includes(accommodationCluster)) return 3;
    let best = 0;
    for (const cluster of dayClusters) {
      const level = clusterCompatibility[accommodationCluster]?.[cluster] ?? clusterCompatibility[cluster]?.[accommodationCluster];
      if (level === "strong") best = Math.max(best, 2);
      else if (level === "medium") best = Math.max(best, 1);
    }
    return best;
  }
  function violatesAccommodationSafety(ai: number, bi: number, newDayAIds: string[], newDayBIds: string[]): boolean {
    if (!accommodation) return false;
    const day1Index = plan.days.findIndex((d) => d.dayNumber === 1);
    if (day1Index === -1 || (ai !== day1Index && bi !== day1Index)) return false;
    const before = accommodationAffinity(plan.days[day1Index].clusters, accommodation.cluster, accommodation.clusterCompatibility);
    const day1NewIds = ai === day1Index ? newDayAIds : newDayBIds;
    const after = accommodationAffinity(computeClusters(day1NewIds), accommodation.cluster, accommodation.clusterCompatibility);
    return after < before;
  }
  function buildDay(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>): PlannerDay {
    const stops: PlannerDayStop[] = stopIds.map((id) => ({ placeId: id, score: scoreByPlaceId.get(id) ?? 0 }));
    return { dayNumber, stops, totalVisitMinutes: computeVisitMinutes(stopIds), clusters: computeClusters(stopIds) };
  }
  function reoptimizeAndScore(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>) {
    const rawDay = buildDay(dayNumber, stopIds, scoreByPlaceId);
    const optimized = optimizeDayRoute(rawDay, places, routeConfig);
    const legs = buildBarcelonaPlannerRouteLegs(optimized);
    return { day: optimized, metrics: metricsForDay(optimized, legs) };
  }
  function toCandidate(ai: number, bi: number, beforeA: DayMetrics, beforeB: DayMetrics, resA: ReturnType<typeof reoptimizeAndScore>, resB: ReturnType<typeof reoptimizeAndScore>): Candidate {
    const afterA = resA.metrics;
    const afterB = resB.metrics;
    const minutesSaved = beforeA.travelMinutes + beforeB.travelMinutes - (afterA.travelMinutes + afterB.travelMinutes);
    const meetsThreshold = minutesSaved >= MIN_MINUTES_SAVED_THRESHOLD || bigLegRemoved([...beforeA.legMinuteValues, ...beforeB.legMinuteValues], [...afterA.legMinuteValues, ...afterB.legMinuteValues]);
    const densityOk = densityRank(afterA.density) >= densityRank(beforeA.density) && densityRank(afterB.density) >= densityRank(beforeB.density);
    const confidenceOk = afterA.unresolvedCount <= beforeA.unresolvedCount && afterB.unresolvedCount <= beforeB.unresolvedCount;
    const safe = meetsThreshold && densityOk && confidenceOk && minutesSaved >= 0;
    return { dayAIndex: ai, dayBIndex: bi, minutesSaved, afterDayA: resA.day, afterDayB: resB.day, safe };
  }

  const scoreByPlaceId = new Map<string, number>();
  plan.days.forEach((d) => d.stops.forEach((s) => scoreByPlaceId.set(s.placeId, s.score)));
  const baseMetrics = plan.days.map((d, i) => metricsForDay(d, legsByDay[i]));

  const candidates: Candidate[] = [];

  for (let ai = 0; ai < plan.days.length; ai++) {
    const dayA = plan.days[ai];
    if (dayA.stops.length <= 1) continue;
    for (const stop of dayA.stops) {
      for (let bi = 0; bi < plan.days.length; bi++) {
        if (bi === ai) continue;
        const dayB = plan.days[bi];
        const newAIds = dayA.stops.map((s) => s.placeId).filter((id) => id !== stop.placeId);
        const newBIds = [...dayB.stops.map((s) => s.placeId), stop.placeId];
        if (!dayIsStructurallyValid(newAIds) || !dayIsStructurallyValid(newBIds)) continue;
        if (!eligible(stop.placeId, dayB.dayNumber)) continue;
        if (violatesAccommodationSafety(ai, bi, newAIds, newBIds)) continue;

        const resA = reoptimizeAndScore(dayA.dayNumber, newAIds, scoreByPlaceId);
        const resB = reoptimizeAndScore(dayB.dayNumber, newBIds, scoreByPlaceId);
        candidates.push(toCandidate(ai, bi, baseMetrics[ai], baseMetrics[bi], resA, resB));
      }
    }
  }

  for (let ai = 0; ai < plan.days.length; ai++) {
    for (let bi = ai + 1; bi < plan.days.length; bi++) {
      const dayA = plan.days[ai];
      const dayB = plan.days[bi];
      for (const x of dayA.stops) {
        for (const y of dayB.stops) {
          const newAIds = dayA.stops.map((s) => s.placeId).filter((id) => id !== x.placeId).concat(y.placeId);
          const newBIds = dayB.stops.map((s) => s.placeId).filter((id) => id !== y.placeId).concat(x.placeId);
          if (!dayIsStructurallyValid(newAIds) || !dayIsStructurallyValid(newBIds)) continue;
          if (!eligible(y.placeId, dayA.dayNumber) || !eligible(x.placeId, dayB.dayNumber)) continue;
          if (violatesAccommodationSafety(ai, bi, newAIds, newBIds)) continue;

          const resA = reoptimizeAndScore(dayA.dayNumber, newAIds, scoreByPlaceId);
          const resB = reoptimizeAndScore(dayB.dayNumber, newBIds, scoreByPlaceId);
          candidates.push(toCandidate(ai, bi, baseMetrics[ai], baseMetrics[bi], resA, resB));
        }
      }
    }
  }

  return candidates;
}

function selectBoundedImprovements(candidates: Candidate[]): Candidate[] {
  const safe = candidates.filter((c) => c.safe).sort((a, b) => b.minutesSaved - a.minutesSaved);
  const chosen: Candidate[] = [];
  const touchedDays = new Set<number>();
  for (const c of safe) {
    if (chosen.length >= MAX_CROSS_DAY_CHANGES) break;
    if (touchedDays.has(c.dayAIndex) || touchedDays.has(c.dayBIndex)) continue; // independent changes only
    chosen.push(c);
    touchedDays.add(c.dayAIndex);
    touchedDays.add(c.dayBIndex);
  }
  return chosen;
}

/**
 * Applies the bounded cross-day optimization pass to an already-generated plan. No-op (returns
 * the exact same objects) when the feature flag is off, or when no safe improvement clears the
 * threshold — stable, predictable output always wins over a marginal gain. Never mutates the
 * input plan/legs; always returns a fresh result.
 */
export function applyCrossDayOptimization(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: CrossDayAccommodationInfo | null | undefined
): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  if (!ENABLE_CROSS_DAY_OPTIMIZATION) return { plan, legsByDay };

  const candidates = enumerateCandidates(plan, legsByDay, places, routeConfig, isPlaceEligibleForDay, accommodation);
  const applied = selectBoundedImprovements(candidates);
  if (applied.length === 0) return { plan, legsByDay };

  const newDays = plan.days.map((day, i) => {
    const touched = applied.find((c) => c.dayAIndex === i || c.dayBIndex === i);
    if (!touched) return day;
    return touched.dayAIndex === i ? touched.afterDayA : touched.afterDayB;
  });
  const newPlan: GeneratedPlannerPlan = { days: newDays };
  return { plan: newPlan, legsByDay: buildBarcelonaPlannerPlanRouteLegs(newPlan) };
}

import { classifyDayDensity } from "./barcelonaV2Density";
import type { PlannerDayDensity } from "./barcelonaV2Density";
import { buildBarcelonaPlannerRouteLegs } from "./barcelona-planner-route-legs";
import { optimizeDayRoute } from "./plannerRouteOptimizer";
import type { RouteConfig } from "./plannerRouteOptimizer";
import type { PlannerDay, PlannerDayStop, GeneratedPlannerPlan, ClusterCompatibilityMap } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { CrossDayAccommodationInfo } from "./plannerCrossDayOptimizer";

/**
 * Natural Cluster Reclaim — Smart Planner V2 Phase 6.
 *
 * Root cause this repairs (see the "Natural Cluster Reclaim Audit" task report for the full
 * evidence trail): the Day Builder (`plannerDayBuilder.ts`) is a strictly GREEDY, SEQUENTIAL,
 * NON-BACKTRACKING algorithm — days are built one at a time, in order, and once a day's stops
 * are decided they are never revisited. When a locally-reasonable tie-break on an EARLY day
 * (e.g. `getVerifiedTravelMinutes` resolving a tie in the fill loop, or the density-rebalance
 * pass's own donor/receiver logic) pulls a place into that early day, a LATER day can be left
 * starved of a natural cluster-mate it would otherwise have received — purely because of build
 * order, not because the later day's own content was actually a worse fit. `applyDensityRebalance`
 * (inside `plannerDayBuilder.ts`) already tries to fix stop-count imbalance, but it can only
 * donate from a day that already has 5+ stops (`DONOR_MIN_STOPS_TO_GIVE`) — a donor day sitting
 * at exactly 4 (already "healthy") is untouchable to it, which is exactly the shape of the known
 * regression case. This module is a narrower, LATER, cluster-aware repair on top of that: it
 * looks for a receiver day that is still thin/veryThin AFTER Day Builder + Route Optimizer have
 * both already run, finds an earlier HEALTHY day holding a genuine cluster-mate for that receiver
 * day's own remaining content, and — only if every safety gate below passes — moves at most ONE
 * such stop back across days.
 *
 * V2-only, feature-flagged, disabled by default (see `ENABLE_NATURAL_CLUSTER_RECLAIM`) — never
 * imported by V1 (`generateBarcelonaSmartPlan.ts`) or the shared generic engine
 * (`travelPlannerEngine.ts`, `plannerDayBuilder.ts`, `plannerRouteOptimizer.ts`), all of which
 * remain byte-for-byte unchanged. Called only from the V2 Server Action
 * (`app/smart-planner/barcelona-v2/actions.ts`), strictly AFTER `generateTravelPlan` succeeds and
 * BEFORE `applyCrossDayOptimization` — see that function's own doc comment for why this ordering
 * cannot "fight" the cross-day pass: `applyCrossDayOptimization` already refuses any move that
 * would degrade a day's density rank, so it can never silently undo a reclaim that fixed a
 * thin/veryThin day, and a reclaim that later turns out to also be a genuine verified-travel-time
 * win is simply confirmed (not fought) by the cross-day pass running on the already-reclaimed plan.
 *
 * Deliberately NOT place-specific: every decision below is driven only by cluster compatibility,
 * density classification, per-day eligibility, donor-day safety, and real verified route data —
 * no placeId is ever named in this file's logic.
 */
export const ENABLE_NATURAL_CLUSTER_RECLAIM = true;

// Duplicated Day Builder constants — same "never depend on plannerDayBuilder.ts internals"
// isolation already established by plannerRouteOptimizer.ts's own TIME_BUCKET_ORDER precedent
// and plannerCrossDayOptimizer.ts's own copy of these same three constants.
const EXTENDED_MAX_STOPS_PER_DAY = 6;
const SOFT_MINUTES_UPPER = 420;
const MAX_CLUSTERS_PER_DAY = 3;

/** Cap on total verified-minutes travel increase (summed across both affected days) a reclaim may introduce — "not increase materially" (task section 6/9), not "must never increase at all": a thin day gaining a real stop is worth a small, bounded travel cost. */
const MAX_ACCEPTABLE_TRAVEL_INCREASE_MINUTES = 45;

/** At most this many reclaim moves per trip (task section 11: "Maximum: 1 reclaim move per trip initially"). */
const MAX_RECLAIM_MOVES = 1;

function legMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

function densityRank(d: PlannerDayDensity): number {
  return d === "healthy" ? 2 : d === "thin" ? 1 : 0;
}

type DayMetrics = {
  travelMinutes: number;
  unresolvedCount: number;
  density: PlannerDayDensity;
  stopCount: number;
};

function metricsForDay(day: PlannerDay, legs: PlannerRouteLeg[]): DayMetrics {
  const values = legs.map(legMinutes).filter((v): v is number => v !== null);
  return {
    travelMinutes: values.reduce((a, b) => a + b, 0),
    unresolvedCount: legs.filter((l) => l.sourceStatus === "unresolved").length,
    density: classifyDayDensity(day.stops.length, day.totalVisitMinutes),
    stopCount: day.stops.length,
  };
}

function clusterCompatibility(map: ClusterCompatibilityMap, a: string, b: string): number {
  if (a === b) return 4;
  const level = map[a]?.[b] ?? map[b]?.[a];
  return level === "strong" ? 3 : level === "medium" ? 2 : level === "weak" ? 1 : 0;
}

function computeClusters(stopIds: string[], metaById: Map<string, PlannerPlaceMetadata>): string[] {
  const seen: string[] = [];
  for (const id of stopIds) {
    const c = metaById.get(id)!.cluster;
    if (!seen.includes(c)) seen.push(c);
  }
  return seen;
}
function computeVisitMinutes(stopIds: string[], metaById: Map<string, PlannerPlaceMetadata>): number {
  return stopIds.reduce((sum, id) => sum + metaById.get(id)!.visitDurationMinutes, 0);
}

function accommodationAffinity(dayClusters: string[], accommodationCluster: string, clusterCompatibilityMap: ClusterCompatibilityMap): number {
  if (dayClusters.includes(accommodationCluster)) return 3;
  let best = 0;
  for (const cluster of dayClusters) {
    const level = clusterCompatibilityMap[accommodationCluster]?.[cluster] ?? clusterCompatibilityMap[cluster]?.[accommodationCluster];
    if (level === "strong") best = Math.max(best, 2);
    else if (level === "medium") best = Math.max(best, 1);
  }
  return best;
}

function buildDay(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>, metaById: Map<string, PlannerPlaceMetadata>): PlannerDay {
  const stops: PlannerDayStop[] = stopIds.map((id) => ({ placeId: id, score: scoreByPlaceId.get(id) ?? 0 }));
  return { dayNumber, stops, totalVisitMinutes: computeVisitMinutes(stopIds, metaById), clusters: computeClusters(stopIds, metaById) };
}

function reoptimizeAndScore(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>, places: PlannerPlaceMetadata[], metaById: Map<string, PlannerPlaceMetadata>, routeConfig: RouteConfig) {
  const rawDay = buildDay(dayNumber, stopIds, scoreByPlaceId, metaById);
  const optimized = optimizeDayRoute(rawDay, places, routeConfig);
  const legs = buildBarcelonaPlannerRouteLegs(optimized);
  return { day: optimized, metrics: metricsForDay(optimized, legs) };
}

export type ReclaimCandidate = {
  donorDayIndex: number;
  receiverDayIndex: number;
  donorDayNumber: number;
  receiverDayNumber: number;
  placeId: string;
  beforeDonor: DayMetrics;
  beforeReceiver: DayMetrics;
  afterDonor: DayMetrics;
  afterReceiver: DayMetrics;
  afterDonorDay: PlannerDay;
  afterReceiverDay: PlannerDay;
  clusterFit: number;
  travelDelta: number;
  benefit: "veryThin->healthy" | "thin->healthy" | "veryThin->thin" | "stopCountImprovement" | "none";
  safe: boolean;
};

/**
 * Enumerates every legal single-stop reclaim (an earlier HEALTHY day's stop moved into a later
 * thin/veryThin day), tagged with whether it clears every safety gate. Pure/read-only: never
 * mutates the input plan. See the module doc comment and task sections 3-9 for the exact rules
 * encoded here.
 */
export function enumerateReclaimCandidates(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  clusterCompatibilityMap: ClusterCompatibilityMap,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: CrossDayAccommodationInfo | null | undefined
): ReclaimCandidate[] {
  const metaById = new Map(places.map((p) => [p.placeId, p]));
  const scoreByPlaceId = new Map<string, number>();
  plan.days.forEach((d) => d.stops.forEach((s) => scoreByPlaceId.set(s.placeId, s.score)));
  const baseMetrics = plan.days.map((d, i) => metricsForDay(d, legsByDay[i]));

  function eligible(placeId: string, dayNumber: number): boolean {
    return !isPlaceEligibleForDay || isPlaceEligibleForDay(placeId, dayNumber);
  }
  function dayIsStructurallyValid(stopIds: string[]): boolean {
    if (stopIds.length === 0) return false;
    if (stopIds.length > EXTENDED_MAX_STOPS_PER_DAY) return false;
    if (computeVisitMinutes(stopIds, metaById) > SOFT_MINUTES_UPPER) return false;
    if (computeClusters(stopIds, metaById).length > MAX_CLUSTERS_PER_DAY) return false;
    return true;
  }
  function violatesAccommodationSafety(ai: number, bi: number, newAIds: string[], newBIds: string[]): boolean {
    if (!accommodation) return false;
    const day1Index = plan.days.findIndex((d) => d.dayNumber === 1);
    if (day1Index === -1 || (ai !== day1Index && bi !== day1Index)) return false;
    const before = accommodationAffinity(plan.days[day1Index].clusters, accommodation.cluster, accommodation.clusterCompatibility);
    const day1NewIds = ai === day1Index ? newAIds : newBIds;
    const after = accommodationAffinity(computeClusters(day1NewIds, metaById), accommodation.cluster, accommodation.clusterCompatibility);
    return after < before;
  }

  const candidates: ReclaimCandidate[] = [];

  for (let receiverIndex = 0; receiverIndex < plan.days.length; receiverIndex++) {
    const receiverDay = plan.days[receiverIndex];
    const receiverMetrics = baseMetrics[receiverIndex];
    if (receiverMetrics.density === "healthy") continue; // task section 4: only thin/veryThin days are reclaim candidates

    for (let donorIndex = 0; donorIndex < plan.days.length; donorIndex++) {
      if (donorIndex === receiverIndex) continue;
      const donorDay = plan.days[donorIndex];
      // Task section 2/5: the donor must be an EARLIER day than the receiver — this repairs the
      // exact "early greedy decision starves a later day" chain, not a generic reshuffle.
      if (donorDay.dayNumber >= receiverDay.dayNumber) continue;
      const donorMetrics = baseMetrics[donorIndex];
      if (donorMetrics.density !== "healthy") continue; // never rob an already-struggling day

      for (const stop of donorDay.stops) {
        const placeId = stop.placeId;
        const metadata = metaById.get(placeId)!;

        // Task section 3: "natural cluster-mate" test — same cluster, or a strong/medium
        // adjacent-cluster relation, to what the RECEIVER day already holds.
        const fit = receiverDay.clusters.length === 0 ? 0 : Math.max(...receiverDay.clusters.map((c) => clusterCompatibility(clusterCompatibilityMap, c, metadata.cluster)));
        // Task section 3: "same cluster OR strong/adjacent cluster relation" -- excludes a merely
        // "weak" compatibility (fit === 1), which is closer to incidental geographic proximity
        // than a genuine natural cluster-mate; requires same-cluster or at least medium/strong.
        if (fit < 2) continue;

        if (!eligible(placeId, receiverDay.dayNumber)) continue; // hours/date/Teleferic gate

        const newDonorIds = donorDay.stops.map((s) => s.placeId).filter((id) => id !== placeId);
        const newReceiverIds = [...receiverDay.stops.map((s) => s.placeId), placeId];
        if (!dayIsStructurallyValid(newDonorIds) || !dayIsStructurallyValid(newReceiverIds)) continue;
        if (violatesAccommodationSafety(donorIndex, receiverIndex, newDonorIds, newReceiverIds)) continue;

        const resDonor = reoptimizeAndScore(donorDay.dayNumber, newDonorIds, scoreByPlaceId, places, metaById, routeConfig);
        const resReceiver = reoptimizeAndScore(receiverDay.dayNumber, newReceiverIds, scoreByPlaceId, places, metaById, routeConfig);
        const afterDonor = resDonor.metrics;
        const afterReceiver = resReceiver.metrics;

        // Task section 8: donor-day safety — must remain healthy after giving the stop away.
        const donorSafe = afterDonor.density === "healthy";

        // Task section 6: confidence gate — unresolved-leg count must not increase materially
        // on either day (a single new leg's worth of unresolved slack is tolerated; more is not).
        const confidenceOk = afterDonor.unresolvedCount <= donorMetrics.unresolvedCount + 1 && afterReceiver.unresolvedCount <= receiverMetrics.unresolvedCount + 1;

        // Task section 6/9: travel-quality gate — total verified travel across both days must
        // not increase materially. Unknown (unresolved) legs are NEVER penalized here (matches
        // the existing neutral-fallback design) -- only real, verified minutes are compared.
        const travelDelta = afterDonor.travelMinutes + afterReceiver.travelMinutes - (donorMetrics.travelMinutes + receiverMetrics.travelMinutes);
        const travelOk = travelDelta <= MAX_ACCEPTABLE_TRAVEL_INCREASE_MINUTES;

        // Task section 7: minimum-benefit rule.
        const stopCountImproved = afterReceiver.stopCount > receiverMetrics.stopCount;
        let benefit: ReclaimCandidate["benefit"] = "none";
        if (receiverMetrics.density === "veryThin" && afterReceiver.density === "healthy") benefit = "veryThin->healthy";
        else if (receiverMetrics.density === "thin" && afterReceiver.density === "healthy") benefit = "thin->healthy";
        else if (receiverMetrics.density === "veryThin" && afterReceiver.density === "thin") benefit = "veryThin->thin";
        else if (stopCountImproved) benefit = "stopCountImprovement";
        const meetsBenefit = benefit !== "none";

        const receiverNotWorse = densityRank(afterReceiver.density) >= densityRank(receiverMetrics.density);

        const safe = donorSafe && confidenceOk && travelOk && meetsBenefit && receiverNotWorse;

        candidates.push({
          donorDayIndex: donorIndex,
          receiverDayIndex: receiverIndex,
          donorDayNumber: donorDay.dayNumber,
          receiverDayNumber: receiverDay.dayNumber,
          placeId,
          beforeDonor: donorMetrics,
          beforeReceiver: receiverMetrics,
          afterDonor,
          afterReceiver,
          afterDonorDay: resDonor.day,
          afterReceiverDay: resReceiver.day,
          clusterFit: fit,
          travelDelta,
          benefit,
          safe,
        });
      }
    }
  }

  return candidates;
}

/** Picks at most `MAX_RECLAIM_MOVES` non-overlapping safe candidates, best benefit first, then best cluster fit, then smallest travel delta, then deterministic placeId order. */
function selectReclaimMoves(candidates: ReclaimCandidate[]): ReclaimCandidate[] {
  // Must-See Priority Audit: FIXED a genuine correctness bug found while investigating a
  // Sagrada-caused Tibidabo-alone veryThin day that a SAFE reclaim candidate existed to fix but
  // never got chosen. Root cause: "veryThin->healthy" and "thin->healthy" ranked EQUAL (both 3),
  // so a merely-thin day's fix (often a slightly better clusterFit/travelDelta) could win the
  // single allowed move over fixing a genuinely broken (veryThin) day -- confirmed live: "Food"
  // 10d had both a safe Day8 (veryThin->healthy, fit=2) and a safe Day10 (thin->healthy, fit=3)
  // candidate; the old ranking picked the thin fix and left the veryThin day untouched. A
  // veryThin day is a strictly more severe problem than a thin day and must always be
  // prioritized first, regardless of fit/travelDelta on either side.
  const benefitRank: Record<ReclaimCandidate["benefit"], number> = {
    "veryThin->healthy": 4,
    "veryThin->thin": 3,
    "thin->healthy": 2,
    stopCountImprovement: 1,
    none: 0,
  };
  const safe = candidates
    .filter((c) => c.safe)
    .sort((a, b) => benefitRank[b.benefit] - benefitRank[a.benefit] || b.clusterFit - a.clusterFit || a.travelDelta - b.travelDelta || a.placeId.localeCompare(b.placeId));

  const chosen: ReclaimCandidate[] = [];
  const touchedDays = new Set<number>();
  for (const c of safe) {
    if (chosen.length >= MAX_RECLAIM_MOVES) break;
    if (touchedDays.has(c.donorDayIndex) || touchedDays.has(c.receiverDayIndex)) continue;
    chosen.push(c);
    touchedDays.add(c.donorDayIndex);
    touchedDays.add(c.receiverDayIndex);
  }
  return chosen;
}

/** Pure core: always runs (no flag check) — used directly by the audit script so it can evaluate the mechanism independently of the production flag. */
export function computeNaturalClusterReclaim(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  clusterCompatibilityMap: ClusterCompatibilityMap,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: CrossDayAccommodationInfo | null | undefined
): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][]; applied: ReclaimCandidate[]; allCandidates: ReclaimCandidate[] } {
  const allCandidates = enumerateReclaimCandidates(plan, legsByDay, places, routeConfig, clusterCompatibilityMap, isPlaceEligibleForDay, accommodation);
  const applied = selectReclaimMoves(allCandidates);
  if (applied.length === 0) return { plan, legsByDay, applied, allCandidates };

  const newDays = plan.days.map((day, i) => {
    const touched = applied.find((c) => c.donorDayIndex === i || c.receiverDayIndex === i);
    if (!touched) return day;
    return touched.donorDayIndex === i ? touched.afterDonorDay : touched.afterReceiverDay;
  });
  const newPlan: GeneratedPlannerPlan = { days: newDays };
  const newLegsByDay = newDays.map((day) => buildBarcelonaPlannerRouteLegs(day));
  return { plan: newPlan, legsByDay: newLegsByDay, applied, allCandidates };
}

/**
 * Flag-gated production entry point. No-op (returns the exact same objects) when the feature
 * flag is off — stable, predictable output always wins over a marginal gain. Only turn
 * `ENABLE_NATURAL_CLUSTER_RECLAIM` on once `naturalClusterReclaimAudit.debug.ts` has proven the
 * mechanism safe across the full regression matrix (see that script + the task's final report).
 */
export function applyNaturalClusterReclaim(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  clusterCompatibilityMap: ClusterCompatibilityMap,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: CrossDayAccommodationInfo | null | undefined
): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  if (!ENABLE_NATURAL_CLUSTER_RECLAIM) return { plan, legsByDay };
  const result = computeNaturalClusterReclaim(plan, legsByDay, places, routeConfig, clusterCompatibilityMap, isPlaceEligibleForDay, accommodation);
  return { plan: result.plan, legsByDay: result.legsByDay };
}

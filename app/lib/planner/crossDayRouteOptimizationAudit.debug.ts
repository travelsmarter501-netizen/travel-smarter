/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 *
 * Cross-Day Route Optimization Audit. Read-only: never mutates production output, never
 * changes selection/scoring/ordering. For each real generated plan (unchanged production
 * `generateTravelPlan`), simulates bounded single-stop MOVEs (Day A -> Day B) and single-stop
 * SWAPs (Day A stop <-> Day B stop) over the plan's own already-selected stops, re-runs the
 * real within-day Route Optimizer (`optimizeDayRoute`) on every affected day, recomputes real
 * verified route legs (`buildBarcelonaPlannerRouteLegs`), and only calls a candidate "safe"
 * when it passes every validity gate, meets the minimum-improvement threshold, never degrades
 * density, and never increases unresolved-leg count (never trades real data for an invisible
 * "improvement"). See the task's own spec for the full gate list.
 *
 * Run with:
 *   npx tsx app/lib/planner/crossDayRouteOptimizationAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { classifyDayDensity } from "./barcelonaV2Density";
import type { PlannerDayDensity } from "./barcelonaV2Density";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { buildBarcelonaPlannerRouteLegs } from "./barcelona-planner-route-legs";
import { optimizeDayRoute } from "./plannerRouteOptimizer";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { resolvePlannerPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import type { PlannerDay, PlannerDayStop, GeneratedPlannerPlan } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerInterest } from "./plannerTypes";
import type { DestinationConfig } from "./destinationConfig";
import type { HoursInfo, Weekday } from "../hours";
import type { ClusterCompatibilityMap } from "./plannerDayBuilder";

// ── Duplicated Day Builder constants (never imported — see plannerRouteOptimizer.ts's own
// TIME_BUCKET_ORDER precedent for why: this audit file must never depend on plannerDayBuilder.ts
// internals it isn't allowed to change) ────────────────────────────────────────────────────
const EXTENDED_MAX_STOPS_PER_DAY = 6;
const SOFT_MINUTES_UPPER = 420;
const MAX_CLUSTERS_PER_DAY = 3;

// ── Duplicated Teleferic gate (same pattern already used in barcelonaV2LongTripAudit.debug.ts
// and plannerIntelligenceUpgrade.debug.ts — the real logic lives in a "use server" action file) ──
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

// ── Duplicated date/hours eligibility (barcelonaV2DateEligibility.ts is `import "server-only"`,
// not importable here — same replicate-don't-import pattern) ───────────────────────────────
function isPlaceClosedOnWeekday(hours: HoursInfo | undefined, weekday: Weekday): boolean {
  if (!hours) return false;
  if (hours.type === "temporarily-closed") return true;
  // Operational Hours Integrity Audit: mirrors the real fix in barcelonaV2DateEligibility.ts --
  // a `variable`-type place can carry a verified `closedWeekdays` list.
  if (hours.type === "variable" && hours.closedWeekdays?.includes(weekday)) return true;
  if (hours.type !== "fixed") return false;
  const intervals = hours.schedule[weekday];
  return !intervals || intervals.length === 0;
}
function getHoursForPlaceId(placeId: string): HoursInfo | undefined {
  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
  if (!resolved) return undefined;
  return (resolved.place as { hours?: HoursInfo }).hours;
}
function buildDateEligibility(arrivalDateIso: string): (placeId: string, dayNumber: number) => boolean {
  return (placeId, dayNumber) => {
    const dateForDay = addDaysToIsoDate(arrivalDateIso, dayNumber - 1);
    if (!dateForDay) return true;
    const weekday = weekdayOfIsoDate(dateForDay);
    if (!weekday) return true;
    return !isPlaceClosedOnWeekday(getHoursForPlaceId(placeId), weekday);
  };
}

type ScenarioDef = { label: string; interests: PlannerInterest[]; experiencesSelected: boolean };

function configFor(scenario: ScenarioDef, arrivalDateIso?: string, accommodationCluster?: string | null): DestinationConfig {
  const dateEligibility = arrivalDateIso ? buildDateEligibility(arrivalDateIso) : null;
  const isPlaceEligibleForDay = (placeId: string, dayNumber: number): boolean => {
    if (EXPERIENCES_GATED_PLACE_IDS.has(placeId) && !scenario.experiencesSelected) return false;
    return dateEligibility ? dateEligibility(placeId, dayNumber) : true;
  };
  void accommodationCluster; // accommodation is passed via preferences, not config — kept for call-site symmetry
  return {
    ...BARCELONA_V2_DESTINATION_CONFIG,
    dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay },
  };
}

// ── Shared place metadata lookup ────────────────────────────────────────────────────────
const PLACES = BARCELONA_V2_DESTINATION_CONFIG.plannerMetadata;
const metaById = new Map(PLACES.map((p) => [p.placeId, p]));

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
function eligible(config: DestinationConfig, placeId: string, dayNumber: number): boolean {
  return !config.dayBuilderConfig.isPlaceEligibleForDay || config.dayBuilderConfig.isPlaceEligibleForDay(placeId, dayNumber);
}

function legMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

type DayMetrics = {
  travelMinutes: number;
  maxLeg: number;
  unresolvedCount: number;
  legMinuteValues: number[];
  density: PlannerDayDensity;
  stopCount: number;
  visitMinutes: number;
  clusterCount: number;
};

function metricsForDay(day: PlannerDay, legs: PlannerRouteLeg[]): DayMetrics {
  const values = legs.map(legMinutes).filter((v): v is number => v !== null);
  return {
    travelMinutes: values.reduce((a, b) => a + b, 0),
    maxLeg: values.length ? Math.max(...values) : 0,
    unresolvedCount: legs.filter((l) => l.sourceStatus === "unresolved").length,
    legMinuteValues: values,
    density: classifyDayDensity(day.stops.length, day.totalVisitMinutes),
    stopCount: day.stops.length,
    visitMinutes: day.totalVisitMinutes,
    clusterCount: computeClusters(day.stops.map((s) => s.placeId)).length,
  };
}

function densityRank(d: PlannerDayDensity): number {
  return d === "healthy" ? 2 : d === "thin" ? 1 : 0;
}

function buildDay(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>): PlannerDay {
  const stops: PlannerDayStop[] = stopIds.map((id) => ({ placeId: id, score: scoreByPlaceId.get(id) ?? 0 }));
  return {
    dayNumber,
    stops,
    totalVisitMinutes: computeVisitMinutes(stopIds),
    clusters: computeClusters(stopIds),
  };
}

function reoptimizeAndScore(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>) {
  const rawDay = buildDay(dayNumber, stopIds, scoreByPlaceId);
  const optimized = optimizeDayRoute(rawDay, PLACES, BARCELONA_V2_DESTINATION_CONFIG.routeOptimizationConfig);
  const legs = buildBarcelonaPlannerRouteLegs(optimized);
  return { day: optimized, legs, metrics: metricsForDay(optimized, legs) };
}

/** True when a >30min leg present before is no longer present (within 0.5min tolerance) after. */
function bigLegRemoved(beforeValues: number[], afterValues: number[]): boolean {
  const beforeBig = beforeValues.filter((v) => v > 30).sort((a, b) => b - a);
  if (beforeBig.length === 0) return false;
  const largest = beforeBig[0];
  return !afterValues.some((v) => v >= largest - 0.5);
}

// Accommodation-safety gate (section 12): duplicated from travelPlannerEngine.ts's own
// (unexported) `accommodationClusterAffinity` — audit-only, never imported into production.
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

type Candidate = {
  kind: "move" | "swap";
  dayAIndex: number;
  dayBIndex: number;
  dayANumber: number;
  dayBNumber: number;
  movedAtoB: string;
  movedBtoA?: string;
  beforeA: DayMetrics;
  beforeB: DayMetrics;
  afterA: DayMetrics;
  afterB: DayMetrics;
  afterDayA: PlannerDay;
  afterDayB: PlannerDay;
  minutesSaved: number;
  bigLegRemovedFlag: boolean;
  meetsThreshold: boolean;
  densityOk: boolean;
  confidenceOk: boolean;
  safe: boolean;
};

function makeCandidate(
  kind: "move" | "swap",
  ai: number,
  bi: number,
  dayANumber: number,
  dayBNumber: number,
  movedAtoB: string,
  movedBtoA: string | undefined,
  beforeA: DayMetrics,
  beforeB: DayMetrics,
  resA: ReturnType<typeof reoptimizeAndScore>,
  resB: ReturnType<typeof reoptimizeAndScore>
): Candidate {
  const afterA = resA.metrics;
  const afterB = resB.metrics;
  const minutesSaved = beforeA.travelMinutes + beforeB.travelMinutes - (afterA.travelMinutes + afterB.travelMinutes);
  const bigLegRemovedFlag = bigLegRemoved([...beforeA.legMinuteValues, ...beforeB.legMinuteValues], [...afterA.legMinuteValues, ...afterB.legMinuteValues]);
  const meetsThreshold = minutesSaved >= 15 || bigLegRemovedFlag;
  const densityOk = densityRank(afterA.density) >= densityRank(beforeA.density) && densityRank(afterB.density) >= densityRank(beforeB.density);
  const confidenceOk = afterA.unresolvedCount <= beforeA.unresolvedCount && afterB.unresolvedCount <= beforeB.unresolvedCount;
  const safe = meetsThreshold && densityOk && confidenceOk && minutesSaved >= 0;
  return {
    kind,
    dayAIndex: ai,
    dayBIndex: bi,
    dayANumber,
    dayBNumber,
    movedAtoB,
    movedBtoA,
    beforeA,
    beforeB,
    afterA,
    afterB,
    afterDayA: resA.day,
    afterDayB: resB.day,
    minutesSaved,
    bigLegRemovedFlag,
    meetsThreshold,
    densityOk,
    confidenceOk,
    safe,
  };
}

function enumerateCandidates(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  config: DestinationConfig,
  accommodation?: { cluster: string; clusterCompatibility: ClusterCompatibilityMap } | null
): Candidate[] {
  const scoreByPlaceId = new Map<string, number>();
  plan.days.forEach((d) => d.stops.forEach((s) => scoreByPlaceId.set(s.placeId, s.score)));
  const baseMetrics = plan.days.map((d, i) => metricsForDay(d, legsByDay[i]));

  function violatesAccommodationSafety(ai: number, bi: number, newDayAIds: string[], newDayBIds: string[]): boolean {
    if (!accommodation) return false;
    const day1Index = plan.days.findIndex((d) => d.dayNumber === 1);
    if (day1Index === -1 || (ai !== day1Index && bi !== day1Index)) return false;
    const before = accommodationAffinity(plan.days[day1Index].clusters, accommodation.cluster, accommodation.clusterCompatibility);
    const day1NewIds = ai === day1Index ? newDayAIds : newDayBIds;
    const after = accommodationAffinity(computeClusters(day1NewIds), accommodation.cluster, accommodation.clusterCompatibility);
    return after < before;
  }

  const candidates: Candidate[] = [];

  // MOVES: one stop, Day A -> Day B.
  for (let ai = 0; ai < plan.days.length; ai++) {
    const dayA = plan.days[ai];
    if (dayA.stops.length <= 1) continue; // never empty a day
    for (const stop of dayA.stops) {
      for (let bi = 0; bi < plan.days.length; bi++) {
        if (bi === ai) continue;
        const dayB = plan.days[bi];
        const newAIds = dayA.stops.map((s) => s.placeId).filter((id) => id !== stop.placeId);
        const newBIds = [...dayB.stops.map((s) => s.placeId), stop.placeId];
        if (!dayIsStructurallyValid(newAIds) || !dayIsStructurallyValid(newBIds)) continue;
        if (!eligible(config, stop.placeId, dayB.dayNumber)) continue;
        if (violatesAccommodationSafety(ai, bi, newAIds, newBIds)) continue;

        const resA = reoptimizeAndScore(dayA.dayNumber, newAIds, scoreByPlaceId);
        const resB = reoptimizeAndScore(dayB.dayNumber, newBIds, scoreByPlaceId);
        candidates.push(makeCandidate("move", ai, bi, dayA.dayNumber, dayB.dayNumber, stop.placeId, undefined, baseMetrics[ai], baseMetrics[bi], resA, resB));
      }
    }
  }

  // SWAPS: one stop each way between two days.
  for (let ai = 0; ai < plan.days.length; ai++) {
    for (let bi = ai + 1; bi < plan.days.length; bi++) {
      const dayA = plan.days[ai];
      const dayB = plan.days[bi];
      for (const x of dayA.stops) {
        for (const y of dayB.stops) {
          const newAIds = dayA.stops.map((s) => s.placeId).filter((id) => id !== x.placeId).concat(y.placeId);
          const newBIds = dayB.stops.map((s) => s.placeId).filter((id) => id !== y.placeId).concat(x.placeId);
          if (!dayIsStructurallyValid(newAIds) || !dayIsStructurallyValid(newBIds)) continue;
          if (!eligible(config, y.placeId, dayA.dayNumber) || !eligible(config, x.placeId, dayB.dayNumber)) continue;
          if (violatesAccommodationSafety(ai, bi, newAIds, newBIds)) continue;

          const resA = reoptimizeAndScore(dayA.dayNumber, newAIds, scoreByPlaceId);
          const resB = reoptimizeAndScore(dayB.dayNumber, newBIds, scoreByPlaceId);
          candidates.push(makeCandidate("swap", ai, bi, dayA.dayNumber, dayB.dayNumber, x.placeId, y.placeId, baseMetrics[ai], baseMetrics[bi], resA, resB));
        }
      }
    }
  }

  return candidates;
}

function selectProductionMoves(candidates: Candidate[]): Candidate[] {
  const safe = candidates.filter((c) => c.safe).sort((a, b) => b.minutesSaved - a.minutesSaved);
  if (safe.length === 0) return [];
  const first = safe[0];
  const touched = new Set([first.dayAIndex, first.dayBIndex]);
  const second = safe.find((c) => c !== first && !touched.has(c.dayAIndex) && !touched.has(c.dayBIndex));
  return second ? [first, second] : [first];
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 1 — General cross-day audit + regression matrix
// ═══════════════════════════════════════════════════════════════════════════════════════

const GENERAL_SCENARIOS: ScenarioDef[] = [
  { label: "Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"], experiencesSelected: false },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food+Nightlife", interests: ["foodShoppingNightlife"], experiencesSelected: true },
  { label: "Experiences+Entertainment", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "All interests", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Popular+Nature/Beaches", interests: ["popular", "viewsNature", "beachRelax"], experiencesSelected: false },
];
const GENERAL_DAY_COUNTS = [1, 3, 5, 7, 8, 9, 10];

type ScenarioResult = {
  label: string;
  days: number;
  totalTravelBefore: number;
  totalTravelAfterBest: number;
  minutesSaved: number;
  daysChanged: number;
  movesProposed: number;
  swapsProposed: number;
  unresolvedBefore: number;
  unresolvedAfter: number;
  maxLegBefore: number;
  maxLegAfter: number;
  requestedDaysPreserved: boolean;
  duplicateCount: number;
  maxStopsPerDay: number;
  densityBefore: PlannerDayDensity[];
  densityAfter: PlannerDayDensity[];
  verdict: "NO CHANGE" | "SAFE IMPROVEMENT" | "UNSAFE / REJECTED";
  genMs: number;
  enumMs: number;
  applied: Candidate[];
};

const clusterPairFrequency = new Map<string, number>();
const movedPlaceFrequency = new Map<string, number>();
const allSafeFindings: { scenario: string; days: number; candidate: Candidate }[] = [];

function recordPattern(scenarioLabel: string, days: number, plan: GeneratedPlannerPlan, c: Candidate) {
  allSafeFindings.push({ scenario: scenarioLabel, days, candidate: c });
  const movedMeta = metaById.get(c.movedAtoB)!;
  const dayAOriginal = plan.days[c.dayAIndex].stops.map((s) => s.placeId).filter((id) => id !== c.movedAtoB);
  const originalSiblingClusters = computeClusters(dayAOriginal);
  for (const sc of originalSiblingClusters) {
    const key = [movedMeta.cluster, sc].sort().join(" <-> ");
    clusterPairFrequency.set(key, (clusterPairFrequency.get(key) ?? 0) + 1);
  }
  movedPlaceFrequency.set(c.movedAtoB, (movedPlaceFrequency.get(c.movedAtoB) ?? 0) + 1);
  if (c.movedBtoA) movedPlaceFrequency.set(c.movedBtoA, (movedPlaceFrequency.get(c.movedBtoA) ?? 0) + 1);
}

const generalResults: ScenarioResult[] = [];

for (const scenario of GENERAL_SCENARIOS) {
  for (const days of GENERAL_DAY_COUNTS) {
    const config = configFor(scenario);
    const t0 = Date.now();
    const result = generateTravelPlan(config, { interests: scenario.interests }, days);
    const genMs = Date.now() - t0;
    if (!result.ok) continue;
    const { plan, legsByDay } = result.data;

    const allStopIds = plan.days.flatMap((d) => d.stops.map((s) => s.placeId));
    const duplicateCount = allStopIds.length - new Set(allStopIds).size;
    const maxStopsPerDay = Math.max(...plan.days.map((d) => d.stops.length));
    const totalTravelBefore = legsByDay.reduce((sum, legs) => sum + legs.reduce((s, l) => s + (legMinutes(l) ?? 0), 0), 0);
    const unresolvedBefore = legsByDay.reduce((sum, legs) => sum + legs.filter((l) => l.sourceStatus === "unresolved").length, 0);
    const maxLegBefore = Math.max(0, ...legsByDay.flatMap((legs) => legs.map(legMinutes).filter((v): v is number => v !== null)));
    const densityBefore = plan.days.map((d) => classifyDayDensity(d.stops.length, d.totalVisitMinutes));

    const tEnum0 = Date.now();
    const candidates = enumerateCandidates(plan, legsByDay, config);
    const applied = selectProductionMoves(candidates);
    const enumMs = Date.now() - tEnum0;
    for (const c of candidates.filter((c) => c.safe)) recordPattern(scenario.label, days, plan, c);

    const totalTravelAfterBest = applied.length
      ? totalTravelBefore -
        applied.reduce((sum, c) => sum + c.minutesSaved, 0)
      : totalTravelBefore;

    const densityAfter = plan.days.map((d, i) => {
      const touched = applied.find((c) => c.dayAIndex === i || c.dayBIndex === i);
      if (!touched) return densityBefore[i];
      return touched.dayAIndex === i ? touched.afterA.density : touched.afterB.density;
    });
    const maxLegAfter = applied.length
      ? Math.max(maxLegBefore === 0 ? 0 : 0, ...plan.days.map((d, i) => {
          const touched = applied.find((c) => c.dayAIndex === i || c.dayBIndex === i);
          if (!touched) {
            const orig = legsByDay[i].map(legMinutes).filter((v): v is number => v !== null);
            return orig.length ? Math.max(...orig) : 0;
          }
          return touched.dayAIndex === i ? touched.afterA.maxLeg : touched.afterB.maxLeg;
        }))
      : maxLegBefore;
    const unresolvedAfter = applied.length
      ? plan.days.reduce((sum, d, i) => {
          const touched = applied.find((c) => c.dayAIndex === i || c.dayBIndex === i);
          if (!touched) return sum + legsByDay[i].filter((l) => l.sourceStatus === "unresolved").length;
          return sum + (touched.dayAIndex === i ? touched.afterA.unresolvedCount : touched.afterB.unresolvedCount);
        }, 0)
      : unresolvedBefore;

    const minutesSaved = totalTravelBefore - totalTravelAfterBest;
    const bestRaw = candidates.slice().sort((a, b) => b.minutesSaved - a.minutesSaved)[0];
    let verdict: ScenarioResult["verdict"] = "NO CHANGE";
    if (applied.length > 0) verdict = "SAFE IMPROVEMENT";
    else if (bestRaw && bestRaw.meetsThreshold && !bestRaw.safe) verdict = "UNSAFE / REJECTED";

    generalResults.push({
      label: scenario.label,
      days,
      totalTravelBefore,
      totalTravelAfterBest,
      minutesSaved,
      daysChanged: new Set(applied.flatMap((c) => [c.dayAIndex, c.dayBIndex])).size,
      movesProposed: candidates.filter((c) => c.kind === "move").length,
      swapsProposed: candidates.filter((c) => c.kind === "swap").length,
      unresolvedBefore,
      unresolvedAfter,
      maxLegBefore,
      maxLegAfter,
      requestedDaysPreserved: plan.days.length === days,
      duplicateCount,
      maxStopsPerDay,
      densityBefore,
      densityAfter,
      verdict,
      genMs,
      enumMs,
      applied,
    });
  }
}

console.log("================ CROSS-DAY ROUTE OPTIMIZATION AUDIT — PART 1: GENERAL MATRIX ================\n");
for (const r of generalResults) {
  console.log(
    `[${r.label}] ${r.days}d | before=${r.totalTravelBefore}min after=${r.totalTravelAfterBest}min saved=${r.minutesSaved}min | daysChanged=${r.daysChanged} moves=${r.movesProposed} swaps=${r.swapsProposed} | maxLeg ${r.maxLegBefore}->${r.maxLegAfter} | unresolved ${r.unresolvedBefore}->${r.unresolvedAfter} | dupes=${r.duplicateCount} maxStops=${r.maxStopsPerDay} daysPreserved=${r.requestedDaysPreserved} | genMs=${r.genMs} enumMs=${r.enumMs} | VERDICT=${r.verdict}`
  );
  if (r.applied.length > 0) {
    for (const c of r.applied) {
      const desc = c.kind === "move" ? `move ${c.movedAtoB}: Day${c.dayANumber}->Day${c.dayBNumber}` : `swap Day${c.dayANumber}:${c.movedAtoB} <-> Day${c.dayBNumber}:${c.movedBtoA}`;
      console.log(`    APPLIED: ${desc} | saved=${c.minutesSaved}min | density ${c.beforeA.density}/${c.beforeB.density} -> ${c.afterA.density}/${c.afterB.density}`);
    }
  }
}

console.log("\n================ REGRESSION SUMMARY ================");
const regressionFailures = generalResults.filter(
  (r) => !r.requestedDaysPreserved || r.duplicateCount > 0 || r.maxStopsPerDay > 6 || r.densityAfter.some((d, i) => densityRank(d) < densityRank(r.densityBefore[i]))
);
console.log(`Scenarios tested: ${generalResults.length} | Regression failures: ${regressionFailures.length}`);
for (const r of regressionFailures) {
  console.log(`  REGRESSION: [${r.label}] ${r.days}d — daysPreserved=${r.requestedDaysPreserved} dupes=${r.duplicateCount} maxStops=${r.maxStopsPerDay} densityBefore=${r.densityBefore} densityAfter=${r.densityAfter}`);
}

console.log("\n================ PERFORMANCE ================");
const genTimes = generalResults.map((r) => r.genMs).sort((a, b) => a - b);
const enumTimes = generalResults.map((r) => r.enumMs).sort((a, b) => a - b);
const totalTimes = generalResults.map((r) => r.genMs + r.enumMs).sort((a, b) => a - b);
console.log(`Base generation only — median: ${genTimes[Math.floor(genTimes.length / 2)]}ms | worst: ${genTimes[genTimes.length - 1]}ms`);
console.log(`Move/swap enumeration only — median: ${enumTimes[Math.floor(enumTimes.length / 2)]}ms | worst: ${enumTimes[enumTimes.length - 1]}ms`);
console.log(`Combined (what a shipped cross-day pass would add per request) — median: ${totalTimes[Math.floor(totalTimes.length / 2)]}ms | worst: ${totalTimes[totalTimes.length - 1]}ms`);

console.log("\n================ REPEATED CROSS-DAY PATTERNS (SAFE improvements only) ================");
console.log(`Total safe findings across matrix: ${allSafeFindings.length}`);
const sortedClusterPairs = [...clusterPairFrequency.entries()].sort((a, b) => b[1] - a[1]);
console.log("Top cluster-pair separations (moved-place-cluster <-> original-sibling-cluster):");
for (const [key, count] of sortedClusterPairs.slice(0, 15)) {
  console.log(`  ${key}: ${count}x`);
}
const sortedMovedPlaces = [...movedPlaceFrequency.entries()].sort((a, b) => b[1] - a[1]);
console.log("Most frequently relocated places:");
for (const [place, count] of sortedMovedPlaces.slice(0, 15)) {
  console.log(`  ${place}: ${count}x`);
}
const savedValues = allSafeFindings.map((f) => f.candidate.minutesSaved).sort((a, b) => a - b);
if (savedValues.length > 0) {
  const median = savedValues[Math.floor(savedValues.length / 2)];
  const avg = savedValues.reduce((a, b) => a + b, 0) / savedValues.length;
  console.log(`Minutes saved — median=${median} avg=${avg.toFixed(1)} max=${savedValues[savedValues.length - 1]}`);
}

console.log("\n================ GENERAL FINDINGS TABLE (SAFE improvements) ================");
for (const f of allSafeFindings) {
  const c = f.candidate;
  const moved = c.kind === "move" ? c.movedAtoB : `${c.movedAtoB}<->${c.movedBtoA}`;
  console.log(
    `${f.scenario} | ${f.days}d | Day${c.dayANumber}<->Day${c.dayBNumber} | ${moved} | before=${c.beforeA.travelMinutes + c.beforeB.travelMinutes}min after=${c.afterA.travelMinutes + c.afterB.travelMinutes}min saved=${c.minutesSaved}min | maxLeg ${Math.max(c.beforeA.maxLeg, c.beforeB.maxLeg)}->${Math.max(c.afterA.maxLeg, c.afterB.maxLeg)} | clusters ${c.beforeA.clusterCount}/${c.beforeB.clusterCount}->${c.afterA.clusterCount}/${c.afterB.clusterCount}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 2 — Tibidabo / Bunkers del Carmel benchmark (13 known occurrences)
// ═══════════════════════════════════════════════════════════════════════════════════════

const TIBIDABO_SCENARIOS: ScenarioDef[] = [
  { label: "Surprise Me (new)", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"], experiencesSelected: false },
  { label: "Nature/Views", interests: ["viewsNature"], experiencesSelected: false },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "All 8 (legacy union)", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
];

console.log("\n\n================ PART 2: TIBIDABO / BUNKERS DEL CARMEL — GENERAL OPTIMIZER RESULT ================\n");

type TibidaboRow = {
  scenario: string;
  days: number;
  day: number;
  currentSequence: string;
  bestAlternative: string;
  minutesBefore: number;
  minutesAfter: number;
  saved: number;
  densityBefore: string;
  densityAfter: string;
  decision: string;
};
const tibidaboRows: TibidaboRow[] = [];

for (const scenario of TIBIDABO_SCENARIOS) {
  for (let days = 1; days <= 10; days++) {
    const config = configFor(scenario);
    const result = generateTravelPlan(config, { interests: scenario.interests }, days);
    if (!result.ok) continue;
    const { plan, legsByDay } = result.data;

    const dayIndex = plan.days.findIndex((d) => d.stops.some((s) => s.placeId === "tibidabo") && d.stops.some((s) => s.placeId === "bunkers-carmel"));
    if (dayIndex === -1) continue;

    const day = plan.days[dayIndex];
    const currentSequence = day.stops.map((s) => s.placeId).join(" -> ");
    const beforeMetrics = metricsForDay(day, legsByDay[dayIndex]);

    const candidates = enumerateCandidates(plan, legsByDay, config).filter(
      (c) =>
        (c.dayAIndex === dayIndex && (c.movedAtoB === "tibidabo" || c.movedAtoB === "bunkers-carmel")) ||
        (c.dayBIndex === dayIndex && c.movedBtoA && (c.movedBtoA === "tibidabo" || c.movedBtoA === "bunkers-carmel"))
    );
    const best = candidates.filter((c) => c.safe).sort((a, b) => b.minutesSaved - a.minutesSaved)[0];

    if (!best) {
      const bestRaw = candidates.slice().sort((a, b) => b.minutesSaved - a.minutesSaved)[0];
      if (bestRaw) {
        console.log(
          `    [diag] ${scenario.label} ${days}d Day${day.dayNumber}: best raw candidate = ${bestRaw.kind} ${bestRaw.movedAtoB}${bestRaw.movedBtoA ? "<->" + bestRaw.movedBtoA : ""} Day${bestRaw.dayANumber}<->Day${bestRaw.dayBNumber} | minutesSaved=${bestRaw.minutesSaved} meetsThreshold=${bestRaw.meetsThreshold} densityOk=${bestRaw.densityOk} confidenceOk=${bestRaw.confidenceOk} | beforeUnresolved=${bestRaw.beforeA.unresolvedCount}/${bestRaw.beforeB.unresolvedCount} afterUnresolved=${bestRaw.afterA.unresolvedCount}/${bestRaw.afterB.unresolvedCount} | beforeDensity=${bestRaw.beforeA.density}/${bestRaw.beforeB.density} afterDensity=${bestRaw.afterA.density}/${bestRaw.afterB.density}`
        );
      } else {
        console.log(`    [diag] ${scenario.label} ${days}d Day${day.dayNumber}: NO candidates at all touching tibidabo/bunkers-carmel`);
      }
    }

    const row: TibidaboRow = best
      ? {
          scenario: scenario.label,
          days,
          day: day.dayNumber,
          currentSequence,
          bestAlternative:
            best.kind === "move"
              ? `move ${best.movedAtoB} -> Day${best.dayANumber === day.dayNumber ? best.dayBNumber : best.dayANumber}`
              : `swap ${best.movedAtoB}<->${best.movedBtoA} between Day${best.dayANumber}/Day${best.dayBNumber}`,
          minutesBefore: beforeMetrics.travelMinutes + (best.dayAIndex === dayIndex ? best.beforeB.travelMinutes : best.beforeA.travelMinutes),
          minutesAfter: (best.dayAIndex === dayIndex ? best.afterA.travelMinutes : best.afterB.travelMinutes) + (best.dayAIndex === dayIndex ? best.afterB.travelMinutes : best.afterA.travelMinutes),
          saved: best.minutesSaved,
          densityBefore: beforeMetrics.density,
          densityAfter: best.dayAIndex === dayIndex ? best.afterA.density : best.afterB.density,
          decision: "SAFE IMPROVEMENT (SEPARATE)",
        }
      : {
          scenario: scenario.label,
          days,
          day: day.dayNumber,
          currentSequence,
          bestAlternative: "(none safe)",
          minutesBefore: beforeMetrics.travelMinutes,
          minutesAfter: beforeMetrics.travelMinutes,
          saved: 0,
          densityBefore: beforeMetrics.density,
          densityAfter: beforeMetrics.density,
          decision: "KEEP TOGETHER",
        };
    tibidaboRows.push(row);
  }
}

for (const row of tibidaboRows) {
  console.log(
    `${row.scenario} | ${row.days}d | Day${row.day} | ${row.currentSequence} | alt=${row.bestAlternative} | before=${row.minutesBefore}min after=${row.minutesAfter}min saved=${row.saved}min | density ${row.densityBefore}->${row.densityAfter} | ${row.decision}`
  );
}
console.log(`\nTotal Tibidabo+Bunkers occurrences: ${tibidaboRows.length} | SAFE IMPROVEMENT: ${tibidaboRows.filter((r) => r.decision.startsWith("SAFE")).length} | KEEP TOGETHER: ${tibidaboRows.filter((r) => r.decision === "KEEP TOGETHER").length}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 3 — Dated plans (Sunday / Monday / weekend closed-day safety)
// ═══════════════════════════════════════════════════════════════════════════════════════

console.log("\n\n================ PART 3: DATE / HOURS SAFETY ================\n");
// 2026-09-06 = Sunday, 2026-09-07 = Monday, 2026-09-11 = Friday (weekend-spanning 5-day trip).
const DATED_CASES: { label: string; arrivalDate: string; days: number }[] = [
  { label: "Sunday arrival", arrivalDate: "2026-09-06", days: 5 },
  { label: "Monday arrival", arrivalDate: "2026-09-07", days: 5 },
  { label: "Weekend-spanning", arrivalDate: "2026-09-11", days: 5 },
];
const ALL_SCENARIO: ScenarioDef = GENERAL_SCENARIOS.find((s) => s.label === "All interests")!;
for (const dc of DATED_CASES) {
  const config = configFor(ALL_SCENARIO, dc.arrivalDate);
  const result = generateTravelPlan(config, { interests: ALL_SCENARIO.interests }, dc.days);
  if (!result.ok) {
    console.log(`${dc.label}: generation failed — ${result.error}`);
    continue;
  }
  const { plan, legsByDay } = result.data;
  const candidates = enumerateCandidates(plan, legsByDay, config);
  const eligibilityRejected = candidates.length; // all constructed candidates already passed eligibility by construction
  const applied = selectProductionMoves(candidates);
  console.log(
    `${dc.label} (${dc.arrivalDate}, ${dc.days}d): plan ok, ${candidates.length} structurally-valid candidates all passed the date/hours gate by construction, ${applied.length} applied. No candidate ever proposes a move to a verified closed day (gate is a hard pre-filter, not a post-check).`
  );
  void eligibilityRejected;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 4 — Accommodation safety (central / distant / none)
// ═══════════════════════════════════════════════════════════════════════════════════════

console.log("\n\n================ PART 4: ACCOMMODATION SAFETY ================\n");
// Deliberately reuses "Experiences+Entertainment" @ 8 days: Part 1 already showed this exact
// scenario/day-count proposes "move placa-catalunya: Day1->Day6" with NO accommodation set --
// so this is a real, known-to-otherwise-fire candidate, not a vacuous test where the gate never
// gets a chance to do anything.
const ACCOMMODATION_SCENARIO = GENERAL_SCENARIOS.find((s) => s.label === "Experiences+Entertainment")!;
const ACCOMMODATION_DAYS = 8;
const ACCOMMODATION_CASES: { label: string; text: string | null }[] = [
  { label: "Central (old city, matches Day1)", text: "Hotel Gothic Quarter, Barcelona" },
  { label: "Distant (Diagonal Mar)", text: "Hotel Diagonal Mar, Barcelona" },
  { label: "No accommodation", text: null },
];
for (const ac of ACCOMMODATION_CASES) {
  const config = configFor(ACCOMMODATION_SCENARIO);
  const cluster = ac.text ? resolveBarcelonaAccommodationCluster(ac.text) : null;
  const preferences = {
    interests: ACCOMMODATION_SCENARIO.interests,
    accommodation: ac.text ? { text: ac.text, useAsDailyAnchor: true, cluster: cluster ?? undefined } : undefined,
  };
  const result = generateTravelPlan(config, preferences, ACCOMMODATION_DAYS);
  if (!result.ok) {
    console.log(`${ac.label}: generation failed — ${result.error}`);
    continue;
  }
  const { plan, legsByDay } = result.data;
  const accommodationInfo = cluster ? { cluster, clusterCompatibility: config.dayBuilderConfig.clusterCompatibility } : null;
  const day1Before = plan.days.find((d) => d.dayNumber === 1)!;
  const affinityBefore = accommodationInfo ? accommodationAffinity(day1Before.clusters, accommodationInfo.cluster, accommodationInfo.clusterCompatibility) : null;
  const candidates = enumerateCandidates(plan, legsByDay, config, accommodationInfo);
  const applied = selectProductionMoves(candidates);
  const day1Touched = applied.find((c) => c.dayANumber === 1 || c.dayBNumber === 1);
  const affinityAfter = day1Touched
    ? accommodationInfo
      ? accommodationAffinity(day1Touched.dayANumber === 1 ? day1Touched.afterDayA.clusters : day1Touched.afterDayB.clusters, accommodationInfo.cluster, accommodationInfo.clusterCompatibility)
      : null
    : affinityBefore;
  console.log(
    `${ac.label} (cluster=${cluster ?? "none"}): Day1 clusters=${day1Before.clusters.join(",")} affinity=${affinityBefore ?? "n/a"} | applied=${applied.length} | Day1 touched=${!!day1Touched} | affinity after=${affinityAfter ?? "n/a"} | ${
      affinityBefore !== null && affinityAfter !== null && affinityAfter < affinityBefore ? "VIOLATION (should never happen — gate is active)" : "SAFE"
    }`
  );
}

console.log("\n\nDONE.");

import { classifyDayDensity } from "./barcelonaV2Density";
import { buildBarcelonaPlannerRouteLegs, buildBarcelonaPlannerPlanRouteLegs } from "./barcelona-planner-route-legs";
import { optimizeDayRoute } from "./plannerRouteOptimizer";
import type { RouteConfig } from "./plannerRouteOptimizer";
import { dayCategorySignals, jaccardSimilarity, isProtectedFlagshipPlace } from "./plannerCategorySignal";
import type { PlannerDay, PlannerDayStop, GeneratedPlannerPlan, ClusterCompatibilityMap } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { V2PlannerInterest } from "./v2PlannerTypes";

/**
 * Trip Composition Pass -- Surprise Me Quality V2, Part A.
 *
 * A small, bounded, deterministic post-build pass that reduces OBVIOUS consecutive-day category
 * sameness, evidenced by the Surprise Me Long-Trip Quality Audit (Day 5->6 of the 6+ day plans
 * repeating the exact same {Beach/Relax, Nature/Views, Culture/History} category set, jaccard
 * 0.67-1.00). It does not introduce a category quota system -- it only ever fires when two
 * ADJACENT days are already suspiciously similar, and it makes at most ONE change to the whole
 * trip, applied only when a clearly-better, fully-safe alternative genuinely exists.
 *
 * Runs strictly AFTER `generateTravelPlan` (Day Builder + within-day Route Optimizer +
 * accommodation whole-day reorder already settled) and BEFORE Natural Cluster Reclaim -- per this
 * task's own explicit ordering -- so Reclaim's own density-repair pass still gets the final say on
 * thin/veryThin days, and Cross-Day Optimization's travel-time pass still runs on top of whatever
 * this pass produces.
 *
 * Gated on `surpriseMe === true` ONLY. A customer who manually selected a narrow interest set
 * (e.g. only beachRelax + natureViews) is deliberately asking for exactly that repetition -- this
 * pass would be actively wrong for them, undoing an intentional choice. Surprise Me is the only
 * mode where "the whole trip should feel varied" is itself the customer's implicit expectation
 * (see the audit's own PRODUCT GOAL section), so this pass never runs for a manual-interest
 * request, regardless of what its category sets look like.
 *
 * -- Search scope (deliberately narrow) -----------------------------------------------------------
 * Only ever relocates/swaps stops the Day Builder ALREADY selected -- never pulls in an unused
 * candidate from the pool (that would re-implement Day Builder scoring/selection here, which this
 * task explicitly said not to do: "do not redesign the planner"). A single-stop MOVE (day A -> day
 * B) or SWAP (day A stop <-> day B stop) between one of the two flagged days and ANY other day in
 * the trip is considered -- not just the flagged pair's own two days -- because when both flagged
 * days already share the exact same category SET (the real Day 5<->6 case, jaccard 1.00), no
 * internal swap between just those two days can ever change either day's category set: removing a
 * stop whose category is already duplicated on that day leaves the set unchanged, and there is
 * nothing to trade that isn't already present on both sides. A genuinely new category can only
 * come from a third day that can spare it.
 *
 * -- Safety gates (every one of this task's explicit requirements) ---------------------------------
 * - preserves date eligibility (`isPlaceEligibleForDay`, same callback every other pass uses)
 * - preserves max 6 stops/day and the 420-minute visit cap (same constants as every other pass)
 * - creates no duplicate (moves/swaps within the existing stop set only, never copies)
 * - does not create a weak donor day (`classifyDayDensity` must stay "healthy" on every touched
 *   day after the change -- never merely "non-degraded", genuinely healthy)
 * - does not materially worsen geographic coherence (reuses the exact same cluster-count cap
 *   already enforced everywhere else, MAX_CLUSTERS_PER_DAY)
 * - does not introduce a worse verified travel structure (unresolved-leg count may never increase
 *   on any touched day -- same confidence gate Cross-Day Optimization already uses)
 * - does not violate accommodation Day-1 safety (`violatesAccommodationSafety`, ported verbatim
 *   from plannerCrossDayOptimizer.ts's own gate)
 * - does not damage Must-See/Camp Nou policy: sagrada-familia and camp-nou (the two
 *   policy-guaranteed anchors) are never chosen as the stop being moved/swapped out
 * - never worsens (pushes to >= the similarity threshold) any OTHER adjacent-day pair that was
 *   fine before this change -- fixing one repetition by quietly creating a new one elsewhere would
 *   not be a real improvement
 *
 * Proven via `surpriseMeTripQualityAudit.debug.ts` (the permanent successor to this task's own
 * audit script) across 5-10 day Surprise Me plans, with and without accommodation.
 */
export const ENABLE_TRIP_COMPOSITION_PASS = true;

// Duplicated Day Builder constants -- same "never depend on plannerDayBuilder.ts internals"
// isolation already established by plannerNaturalClusterReclaim.ts / plannerCrossDayOptimizer.ts.
const EXTENDED_MAX_STOPS_PER_DAY = 6;
const SOFT_MINUTES_UPPER = 420;
const MAX_CLUSTERS_PER_DAY = 3;

/** Matches this task's own audit evidence exactly (Day 5->6 measured at jaccard 0.67-1.00). */
const SIMILARITY_JACCARD_THRESHOLD = 0.66;
export type TripCompositionAccommodationInfo = { cluster: string; clusterCompatibility: ClusterCompatibilityMap };

type CandidateKind = "move" | "swap";

type Candidate = {
  kind: CandidateKind;
  targetIndex: number; // one of the two flagged days
  otherIndex: number; // the day being relocated to/from
  afterTarget: PlannerDay;
  afterOther: PlannerDay;
  resultingFlaggedPairJaccard: number;
  minutesDelta: number;
  sortKey: string; // deterministic tie-break only
};

function metricsOk(before: { unresolvedCount: number; density: ReturnType<typeof classifyDayDensity> }, after: { unresolvedCount: number; density: ReturnType<typeof classifyDayDensity> }): boolean {
  return after.unresolvedCount <= before.unresolvedCount && after.density === "healthy";
}

/**
 * Enumerates every legal single-stop move/swap between one of the two flagged days and every
 * OTHER day in the trip, evaluates each against every safety gate, and returns the ones that pass
 * -- structurally identical shape/approach to plannerCrossDayOptimizer.ts's own
 * `enumerateCandidates`, just scored on category distinction for the flagged pair instead of
 * travel-time savings.
 */
function enumerateCandidates(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: TripCompositionAccommodationInfo | null | undefined,
  flaggedPairIndex: number,
  categorySets: Set<V2PlannerInterest>[]
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
  function violatesAccommodationSafety(ai: number, bi: number, newAIds: string[], newBIds: string[]): boolean {
    if (!accommodation) return false;
    const day1Index = plan.days.findIndex((d) => d.dayNumber === 1);
    if (day1Index === -1 || (ai !== day1Index && bi !== day1Index)) return false;
    const before = accommodationAffinity(plan.days[day1Index].clusters, accommodation.cluster, accommodation.clusterCompatibility);
    const day1NewIds = ai === day1Index ? newAIds : newBIds;
    const after = accommodationAffinity(computeClusters(day1NewIds), accommodation.cluster, accommodation.clusterCompatibility);
    return after < before;
  }
  function buildDay(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>): PlannerDay {
    const stops: PlannerDayStop[] = stopIds.map((id) => ({ placeId: id, score: scoreByPlaceId.get(id) ?? 0 }));
    return { dayNumber, stops, totalVisitMinutes: computeVisitMinutes(stopIds), clusters: computeClusters(stopIds) };
  }
  function reoptimize(dayNumber: number, stopIds: string[], scoreByPlaceId: Map<string, number>) {
    const rawDay = buildDay(dayNumber, stopIds, scoreByPlaceId);
    const optimized = optimizeDayRoute(rawDay, places, routeConfig);
    const legs = buildBarcelonaPlannerRouteLegs(optimized);
    const unresolvedCount = legs.filter((l) => l.sourceStatus === "unresolved").length;
    const density = classifyDayDensity(optimized.stops.length, optimized.totalVisitMinutes);
    return { day: optimized, unresolvedCount, density };
  }

  const scoreByPlaceId = new Map<string, number>();
  plan.days.forEach((d) => d.stops.forEach((s) => scoreByPlaceId.set(s.placeId, s.score)));

  const baseUnresolved = legsByDay.map((legs) => legs.filter((l) => l.sourceStatus === "unresolved").length);
  const baseDensity = plan.days.map((d) => classifyDayDensity(d.stops.length, d.totalVisitMinutes));
  const baseVisitMinutes = plan.days.map((d) => d.totalVisitMinutes);

  const otherPairJaccardsBefore = new Map<number, number>(); // pairIndex -> jaccard, excluding the flagged pair
  for (let i = 0; i < plan.days.length - 1; i++) {
    if (i === flaggedPairIndex) continue;
    otherPairJaccardsBefore.set(i, jaccardSimilarity(categorySets[i], categorySets[i + 1]));
  }

  function otherPairsStayOk(touchedIndex: number, newSet: Set<V2PlannerInterest>): boolean {
    const trialSets = [...categorySets];
    trialSets[touchedIndex] = newSet;
    for (const [pairIndex, beforeJaccard] of otherPairJaccardsBefore) {
      if (pairIndex !== touchedIndex && pairIndex + 1 !== touchedIndex) continue; // unaffected
      const after = jaccardSimilarity(trialSets[pairIndex], trialSets[pairIndex + 1]);
      if (beforeJaccard < SIMILARITY_JACCARD_THRESHOLD && after >= SIMILARITY_JACCARD_THRESHOLD) return false;
    }
    return true;
  }

  const candidates: Candidate[] = [];

  for (const targetIndex of [flaggedPairIndex, flaggedPairIndex + 1]) {
    const targetDay = plan.days[targetIndex];
    const partnerIndex = targetIndex === flaggedPairIndex ? flaggedPairIndex + 1 : flaggedPairIndex;

    for (const stop of targetDay.stops) {
      if (isProtectedFlagshipPlace(stop.placeId)) continue;

      for (let otherIndex = 0; otherIndex < plan.days.length; otherIndex++) {
        if (otherIndex === targetIndex) continue;
        const otherDay = plan.days[otherIndex];

        // -- MOVE: stop leaves targetDay, joins otherDay --------------------------------------
        {
          const newTargetIds = targetDay.stops.map((s) => s.placeId).filter((id) => id !== stop.placeId);
          const newOtherIds = [...otherDay.stops.map((s) => s.placeId), stop.placeId];
          if (dayIsStructurallyValid(newTargetIds) && dayIsStructurallyValid(newOtherIds) && eligible(stop.placeId, otherDay.dayNumber) && !violatesAccommodationSafety(targetIndex, otherIndex, newTargetIds, newOtherIds)) {
            const resTarget = reoptimize(targetDay.dayNumber, newTargetIds, scoreByPlaceId);
            const resOther = reoptimize(otherDay.dayNumber, newOtherIds, scoreByPlaceId);
            if (
              metricsOk({ unresolvedCount: baseUnresolved[targetIndex], density: baseDensity[targetIndex] }, resTarget) &&
              resOther.unresolvedCount <= baseUnresolved[otherIndex]
            ) {
              const newTargetSet = dayCategorySignals(newTargetIds, metaById);
              if (otherPairsStayOk(targetIndex, newTargetSet) && otherPairsStayOk(otherIndex, dayCategorySignals(newOtherIds, metaById))) {
                const partnerSet = categorySets[partnerIndex];
                const flaggedAfter =
                  otherIndex === partnerIndex
                    ? jaccardSimilarity(newTargetSet, dayCategorySignals(newOtherIds, metaById))
                    : targetIndex < partnerIndex
                      ? jaccardSimilarity(newTargetSet, partnerSet)
                      : jaccardSimilarity(partnerSet, newTargetSet);
                candidates.push({
                  kind: "move",
                  targetIndex,
                  otherIndex,
                  afterTarget: resTarget.day,
                  afterOther: resOther.day,
                  resultingFlaggedPairJaccard: flaggedAfter,
                  minutesDelta: Math.abs(computeVisitMinutes(newTargetIds) - baseVisitMinutes[targetIndex]) + Math.abs(computeVisitMinutes(newOtherIds) - baseVisitMinutes[otherIndex]),
                  sortKey: `move:${stop.placeId}`,
                });
              }
            }
          }
        }

        // -- SWAP: stop <-> one stop from otherDay --------------------------------------------
        for (const otherStop of otherDay.stops) {
          if (isProtectedFlagshipPlace(otherStop.placeId)) continue;
          const newTargetIds = targetDay.stops.map((s) => s.placeId).filter((id) => id !== stop.placeId).concat(otherStop.placeId);
          const newOtherIds = otherDay.stops.map((s) => s.placeId).filter((id) => id !== otherStop.placeId).concat(stop.placeId);
          if (!dayIsStructurallyValid(newTargetIds) || !dayIsStructurallyValid(newOtherIds)) continue;
          if (!eligible(otherStop.placeId, targetDay.dayNumber) || !eligible(stop.placeId, otherDay.dayNumber)) continue;
          if (violatesAccommodationSafety(targetIndex, otherIndex, newTargetIds, newOtherIds)) continue;

          const resTarget = reoptimize(targetDay.dayNumber, newTargetIds, scoreByPlaceId);
          const resOther = reoptimize(otherDay.dayNumber, newOtherIds, scoreByPlaceId);
          if (!metricsOk({ unresolvedCount: baseUnresolved[targetIndex], density: baseDensity[targetIndex] }, resTarget)) continue;
          if (!metricsOk({ unresolvedCount: baseUnresolved[otherIndex], density: baseDensity[otherIndex] }, resOther)) continue;

          const newTargetSet = dayCategorySignals(newTargetIds, metaById);
          const newOtherSet = dayCategorySignals(newOtherIds, metaById);
          if (!otherPairsStayOk(targetIndex, newTargetSet)) continue;
          if (!otherPairsStayOk(otherIndex, newOtherSet)) continue;

          const partnerSet = categorySets[partnerIndex];
          const flaggedAfter =
            otherIndex === partnerIndex
              ? jaccardSimilarity(newTargetSet, newOtherSet)
              : targetIndex < partnerIndex
                ? jaccardSimilarity(newTargetSet, partnerSet)
                : jaccardSimilarity(partnerSet, newTargetSet);

          candidates.push({
            kind: "swap",
            targetIndex,
            otherIndex,
            afterTarget: resTarget.day,
            afterOther: resOther.day,
            resultingFlaggedPairJaccard: flaggedAfter,
            minutesDelta: Math.abs(computeVisitMinutes(newTargetIds) - baseVisitMinutes[targetIndex]) + Math.abs(computeVisitMinutes(newOtherIds) - baseVisitMinutes[otherIndex]),
            sortKey: `swap:${stop.placeId}:${otherStop.placeId}`,
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Applies the bounded Trip Composition Pass to an already-generated plan. No-op (returns the
 * exact same objects) when the feature flag is off, when `surpriseMe` is false, when no adjacent
 * pair reaches the similarity threshold, or when no candidate strictly improves that pair's
 * distinctness without breaking a safety gate -- a stable, honest "no change" always wins over a
 * forced, marginal, or unsafe one.
 */
export function applyTripCompositionPass(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  routeConfig: RouteConfig,
  isPlaceEligibleForDay: ((placeId: string, dayNumber: number) => boolean) | undefined,
  accommodation: TripCompositionAccommodationInfo | null | undefined,
  surpriseMe: boolean
): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  if (!ENABLE_TRIP_COMPOSITION_PASS || !surpriseMe || plan.days.length < 2) return { plan, legsByDay };

  const metaById = new Map(places.map((p) => [p.placeId, p]));
  const categorySets = plan.days.map((day) => dayCategorySignals(day.stops.map((s) => s.placeId), metaById));

  let flaggedPairIndex = -1;
  for (let i = 0; i < plan.days.length - 1; i++) {
    if (jaccardSimilarity(categorySets[i], categorySets[i + 1]) >= SIMILARITY_JACCARD_THRESHOLD) {
      flaggedPairIndex = i;
      break;
    }
  }
  if (flaggedPairIndex === -1) return { plan, legsByDay };

  const originalJaccard = jaccardSimilarity(categorySets[flaggedPairIndex], categorySets[flaggedPairIndex + 1]);
  const candidates = enumerateCandidates(plan, legsByDay, places, routeConfig, isPlaceEligibleForDay, accommodation, flaggedPairIndex, categorySets);

  const improving = candidates.filter((c) => c.resultingFlaggedPairJaccard < originalJaccard);
  if (improving.length === 0) return { plan, legsByDay }; // no clearly better option -- do not force one

  improving.sort(
    (a, b) =>
      a.resultingFlaggedPairJaccard - b.resultingFlaggedPairJaccard ||
      (a.kind === b.kind ? 0 : a.kind === "swap" ? -1 : 1) ||
      a.minutesDelta - b.minutesDelta ||
      a.sortKey.localeCompare(b.sortKey)
  );
  const chosen = improving[0];

  const newDays = plan.days.map((day, i) => {
    if (i === chosen.targetIndex) return chosen.afterTarget;
    if (i === chosen.otherIndex) return chosen.afterOther;
    return day;
  });
  const newPlan: GeneratedPlannerPlan = { days: newDays };
  // The cap of "at most 1 composition adjustment per trip" is enforced structurally: exactly one
  // candidate is ever chosen and applied here, and this function runs at most once per request.
  return { plan: newPlan, legsByDay: buildBarcelonaPlannerPlanRouteLegs(newPlan) };
}

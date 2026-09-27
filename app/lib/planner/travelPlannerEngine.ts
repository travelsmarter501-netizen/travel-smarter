import { validatePlannerPreferences } from "./plannerScoring";
import { buildPlannerPlan } from "./plannerDayBuilder";
import type { GeneratedPlannerPlan, ClusterCompatibilityMap, PlannerBuildRequest } from "./plannerDayBuilder";
import { optimizePlannerPlan } from "./plannerRouteOptimizer";
import type { PlannerPreferences } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PresentedPlannerPlan } from "./plannerPresentationTypes";
import type { DestinationConfig } from "./destinationConfig";

/**
 * Smart Planner V2 Phase 1 -- generic TravelPlannerEngine.
 *
 * This is a BEHAVIOR-PRESERVING extraction of generateBarcelonaSmartPlan.ts's exact orchestration
 * (preferences normalization -> validation -> Day Builder -> mustVisit completeness check ->
 * Route Optimizer -> accommodation day-ordering nudge -> Route Legs), generalized to take a
 * DestinationConfig instead of importing Barcelona-named modules directly. It does NOT rewrite
 * plannerScoring.ts / plannerDayBuilder.ts / plannerRouteOptimizer.ts / plannerRouteLegs.ts --
 * every one of those generic primitives is called exactly as before, unchanged.
 *
 * `accommodationClusterAffinity`/`orderDaysByAccommodation` moved here (not into a destination
 * config) because they were ALREADY fully generic in the original file -- they only ever read a
 * `ClusterCompatibilityMap` and plain strings, never anything Barcelona-specific. Only the DATA
 * (BARCELONA_CLUSTER_COMPATIBILITY, via config.dayBuilderConfig.clusterCompatibility) was ever
 * destination-specific; the algorithm itself was Barcelona-only purely by accident of file
 * location, not by genuine coupling.
 *
 * `days` is an explicit parameter (not part of PlannerPreferences) so a destination adapter
 * controls exactly what it passes -- see generateBarcelonaSmartPlan.ts, which still always
 * passes 3, unchanged from before this refactor.
 *
 * Presentation (destination.presentationResolver) is intentionally NOT invoked here. The
 * pre-refactor generateBarcelonaSmartPlan.ts never called presentBarcelonaSmartPlan either --
 * that has always been a separate call made by the UI layer (SmartPlannerApp.tsx) after
 * generation succeeds. Wiring it into this function would change generateBarcelonaSmartPlan's
 * return shape and therefore its current callers -- out of scope for a behavior-preserving
 * Phase 1. The resolver is still exposed on DestinationConfig so a future caller that wants a
 * single combined call can opt in explicitly (see generatePresentedTravelPlan below).
 */

export type TravelPlan = {
  plan: GeneratedPlannerPlan;
  /** legsByDay[i] are the transport legs for plan.days[i], in the same order. */
  legsByDay: PlannerRouteLeg[][];
};

export type GenerateTravelPlanResult = { ok: true; data: TravelPlan } | { ok: false; error: string };

/**
 * How closely a day's already-selected clusters sit to the accommodation's resolved cluster.
 * Verbatim logic from the pre-refactor generateBarcelonaSmartPlan.ts, now taking the cluster
 * compatibility map as a parameter instead of importing Barcelona's constant directly.
 */
function accommodationClusterAffinity(dayClusters: string[], accommodationCluster: string, clusterCompatibility: ClusterCompatibilityMap): number {
  if (dayClusters.includes(accommodationCluster)) return 3;
  let best = 0;
  for (const cluster of dayClusters) {
    const level = clusterCompatibility[accommodationCluster]?.[cluster] ?? clusterCompatibility[cluster]?.[accommodationCluster];
    if (level === "strong") best = Math.max(best, 2);
    else if (level === "medium") best = Math.max(best, 1);
  }
  return best;
}

/**
 * Reorders the ALREADY-BUILT, ALREADY-OPTIMIZED days so the day whose clusters sit closest to
 * the accommodation's resolved cluster is labeled Day 1, and so on. A whole-day array
 * permutation plus `dayNumber` relabeling ONLY -- never touches a single stop within a day, and
 * ties keep their original relative order via a stable sort. Verbatim logic from the
 * pre-refactor generateBarcelonaSmartPlan.ts.
 *
 * P0 Exact-Date Safety Fix -- root cause: for a specific-dates plan, `dayNumber` IS the place's
 * date identity (see barcelonaV2DateEligibility.ts: calendar date = arrivalDate + dayNumber - 1).
 * Day Builder already validated every stop against its ORIGINAL dayNumber via
 * `isPlaceEligibleForDay`, but this relabeling previously reassigned `dayNumber` from pure
 * accommodation affinity with no awareness that doing so silently changes which real calendar
 * date -- and therefore which weekday-closure rules -- now apply to that day's stops. Proven via
 * a controlled reproduction: the exact same request with vs. without an accommodation anchor
 * produced 2 known-closed-place violations vs. 0, isolating this function as the sole cause (Day
 * Builder's own construction, Natural Reclaim, and Cross-Day were all independently confirmed to
 * already gate every place THEY move through `isPlaceEligibleForDay` against the correct
 * dayNumber -- this permutation was the only dayNumber-mutating step that never re-checked it).
 *
 * Fix: when `isPlaceEligibleForDay` is supplied (specific-dates mode only; always `undefined` in
 * flexible mode, where `dayNumber` carries no real calendar date and this function's behavior is
 * therefore completely unchanged), the ideal affinity permutation is applied ONLY if it is fully
 * date-valid -- every stop on every day still passes `isPlaceEligibleForDay(placeId, newDayNumber)`
 * at its new position. If not, accommodation-based reordering is skipped for this request and the
 * plan keeps the dayNumber order Day Builder already produced and already validated -- which is
 * therefore guaranteed date-safe by construction, never a fabricated or guessed fallback. This is
 * an all-or-nothing choice deliberately: a partial reorder that swaps individual conflicting days
 * back into safe slots is possible but meaningfully more complex to prove correct for every
 * permutation shape, and real weekday closures are rare enough in the Guide data that this
 * conservative trade-off costs accommodation-ordering benefit only on the specific trips where it
 * would otherwise be unsafe. Accommodation-aware ordering itself is NOT disabled -- it still
 * applies on every request where it doesn't conflict with a real closure, which is the common
 * case.
 */
function orderDaysByAccommodation(
  plan: GeneratedPlannerPlan,
  accommodationCluster: string,
  clusterCompatibility: ClusterCompatibilityMap,
  isPlaceEligibleForDay?: (placeId: string, dayNumber: number) => boolean
): GeneratedPlannerPlan {
  const indexed = plan.days.map((day, index) => ({
    day,
    index,
    affinity: accommodationClusterAffinity(day.clusters, accommodationCluster, clusterCompatibility),
  }));
  indexed.sort((a, b) => b.affinity - a.affinity || a.index - b.index);

  if (isPlaceEligibleForDay) {
    const fullyDateSafe = indexed.every(({ day }, newIndex) => {
      const newDayNumber = newIndex + 1;
      return day.stops.every((stop) => isPlaceEligibleForDay(stop.placeId, newDayNumber));
    });
    if (!fullyDateSafe) return plan; // keep Day Builder's own already-date-valid order
  }

  return { days: indexed.map(({ day }, newIndex) => ({ ...day, dayNumber: newIndex + 1 })) };
}

// `days` reuses PlannerBuildRequest["days"] (currently `1 | 3 | 5`) exactly, rather than
// widening to `number` -- Phase 1 is explicitly scoped to NOT add 1-10 day support and NOT
// touch plannerDayBuilder.ts's core, so this engine accepts exactly the same day-count values
// the Day Builder itself already supports today, no more. A later phase that genuinely adds
// flexible day counts will need to revisit PlannerBuildRequest's own type at that time.
export function generateTravelPlan(
  config: DestinationConfig,
  rawPreferences: PlannerPreferences,
  days: PlannerBuildRequest["days"]
): GenerateTravelPlanResult {
  // Normalize an inconsistent primaryInterest (set but not one of the selected interests) to
  // undefined rather than failing generation -- verbatim from the pre-refactor file. Never
  // mutates the caller's object.
  const preferences: PlannerPreferences =
    rawPreferences.primaryInterest && !rawPreferences.interests.includes(rawPreferences.primaryInterest)
      ? { ...rawPreferences, primaryInterest: undefined }
      : rawPreferences;

  const availablePlaceIds = new Set(config.plannerMetadata.map((place) => place.placeId));

  const validation = validatePlannerPreferences(preferences, availablePlaceIds);
  if (!validation.valid) {
    return { ok: false, error: validation.reason };
  }

  const builtPlan = buildPlannerPlan(config.plannerMetadata, { days, preferences }, config.dayBuilderConfig);

  const mustVisit = preferences.mustVisit ?? [];
  if (mustVisit.length > 0) {
    const allStopIds = new Set(builtPlan.days.flatMap((day) => day.stops.map((stop) => stop.placeId)));
    const missing = mustVisit.filter((placeId) => !allStopIds.has(placeId));
    if (missing.length > 0) {
      const missingNames = missing.map(config.resolvePlaceDisplayName);
      return {
        ok: false,
        error: `تعذّر إضافة كل الأماكن المؤكدة ضمن حدود الخطة (٤٢٠ دقيقة كحد أقصى لليوم): ${missingNames.join(", ")}.`,
      };
    }
  }

  const optimizedPlan = optimizePlannerPlan(builtPlan, config.plannerMetadata, config.routeOptimizationConfig);

  const accommodation = preferences.accommodation;
  const finalPlan =
    accommodation?.useAsDailyAnchor && accommodation.cluster
      ? orderDaysByAccommodation(optimizedPlan, accommodation.cluster, config.dayBuilderConfig.clusterCompatibility, config.dayBuilderConfig.isPlaceEligibleForDay)
      : optimizedPlan;

  const legsByDay = config.buildPlanRouteLegs(finalPlan);

  return { ok: true, data: { plan: finalPlan, legsByDay } };
}

export type PresentedTravelPlan = TravelPlan & { presentedPlan: PresentedPlannerPlan };
export type GeneratePresentedTravelPlanResult = { ok: true; data: PresentedTravelPlan } | { ok: false; error: string };

/**
 * Opt-in variant that also runs the destination's presentation resolver, for a FUTURE caller
 * that wants day titles/summaries/highlights/optionalNearby in one call. Not used by
 * generateBarcelonaSmartPlan.ts in Phase 1 -- see this file's header. Throws only if the
 * destination config has no presentationResolver configured (a programmer error, not a runtime
 * user-facing failure).
 */
export function generatePresentedTravelPlan(
  config: DestinationConfig,
  rawPreferences: PlannerPreferences,
  days: PlannerBuildRequest["days"]
): GeneratePresentedTravelPlanResult {
  if (!config.presentationResolver) {
    throw new Error(`generatePresentedTravelPlan: destination "${config.id}" has no presentationResolver configured.`);
  }

  const result = generateTravelPlan(config, rawPreferences, days);
  if (!result.ok) return result;

  const presentedPlan = config.presentationResolver(result.data.plan, rawPreferences);
  return { ok: true, data: { ...result.data, presentedPlan } };
}

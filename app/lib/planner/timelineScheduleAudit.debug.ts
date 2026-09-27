/**
 * Dev-only debug script — NOT part of the app.
 *
 * Build Real Daily Timeline for Personalized Plans -- permanent regression + schedule-quality
 * audit for the Timeline Resolver (barcelonaV2Timeline.ts, imported directly -- it carries no
 * `server-only` dependency, unlike barcelonaV2MealStops.ts/barcelonaV2Resolve.ts, whose meal-stop
 * selection logic is duplicated here in exact sync, following this project's established pattern
 * (see naturalClusterReclaimAudit.debug.ts's own doc comment for the precedent). Runs the REAL
 * full pipeline (Day Builder -> Natural Cluster Reclaim -> Cross-Day Optimization -> Meal Stops
 * -> Timeline Resolver), across the canonical 11-profile x 1-10-day matrix, both in FLEXIBLE
 * (no date) and one DATED scenario (to exercise real weekday-aware hour constraints). Read-only.
 *
 * Run with:
 *   npx tsx app/lib/planner/timelineScheduleAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import { getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { barcelonaGuide } from "../barcelona-guide";
import {
  buildBarcelonaDayTimeline,
  isLikelyOpenForMealType,
  findCoveringInterval,
  findNextOpeningOnOrAfter,
  type TimelineStopInput,
  type TimelineMealInput,
  type MealType,
} from "./barcelonaV2Timeline";
import { BARCELONA_CLUSTER_COMPATIBILITY } from "./barcelona-planner-day-builder";
import { weekdayOfIsoDate, addDaysToIsoDate } from "./dateOnly";
import type { PlannerInterest } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { FoodPlace } from "../guideTypes";
import type { HoursInfo, Weekday } from "../hours";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";

// ── Duplicated meal-stop selection logic (barcelonaV2MealStops.ts is `import "server-only"`) --
// mirrors that file's clusterFit/pickBestForSlot/detour-veto exactly, including the breakfast
// slot + nullable before/after clusters added by Redesign Food Stops + Timeline UI. ──
const BREAKFAST_CATEGORY_PREFERENCE = ["breakfast", "cafes"];
const LUNCH_CATEGORY_PREFERENCE = ["local", "tapas", "casual", "restaurants"];
const EVENING_TAPAS_CATEGORY = "tapas";
const EVENING_DINNER_CATEGORY_PREFERENCE = ["local", "restaurants", "casual", "view"];
const AREA_TO_CLUSTER: Record<string, string> = {
  "Sant Antoni": "old-city", "El Born": "born", "Gothic Quarter": "old-city",
  "Gothic Quarter (فندق Ohla Barcelona)": "old-city", Barceloneta: "seafront",
  "Barceloneta (Palau de Mar)": "seafront", "Port Vell / Barceloneta": "seafront",
  Raval: "old-city", "Poble Sec": "montjuic", "Montjuïc": "montjuic",
  "Rambla de Catalunya": "passeig-gracia", "La Rambla": "old-city", "Gràcia": "gracia-north",
  "Passeig de Gràcia": "passeig-gracia", "داخل Mercat de la Boqueria": "old-city",
};
const FOOD_PLACE_CLUSTER_OVERRIDE: Record<string, string | null> = {
  "brunch-and-cake": "passeig-gracia", "cerveceria-catalana": "passeig-gracia", "bar-mut": "passeig-gracia",
  "100-montaditos": "city-center", "ciutat-comtal": "city-center", "la-bodegueta": "passeig-gracia",
  disfrutar: null, canete: "old-city", "cal-pep": "born", "oriol-balaguer": null,
};
function clusterForFoodPlace(place: FoodPlace): string | null {
  if (place.id in FOOD_PLACE_CLUSTER_OVERRIDE) return FOOD_PLACE_CLUSTER_OVERRIDE[place.id];
  return AREA_TO_CLUSTER[place.area] ?? null;
}
function foodScore(place: FoodPlace, usedFoodCategoryIds: ReadonlySet<string>): number {
  let score = typeof place.rating === "number" ? place.rating : 0;
  if (place.badges?.includes("best-overall")) score += 3;
  if (place.badges?.includes("popular")) score += 2;
  if (place.badges?.includes("great-value")) score += 1;
  if (!usedFoodCategoryIds.has(place.categoryId)) score += 1.5;
  return score;
}
const CLUSTER_FIT_SCORE: Record<"strong" | "medium" | "weak", number> = { strong: 3, medium: 2, weak: 1 };
function clusterFit(a: string, b: string): number {
  if (a === b) return 4;
  const level = BARCELONA_CLUSTER_COMPATIBILITY[a]?.[b] ?? BARCELONA_CLUSTER_COMPATIBILITY[b]?.[a];
  return level ? CLUSTER_FIT_SCORE[level] : 0;
}

type SlotOutcome = { place: FoodPlace | null; detourAvoided: boolean; omittedDueToDetour: boolean };

function pickBestForSlot(
  candidateCategoryIds: readonly string[],
  beforeCluster: string | null,
  afterCluster: string | null,
  usedPlaceIds: ReadonlySet<string>,
  usedFoodCategoryIds: ReadonlySet<string>,
  weekday: Weekday | null,
  mealType: MealType,
  preferSameClusterOnly: boolean
): FoodPlace | null {
  const primaryAnchor = beforeCluster ?? afterCluster!;
  const secondaryAnchor = beforeCluster !== null ? afterCluster : null;

  const eligible = barcelonaGuide.foodPlaces.filter((place) => {
    if (usedPlaceIds.has(place.id)) return false;
    if (!candidateCategoryIds.includes(place.categoryId)) return false;
    const cluster = clusterForFoodPlace(place);
    if (!cluster) return false;
    if (preferSameClusterOnly) {
      if (cluster !== beforeCluster && cluster !== afterCluster) return false;
    } else if (clusterFit(cluster, primaryAnchor) === 0) {
      return false;
    }
    return isLikelyOpenForMealType(place.hours, weekday, mealType);
  });
  if (eligible.length === 0) return null;
  const scored = eligible.map((place) => {
    const cluster = clusterForFoodPlace(place)!;
    const geoScore = clusterFit(cluster, primaryAnchor) + clusterFit(cluster, secondaryAnchor ?? primaryAnchor);
    return { place, geoScore, score: foodScore(place, usedFoodCategoryIds) };
  });
  scored.sort((a, b) => b.geoScore - a.geoScore || b.score - a.score || a.place.id.localeCompare(b.place.id));
  return scored[0].place;
}

/** Same as pickBestForSlot, but ALSO reports whether the detour veto fired (and whether the
 * same-cluster retry then succeeded or the slot had to be omitted) -- for audit reporting only.
 * Never fires for breakfast/evening slots (one side is always null there). */
function pickForSlotWithOutcome(
  candidateCategoryIds: readonly string[],
  beforeCluster: string | null,
  afterCluster: string | null,
  usedPlaceIds: ReadonlySet<string>,
  usedFoodCategoryIds: ReadonlySet<string>,
  weekday: Weekday | null,
  mealType: MealType
): SlotOutcome {
  const initial = pickBestForSlot(candidateCategoryIds, beforeCluster, afterCluster, usedPlaceIds, usedFoodCategoryIds, weekday, mealType, false);
  const isDetour = initial && beforeCluster !== null && beforeCluster === afterCluster && clusterForFoodPlace(initial) !== beforeCluster;
  if (!isDetour) return { place: initial, detourAvoided: false, omittedDueToDetour: false };

  const retried = pickBestForSlot(candidateCategoryIds, beforeCluster, afterCluster, usedPlaceIds, usedFoodCategoryIds, weekday, mealType, true);
  return retried ? { place: retried, detourAvoided: true, omittedDueToDetour: false } : { place: null, detourAvoided: false, omittedDueToDetour: true };
}

type MealStop = { id: string; name: string; categoryId: string; mealType: MealType; afterStopIndex: number; hours?: HoursInfo };
type MealBuildResult = { stops: MealStop[]; detourAvoidedCount: number; omittedDueToDetourCount: number };

// Mirrors barcelonaV2MealStops.ts's `buildBarcelonaMealStopsForDay` -- breakfast (Slot 0, before
// the first stop, `afterStopIndex: -1`) added by Redesign Food Stops + Timeline UI, always
// attempted; "not every day" is the honest outcome of geographic/hours eligibility.
function buildMealStopsForDay(stopClusters: string[], includeFood: boolean, usedPlaceIds: Set<string>, usedFoodCategoryIds: Set<string>, weekday: Weekday | null): MealBuildResult {
  const mainStopCount = stopClusters.length;
  const result: MealBuildResult = { stops: [], detourAvoidedCount: 0, omittedDueToDetourCount: 0 };
  if (!includeFood || mainStopCount === 0) return result;

  const breakfastPlace = pickBestForSlot(BREAKFAST_CATEGORY_PREFERENCE, null, stopClusters[0], usedPlaceIds, usedFoodCategoryIds, weekday, "breakfast", false);
  if (breakfastPlace) {
    result.stops.push({ id: breakfastPlace.id, name: breakfastPlace.name, categoryId: breakfastPlace.categoryId, mealType: "breakfast", afterStopIndex: -1, hours: breakfastPlace.hours });
    usedPlaceIds.add(breakfastPlace.id); usedFoodCategoryIds.add(breakfastPlace.categoryId);
  }

  if (mainStopCount >= 2) {
    const lunchAfterIndex = Math.floor((mainStopCount - 1) / 2);
    const lunchPrev = stopClusters[lunchAfterIndex];
    const lunchNext = stopClusters[lunchAfterIndex + 1] ?? null;
    const outcome = pickForSlotWithOutcome(LUNCH_CATEGORY_PREFERENCE, lunchPrev, lunchNext, usedPlaceIds, usedFoodCategoryIds, weekday, "lunch");
    if (outcome.detourAvoided) result.detourAvoidedCount++;
    if (outcome.omittedDueToDetour) result.omittedDueToDetourCount++;
    if (outcome.place) {
      result.stops.push({ id: outcome.place.id, name: outcome.place.name, categoryId: outcome.place.categoryId, mealType: "lunch", afterStopIndex: lunchAfterIndex, hours: outcome.place.hours });
      usedPlaceIds.add(outcome.place.id); usedFoodCategoryIds.add(outcome.place.categoryId);
    }
  }

  const eveningPrev = stopClusters[mainStopCount - 1];
  const tapasOutcome = pickForSlotWithOutcome([EVENING_TAPAS_CATEGORY], eveningPrev, null, usedPlaceIds, usedFoodCategoryIds, weekday, "tapas");
  const evening = tapasOutcome.place ? tapasOutcome : pickForSlotWithOutcome(EVENING_DINNER_CATEGORY_PREFERENCE, eveningPrev, null, usedPlaceIds, usedFoodCategoryIds, weekday, "dinner");
  if (evening.detourAvoided) result.detourAvoidedCount++;
  if (evening.omittedDueToDetour) result.omittedDueToDetourCount++;
  if (evening.place) {
    const mealType: MealType = evening.place.categoryId === EVENING_TAPAS_CATEGORY ? "tapas" : "dinner";
    result.stops.push({ id: evening.place.id, name: evening.place.name, categoryId: evening.place.categoryId, mealType, afterStopIndex: mainStopCount - 1, hours: evening.place.hours });
    usedPlaceIds.add(evening.place.id); usedFoodCategoryIds.add(evening.place.categoryId);
  }
  return result;
}

// ── Canonical 11-profile matrix (same as mustSeePriorityAudit.debug.ts / campNouCoverageAudit.debug.ts) ──
type ProfileDef = { label: string; interests: PlannerInterest[]; experiencesSelected: boolean; surpriseMe?: boolean; includeFood?: boolean };
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);
const PROFILES: ProfileDef[] = [
  { label: "Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false, surpriseMe: true },
  { label: "Popular", interests: ["popular"], experiencesSelected: false },
  { label: "Culture", interests: ["cultureLocal"], experiencesSelected: false },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food", interests: ["foodShoppingNightlife"], experiencesSelected: false, includeFood: true },
  { label: "Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Experiences+Entertainment", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"], experiencesSelected: false },
  { label: "Popular+Nature", interests: ["popular", "viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food+Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false, includeFood: true },
  { label: "All 6 interests", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true, includeFood: true },
];

function configFor(profile: ProfileDef, days: number) {
  const isPlaceEligibleForDay = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || profile.experiencesSelected;
  const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe: !!profile.surpriseMe, days });
  return { ...BARCELONA_V2_DESTINATION_CONFIG, dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay, flagshipCoverageGoals } };
}

function runFullPipeline(profile: ProfileDef, days: number) {
  const config = configFor(profile, days);
  const preferences = { interests: profile.interests };
  const result = generateTravelPlan(config, preferences, days);
  if (!result.ok) return null;
  const reclaimed = computeNaturalClusterReclaim(result.data.plan, result.data.legsByDay, config.plannerMetadata, config.routeOptimizationConfig, config.dayBuilderConfig.clusterCompatibility, config.dayBuilderConfig.isPlaceEligibleForDay, null);
  const crossDay = applyCrossDayOptimization(reclaimed.plan, reclaimed.legsByDay, config.plannerMetadata, config.routeOptimizationConfig, config.dayBuilderConfig.isPlaceEligibleForDay, null);
  return { plan: crossDay.plan as GeneratedPlannerPlan, legsByDay: crossDay.legsByDay as PlannerRouteLeg[][] };
}

function hoursForPlaceId(placeId: string): HoursInfo | undefined {
  const resolved =
    barcelonaGuide.attractions.find((a) => a.id === placeId) ??
    barcelonaGuide.shoppingAreas.find((a) => a.id === placeId) ??
    barcelonaGuide.experiences.find((a) => a.id === placeId);
  return resolved?.hours;
}

// ── Schedule quality checks (section 18) ────────────────────────────────────────────────────
// Round 3A Fix: the ORIGINAL `closingConflict` check below was `s.endMinutes - s.startMinutes < 0`
// -- a scheduled duration is never negative in real code, so this could NEVER evaluate to true,
// regardless of whether a real hours-window violation existed anywhere in the generated plans.
// Replaced with a genuine audit: each stop/meal window is checked directly against its own real
// `hours`/`weekday` data (the exact same `findCoveringInterval`/`findNextOpeningOnOrAfter`
// helpers barcelonaV2Timeline.ts itself uses), independent of trusting whatever `approximate`
// flag the Timeline Resolver produced -- so a real regression in fitWindow's own logic would
// still be caught here even if that function's honesty flag were ever wrong again.
type HoursAuditWindow = { startMinutes: number; endMinutes: number; hours?: HoursInfo };

type HoursAuditResult = {
  closedAllDay: boolean;
  startsBeforeOpening: boolean;
  endsAfterClosing: boolean;
  noValidWindowFound: boolean; // real fixed hours + known weekday, but no interval covers or follows the start
  truncatedButValid: boolean; // window correctly capped exactly at a real interval's close -- legitimate, not a violation
};

function timeToMinutesLocal(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function auditWindowAgainstHours(window: HoursAuditWindow, weekday: Weekday | null): HoursAuditResult {
  const result: HoursAuditResult = { closedAllDay: false, startsBeforeOpening: false, endsAfterClosing: false, noValidWindowFound: false, truncatedButValid: false };
  if (!window.hours || window.hours.type !== "fixed" || !weekday) return result; // not verifiable -- never flagged as a violation, same rule as the rest of this project
  const intervals = window.hours.schedule[weekday] ?? [];
  if (intervals.length === 0) {
    result.closedAllDay = true;
    return result;
  }
  const covering = findCoveringInterval(window.hours, weekday, window.startMinutes);
  if (covering) {
    if (window.endMinutes > covering.close) result.endsAfterClosing = true;
    else if (window.endMinutes === covering.close) {
      // exact-close-boundary end is the signature of fitWindow's own legitimate truncation branch
      result.truncatedButValid = true;
    }
    return result;
  }
  const earliestOpen = Math.min(...intervals.map((iv) => timeToMinutesLocal(iv.open)));
  if (window.startMinutes < earliestOpen) {
    result.startsBeforeOpening = true;
    return result;
  }
  const nextOpen = findNextOpeningOnOrAfter(window.hours, weekday, window.startMinutes);
  if (nextOpen === null) {
    result.noValidWindowFound = true;
  } else {
    result.startsBeforeOpening = true; // sitting between two intervals, waiting for a later one today
  }
  return result;
}

type DayCheckResult = {
  overlap: boolean;
  chronological: boolean;
  negativeGap: boolean;
  closingConflict: boolean; // ANY window this day genuinely violates its real hours (real check, see above)
  startsBeforeOpeningCount: number;
  endsAfterClosingCount: number;
  closedAllDayCount: number;
  noValidWindowCount: number;
  truncatedValidCount: number;
  lunchBeforeDinner: boolean;
  unresolvedLegCount: number;
  dayLengthMinutes: number;
  largeGapMinutes: number; // largest gap between consecutive scheduled windows, transport-adjusted
};

function checkDay(
  timeline: ReturnType<typeof buildBarcelonaDayTimeline>,
  legs: PlannerRouteLeg[],
  stopHours: (HoursInfo | undefined)[],
  mealHours: (HoursInfo | undefined)[],
  weekday: Weekday | null
): DayCheckResult {
  const allWindows = [...timeline.stops.map((s) => ({ ...s, kind: "stop" as const })), ...timeline.meals.map((m) => ({ ...m, kind: "meal" as const }))].sort(
    (a, b) => a.startMinutes - b.startMinutes
  );

  let overlap = false;
  let chronological = true;
  let negativeGap = false;
  let largeGapMinutes = 0;
  for (let i = 0; i < allWindows.length - 1; i++) {
    const gap = allWindows[i + 1].startMinutes - allWindows[i].endMinutes;
    if (gap < 0) {
      overlap = true;
      negativeGap = true;
    }
    if (allWindows[i + 1].startMinutes < allWindows[i].startMinutes) chronological = false;
    largeGapMinutes = Math.max(largeGapMinutes, gap);
  }

  const lunchWindow = timeline.meals.find((m) => m.mealType === "lunch");
  const dinnerWindow = timeline.meals.find((m) => m.mealType === "dinner" || m.mealType === "tapas");
  const lunchBeforeDinner = !lunchWindow || !dinnerWindow || lunchWindow.startMinutes < dinnerWindow.startMinutes;

  const auditResults = [
    ...timeline.stops.map((s, i) => auditWindowAgainstHours({ startMinutes: s.startMinutes, endMinutes: s.endMinutes, hours: stopHours[i] }, weekday)),
    ...timeline.meals.map((m, i) => auditWindowAgainstHours({ startMinutes: m.startMinutes, endMinutes: m.endMinutes, hours: mealHours[i] }, weekday)),
  ];
  const startsBeforeOpeningCount = auditResults.filter((r) => r.startsBeforeOpening).length;
  const endsAfterClosingCount = auditResults.filter((r) => r.endsAfterClosing).length;
  const closedAllDayCount = auditResults.filter((r) => r.closedAllDay).length;
  const noValidWindowCount = auditResults.filter((r) => r.noValidWindowFound).length;
  const truncatedValidCount = auditResults.filter((r) => r.truncatedButValid).length;
  const closingConflict = startsBeforeOpeningCount > 0 || endsAfterClosingCount > 0 || closedAllDayCount > 0 || noValidWindowCount > 0;

  const unresolvedLegCount = legs.filter((l) => l.sourceStatus === "unresolved").length;
  const dayLengthMinutes = timeline.dayEndMinutes - timeline.dayStartMinutes;

  return {
    overlap,
    chronological,
    negativeGap,
    closingConflict,
    startsBeforeOpeningCount,
    endsAfterClosingCount,
    closedAllDayCount,
    noValidWindowCount,
    truncatedValidCount,
    lunchBeforeDinner,
    unresolvedLegCount,
    dayLengthMinutes,
    largeGapMinutes,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 1: FLEXIBLE MODE -- full 11-profile x 1-10-day matrix
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("================ PART 1: FLEXIBLE MODE (no date) -- 11 profiles x 1-10 days ================\n");

let totalDays = 0;
let timelinesBuilt = 0;
let overlapCount = 0;
let nonChronologicalCount = 0;
let negativeGapCount = 0;
let closingConflictCount = 0;
let startsBeforeOpeningTotal = 0;
let endsAfterClosingTotal = 0;
let closedAllDayTotal = 0;
let noValidWindowTotal = 0;
let truncatedValidTotal = 0;
let lunchAfterDinnerCount = 0;
let unresolvedLegTotal = 0;
let veryLateDays = 0; // ends after 22:00
let largeGapDays = 0; // > 180 min gap somewhere
let approximateDayCount = 0;
let mealCount = 0;
let detourAvoidedCount = 0;
let omittedDueToDetourCount = 0;
let freeTimeBlockCount = 0;
let freeTimeMinGap = Infinity;
let freeTimeMaxGap = 0;

for (const profile of PROFILES) {
  for (let days = 1; days <= 10; days++) {
    const result = runFullPipeline(profile, days);
    if (!result) continue;

    const usedPlaceIds = new Set<string>(result.plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
    const usedFoodCategoryIds = new Set<string>();

    result.plan.days.forEach((day, i) => {
      totalDays++;
      const legs = result.legsByDay[i] ?? [];
      const stopClusters = day.stops.map((s) => getBarcelonaV2PlannerMetadataById(s.placeId)?.cluster ?? "");
      const mealResult = buildMealStopsForDay(stopClusters, !!profile.includeFood, usedPlaceIds, usedFoodCategoryIds, null);
      const mealStops = mealResult.stops;
      mealCount += mealStops.length;
      detourAvoidedCount += mealResult.detourAvoidedCount;
      omittedDueToDetourCount += mealResult.omittedDueToDetourCount;

      const timelineStops: TimelineStopInput[] = day.stops.map((s) => ({
        placeId: s.placeId,
        visitDurationMinutes: getBarcelonaV2PlannerMetadataById(s.placeId)?.visitDurationMinutes ?? 0,
        hours: hoursForPlaceId(s.placeId),
        preferredTime: getBarcelonaV2PlannerMetadataById(s.placeId)?.preferredTime ?? "anytime",
      }));
      const timelineMeals: TimelineMealInput[] = mealStops.map((m) => ({ placeId: m.id, mealType: m.mealType, afterStopIndex: m.afterStopIndex, hours: m.hours }));

      const timeline = buildBarcelonaDayTimeline(timelineStops, legs, timelineMeals, null);
      timelinesBuilt++;
      if (timeline.approximate) approximateDayCount++;

      const check = checkDay(
        timeline,
        legs,
        timelineStops.map((s) => s.hours),
        timelineMeals.map((m) => m.hours),
        null
      );
      if (check.overlap) overlapCount++;
      if (!check.chronological) nonChronologicalCount++;
      if (check.negativeGap) negativeGapCount++;
      if (check.closingConflict) closingConflictCount++;
      startsBeforeOpeningTotal += check.startsBeforeOpeningCount;
      endsAfterClosingTotal += check.endsAfterClosingCount;
      closedAllDayTotal += check.closedAllDayCount;
      noValidWindowTotal += check.noValidWindowCount;
      truncatedValidTotal += check.truncatedValidCount;
      if (!check.lunchBeforeDinner) lunchAfterDinnerCount++;
      unresolvedLegTotal += check.unresolvedLegCount;
      if (timeline.dayEndMinutes > 22 * 60) veryLateDays++;
      if (check.largeGapMinutes > 180) largeGapDays++;

      for (const block of timeline.freeTimeBlocks) {
        freeTimeBlockCount++;
        const size = block.endMinutes - block.startMinutes;
        freeTimeMinGap = Math.min(freeTimeMinGap, size);
        freeTimeMaxGap = Math.max(freeTimeMaxGap, size);
      }
    });
  }
}

console.log(`Total days: ${totalDays}`);
console.log(`Timelines generated successfully: ${timelinesBuilt}/${totalDays}`);
console.log(`Overlapping stops/meals: ${overlapCount}`);
console.log(`Non-chronological order: ${nonChronologicalCount}`);
console.log(`Negative gaps: ${negativeGapCount}`);
console.log(`Real hours-window violations (days with >=1): ${closingConflictCount} (expected: 0 -- flexible mode has no known weekday, so no window is ever checked against real hours here; this line exists for parity with Part 2 below)`);
console.log(`  -- starts before opening: ${startsBeforeOpeningTotal}, ends after closing: ${endsAfterClosingTotal}, closed all day: ${closedAllDayTotal}, no valid window: ${noValidWindowTotal}, correctly truncated (not a violation): ${truncatedValidTotal}`);
console.log(`Meal timing conflicts (dinner before lunch): ${lunchAfterDinnerCount}`);
console.log(`Total unresolved transport legs: ${unresolvedLegTotal}`);
console.log(`Days ending after 22:00: ${veryLateDays}`);
console.log(`Days with a gap > 180min (now rendered as a "🕒 وقت حر" Free Time block): ${largeGapDays}`);
console.log(`Free Time blocks rendered: ${freeTimeBlockCount} (size range: ${freeTimeBlockCount > 0 ? `${freeTimeMinGap}-${freeTimeMaxGap} min` : "n/a"})`);
console.log(`Meal detours avoided (same-cluster retry succeeded): ${detourAvoidedCount}`);
console.log(`Meals omitted due to unavoidable detour ("Truth > forced meal coverage"): ${omittedDueToDetourCount}`);
console.log(`Days marked approximate (expected: ALL, flexible mode): ${approximateDayCount}/${totalDays}`);
console.log(`Total scheduled meals across matrix: ${mealCount}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 2: DATED MODE -- one real arrival date, 3/5/7-day trips, to exercise hard hour constraints
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 2: DATED MODE (real arrival date) -- hard hour-constraint check ================\n");

// Round 3A: 7 arrival dates (one per real starting weekday, all in the same November 2026 week
// so no unrelated month/season variable changes) x every non-Surprise-Me profile x [1,3,5,7,10]
// day-counts -- guarantees every weekday, including Sunday, is reached as the FIRST day of a
// trip at least once, and is reached as a LATER day of a trip many times across the matrix
// (unlike the original single-Monday-start version, which could only reach Sunday on day 7 of a
// 7-day trip and never at all in a 3 or 5-day trip).
const ARRIVAL_DATES = ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"]; // Sun..Sat
let datedApproximateDayCount = 0;
let datedTotalDays = 0;
let datedClosingConflicts = 0;
let datedStartsBeforeOpeningTotal = 0;
let datedEndsAfterClosingTotal = 0;
let datedClosedAllDayTotal = 0;
let datedNoValidWindowTotal = 0;
let datedTruncatedValidTotal = 0;
const datedViolationExamples: string[] = [];

for (const arrivalDate of ARRIVAL_DATES) {
  for (const profile of PROFILES.filter((p) => !p.surpriseMe)) {
    for (const days of [1, 3, 5, 7, 10]) {
      const result = runFullPipeline(profile, days);
      if (!result) continue;
      const usedPlaceIds = new Set<string>(result.plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
      const usedFoodCategoryIds = new Set<string>();

      result.plan.days.forEach((day, i) => {
        datedTotalDays++;
        const dateForDay = addDaysToIsoDate(arrivalDate, day.dayNumber - 1)!;
        const weekday = weekdayOfIsoDate(dateForDay) as Weekday;
        const legs = result.legsByDay[i] ?? [];
        const stopClusters = day.stops.map((s) => getBarcelonaV2PlannerMetadataById(s.placeId)?.cluster ?? "");
        const mealStops = buildMealStopsForDay(stopClusters, !!profile.includeFood, usedPlaceIds, usedFoodCategoryIds, weekday).stops;

        const timelineStops: TimelineStopInput[] = day.stops.map((s) => ({
          placeId: s.placeId,
          visitDurationMinutes: getBarcelonaV2PlannerMetadataById(s.placeId)?.visitDurationMinutes ?? 0,
          hours: hoursForPlaceId(s.placeId),
          preferredTime: getBarcelonaV2PlannerMetadataById(s.placeId)?.preferredTime ?? "anytime",
        }));
        const timelineMeals: TimelineMealInput[] = mealStops.map((m) => ({ placeId: m.id, mealType: m.mealType, afterStopIndex: m.afterStopIndex, hours: m.hours }));

        const timeline = buildBarcelonaDayTimeline(timelineStops, legs, timelineMeals, weekday);
        if (timeline.approximate) datedApproximateDayCount++;
        const check = checkDay(
          timeline,
          legs,
          timelineStops.map((s) => s.hours),
          timelineMeals.map((m) => m.hours),
          weekday
        );
        if (check.closingConflict) {
          datedClosingConflicts++;
          if (datedViolationExamples.length < 20) {
            datedViolationExamples.push(
              `${profile.label} ${days}d day${day.dayNumber} ${dateForDay}(${weekday}): beforeOpen=${check.startsBeforeOpeningCount} afterClose=${check.endsAfterClosingCount} closedAllDay=${check.closedAllDayCount} noWindow=${check.noValidWindowCount}`
            );
          }
        }
        datedStartsBeforeOpeningTotal += check.startsBeforeOpeningCount;
        datedEndsAfterClosingTotal += check.endsAfterClosingCount;
        datedClosedAllDayTotal += check.closedAllDayCount;
        datedNoValidWindowTotal += check.noValidWindowCount;
        datedTruncatedValidTotal += check.truncatedValidCount;
      });
    }
  }
}
console.log(`Dated total days: ${datedTotalDays} (across ${ARRIVAL_DATES.length} start-weekdays x profiles x [1,3,5,7,10] days)`);
console.log(`Dated days still marked approximate (expected: SOME -- variable/unknown hours, or a stop past its last interval): ${datedApproximateDayCount}/${datedTotalDays}`);
console.log(`Dated days with >=1 real hours-window violation: ${datedClosingConflicts}`);
console.log(`  -- starts before opening: ${datedStartsBeforeOpeningTotal}`);
console.log(`  -- ends after closing: ${datedEndsAfterClosingTotal}`);
console.log(`  -- closed all day (should be 0 -- date-eligibility should already exclude these): ${datedClosedAllDayTotal}`);
console.log(`  -- no valid window found (arrived after last interval closed): ${datedNoValidWindowTotal}`);
console.log(`  -- correctly truncated/approximate (legitimate, not a violation): ${datedTruncatedValidTotal}`);
if (datedViolationExamples.length > 0) {
  console.log("Example violations (up to 20):");
  for (const example of datedViolationExamples) console.log(`  ${example}`);
}

console.log("\nDONE.");

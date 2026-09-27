/**
 * Dev-only debug script — NOT part of the app.
 *
 * Make Food Interest Affect The Actual Itinerary -- permanent regression check for real
 * scheduled meal stops (see barcelonaV2MealStops.ts). Runs the REAL full pipeline (Day Builder
 * -> Natural Cluster Reclaim -> Cross-Day Optimization), then reproduces the meal-stop selection
 * logic locally (barcelonaV2MealStops.ts/barcelonaV2Supplementary.ts both carry
 * `import "server-only"`, so they cannot be imported directly via `npx tsx` -- see this
 * project's established pattern in naturalClusterReclaimAudit.debug.ts). Read-only.
 *
 * Run with:
 *   npx tsx app/lib/planner/foodMealStopAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { SURPRISE_ME_LEGACY_INTERESTS, mapV2InterestsToLegacy } from "./v2InterestAdapter";
import { classifyDayDensity } from "./barcelonaV2Density";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import { getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { BARCELONA_CLUSTER_COMPATIBILITY } from "./barcelona-planner-day-builder";
import { barcelonaGuide } from "../barcelona-guide";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { FoodPlace } from "../guideTypes";

// ── Duplicated meal-stop selection logic (barcelonaV2MealStops.ts is `import "server-only"`) ──
// Kept in exact sync with that file's real AREA_TO_CLUSTER / FOOD_PLACE_CLUSTER_OVERRIDE /
// scoring/selection logic -- see that file for the full geographic-mapping rationale.
// NOTE: hours/weekday eligibility (isEligibleNow / isLikelyOpenForMealType in the real file) is
// NOT reproduced here -- both depend on `import "server-only"` modules and this audit's own scope
// is geographic/category selection and coverage counts, not hour-by-hour scheduling (predates
// Redesign Food Stops + Timeline UI).
const BREAKFAST_CATEGORY_PREFERENCE = ["breakfast", "cafes"];
const LUNCH_CATEGORY_PREFERENCE = ["local", "tapas", "casual", "restaurants"];
const EVENING_TAPAS_CATEGORY = "tapas";
const EVENING_DINNER_CATEGORY_PREFERENCE = ["local", "restaurants", "casual", "view"];

const AREA_TO_CLUSTER: Record<string, string> = {
  "Sant Antoni": "old-city",
  "El Born": "born",
  "Gothic Quarter": "old-city",
  "Gothic Quarter (فندق Ohla Barcelona)": "old-city",
  Barceloneta: "seafront",
  "Barceloneta (Palau de Mar)": "seafront",
  "Port Vell / Barceloneta": "seafront",
  Raval: "old-city",
  "Poble Sec": "montjuic",
  "Montjuïc": "montjuic",
  "Rambla de Catalunya": "passeig-gracia",
  "La Rambla": "old-city",
  "Gràcia": "gracia-north",
  "Passeig de Gràcia": "passeig-gracia",
  "داخل Mercat de la Boqueria": "old-city",
};

const FOOD_PLACE_CLUSTER_OVERRIDE: Record<string, string | null> = {
  "brunch-and-cake": "passeig-gracia",
  "cerveceria-catalana": "passeig-gracia",
  "bar-mut": "passeig-gracia",
  "100-montaditos": "city-center",
  "ciutat-comtal": "city-center",
  "la-bodegueta": "passeig-gracia",
  disfrutar: null,
  canete: "old-city",
  "cal-pep": "born",
  "oriol-balaguer": null,
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

// Timeline Final Customer-Experience Polish: mirrors barcelonaV2MealStops.ts's own clusterFit /
// pickBestForSlot exactly (route-aware selection against the SPECIFIC prev/next stop, with a
// detour veto) -- see that file's own doc comment for the backtracking case this fixes.
const CLUSTER_FIT_SCORE: Record<"strong" | "medium" | "weak", number> = { strong: 3, medium: 2, weak: 1 };
function clusterFit(a: string, b: string): number {
  if (a === b) return 4;
  const level = BARCELONA_CLUSTER_COMPATIBILITY[a]?.[b] ?? BARCELONA_CLUSTER_COMPATIBILITY[b]?.[a];
  return level ? CLUSTER_FIT_SCORE[level] : 0;
}

function pickBestForSlot(
  candidateCategoryIds: readonly string[],
  beforeCluster: string | null,
  afterCluster: string | null,
  usedPlaceIds: ReadonlySet<string>,
  usedFoodCategoryIds: ReadonlySet<string>,
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
    return true;
  });
  if (eligible.length === 0) return null;

  const scored = eligible.map((place) => {
    const cluster = clusterForFoodPlace(place)!;
    const geoScore = clusterFit(cluster, primaryAnchor) + clusterFit(cluster, secondaryAnchor ?? primaryAnchor);
    return { place, geoScore, score: foodScore(place, usedFoodCategoryIds) };
  });
  scored.sort((a, b) => b.geoScore - a.geoScore || b.score - a.score || a.place.id.localeCompare(b.place.id));

  const winner = scored[0];
  if (!preferSameClusterOnly && beforeCluster !== null && beforeCluster === afterCluster && clusterForFoodPlace(winner.place) !== beforeCluster) {
    return pickBestForSlot(candidateCategoryIds, beforeCluster, afterCluster, usedPlaceIds, usedFoodCategoryIds, true);
  }
  return winner.place;
}

type MealStop = { id: string; categoryId: string; mealType: "breakfast" | "lunch" | "tapas" | "dinner"; afterStopIndex: number };

// Mirrors barcelonaV2MealStops.ts's `buildBarcelonaMealStopsForDay` -- breakfast (Slot 0, before
// the first stop) added by Redesign Food Stops + Timeline UI, always attempted (never gated by
// day count/trip length); "not every day" emerges from real geographic/category eligibility.
function buildMealStopsForDay(stopClusters: string[], includeFood: boolean, usedPlaceIds: Set<string>, usedFoodCategoryIds: Set<string>): MealStop[] {
  const mainStopCount = stopClusters.length;
  if (!includeFood || mainStopCount === 0) return [];
  const stops: MealStop[] = [];

  const breakfast = pickBestForSlot(BREAKFAST_CATEGORY_PREFERENCE, null, stopClusters[0], usedPlaceIds, usedFoodCategoryIds, false);
  if (breakfast) {
    stops.push({ id: breakfast.id, categoryId: breakfast.categoryId, mealType: "breakfast", afterStopIndex: -1 });
    usedPlaceIds.add(breakfast.id);
    usedFoodCategoryIds.add(breakfast.categoryId);
  }

  if (mainStopCount >= 2) {
    const lunchAfterIndex = Math.floor((mainStopCount - 1) / 2);
    const lunchPrev = stopClusters[lunchAfterIndex];
    const lunchNext = stopClusters[lunchAfterIndex + 1] ?? null;
    const lunch = pickBestForSlot(LUNCH_CATEGORY_PREFERENCE, lunchPrev, lunchNext, usedPlaceIds, usedFoodCategoryIds, false);
    if (lunch) {
      stops.push({ id: lunch.id, categoryId: lunch.categoryId, mealType: "lunch", afterStopIndex: lunchAfterIndex });
      usedPlaceIds.add(lunch.id);
      usedFoodCategoryIds.add(lunch.categoryId);
    }
  }

  const eveningPrev = stopClusters[mainStopCount - 1];
  const tapas = pickBestForSlot([EVENING_TAPAS_CATEGORY], eveningPrev, null, usedPlaceIds, usedFoodCategoryIds, false);
  const evening = tapas ?? pickBestForSlot(EVENING_DINNER_CATEGORY_PREFERENCE, eveningPrev, null, usedPlaceIds, usedFoodCategoryIds, false);
  if (evening) {
    const mealType: MealStop["mealType"] = evening.categoryId === EVENING_TAPAS_CATEGORY ? "tapas" : "dinner";
    stops.push({ id: evening.id, categoryId: evening.categoryId, mealType, afterStopIndex: mainStopCount - 1 });
    usedPlaceIds.add(evening.id);
    usedFoodCategoryIds.add(evening.categoryId);
  }

  return stops;
}

// ── Duplicated OLD generic supplementary food logic (barcelonaV2Supplementary.ts, also
// `import "server-only"`) -- used only to measure the BEFORE/AFTER "supplementary-only" count. ──
const MAX_FOOD_PER_DAY = 2;
function supplementaryFoodScore(place: FoodPlace): number {
  let score = typeof place.rating === "number" ? place.rating : 0;
  if (place.badges?.includes("best-overall")) score += 3;
  if (place.badges?.includes("popular")) score += 2;
  if (place.badges?.includes("great-value")) score += 1;
  return score;
}
function buildOldSupplementaryFood(includeFood: boolean, usedPlaceIds: Set<string>): string[] {
  if (!includeFood) return [];
  const picked: string[] = [];
  for (let i = 0; i < 2; i++) {
    const eligible = barcelonaGuide.foodPlaces.filter((p) => !usedPlaceIds.has(p.id));
    if (eligible.length === 0) break;
    const scored = eligible.map((p) => ({ p, score: supplementaryFoodScore(p) })).sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id));
    const chosen = scored[0].p;
    picked.push(chosen.id);
    usedPlaceIds.add(chosen.id);
    if (picked.length >= MAX_FOOD_PER_DAY) break;
  }
  return picked;
}

// ── Profiles (V2 interest keys, exactly as the real UI sends them) ────────────────────────────
type ProfileDef = { label: string; v2Interests: V2PlannerInterest[]; surpriseMe: boolean };
const PROFILES: ProfileDef[] = [
  { label: "Food only", v2Interests: ["food"], surpriseMe: false },
  { label: "Food + Popular", v2Interests: ["food", "popular"], surpriseMe: false },
  { label: "Food + Shopping", v2Interests: ["food", "shopping"], surpriseMe: false },
  { label: "All interests", v2Interests: ["popular", "natureViews", "cultureHistory", "beachRelax", "footballExperiences", "food", "shopping", "nightlife"], surpriseMe: false },
  { label: "Surprise Me", v2Interests: [], surpriseMe: true },
];

function legacyInterestsFor(profile: ProfileDef) {
  return profile.surpriseMe ? SURPRISE_ME_LEGACY_INTERESTS : mapV2InterestsToLegacy(profile.v2Interests);
}

function configFor(profile: ProfileDef, days: number) {
  const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe: profile.surpriseMe, days });
  return { ...BARCELONA_V2_DESTINATION_CONFIG, dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, flagshipCoverageGoals } };
}

function runFullPipeline(profile: ProfileDef, days: number) {
  const config = configFor(profile, days);
  const preferences = { interests: legacyInterestsFor(profile) };
  const result = generateTravelPlan(config, preferences, days);
  if (!result.ok) return null;

  const reclaimed = computeNaturalClusterReclaim(
    result.data.plan,
    result.data.legsByDay,
    config.plannerMetadata,
    config.routeOptimizationConfig,
    config.dayBuilderConfig.clusterCompatibility,
    config.dayBuilderConfig.isPlaceEligibleForDay,
    null
  );
  const crossDay = applyCrossDayOptimization(
    reclaimed.plan,
    reclaimed.legsByDay,
    config.plannerMetadata,
    config.routeOptimizationConfig,
    config.dayBuilderConfig.isPlaceEligibleForDay,
    null
  );
  return { plan: crossDay.plan, legsByDay: crossDay.legsByDay };
}

function travelMinutesForDay(legs: PlannerRouteLeg[]): number {
  return legs
    .map((l) => (l.sourceStatus === "unresolved" || !l.recommendedMode ? null : l.options.find((o) => o.mode === l.recommendedMode)))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .reduce((sum, o) => sum + Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2), 0);
}
function unresolvedCountForDay(legs: PlannerRouteLeg[]): number {
  return legs.filter((l) => l.sourceStatus === "unresolved").length;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 1: 1-10 day regression matrix per profile
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("================ FOOD MEAL STOP REGRESSION MATRIX (1-10 days) ================\n");

for (const profile of PROFILES) {
  let totalPlans = 0;
  let totalMainStops = 0;
  let totalDays = 0;
  let totalScheduledMeals = 0;
  let totalSupplementaryOnly = 0;
  let totalVisitMinutes = 0;
  let totalTravelMinutes = 0;
  let totalUnresolved = 0;
  let thinCount = 0;
  let veryThinCount = 0;
  const mealTypeCounts: Record<string, number> = { breakfast: 0, lunch: 0, tapas: 0, dinner: 0 };
  const categoryCounts = new Map<string, number>();

  for (let days = 1; days <= 10; days++) {
    const result = runFullPipeline(profile, days);
    if (!result) continue;
    totalPlans++;

    const usedPlaceIds = new Set<string>(result.plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
    const usedFoodCategoryIds = new Set<string>();
    const includeFood = profile.surpriseMe ? false : profile.v2Interests.includes("food");
    // Surprise Me never sets "food" (see v2InterestAdapter.ts) -- included as its own control row.

    result.plan.days.forEach((day, i) => {
      totalDays++;
      totalMainStops += day.stops.length;
      totalVisitMinutes += day.totalVisitMinutes;
      const legs = result.legsByDay[i] ?? [];
      totalTravelMinutes += travelMinutesForDay(legs);
      totalUnresolved += unresolvedCountForDay(legs);
      const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
      if (density === "thin") thinCount++;
      if (density === "veryThin") veryThinCount++;

      const stopClusters = day.stops.map((s) => getBarcelonaV2PlannerMetadataById(s.placeId)?.cluster ?? "");
      const mealStops = buildMealStopsForDay(stopClusters, includeFood, usedPlaceIds, usedFoodCategoryIds);
      totalScheduledMeals += mealStops.length;
      for (const m of mealStops) {
        mealTypeCounts[m.mealType]++;
        categoryCounts.set(m.categoryId, (categoryCounts.get(m.categoryId) ?? 0) + 1);
      }

      const supplementaryFood = mealStops.length > 0 ? [] : buildOldSupplementaryFood(includeFood, usedPlaceIds);
      totalSupplementaryOnly += supplementaryFood.length;
    });
  }

  console.log(`-- ${profile.label} --`);
  console.log(`  Plans: ${totalPlans} | Days: ${totalDays}`);
  console.log(`  Scheduled MAIN-ITINERARY food stops (AFTER): ${totalScheduledMeals} (avg/day: ${(totalScheduledMeals / totalDays).toFixed(2)})`);
  console.log(`  Supplementary-only food suggestions (AFTER, only when no meal stop landed): ${totalSupplementaryOnly}`);
  console.log(`  Meal type breakdown: breakfast=${mealTypeCounts.breakfast} lunch=${mealTypeCounts.lunch} tapas=${mealTypeCounts.tapas} dinner=${mealTypeCounts.dinner}`);
  console.log(`  Category variety used: ${[...categoryCounts.entries()].map(([c, n]) => `${c}=${n}`).join(", ") || "(none)"}`);
  console.log(`  Avg attractions(main stops)/day: ${(totalMainStops / totalDays).toFixed(2)}`);
  console.log(`  Total visit minutes: ${totalVisitMinutes} | Total travel minutes: ${totalTravelMinutes} | Unresolved legs: ${totalUnresolved}`);
  console.log(`  thin=${thinCount} veryThin=${veryThinCount}`);
  console.log("");
}

console.log("\nDONE.");

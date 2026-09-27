import "server-only";
import { barcelonaGuide } from "../barcelona-guide";
import { resolvePlace, summarizeResolvedPlace, type ResolvedPlaceSummary } from "../readyPlan";
import { isPlaceClosedOnWeekday } from "./barcelonaV2DateEligibility";
import { isLikelyOpenForMealType, type MealType } from "./barcelonaV2Timeline";
import { BARCELONA_CLUSTER_COMPATIBILITY } from "./barcelona-planner-day-builder";
import type { FoodPlace } from "../guideTypes";
import type { HoursInfo, Weekday } from "../hours";
import type { V2PlannerInterest } from "./v2PlannerTypes";

/**
 * Make Food Interest Affect The Actual Itinerary -- Layer C of the interest strategy (alongside
 * Layer A's legacy `foodShoppingNightlife` weight and Layer B's generic supplementary
 * suggestions in barcelonaV2Supplementary.ts). This is the ONLY layer that inserts a real Guide
 * `foodPlaces` record INTO the actual day timeline as a genuine scheduled stop.
 *
 * -- Root cause this fixes -----------------------------------------------------------------------
 * The Day Builder's candidate pool (`PlannerPlaceMetadata[]`, ~36 entries) never included any of
 * the 40 real Guide `foodPlaces` records -- only a handful of food-flavored EXPERIENCES
 * (mercat-sant-antoni, cook-and-taste-paella-class, gothic-quarter-tapas-wine-tour) can ever be a
 * main stop. Every real restaurant/café only ever reached the customer via
 * `buildBarcelonaSupplementaryForDay`'s separate "اقتراحات أكل" strip, which additionally never
 * considered the day's actual geography at all (it picks the single globally-highest-scoring
 * eligible place, ignoring which clusters that day's real stops are even in) -- see that file's
 * own `pickBestEligible`. This produced the measured complaint: Food selection changes a
 * cosmetic strip underneath the plan, never the plan itself.
 *
 * -- Design: a MEAL STOP is NOT a main stop -------------------------------------------------------
 * Deliberately NOT fed into plannerDayBuilder.ts's candidate pool/scoring/coverage-repair
 * machinery -- a restaurant should never compete with Sagrada Família for a "slot", never affect
 * density (thin/veryThin), never touch Natural Reclaim or Cross-Day Optimization (all of which
 * read `GeneratedPlannerPlan.days[].stops`/`totalVisitMinutes`, never touched by this file). A
 * meal stop is computed AFTER the full main-stop pipeline (Day Builder -> Natural Reclaim ->
 * Cross-Day) has settled each day's final stops/clusters, exactly like the existing supplementary
 * layer -- but unlike that layer, it is geographically GATED against the SPECIFIC stops
 * immediately before/after this slot (never a citywide top-rated pick, and never merely "any
 * cluster this day happens to touch somewhere" -- see `pickBestForSlot`'s own doc comment for the
 * real backtracking case this fixes) and carries an explicit `afterStopIndex` so the client can
 * render it interleaved in the same timeline between two real stops (see barcelonaV2Resolve.ts's
 * own wiring and SmartPlannerV2Day.tsx's rendering).
 *
 * -- Geographic mapping (real Guide `area`/`address` fields, never invented) -----------------------
 * `FOOD_PLACE_CLUSTER` maps each food place to exactly one planner cluster, built from the
 * Guide's own `area` tag PLUS its real street address for the two ambiguous tags ("Eixample" and
 * "Ciutat Vella" each span multiple planner clusters) -- e.g. "Eixample" + "Carrer de Mallorca,
 * 236" (near Passeig de Gràcia) resolves to `passeig-gracia`, while "Eixample" + "Carrer de
 * Villarroel, 163" (far southwest, no confident cluster) is left UNMAPPED rather than guessed.
 * Two places (disfrutar, oriol-balaguer) are deliberately unmapped for this reason -- they stay
 * supplementary-only, exactly their prior behavior, never a regression.
 *
 * -- Slots: BREAKFAST + LUNCH + one EVENING meal (tapas, falling back to dinner-style categories) --
 * Three slots, each tried independently and each may honestly come up empty (no compatible/
 * eligible place for that specific slot) -- never fabricated. Matches this task's own target
 * ("do not require every category"). Breakfast (Redesign Food Stops + Timeline UI) was added on
 * top of the original lunch+evening pair -- see `buildBarcelonaMealStopsForDay`'s own doc comment
 * for why "not every day" is an emergent property of real eligibility, never a hardcoded rule.
 *
 * -- Surprise Me Quality V2, Part B ---------------------------------------------------------------
 * Surprise Me always sets `v2Interests = []` (see v2InterestAdapter.ts's own doc comment on why
 * footballExperiences/food/shopping/nightlife are deliberately left unset there), which made the
 * `v2Interests.includes("food")` gate below a hard, silent no-op for every Surprise Me plan --
 * zero scheduled meals regardless of trip length, confirmed by the Surprise Me Long-Trip Quality
 * Audit. Fixed with an explicit, separate `surpriseMe` boolean rather than folding it into
 * `v2Interests`: Surprise Me is not "secretly selecting food" (the customer never chose it, and
 * this file's own selection/geography logic is completely unchanged), it is a distinct mode that
 * is now ALSO allowed through the exact same real meal-selection pipeline everyone else uses --
 * same clusters, same hours, same quality/variety scoring, same "may honestly come up empty" rule.
 * A manual, non-Surprise-Me plan's behavior is byte-for-byte unchanged: the new parameter only
 * ever WIDENS the gate, it never narrows it, so `v2Interests.includes("food") === true` still
 * passes exactly as before regardless of `surpriseMe`.
 */

export type V2MealStop = ResolvedPlaceSummary & {
  kind: "meal";
  mealType: MealType;
  reason: string;
  /** Insert this meal stop in the rendered timeline right after `day.stops[afterStopIndex]`. */
  afterStopIndex: number;
  /** Real Guide fields, never invented (section 13 -- "no fake data"). No reservation note
   * field exists here because no Guide food place carries that data -- see this file's header.
   * `categoryIcon`/`categoryLabel` come from the Guide's own existing `foodCategories` list
   * (same one the Guide page itself uses) -- resolved server-side so the client component never
   * needs to import Guide data directly, matching this project's established V2 convention. */
  categoryIcon: string;
  categoryLabel: string;
  priceLevel: FoodPlace["priceLevel"];
  rating?: number;
  /** Build Real Daily Timeline: the restaurant's own real Guide hours, carried through so the
   * Timeline Resolver (barcelonaV2Timeline.ts) can fit this meal's displayed clock window against
   * its actual schedule -- never re-fetched/duplicated, same record already resolved here. */
  hours?: HoursInfo;
};

const BREAKFAST_CATEGORY_PREFERENCE = ["breakfast", "cafes"];
const LUNCH_CATEGORY_PREFERENCE = ["local", "tapas", "casual", "restaurants"];
const EVENING_TAPAS_CATEGORY = "tapas";
const EVENING_DINNER_CATEGORY_PREFERENCE = ["local", "restaurants", "casual", "view"];

/**
 * Real Guide `area` -> planner cluster id, for every UNAMBIGUOUS area tag (one tag, one real
 * Barcelona district, one planner cluster). "Eixample" and "Ciutat Vella" are intentionally
 * absent here -- both span multiple planner clusters in this dataset, so they're resolved
 * per-place in `FOOD_PLACE_CLUSTER` below using each place's real street address instead.
 */
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

/**
 * Per-place overrides for area tags that span multiple planner clusters ("Eixample", "Ciutat
 * Vella"), resolved from each place's real street address -- see this file's header comment for
 * the specific streets. A placeId mapped to `null` is deliberately EXCLUDED from main-itinerary
 * meal-stop eligibility (no confident cluster match) -- it remains eligible for the existing
 * generic supplementary suggestion layer only, exactly its behavior before this task.
 */
const FOOD_PLACE_CLUSTER_OVERRIDE: Record<string, string | null> = {
  "brunch-and-cake": "passeig-gracia", // Carrer d'Enric Granados, 19
  "cerveceria-catalana": "passeig-gracia", // Carrer de Mallorca, 236
  "bar-mut": "passeig-gracia", // Carrer de Pau Claris, 192
  "100-montaditos": "city-center", // Rambla de Catalunya, 11 -- steps from Plaça Catalunya
  "ciutat-comtal": "city-center", // Rambla de Catalunya, 18 -- steps from Plaça Catalunya
  "la-bodegueta": "passeig-gracia", // Rambla de Catalunya, 100 -- near Diagonal end
  disfrutar: null, // Carrer de Villarroel, 163 -- no confident cluster match
  canete: "old-city", // Carrer de la Unió, 17 -- Raval
  "cal-pep": "born", // Plaça de les Olles, 8 -- El Born
  "oriol-balaguer": null, // Sant Gervasi -- no planner cluster covers this district
};

function clusterForFoodPlace(place: FoodPlace): string | null {
  if (place.id in FOOD_PLACE_CLUSTER_OVERRIDE) return FOOD_PLACE_CLUSTER_OVERRIDE[place.id];
  return AREA_TO_CLUSTER[place.area] ?? null;
}

/**
 * Timeline Final Customer-Experience Polish -- real-world geographic fit between two clusters,
 * mirroring plannerDayBuilder.ts's own COMPATIBILITY_SCORE table exactly (same=4, strong=3,
 * medium=2, weak=1, none=0) so a meal's fit is judged on the SAME scale the Day Builder itself
 * already uses to decide which clusters may share a day at all.
 */
const CLUSTER_FIT_SCORE: Record<"strong" | "medium" | "weak", number> = { strong: 3, medium: 2, weak: 1 };
function clusterFit(a: string, b: string): number {
  if (a === b) return 4;
  const level = BARCELONA_CLUSTER_COMPATIBILITY[a]?.[b] ?? BARCELONA_CLUSTER_COMPATIBILITY[b]?.[a];
  return level ? CLUSTER_FIT_SCORE[level] : 0;
}

function isEligibleNow(hours: HoursInfo | undefined, weekday: Weekday | null): boolean {
  if (!weekday) return true; // flexible mode: no real calendar date, never hours-exclude
  return !isPlaceClosedOnWeekday(hours, weekday);
}

function foodScore(place: FoodPlace, usedFoodCategoryIds: ReadonlySet<string>): number {
  let score = typeof place.rating === "number" ? place.rating : 0;
  if (place.badges?.includes("best-overall")) score += 3;
  if (place.badges?.includes("popular")) score += 2;
  if (place.badges?.includes("great-value")) score += 1;
  // Make Food Interest Affect The Actual Itinerary: a small diversity nudge toward a cuisine
  // style not already used elsewhere in THIS plan (see this task's own section 12) -- never
  // overrides real quality signals (badges/rating still dominate), just breaks a close tie
  // toward variety.
  if (!usedFoodCategoryIds.has(place.categoryId)) score += 1.5;
  return score;
}

/**
 * Timeline Final Customer-Experience Polish -- picks the best meal candidate for one slot,
 * judged against BOTH the stop right before it and the stop right after it (when one exists),
 * per this task's own priority order: (1) open/appropriate for the meal type [already filtered
 * before this runs], (2) compatible with the previous stop, (3) compatible with the next stop,
 * (4) minimal practical detour, (5) quality/rating.
 *
 * -- Root cause this fixes ------------------------------------------------------------------------
 * The prior version only checked "is this place's cluster ANY of the day's clusters" -- a place
 * whose cluster matched a stop FAR from this slot's actual position could still be picked, e.g.
 * (measured) Sant Pau (eixample-north) -> Cerveceria Catalana (passeig-gracia) -> Mercat de la
 * Sagrada Família (eixample-north): a genuine there-and-back detour, invisible to a whole-day
 * cluster check since passeig-gracia legitimately appears elsewhere in that same day.
 *
 * -- Detour veto ------------------------------------------------------------------------------------
 * When the previous and next stops are the SAME cluster (i.e. a true out-and-back shape is even
 * possible) and the only eligible candidates sit in a DIFFERENT cluster, no candidate is
 * geographically free of a detour -- `preferSameClusterOnly` lets the caller retry restricted to
 * same-cluster-as-prev/next candidates first; when that retry also comes up empty, the caller
 * omits the meal for this slot entirely ("Truth > forced meal coverage") rather than force the
 * out-and-back trip.
 *
 * -- Redesign Food Stops + Timeline UI: breakfast has no "previous" stop ------------------------
 * `beforeCluster` is `null` for breakfast (nothing happened yet that day) -- in that case
 * `afterCluster` (the day's first stop) is the only anchor, used exactly like `beforeCluster`
 * normally would be. Exactly one of the two may be `null`, never both (every slot has at least
 * one real neighboring stop).
 */
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
      return false; // not even weakly reachable from where the customer currently is
    }
    if (!isEligibleNow(place.hours, weekday)) return false;
    // Build Real Daily Timeline: a place whose own real hours plainly don't cover this meal
    // type's representative time (e.g. a lunch-only bar considered for the dinner slot) is
    // skipped here -- see barcelonaV2Timeline.ts's own doc comment for why this is checked at
    // SELECTION time (so a genuinely-closed-then venue is never picked to begin with) using the
    // exact same representative time the Timeline Resolver later fits the displayed window to.
    return isLikelyOpenForMealType(place.hours, weekday, mealType);
  });
  if (eligible.length === 0) return null;

  const scored = eligible.map((place) => {
    const cluster = clusterForFoodPlace(place)!;
    const geoScore = clusterFit(cluster, primaryAnchor) + clusterFit(cluster, secondaryAnchor ?? primaryAnchor);
    return { place, geoScore, score: foodScore(place, usedFoodCategoryIds) };
  });
  scored.sort((a, b) => b.geoScore - a.geoScore || b.score - a.score || a.place.id.localeCompare(b.place.id));

  const winner = scored[0];
  // Detour veto: before/after are the exact same cluster (an out-and-back shape is possible),
  // but the winning candidate sits in neither -- a genuine detour. Signal "try same-cluster-only"
  // to the caller instead of silently accepting it. Never fires for breakfast/evening (one side
  // is null there, so they can never be "equal").
  if (!preferSameClusterOnly && beforeCluster !== null && beforeCluster === afterCluster && clusterForFoodPlace(winner.place) !== beforeCluster) {
    return pickBestForSlot(candidateCategoryIds, beforeCluster, afterCluster, usedPlaceIds, usedFoodCategoryIds, weekday, mealType, true);
  }
  return winner.place;
}

function categoryIconAndLabel(categoryId: string): { icon: string; label: string } {
  const category = barcelonaGuide.foodCategories.find((c) => c.id === categoryId);
  return category ? { icon: category.icon, label: category.label } : { icon: "🍽️", label: categoryId };
}

function toMealStop(place: FoodPlace, mealType: V2MealStop["mealType"], afterStopIndex: number, reason: string): V2MealStop | null {
  const resolved = resolvePlace(place.id, "food", barcelonaGuide);
  if (!resolved) return null;
  const { icon, label } = categoryIconAndLabel(place.categoryId);
  return {
    ...summarizeResolvedPlace(resolved),
    kind: "meal",
    mealType,
    afterStopIndex,
    reason,
    categoryIcon: icon,
    categoryLabel: label,
    priceLevel: place.priceLevel,
    rating: place.rating,
    hours: place.hours,
  };
}

const REASON_BY_MEAL_TYPE: Record<V2MealStop["mealType"], string> = {
  breakfast: "قريب من أول محطة في يومك ومناسب لوقت الفطور",
  lunch: "قريب من مسار يومك ومناسب لوقت الغداء",
  tapas: "قريب من مسار يومك ومناسب لجولة تاباس مسائية",
  dinner: "قريب من مسار يومك ومناسب لوقت العشاء",
};

/**
 * Builds this day's real, scheduled meal stops (0-3: breakfast/lunch/evening). Only ever
 * produces a stop when the customer selected "food" AND a real, geographically-matching,
 * currently-eligible Guide food place exists -- never fabricated, never a random pick.
 * `usedPlaceIds`/`usedFoodCategoryIds` are shared, mutated across the WHOLE plan (same pattern
 * as buildBarcelonaSupplementaryForDay) so no venue repeats and cuisine variety is nudged across
 * days/trip length.
 *
 * -- Redesign Food Stops + Timeline UI: breakfast -------------------------------------------------
 * A third slot, BEFORE the day's first stop (`afterStopIndex: -1`), tried on every food-selected
 * day exactly like lunch/evening -- "not every day" is never a hardcoded day-count rule, it's the
 * honest outcome of real geographic/hours eligibility against that day's own first stop (e.g. a
 * day starting in `les-corts`, which has no breakfast/café-category place mapped, naturally gets
 * no breakfast; a day starting in `old-city` or `eixample-north`-adjacent `passeig-gracia` often
 * does). Category candidates are exactly the Guide's own "breakfast" and "cafes" categoryIds --
 * "brunch" places are already tagged "breakfast" in the real data (e.g. brunch-and-cake), so no
 * separate classification is invented for it.
 */
export function buildBarcelonaMealStopsForDay(
  stopClusters: string[],
  weekday: Weekday | null,
  v2Interests: V2PlannerInterest[],
  usedPlaceIds: Set<string>,
  usedFoodCategoryIds: Set<string>,
  surpriseMe = false
): V2MealStop[] {
  const mainStopCount = stopClusters.length;
  if ((!v2Interests.includes("food") && !surpriseMe) || mainStopCount === 0) return [];

  const mealStops: V2MealStop[] = [];

  // Slot 0: BREAKFAST -- before the day's first stop, judged purely against that first stop's
  // own cluster (no "previous" stop exists yet).
  const breakfastPlace = pickBestForSlot(BREAKFAST_CATEGORY_PREFERENCE, null, stopClusters[0], usedPlaceIds, usedFoodCategoryIds, weekday, "breakfast", false);
  if (breakfastPlace) {
    const stop = toMealStop(breakfastPlace, "breakfast", -1, REASON_BY_MEAL_TYPE.breakfast);
    if (stop) {
      mealStops.push(stop);
      usedPlaceIds.add(breakfastPlace.id);
      usedFoodCategoryIds.add(breakfastPlace.categoryId);
    }
  }

  // Slot 1: LUNCH -- positioned roughly mid-day (after the day's own midpoint stop). A 1-stop
  // day has no real "middle", so lunch is skipped there in favor of the single evening slot
  // below (never two meals crowded onto one attraction's day).
  if (mainStopCount >= 2) {
    const lunchAfterIndex = Math.floor((mainStopCount - 1) / 2);
    const lunchPrevCluster = stopClusters[lunchAfterIndex];
    const lunchNextCluster = stopClusters[lunchAfterIndex + 1] ?? null;
    const lunchPlace = pickBestForSlot(LUNCH_CATEGORY_PREFERENCE, lunchPrevCluster, lunchNextCluster, usedPlaceIds, usedFoodCategoryIds, weekday, "lunch", false);
    if (lunchPlace) {
      const stop = toMealStop(lunchPlace, "lunch", lunchAfterIndex, REASON_BY_MEAL_TYPE.lunch);
      if (stop) {
        mealStops.push(stop);
        usedPlaceIds.add(lunchPlace.id);
        usedFoodCategoryIds.add(lunchPlace.categoryId);
      }
    }
  }

  // Slot 2: EVENING meal (tapas preferred, falling back to dinner-style categories) --
  // positioned after the day's last stop, so there is no "next" stop to consider (nextCluster is
  // null, meaning pickBestForSlot judges it purely against the previous/last stop).
  const eveningPrevCluster = stopClusters[mainStopCount - 1];
  const tapasPlace = pickBestForSlot([EVENING_TAPAS_CATEGORY], eveningPrevCluster, null, usedPlaceIds, usedFoodCategoryIds, weekday, "tapas", false);
  const eveningPlace = tapasPlace ?? pickBestForSlot(EVENING_DINNER_CATEGORY_PREFERENCE, eveningPrevCluster, null, usedPlaceIds, usedFoodCategoryIds, weekday, "dinner", false);
  if (eveningPlace) {
    const mealType: V2MealStop["mealType"] = eveningPlace.categoryId === EVENING_TAPAS_CATEGORY ? "tapas" : "dinner";
    const stop = toMealStop(eveningPlace, mealType, mainStopCount - 1, REASON_BY_MEAL_TYPE[mealType]);
    if (stop) {
      mealStops.push(stop);
      usedPlaceIds.add(eveningPlace.id);
      usedFoodCategoryIds.add(eveningPlace.categoryId);
    }
  }

  return mealStops;
}

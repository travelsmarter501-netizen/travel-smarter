import "server-only";
import { barcelonaGuide } from "../barcelona-guide";
import { resolvePlace, summarizeResolvedPlace, type ResolvedPlaceSummary } from "../readyPlan";
import { isPlaceClosedOnWeekday } from "./barcelonaV2DateEligibility";
import { canServeMealAt, findCoveringInterval, isLikelyOpenForMealType, MEAL_ASSUMED_DURATION_MINUTES, MEAL_TARGET_WINDOW, type MealType } from "./barcelonaV2Timeline";
import { BARCELONA_CLUSTER_COMPATIBILITY } from "./barcelona-planner-day-builder";
import type { FoodCategory, FoodPlace } from "../guideTypes";
import type { ClusterCompatibilityMap } from "./plannerDayBuilder";
import type { CityMealStopRules } from "./cityPlannerModule";
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
  /** Cities with flexibleMeals: an optional meal (dinner), shown as optional and not counted in the day's end. */
  optional?: boolean;
  /** Cities with flexibleMeals: a lunch break with no set restaurant (none fits near the route at that time). */
  flexible?: boolean;
  /** Cities with flexibleMeals: the meal's own earliest start on the timeline (dinner from 18:00). */
  earliestStart?: number;
};


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

function barcelonaClusterForFoodPlace(place: FoodPlace): string | null {
  if (place.id in FOOD_PLACE_CLUSTER_OVERRIDE) return FOOD_PLACE_CLUSTER_OVERRIDE[place.id];
  return AREA_TO_CLUSTER[place.area] ?? null;
}

/** Barcelona's meal-stop rules (multi-city foundation: the values that used to be file-level constants here, unchanged). */
export const BARCELONA_MEAL_STOP_RULES: CityMealStopRules = {
  clusterForFoodPlace: barcelonaClusterForFoodPlace,
  breakfastCategories: ["breakfast", "cafes"],
  lunchCategories: ["local", "tapas", "casual", "restaurants"],
  eveningSpecialCategory: "tapas",
  dinnerCategories: ["local", "restaurants", "casual", "view"],
};

/**
 * Multi-city foundation: everything the meal-stop logic below reads about one city. Barcelona's context is built from
 * barcelonaGuide + BARCELONA_MEAL_STOP_RULES + BARCELONA_CLUSTER_COMPATIBILITY (exactly the data this file used before);
 * another city passes its own (see cityPlannerModule.ts).
 */
export type MealStopCityContext = {
  foodPlaces: readonly FoodPlace[];
  foodCategories: readonly FoodCategory[];
  clusterCompatibility: ClusterCompatibilityMap;
  rules: CityMealStopRules;
  /** Cities with the timing guard: the WHOLE meal (from its representative time) must fit inside the opening hours. */
  strictMealHours?: boolean;
  /**
   * Optional (cities with mealLegsInTimeline): minutes between two places. When given, a restaurant is chosen by the real
   * detour it adds to the route between the stops around the meal (never more than the slot's limit), not by area alone.
   */
  travelMinutes?: (fromPlaceId: string, toPlaceId: string) => number | null;
};

/** The longest detour (minutes of extra travel) a meal may add; a slot without a place inside it stays without one. */
const MAX_MEAL_DETOUR: Record<MealType, number> = { breakfast: 25, lunch: 20, tapas: 30, dinner: 30 };

const BARCELONA_MEAL_STOP_CONTEXT: MealStopCityContext = {
  foodPlaces: barcelonaGuide.foodPlaces,
  foodCategories: barcelonaGuide.foodCategories,
  clusterCompatibility: BARCELONA_CLUSTER_COMPATIBILITY,
  rules: BARCELONA_MEAL_STOP_RULES,
};

/**
 * Timeline Final Customer-Experience Polish -- real-world geographic fit between two clusters,
 * mirroring plannerDayBuilder.ts's own COMPATIBILITY_SCORE table exactly (same=4, strong=3,
 * medium=2, weak=1, none=0) so a meal's fit is judged on the SAME scale the Day Builder itself
 * already uses to decide which clusters may share a day at all.
 */
const CLUSTER_FIT_SCORE: Record<"strong" | "medium" | "weak", number> = { strong: 3, medium: 2, weak: 1 };
function clusterFit(city: MealStopCityContext, a: string, b: string): number {
  if (a === b) return 4;
  const level = city.clusterCompatibility[a]?.[b] ?? city.clusterCompatibility[b]?.[a];
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
  city: MealStopCityContext,
  candidateCategoryIds: readonly string[],
  beforeCluster: string | null,
  afterCluster: string | null,
  usedPlaceIds: ReadonlySet<string>,
  usedFoodCategoryIds: ReadonlySet<string>,
  weekday: Weekday | null,
  mealType: MealType,
  preferSameClusterOnly: boolean,
  /** Cities with `mealLegsInTimeline`: the meal's estimated start on the real timeline; a place that cannot serve it then is skipped. */
  expectedStart?: number,
  /** With `travelMinutes`: the stops before / after the meal, to judge the real detour. */
  around?: { beforeId: string | null; afterId: string | null }
): FoodPlace | null {
  const primaryAnchor = beforeCluster ?? afterCluster!;
  const secondaryAnchor = beforeCluster !== null ? afterCluster : null;

  const eligible = city.foodPlaces.filter((place) => {
    if (usedPlaceIds.has(place.id)) return false;
    if (!candidateCategoryIds.includes(place.categoryId)) return false;
    const cluster = city.rules.clusterForFoodPlace(place);
    if (!cluster) return false;
    if (preferSameClusterOnly) {
      if (cluster !== beforeCluster && cluster !== afterCluster) return false;
    } else if (clusterFit(city, cluster, primaryAnchor) === 0) {
      return false; // not even weakly reachable from where the customer currently is
    }
    if (!isEligibleNow(place.hours, weekday)) return false;
    // Build Real Daily Timeline: a place whose own real hours plainly don't cover this meal
    // type's representative time (e.g. a lunch-only bar considered for the dinner slot) is
    // skipped here -- see barcelonaV2Timeline.ts's own doc comment for why this is checked at
    // SELECTION time (so a genuinely-closed-then venue is never picked to begin with) using the
    // exact same representative time the Timeline Resolver later fits the displayed window to.
    if (!isLikelyOpenForMealType(place.hours, weekday, mealType)) return false;
    if (city.strictMealHours && weekday) {
      const representative = MEAL_TARGET_WINDOW[mealType].representative;
      const covering = findCoveringInterval(place.hours, weekday, representative);
      if (covering && covering.close < representative + MEAL_ASSUMED_DURATION_MINUTES[mealType]) return false;
    }
    if (expectedStart !== undefined && canServeMealAt(place.hours, weekday, expectedStart, mealType) === false) return false;
    return true;
  });
  if (eligible.length === 0) return null;

  const travel = city.travelMinutes;
  const detourOf = (placeId: string): number | null => {
    if (!travel || !around) return null;
    const { beforeId, afterId } = around;
    if (beforeId && afterId) {
      const a = travel(beforeId, placeId), b = travel(placeId, afterId), direct = travel(beforeId, afterId);
      return a === null || b === null || direct === null ? null : Math.max(0, a + b - direct);
    }
    const one = beforeId ? travel(beforeId, placeId) : afterId ? travel(placeId, afterId) : null;
    return one;
  };
  const scoredAll = eligible.map((place) => {
    const cluster = city.rules.clusterForFoodPlace(place)!;
    const geoScore = clusterFit(city, cluster, primaryAnchor) + clusterFit(city, cluster, secondaryAnchor ?? primaryAnchor);
    return { place, geoScore, score: foodScore(place, usedFoodCategoryIds), detour: detourOf(place.id) };
  });
  // With real travel times: nothing beyond the slot's detour limit, then the smallest detour (in 5-minute steps) first.
  const scored = travel && around ? scoredAll.filter((s) => s.detour === null || s.detour <= MAX_MEAL_DETOUR[mealType]) : scoredAll;
  if (scored.length === 0) return null;
  const step = (s: { detour: number | null }) => (travel && around && s.detour !== null ? Math.round(s.detour / 5) : 0);
  scored.sort((a, b) => step(a) - step(b) || b.geoScore - a.geoScore || b.score - a.score || a.place.id.localeCompare(b.place.id));
  if (travel && around) return scored[0].place;

  const winner = scored[0];
  // Detour veto: before/after are the exact same cluster (an out-and-back shape is possible),
  // but the winning candidate sits in neither -- a genuine detour. Signal "try same-cluster-only"
  // to the caller instead of silently accepting it. Never fires for breakfast/evening (one side
  // is null there, so they can never be "equal").
  if (!preferSameClusterOnly && beforeCluster !== null && beforeCluster === afterCluster && city.rules.clusterForFoodPlace(winner.place) !== beforeCluster) {
    return pickBestForSlot(city, candidateCategoryIds, beforeCluster, afterCluster, usedPlaceIds, usedFoodCategoryIds, weekday, mealType, true, expectedStart, around);
  }
  return winner.place;
}

function categoryIconAndLabel(city: MealStopCityContext, categoryId: string): { icon: string; label: string } {
  const category = city.foodCategories.find((c) => c.id === categoryId);
  return category ? { icon: category.icon, label: category.label } : { icon: "🍽️", label: categoryId };
}

function toMealStop(city: MealStopCityContext, place: FoodPlace, mealType: V2MealStop["mealType"], afterStopIndex: number, reason: string): V2MealStop | null {
  const resolved = resolvePlace(place.id, "food", { attractions: [], experiences: [], areas: [], foodPlaces: [...city.foodPlaces] });
  if (!resolved) return null;
  const { icon, label } = categoryIconAndLabel(city, place.categoryId);
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
  return buildMealStopsForDay(BARCELONA_MEAL_STOP_CONTEXT, stopClusters, weekday, v2Interests, usedPlaceIds, usedFoodCategoryIds, surpriseMe);
}

/**
 * Lunch by the clock (cities with `lunchByClock`): the day is estimated from 9:00 (+60 minutes when there is a breakfast stop),
 * each stop's visit length and 15 minutes between stops; lunch goes after the last stop that ends by 13:45 (never after the last
 * stop of the day, which keeps the evening slot), or after the first stop when even that one ends later.
 */
export function lunchIndexByClock(visitMinutes: readonly number[], hasBreakfast = true): number {
  const LATEST_END = 13 * 60 + 45;
  let t = 9 * 60 + (hasBreakfast ? 60 : 0);
  let index = 0;
  for (let i = 0; i < visitMinutes.length - 1; i++) {
    t += (i > 0 ? 15 : 0) + visitMinutes[i];
    if (t <= LATEST_END) index = i;
    else break;
  }
  return index;
}

/** The city-independent meal-stop builder (see buildBarcelonaMealStopsForDay above for the full behaviour description). */
export function buildMealStopsForDay(
  city: MealStopCityContext,
  stopClusters: string[],
  weekday: Weekday | null,
  v2Interests: V2PlannerInterest[],
  usedPlaceIds: Set<string>,
  usedFoodCategoryIds: Set<string>,
  surpriseMe = false,
  stopVisitMinutes?: readonly number[],
  /**
   * Cities with `mealLegsInTimeline`: the lunch position and estimated meal starts read from the day's real timeline
   * (lunchPlacementFromTimeline), and whether a restaurant from another day may be reused when no unused one fits.
   */
  slotHints?: {
    lunchAfterIndex?: number;
    breakfastStart?: number;
    lunchStart?: number;
    dinnerStart?: number;
    reuseWhenNoneLeft?: boolean;
    /** Re-places lunch once the breakfast place is known (its opening time shifts the whole morning). */
    lunchFor?: (breakfast: { placeId: string; hours?: HoursInfo } | null) => { afterIndex: number; estimatedStart: number } | null;
    /** The day's stop ids in order, to judge each restaurant's real detour (with MealStopCityContext.travelMinutes). */
    stopIds?: readonly string[];
  }
): V2MealStop[] {
  const rules = city.rules;
  const mainStopCount = stopClusters.length;
  // Cities with flexibleMeals: every customer gets a lunch slot; "food" (or Surprise Me) adds breakfast and dinner suggestions
  // and the stronger restaurant focus.
  const flexibleMeals = rules.flexibleMeals;
  // A café inside a garden or a palace is only offered on a day that visits that place.
  if (rules.insideStop && slotHints?.stopIds) {
    const inside = rules.insideStop;
    const visited = slotHints.stopIds;
    city = { ...city, foodPlaces: city.foodPlaces.filter((place) => !inside[place.id] || visited.includes(inside[place.id])) };
  }
  const foodChosen = v2Interests.includes("food") || surpriseMe;
  if ((!foodChosen && !flexibleMeals) || mainStopCount === 0) return [];

  const mealStops: V2MealStop[] = [];

  // Slot 0: BREAKFAST -- before the day's first stop, judged purely against that first stop's
  // own cluster (no "previous" stop exists yet).
  // Cities with `reuseWhenNoneLeft`: when every fitting place was already used on another day, one may be used again
  // (never twice on the same day) instead of leaving the slot empty.
  const todaysMealIds = new Set<string>();
  const foodIds = new Set(city.foodPlaces.map((place) => place.id));
  const stopIds = slotHints?.stopIds;
  let around: { beforeId: string | null; afterId: string | null } | undefined;
  const pick = (categories: readonly string[], before: string | null, after: string | null, mealType: MealType, expectedStart?: number): { place: FoodPlace; reused: boolean } | null => {
    const fresh = pickBestForSlot(city, categories, before, after, usedPlaceIds, usedFoodCategoryIds, weekday, mealType, false, expectedStart, around);
    if (fresh) return { place: fresh, reused: false };
    if (!slotHints?.reuseWhenNoneLeft) return null;
    const relaxed = new Set([...usedPlaceIds].filter((id) => !foodIds.has(id) || todaysMealIds.has(id)));
    const reused = pickBestForSlot(city, categories, before, after, relaxed, usedFoodCategoryIds, weekday, mealType, false, expectedStart, around);
    return reused ? { place: reused, reused: true } : null;
  };
  const REUSED_REASON = "نفس مطعم يوم سابق: ما في مطعم تاني قريب ومفتوح بهالوقت";

  around = stopIds ? { beforeId: null, afterId: stopIds[0] ?? null } : undefined;
  const breakfastPick = foodChosen ? pick(rules.breakfastCategories, null, stopClusters[0], "breakfast", slotHints?.breakfastStart) : null;
  const breakfastPlace = breakfastPick?.place ?? null;
  if (breakfastPlace) {
    const stop = toMealStop(city, breakfastPlace, "breakfast", -1, breakfastPick?.reused ? REUSED_REASON : REASON_BY_MEAL_TYPE.breakfast);
    if (stop) {
      mealStops.push(stop);
      todaysMealIds.add(breakfastPlace.id);
      usedPlaceIds.add(breakfastPlace.id);
      usedFoodCategoryIds.add(breakfastPlace.categoryId);
    }
  }

  // Slot 1: LUNCH -- positioned roughly mid-day (after the day's own midpoint stop). A 1-stop
  // day has no real "middle", so lunch is skipped there in favor of the single evening slot
  // below (never two meals crowded onto one attraction's day).
  if (mainStopCount >= 2 || (flexibleMeals && mainStopCount >= 1)) {
    // With flexibleMeals the breakfast is only a suggestion (not on the clock), so lunch is placed without it.
    const breakfastChosen = flexibleMeals ? undefined : mealStops.find((meal) => meal.mealType === "breakfast");
    const lunchHint = slotHints?.lunchFor?.(breakfastChosen ? { placeId: breakfastChosen.id, hours: breakfastChosen.hours } : null);
    if (lunchHint && slotHints) slotHints = { ...slotHints, lunchAfterIndex: lunchHint.afterIndex, lunchStart: lunchHint.estimatedStart };
    const lunchAfterIndex = slotHints?.lunchAfterIndex ?? (rules.lunchByClock && stopVisitMinutes ? lunchIndexByClock(stopVisitMinutes) : Math.floor((mainStopCount - 1) / 2));
    const lunchPrevCluster = stopClusters[lunchAfterIndex] ?? null; // -1: lunch before a late one-stop day
    const lunchNextCluster = stopClusters[lunchAfterIndex + 1] ?? null;
    around = stopIds ? { beforeId: stopIds[lunchAfterIndex] ?? null, afterId: stopIds[lunchAfterIndex + 1] ?? null } : undefined;
    let lunchPick = pick(rules.lunchCategories, lunchPrevCluster, lunchNextCluster, "lunch", slotHints?.lunchStart);
    let lightLunch = false;
    if (!lunchPick && rules.lunchFallbackCategories?.length) {
      const fallback = pickBestForSlot(city, rules.lunchFallbackCategories, lunchPrevCluster, lunchNextCluster, usedPlaceIds, usedFoodCategoryIds, weekday, "lunch", false, slotHints?.lunchStart, around);
      if (fallback) { lunchPick = { place: fallback, reused: false }; lightLunch = true; }
    }
    const lunchPlace = lunchPick?.place ?? null;
    if (lunchPlace) {
      const stop = toMealStop(city, lunchPlace, "lunch", lunchAfterIndex, lightLunch ? "غدا خفيف بمقهى قريب: ما في مطعم قريب مفتوح بهالوقت" : lunchPick?.reused ? REUSED_REASON : flexibleMeals && !foodChosen ? "وقت الغدا: مطعم قريب من مسارك إذا حابب" : REASON_BY_MEAL_TYPE.lunch);
      if (stop) {
        mealStops.push(stop);
        todaysMealIds.add(lunchPlace.id);
        usedPlaceIds.add(lunchPlace.id);
        usedFoodCategoryIds.add(lunchPlace.categoryId);
      }
    }
  }

  // Cities with flexibleMeals: no restaurant fits the lunch time near the route -> a lunch break in the area (no set place),
  // never a dropped meal and never a far restaurant.
  if (flexibleMeals && !mealStops.some((meal) => meal.mealType === "lunch") && mainStopCount >= 1) {
    const lunchAfterIndex = slotHints?.lunchAfterIndex ?? Math.floor((mainStopCount - 1) / 2);
    mealStops.push({ id: "lunch-break", name: "استراحة غدا بالمنطقة", categoryLabel: "", kind: "meal", mealType: "lunch", afterStopIndex: lunchAfterIndex, reason: "ما لقينا مطعم مناسب قريب ومفتوح بهالوقت؛ خذ ساعة غدا بأي مكان قريب من مسارك", categoryIcon: "🍽️", priceLevel: undefined, flexible: true } as V2MealStop);
  }

  if (flexibleMeals && !foodChosen) return mealStops;

  // Slot 2: EVENING meal (tapas preferred, falling back to dinner-style categories) --
  // positioned after the day's last stop, so there is no "next" stop to consider (nextCluster is
  // null, meaning pickBestForSlot judges it purely against the previous/last stop).
  const eveningPrevCluster = stopClusters[mainStopCount - 1];
  const special = rules.eveningSpecialCategory;
  const tapasPlace = special ? pickBestForSlot(city, [special], eveningPrevCluster, null, usedPlaceIds, usedFoodCategoryIds, weekday, "tapas", false) : null;
  around = stopIds ? { beforeId: stopIds[mainStopCount - 1] ?? null, afterId: null } : undefined;
  const dinnerPick = tapasPlace ? null : pick(rules.dinnerCategories, eveningPrevCluster, null, "dinner", slotHints?.dinnerStart);
  const eveningPlace = tapasPlace ?? dinnerPick?.place ?? null;
  if (eveningPlace) {
    const mealType: V2MealStop["mealType"] = special !== null && eveningPlace.categoryId === special ? "tapas" : "dinner";
    const made = toMealStop(city, eveningPlace, mealType, mainStopCount - 1, dinnerPick?.reused ? REUSED_REASON : flexibleMeals ? "عشا اختياري قريب من آخر محطة، بعد ما يخلص برنامج اليوم" : REASON_BY_MEAL_TYPE[mealType]);
    // Cities with flexibleMeals: dinner is optional, from the city's earliest dinner time, right after the day's program.
    const stop = made && flexibleMeals ? { ...made, optional: true, earliestStart: flexibleMeals.dinnerEarliest } : made;
    if (stop) {
      mealStops.push(stop);
      usedPlaceIds.add(eveningPlace.id);
      usedFoodCategoryIds.add(eveningPlace.categoryId);
    }
  }

  return mealStops;
}

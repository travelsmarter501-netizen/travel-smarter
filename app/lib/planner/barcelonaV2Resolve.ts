import "server-only";
import { resolvePlace, resolvePlannerPlace, summarizeResolvedPlace, type ResolvedPlace, type ResolvedPlaceSummary } from "../readyPlan";
import type { PlannerOperationalWarning } from "./barcelonaPlannerOperationalWarnings";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import { buildSupplementaryForDay, type V2FoodSuggestion, type V2ShoppingSuggestion, type V2NightlifeSuggestion } from "./barcelonaV2Supplementary";
import { buildMealStopsForDay, type MealStopCityContext, type V2MealStop } from "./barcelonaV2MealStops";
import type { CityPlannerModule } from "./cityPlannerModule";
import { legMidMinutes, timelineLegBetween } from "./timelineLegs";
import { classifyDayDensity, buildDensitySummary, type PlannerDayDensity } from "./barcelonaV2Density";
import { isPlaceClosedOnWeekday } from "./barcelonaV2DateEligibility";
import { buildBarcelonaDayTimeline, findCoveringInterval, lunchPlacementFromTimeline, LUNCH_BREAK_ID, startsInShowWindow, MEAL_ASSUMED_DURATION_MINUTES, MEAL_TARGET_WINDOW, type DayTimeline, type TimelineStopInput, type TimelineMealInput } from "./barcelonaV2Timeline";
import { buildUnifiedTimelineEntries, type UnifiedTimelineEntry } from "./v2TimelineItems";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerOptionalSuggestion, PresentedPlannerPlan } from "./plannerPresentationTypes";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { HoursInfo, Weekday } from "../hours";
import type { ReadyPlanPlaceType } from "../readyPlanTypes";

/**
 * Smart Planner V2 -- SERVER-ONLY resolution from the raw, placeId-only generated plan into a
 * render-ready shape the V2 client can display without ever importing barcelona-guide.ts or
 * barcelona-planner-metadata.ts itself. `import "server-only"` makes an accidental client
 * import of this file fail the build immediately.
 *
 * Phase 4: main-stop metadata (visitDurationMinutes) is now looked up via
 * getBarcelonaV2PlannerMetadataById (the FULL 35-entry V2 pool), not the legacy-only
 * getBarcelonaPlannerMetadata -- otherwise a newly-promoted V2-only candidate would silently
 * render with visitDurationMinutes: 0 since it doesn't exist in the legacy 30-entry map.
 *
 * `foodSuggestions`/`shoppingSuggestions`/`nightlifeSuggestions` per day, built by
 * barcelonaV2Supplementary.ts (Layer B of the interest strategy) -- entirely separate from the
 * main visit-stop `stops` array. A single `usedPlaceIds` set accumulates across the WHOLE plan
 * (main stops -> optionalNearby -> every day's supplementary picks, in that order) so no place
 * ID is ever suggested twice anywhere in the result, across any item kind -- this also
 * guarantees a main-stop candidate (including a newly-promoted one) can never simultaneously
 * appear as a supplementary suggestion in the same plan.
 *
 * Phase 4.1: each day also gets a `density` classification (see barcelonaV2Density.ts) and the
 * plan gets an optional `densityWarning` -- completely independent from `capacityWarning`.
 * `capacityWarning` only ever compares daysGenerated to daysRequested (day COUNT); density
 * catches the case that check misses -- every requested day exists, but one of them is honestly
 * thin (e.g. a 10-day trip's last day landing on a single main stop). Density is computed from
 * `stops`/`totalVisitMinutes` only -- food/shopping/nightlife supplementary suggestions never
 * factor in, per spec.
 */

export type V2ResolvedStop = ResolvedPlaceSummary & {
  visitDurationMinutes: number;
  score: number;
  warnings: PlannerOperationalWarning[];
  /** Build Real Daily Timeline: the place's own real Guide hours, carried through so the
   * Timeline Resolver can hard-constrain against it -- see barcelonaV2Timeline.ts. */
  hours?: HoursInfo;
  /** Outside-only stop (cities with outside stops): short visit of the outside; the card says so. */
  visitMode?: "outside";
  /** Cities with ticketEstimate: estimated adult entry (0 free / outside, null = price not known). */
  ticket?: { amount: number | null; currency: string };
};

export type V2ResolvedNearby = ResolvedPlaceSummary & {
  type: PlannerOptionalSuggestion["type"];
  reason?: string;
  /** Cities with ticketEstimate: estimated adult entry of this optional place (null = not known). */
  ticket?: { amount: number | null; currency: string };
};

export type V2Day = {
  dayNumber: number;
  actualDate?: string;
  weekday?: Weekday;
  title: string;
  summary: string;
  highlight?: string;
  totalVisitMinutes: number;
  density: PlannerDayDensity;
  clusters: string[];
  stops: V2ResolvedStop[];
  legs: PlannerRouteLeg[];
  optionalNearby: V2ResolvedNearby[];
  /** Make Food Interest Affect The Actual Itinerary -- real scheduled meal stops (0-2), meant
   * to render INTERLEAVED into the same timeline as `stops` (see each entry's own
   * `afterStopIndex`) -- never counted toward density/main-stop totals. Optional (like
   * `placeDetails` below) so an OLD saved plan's frozen JSON -- persisted before this field
   * existed -- deserializes safely: every reader treats a missing value as an empty array,
   * never crashes. Always populated (never omitted) on a newly generated plan. */
  mealStops?: V2MealStop[];
  /** Fix Meal-Adjacent Transport Connectors -- real resolved legs for connectors touching a meal
   * stop on either side, keyed by `${fromPlaceId}::${toPlaceId}`. `legs` above only ever covers
   * consecutive MAIN-STOP pairs (indexed by stopIndex); this covers the pairs that fall outside
   * that array -- any pair chronologically adjacent in the unified timeline where one or both
   * sides is a meal (attraction->restaurant, restaurant->attraction, breakfast->first stop,
   * etc.) -- resolved through the EXACT SAME table/resolver as `legs` (`getBarcelonaRouteLeg`),
   * never a separate or looser rule. Computed from the same adjacency
   * `buildUnifiedTimelineEntries` uses to render the timeline (so a Free Time block correctly
   * breaks adjacency exactly like it does on screen). Optional so an old saved plan (frozen
   * before this field existed) deserializes safely -- SmartPlannerV2Day.tsx falls back to its
   * existing unresolved connector when a key is missing here. Never changes which places are on
   * the day, their order, or the timeline clock -- purely a connector-display lookup. */
  mealLegs?: Record<string, PlannerRouteLeg>;
  foodSuggestions: V2FoodSuggestion[];
  shoppingSuggestions: V2ShoppingSuggestion[];
  nightlifeSuggestions: V2NightlifeSuggestion[];
  /** Build Real Daily Timeline: this day's real clock schedule (see barcelonaV2Timeline.ts) --
   * additive, computed from the already-final `stops`/`legs`/`mealStops` above, never changes
   * which places are on the day or their order. Optional (same backward-compatibility pattern as
   * `mealStops`) so an old saved plan's frozen JSON, persisted before this field existed,
   * deserializes safely -- a missing value means "no timeline available", never a crash. */
  timeline?: DayTimeline;
};

export type V2Plan = {
  /** Destination id (multi-city foundation). Every plan generated or saved before multi-city support is "barcelona". */
  destination: string;
  daysRequested: number;
  daysGenerated: number;
  /** Arabic warning text when daysGenerated < daysRequested; null otherwise. Never invented --
   * this only ever reports what the Day Builder actually produced. */
  capacityWarning: string | null;
  /** Non-alarming Arabic note when at least one generated day is veryThin; null otherwise.
   * Independent from capacityWarning -- see barcelonaV2Density.ts. */
  densityWarning: string | null;
  /**
   * Sellability audit: true only when the customer's accommodation text resolved to a real
   * cluster AND was actually used to reorder days (see orderDaysByAccommodation in
   * travelPlannerEngine.ts) -- never true just because accommodation text was entered. Lets the
   * UI show a small, factually-guaranteed "we ordered your trip around your stay" note instead
   * of leaving that real effect invisible to the customer (see barcelonaAccommodationClusters.ts
   * -- an unresolved/ambiguous address correctly leaves this false, never guessed).
   */
  accommodationOrderedTrip: boolean;
  /**
   * Accommodation Geo Intelligence: true only when the customer entered accommodation text but
   * NEITHER a live geocoding provider NOR the offline keyword fallback could resolve it to a
   * real planner cluster (see accommodationLocationProvider.ts's `resolveAccommodationLocation`).
   * False whenever no accommodation was entered at all, or when it resolved successfully.
   * Optional so an old saved plan (frozen before this field existed) deserializes safely as
   * `undefined`, which every consumer treats the same as `false`. Drives a small, honest
   * "couldn't identify your accommodation" note — never blocks plan generation.
   */
  accommodationResolutionFailed?: boolean;
  /** Planner Intelligence Upgrade: true only when this exact plan was generated via "فاجئني ✨"
   * (Surprise Me), set explicitly by the Server Action -- never inferred from which interests
   * happen to be present, so a customer who manually picked the same interests Surprise Me
   * would have chosen is never mislabeled. Drives the result page showing "فاجئني ✨" instead
   * of the underlying interest labels. */
  surpriseMe: boolean;
  /**
   * Route-First Planning Upgrade: true only when at least one day in THIS generated plan has a
   * real resolved (verified or existing-project-data) route leg between two of its main stops
   * -- i.e. the route-first ordering/selection signal genuinely had real data to act on for
   * this specific plan, not just "the feature is turned on". Lets the UI show the "رتبنا يومك
   * حتى تقلّل وقت التنقل" note only when it's factually true for what the customer actually
   * got, never as a blanket marketing claim.
   */
  routeFirstApplied: boolean;
  days: V2Day[];
  /**
   * Fix Place Details Opening From Generated Plans: full `ResolvedPlace` records (the exact
   * same shape `PlaceDetailsSheet` already renders everywhere else in the Guide -- image,
   * description, address, hours, rating, official/maps links) for every place ID that appears
   * anywhere in this plan (main stops, optionalNearby, food/shopping/nightlife suggestions),
   * keyed by placeId. Built once, server-side, from the same `resolvePlannerPlace`/`resolvePlace`
   * calls this file already makes for the summaries above -- never a second copy of place data,
   * never a live guide import on the client. A place that fails to resolve simply has no entry
   * here (see `resolveStop`'s own logging) -- the client always treats a missing key as "no
   * details available" and fails gracefully, never crashes (this also keeps OLD saved plans,
   * frozen before this field existed, safe: `placeDetails` is simply undefined on them, and
   * every consumer treats that the same as an empty map).
   */
  placeDetails: Record<string, ResolvedPlace>;
};

/** Extracts `hours` the same generic way barcelonaV2DateEligibility.ts already does -- every
 * main-stop guide type (attraction/shopping/experience) optionally carries it; beaches never do. */
function getHoursForResolved(resolved: ResolvedPlace | undefined): HoursInfo | undefined {
  return resolved ? (resolved.place as { hours?: HoursInfo }).hours : undefined;
}

export function resolveStop(city: CityPlannerModule, placeId: string, score: number, placeDetails: Record<string, ResolvedPlace>, weekday?: Weekday | null, visitMode?: "outside"): V2ResolvedStop {
  const resolved = resolvePlannerPlace(placeId, city.places);
  if (resolved) {
    placeDetails[placeId] = resolved;
  } else if (process.env.NODE_ENV !== "production") {
    // Fix Place Details Opening From Generated Plans: previously this fell back to a blank
    // summary with zero logging, so a genuinely missing guide record for a main stop was
    // completely silent -- caught only by chance if someone happened to click "تفاصيل المكان"
    // (which itself did nothing at the time -- see this task's own report for the full chain).
    console.error(`Smart Planner V2: main stop "${placeId}" did not resolve against any known guide collection (attraction/beach/shopping/experience).`);
  }
  const summary: ResolvedPlaceSummary = resolved ? summarizeResolvedPlace(resolved) : { id: placeId, name: placeId, categoryLabel: "" };
  const metadata = city.metadataById(placeId);
  // Round 3A Exact-Date Hours Safety Fix: threads the day's real weekday (when known) through so
  // a weekday-conditional warning (e.g. Cathedral's Sunday note) is suppressed on a day that's
  // provably NOT that weekday -- see getBarcelonaPlannerOperationalWarnings's own doc comment.
  const warnings = city.operationalWarnings(placeId, weekday) ?? [];

  const outside = visitMode === "outside" ? city.outsideVisit?.(placeId) : undefined;
  const estimate = city.ticketEstimate;
  if (outside) {
    return { ...summary, visitDurationMinutes: outside.visitDurationMinutes, score, warnings: [], hours: outside.hours, visitMode: "outside", ...(estimate ? { ticket: { amount: 0, currency: estimate.currency } } : {}) };
  }
  const amount = estimate?.forPlace(placeId);
  return {
    ...summary,
    visitDurationMinutes: metadata?.visitDurationMinutes ?? 0,
    score,
    warnings,
    hours: getHoursForResolved(resolved),
    ...(estimate && amount !== undefined ? { ticket: { amount, currency: estimate.currency } } : {}),
  };
}

// Optional-nearby suggestions can come from attractions, food places, experiences, or
// nightlife venues (see barcelona-planner-presentation.ts's classify* functions) -- the
// suggestion's own `type` label doesn't map 1:1 onto a single guide array (e.g. "local" can be
// either an Attraction or an Experience), so this tries each in the same order
// resolvePlannerPlace already uses for main stops, plus food/nightlife. A suggestion that
// still can't be resolved is dropped rather than shown with invented/blank data.
// "shopping" last: a shopping area suggested next to a day (Prague, an unmet shopping goal) resolves from the shopping collection; every
// id that already resolves as one of the other types resolves exactly as before.
const NEARBY_RESOLUTION_ORDER: ReadyPlanPlaceType[] = ["attraction", "food", "experience", "nightlife", "shopping"];

function resolveOptionalNearby(city: CityPlannerModule, suggestion: PlannerOptionalSuggestion, placeDetails: Record<string, ResolvedPlace>): V2ResolvedNearby | null {
  for (const placeType of NEARBY_RESOLUTION_ORDER) {
    const resolved = resolvePlace(suggestion.placeId, placeType, city.places);
    if (resolved) {
      placeDetails[suggestion.placeId] = resolved;
      const amount = city.ticketEstimate?.forPlace(suggestion.placeId);
      return { ...summarizeResolvedPlace(resolved), type: suggestion.type, reason: suggestion.reason, ...(city.ticketEstimate && amount !== undefined && (placeType === "attraction" || placeType === "experience") ? { ticket: { amount, currency: city.ticketEstimate.currency } } : {}) };
    }
  }
  return null;
}

/**
 * Fix Meal-Adjacent Transport Connectors -- root cause: SmartPlannerV2Day.tsx's connector
 * lookup only ever consults `day.legs` (consecutive MAIN-STOP pairs, indexed by stopIndex) and
 * unconditionally falls back to a hardcoded unresolved leg for every other pair -- including
 * every pair touching a meal stop -- WITHOUT ever consulting the verified route table, even when
 * both the meal's real Guide placeId (see `V2MealStop.id`, always a genuine `foodPlaces[]` id,
 * never synthetic) and the adjacent place both have a genuine verified/existing-project-data
 * entry. This resolves every pair that ends up chronologically ADJACENT in the exact same
 * unified sequence the client renders (`buildUnifiedTimelineEntries` -- so a Free Time block
 * correctly breaks adjacency exactly like it does on screen), through the SAME resolver/table as
 * main-stop legs (`getBarcelonaRouteLeg`), skipping only the place-to-place pairs `day.legs`
 * already covers.
 */
/**
 * Cities with `mealLegsInTimeline`: lunch position and estimated meal starts read from the day's real timeline (no meals
 * placed yet), so the restaurants are chosen for the time the customer will actually arrive.
 */
export function mealSlotHintsFromTimeline(
  city: CityPlannerModule,
  timelineStops: TimelineStopInput[],
  legs: PlannerRouteLeg[],
  weekday: Weekday | null,
  month: number | null,
  startMinutesOverride: number | null = null
): {
  lunchAfterIndex?: number;
  breakfastStart?: number;
  lunchStart?: number;
  dinnerStart?: number;
  reuseWhenNoneLeft: boolean;
  lunchFor: (breakfast: { placeId: string; hours?: HoursInfo } | null) => { afterIndex: number; estimatedStart: number } | null;
  stopIds: readonly string[];
} {
  const legBetween = timelineLegBetween(city);
  const lunch = lunchPlacementFromTimeline(timelineStops, legs, weekday, month, true, startMinutesOverride, legBetween);
  const plain = buildBarcelonaDayTimeline(timelineStops, legs, [], weekday, month, startMinutesOverride, legBetween);
  const lunchExtra = lunch ? MEAL_ASSUMED_DURATION_MINUTES.lunch + 2 * 25 : 0;
  const dinnerStart = Math.max(city.mealStops.flexibleMeals?.dinnerEarliest ?? MEAL_TARGET_WINDOW.dinner.earliest, Math.ceil((plain.dayEndMinutes + lunchExtra + 25) / 15) * 15);
  return {
    lunchAfterIndex: lunch?.afterIndex,
    // Breakfast places must be open by 9:00 (the rule the breakfast list was chosen by); the timeline then starts breakfast at
    // 8:00 or at the place's opening, whichever is later.
    breakfastStart: startMinutesOverride ?? 9 * 60,
    lunchStart: lunch?.estimatedStart,
    dinnerStart,
    reuseWhenNoneLeft: true,
    lunchFor: (breakfast) => lunchPlacementFromTimeline(timelineStops, legs, weekday, month, breakfast ?? false, startMinutesOverride, legBetween),
    stopIds: timelineStops.map((stop) => stop.placeId),
  };
}

/**
 * Places with a show window (metadata `showWindow`): a stop scheduled outside the window carries the place's own note (and loses
 * it again when an edit moves it into the window). Other stops are returned unchanged.
 */
export function withShowWindowNotes(city: CityPlannerModule, stops: V2ResolvedStop[], timeline: DayTimeline): V2ResolvedStop[] {
  return stops.map((stop, i) => {
    const show = city.metadataById(stop.id)?.showWindow;
    if (!show) return stop;
    const warnings = stop.warnings.filter((w) => w.textAr !== show.missNoteAr);
    const window = timeline.stops[i];
    const missed = !!window && !startsInShowWindow(window.startMinutes, show);
    return { ...stop, warnings: missed ? [...warnings, { textAr: show.missNoteAr }] : warnings };
  });
}

export function buildMealAdjacentLegs(city: CityPlannerModule, day: V2Day): Record<string, PlannerRouteLeg> {
  const entries = buildUnifiedTimelineEntries(day);
  const idOf = (entry: UnifiedTimelineEntry): string | null => (entry.kind === "place" ? entry.place.id : entry.kind === "meal" ? entry.meal.id : null);

  const legs: Record<string, PlannerRouteLeg> = {};
  for (let i = 0; i < entries.length - 1; i++) {
    const entry = entries[i];
    const next = entries[i + 1];
    if (entry.kind === "freeTime" || next.kind === "freeTime") continue;
    if (entry.kind === "place" && next.kind === "place" && next.stopIndex === entry.stopIndex + 1) continue; // already covered by day.legs
    const fromId = idOf(entry);
    const toId = idOf(next);
    if (!fromId || !toId) continue;
    // A lunch break is taken where the stop before it is: no leg to it, and from it the leg of that stop to the next place.
    if (toId === LUNCH_BREAK_ID) continue;
    if (fromId === LUNCH_BREAK_ID) {
      const previous = entries.slice(0, i).reverse().find((e) => e.kind === "place");
      const previousId = previous && previous.kind === "place" ? previous.place.id : null;
      if (previousId) legs[`${fromId}::${toId}`] = city.routeLeg(previousId, toId);
      continue;
    }
    legs[`${fromId}::${toId}`] = city.routeLeg(fromId, toId);
  }
  return legs;
}

export function resolveV2Plan(
  city: CityPlannerModule,
  daysRequested: number,
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  presentedPlan: PresentedPlannerPlan,
  arrivalDate: string | null,
  v2Interests: V2PlannerInterest[],
  accommodationOrderedTrip: boolean,
  surpriseMe: boolean,
  accommodationResolutionFailed = false,
  /** Timing guard only: food places not to use as a meal on a given day number (they would run past closing). */
  mealExclusionsByDay?: Readonly<Record<number, readonly string[]>>
): V2Plan {
  const daysGenerated = plan.days.length;

  // Shared across the whole plan -- seeded with every main-stop placeId up front so
  // optionalNearby/supplementary picks can never collide with a real itinerary stop (including
  // a newly-promoted V2-only main-stop candidate).
  const usedPlaceIds = new Set<string>(plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId)));

  // Fix Place Details Opening From Generated Plans: accumulated across every day/item kind as
  // resolution happens below, then attached to the returned V2Plan -- see V2Plan.placeDetails's
  // own doc comment.
  const placeDetails: Record<string, ResolvedPlace> = {};

  // Make Food Interest Affect The Actual Itinerary: shared across the whole plan so meal-stop
  // cuisine variety is nudged trip-wide, not reset every day -- see buildBarcelonaMealStopsForDay's
  // own doc comment.
  const usedFoodCategoryIds = new Set<string>();

  const mealStopCity: MealStopCityContext = {
    foodPlaces: city.places.foodPlaces,
    foodCategories: city.places.foodCategories,
    clusterCompatibility: city.destinationConfig.dayBuilderConfig.clusterCompatibility,
    rules: city.mealStops,
    ...((city.strictMealSelection ?? city.timingGuard) ? { strictMealHours: true } : {}),
    ...(city.mealLegsInTimeline ? { travelMinutes: (from: string, to: string) => legMidMinutes(city, from, to) } : {}),
  };

  const days: V2Day[] = plan.days.map((day, index) => {
    const presentation = presentedPlan.byDay[index];
    const dateForDay = arrivalDate ? addDaysToIsoDate(arrivalDate, day.dayNumber - 1) : null;
    const weekday = dateForDay ? (weekdayOfIsoDate(dateForDay) ?? undefined) : undefined;
    // Surprise Me Quality V2, Part C: real calendar month, when a real date is known, so the
    // Timeline Resolver can use a conservative seasonal sunset window for "sunset"-bucketed stops
    // (e.g. sunset-catamaran-sail) instead of a fixed generic one. `null` in flexible mode --
    // buildBarcelonaDayTimeline falls back to its existing generic floor in that case.
    const month = dateForDay ? Number(dateForDay.slice(5, 7)) : null;

    // Make Food Interest Affect The Actual Itinerary: real scheduled meal stops, computed from
    // this day's ALREADY-FINAL clusters/stop count (after Day Builder + Natural Reclaim +
    // Cross-Day) -- BEFORE optionalNearby/the generic supplementary layer below, so a real
    // scheduled meal (the whole point of this task) always gets first claim on a food place a
    // day's own geography supports, rather than losing it to the older, lower-visibility "نزديك"
    // chip suggestions (`optionalNearby` already independently suggests nearby food places tied
    // to a day's theme -- e.g. "مناسب بعد جولة Montjuïc" -- and previously ran first, silently
    // consuming the exact same venue this feature needed).
    // Timeline Final Customer-Experience Polish: per-stop clusters IN ORDER (not the day's
    // aggregated/de-duplicated cluster set) -- lets buildBarcelonaMealStopsForDay judge each meal
    // slot against the specific stops immediately before/after it, not "any cluster this day
    // happens to touch somewhere" (see that function's own doc comment for the detour it fixes).
    const stopClusters = day.stops.map((stop) => city.metadataById(stop.placeId)?.cluster ?? "");
    // Timing guard: a food place excluded for this day is treated as used for this day's meal choice only.
    const excludedToday = (mealExclusionsByDay?.[day.dayNumber] ?? []).filter((id) => !usedPlaceIds.has(id));
    for (const id of excludedToday) usedPlaceIds.add(id);
    const stopVisitMinutes = city.mealStops.lunchByClock ? day.stops.map((stop) => (stop.visitMode === "outside" ? city.outsideVisit?.(stop.placeId)?.visitDurationMinutes : undefined) ?? city.metadataById(stop.placeId)?.visitDurationMinutes ?? 60) : undefined;
    // Cities with `mealLegsInTimeline`: the stops are resolved first so lunch can be placed from the real timeline.
    const earlyStops = city.mealLegsInTimeline ? day.stops.map((stop) => resolveStop(city, stop.placeId, stop.score, placeDetails, weekday ?? null, stop.visitMode)) : null;
    const slotHints = earlyStops
      ? mealSlotHintsFromTimeline(
          city,
          day.stops.map((stop, i) => ({ placeId: stop.placeId, visitDurationMinutes: earlyStops[i].visitDurationMinutes, hours: earlyStops[i].hours, preferredTime: city.metadataById(stop.placeId)?.preferredTime ?? "anytime", arrivalBufferMinutes: earlyStops[i].visitMode === "outside" ? undefined : city.metadataById(stop.placeId)?.arrivalBufferMinutes, showWindow: city.metadataById(stop.placeId)?.showWindow })),
          legsByDay[index] ?? [],
          weekday ?? null,
          month
        )
      : undefined;
    const mealStopsAll = buildMealStopsForDay(mealStopCity, stopClusters, weekday ?? null, v2Interests, usedPlaceIds, usedFoodCategoryIds, surpriseMe, stopVisitMinutes, slotHints);
    // Cities with flexibleMeals: breakfast is a suggestion, not a timed stop (the day starts at the first visit).
    const breakfastSuggestion = city.mealStops.flexibleMeals ? mealStopsAll.find((meal) => meal.mealType === "breakfast") : undefined;
    const mealStops = breakfastSuggestion ? mealStopsAll.filter((meal) => meal !== breakfastSuggestion) : mealStopsAll;
    for (const id of excludedToday) if (!mealStops.some((meal) => meal.id === id)) usedPlaceIds.delete(id);
    for (const meal of mealStops) {
      const resolved = resolvePlace(meal.id, "food", city.places);
      if (resolved) placeDetails[meal.id] = resolved;
    }

    // `presentation.optionalNearby` was decided earlier (barcelona-planner-presentation.ts's own
    // independent pass, before this function ever runs) and has no knowledge of which venue a
    // meal stop just claimed above -- filtered here so the SAME restaurant never renders twice
    // (once as a real scheduled meal card, once again as a "قريب منك" chip).
    const optionalNearby = (presentation?.optionalNearby ?? [])
      .filter((suggestion) => !usedPlaceIds.has(suggestion.placeId))
      .map((suggestion) => resolveOptionalNearby(city, suggestion, placeDetails))
      .filter((entry): entry is V2ResolvedNearby => entry !== null);
    for (const nearby of optionalNearby) usedPlaceIds.add(nearby.id);
    if (breakfastSuggestion) {
      const entry = resolveOptionalNearby(city, { placeId: breakfastSuggestion.id, type: "food", reason: "فطور اختياري قريب من أول محطة (قبل ما تبلّش يومك)" }, placeDetails);
      if (entry) optionalNearby.unshift(entry);
    }

    // Cities with `coffeeBreakCategories`: one optional coffee break per day, a café in (or right next to) the area of the day's
    // middle stops, open that day and at 15:00 when that can be checked, never one already used in the trip. Shown with the
    // other optional suggestions; nothing is scheduled.
    const coffeeCategories = city.mealStops.coffeeBreakCategories;
    if (coffeeCategories?.length && day.stops.length > 0) {
      const middle = stopClusters[Math.floor((stopClusters.length - 1) / 2)];
      const fit = (cluster: string) => (stopClusters.includes(cluster) ? (cluster === middle ? 3 : 2) : stopClusters.some((c) => { const level = mealStopCity.clusterCompatibility[c]?.[cluster] ?? mealStopCity.clusterCompatibility[cluster]?.[c]; return level === "strong"; }) ? 1 : 0);
      const insideStop = city.mealStops.insideStop ?? {};
      const cafe = city.places.foodPlaces
        .filter((place) => coffeeCategories.includes(place.categoryId) && !usedPlaceIds.has(place.id))
        .filter((place) => !insideStop[place.id] || day.stops.some((stop) => stop.placeId === insideStop[place.id]))
        .map((place) => ({ place, cluster: city.mealStops.clusterForFoodPlace(place) }))
        .filter((entry): entry is { place: typeof entry.place; cluster: string } => !!entry.cluster && fit(entry.cluster) > 0)
        .filter(({ place }) => !weekday || !isPlaceClosedOnWeekday(place.hours, weekday))
        .filter(({ place }) => { const open = findCoveringInterval(place.hours, weekday ?? null, 15 * 60); return open !== null || !weekday; })
        .sort((a, b) => fit(b.cluster) - fit(a.cluster) || a.place.id.localeCompare(b.place.id))[0];
      if (cafe) {
        const entry = resolveOptionalNearby(city, { placeId: cafe.place.id, type: "cafe", reason: "استراحة قهوة اختيارية قريبة من مسارك" }, placeDetails);
        if (entry) {
          optionalNearby.push(entry);
          usedPlaceIds.add(cafe.place.id);
        }
      }
    }

    // A day that already got real scheduled meal stops doesn't also need the generic "اقتراحات
    // أكل" strip -- passing an interest list with "food" removed for THIS call only (never
    // mutating the real `v2Interests`) reuses buildBarcelonaSupplementaryForDay's own existing
    // interest gate to skip food suggestions, without touching that file or wasting a food
    // candidate that was never going to be shown.
    const supplementaryInterests = mealStops.length > 0 ? v2Interests.filter((interest) => interest !== "food") : v2Interests;
    const supplementary = buildSupplementaryForDay(city.places, weekday ?? null, supplementaryInterests, usedPlaceIds);
    // Supplementary items already resolved once inside buildBarcelonaSupplementaryForDay to
    // build their summaries -- re-resolving here (same pure, side-effect-free `resolvePlace`
    // call) only to also capture the full record is cheaper and less invasive than changing
    // that function's return shape for every one of its other callers.
    for (const food of supplementary.food) {
      const resolved = resolvePlace(food.id, "food", city.places);
      if (resolved) placeDetails[food.id] = resolved;
    }
    for (const shop of supplementary.shopping) {
      const resolved = resolvePlace(shop.id, "shopping", city.places);
      if (resolved) placeDetails[shop.id] = resolved;
    }
    for (const venue of supplementary.nightlife) {
      const resolved = resolvePlace(venue.id, "nightlife", city.places);
      if (resolved) placeDetails[venue.id] = resolved;
    }

    // Density is computed from main stops only -- deliberately BEFORE food/shopping/nightlife
    // are added above, and never derived from them (they're supplementary, never counted here).
    // Meal stops are equally excluded -- see mealStops' own doc comment on V2Day.
    const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
    const resolvedStops = day.stops.map((stop) => resolveStop(city, stop.placeId, stop.score, placeDetails, weekday ?? null, stop.visitMode));
    const legs = legsByDay[index] ?? [];

    // Build Real Daily Timeline: computed from this day's ALREADY-FINAL stops/legs/mealStops --
    // see barcelonaV2Timeline.ts's own header for the full honesty rules (real hours are a hard
    // constraint only when verified + the weekday is known; an unresolved leg never receives an
    // invented duration). `preferredTime` is looked up directly (not carried on V2ResolvedStop --
    // no other consumer needs it) purely to pick a sensible day-start bucket for the first stop.
    const timelineStops: TimelineStopInput[] = day.stops.map((stop, i) => ({
      placeId: stop.placeId,
      visitDurationMinutes: resolvedStops[i].visitDurationMinutes,
      hours: resolvedStops[i].hours,
      preferredTime: city.metadataById(stop.placeId)?.preferredTime ?? "anytime",
      // The arrival margin is for a guided tour / ticketed entry; an outside-only stop has neither.
      arrivalBufferMinutes: resolvedStops[i].visitMode === "outside" ? undefined : city.metadataById(stop.placeId)?.arrivalBufferMinutes,
      showWindow: city.metadataById(stop.placeId)?.showWindow,
    }));
    const timelineMeals: TimelineMealInput[] = mealStops.map((meal) => ({
      placeId: meal.id,
      mealType: meal.mealType,
      afterStopIndex: meal.afterStopIndex,
      hours: meal.hours,
      ...(meal.optional ? { optional: true } : {}),
      ...(meal.earliestStart !== undefined ? { earliestStart: meal.earliestStart } : {}),
    }));
    const timeline = buildBarcelonaDayTimeline(timelineStops, legs, timelineMeals, weekday ?? null, month, null, timelineLegBetween(city));

    const notedStops = withShowWindowNotes(city, resolvedStops, timeline);
    const resolvedDay: V2Day = {
      dayNumber: day.dayNumber,
      actualDate: dateForDay ?? undefined,
      weekday,
      title: presentation?.title ?? `اليوم ${day.dayNumber}`,
      summary: presentation?.summary ?? "",
      highlight: presentation?.highlight,
      totalVisitMinutes: day.totalVisitMinutes,
      density,
      clusters: day.clusters,
      stops: notedStops,
      legs,
      optionalNearby,
      mealStops,
      foodSuggestions: supplementary.food,
      shoppingSuggestions: supplementary.shopping,
      nightlifeSuggestions: supplementary.nightlife,
      timeline,
    };
    // Fix Meal-Adjacent Transport Connectors: computed from the day object above (needs its
    // final stops/mealStops/timeline to reproduce the client's own chronological adjacency).
    return { ...resolvedDay, mealLegs: buildMealAdjacentLegs(city, resolvedDay) };
  });

  const capacityWarning = daysGenerated < daysRequested ? city.capacityWarning(daysGenerated) : null;

  const densitySummary = buildDensitySummary(days.map((day) => ({ dayNumber: day.dayNumber, density: day.density })));

  return {
    destination: city.id,
    daysRequested,
    daysGenerated,
    capacityWarning,
    densityWarning: densitySummary?.message ?? null,
    accommodationOrderedTrip,
    accommodationResolutionFailed,
    surpriseMe,
    // Only real route data counts here (verified / existing project data) -- a distance-based estimate never claims it.
    routeFirstApplied: days.some((day) => day.legs.some((leg) => leg.sourceStatus === "verified" || leg.sourceStatus === "existing-project-data")),
    days,
    placeDetails,
  };
}

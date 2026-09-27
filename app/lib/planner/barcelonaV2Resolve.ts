import "server-only";
import { resolvePlace, resolvePlannerPlace, summarizeResolvedPlace, type ResolvedPlace, type ResolvedPlaceSummary } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";
import { getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { getBarcelonaPlannerOperationalWarnings, type PlannerOperationalWarning } from "./barcelonaPlannerOperationalWarnings";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import { buildBarcelonaSupplementaryForDay, type V2FoodSuggestion, type V2ShoppingSuggestion, type V2NightlifeSuggestion } from "./barcelonaV2Supplementary";
import { buildBarcelonaMealStopsForDay, type V2MealStop } from "./barcelonaV2MealStops";
import { classifyDayDensity, buildDensitySummary, type PlannerDayDensity } from "./barcelonaV2Density";
import { buildBarcelonaDayTimeline, type DayTimeline, type TimelineStopInput, type TimelineMealInput } from "./barcelonaV2Timeline";
import { getBarcelonaRouteLeg } from "./barcelona-planner-route-legs";
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
};

export type V2ResolvedNearby = ResolvedPlaceSummary & {
  type: PlannerOptionalSuggestion["type"];
  reason?: string;
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
  destination: "barcelona";
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

function resolveStop(placeId: string, score: number, placeDetails: Record<string, ResolvedPlace>, weekday?: Weekday | null): V2ResolvedStop {
  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
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
  const metadata = getBarcelonaV2PlannerMetadataById(placeId);
  // Round 3A Exact-Date Hours Safety Fix: threads the day's real weekday (when known) through so
  // a weekday-conditional warning (e.g. Cathedral's Sunday note) is suppressed on a day that's
  // provably NOT that weekday -- see getBarcelonaPlannerOperationalWarnings's own doc comment.
  const warnings = getBarcelonaPlannerOperationalWarnings(placeId, weekday) ?? [];

  return {
    ...summary,
    visitDurationMinutes: metadata?.visitDurationMinutes ?? 0,
    score,
    warnings,
    hours: getHoursForResolved(resolved),
  };
}

// Optional-nearby suggestions can come from attractions, food places, experiences, or
// nightlife venues (see barcelona-planner-presentation.ts's classify* functions) -- the
// suggestion's own `type` label doesn't map 1:1 onto a single guide array (e.g. "local" can be
// either an Attraction or an Experience), so this tries each in the same order
// resolvePlannerPlace already uses for main stops, plus food/nightlife. A suggestion that
// still can't be resolved is dropped rather than shown with invented/blank data.
const NEARBY_RESOLUTION_ORDER: ReadyPlanPlaceType[] = ["attraction", "food", "experience", "nightlife"];

function resolveOptionalNearby(suggestion: PlannerOptionalSuggestion, placeDetails: Record<string, ResolvedPlace>): V2ResolvedNearby | null {
  for (const placeType of NEARBY_RESOLUTION_ORDER) {
    const resolved = resolvePlace(suggestion.placeId, placeType, barcelonaGuide);
    if (resolved) {
      placeDetails[suggestion.placeId] = resolved;
      return { ...summarizeResolvedPlace(resolved), type: suggestion.type, reason: suggestion.reason };
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
function buildMealAdjacentLegs(day: V2Day): Record<string, PlannerRouteLeg> {
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
    legs[`${fromId}::${toId}`] = getBarcelonaRouteLeg(fromId, toId);
  }
  return legs;
}

export function resolveBarcelonaV2Plan(
  daysRequested: number,
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  presentedPlan: PresentedPlannerPlan,
  arrivalDate: string | null,
  v2Interests: V2PlannerInterest[],
  accommodationOrderedTrip: boolean,
  surpriseMe: boolean,
  accommodationResolutionFailed = false
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
    const stopClusters = day.stops.map((stop) => getBarcelonaV2PlannerMetadataById(stop.placeId)?.cluster ?? "");
    const mealStops = buildBarcelonaMealStopsForDay(stopClusters, weekday ?? null, v2Interests, usedPlaceIds, usedFoodCategoryIds, surpriseMe);
    for (const meal of mealStops) {
      const resolved = resolvePlace(meal.id, "food", barcelonaGuide);
      if (resolved) placeDetails[meal.id] = resolved;
    }

    // `presentation.optionalNearby` was decided earlier (barcelona-planner-presentation.ts's own
    // independent pass, before this function ever runs) and has no knowledge of which venue a
    // meal stop just claimed above -- filtered here so the SAME restaurant never renders twice
    // (once as a real scheduled meal card, once again as a "قريب منك" chip).
    const optionalNearby = (presentation?.optionalNearby ?? [])
      .filter((suggestion) => !usedPlaceIds.has(suggestion.placeId))
      .map((suggestion) => resolveOptionalNearby(suggestion, placeDetails))
      .filter((entry): entry is V2ResolvedNearby => entry !== null);
    for (const nearby of optionalNearby) usedPlaceIds.add(nearby.id);

    // A day that already got real scheduled meal stops doesn't also need the generic "اقتراحات
    // أكل" strip -- passing an interest list with "food" removed for THIS call only (never
    // mutating the real `v2Interests`) reuses buildBarcelonaSupplementaryForDay's own existing
    // interest gate to skip food suggestions, without touching that file or wasting a food
    // candidate that was never going to be shown.
    const supplementaryInterests = mealStops.length > 0 ? v2Interests.filter((interest) => interest !== "food") : v2Interests;
    const supplementary = buildBarcelonaSupplementaryForDay(weekday ?? null, supplementaryInterests, usedPlaceIds);
    // Supplementary items already resolved once inside buildBarcelonaSupplementaryForDay to
    // build their summaries -- re-resolving here (same pure, side-effect-free `resolvePlace`
    // call) only to also capture the full record is cheaper and less invasive than changing
    // that function's return shape for every one of its other callers.
    for (const food of supplementary.food) {
      const resolved = resolvePlace(food.id, "food", barcelonaGuide);
      if (resolved) placeDetails[food.id] = resolved;
    }
    for (const shop of supplementary.shopping) {
      const resolved = resolvePlace(shop.id, "shopping", barcelonaGuide);
      if (resolved) placeDetails[shop.id] = resolved;
    }
    for (const venue of supplementary.nightlife) {
      const resolved = resolvePlace(venue.id, "nightlife", barcelonaGuide);
      if (resolved) placeDetails[venue.id] = resolved;
    }

    // Density is computed from main stops only -- deliberately BEFORE food/shopping/nightlife
    // are added above, and never derived from them (they're supplementary, never counted here).
    // Meal stops are equally excluded -- see mealStops' own doc comment on V2Day.
    const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
    const resolvedStops = day.stops.map((stop) => resolveStop(stop.placeId, stop.score, placeDetails, weekday ?? null));
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
      preferredTime: getBarcelonaV2PlannerMetadataById(stop.placeId)?.preferredTime ?? "anytime",
    }));
    const timelineMeals: TimelineMealInput[] = mealStops.map((meal) => ({
      placeId: meal.id,
      mealType: meal.mealType,
      afterStopIndex: meal.afterStopIndex,
      hours: meal.hours,
    }));
    const timeline = buildBarcelonaDayTimeline(timelineStops, legs, timelineMeals, weekday ?? null, month);

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
      stops: resolvedStops,
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
    return { ...resolvedDay, mealLegs: buildMealAdjacentLegs(resolvedDay) };
  });

  const capacityWarning =
    daysGenerated < daysRequested
      ? `قدرنا نبني خطة قوية لـ ${daysGenerated} أيام من البيانات المتاحة حاليًا لبرشلونة. عم نوسّع المحتوى للأيام الأطول.`
      : null;

  const densitySummary = buildDensitySummary(days.map((day) => ({ dayNumber: day.dayNumber, density: day.density })));

  return {
    destination: "barcelona",
    daysRequested,
    daysGenerated,
    capacityWarning,
    densityWarning: densitySummary?.message ?? null,
    accommodationOrderedTrip,
    accommodationResolutionFailed,
    surpriseMe,
    routeFirstApplied: days.some((day) => day.legs.some((leg) => leg.sourceStatus !== "unresolved")),
    days,
    placeDetails,
  };
}

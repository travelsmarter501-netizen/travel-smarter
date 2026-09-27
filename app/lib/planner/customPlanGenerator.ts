import { barcelonaGuide } from "../barcelona-guide";
import type { DestinationGuideContent, FoodPlace, NightlifeVenue, DietaryTag } from "../guideTypes";
import type { HoursInfo, Weekday } from "../hours";
import type {
  TravelerType,
  FoodPreference,
  NightlifeType,
  TripPace,
  BudgetStyle,
} from "../customPlanRequest";
import type { CustomPlanDraftDay, CustomPlanDraftPlanData, CustomPlanDraftStop } from "../customPlanDraft";
import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";
import { rankPlaces, diversifyRankedPlaces } from "./plannerScoring";
import type { PlannerInterest, PlannerPlaceMetadata, PlannerPreferences } from "./plannerTypes";
import { resolvePlannerPlace, type ResolvedPlace } from "../readyPlan";
import { matchMustVisitText } from "./customPlanMustVisitMatcher";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";

/**
 * Custom Plan Admin Builder V1 -- deterministic itinerary generation for the admin's
 * "إنشاء مسودة" button. Output is ALWAYS a draft for human review, never shown to the
 * customer directly (see the task's own "This task ends at approved admin draft" scope).
 *
 * Deliberately NOT a copy of the Smart Planner's generateBarcelonaSmartPlan pipeline (Day
 * Builder + Route Optimizer + transport legs + cluster-compatibility/similarity-group/
 * coverage-goal config) -- that pipeline is tightly bound to a fixed 3-day, no-date,
 * no-pace, no-budget shape and is intentionally rigid (see plannerDayBuilder.ts). This module
 * instead reuses only the truly generic/reusable pieces (rankPlaces/diversifyRankedPlaces
 * from plannerScoring.ts, the PlannerPlaceMetadata catalog, resolvePlannerPlace) and writes
 * its own simpler, more flexible day-distribution pass on top -- 3/5/7 days, real dates
 * (closed-day avoidance), pace-driven minute budgets, food/nightlife suggestions, must-visit
 * free-text matching, family/children awareness, and a light accommodation-cluster nudge --
 * per the task's own "Custom Plan generator should be more flexible... less rigid scoring
 * than Smart Planner" requirement.
 *
 * No AI, no ChatGPT API, no invented places -- every stop is either a real
 * PlannerPlaceMetadata-backed Barcelona Guide place (for "visit" stops) or a real
 * foodPlaces/nightlifeVenues guide entry (for suggestion stops).
 */

export type CustomPlanGenerationInput = {
  requestId: string;
  durationDays: number;
  arrivalDate: string | null;
  accommodation: string | null;
  travelerType: TravelerType | null;
  hasChildren: boolean | null;
  /** Legacy 10-key values on a pre-V2 request, current 8-key V2PlannerInterest values on a
   * new one (see customPlanRequest.ts's own header comment) -- loosely typed as string[]
   * since a single column now legitimately holds either model's keys. */
  interests: string[];
  mustVisit: string | null;
  foodPreferences: FoodPreference[];
  nightlifeTypes: NightlifeType[];
  pace: TripPace | null;
  budgetStyle: BudgetStyle | null;
};

// ── Interest mapping (legacy CustomPlanInterest OR current V2PlannerInterest key -> PlannerInterest) ─
// Covers both the original 10 legacy keys AND the current 8 V2 keys (6 of which already share
// the exact same string as their legacy counterpart -- popular/natureViews/food/shopping/
// beachRelax/nightlife -- so only cultureHistory/footballExperiences needed adding on top of
// the original legacy-only map). "photography" and "uniqueExperiences" (legacy-only) still
// have no PlannerInterest equivalent and are deliberately dropped from scoring (V1 gap, not a
// bug) -- a future task could bias photoSpots/experiences selection for them specifically.
const CUSTOM_PLAN_TO_PLANNER_INTEREST: Partial<Record<string, PlannerInterest>> = {
  popular: "popular",
  cultureLocal: "cultureLocal",
  cultureHistory: "cultureLocal", // V2PlannerInterest key for the same underlying legacy interest
  natureViews: "viewsNature",
  beachRelax: "beachRelax",
  footballSports: "footballExperiences",
  footballExperiences: "footballExperiences", // V2PlannerInterest key
  food: "foodShoppingNightlife",
  shopping: "foodShoppingNightlife",
  nightlife: "foodShoppingNightlife",
};

function mapToPlannerInterests(interests: string[]): PlannerInterest[] {
  const mapped = new Set<PlannerInterest>();
  for (const interest of interests) {
    const planner = CUSTOM_PLAN_TO_PLANNER_INTEREST[interest];
    if (planner) mapped.add(planner);
  }
  if (mapped.size === 0) mapped.add("popular"); // scoring requires >=1 interest
  return [...mapped];
}

// ── Pace -> daily visit-time budget (minutes, excluding transport) ────────────────────────
// No pace-driven minute budget exists anywhere in the Smart Planner (confirmed) -- these
// numbers are new, matching the task's own suggested values exactly (packed = the "active" tier).
const PACE_MINUTES_PER_DAY: Record<TripPace, number> = {
  relaxed: 300,
  balanced: 420,
  packed: 540,
};

function minutesBudgetForPace(pace: TripPace | null): number {
  return PACE_MINUTES_PER_DAY[pace ?? "balanced"];
}

// ── Date -> actual date / weekday, for closed-day avoidance and the draft's own `date` field
// (Smart Planner has zero date-awareness) -- uses dateOnly.ts's UTC-anchored arithmetic, the
// same primitive customPlanRequests.ts uses to derive the authoritative duration, rather than
// raw local-time `Date` math (which can drift a calendar day depending on the runtime's
// timezone/DST, exactly the class of bug dateOnly.ts exists to make impossible).
function actualDateForDayOffset(arrivalDate: string | null, dayOffsetFromZero: number): string | null {
  if (!arrivalDate) return null;
  return addDaysToIsoDate(arrivalDate, dayOffsetFromZero);
}

function weekdayForDayOffset(arrivalDate: string | null, dayOffsetFromZero: number): Weekday | null {
  const actualDate = actualDateForDayOffset(arrivalDate, dayOffsetFromZero);
  return actualDate ? weekdayOfIsoDate(actualDate) : null;
}

function getHoursForResolvedPlace(resolved: ResolvedPlace): HoursInfo | undefined {
  return (resolved.place as { hours?: HoursInfo }).hours;
}

/** Only a `fixed`-schedule place with a missing/empty day is treated as "closed that day".
 * `variable`/`event`/`always-open` hours can't be checked this way (no per-weekday
 * schedule) -- never assumed closed. `temporarily-closed` is always excluded. Missing hours
 * entirely (undefined) is never assumed closed either -- absence of data is not evidence. */
function isClosedOnWeekday(hours: HoursInfo | undefined, weekday: Weekday): boolean {
  if (!hours) return false;
  if (hours.type === "temporarily-closed") return true;
  if (hours.type !== "fixed") return false;
  const intervals = hours.schedule[weekday];
  return !intervals || intervals.length === 0;
}

function formatClock(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// ── Light accommodation nudge (V1: cluster-name substring match only, never guessed) ──────
function normalizeSimple(text: string): string {
  return text.toLowerCase().trim();
}

function detectAccommodationCluster(accommodation: string | null, allPlaces: PlannerPlaceMetadata[]): string | null {
  if (!accommodation) return null;
  const normalized = normalizeSimple(accommodation);
  if (!normalized) return null;
  const clusters = [...new Set(allPlaces.map((place) => place.cluster))];
  return clusters.find((cluster) => normalized.includes(cluster.replace(/-/g, " ")) || normalized.includes(cluster.replace(/-/g, ""))) ?? null;
}

// ── Main "visit" stop distribution across days ──────────────────────────────────────────
function buildVisitDays(params: {
  durationDays: number;
  minutesPerDay: number;
  arrivalDate: string | null;
  matchedMustVisitIds: string[];
  plannerInterests: PlannerInterest[];
  accommodation: string | null;
}): CustomPlanDraftDay[] {
  const allPlaces = getBarcelonaPlannerPlaces();
  const preferences: PlannerPreferences = { interests: params.plannerInterests };
  const ranked = rankPlaces(allPlaces, preferences);
  const diversified = diversifyRankedPlaces(ranked, allPlaces.length);

  const mustVisitSet = new Set(params.matchedMustVisitIds);
  const accommodationCluster = detectAccommodationCluster(params.accommodation, allPlaces);

  const mustVisitFirst = diversified.filter((p) => mustVisitSet.has(p.placeId));
  const rest = diversified.filter((p) => !mustVisitSet.has(p.placeId));
  const nudgedRest = accommodationCluster
    ? [...rest].sort((a, b) => {
        const aMatch = a.metadata.cluster === accommodationCluster ? 0 : 1;
        const bMatch = b.metadata.cluster === accommodationCluster ? 0 : 1;
        return aMatch - bMatch;
      })
    : rest;

  const orderedCandidates = [...mustVisitFirst, ...nudgedRest];

  const usedPlaceIds = new Set<string>();
  const days: CustomPlanDraftDay[] = [];
  let candidateIndex = 0;

  for (let dayNumber = 1; dayNumber <= params.durationDays; dayNumber++) {
    const weekday = weekdayForDayOffset(params.arrivalDate, dayNumber - 1);
    const stops: CustomPlanDraftStop[] = [];
    let minutesUsed = 0;
    let clockMinutes = 9 * 60;

    while (candidateIndex < orderedCandidates.length) {
      const candidate = orderedCandidates[candidateIndex];

      if (usedPlaceIds.has(candidate.placeId)) {
        candidateIndex++;
        continue;
      }

      const resolved = resolvePlannerPlace(candidate.placeId, barcelonaGuide);
      if (!resolved) {
        // Metadata references a place with no matching guide entry -- skip defensively,
        // never crash (mirrors resolvePlannerPlace's own "silently vanish" precedent note).
        candidateIndex++;
        continue;
      }

      if (weekday && isClosedOnWeekday(getHoursForResolvedPlace(resolved), weekday)) {
        candidateIndex++;
        continue;
      }

      const duration = candidate.metadata.visitDurationMinutes;
      if (stops.length > 0 && minutesUsed + duration > params.minutesPerDay) {
        break; // day is full -- move to the next day, candidateIndex NOT advanced (revisited next day)
      }

      stops.push({
        placeId: candidate.placeId,
        title: resolved.place.name,
        kind: "visit",
        startTime: formatClock(clockMinutes),
        durationMinutes: duration,
        adminNote: null,
        customerNote: null,
      });
      usedPlaceIds.add(candidate.placeId);
      minutesUsed += duration;
      clockMinutes += duration + 30; // flat 30-minute inter-stop buffer, V1 simplification
      candidateIndex++;
    }

    days.push({ dayNumber, date: actualDateForDayOffset(params.arrivalDate, dayNumber - 1), title: `اليوم ${dayNumber}`, summary: "", stops });
  }

  return days;
}

// ── Food / nightlife suggestions (unlike Smart Planner, Custom Plan includes these) ───────
const FOOD_PREFERENCE_DIETARY_TAGS: Partial<Record<FoodPreference, DietaryTag[]>> = {
  vegetarian: ["vegetarian", "vegan"],
  breakfastCafes: ["coffee"],
};

function scoreFoodPlace(place: FoodPlace, preferences: FoodPreference[], budgetStyle: BudgetStyle | null): number {
  let score = 0;
  if (place.badges?.includes("best-overall")) score += 3;
  if (place.badges?.includes("popular")) score += 2;
  if (place.badges?.includes("great-value")) score += 1;
  if (typeof place.rating === "number") score += place.rating;

  for (const preference of preferences) {
    if (preference === "porkFree" || preference === "halal") {
      // Best-effort only -- not a certified halal filter, just deprioritizes a "may contain
      // pork" tag when the customer asked to avoid it.
      if (place.dietaryTags.includes("pork-maybe")) score -= 100;
    } else if (preference === "budgetFriendly") {
      if (place.priceLevel === "$") score += 3;
    } else if (preference === "fineDining") {
      if (place.priceLevel === "$$$") score += 3;
    } else {
      const tags = FOOD_PREFERENCE_DIETARY_TAGS[preference];
      if (tags?.some((tag) => place.dietaryTags.includes(tag))) score += 3;
    }
  }

  if (budgetStyle === "budget" && place.priceLevel === "$") score += 2;
  if (budgetStyle === "mid" && place.priceLevel === "$$") score += 2;
  if (budgetStyle === "premium" && place.priceLevel === "$$$") score += 2;

  return score;
}

function pickBestFoodPlace(candidates: FoodPlace[], preferences: FoodPreference[], budgetStyle: BudgetStyle | null, usedPlaceIds: Set<string>): FoodPlace | null {
  const available = candidates.filter((place) => !usedPlaceIds.has(place.id));
  if (available.length === 0) return null;
  const scored = available.map((place) => ({ place, score: scoreFoodPlace(place, preferences, budgetStyle) }));
  scored.sort((a, b) => b.score - a.score || a.place.id.localeCompare(b.place.id));
  return scored[0].place;
}

const NIGHTLIFE_TYPE_KEYWORDS: Record<NightlifeType, string[]> = {
  bars: ["bar"],
  rooftops: ["rooftop", "roof"],
  clubs: ["club"],
};

function scoreNightlifeVenue(venue: NightlifeVenue, types: NightlifeType[]): number {
  let score = 0;
  const haystack = [venue.categoryId, ...(venue.tags ?? [])].join(" ").toLowerCase();
  for (const type of types) {
    if (NIGHTLIFE_TYPE_KEYWORDS[type].some((keyword) => haystack.includes(keyword))) score += 3;
  }
  if (typeof venue.rating === "number") score += venue.rating;
  return score;
}

function pickBestNightlifeVenue(candidates: NightlifeVenue[], types: NightlifeType[], usedPlaceIds: Set<string>): NightlifeVenue | null {
  const available = candidates.filter((venue) => !usedPlaceIds.has(venue.id));
  if (available.length === 0) return null;
  const scored = available.map((venue) => ({ venue, score: scoreNightlifeVenue(venue, types) }));
  scored.sort((a, b) => b.score - a.score || a.venue.id.localeCompare(b.venue.id));
  return scored[0].venue;
}

function addFoodAndNightlifeSuggestions(
  days: CustomPlanDraftDay[],
  opts: {
    foodPreferences: FoodPreference[];
    budgetStyle: BudgetStyle | null;
    nightlifeTypes: NightlifeType[];
    includeNightlife: boolean;
    usedPlaceIds: Set<string>;
  },
  guide: DestinationGuideContent
): void {
  for (const day of days) {
    const lunch = pickBestFoodPlace(guide.foodPlaces, opts.foodPreferences, opts.budgetStyle, opts.usedPlaceIds);
    if (lunch) {
      day.stops.push({ placeId: lunch.id, title: lunch.name, kind: "lunch", startTime: null, durationMinutes: null, adminNote: null, customerNote: null });
      opts.usedPlaceIds.add(lunch.id);
    }

    const dinner = pickBestFoodPlace(guide.foodPlaces, opts.foodPreferences, opts.budgetStyle, opts.usedPlaceIds);
    if (dinner) {
      day.stops.push({ placeId: dinner.id, title: dinner.name, kind: "dinner", startTime: null, durationMinutes: null, adminNote: null, customerNote: null });
      opts.usedPlaceIds.add(dinner.id);
    }

    if (opts.includeNightlife) {
      const venue = pickBestNightlifeVenue(guide.nightlifeVenues, opts.nightlifeTypes, opts.usedPlaceIds);
      if (venue) {
        day.stops.push({ placeId: venue.id, title: venue.name, kind: "nightlife", startTime: null, durationMinutes: null, adminNote: null, customerNote: null });
        opts.usedPlaceIds.add(venue.id);
      }
    }
  }
}

// ── Top-level entry point ─────────────────────────────────────────────────────────────────
export function generateCustomPlanDraft(input: CustomPlanGenerationInput): CustomPlanDraftPlanData {
  const mustVisitResult = input.mustVisit ? matchMustVisitText(input.mustVisit, barcelonaGuide) : { matchedPlaceIds: [], unmatched: [] };
  const plannerInterests = mapToPlannerInterests(input.interests);
  const minutesPerDay = minutesBudgetForPace(input.pace);

  const days = buildVisitDays({
    durationDays: input.durationDays,
    minutesPerDay,
    arrivalDate: input.arrivalDate,
    matchedMustVisitIds: mustVisitResult.matchedPlaceIds,
    plannerInterests,
    accommodation: input.accommodation,
  });

  const usedPlaceIds = new Set<string>(days.flatMap((day) => day.stops.map((stop) => stop.placeId)));
  const requestedNightlife = input.interests.includes("nightlife") || input.nightlifeTypes.length > 0;
  const isFamilyWithChildren = input.travelerType === "family" && input.hasChildren === true;

  addFoodAndNightlifeSuggestions(
    days,
    {
      foodPreferences: input.foodPreferences,
      budgetStyle: input.budgetStyle,
      nightlifeTypes: input.nightlifeTypes,
      includeNightlife: requestedNightlife && !isFamilyWithChildren,
      usedPlaceIds,
    },
    barcelonaGuide
  );

  return {
    requestId: input.requestId,
    destination: "barcelona",
    durationDays: input.durationDays,
    days,
    unmatchedMustVisits: mustVisitResult.unmatched,
    generatedAt: new Date().toISOString(),
  };
}

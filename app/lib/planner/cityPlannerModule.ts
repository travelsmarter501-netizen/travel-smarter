import type { DestinationConfig } from "./destinationConfig";
import type { FlagshipCoverageGoal, GeneratedPlannerPlan, PlannerDay, SecondaryCoverageGoal } from "./plannerDayBuilder";
import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerOperationalWarning } from "./barcelonaPlannerOperationalWarnings";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { GeoPoint } from "./geoDistance";
import type { HoursInfo, Weekday } from "../hours";
import type { Area, Attraction, Beach, Experience, FoodCategory, FoodPlace, NightlifeVenue, ShoppingArea } from "../guideTypes";

/**
 * Multi-city planner foundation: EVERYTHING the Personalized Planner V2 pipeline needs to know about one city, in one object.
 *
 * The pipeline itself (lib/planner/v2CityPipeline.ts: generation passes, place resolution, meal stops, suggestions, timeline)
 * never names a city; it only reads a module like this. Barcelona's module (barcelonaCityModule.ts) wraps the existing Barcelona
 * data and rules unchanged; a new city supplies its own data files and this same shape. Modules are looked up by destination id
 * in cityPlannerRegistry.ts.
 *
 * Data vs logic: place content (names, hours, prices, booking, coordinates, sources) lives in `places`; planning data (interest
 * weights, clusters, visit lengths) in `destinationConfig.plannerMetadata`; transport in `routeLeg` / `destinationConfig.buildPlanRouteLegs`.
 */

/** The place content a city provides for planning (a subset of a destination guide; it is NOT a sold guide). */
export type CityPlaceData = {
  attractions: Attraction[];
  experiences: Experience[];
  areas: Area[];
  foodPlaces: FoodPlace[];
  foodCategories: FoodCategory[];
  nightlifeVenues: NightlifeVenue[];
  shoppingAreas: ShoppingArea[];
  beaches?: Beach[];
};

export type CityMealStopRules = {
  /** The planner cluster a food place belongs to, or null when it should never be suggested as a meal stop. */
  clusterForFoodPlace: (place: FoodPlace) => string | null;
  breakfastCategories: readonly string[];
  lunchCategories: readonly string[];
  /** An optional evening category tried before dinner (Barcelona: "tapas"); null when the city has none. */
  eveningSpecialCategory: string | null;
  dinnerCategories: readonly string[];
  /** Optional: place lunch after the stop that ends closest before 13:45 (estimated from visit lengths), not after the middle stop. */
  lunchByClock?: boolean;
  /** Optional: categories tried for a light lunch when no restaurant of `lunchCategories` fits (Prague: cafés with food). */
  lunchFallbackCategories?: readonly string[];
  /** Optional: categories offered as one optional coffee break per day near the day's route (Prague: cafés); unset = none. */
  coffeeBreakCategories?: readonly string[];
  /**
   * Optional: lunch for every customer (a restaurant, or a lunch break in the area when none fits), breakfast as a suggestion
   * only (not on the clock), dinner optional from `dinnerEarliest` right after the day's program. Unset = unchanged.
   */
  flexibleMeals?: { dinnerEarliest: number };
  /** Optional: food places that sit inside a ticketed or enclosed place (food place id -> that place's id): offered only on a day that visits it. */
  insideStop?: Readonly<Record<string, string>>;
};

export type CityAccommodationRules = {
  /** Geocoder bias centre for a typed hotel / address. */
  center: GeoPoint;
  /** Words that carry no location meaning when matching a geocoder result to the typed text ("hotel", the city name, ...). */
  genericWords: ReadonlySet<string>;
  isWithinBounds: (point: GeoPoint) => boolean;
  nearestCluster: (point: GeoPoint) => { cluster: string; distanceKm: number };
  /** Offline fallback: a known neighbourhood / landmark name typed by the customer -> planner cluster. */
  keywordCluster: (text: string) => string | null;
};

/** Context handed to a city's optional geography repair (every plan, dated or not). */
export type DayGeographyRepairContext = {
  plan: GeneratedPlannerPlan;
  legsByDay: PlannerRouteLeg[][];
  /** The request's engine config (metadata, route optimizer, legs builder). */
  config: DestinationConfig;
  /** Dated plans: whether a place is open on that day number; undefined for flexible plans. */
  isPlaceEligibleForDay?: (placeId: string, dayNumber: number) => boolean;
};

/** Context handed to a city's optional post-processing step for dated plans (Barcelona: the beach timing guard). */
export type DatedPlanPostProcessContext = {
  plan: GeneratedPlannerPlan;
  legsByDay: PlannerRouteLeg[][];
  config: DestinationConfig;
  arrivalDate: string;
  resolveHoursForPlace: (placeId: string) => HoursInfo | undefined;
  weekdayForDayNumber: (dayNumber: number) => Weekday | null;
};

export type CityPlannerModule = {
  id: string;
  nameAr: string;
  nameEn: string;
  places: CityPlaceData;
  /** Base engine config (metadata, day builder, route optimizer, route legs, presentation); per-request fields are added by the pipeline. */
  destinationConfig: DestinationConfig;
  metadataById: (placeId: string) => PlannerPlaceMetadata | undefined;
  clusterCentroids: Record<string, GeoPoint>;
  accommodation: CityAccommodationRules;
  /** Interests the questionnaire may offer for this city (e.g. no beaches -> no "beachRelax"). */
  supportedInterests: readonly V2PlannerInterest[];
  /** Places that may only appear when the customer chose an experiences / nightlife interest. */
  experiencesGatedPlaceIds: ReadonlySet<string>;
  flagshipCoverageGoals: (context: { surpriseMe: boolean; days: number }) => FlagshipCoverageGoal[];
  placeSelectionBonus: (interests: readonly V2PlannerInterest[]) => (placeId: string) => number;
  secondaryCoverageGoals: (interests: readonly V2PlannerInterest[], days: number) => SecondaryCoverageGoal[];
  /** One leg between any two place ids (meal-adjacent legs); never invents data -- unknown pairs come back "unresolved" or "estimated". */
  routeLeg: (fromPlaceId: string, toPlaceId: string) => PlannerRouteLeg;
  /**
   * Optional: resolve seasonal schedules and dated exceptions for each trip before planning (tripHours.ts), so the engine
   * checks opening / closing times of seasonal places too. Cities without structured seasons leave it unset (unchanged).
   */
  resolveHoursPerTrip?: boolean;
  /**
   * Optional: after the plan is built (meals included), re-order a day whose visits or meals would start before opening,
   * run past closing or start after the last entry (plannerTimingGuard.ts). Unset = unchanged behaviour.
   */
  timingGuard?: boolean;
  /**
   * With `timingGuard`: also choose every restaurant so that the WHOLE meal fits inside its opening hours (a stricter selection that
   * can change days that had no problem). Default = the value of `timingGuard`; false keeps the selection as it was and lets the
   * guard repair only the days that end up with a violation.
   */
  strictMealSelection?: boolean;
  /**
   * Optional: count the trip to and from each meal on the day's clock, place lunch from the real timeline, check each
   * restaurant against the meal's estimated start, and reuse another day's restaurant rather than leave a meal slot empty.
   * Unset = unchanged behaviour (Barcelona).
   */
  mealLegsInTimeline?: boolean;
  /**
   * Optional, the clock part of `mealLegsInTimeline` only: the trip to and from each meal is counted on the day's clock with the
   * real (or estimated) leg instead of a flat margin, and the walk to the next stop starts at the meal. Meal choice and lunch
   * position are unchanged. Implied by `mealLegsInTimeline`.
   */
  mealTransfersInTimeline?: boolean;
  /**
   * Optional: the planner metadata for this request's interests (Prague: "food" no longer scores shopping places, which share
   * the legacy foodShoppingNightlife key). Unset = the city's metadata unchanged (Barcelona).
   */
  metadataForInterests?: (v2Interests: readonly V2PlannerInterest[], surpriseMe: boolean) => PlannerPlaceMetadata[];
  /**
   * Optional: how well a place matches this request's interests (0-10). The day builder and the day balance only ADD places
   * that reach the city's threshold (flagships and must-visits excepted), and a strong match is never cut to an outside stop.
   */
  placeRelevance?: (v2Interests: readonly V2PlannerInterest[], surpriseMe: boolean) => (placeId: string) => number;
  /** With `placeRelevance`: the lowest match (0-10) a place needs to be added; default 5. */
  relevanceThreshold?: number;
  /**
   * Optional, with `placeRelevance`: the threshold for THIS request (trip length, interests). A city may lower it for a trip
   * that is longer than its strongly matching places can fill, instead of leaving days nearly empty.
   */
  relevanceThresholdFor?: (context: { days: number; relevance: (placeId: string) => number }) => number;
  /** One day's legs, used by the reclaim / cross-day / trip-composition passes when they test a changed day. Omit to use
   * Barcelona's checked route table (Barcelona omits it, so those passes behave exactly as before). */
  buildDayRouteLegs?: (day: PlannerDay) => PlannerRouteLeg[];
  operationalWarnings: (placeId: string, weekday?: Weekday | null) => PlannerOperationalWarning[] | undefined;
  mealStops: CityMealStopRules;
  /** Optional extra pass for dated plans after the closure repair (Barcelona: beach timing). */
  postProcessDatedPlan?: (context: DatedPlanPostProcessContext) => { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] };
  /**
   * Optional: flagships the Surprise Me composition pass must never move, for a city other than Barcelona. When set, that pass also
   * classifies places from this city's own `places` (Barcelona omits it: Barcelona's guide and Must-See policy, unchanged).
   */
  compositionProtectedPlaceIds?: readonly string[];
  /**
   * Optional last geography repair for every plan, run after the day passes and before the accommodation Day-1 order and the
   * date safety net. It may reorder stops and swap stops between days but must keep the trip's set of places (Barcelona omits it).
   */
  repairDayGeography?: (context: DayGeographyRepairContext) => { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] };
  /** Shown when the content cannot fill every requested day (keeps the existing Barcelona wording for Barcelona). */
  capacityWarning: (daysGenerated: number) => string;
  /** Optional: the short "outside only" visit of a paid place (minutes, and the outside access hours when the outside closes). */
  outsideVisit?: (placeId: string) => { visitDurationMinutes: number; hours?: HoursInfo } | undefined;
  /**
   * Optional: estimated adult entry ticket of a place in the city's currency (0 = free, null = paid but the price is not known,
   * undefined = not an entry place). Shown as an estimate only; unset = no ticket estimates (Barcelona).
   */
  ticketEstimate?: { currency: string; forPlace: (placeId: string) => number | null | undefined };
};

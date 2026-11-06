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
  /** One day's legs, used by the reclaim / cross-day / trip-composition passes when they test a changed day. Omit to use
   * Barcelona's checked route table (Barcelona omits it, so those passes behave exactly as before). */
  buildDayRouteLegs?: (day: PlannerDay) => PlannerRouteLeg[];
  operationalWarnings: (placeId: string, weekday?: Weekday | null) => PlannerOperationalWarning[] | undefined;
  mealStops: CityMealStopRules;
  /** Optional extra pass for dated plans after the closure repair (Barcelona: beach timing). */
  postProcessDatedPlan?: (context: DatedPlanPostProcessContext) => { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] };
  /** Shown when the content cannot fill every requested day (keeps the existing Barcelona wording for Barcelona). */
  capacityWarning: (daysGenerated: number) => string;
};

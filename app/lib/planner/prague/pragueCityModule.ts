import "server-only";
import { resolvePlannerPlace } from "../../readyPlan";
import { haversineDistanceKm, type GeoPoint } from "../geoDistance";
import { buildEstimatedLeg, buildEstimatedPlanRouteLegs, estimatedWalkingMinutes } from "../estimatedRouteLegs";
import { repairCityDayGeography } from "../cityGeographyRepair";
import { ENABLE_MUST_SEE_PRIORITY, FLAGSHIP_MUST_SEE_BOOST, FLAGSHIP_TIER_B_BOOST, FLAGSHIP_TIER_B_SURPRISE_ME_BOOST } from "../barcelonaMustSeePolicy";
import { V2_PLANNER_INTERESTS, type V2PlannerInterest } from "../v2PlannerTypes";
import { PRAGUE_PLACES, PRAGUE_PLACE_COORDINATES } from "./praguePlaces";
import { PRAGUE_PLANNER_METADATA, getPraguePlannerMetadataById } from "./pragueMetadata";
import type { CityPlannerModule } from "../cityPlannerModule";
import type { ClusterCompatibilityMap, CoverageGoal, DayBuilderConfig, FlagshipCoverageGoal, GeneratedPlannerPlan, PlannerDay, SimilarityGroup } from "../plannerDayBuilder";
import type { RouteConfig } from "../plannerRouteOptimizer";
import type { DestinationConfig } from "../destinationConfig";
import type { PlannerOperationalWarning } from "../barcelonaPlannerOperationalWarnings";
import type { PlannerDayPresentation, PresentedPlannerPlan } from "../plannerPresentationTypes";
import type { FoodPlace } from "../../guideTypes";
import type { Weekday } from "../../hours";

/**
 * Prague as a CityPlannerModule (multi-city foundation). Place facts live in praguePlaces.ts (with sources), planning
 * judgements in pragueMetadata.ts; this file holds the planning RULES: which areas combine in a day, walking order,
 * flagship goals, meal-stop mapping, accommodation matching, day titles and warnings.
 *
 * Transport: Prague has no checked route table yet, so every leg is a distance-based ESTIMATE (estimatedRouteLegs.ts),
 * always labelled as such in the plan. The same estimate feeds the route optimizer's travel-time signal.
 *
 * Not public yet: plannerDestinations.ts keeps Prague `available: false`; only the local preview switch enables it.
 */

// ── Areas that may share a day (symmetric) ──────────────────────────────────────────────────────────
const LINKS: [string, string, "strong" | "medium" | "weak"][] = [
  ["hradcany", "mala-strana", "strong"],
  ["hradcany", "petrin", "strong"],
  ["mala-strana", "petrin", "strong"],
  ["mala-strana", "old-town", "strong"],
  ["old-town", "josefov", "strong"],
  ["old-town", "republiky", "strong"],
  ["old-town", "new-town", "strong"],
  ["republiky", "new-town", "strong"],
  ["republiky", "josefov", "medium"],
  ["old-town", "riverside", "medium"],
  ["new-town", "riverside", "medium"],
  ["riverside", "vysehrad", "strong"],
  ["new-town", "vysehrad", "weak"],
  ["mala-strana", "riverside", "weak"],
  ["new-town", "zizkov", "medium"],
  ["republiky", "zizkov", "weak"],
  ["letna", "josefov", "medium"],
  ["letna", "old-town", "weak"],
  ["letna", "troja", "weak"],
  ["letna", "holesovice", "strong"],
  ["holesovice", "troja", "medium"],
  ["holesovice", "bubenec", "medium"],
  ["holesovice", "josefov", "weak"],
  ["bubenec", "letna", "medium"],
  ["bubenec", "hradcany", "weak"],
];

function symmetric(links: typeof LINKS): ClusterCompatibilityMap {
  const map: ClusterCompatibilityMap = {};
  for (const [a, b, level] of links) {
    (map[a] ??= {})[b] = level;
    (map[b] ??= {})[a] = level;
  }
  return map;
}

export const PRAGUE_CLUSTER_COMPATIBILITY = symmetric(LINKS);

/** Charles Bridge physically joins Malá Strana and the Old Town, so a hop to it from either side is a neighbour hop. */
export const PRAGUE_CONNECTORS: Record<string, readonly string[]> = { "charles-bridge": ["mala-strana", "old-town"] };

const TIER_A = ["prague-castle", "charles-bridge", "old-town-square", "old-town-hall"];
const TIER_B = ["petrin-tower", "vysehrad", "clementinum", "st-nicholas-mala-strana", "john-lennon-wall", "letna-park", "jewish-museum"];

const SIMILARITY_GROUPS: SimilarityGroup[] = [
  { id: "towers", placeIds: ["old-town-bridge-tower", "powder-tower", "petrin-tower", "zizkov-tower"], maxByDefault: 2, unlockedByInterest: "viewsNature", maxWithInterest: 3 },
  { id: "shopping", placeIds: ["na-prikope", "palladium", "havelske-market"], maxByDefault: 1, unlockedByInterest: "foodShoppingNightlife", maxWithInterest: 3 },
  { id: "big-museums", placeIds: ["national-museum", "national-technical-museum", "jewish-museum", "franz-kafka-museum"], maxByDefault: 2, unlockedByInterest: "cultureLocal", maxWithInterest: 4 },
  { id: "art-galleries", placeIds: ["mucha-museum", "museum-kampa", "convent-st-agnes", "trade-fair-palace", "dox"], maxByDefault: 1, unlockedByInterest: "cultureLocal", maxWithInterest: 4 },
];

const COVERAGE_GOALS: CoverageGoal[] = [
  { interest: "popular", placeIds: TIER_A, minimumCoverage: 3, boost: 6 },
  { interest: "popular", placeIds: TIER_B, minimumCoverage: 0, boost: 3 },
  { interest: "viewsNature", placeIds: ["petrin-tower", "vysehrad", "letna-park", "old-town-bridge-tower", "zizkov-tower"], minimumCoverage: 1, boost: 5 },
  { interest: "cultureLocal", placeIds: ["prague-castle", "clementinum", "jewish-museum", "strahov-monastery", "municipal-house"], minimumCoverage: 1, boost: 5 },
  { interest: "footballExperiences", placeIds: ["vltava-one-hour-cruise", "zizkov-tower", "prague-zoo", "national-technical-museum"], minimumCoverage: 1, boost: 5 },
  { interest: "beachRelax", placeIds: ["naplavka", "kampa-island", "petrin-gardens", "riegrovy-sady", "letna-park", "stromovka", "havlicek-gardens"], minimumCoverage: 1, boost: 4 },
];

const FLAGSHIP_MUST_SEE = ["prague-castle"];
const FLAGSHIP_TIER_B_IDS = ["charles-bridge", "old-town-square"];

function flagshipGoals(context: { surpriseMe: boolean; days: number }): FlagshipCoverageGoal[] {
  if (!ENABLE_MUST_SEE_PRIORITY) return [];
  const tierBBoost = context.surpriseMe && context.days >= 3 ? FLAGSHIP_TIER_B_SURPRISE_ME_BOOST : FLAGSHIP_TIER_B_BOOST;
  return [
    { candidates: FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
    { candidates: FLAGSHIP_TIER_B_IDS, minCoverage: 0, boost: tierBBoost },
  ];
}

const travelMinutes = (fromPlaceId: string, toPlaceId: string): number | null => {
  const minutes = estimatedWalkingMinutes(PRAGUE_PLACE_COORDINATES[fromPlaceId], PRAGUE_PLACE_COORDINATES[toPlaceId]);
  return minutes === null ? null : Math.round(minutes);
};

const DAY_BUILDER_CONFIG: DayBuilderConfig = {
  clusterCompatibility: PRAGUE_CLUSTER_COMPATIBILITY,
  similarityGroups: SIMILARITY_GROUPS,
  coverageGoals: COVERAGE_GOALS,
  iconicTiers: [TIER_A, TIER_B],
  tierCoverageGoals: [{ interest: "popular", tierPlaceIds: TIER_A, minCoverage: 3 }],
  flagshipCoverageGoals: flagshipGoals({ surpriseMe: false, days: 1 }),
  getVerifiedTravelMinutes: travelMinutes,
};

const ROUTE_CONFIG: RouteConfig = {
  clusterAdjacency: PRAGUE_CLUSTER_COMPATIBILITY,
  // A natural downhill / west-to-east flow: Troja & Letná (north), the castle hill, across the bridge, the centre, then east and south.
  clusterDirectionalOrder: ["troja", "holesovice", "letna", "hradcany", "petrin", "mala-strana", "old-town", "josefov", "republiky", "new-town", "zizkov", "riverside", "vysehrad"],
  sameClusterOrderHints: {
    hradcany: ["strahov-monastery", "loreta", "prague-castle"],
    "mala-strana": ["st-nicholas-mala-strana", "john-lennon-wall", "kampa-island", "franz-kafka-museum"],
    "old-town": ["old-town-square", "old-town-hall", "tyn-church", "havelske-market", "clementinum", "old-town-bridge-tower", "charles-bridge"],
  },
  verifiedMinutesLookup: travelMinutes,
};

// ── Day titles / summaries (Prague's own simple presenter) ───────────────────────────────────────────
const CLUSTER_LABEL_AR: Record<string, string> = {
  hradcany: "منطقة القلعة",
  "mala-strana": "Malá Strana",
  petrin: "تلة Petřín",
  "old-town": "البلدة القديمة",
  republiky: "ساحة Republiky",
  josefov: "Josefov",
  "new-town": "المدينة الجديدة",
  riverside: "ضفة النهر",
  vysehrad: "Vyšehrad",
  zizkov: "Žižkov وVinohrady",
  letna: "Letná",
  holesovice: "Holešovice",
  troja: "Troja",
};

function placeName(placeId: string): string {
  return resolvePlannerPlace(placeId, PRAGUE_PLACES)?.place.name ?? placeId;
}

function dayClustersByWeight(day: PlannerDay): string[] {
  const minutes = new Map<string, number>();
  for (const stop of day.stops) {
    const meta = getPraguePlannerMetadataById(stop.placeId);
    if (!meta) continue;
    minutes.set(meta.cluster, (minutes.get(meta.cluster) ?? 0) + meta.visitDurationMinutes);
  }
  return [...minutes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([cluster]) => cluster);
}

function presentPraguePlan(plan: GeneratedPlannerPlan): PresentedPlannerPlan {
  const usedTitles = new Set<string>();
  const byDay: PlannerDayPresentation[] = plan.days.map((day) => {
    const clusters = dayClustersByWeight(day).map((cluster) => CLUSTER_LABEL_AR[cluster] ?? cluster);
    const firstStop = day.stops[0] ? placeName(day.stops[0].placeId) : "";
    let title = clusters.length >= 2 ? `${clusters[0]} و${clusters[1]}` : clusters[0] ? `يوم ${clusters[0]}` : `اليوم ${day.dayNumber}`;
    if (usedTitles.has(title) && firstStop) title = `${title}: ${firstStop}`;
    usedTitles.add(title);
    const names = day.stops.map((stop) => placeName(stop.placeId));
    const summary =
      names.length === 0 ? "" : names.length === 1 ? `محطة اليوم: ${names[0]}.` : `محطات اليوم: ${names.slice(0, -1).join("، ")} و${names[names.length - 1]}.`;
    return { title, summary, optionalNearby: [] };
  });
  return { byDay };
}

const DESTINATION_CONFIG: DestinationConfig = {
  id: "prague",
  name: "Prague",
  country: "Czech Republic",
  timezone: "Europe/Prague",
  plannerMetadata: PRAGUE_PLANNER_METADATA,
  dayBuilderConfig: DAY_BUILDER_CONFIG,
  routeOptimizationConfig: ROUTE_CONFIG,
  buildPlanRouteLegs: (plan) => buildEstimatedPlanRouteLegs(plan, PRAGUE_PLACE_COORDINATES),
  presentationResolver: (plan) => presentPraguePlan(plan),
  resolvePlaceDisplayName: placeName,
};

// ── Accommodation ───────────────────────────────────────────────────────────────────────────────────
/** Cluster centroids averaged from the verified coordinates of each cluster's own places (never hand-picked). */
const CLUSTER_CENTROIDS: Record<string, GeoPoint> = (() => {
  const sums = new Map<string, { lat: number; lng: number; n: number }>();
  for (const meta of PRAGUE_PLANNER_METADATA) {
    const point = PRAGUE_PLACE_COORDINATES[meta.placeId];
    if (!point) continue;
    const sum = sums.get(meta.cluster) ?? { lat: 0, lng: 0, n: 0 };
    sums.set(meta.cluster, { lat: sum.lat + point.lat, lng: sum.lng + point.lng, n: sum.n + 1 });
  }
  return Object.fromEntries([...sums.entries()].map(([cluster, s]) => [cluster, { lat: s.lat / s.n, lng: s.lng / s.n }]));
})();

/** Generous box around the city of Prague: rejects a same-named hotel in another city. */
const BOUNDS = { minLat: 49.94, maxLat: 50.18, minLng: 14.22, maxLng: 14.71 };

/** Neighbourhood / landmark names a customer may type -> planner cluster. Areas with no planner cluster (Smíchov, Karlín, ...) stay unmatched. */
const KEYWORD_CLUSTERS: { cluster: string; patterns: RegExp[] }[] = [
  { cluster: "hradcany", patterns: [/hrad[cč]any/i, /prague castle/i, /pra[zž]sk[yý] hrad/i, /قلعة براغ/] },
  { cluster: "mala-strana", patterns: [/mal[aá] strana/i, /lesser town/i, /kampa/i] },
  { cluster: "old-town", patterns: [/star[eé] m[eě]sto/i, /old town/i, /البلدة القديمة/] },
  { cluster: "josefov", patterns: [/josefov/i, /jewish quarter/i, /pa[rř][ií][zž]sk[aá]/i] },
  { cluster: "republiky", patterns: [/n[aá]m[eě]st[ií] republiky/i, /republic square/i, /na p[rř][ií]kop[eě]/i] },
  { cluster: "new-town", patterns: [/nov[eé] m[eě]sto/i, /new town/i, /v[aá]clavsk[eé]/i, /wenceslas/i] },
  { cluster: "zizkov", patterns: [/[zž]i[zž]kov/i, /vinohrady/i] },
  { cluster: "letna", patterns: [/letn[aá]/i] },
  { cluster: "holesovice", patterns: [/hole[sš]ovice/i] },
  { cluster: "vysehrad", patterns: [/vy[sš]ehrad/i] },
];

function nearestCluster(point: GeoPoint): { cluster: string; distanceKm: number } {
  let best: { cluster: string; distanceKm: number } | null = null;
  for (const [cluster, centroid] of Object.entries(CLUSTER_CENTROIDS)) {
    const distanceKm = haversineDistanceKm(point, centroid);
    if (!best || distanceKm < best.distanceKm) best = { cluster, distanceKm };
  }
  return best!;
}

// ── Meals ───────────────────────────────────────────────────────────────────────────────────────────
/** Food place -> planner cluster, decided from each place's verified address / coordinates (see praguePlaces.ts). */
const FOOD_PLACE_CLUSTER: Record<string, string> = {
  "cafe-louvre": "new-town",
  "cafe-savoy": "mala-strana",
  "cafe-imperial": "republiky",
  "mansson-bakery": "josefov",
  "kavarna-slavia": "old-town",
  "grand-cafe-orient": "republiky",
  "kavarna-obecni-dum": "republiky",
  "lobkowicz-palace-cafe": "hradcany",
  "kavarna-novy-svet": "hradcany",
  "cafe-kupka": "zizkov",
  "kavarna-lucerna": "new-town",
  kuchyn: "hradcany",
  mlynec: "old-town",
  "u-modre-kachnicky-mala-strana": "mala-strana",
  "u-modre-kachnicky-old-town": "old-town",
  "petrinske-terasy": "petrin",
  "restaurant-obecni-dum": "republiky",
  "hostinec-na-vytoni": "riverside",
  "u-kroka": "vysehrad",
  "u-cedru": "bubenec",
  "letensky-zamecek": "letna",
  "cafe-ornament": "troja",
  "bredovsky-dvur": "new-town",
  "u-pinkasu": "new-town",
  cestr: "new-town",
  "vinohradsky-parlament": "zizkov",
  spravovna: "zizkov",
  "kolkovna-v-kolkovne": "josefov",
  "u-mecenase": "mala-strana",
  // "lvi-dvur" is deliberately NOT mapped: it closes 19:00 every day, and flexible-date plans do not check meal hours, so it
  // could land on a dinner slot. It stays available as a supplementary food suggestion only.
};

// ── Warnings shown on a stop ────────────────────────────────────────────────────────────────────────
const WARNINGS: Record<string, PlannerOperationalWarning[]> = {
  "vltava-one-hour-cruise": [{ textAr: "⚠️ الرحلات موسمية حسب prague.eu: أبريل–سبتمبر يوميًا، أكتوبر بالويكند فقط، ومتوقفة نوفمبر–مارس. تأكد قبل." }],
  // The tower closure of 7-14 Nov 2026 is a one-off date range; warnings here are not date-aware, so it lives in the place
  // tip (praguePlaces.ts) instead of showing on every plan.
  "jewish-museum": [{ textAr: "⚠️ مغلق كل سبت وبالأعياد اليهودية." }],
  "tyn-church": [{ textAr: "⚠️ الزيارة بفترتين قصيرتين (10:00–13:00 و15:00–17:00)، ومغلقة الاثنين، والأحد كمان من مارس لنوفمبر." }],
  clementinum: [{ textAr: "الزيارة بجولة بموعد محدد؛ احجز موعدك قبل." }],
  "troja-chateau": [{ textAr: "⚠️ من نوفمبر لمارس المصدر الرسمي ما بيذكر مواعيد القصر؛ تأكد قبل الزيارة." }],
  "prague-zoo": [{ textAr: "المواعيد بتتغير حسب الشهر (بالشتاء لحد 16:00)." }],
};

function warningsFor(placeId: string, weekday?: Weekday | null): PlannerOperationalWarning[] | undefined {
  const all = WARNINGS[placeId];
  if (!all) return undefined;
  if (!weekday) return all;
  const relevant = all.filter((warning) => !warning.onlyRelevantOnWeekday || warning.onlyRelevantOnWeekday === weekday);
  return relevant.length > 0 ? relevant : undefined;
}

// ── Personalization ─────────────────────────────────────────────────────────────────────────────────
const SHOPPING_STRONG = new Set(["na-prikope", "palladium", "havelske-market"]);
const SHOPPING_MIXED = new Set(["wenceslas-square", "old-town-square"]);
const EXPERIENCE_BONUS = new Set(["vltava-one-hour-cruise", "zizkov-tower"]);

function placeSelectionBonus(interests: readonly V2PlannerInterest[]): (placeId: string) => number {
  const shopping = interests.includes("shopping");
  const solo = shopping && interests.length === 1;
  const experiences = interests.includes("footballExperiences") || interests.includes("nightlife");
  return (placeId) => {
    let bonus = 0;
    if (shopping && SHOPPING_STRONG.has(placeId)) bonus += solo ? 9 : 3;
    if (shopping && SHOPPING_MIXED.has(placeId)) bonus += solo ? 4 : 2;
    if (experiences && EXPERIENCE_BONUS.has(placeId)) bonus += 6;
    return bonus;
  };
}

function shoppingCoverage(interests: readonly V2PlannerInterest[], days: number) {
  if (!interests.includes("shopping") || days <= 2) return [];
  return [{ candidates: [...SHOPPING_STRONG, ...SHOPPING_MIXED], minCoverage: days <= 4 ? 2 : 3 }];
}

export const PRAGUE_CITY_MODULE: CityPlannerModule = {
  id: "prague",
  nameAr: "براغ",
  nameEn: "Prague",
  places: PRAGUE_PLACES,
  destinationConfig: DESTINATION_CONFIG,
  metadataById: getPraguePlannerMetadataById,
  clusterCentroids: CLUSTER_CENTROIDS,
  accommodation: {
    center: { lat: 50.087524890749, lng: 14.421104907924 }, // Old Town Square (prague.eu)
    genericWords: new Set(["hotel", "hotels", "apartment", "apartments", "apartmany", "prague", "praha", "prag", "czech", "the", "spa", "residence"]),
    isWithinBounds: (point) => point.lat >= BOUNDS.minLat && point.lat <= BOUNDS.maxLat && point.lng >= BOUNDS.minLng && point.lng <= BOUNDS.maxLng,
    nearestCluster,
    keywordCluster: (text) => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      return KEYWORD_CLUSTERS.find(({ patterns }) => patterns.some((pattern) => pattern.test(trimmed)))?.cluster ?? null;
    },
  },
  supportedInterests: V2_PLANNER_INTERESTS,
  // Seasonal river cruise: only when the customer asked for experiences (same rule as Barcelona's cable car).
  experiencesGatedPlaceIds: new Set(["vltava-one-hour-cruise"]),
  flagshipCoverageGoals: flagshipGoals,
  placeSelectionBonus,
  secondaryCoverageGoals: shoppingCoverage,
  routeLeg: (fromPlaceId, toPlaceId) => buildEstimatedLeg(fromPlaceId, toPlaceId, PRAGUE_PLACE_COORDINATES),
  buildDayRouteLegs: (day) => buildEstimatedPlanRouteLegs({ days: [day] }, PRAGUE_PLACE_COORDINATES)[0],
  operationalWarnings: warningsFor,
  mealStops: {
    clusterForFoodPlace: (place: FoodPlace) => FOOD_PLACE_CLUSTER[place.id] ?? null,
    // Only places verified to open by 9:00 every day (Café Louvre, Café Savoy, Café Imperial, Mansson Bakery). Cafés that
    // open at 10:00 or later stay out of the breakfast slot, because flexible-date plans cannot check opening hours.
    breakfastCategories: ["breakfast"],
    lunchCategories: ["local", "middle-eastern", "restaurants"],
    eveningSpecialCategory: null,
    dinnerCategories: ["local", "middle-eastern", "restaurants"],
  },
  // The Surprise Me composition pass classifies Prague places from Prague's own data and never moves these flagships.
  compositionProtectedPlaceIds: [...FLAGSHIP_MUST_SEE, ...FLAGSHIP_TIER_B_IDS],
  repairDayGeography: (context) =>
    repairCityDayGeography(context, { compatibility: PRAGUE_CLUSTER_COMPATIBILITY, connectors: PRAGUE_CONNECTORS, metadataById: getPraguePlannerMetadataById, travelMinutes }),
  capacityWarning: (daysGenerated) => `قدرنا نبني خطة قوية لـ ${daysGenerated} أيام من البيانات المتاحة حاليًا لبراغ. عم نوسّع المحتوى للأيام الأطول.`,
};

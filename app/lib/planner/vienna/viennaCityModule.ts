import "server-only";
import { resolvePlannerPlace } from "../../readyPlan";
import { haversineDistanceKm, type GeoPoint } from "../geoDistance";
import { buildEstimatedLeg, buildEstimatedPlanRouteLegs, estimatedWalkingMinutes } from "../estimatedRouteLegs";
import { repairCityDayGeography } from "../cityGeographyRepair";
import { ENABLE_MUST_SEE_PRIORITY, FLAGSHIP_MUST_SEE_BOOST, FLAGSHIP_TIER_B_BOOST, FLAGSHIP_TIER_B_SURPRISE_ME_BOOST } from "../barcelonaMustSeePolicy";
import { V2_PLANNER_INTERESTS, type V2PlannerInterest } from "../v2PlannerTypes";
import { VIENNA_PLACES, VIENNA_PLACE_COORDINATES } from "./viennaPlaces";
import { VIENNA_PLANNER_METADATA, getViennaPlannerMetadataById } from "./viennaMetadata";
import type { CityPlannerModule } from "../cityPlannerModule";
import type { ClusterCompatibilityMap, CoverageGoal, DayBuilderConfig, FlagshipCoverageGoal, GeneratedPlannerPlan, PlannerDay, SimilarityGroup } from "../plannerDayBuilder";
import type { RouteConfig } from "../plannerRouteOptimizer";
import type { DestinationConfig } from "../destinationConfig";
import type { PlannerOperationalWarning } from "../barcelonaPlannerOperationalWarnings";
import type { PlannerDayPresentation, PresentedPlannerPlan } from "../plannerPresentationTypes";
import type { FoodPlace } from "../../guideTypes";
import type { Weekday } from "../../hours";

/**
 * Vienna as a CityPlannerModule (second new city, built on the Prague structure). Place facts live in viennaPlaces.ts (with
 * sources), planning judgements in viennaMetadata.ts; this file holds the planning RULES: which areas combine in a day,
 * walking order, flagship goals, meal-stop mapping, accommodation matching, day titles and warnings.
 *
 * Transport: no checked route table yet, so every leg is a distance-based ESTIMATE (estimatedRouteLegs.ts), labelled as such.
 * Not public: plannerDestinations.ts keeps Vienna `available: false`; only the local preview switch enables it.
 */

// ── Areas that may share a day (symmetric) ──────────────────────────────────────────────────────────
const LINKS: [string, string, "strong" | "medium" | "weak"][] = [
  ["innere-stadt", "hofburg", "strong"],
  ["innere-stadt", "stadtpark", "strong"],
  ["innere-stadt", "karlsplatz", "medium"],
  ["innere-stadt", "landstrasse", "weak"],
  ["innere-stadt", "prater", "weak"],
  ["hofburg", "museumsquartier", "strong"],
  ["hofburg", "karlsplatz", "strong"],
  ["museumsquartier", "mariahilf", "strong"],
  ["museumsquartier", "karlsplatz", "medium"],
  ["karlsplatz", "belvedere", "strong"],
  ["karlsplatz", "mariahilf", "medium"],
  ["karlsplatz", "stadtpark", "medium"],
  ["belvedere", "stadtpark", "medium"],
  ["belvedere", "landstrasse", "weak"],
  ["stadtpark", "landstrasse", "medium"],
  ["landstrasse", "prater", "medium"],
  ["prater", "augarten", "medium"],
  // U1 metro: Praterstern -> Kaisermühlen-VIC is two stops, then a short walk to the Danube Tower / Island.
  ["prater", "donau", "medium"],
  ["schoenbrunn", "mariahilf", "weak"],
  // Tram D runs directly from the Ring to the Belvedere.
  ["innere-stadt", "belvedere", "weak"],
  ["alsergrund", "hofburg", "medium"],
  ["alsergrund", "innere-stadt", "medium"],
  // About 1.5 km across the Danube Canal (Augartenbrücke / Schwedenplatz).
  ["augarten", "innere-stadt", "weak"],
  // Mariahilfer Straße starts at the MuseumsQuartier, a short walk from the Hofburg side of the centre.
  ["mariahilf", "innere-stadt", "weak"],
];

function symmetric(links: typeof LINKS): ClusterCompatibilityMap {
  const map: ClusterCompatibilityMap = {};
  for (const [a, b, level] of links) {
    (map[a] ??= {})[b] = level;
    (map[b] ??= {})[a] = level;
  }
  return map;
}

export const VIENNA_CLUSTER_COMPATIBILITY = symmetric(LINKS);

const TIER_A = ["st-stephens-cathedral", "schoenbrunn-palace", "sisi-imperial-apartments", "belvedere-upper"];
const TIER_B = ["kunsthistorisches-museum", "albertina", "state-hall-national-library", "karlskirche", "naschmarkt", "giant-ferris-wheel", "hundertwasserhaus", "schoenbrunn-gardens"];

const SIMILARITY_GROUPS: SimilarityGroup[] = [
  { id: "art-museums", placeIds: ["albertina", "leopold-museum", "kunst-haus-wien", "secession", "kunsthistorisches-museum", "belvedere-lower", "mak"], maxByDefault: 2, unlockedByInterest: "cultureLocal", maxWithInterest: 4 },
  { id: "music-museums", placeIds: ["mozarthaus", "haus-der-musik"], maxByDefault: 1, unlockedByInterest: "cultureLocal", maxWithInterest: 2 },
  { id: "parks", placeIds: ["volksgarten", "stadtpark", "augarten", "prater"], maxByDefault: 1, unlockedByInterest: "viewsNature", maxWithInterest: 3 },
  { id: "shopping", placeIds: ["kaerntner-strasse-graben", "mariahilfer-strasse"], maxByDefault: 1, unlockedByInterest: "foodShoppingNightlife", maxWithInterest: 2 },
];

const COVERAGE_GOALS: CoverageGoal[] = [
  { interest: "popular", placeIds: TIER_A, minimumCoverage: 2, boost: 6 },
  { interest: "popular", placeIds: TIER_B, minimumCoverage: 0, boost: 3 },
  { interest: "viewsNature", placeIds: ["schoenbrunn-gardens", "giant-ferris-wheel", "danube-tower", "belvedere-upper", "augarten"], minimumCoverage: 1, boost: 5 },
  { interest: "cultureLocal", placeIds: ["kunsthistorisches-museum", "sisi-imperial-apartments", "albertina", "state-hall-national-library", "belvedere-upper"], minimumCoverage: 1, boost: 5 },
  { interest: "footballExperiences", placeIds: ["state-opera-tour", "spanish-riding-school", "giant-ferris-wheel", "schoenbrunn-zoo", "haus-der-musik"], minimumCoverage: 1, boost: 5 },
  { interest: "beachRelax", placeIds: ["schoenbrunn-gardens", "volksgarten", "stadtpark", "augarten", "prater"], minimumCoverage: 1, boost: 4 },
];

const FLAGSHIP_MUST_SEE = ["st-stephens-cathedral"];
const FLAGSHIP_TIER_B_IDS = ["schoenbrunn-palace", "sisi-imperial-apartments"];

function flagshipGoals(context: { surpriseMe: boolean; days: number }): FlagshipCoverageGoal[] {
  if (!ENABLE_MUST_SEE_PRIORITY) return [];
  const tierBBoost = context.surpriseMe && context.days >= 3 ? FLAGSHIP_TIER_B_SURPRISE_ME_BOOST : FLAGSHIP_TIER_B_BOOST;
  // A 1-day trip stays in the centre: Schönbrunn (4-5 km west) is only pushed from 2 days up.
  const tierB = context.days <= 1 ? FLAGSHIP_TIER_B_IDS.filter((id) => id !== "schoenbrunn-palace") : FLAGSHIP_TIER_B_IDS;
  return [
    { candidates: FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
    { candidates: tierB, minCoverage: 0, boost: tierBBoost },
  ];
}

const travelMinutes = (fromPlaceId: string, toPlaceId: string): number | null => {
  const minutes = estimatedWalkingMinutes(VIENNA_PLACE_COORDINATES[fromPlaceId], VIENNA_PLACE_COORDINATES[toPlaceId]);
  return minutes === null ? null : Math.round(minutes);
};

const DAY_BUILDER_CONFIG: DayBuilderConfig = {
  clusterCompatibility: VIENNA_CLUSTER_COMPATIBILITY,
  similarityGroups: SIMILARITY_GROUPS,
  coverageGoals: COVERAGE_GOALS,
  iconicTiers: [TIER_A, TIER_B],
  tierCoverageGoals: [{ interest: "popular", tierPlaceIds: TIER_A, minCoverage: 2 }],
  flagshipCoverageGoals: flagshipGoals({ surpriseMe: false, days: 1 }),
  getVerifiedTravelMinutes: travelMinutes,
};

const ROUTE_CONFIG: RouteConfig = {
  clusterAdjacency: VIENNA_CLUSTER_COMPATIBILITY,
  // West -> centre -> east: Schönbrunn, Mariahilf, the museums and the palace, the centre, then east (parks, Belvedere, Prater, Danube).
  clusterDirectionalOrder: ["kahlenberg", "schoenbrunn", "mariahilf", "museumsquartier", "alsergrund", "hofburg", "innere-stadt", "karlsplatz", "stadtpark", "belvedere", "landstrasse", "prater", "augarten", "donau"],
  sameClusterOrderHints: {
    schoenbrunn: ["schoenbrunn-palace", "schoenbrunn-gardens", "schoenbrunn-zoo"],
    hofburg: ["sisi-imperial-apartments", "state-hall-national-library", "heldenplatz", "volksgarten", "parliament"],
  },
  verifiedMinutesLookup: travelMinutes,
};

// ── Day titles / summaries ──────────────────────────────────────────────────────────────────────────
const CLUSTER_LABEL_AR: Record<string, string> = {
  "innere-stadt": "وسط المدينة",
  alsergrund: "Alsergrund",
  kahlenberg: "Kahlenberg",
  hofburg: "قصر Hofburg",
  museumsquartier: "حي المتاحف",
  karlsplatz: "Karlsplatz",
  stadtpark: "Stadtpark",
  belvedere: "Belvedere",
  landstrasse: "حي Hundertwasser",
  prater: "Prater",
  augarten: "Augarten",
  mariahilf: "Mariahilf",
  schoenbrunn: "Schönbrunn",
  donau: "الدانوب",
};

function placeName(placeId: string): string {
  return resolvePlannerPlace(placeId, VIENNA_PLACES)?.place.name ?? placeId;
}

function dayClustersByWeight(day: PlannerDay): string[] {
  const minutes = new Map<string, number>();
  for (const stop of day.stops) {
    const meta = getViennaPlannerMetadataById(stop.placeId);
    if (!meta) continue;
    minutes.set(meta.cluster, (minutes.get(meta.cluster) ?? 0) + meta.visitDurationMinutes);
  }
  return [...minutes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([cluster]) => cluster);
}

function presentViennaPlan(plan: GeneratedPlannerPlan): PresentedPlannerPlan {
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
  id: "vienna",
  name: "Vienna",
  country: "Austria",
  timezone: "Europe/Vienna",
  plannerMetadata: VIENNA_PLANNER_METADATA,
  dayBuilderConfig: DAY_BUILDER_CONFIG,
  routeOptimizationConfig: ROUTE_CONFIG,
  buildPlanRouteLegs: (plan) => buildEstimatedPlanRouteLegs(plan, VIENNA_PLACE_COORDINATES),
  presentationResolver: (plan) => presentViennaPlan(plan),
  resolvePlaceDisplayName: placeName,
};

// ── Accommodation ───────────────────────────────────────────────────────────────────────────────────
/** Cluster centroids averaged from the verified coordinates of each cluster's own places (never hand-picked). */
const CLUSTER_CENTROIDS: Record<string, GeoPoint> = (() => {
  const sums = new Map<string, { lat: number; lng: number; n: number }>();
  for (const meta of VIENNA_PLANNER_METADATA) {
    const point = VIENNA_PLACE_COORDINATES[meta.placeId];
    if (!point) continue;
    const sum = sums.get(meta.cluster) ?? { lat: 0, lng: 0, n: 0 };
    sums.set(meta.cluster, { lat: sum.lat + point.lat, lng: sum.lng + point.lng, n: sum.n + 1 });
  }
  return Object.fromEntries([...sums.entries()].map(([cluster, s]) => [cluster, { lat: s.lat / s.n, lng: s.lng / s.n }]));
})();

/** Generous box around the city of Vienna: rejects a same-named hotel in another city. */
const BOUNDS = { minLat: 48.11, maxLat: 48.33, minLng: 16.18, maxLng: 16.58 };

/** Neighbourhood / landmark names a customer may type -> planner cluster. */
const KEYWORD_CLUSTERS: { cluster: string; patterns: RegExp[] }[] = [
  { cluster: "innere-stadt", patterns: [/innere stadt/i, /stephansplatz/i, /stephansdom/i, /st\.? stephen/i, /graben/i, /k[aä]rntner/i, /\b1010\b/, /وسط المدينة/] },
  { cluster: "hofburg", patterns: [/hofburg/i, /heldenplatz/i, /michaelerplatz/i] },
  { cluster: "museumsquartier", patterns: [/museumsquartier/i, /museums ?quartier/i, /\bMQ\b/, /spittelberg/i] },
  { cluster: "karlsplatz", patterns: [/karlsplatz/i, /naschmarkt/i, /wieden/i, /\b1040\b/] },
  { cluster: "belvedere", patterns: [/belvedere/i, /hauptbahnhof/i, /main station/i] },
  { cluster: "landstrasse", patterns: [/landstra(ss|ß)e/i, /\b1030\b/, /hundertwasser/i] },
  { cluster: "prater", patterns: [/prater/i, /leopoldstadt/i, /praterstern/i, /\b1020\b/] },
  { cluster: "mariahilf", patterns: [/mariahilf/i, /westbahnhof/i, /\b1060\b/, /neubau/i, /\b1070\b/] },
  { cluster: "schoenbrunn", patterns: [/sch(ö|oe|o)nbrunn/i, /hietzing/i, /\b1130\b/] },
  { cluster: "donau", patterns: [/donaustadt/i, /donau ?city/i, /kaisermühlen/i, /\b1220\b/] },
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
/** Food place -> planner cluster, decided from each place's verified address / coordinates (see viennaPlaces.ts). */
const FOOD_PLACE_CLUSTER: Record<string, string> = {
  "cafe-sacher": "hofburg",
  "cafe-gloriette": "schoenbrunn",
  "cafe-mozart": "hofburg",
  "cafe-schwarzenberg": "karlsplatz",
  griechenbeisl: "innere-stadt",
  "zum-weissen-rauchfangkehrer": "innere-stadt",
  "gasthaus-poeschl": "innere-stadt",
  "plachutta-hietzing": "schoenbrunn",
  "cafe-landtmann": "hofburg",
  "cafe-museum": "karlsplatz",
  "zum-schwarzen-kameel": "innere-stadt",
  "cafe-sperl": "mariahilf",
  demel: "hofburg",
  "cafe-prueckel": "stadtpark",
  figlmueller: "innere-stadt",
  "plachutta-wollzeile": "innere-stadt",
  gmoakeller: "stadtpark",
  "salm-braeu": "belvedere",
  "glacis-beisl": "museumsquartier",
};

// ── Warnings shown on a stop ────────────────────────────────────────────────────────────────────────
const WARNINGS: Record<string, PlannerOperationalWarning[]> = {
  "state-hall-national-library": [{ textAr: "⚠️ من أكتوبر لمايو مغلقة كل اثنين.", onlyRelevantOnWeekday: "monday" }],
  naschmarkt: [{ textAr: "⚠️ أكشاك السوق مسكّرة كل أحد (المطاعم بتفتح).", onlyRelevantOnWeekday: "sunday" }],
  "sisi-imperial-apartments": [{ textAr: "متحف Sisi بحلّة جديدة من 19 نوفمبر 2026؛ تأكد من المواعيد قبل." }],
  "spanish-riding-school": [{ textAr: "العروض والتدريبات بمواعيد محددة؛ احجز حسب البرنامج." }],
  "state-opera-tour": [{ textAr: "الجولات حسب جدول الأوبرا؛ احجز موعدك قبل." }],
};

function warningsFor(placeId: string, weekday?: Weekday | null): PlannerOperationalWarning[] | undefined {
  const all = WARNINGS[placeId];
  if (!all) return undefined;
  if (!weekday) return all;
  const relevant = all.filter((warning) => !warning.onlyRelevantOnWeekday || warning.onlyRelevantOnWeekday === weekday);
  return relevant.length > 0 ? relevant : undefined;
}

// ── Personalization ─────────────────────────────────────────────────────────────────────────────────
const SHOPPING_STRONG = new Set(["kaerntner-strasse-graben", "mariahilfer-strasse"]);
const SHOPPING_MIXED = new Set(["naschmarkt"]);
const EXPERIENCE_BONUS = new Set(["state-opera-tour", "spanish-riding-school", "giant-ferris-wheel"]);

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
  return [{ candidates: [...SHOPPING_STRONG, ...SHOPPING_MIXED], minCoverage: 2 }];
}

export const VIENNA_CITY_MODULE: CityPlannerModule = {
  id: "vienna",
  nameAr: "فيينا",
  nameEn: "Vienna",
  places: VIENNA_PLACES,
  destinationConfig: DESTINATION_CONFIG,
  metadataById: getViennaPlannerMetadataById,
  clusterCentroids: CLUSTER_CENTROIDS,
  accommodation: {
    center: { lat: 48.208427, lng: 16.373256 }, // St. Stephen's Cathedral (Wikidata Q5943)
    genericWords: new Set(["hotel", "hotels", "apartment", "apartments", "vienna", "wien", "austria", "the", "residence", "suites"]),
    isWithinBounds: (point) => point.lat >= BOUNDS.minLat && point.lat <= BOUNDS.maxLat && point.lng >= BOUNDS.minLng && point.lng <= BOUNDS.maxLng,
    nearestCluster,
    keywordCluster: (text) => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      return KEYWORD_CLUSTERS.find(({ patterns }) => patterns.some((pattern) => pattern.test(trimmed)))?.cluster ?? null;
    },
  },
  supportedInterests: V2_PLANNER_INTERESTS,
  // Booked-slot experiences only when the customer asked for experiences.
  experiencesGatedPlaceIds: new Set(["spanish-riding-school", "state-opera-tour"]),
  flagshipCoverageGoals: flagshipGoals,
  placeSelectionBonus,
  secondaryCoverageGoals: shoppingCoverage,
  routeLeg: (fromPlaceId, toPlaceId) => buildEstimatedLeg(fromPlaceId, toPlaceId, VIENNA_PLACE_COORDINATES),
  buildDayRouteLegs: (day) => buildEstimatedPlanRouteLegs({ days: [day] }, VIENNA_PLACE_COORDINATES)[0],
  operationalWarnings: warningsFor,
  mealStops: {
    clusterForFoodPlace: (place: FoodPlace) => FOOD_PLACE_CLUSTER[place.id] ?? null,
    // Only places verified to open by 9:00 every day (Café Sacher, Café Landtmann, Café Museum, Zum Schwarzen Kameel, Café Mozart, Café Schwarzenberg).
    breakfastCategories: ["breakfast"],
    // Vienna's coffeehouses serve full Viennese lunches (Landtmann, Sacher, Kameel, Café Museum's lunch menu).
    lunchCategories: ["local", "breakfast"],
    eveningSpecialCategory: null,
    dinnerCategories: ["local"],
  },
  compositionProtectedPlaceIds: [...FLAGSHIP_MUST_SEE, ...FLAGSHIP_TIER_B_IDS],
  repairDayGeography: (context) => repairCityDayGeography(context, { compatibility: VIENNA_CLUSTER_COMPATIBILITY, metadataById: getViennaPlannerMetadataById, travelMinutes }),
  capacityWarning: (daysGenerated) => `قدرنا نبني خطة قوية لـ ${daysGenerated} أيام من البيانات المتاحة حاليًا لفيينا. عم نوسّع المحتوى للأيام الأطول.`,
};

import "server-only";
import { resolvePlannerPlace } from "../../readyPlan";
import { haversineDistanceKm, type GeoPoint } from "../geoDistance";
import { buildEstimatedLeg, estimatedWalkingMinutes } from "../estimatedRouteLegs";
import { PRAGUE_ROUTED_WALKS } from "./pragueRoutedWalks";
import { CHECKED_TRANSIT_NOTE_AR, checkedTransitMinutes, UNCHECKED_TRANSIT_FACTOR } from "./pragueCheckedTransit";
import type { PlannerRouteLeg, TransportOption } from "../plannerTransportTypes";

// ── Transfers: straight-line estimate, except sensitive ones measured on a real walking route (pragueRoutedWalks.ts) ──
export const ROUTED_WALK_NOTE_AR = "المسافة من مسار مشي فعلي (OpenStreetMap)، والوقت محسوب على مشي 4.5 كم بالساعة.";
export const ROUTED_WALK_CLIMB_NOTE_AR = "المسافة من مسار مشي فعلي (OpenStreetMap) وفيه طلعة، فالوقت محسوب على مشي 4.5 كم بالساعة مع 20% زيادة للطلعة.";

const HILL_CLUSTERS = new Set(["hradcany", "petrin"]);
const NO_TRANSIT_PAIRS = new Set(["spravovna|vitkov-memorial"]);
function noPracticalTransit(a: string, b: string): boolean {
  const cluster = (id: string) => getPraguePlannerMetadataById(id)?.cluster ?? FOOD_PLACE_CLUSTER[id] ?? "";
  if (HILL_CLUSTERS.has(cluster(a)) && HILL_CLUSTERS.has(cluster(b))) return true;
  return NO_TRANSIT_PAIRS.has([a, b].sort().join("|"));
}

/**
 * The public-transport option of a leg: the checked time where the pair was checked (pragueCheckedTransit.ts), otherwise the
 * distance estimate lengthened by the factor those checks showed. When walking is then no slower (within 3 minutes), walking
 * is the recommended way.
 */
function withTransitCheck(leg: PlannerRouteLeg): PlannerRouteLeg {
  const index = leg.options.findIndex((option) => option.mode === "transit");
  if (index === -1) return leg;
  const checked = checkedTransitMinutes(leg.fromPlaceId, leg.toPlaceId);
  const old = leg.options[index];
  const transit: TransportOption = checked !== null
    ? { ...old, durationMinutesMin: Math.round(checked * 0.95), durationMinutesMax: Math.round(checked * 1.15), note: CHECKED_TRANSIT_NOTE_AR }
    : { ...old, durationMinutesMin: Math.round(old.durationMinutesMin * UNCHECKED_TRANSIT_FACTOR), durationMinutesMax: Math.round(old.durationMinutesMax * UNCHECKED_TRANSIT_FACTOR) };
  const options = leg.options.map((option, i) => (i === index ? transit : option));
  const walking = options.find((option) => option.mode === "walking");
  const mid = (option: TransportOption) => (option.durationMinutesMin + option.durationMinutesMax) / 2;
  const recommendedMode = leg.recommendedMode === "transit" && walking && mid(walking) <= mid(transit) + 3 ? "walking" : leg.recommendedMode;
  return { ...leg, options, recommendedMode };
}

function pragueLeg(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  return withTransitCheck(pragueLegBase(fromPlaceId, toPlaceId));
}

function pragueLegBase(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  const leg = buildEstimatedLeg(fromPlaceId, toPlaceId, PRAGUE_PLACE_COORDINATES);
  const routed = PRAGUE_ROUTED_WALKS[`${fromPlaceId}>${toPlaceId}`];
  const from = PRAGUE_PLACE_COORDINATES[fromPlaceId];
  const to = PRAGUE_PLACE_COORDINATES[toPlaceId];
  if (!routed || !from || !to || leg.sourceStatus === "unresolved") return leg;
  const [km, climb] = routed;
  const minutes = (km / 4.5) * 60 * (climb ? 1.2 : 1);
  const walking: TransportOption = {
    mode: "walking",
    durationMinutesMin: Math.max(1, Math.round(minutes * 0.9)),
    durationMinutesMax: Math.max(1, Math.round(minutes * 1.15)),
    distanceKm: km,
    note: climb ? ROUTED_WALK_CLIMB_NOTE_AR : ROUTED_WALK_NOTE_AR,
  };
  // Same thresholds as estimatedRouteLegs.ts: walk only up to 20 minutes, walking still listed up to 60 minutes, transit estimated.
  const transitMinutes = ((haversineDistanceKm(from, to) * 1.3) / 18) * 60 + 10;
  const transit: TransportOption = leg.options.find((option) => option.mode === "transit") ?? {
    mode: "transit",
    durationMinutesMin: Math.round(transitMinutes * 0.85),
    durationMinutesMax: Math.round(transitMinutes * 1.25),
    note: leg.options[0]?.note,
  };
  const routeUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from.lat}%2C${from.lng}%3B${to.lat}%2C${to.lng}`;
  // No practical public transport on these walks (Google Maps transit found no route, 2026-11-10: Castle-Petřín Tower,
  // Spravovna-Vítkov): walking is recommended up to 40 minutes instead of an estimated tram time that does not exist.
  if (noPracticalTransit(fromPlaceId, toPlaceId) && walking.durationMinutesMax <= 40) return { fromPlaceId, toPlaceId, recommendedMode: "walking", options: [walking], sourceStatus: "estimated", routeUrl };
  if (walking.durationMinutesMax <= 20) return { fromPlaceId, toPlaceId, recommendedMode: "walking", options: [walking], sourceStatus: "estimated", routeUrl };
  const options = walking.durationMinutesMax <= 60 ? [walking, transit] : [transit];
  return { fromPlaceId, toPlaceId, recommendedMode: "transit", options, sourceStatus: "estimated", routeUrl };
}
import { repairCityDayGeography } from "../cityGeographyRepair";
import { balanceCityDays } from "../cityDayBalance";
import { ENABLE_MUST_SEE_PRIORITY, FLAGSHIP_MUST_SEE_BOOST, FLAGSHIP_TIER_B_BOOST, FLAGSHIP_TIER_B_SURPRISE_ME_BOOST } from "../barcelonaMustSeePolicy";
import { V2_PLANNER_INTERESTS, type V2PlannerInterest } from "../v2PlannerTypes";
import { PRAGUE_PLACES, PRAGUE_PLACE_COORDINATES } from "./praguePlaces";
import { PRAGUE_PLANNER_METADATA, getPraguePlannerMetadataById, praguePlannerMetadataForInterests, praguePlaceRelevance } from "./pragueMetadata";
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

// ── Outside stops (PROPOSAL, owner review) ─────────────────────────────────────────────────────────
// Paid places whose outside is on a public street or square (no closing time for the outside), and that are not flagships:
// on a crowded day the plan may keep them as a 15-minute outside stop instead of the full visit.
const OUTSIDE_STOP_MINUTES: Record<string, number> = {
  "strahov-monastery": 15,
  loreta: 15,
  "old-town-bridge-tower": 15,
  "municipal-house": 15,
  "powder-tower": 15,
  "national-museum": 15,
  "zizkov-tower": 15,
};
const BALANCE_PROTECTED = new Set([...TIER_A, ...TIER_B]);
const FLAGSHIP_TIER_B_IDS = ["charles-bridge", "old-town-square"];

function flagshipGoals(context: { surpriseMe: boolean; days: number }): FlagshipCoverageGoal[] {
  if (!ENABLE_MUST_SEE_PRIORITY) return [];
  const tierBBoost = context.surpriseMe && context.days >= 3 ? FLAGSHIP_TIER_B_SURPRISE_ME_BOOST : FLAGSHIP_TIER_B_BOOST;
  // PROPOSAL (owner review): from 2 days on, Charles Bridge and Old Town Square are required too (free, 30 minutes each); the
  // audit sample had 24 of 49 short plans without the bridge.
  if (context.days >= 2) {
    return [
      { candidates: FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
      { candidates: ["charles-bridge"], minCoverage: 1, boost: tierBBoost },
      { candidates: ["old-town-square"], minCoverage: 1, boost: tierBBoost },
    ];
  }
  return [
    { candidates: FLAGSHIP_MUST_SEE, minCoverage: 1, boost: FLAGSHIP_MUST_SEE_BOOST },
    { candidates: FLAGSHIP_TIER_B_IDS, minCoverage: 0, boost: tierBBoost },
  ];
}

// Minutes between two places as the plan itself shows them: the recommended option of the leg (a real walking route where one
// is stored, otherwise the distance estimate; public transport on long hops).
const travelMinutes = (fromPlaceId: string, toPlaceId: string): number | null => {
  const leg = pragueLeg(fromPlaceId, toPlaceId);
  const option = leg.sourceStatus === "unresolved" ? undefined : leg.options.find((o) => o.mode === leg.recommendedMode);
  if (option) return Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2);
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
    // Day balance: places taken off a full day stay visible as optional suggestions of that day.
    const optionalNearby = [
      ...(day.optionalPlaceIds ?? []).map((placeId) => ({ placeId, type: "experience" as const, reason: "اختياري: اليوم مليان، زوره إذا ضل عندك وقت" })),
      ...(day.freeTimePlaceIds ?? []).map((placeId) => ({ placeId, type: "experience" as const, reason: "عندك وقت حر: قريب من مسارك إذا حابب" })),
    ];
    return { title, summary, optionalNearby };
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
  buildPlanRouteLegs: (plan) => plan.days.map((day) => day.stops.slice(0, -1).map((stop, i) => pragueLeg(stop.placeId, day.stops[i + 1].placeId))),
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
  // Café Kupka is on the top floor of the Army Museum Žižkov building (prague.eu, checked 2026-11-10); the memorial on the hill has
  // its own café (Café Vítkov), which is a different place. Description corrected, so it is offered again.
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
  "habibi-prague": "republiky", // Na Příkopě 23, 0.2 km from the náměstí Republiky cluster centre
  "jaffa-restaurant": "republiky", // Panská 894/4, 0.3 km from the náměstí Republiky cluster centre; closes 21:00 (its own site), hours shown on the card
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
  "vltava-one-hour-cruise": [{ textAr: "⚠️ الرحلات موسمية حسب prague.eu: أبريل–سبتمبر يوميًا، أكتوبر بالويكند فقط، ومتوقفة نوفمبر–مارس." }, { textAr: "فحصنا موقع الشركة (10 نوفمبر 2026): بموسم 2026 الرحلات كانت كل ساعة على رأس الساعة من رصيف رقم 2 (Rašínovo nábřeží)، ومواعيد وأسعار 2027 لسا مش منشورة. وقت الخطة تقريبي: ثبّته على موعد انطلاق وكون عالرصيف قبله." }],
  // The tower closure of 7-14 Nov 2026 is a one-off date range; warnings here are not date-aware, so it lives in the place
  // tip (praguePlaces.ts) instead of showing on every plan.
  "jewish-museum": [{ textAr: "⚠️ مغلق كل سبت وبالأعياد اليهودية." }],
  "tyn-church": [{ textAr: "⚠️ الزيارة بفترتين قصيرتين (10:00–13:00 و15:00–17:00)، ومغلقة الاثنين، والأحد كمان من مارس لنوفمبر." }],
  clementinum: [{ textAr: "⚠️ مشروطة بالحجز: الزيارة بجولة مرشدة بموعد محدد، ووقت الخطة تقريبي. احجز جولة قريبة منه ورتّب يومك حسبها." }],
  "municipal-house": [{ textAr: "⚠️ مشروطة بالحجز: القاعات بجولة مرشدة (ساعة) بمواعيد ثابتة منشورة لكل يوم على obecnidum.cz/en/tours. احجز الجولة الأقرب لوقتها بالخطة." }],
  "troja-chateau": [{ textAr: "⚠️ القصر بيفتح بموسمه بس (2026: 1 أبريل–29 أكتوبر)؛ برّا الموسم مسكّر." }],
  "prague-zoo": [{ textAr: "المواعيد بتتغير حسب الشهر (بالشتاء لحد 16:00)." }],
  // katedralasvatehovita.cz (checked 2026-11-10): Mon-Sat 9:00-17:00, Sunday 12:00-17:00, last admission 20 minutes before closing.
  "prague-castle": [{ textAr: "الأحد: كاتدرائية St. Vitus بتفتح للزوار من 12:00 بس، فابدأ بالقصر الملكي وGolden Lane وخلّي الكاتدرائية للآخر.", onlyRelevantOnWeekday: "sunday" }],
  // prague.eu (checked 2026-11-10): the Fata Morgana greenhouse is open Tuesday-Sunday; the outdoor garden every day.
  "botanical-garden": [{ textAr: "الاثنين: البيت الزجاجي Fata Morgana مسكّر، والحديقة برّا بس مفتوحة.", onlyRelevantOnWeekday: "monday" }],
};

function warningsFor(placeId: string, weekday?: Weekday | null): PlannerOperationalWarning[] | undefined {
  const all = WARNINGS[placeId];
  if (!all) return undefined;
  if (!weekday) return all;
  const relevant = all.filter((warning) => !warning.onlyRelevantOnWeekday || warning.onlyRelevantOnWeekday === weekday);
  return relevant.length > 0 ? relevant : undefined;
}

// ── Entry ticket estimates ────────────────────────────────────────────────────────────────────────────
function pragueTicketEstimate(placeId: string): number | null | undefined {
  const experience = PRAGUE_PLACES.experiences.some((p) => p.id === placeId);
  const place = [...PRAGUE_PLACES.attractions, ...PRAGUE_PLACES.experiences].find((p) => p.id === placeId) as { priceType?: string; priceText?: string } | undefined;
  if (!place) return undefined;
  if (place.priceType === "free") return 0;
  // An experience is a paid activity: without a published price it counts as "price not available", never as free.
  if (!place.priceType && !experience) return undefined;
  const match = (place.priceText ?? "").replace(/(\d)[ ,.](\d{3})/g, "$1$2").match(/(\d+)\s*CZK/);
  return match ? Number(match[1]) : null;
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
  routeLeg: pragueLeg,
  // Seasonal hours, dated closures and last entry are planned per trip, and the final plan is checked against them.
  resolveHoursPerTrip: true,
  timingGuard: true,
  buildDayRouteLegs: (day) => day.stops.slice(0, -1).map((stop, i) => pragueLeg(stop.placeId, day.stops[i + 1].placeId)),
  operationalWarnings: warningsFor,
  mealStops: {
    clusterForFoodPlace: (place: FoodPlace) => FOOD_PLACE_CLUSTER[place.id] ?? null,
    // Only places verified to open by 9:00 every day (Café Louvre, Café Savoy, Café Imperial, Mansson Bakery). Cafés that
    // open at 10:00 or later stay out of the breakfast slot, because flexible-date plans cannot check opening hours.
    breakfastCategories: ["breakfast"],
    lunchCategories: ["local", "middle-eastern", "restaurants"],
    lunchByClock: true,
    // A light lunch at a café with food when no restaurant near the day fits (Troja, Letná, the castle on some days).
    lunchFallbackCategories: ["cafes"],
    coffeeBreakCategories: ["cafes"],
    // Lunch for every customer; breakfast only suggested; dinner optional from 18:00 right after the day's program.
    flexibleMeals: { dinnerEarliest: 18 * 60 },
    // Café Ornament is inside the Botanical Garden and Lobkowicz Palace Café inside the castle complex (prague.eu): whether they
    // can be reached without the visit is not stated, so they are offered only on a day that goes there.
    insideStop: { "cafe-ornament": "botanical-garden", "lobkowicz-palace-cafe": "prague-castle" },
    eveningSpecialCategory: null,
    dinnerCategories: ["local", "middle-eastern", "restaurants"],
  },
  // The Surprise Me composition pass classifies Prague places from Prague's own data and never moves these flagships.
  compositionProtectedPlaceIds: [...FLAGSHIP_MUST_SEE, ...FLAGSHIP_TIER_B_IDS],
  repairDayGeography: (context) => {
    const repaired = repairCityDayGeography(context, { compatibility: PRAGUE_CLUSTER_COMPATIBILITY, connectors: PRAGUE_CONNECTORS, metadataById: getPraguePlannerMetadataById, travelMinutes });
    return balanceCityDays(
      { ...context, plan: repaired.plan, legsByDay: repaired.legsByDay },
      {
        compatibility: PRAGUE_CLUSTER_COMPATIBILITY,
        connectors: PRAGUE_CONNECTORS,
        metadataById: getPraguePlannerMetadataById,
        travelMinutes,
        protectedPlaceIds: BALANCE_PROTECTED,
        gatedPlaceIds: new Set(["vltava-one-hour-cruise"]),
        outsideMinutes: (placeId) => OUTSIDE_STOP_MINUTES[placeId],
        heavyMinutes: 380,
        lightMinutes: 170,
        minPriorityToAdd: 5,
        keepInsideRelevance: 9,
        regroup: { splitPenalty: 45, lightWeight: 6, emptyPenalty: 300, comfortStops: 5, crowdPenalty: 25, maxStops: 6, hopPenalty: 60, restoreBonus: 20 },
        // A light day may take one free place of at most 45 minutes in an area it already visits (Kampa, the Lennon Wall, a garden).
        walkByStop: { isFreeShort: (placeId) => pragueTicketEstimate(placeId) === 0 && (getPraguePlannerMetadataById(placeId)?.visitDurationMinutes ?? 999) <= 45, minRelevance: 3 },
        // For a light day: nearby ideas that match the request (3+), or a free place of at most 45 minutes within a 15-minute
        // walk of the day's stops that matches at least a little (2+), e.g. the Lennon Wall next to the Old Town Bridge Tower.
        freeTimeIdeas: { minRelevance: 3, nearFree: { minRelevance: 2, maxMinutes: 15 } },
      }
    );
  },
  mealLegsInTimeline: true,
  // Entry tickets: the first CZK amount of the place's own price text (adult), 0 when free, null when paid without a known price.
  ticketEstimate: { currency: "CZK", forPlace: pragueTicketEstimate },
  metadataForInterests: praguePlannerMetadataForInterests,
  placeRelevance: praguePlaceRelevance,
  relevanceThreshold: 5,
  // A place needs a match of 5 of 10 to be added. When the trip is longer than the places at that level can fill (about 3.5 hours
  // of visits a day), the level drops to 4 and then 3 (still a real match, never an unrelated place), so a long trip with one
  // narrow interest is not spread over days of a single stop.
  relevanceThresholdFor: ({ days, relevance }) => {
    const minutesAt = (level: number) => PRAGUE_PLANNER_METADATA.filter((m) => m.placeId !== "vltava-one-hour-cruise" && relevance(m.placeId) >= level).reduce((sum, m) => sum + m.visitDurationMinutes, 0);
    for (const level of [5, 4]) if (minutesAt(level) >= days * 210) return level;
    return 3;
  },
  outsideVisit: (placeId) => (OUTSIDE_STOP_MINUTES[placeId] ? { visitDurationMinutes: OUTSIDE_STOP_MINUTES[placeId] } : undefined),
  capacityWarning: (daysGenerated) => `قدرنا نبني خطة قوية لـ ${daysGenerated} أيام من البيانات المتاحة حاليًا لبراغ. عم نوسّع المحتوى للأيام الأطول.`,
};

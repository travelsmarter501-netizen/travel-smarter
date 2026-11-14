import type { PlannerInterest, PlannerPlaceMetadata, PreferredTime } from "../plannerTypes";
import type { V2PlannerInterest } from "../v2PlannerTypes";
import { mapV2InterestsToLegacy, SURPRISE_ME_LEGACY_INTERESTS } from "../v2InterestAdapter";

/**
 * Budapest -- planner metadata (local review prototype, 2026-11-13): which interest each place serves (legacy 6-key weights, 0-10,
 * same scale as Prague), importance, preferred time, planner area and planning visit length. PLANNING judgements, not facts; visit
 * lengths follow the official suggestion where one is published (National Gallery 1.5-3 h -> 120; House of Music "about 2 hours" -> 120).
 *
 * Interest mapping (same as Prague): `beachRelax` = relaxed outdoor time (island, parks); `footballExperiences` = the "experiences"
 * group (river cruise, guided Opera tour, zoo, House of Music); `foodShoppingNightlife` = shopping, adjusted per request below.
 * Conditional activities (thermal baths, Hospital in the Rock, Matthias interior, Parliament interior, Dohány) have NO metadata on
 * purpose: they are never scheduled and never offered by the "add" button (see budapestPlaces.ts).
 *
 * Clusters: lipotvaros, belvaros, castle-hill, gellert-hill, terezvaros, erzsebetvaros, palotanegyed, city-park, margaret-island, kerepes.
 */

type W = [popular: number, cultureLocal: number, viewsNature: number, relax: number, experiences: number, shopping: number];

function place(placeId: string, cluster: string, w: W, priority: number, preferredTime: PreferredTime, visitDurationMinutes: number): PlannerPlaceMetadata {
  const [popular, cultureLocal, viewsNature, beachRelax, footballExperiences, foodShoppingNightlife] = w;
  return { placeId, weights: { popular, cultureLocal, viewsNature, beachRelax, footballExperiences, foodShoppingNightlife }, priority, preferredTime, cluster, visitDurationMinutes };
}

export const BUDAPEST_PLANNER_METADATA: PlannerPlaceMetadata[] = [
  // Lipótváros (Pest riverside)
  place("parliament-exterior", "lipotvaros", [10, 8, 4, 0, 1, 0], 10, "anytime", 20),
  place("st-stephens-basilica", "lipotvaros", [10, 9, 6, 0, 1, 0], 10, "morning", 75),
  place("shoes-on-the-danube", "lipotvaros", [6, 8, 2, 0, 0, 0], 6, "anytime", 10),
  place("chain-bridge", "lipotvaros", [9, 6, 7, 1, 1, 0], 9, "anytime", 15),
  // Castle Hill (Buda)
  place("fishermans-bastion", "castle-hill", [10, 6, 9, 1, 1, 0], 10, "morning", 40),
  place("matthias-church-exterior", "castle-hill", [7, 7, 3, 0, 0, 0], 7, "anytime", 15),
  place("hungarian-national-gallery", "castle-hill", [6, 9, 4, 0, 1, 0], 7, "daytime", 120),
  // Gellért Hill
  place("citadella", "gellert-hill", [7, 5, 9, 2, 1, 0], 7, "afternoon", 45),
  // Terézváros (Andrássy)
  // OperaTour: guided only at 13:30, 15:00, 16:30 = every 90 minutes from midnight; the start is held to a tour slot (wait up to 89 min).
  { ...place("opera-house-tour", "terezvaros", [7, 8, 0, 0, 6, 0], 7, "afternoon", 60), showWindow: { everyMinutes: 90, minutes: 1, maxWaitMinutes: 89, missNoteAr: "الجولات بس 13:30 و15:00 و16:30: احجز الموعد اللي بيناسب خطتك." } },
  place("andrassy-avenue", "terezvaros", [6, 4, 1, 0, 0, 8], 5, "anytime", 45),
  // Belváros (Pest centre)
  place("great-market-hall", "belvaros", [7, 4, 0, 0, 2, 9], 7, "morning", 60),
  place("vaci-utca", "belvaros", [6, 2, 0, 0, 0, 8], 5, "anytime", 45),
  // No showWindow: the published departures are the place's planning hours (budapestPlaces.ts, startsAtOpening), so the cruise starts exactly at one.
  place("danube-legend-cruise", "belvaros", [8, 3, 8, 2, 9, 0], 8, "evening", 60),
  // Erzsébetváros / Palotanegyed / Kerepes
  place("gozsdu-udvar", "erzsebetvaros", [3, 2, 0, 0, 2, 6], 4, "afternoon", 30),
  place("hungarian-national-museum", "palotanegyed", [5, 9, 0, 0, 1, 0], 6, "daytime", 90),
  place("arena-mall", "kerepes", [2, 0, 0, 0, 0, 8], 3, "anytime", 90),
  // City Park (Városliget)
  place("heroes-square", "city-park", [9, 7, 3, 0, 0, 0], 8, "anytime", 20),
  place("vajdahunyad-castle", "city-park", [5, 5, 5, 3, 0, 0], 5, "anytime", 20),
  place("museum-of-fine-arts", "city-park", [6, 9, 0, 0, 1, 0], 7, "daytime", 120),
  place("budapest-zoo", "city-park", [6, 0, 7, 2, 7, 0], 6, "morning", 150),
  // House of Music: admission in 30-minute slots at :15 and :45 (offset 15); the start is held to the next slot.
  { ...place("house-of-music", "city-park", [5, 7, 0, 0, 7, 0], 6, "daytime", 120), showWindow: { everyMinutes: 30, offsetMinutes: 15, minutes: 1, maxWaitMinutes: 29, missNoteAr: "الدخول بفترات كل نص ساعة (:15 و:45): احجز الفترة اللي بتناسب خطتك." } },
  // Margaret Island
  place("margaret-island", "margaret-island", [6, 2, 9, 8, 1, 0], 6, "afternoon", 90),
];

const BY_ID = new Map(BUDAPEST_PLANNER_METADATA.map((entry) => [entry.placeId, entry]));

// Per request (same rule as Prague): the shared legacy key foodShoppingNightlife carries only what the customer chose.
const FOOD_WEIGHT: Record<string, number> = { "great-market-hall": 8 };
const NIGHTLIFE_WEIGHT: Record<string, number> = { "danube-legend-cruise": 7, "gozsdu-udvar": 4 };

export function budapestPlannerMetadataForInterests(v2Interests: readonly V2PlannerInterest[], surpriseMe: boolean): PlannerPlaceMetadata[] {
  const food = surpriseMe || v2Interests.includes("food");
  const shopping = v2Interests.includes("shopping");
  const nightlife = v2Interests.includes("nightlife");
  return BUDAPEST_PLANNER_METADATA.map((entry) => {
    const weight = Math.max(food ? (FOOD_WEIGHT[entry.placeId] ?? 0) : 0, shopping ? entry.weights.foodShoppingNightlife : 0, nightlife ? (NIGHTLIFE_WEIGHT[entry.placeId] ?? 0) : 0);
    return weight === entry.weights.foodShoppingNightlife ? entry : { ...entry, weights: { ...entry.weights, foodShoppingNightlife: weight } };
  });
}

const SIGHTSEEING: PlannerInterest[] = ["popular", "cultureLocal", "viewsNature", "beachRelax"];
export function budapestPlaceRelevance(v2Interests: readonly V2PlannerInterest[], surpriseMe: boolean): (placeId: string) => number {
  const byId = new Map(budapestPlannerMetadataForInterests(v2Interests, surpriseMe).map((entry) => [entry.placeId, entry]));
  const keys = new Set<PlannerInterest>(surpriseMe ? SURPRISE_ME_LEGACY_INTERESTS : mapV2InterestsToLegacy([...v2Interests]));
  if (!SIGHTSEEING.some((key) => keys.has(key))) keys.add("popular");
  return (placeId) => {
    const entry = byId.get(placeId);
    return entry ? Math.max(0, ...[...keys].map((key) => entry.weights[key] ?? 0)) : 0;
  };
}

export function getBudapestPlannerMetadataById(placeId: string): PlannerPlaceMetadata | undefined {
  return BY_ID.get(placeId);
}

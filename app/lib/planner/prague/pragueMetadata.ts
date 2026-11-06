import type { PlannerPlaceMetadata, PreferredTime } from "../plannerTypes";

/**
 * Prague -- planner metadata: which interest each place serves (legacy 6-key weights, 0-10, same scale as Barcelona),
 * how important it is, when in the day it fits, its planner area (cluster) and a planning visit length. These are
 * PLANNING judgements, not facts shown to the customer as verified data.
 *
 * Interest mapping notes for Prague (no beaches):
 * - `beachRelax` = relaxed outdoor time (river banks, island, parks), because the questionnaire's "طبيعة" group always
 *   sends natureViews + beachRelax together.
 * - `footballExperiences` = the "تجارب وترفيه" group (river cruise, towers, zoo, technical museum); Prague has no
 *   stadium experience in this data.
 * - `foodShoppingNightlife` = shopping streets / market / mall (real restaurants are scheduled separately as meal stops).
 *
 * Clusters (walkable planner areas): hradcany, mala-strana, petrin, old-town, republiky, josefov, new-town, riverside,
 * vysehrad, zizkov, letna, holesovice, troja. "bubenec" exists only for one restaurant (U Cedru) and has no main stop.
 */

type W = [popular: number, cultureLocal: number, viewsNature: number, relax: number, experiences: number, shopping: number];

function place(placeId: string, cluster: string, w: W, priority: number, preferredTime: PreferredTime, visitDurationMinutes: number): PlannerPlaceMetadata {
  const [popular, cultureLocal, viewsNature, beachRelax, footballExperiences, foodShoppingNightlife] = w;
  return {
    placeId,
    weights: { popular, cultureLocal, viewsNature, beachRelax, footballExperiences, foodShoppingNightlife },
    priority,
    preferredTime,
    cluster,
    visitDurationMinutes,
  };
}

export const PRAGUE_PLANNER_METADATA: PlannerPlaceMetadata[] = [
  // Hradčany
  place("prague-castle", "hradcany", [10, 10, 7, 0, 2, 0], 10, "morning", 150),
  place("strahov-monastery", "hradcany", [6, 9, 4, 0, 1, 0], 7, "morning/daytime", 60),
  place("loreta", "hradcany", [4, 8, 1, 0, 0, 0], 5, "daytime", 45),
  // Malá Strana
  place("st-nicholas-mala-strana", "mala-strana", [6, 8, 0, 0, 0, 0], 6, "daytime", 30),
  place("john-lennon-wall", "mala-strana", [7, 4, 2, 0, 1, 0], 6, "anytime", 15),
  place("kampa-island", "mala-strana", [5, 4, 6, 4, 0, 0], 5, "afternoon", 30),
  place("franz-kafka-museum", "mala-strana", [4, 7, 0, 0, 1, 0], 4, "daytime", 60),
  place("museum-kampa", "mala-strana", [4, 7, 2, 0, 0, 0], 5, "daytime", 60),
  // Petřín
  place("petrin-tower", "petrin", [7, 3, 10, 1, 2, 0], 8, "daytime/sunset", 60),
  place("petrin-gardens", "petrin", [4, 2, 8, 5, 0, 0], 5, "afternoon", 45),
  // Old Town
  place("charles-bridge", "old-town", [10, 8, 7, 1, 2, 0], 10, "morning", 30),
  place("old-town-square", "old-town", [10, 8, 3, 0, 1, 2], 10, "anytime", 30),
  place("old-town-hall", "old-town", [9, 8, 6, 0, 3, 0], 9, "daytime", 60),
  place("tyn-church", "old-town", [6, 7, 0, 0, 0, 0], 5, "morning", 20),
  place("clementinum", "old-town", [7, 9, 6, 0, 1, 0], 8, "daytime", 60),
  place("old-town-bridge-tower", "old-town", [5, 4, 8, 0, 2, 0], 6, "daytime/sunset", 30),
  place("havelske-market", "old-town", [5, 4, 0, 0, 0, 7], 5, "morning", 20),
  // náměstí Republiky
  place("municipal-house", "republiky", [6, 8, 0, 0, 1, 2], 6, "afternoon", 60),
  place("powder-tower", "republiky", [4, 4, 6, 0, 1, 0], 4, "daytime", 30),
  place("na-prikope", "republiky", [5, 1, 0, 0, 0, 9], 5, "anytime", 45),
  place("palladium", "republiky", [3, 0, 0, 0, 0, 9], 4, "anytime", 60),
  // Josefov
  place("jewish-museum", "josefov", [6, 9, 0, 0, 0, 0], 7, "morning/daytime", 120),
  place("convent-st-agnes", "josefov", [3, 7, 0, 0, 0, 0], 4, "daytime", 60),
  // New Town
  place("wenceslas-square", "new-town", [7, 5, 1, 0, 0, 4], 6, "anytime", 30),
  place("national-museum", "new-town", [6, 8, 1, 0, 2, 0], 6, "morning/daytime", 120),
  place("mucha-museum", "new-town", [4, 8, 0, 0, 0, 1], 5, "daytime", 60),
  place("franciscan-garden", "new-town", [3, 2, 5, 5, 0, 0], 4, "anytime", 20),
  // Riverside (Nové Město, south)
  place("dancing-house", "riverside", [6, 3, 2, 0, 0, 0], 5, "anytime", 15),
  place("naplavka", "riverside", [3, 3, 5, 6, 1, 3], 4, "afternoon", 45),
  place("vltava-one-hour-cruise", "riverside", [6, 2, 8, 3, 8, 0], 6, "afternoon", 60),
  // Vyšehrad
  place("vysehrad", "vysehrad", [6, 7, 9, 3, 0, 0], 7, "afternoon", 90),
  // Žižkov / Vinohrady
  place("zizkov-tower", "zizkov", [5, 2, 9, 0, 5, 0], 6, "evening", 60),
  place("vitkov-memorial", "zizkov", [3, 6, 7, 0, 0, 0], 4, "afternoon", 60),
  place("riegrovy-sady", "zizkov", [3, 2, 7, 5, 0, 0], 4, "sunset", 45),
  place("havlicek-gardens", "zizkov", [2, 2, 6, 6, 0, 0], 3, "afternoon", 45),
  // Letná / Holešovice
  place("letna-park", "letna", [5, 2, 8, 4, 0, 0], 6, "afternoon", 45),
  place("national-technical-museum", "letna", [4, 6, 0, 0, 5, 0], 5, "daytime", 120),
  // Holešovice (north of Letná)
  place("trade-fair-palace", "holesovice", [4, 8, 0, 0, 2, 0], 5, "daytime", 120),
  place("dox", "holesovice", [3, 7, 0, 0, 3, 0], 4, "afternoon", 90),
  place("stromovka", "holesovice", [3, 1, 7, 6, 0, 0], 4, "afternoon", 60),
  // Troja
  place("prague-zoo", "troja", [6, 0, 6, 1, 6, 0], 5, "morning", 180),
  place("troja-chateau", "troja", [2, 6, 3, 0, 0, 0], 3, "daytime", 60),
  place("botanical-garden", "troja", [4, 1, 8, 4, 3, 0], 5, "daytime", 90),
];

const BY_ID = new Map(PRAGUE_PLANNER_METADATA.map((entry) => [entry.placeId, entry]));

export function getPraguePlannerMetadataById(placeId: string): PlannerPlaceMetadata | undefined {
  return BY_ID.get(placeId);
}

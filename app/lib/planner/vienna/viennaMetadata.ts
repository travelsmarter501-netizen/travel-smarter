import type { PlannerPlaceMetadata, PreferredTime } from "../plannerTypes";

/**
 * Vienna -- planner metadata (same model and scale as Barcelona and Prague): which interest each place serves (legacy 6-key
 * weights, 0-10), how important it is, when in the day it fits, its planner area (cluster) and a planning visit length. These
 * are PLANNING judgements, not facts shown to the customer as verified data.
 *
 * Interest mapping (no beaches): `beachRelax` = relaxed outdoor time (gardens, parks); `footballExperiences` = the "تجارب
 * وترفيه" group (opera tour, riding school, Ferris wheel, zoo, Danube Tower, Haus der Musik); `foodShoppingNightlife` =
 * shopping streets and the market (restaurants are scheduled separately as meal stops).
 *
 * Clusters (walkable planner areas): innere-stadt, hofburg, museumsquartier, karlsplatz, stadtpark, belvedere, landstrasse,
 * prater, augarten, mariahilf, schoenbrunn, donau, alsergrund, kahlenberg.
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

export const VIENNA_PLANNER_METADATA: PlannerPlaceMetadata[] = [
  // Innere Stadt (around St. Stephen's)
  place("st-stephens-cathedral", "innere-stadt", [10, 9, 5, 0, 1, 0], 10, "morning", 45),
  place("mozarthaus", "innere-stadt", [5, 8, 0, 0, 2, 0], 5, "daytime", 60),
  place("haus-der-musik", "innere-stadt", [5, 6, 0, 0, 6, 0], 5, "afternoon", 90),
  place("imperial-crypt", "innere-stadt", [5, 8, 0, 0, 0, 0], 5, "daytime", 30),
  place("jewish-museum-vienna", "innere-stadt", [3, 8, 0, 0, 0, 0], 4, "daytime", 75),
  place("kaerntner-strasse-graben", "innere-stadt", [6, 2, 1, 0, 0, 9], 5, "afternoon", 60),
  // Hofburg
  place("sisi-imperial-apartments", "hofburg", [9, 9, 0, 0, 1, 0], 9, "morning", 90),
  place("state-hall-national-library", "hofburg", [7, 9, 1, 0, 0, 0], 7, "daytime", 45),
  place("albertina", "hofburg", [8, 9, 0, 0, 1, 0], 8, "daytime", 90),
  place("heldenplatz", "hofburg", [6, 6, 4, 2, 0, 0], 5, "anytime", 20),
  place("volksgarten", "hofburg", [4, 2, 6, 6, 0, 0], 4, "afternoon", 30),
  place("parliament", "hofburg", [6, 7, 1, 0, 2, 0], 6, "daytime", 60),
  place("spanish-riding-school", "hofburg", [6, 7, 0, 0, 7, 0], 6, "morning", 60),
  place("state-opera-tour", "hofburg", [7, 8, 0, 0, 7, 0], 6, "afternoon", 40),
  // MuseumsQuartier
  place("kunsthistorisches-museum", "museumsquartier", [9, 10, 0, 0, 1, 0], 9, "morning", 150),
  place("naturhistorisches-museum", "museumsquartier", [7, 8, 0, 0, 5, 0], 7, "daytime", 120),
  place("leopold-museum", "museumsquartier", [6, 9, 0, 0, 0, 0], 6, "daytime", 90),
  place("museumsquartier", "museumsquartier", [5, 5, 2, 4, 0, 1], 4, "afternoon", 30),
  // Karlsplatz / Naschmarkt
  place("karlskirche", "karlsplatz", [7, 8, 2, 0, 0, 0], 7, "daytime", 45),
  place("wien-museum", "karlsplatz", [4, 8, 2, 0, 0, 0], 5, "daytime", 75),
  place("secession", "karlsplatz", [5, 8, 0, 0, 0, 0], 5, "daytime", 45),
  place("naschmarkt", "karlsplatz", [7, 4, 0, 0, 0, 6], 6, "morning/daytime", 60),
  // Stadtpark
  place("stadtpark", "stadtpark", [5, 2, 5, 6, 0, 0], 4, "afternoon", 30),
  // Belvedere
  place("belvedere-upper", "belvedere", [9, 9, 4, 1, 0, 0], 9, "morning", 90),
  // Landstraße (Hundertwasser)
  place("hundertwasserhaus", "landstrasse", [7, 6, 2, 0, 0, 0], 6, "anytime", 20),
  place("kunst-haus-wien", "landstrasse", [4, 7, 0, 0, 1, 0], 4, "daytime", 75),
  // Prater / Augarten
  place("giant-ferris-wheel", "prater", [8, 2, 8, 1, 7, 0], 7, "daytime/evening", 30),
  place("prater", "prater", [5, 1, 5, 6, 5, 0], 4, "afternoon", 60),
  place("augarten", "augarten", [3, 4, 5, 7, 0, 0], 3, "afternoon", 45),
  // Mariahilf
  place("haus-des-meeres", "mariahilf", [5, 1, 4, 0, 7, 0], 5, "daytime", 120),
  place("mariahilfer-strasse", "mariahilf", [4, 0, 0, 0, 0, 9], 4, "afternoon", 90),
  // Schönbrunn
  place("schoenbrunn-palace", "schoenbrunn", [10, 9, 5, 1, 0, 0], 10, "morning", 120),
  place("schoenbrunn-gardens", "schoenbrunn", [7, 3, 9, 6, 0, 0], 6, "afternoon", 60),
  place("schoenbrunn-zoo", "schoenbrunn", [7, 1, 6, 2, 7, 0], 6, "morning", 180),
  // added 2026-11-07 (second batch)
  place("belvedere-lower", "belvedere", [5, 7, 2, 1, 0, 0], 5, "daytime", 60),
  place("sigmund-freud-museum", "alsergrund", [5, 8, 0, 0, 1, 0], 5, "daytime", 60),
  place("votivkirche", "alsergrund", [4, 6, 2, 0, 0, 0], 4, "daytime", 30),
  place("mak", "landstrasse", [4, 8, 0, 0, 1, 1], 4, "daytime", 90),
  place("peterskirche", "innere-stadt", [5, 6, 0, 0, 0, 0], 4, "anytime", 20),
  place("michaelerplatz", "hofburg", [5, 5, 2, 0, 0, 0], 4, "anytime", 15),
  place("judenplatz", "innere-stadt", [3, 6, 0, 0, 0, 0], 3, "anytime", 15),
  place("ankeruhr", "innere-stadt", [4, 4, 0, 0, 2, 0], 3, "daytime", 15),
  place("rathaus", "hofburg", [5, 5, 2, 1, 0, 0], 4, "anytime", 20),
  place("donaukanal", "innere-stadt", [3, 3, 4, 5, 1, 0], 3, "afternoon", 45),
  place("donauinsel", "donau", [2, 0, 6, 8, 1, 0], 3, "afternoon", 60),
  place("kahlenberg", "kahlenberg", [4, 1, 9, 5, 0, 0], 4, "afternoon", 90),
  // Danube
  place("danube-tower", "donau", [6, 0, 9, 1, 7, 0], 5, "sunset", 75),
];

const BY_ID = new Map(VIENNA_PLANNER_METADATA.map((entry) => [entry.placeId, entry]));

export function getViennaPlannerMetadataById(placeId: string): PlannerPlaceMetadata | undefined {
  return BY_ID.get(placeId);
}

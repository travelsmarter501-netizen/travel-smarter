/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 * Prints top-10 rankings for a handful of interest profiles so the metadata + scoring
 * formula can be eyeballed for sanity. Run with:
 *
 *   npx tsx app/lib/planner/plannerScoring.debug.ts
 */
import { rankBarcelonaPlannerPlaces } from "./plannerScoring";
import type { PlannerInterest } from "./plannerTypes";

const profiles: { label: string; interests: PlannerInterest[] }[] = [
  { label: "A) popular", interests: ["popular"] },
  { label: "B) popular + viewsNature", interests: ["popular", "viewsNature"] },
  { label: "C) footballExperiences", interests: ["footballExperiences"] },
  { label: "D) cultureLocal", interests: ["cultureLocal"] },
  { label: "E) beachRelax", interests: ["beachRelax"] },
];

for (const profile of profiles) {
  console.log(`\n=== ${profile.label} ===`);
  const ranked = rankBarcelonaPlannerPlaces({ interests: profile.interests });
  ranked.slice(0, 10).forEach((place, index) => {
    console.log(
      `${index + 1}. ${place.placeId} — score ${place.score} (priority ${place.metadata.priority}, cluster ${place.metadata.cluster})`
    );
  });
}

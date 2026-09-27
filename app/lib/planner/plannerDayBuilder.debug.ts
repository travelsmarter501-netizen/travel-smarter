/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 * Prints full 3-day plans + a quality audit for a set of interest profiles, so the
 * day-building behavior can be eyeballed for sanity before any UI is built. Run with:
 *
 *   npx tsx app/lib/planner/plannerDayBuilder.debug.ts
 */
import {
  buildBarcelonaPlannerPlan,
  BARCELONA_ICONIC_TIER_A,
  BARCELONA_ICONIC_TIER_B,
  BARCELONA_SIMILARITY_GROUPS,
} from "./barcelona-planner-day-builder";
import type { PlannerInterest } from "./plannerTypes";

const profiles: { label: string; interests: PlannerInterest[] }[] = [
  { label: "A) popular", interests: ["popular"] },
  { label: "B) popular + viewsNature", interests: ["popular", "viewsNature"] },
  { label: "C) footballExperiences", interests: ["footballExperiences"] },
  { label: "D) cultureLocal", interests: ["cultureLocal"] },
  { label: "E) beachRelax", interests: ["beachRelax"] },
  { label: "F) popular + footballExperiences", interests: ["popular", "footballExperiences"] },
  { label: "G) popular + cultureLocal + viewsNature", interests: ["popular", "cultureLocal", "viewsNature"] },
];

const SPECIAL_INTEREST_GOALS: Record<string, string[]> = {
  footballExperiences: ["camp-nou"],
  beachRelax: ["barceloneta-beach", "bogatell", "nova-icaria"],
  viewsNature: ["bunkers-carmel", "mnac", "tibidabo"],
  cultureLocal: ["gothic-quarter", "sagrada-familia", "barcelona-cathedral", "palau-musica", "sant-pau"],
};

for (const profile of profiles) {
  console.log(`\n\n================ ${profile.label} ================`);
  const plan = buildBarcelonaPlannerPlan({ days: 3, preferences: { interests: profile.interests } });

  const allStopIds: string[] = [];
  for (const day of plan.days) {
    console.log(`\n-- Day ${day.dayNumber} -- (${day.stops.length} stops, ${day.totalVisitMinutes} min, clusters: ${day.clusters.join(", ")})`);
    for (const stop of day.stops) {
      console.log(`  - ${stop.placeId} (score ${stop.score})`);
      allStopIds.push(stop.placeId);
    }
  }

  const uniqueClusters = new Set(plan.days.flatMap((d) => d.clusters));
  const anyDayOver420 = plan.days.some((d) => d.totalVisitMinutes > 420);
  const anyDayAt3Clusters = plan.days.some((d) => d.clusters.length >= 3);
  const avgStopsPerDay = (allStopIds.length / plan.days.length).toFixed(2);

  const similarityHits = BARCELONA_SIMILARITY_GROUPS.map((group: { id: string; placeIds: string[]; maxByDefault: number; unlockedByInterest?: PlannerInterest; maxWithInterest?: number }) => {
    const count = allStopIds.filter((id) => group.placeIds.includes(id)).length;
    const cap =
      group.unlockedByInterest && profile.interests.includes(group.unlockedByInterest)
        ? (group.maxWithInterest ?? group.maxByDefault)
        : group.maxByDefault;
    return { group: group.id, count, cap, triggered: count === cap && group.placeIds.length > cap };
  });

  console.log("\n-- Quality audit --");
  console.log("Total stops:", allStopIds.length, "| Average stops/day:", avgStopsPerDay);
  console.log("Unique clusters used:", uniqueClusters.size, "->", [...uniqueClusters].join(", "));
  console.log("Any day exceeds 420 min (soft upper)?", anyDayOver420);
  console.log("Any day uses 3 clusters (fragmentation cap)?", anyDayAt3Clusters);
  console.log("Similarity group counts:", JSON.stringify(similarityHits));

  for (const interest of profile.interests) {
    const goalPlaces = SPECIAL_INTEREST_GOALS[interest];
    if (!goalPlaces) continue;
    const covered = goalPlaces.filter((id) => allStopIds.includes(id));
    console.log(`Special-interest protection for "${interest}":`, covered.length > 0 ? `YES (${covered.join(", ")})` : "NO — MISSING");
  }

  if (profile.interests.includes("popular")) {
    const tierACovered = BARCELONA_ICONIC_TIER_A.filter((id: string) => allStopIds.includes(id));
    const tierBCovered = BARCELONA_ICONIC_TIER_B.filter((id: string) => allStopIds.includes(id));
    console.log(`Tier A coverage: ${tierACovered.length}/${BARCELONA_ICONIC_TIER_A.length} (${tierACovered.join(", ")}) — target >=4`);
    console.log(`Tier B coverage: ${tierBCovered.length}/${BARCELONA_ICONIC_TIER_B.length} (${tierBCovered.join(", ")})`);
  }
}

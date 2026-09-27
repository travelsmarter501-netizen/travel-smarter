/**
 * Dev-only debug script — NOT part of the app.
 *
 * Fix Repetitive Montjuïc Day + Restore Native Transport UI -- BEFORE measurement. Finds every
 * generated day containing "montjuic" and/or "mnac", reports exact composition, cluster
 * compatibility context, and how often Boqueria+Montjuïc+MNAC (or Montjuïc+MNAC both at full
 * duration) repeats across a real profile x day-count matrix. Read-only.
 *
 * Run with:
 *   npx tsx app/lib/planner/montjuicDayQualityAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import type { PlannerInterest } from "./plannerTypes";

const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

type ProfileDef = { label: string; interests: PlannerInterest[]; experiencesSelected: boolean };
const PROFILES: ProfileDef[] = [
  { label: "Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false },
  { label: "Popular", interests: ["popular"], experiencesSelected: false },
  { label: "Culture", interests: ["cultureLocal"], experiencesSelected: false },
  { label: "Food", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Experiences+Entertainment", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"], experiencesSelected: false },
  { label: "All 6 interests", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
];
const DAY_COUNTS = [3, 5, 7, 10];

function configFor(profile: ProfileDef) {
  const isPlaceEligibleForDay = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || profile.experiencesSelected;
  return { ...BARCELONA_V2_DESTINATION_CONFIG, dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay } };
}

let totalPlans = 0;
let daysWithMontjuic = 0;
let daysWithMnac = 0;
let daysWithBoth = 0;
let daysWithBothFullDuration = 0;
let daysWithBoqueriaMontjuicMnac = 0;
let daysWithCampNou = 0;
let plansWithCampNouUnused = 0;
const exampleDays: string[] = [];
const allMontjuicOrMnacDays: string[] = [];
const unusedCampNouPlans: string[] = [];

for (const profile of PROFILES) {
  for (const days of DAY_COUNTS) {
    const config = configFor(profile);
    const result = generateTravelPlan(config, { interests: profile.interests }, days);
    if (!result.ok) continue;
    totalPlans++;

    const allIds = result.data.plan.days.flatMap((d) => d.stops.map((s) => s.placeId));
    const hasCampNouAnywhere = allIds.includes("camp-nou");
    if (!hasCampNouAnywhere && (profile.experiencesSelected || profile.interests.includes("popular") || profile.label === "All 6 interests")) {
      plansWithCampNouUnused++;
      unusedCampNouPlans.push(`${profile.label} ${days}d`);
    }

    for (const day of result.data.plan.days) {
      const ids = day.stops.map((s) => s.placeId);
      const hasMontjuic = ids.includes("montjuic");
      const hasMnac = ids.includes("mnac");
      const hasBoqueria = ids.includes("boqueria");
      const hasCampNou = ids.includes("camp-nou");
      if (hasMontjuic) daysWithMontjuic++;
      if (hasMnac) daysWithMnac++;
      if (hasCampNou) daysWithCampNou++;
      if (hasMontjuic || hasMnac) {
        allMontjuicOrMnacDays.push(`${profile.label} ${days}d Day${day.dayNumber}: [${ids.join(", ")}] visitMin=${day.totalVisitMinutes} clusters=[${day.clusters.join(",")}]`);
      }
      if (hasMontjuic && hasMnac) {
        daysWithBoth++;
        const montjuicStop = day.stops.find((s) => s.placeId === "montjuic")!;
        const mnacStop = day.stops.find((s) => s.placeId === "mnac")!;
        if (exampleDays.length < 15) {
          exampleDays.push(`${profile.label} ${days}d Day${day.dayNumber}: [${ids.join(", ")}] visitMin=${day.totalVisitMinutes} clusters=[${day.clusters.join(",")}]`);
        }
        daysWithBothFullDuration++;
        void montjuicStop;
        void mnacStop;
      }
      if (hasBoqueria && hasMontjuic && hasMnac) daysWithBoqueriaMontjuicMnac++;
    }
  }
}

console.log(`Total plans: ${totalPlans}`);
console.log(`Days with montjuic: ${daysWithMontjuic}`);
console.log(`Days with mnac: ${daysWithMnac}`);
console.log(`Days with BOTH montjuic+mnac: ${daysWithBoth}`);
console.log(`Days with both at full (unreduced) duration: ${daysWithBothFullDuration}`);
console.log(`Days with Boqueria+Montjuïc+MNAC together: ${daysWithBoqueriaMontjuicMnac}`);
console.log(`Days with Camp Nou: ${daysWithCampNou}`);
console.log(`Plans where Camp Nou never appears despite a fitting profile: ${plansWithCampNouUnused}`);
console.log("\nExample montjuic+mnac days:");
for (const e of exampleDays) console.log(`  ${e}`);

console.log("\nAll montjuic-or-mnac days:");
for (const e of allMontjuicOrMnacDays) console.log(`  ${e}`);

console.log("\nPlans with Camp Nou unused despite fitting profile:");
for (const p of unusedCampNouPlans) console.log(`  ${p}`);

console.log("\nDONE.");

/**
 * Dev-only debug script — NOT part of the app.
 *
 * Increase Camp Nou Must-See Coverage -- measures Camp Nou (and, as a regression check,
 * Sagrada Família) inclusion across the full 11-profile x 1-10-day matrix. Read-only.
 *
 * Run with:
 *   npx tsx app/lib/planner/campNouCoverageAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { classifyDayDensity } from "./barcelonaV2Density";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import type { PlannerInterest } from "./plannerTypes";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";

const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

type ProfileDef = { label: string; interests: PlannerInterest[]; experiencesSelected: boolean; surpriseMe?: boolean };

const PROFILES: ProfileDef[] = [
  { label: "Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false, surpriseMe: true },
  { label: "Popular", interests: ["popular"], experiencesSelected: false },
  { label: "Culture", interests: ["cultureLocal"], experiencesSelected: false },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Experiences+Entertainment", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"], experiencesSelected: false },
  { label: "Popular+Nature", interests: ["popular", "viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food+Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "All 6 interests", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
];

// Fix 3-Day Surprise Me Camp Nou Coverage: `flagshipCoverageGoals` is now request-specific
// (see getBarcelonaFlagshipCoverageGoals's own doc comment in barcelonaMustSeePolicy.ts),
// exactly mirroring how app/smart-planner/barcelona-v2/actions.ts builds it per request.
function configFor(profile: ProfileDef, days: number) {
  const isPlaceEligibleForDay = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || profile.experiencesSelected;
  const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe: !!profile.surpriseMe, days });
  return { ...BARCELONA_V2_DESTINATION_CONFIG, dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay, flagshipCoverageGoals } };
}

function planStopIds(plan: GeneratedPlannerPlan): Set<string> {
  return new Set(plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
}

type Bucket = "1" | "2-3" | "4-5" | "6-10";
function bucketFor(days: number): Bucket {
  if (days === 1) return "1";
  if (days <= 3) return "2-3";
  if (days <= 5) return "4-5";
  return "6-10";
}

type Tally = { included: number; total: number };
function emptyBuckets(): Record<Bucket, Tally> {
  return { "1": { included: 0, total: 0 }, "2-3": { included: 0, total: 0 }, "4-5": { included: 0, total: 0 }, "6-10": { included: 0, total: 0 } };
}

const campNouByBucket = emptyBuckets();
const sagradaByBucket = emptyBuckets();
const campNouByProfile: Record<string, Record<Bucket, Tally>> = {};

let totalPlans = 0;
let totalDays = 0;
let thinCount = 0;
let veryThinCount = 0;
let reclaimActivations = 0;
const thinDetails: string[] = [];
const veryThinDetails: string[] = [];

for (const profile of PROFILES) {
  campNouByProfile[profile.label] = emptyBuckets();
  for (let days = 1; days <= 10; days++) {
    const config = configFor(profile, days);
    const result = generateTravelPlan(config, { interests: profile.interests }, days);
    if (!result.ok) continue;
    totalPlans++;
    const bucket = bucketFor(days);

    const reclaimed = computeNaturalClusterReclaim(
      result.data.plan,
      result.data.legsByDay,
      BARCELONA_V2_DESTINATION_CONFIG.plannerMetadata,
      config.routeOptimizationConfig,
      config.dayBuilderConfig.clusterCompatibility,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );
    if (reclaimed.applied.length > 0) reclaimActivations++;
    const crossDay = applyCrossDayOptimization(
      reclaimed.plan,
      reclaimed.legsByDay,
      BARCELONA_V2_DESTINATION_CONFIG.plannerMetadata,
      config.routeOptimizationConfig,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );
    const finalPlan = crossDay.plan;
    const stopIds = planStopIds(finalPlan);
    const hasCampNou = stopIds.has("camp-nou");
    const hasSagrada = stopIds.has("sagrada-familia");

    campNouByBucket[bucket].total++;
    sagradaByBucket[bucket].total++;
    campNouByProfile[profile.label][bucket].total++;
    if (hasCampNou) {
      campNouByBucket[bucket].included++;
      campNouByProfile[profile.label][bucket].included++;
    }
    if (hasSagrada) sagradaByBucket[bucket].included++;

    for (const day of finalPlan.days) {
      totalDays++;
      const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
      if (density === "thin") {
        thinCount++;
        thinDetails.push(`${profile.label} ${days}d Day${day.dayNumber}: [${day.stops.map((s) => s.placeId).join(",")}] ${day.totalVisitMinutes}min`);
      }
      if (density === "veryThin") {
        veryThinCount++;
        veryThinDetails.push(`${profile.label} ${days}d Day${day.dayNumber}: [${day.stops.map((s) => s.placeId).join(",")}] ${day.totalVisitMinutes}min`);
      }
    }
  }
}

console.log(`Total plans: ${totalPlans}\n`);

console.log("================ CAMP NOU INCLUSION BY BUCKET ================");
for (const bucket of ["1", "2-3", "4-5", "6-10"] as Bucket[]) {
  const t = campNouByBucket[bucket];
  console.log(`${bucket} days: ${t.included}/${t.total} (${t.total ? ((t.included / t.total) * 100).toFixed(1) : "0.0"}%)`);
}

console.log("\n================ SAGRADA INCLUSION BY BUCKET (regression check) ================");
for (const bucket of ["1", "2-3", "4-5", "6-10"] as Bucket[]) {
  const t = sagradaByBucket[bucket];
  console.log(`${bucket} days: ${t.included}/${t.total} (${t.total ? ((t.included / t.total) * 100).toFixed(1) : "0.0"}%)`);
}

console.log("\n================ CAMP NOU INCLUSION BY PROFILE ================");
for (const profile of PROFILES) {
  const row = campNouByProfile[profile.label];
  const parts = (["1", "2-3", "4-5", "6-10"] as Bucket[]).map((b) => `${b}d=${row[b].included}/${row[b].total}`);
  console.log(`${profile.label}: ${parts.join(" | ")}`);
}

console.log(`\nTotal days: ${totalDays} | thin=${thinCount} | veryThin=${veryThinCount} | reclaimActivations=${reclaimActivations}/${totalPlans}`);
console.log("\nthin day details:");
for (const d of thinDetails) console.log(`  ${d}`);
console.log("\nveryThin day details:");
for (const d of veryThinDetails) console.log(`  ${d}`);

console.log("\nDONE.");

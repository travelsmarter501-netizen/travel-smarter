/**
 * Dev-only debug script — NOT part of the app.
 *
 * Barcelona Must-See Priority Audit -- measures current Sagrada Família (and other Guide
 * mustSee-flagged attractions) inclusion rate across the full 11-profile x 1-10-day matrix,
 * BEFORE any planner change. Read-only.
 *
 * Run with:
 *   npx tsx app/lib/planner/mustSeePriorityAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { barcelonaGuide } from "../barcelona-guide";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { classifyDayDensity } from "./barcelonaV2Density";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { BARCELONA_FLAGSHIP_MUST_SEE, FLAGSHIP_MUST_SEE_BOOST } from "./barcelonaMustSeePolicy";
import type { PlannerInterest } from "./plannerTypes";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";

const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

type ProfileDef = { label: string; interests: PlannerInterest[]; experiencesSelected: boolean };

const PROFILES: ProfileDef[] = [
  { label: "Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false },
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

function configFor(profile: ProfileDef) {
  const isPlaceEligibleForDay = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || profile.experiencesSelected;
  return { ...BARCELONA_V2_DESTINATION_CONFIG, dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay } };
}

// Every attraction currently flagged mustSee: true in the real Guide data.
const MUST_SEE_ATTRACTION_IDS = barcelonaGuide.attractions.filter((a) => a.mustSee).map((a) => a.id);
console.log(`Guide mustSee=true attractions: ${MUST_SEE_ATTRACTION_IDS.length}`);
console.log(MUST_SEE_ATTRACTION_IDS.join(", "));
console.log("");

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
const overallByBucket: Record<Bucket, Tally> = { "1": { included: 0, total: 0 }, "2-3": { included: 0, total: 0 }, "4-5": { included: 0, total: 0 }, "6-10": { included: 0, total: 0 } };
const byProfile: Record<string, Record<Bucket, Tally>> = {};
const mustSeeCountDistribution = new Map<number, number>(); // number of Guide mustSee places actually in the plan -> count of plans
const otherMustSeeByBucket: Record<Bucket, Tally> = { "1": { included: 0, total: 0 }, "2-3": { included: 0, total: 0 }, "4-5": { included: 0, total: 0 }, "6-10": { included: 0, total: 0 } };

let totalPlans = 0;

for (const profile of PROFILES) {
  byProfile[profile.label] = { "1": { included: 0, total: 0 }, "2-3": { included: 0, total: 0 }, "4-5": { included: 0, total: 0 }, "6-10": { included: 0, total: 0 } };
  for (let days = 1; days <= 10; days++) {
    const config = configFor(profile);
    const result = generateTravelPlan(config, { interests: profile.interests }, days);
    if (!result.ok) continue;
    totalPlans++;
    const bucket = bucketFor(days);
    const stopIds = planStopIds(result.data.plan);
    const hasSagrada = stopIds.has("sagrada-familia");

    overallByBucket[bucket].total++;
    byProfile[profile.label][bucket].total++;
    if (hasSagrada) {
      overallByBucket[bucket].included++;
      byProfile[profile.label][bucket].included++;
    }

    const otherMustSeeCount = MUST_SEE_ATTRACTION_IDS.filter((id) => id !== "sagrada-familia" && stopIds.has(id)).length;
    const totalMustSeeCount = MUST_SEE_ATTRACTION_IDS.filter((id) => stopIds.has(id)).length;
    mustSeeCountDistribution.set(totalMustSeeCount, (mustSeeCountDistribution.get(totalMustSeeCount) ?? 0) + 1);
    otherMustSeeByBucket[bucket].total++;
    if (otherMustSeeCount > 0) otherMustSeeByBucket[bucket].included++;
  }
}

console.log(`Total plans generated: ${totalPlans}\n`);

console.log("================ SAGRADA FAMÍLIA INCLUSION BY BUCKET (overall) ================");
for (const bucket of ["1", "2-3", "4-5", "6-10"] as Bucket[]) {
  const t = overallByBucket[bucket];
  console.log(`${bucket} days: ${t.included}/${t.total} (${t.total ? ((t.included / t.total) * 100).toFixed(1) : "0.0"}%)`);
}

console.log("\n================ SAGRADA FAMÍLIA INCLUSION BY PROFILE ================");
for (const profile of PROFILES) {
  const row = byProfile[profile.label];
  const parts = (["1", "2-3", "4-5", "6-10"] as Bucket[]).map((b) => `${b}d=${row[b].included}/${row[b].total}`);
  console.log(`${profile.label}: ${parts.join(" | ")}`);
}

console.log("\n================ MUST-SEE COUNT DISTRIBUTION (how many Guide mustSee places per plan) ================");
for (const [count, plans] of [...mustSeeCountDistribution.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${count} must-see place(s): ${plans} plans`);
}

console.log("\n================ ANY-OTHER-MUST-SEE INCLUSION BY BUCKET (excluding Sagrada) ================");
for (const bucket of ["1", "2-3", "4-5", "6-10"] as Bucket[]) {
  const t = otherMustSeeByBucket[bucket];
  console.log(`${bucket} days: ${t.included}/${t.total} (${t.total ? ((t.included / t.total) * 100).toFixed(1) : "0.0"}%)`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 2 -- FULL REAL PIPELINE (Day Builder -> Natural Cluster Reclaim -> Cross-Day Optimizer),
// exactly matching what a real customer receives (see actions.ts's own call order). Reports
// Sagrada inclusion + density/coverage AFTER every repair pass a real plan actually goes
// through -- the raw-builder-only view above can show a transient thin/veryThin day that a
// downstream pass then fixes, so this is the number that actually matters for plan quality.
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 2: FULL PIPELINE (reclaim + cross-day) ================\n");

let sagradaIncludedFull = 0;
let totalFull = 0;
let thinCount = 0;
let veryThinCount = 0;
let totalDays = 0;
let reclaimActivations = 0;
const veryThinDetails: string[] = [];

for (const profile of PROFILES) {
  for (let days = 1; days <= 10; days++) {
    const config = configFor(profile);
    const result = generateTravelPlan(config, { interests: profile.interests }, days);
    if (!result.ok) continue;
    totalFull++;

    const reclaimed = computeNaturalClusterReclaim(
      result.data.plan,
      result.data.legsByDay,
      BARCELONA_V2_DESTINATION_CONFIG.plannerMetadata,
      BARCELONA_V2_DESTINATION_CONFIG.routeOptimizationConfig,
      config.dayBuilderConfig.clusterCompatibility,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );
    if (reclaimed.applied.length > 0) reclaimActivations++;

    const crossDay = applyCrossDayOptimization(
      reclaimed.plan,
      reclaimed.legsByDay,
      BARCELONA_V2_DESTINATION_CONFIG.plannerMetadata,
      BARCELONA_V2_DESTINATION_CONFIG.routeOptimizationConfig,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );

    const finalPlan = crossDay.plan;
    const stopIds = planStopIds(finalPlan);
    if (stopIds.has("sagrada-familia")) sagradaIncludedFull++;

    for (const day of finalPlan.days) {
      totalDays++;
      const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
      if (density === "thin") thinCount++;
      if (density === "veryThin") {
        veryThinCount++;
        veryThinDetails.push(`${profile.label} ${days}d Day${day.dayNumber}: [${day.stops.map((s) => s.placeId).join(",")}] ${day.totalVisitMinutes}min`);
      }
    }
  }
}

console.log(`Sagrada inclusion (full pipeline): ${sagradaIncludedFull}/${totalFull} (${((sagradaIncludedFull / totalFull) * 100).toFixed(1)}%)`);
console.log(`Reclaim activations: ${reclaimActivations}/${totalFull}`);
console.log(`Total days: ${totalDays} | thin=${thinCount} | veryThin=${veryThinCount}`);
console.log("\nveryThin day details:");
for (const d of veryThinDetails) console.log(`  ${d}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 3 -- Must-See Final Polish: 1-DAY SPECIALIZED A/B. Variant A = current shipped policy
// (coverage-repair guarantee + boost). Variant B = boost-only (guarantee disabled via
// minCoverage: 0). RESULT (see barcelonaMustSeePolicy.ts's own doc comment for the full
// writeup): byte-identical in all 8 profiles below -- the guarantee never actually had to fire,
// so the shipped policy stays unconditional. Kept here as a permanent regression check: if a
// future candidate-pool/scoring change ever makes A and B diverge for a specialized profile,
// that is the signal to revisit whether a conditional policy is now warranted.
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 3: 1-DAY SPECIALIZED A/B (guarantee vs boost-only) ================\n");

const AB_PROFILES: ProfileDef[] = [
  { label: "Food", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Experiences+Entertainment", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Popular", interests: ["popular"], experiencesSelected: false },
  { label: "Culture", interests: ["cultureLocal"], experiencesSelected: false },
  { label: "Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false },
  { label: "All 6 interests", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
];

// Variant B disables the coverage-repair GUARANTEE via `minCoverage: 0` (satisfied immediately,
// so the forced-swap loop never runs) while keeping the exact same unconditional `boost` --
// this tests "boost-only" using only the ALREADY-EXISTING FlagshipCoverageGoal shape, no
// separate conditional-policy field needed (see barcelonaMustSeePolicy.ts's own doc comment for
// why the real shipped policy stays unconditional: this comparison found zero difference).
function configWithGuarantee(profile: ProfileDef, guarantee: boolean) {
  const base = configFor(profile);
  return {
    ...base,
    dayBuilderConfig: {
      ...base.dayBuilderConfig,
      flagshipCoverageGoals: [
        {
          candidates: BARCELONA_FLAGSHIP_MUST_SEE,
          minCoverage: guarantee ? 1 : 0,
          boost: FLAGSHIP_MUST_SEE_BOOST,
        },
      ],
    },
  };
}

function summarizePlan(plan: GeneratedPlannerPlan, legsByDay: import("./plannerTransportTypes").PlannerRouteLeg[][]) {
  const day = plan.days[0];
  const legs = legsByDay[0] ?? [];
  const travelMinutes = legs
    .map((l) => (l.sourceStatus === "unresolved" || !l.recommendedMode ? null : l.options.find((o) => o.mode === l.recommendedMode)))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .reduce((sum, o) => sum + Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2), 0);
  const unresolvedCount = legs.filter((l) => l.sourceStatus === "unresolved").length;
  return {
    stopIds: day.stops.map((s) => s.placeId),
    stopCount: day.stops.length,
    visitMinutes: day.totalVisitMinutes,
    clusters: day.clusters,
    travelMinutes,
    unresolvedCount,
    density: classifyDayDensity(day.stops.length, day.totalVisitMinutes),
    hasSagrada: day.stops.some((s) => s.placeId === "sagrada-familia"),
  };
}

for (const profile of AB_PROFILES) {
  const configA = configWithGuarantee(profile, true); // Variant A: current (guarantee + boost)
  const configB = configWithGuarantee(profile, false); // Variant B: boost-only, no forced guarantee

  const resultA = generateTravelPlan(configA, { interests: profile.interests }, 1);
  const resultB = generateTravelPlan(configB, { interests: profile.interests }, 1);
  if (!resultA.ok || !resultB.ok) {
    console.log(`${profile.label}: generation failed`);
    continue;
  }

  const a = summarizePlan(resultA.data.plan, resultA.data.legsByDay);
  const b = summarizePlan(resultB.data.plan, resultB.data.legsByDay);

  console.log(`-- ${profile.label} --`);
  console.log(`  A (guarantee): sagrada=${a.hasSagrada} stops=${a.stopCount} visit=${a.visitMinutes}min travel=${a.travelMinutes}min unresolved=${a.unresolvedCount} clusters=${a.clusters.length} density=${a.density}`);
  console.log(`    [${a.stopIds.join(", ")}]`);
  console.log(`  B (boost-only): sagrada=${b.hasSagrada} stops=${b.stopCount} visit=${b.visitMinutes}min travel=${b.travelMinutes}min unresolved=${b.unresolvedCount} clusters=${b.clusters.length} density=${b.density}`);
  console.log(`    [${b.stopIds.join(", ")}]`);
  console.log(`  IDENTICAL=${JSON.stringify(a.stopIds) === JSON.stringify(b.stopIds)}`);
  console.log("");
}

console.log("\nDONE.");

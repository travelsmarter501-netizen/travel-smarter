/**
 * Dev-only debug script — NOT part of the app.
 *
 * Fix 3-Day Surprise Me Camp Nou Coverage -- permanent regression check for the Surprise-Me-
 * specific conditional flagship boost (see getBarcelonaFlagshipCoverageGoals in
 * barcelonaMustSeePolicy.ts). Runs the REAL full pipeline (Day Builder -> Natural Cluster
 * Reclaim -> Cross-Day Optimization), exactly mirroring app/smart-planner/barcelona-v2/
 * actions.ts's own call order, for Surprise Me across 1-10 days. Read-only.
 *
 * Run with:
 *   npx tsx app/lib/planner/surpriseMe3DayCampNouAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { classifyDayDensity } from "./barcelonaV2Density";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { getBarcelonaFlagshipCoverageGoals, FLAGSHIP_TIER_B_BOOST } from "./barcelonaMustSeePolicy";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

const preferences = { interests: SURPRISE_ME_LEGACY_INTERESTS };

function configFor(days: number, useFix: boolean) {
  const flagshipCoverageGoals = useFix
    ? getBarcelonaFlagshipCoverageGoals({ surpriseMe: true, days })
    : // BEFORE behavior: the plain, non-conditional Tier B boost, same as every other profile.
      getBarcelonaFlagshipCoverageGoals({ surpriseMe: false, days });
  return { ...BARCELONA_V2_DESTINATION_CONFIG, dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, flagshipCoverageGoals } };
}

function runFullPipeline(days: number, useFix: boolean) {
  const config = configFor(days, useFix);
  const result = generateTravelPlan(config, preferences, days);
  if (!result.ok) return null;

  const reclaimed = computeNaturalClusterReclaim(
    result.data.plan,
    result.data.legsByDay,
    config.plannerMetadata,
    config.routeOptimizationConfig,
    config.dayBuilderConfig.clusterCompatibility,
    config.dayBuilderConfig.isPlaceEligibleForDay,
    null
  );
  const crossDay = applyCrossDayOptimization(
    reclaimed.plan,
    reclaimed.legsByDay,
    config.plannerMetadata,
    config.routeOptimizationConfig,
    config.dayBuilderConfig.isPlaceEligibleForDay,
    null
  );
  return { plan: crossDay.plan, legsByDay: crossDay.legsByDay };
}

function planStopIds(plan: GeneratedPlannerPlan): Set<string> {
  return new Set(plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
}

function travelMinutesForDay(legs: PlannerRouteLeg[]): number {
  return legs
    .map((l) => (l.sourceStatus === "unresolved" || !l.recommendedMode ? null : l.options.find((o) => o.mode === l.recommendedMode)))
    .filter((o): o is NonNullable<typeof o> => !!o)
    .reduce((sum, o) => sum + Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2), 0);
}

function unresolvedCountForDay(legs: PlannerRouteLeg[]): number {
  return legs.filter((l) => l.sourceStatus === "unresolved").length;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 1: Surprise Me Camp Nou inclusion, 1-10 days, BEFORE (plain boost=10) vs AFTER (fix)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log(`Base Tier B boost: ${FLAGSHIP_TIER_B_BOOST} (used by BEFORE, and by AFTER for 1-2 day Surprise Me)\n`);
console.log("================ SURPRISE ME: CAMP NOU INCLUSION BY DAY, BEFORE vs AFTER ================");
let beforeTotal = 0;
let afterTotal = 0;
for (let days = 1; days <= 10; days++) {
  const before = runFullPipeline(days, false);
  const after = runFullPipeline(days, true);
  const beforeHas = before ? planStopIds(before.plan).has("camp-nou") : false;
  const afterHas = after ? planStopIds(after.plan).has("camp-nou") : false;
  if (beforeHas) beforeTotal++;
  if (afterHas) afterTotal++;
  const beforeSagrada = before ? planStopIds(before.plan).has("sagrada-familia") : false;
  const afterSagrada = after ? planStopIds(after.plan).has("sagrada-familia") : false;
  console.log(`  ${days}d: BEFORE campNou=${beforeHas} sagrada=${beforeSagrada}  |  AFTER campNou=${afterHas} sagrada=${afterSagrada}${beforeHas !== afterHas ? "  <== CHANGED" : ""}`);
}
console.log(`\nSurprise Me Camp Nou total (1-10d): BEFORE ${beforeTotal}/10  ->  AFTER ${afterTotal}/10`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 2: Manual QA -- 3d/4d/5d Surprise Me, full detail (AFTER / shipped policy)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ MANUAL QA: 3d / 4d / 5d SURPRISE ME (AFTER, full pipeline) ================");
for (const days of [3, 4, 5]) {
  const result = runFullPipeline(days, true);
  console.log(`\n-- ${days}-day Surprise Me --`);
  if (!result) {
    console.log("  FAILED to generate.");
    continue;
  }
  const stopIds = planStopIds(result.plan);
  result.plan.days.forEach((day, i) => {
    const legs = result.legsByDay[i] ?? [];
    const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
    const hasCampNou = day.stops.some((s) => s.placeId === "camp-nou");
    console.log(
      `  Day${day.dayNumber}${hasCampNou ? " [CAMP NOU]" : ""}: [${day.stops.map((s) => s.placeId).join(", ")}] visitMin=${day.totalVisitMinutes} clusters=[${day.clusters.join(",")}] density=${density} travelMin=${travelMinutesForDay(legs)} unresolved=${unresolvedCountForDay(legs)}`
    );
  });
  console.log(`  Sagrada included: ${stopIds.has("sagrada-familia")}`);
  console.log(`  Camp Nou included: ${stopIds.has("camp-nou")}`);
  console.log(`  Old City represented: ${["gothic-quarter", "barcelona-cathedral", "boqueria", "la-rambla", "placa-reial", "portal-angel", "museu-historia-catalunya"].some((id) => stopIds.has(id))}`);
  console.log(`  Beach represented: ${["barceloneta-beach", "bogatell", "nova-icaria"].some((id) => stopIds.has(id))}`);
  console.log(`  Views/Nature represented: ${["park-guell", "bunkers-carmel", "tibidabo", "mnac", "jardins-palau-pedralbes"].some((id) => stopIds.has(id))}`);
  console.log(`  Food represented: ${["mercat-sant-antoni", "mercat-sagrada-familia", "boqueria", "cook-and-taste-paella-class", "gothic-quarter-tapas-wine-tour"].some((id) => stopIds.has(id))}`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 3: Full 1-10 day density/diversity summary for Surprise Me (AFTER)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ SURPRISE ME 1-10d SUMMARY (AFTER) ================");
let totalStops = 0;
let totalDaysCount = 0;
let totalTravelMinutes = 0;
let totalUnresolved = 0;
let thinCount = 0;
let veryThinCount = 0;
const uniqueClustersPerPlan: number[] = [];
for (let days = 1; days <= 10; days++) {
  const result = runFullPipeline(days, true);
  if (!result) continue;
  const allClusters = new Set<string>();
  result.plan.days.forEach((day, i) => {
    totalDaysCount++;
    totalStops += day.stops.length;
    for (const c of day.clusters) allClusters.add(c);
    const legs = result.legsByDay[i] ?? [];
    totalTravelMinutes += travelMinutesForDay(legs);
    totalUnresolved += unresolvedCountForDay(legs);
    const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
    if (density === "thin") thinCount++;
    if (density === "veryThin") veryThinCount++;
  });
  uniqueClustersPerPlan.push(allClusters.size);
}
console.log(`Average stop count per day: ${(totalStops / totalDaysCount).toFixed(2)}`);
console.log(`Total travel minutes (sum across all days/plans): ${totalTravelMinutes}`);
console.log(`Total unresolved legs: ${totalUnresolved}`);
console.log(`thin=${thinCount} veryThin=${veryThinCount} (of ${totalDaysCount} days)`);
console.log(`Unique clusters per plan (1-10d): [${uniqueClustersPerPlan.join(", ")}]`);

console.log("\nDONE.");

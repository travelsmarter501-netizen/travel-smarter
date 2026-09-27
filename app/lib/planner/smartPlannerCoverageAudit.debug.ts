/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * Full Combination Coverage Audit: generates every valid 1-3 interest combination (41
 * profiles) through the ACTUAL existing pipeline (generateBarcelonaSmartPlan, which itself
 * calls validatePlannerPreferences -> buildBarcelonaPlannerPlan -> optimizeBarcelonaPlannerPlan
 * -> buildBarcelonaPlannerPlanRouteLegs) and reports transport coverage plus plan-quality
 * findings. Discovery only -- never fills, estimates, or changes any route-leg value. Run with:
 *
 *   npx tsx app/lib/planner/smartPlannerCoverageAudit.debug.ts
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { BARCELONA_ICONIC_TIER_A, BARCELONA_SIMILARITY_GROUPS, BARCELONA_COVERAGE_GOALS } from "./barcelona-planner-day-builder";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest } from "./plannerTypes";
import type { RouteLegSourceStatus } from "./plannerTransportTypes";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

const ALL_PROFILES: PlannerInterest[][] = [
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 1),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 2),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 3),
];

console.log(`Total profiles generated: ${ALL_PROFILES.length} (expect 41: 6 + 15 + 20)`);

// -- Global transport-coverage aggregation --------------------------------------------
let totalLegInstances = 0;
const statusCounts: Record<RouteLegSourceStatus, number> = { verified: 0, "existing-project-data": 0, unresolved: 0 };
const unresolvedPairCounts = new Map<string, number>();
const routeInventory = new Map<string, { from: string; to: string; sourceStatus: RouteLegSourceStatus; occurrenceCount: number }>();

// -- Special checks ---------------------------------------------------------------------
let montjuicSeenAnywhere = false;
let mnacResolvedButNotOneOfThe3Verified = false;
let unresolvedWithFabricatedOptions = false;
let missingLegBetweenConsecutiveStops = false;
const VERIFIED_MNAC_PAIRS = new Set(["gothic-quarter::mnac", "la-rambla::mnac", "placa-catalunya::mnac", "placa-reial::mnac", "barcelona-cathedral::mnac"]);

// -- Per-profile quality audit rows -------------------------------------------------
type QualityRow = {
  label: string;
  totalStops: number;
  stopsPerDay: number[];
  maxVisitMinutes: number;
  tierACoverage: string;
  specialInterestProtection: string;
  threeClusterDay: boolean;
  shortDay: boolean;
  similarityTriggered: string;
};
const qualityRows: QualityRow[] = [];

for (const interests of ALL_PROFILES) {
  const label = interests.join("+");
  const result = generateBarcelonaSmartPlan({ interests });

  if (!result.ok) {
    console.log(`  [${label}] VALIDATION FAILED: ${result.error}`);
    continue;
  }

  const { plan, legsByDay } = result.data;
  const allStopIds = plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId));

  plan.days.forEach((day, dayIndex) => {
    const expectedLegCount = Math.max(0, day.stops.length - 1);
    const actualLegCount = (legsByDay[dayIndex] ?? []).length;
    if (actualLegCount !== expectedLegCount) missingLegBetweenConsecutiveStops = true;
  });

  if (allStopIds.includes("montjuic")) montjuicSeenAnywhere = true;

  for (const legs of legsByDay) {
    for (const leg of legs) {
      totalLegInstances++;
      statusCounts[leg.sourceStatus]++;

      const key = `${leg.fromPlaceId}::${leg.toPlaceId}`;

      if (leg.sourceStatus === "unresolved") {
        unresolvedPairCounts.set(key, (unresolvedPairCounts.get(key) ?? 0) + 1);
        if (leg.options.length > 0 || leg.recommendedMode !== null) unresolvedWithFabricatedOptions = true;
      }

      if (leg.fromPlaceId === "mnac" || leg.toPlaceId === "mnac") {
        const isOneOfThe3 = VERIFIED_MNAC_PAIRS.has(key);
        if (leg.sourceStatus !== "unresolved" && !isOneOfThe3) mnacResolvedButNotOneOfThe3Verified = true;
      }

      const existing = routeInventory.get(key);
      if (existing) {
        existing.occurrenceCount++;
      } else {
        routeInventory.set(key, { from: leg.fromPlaceId, to: leg.toPlaceId, sourceStatus: leg.sourceStatus, occurrenceCount: 1 });
      }
    }
  }

  const stopsPerDay = plan.days.map((day) => day.stops.length);
  const maxVisitMinutes = Math.max(...plan.days.map((day) => day.totalVisitMinutes));
  const threeClusterDay = plan.days.some((day) => day.clusters.length >= 3);
  const shortDay = plan.days.some((day) => day.stops.length < 3);

  let tierACoverage = "n/a (popular not selected)";
  if (interests.includes("popular")) {
    const covered = BARCELONA_ICONIC_TIER_A.filter((id) => allStopIds.includes(id));
    tierACoverage = `${covered.length}/${BARCELONA_ICONIC_TIER_A.length} (${covered.join(", ")})`;
  }

  const protectionParts: string[] = [];
  for (const goal of BARCELONA_COVERAGE_GOALS) {
    if (!interests.includes(goal.interest)) continue;
    if (goal.minimumCoverage === 0) continue;
    const covered = goal.placeIds.filter((id) => allStopIds.includes(id));
    const met = covered.length >= goal.minimumCoverage;
    protectionParts.push(`${goal.interest}:${met ? "OK" : "MISSING"}(${covered.length}/${goal.minimumCoverage})`);
  }
  const specialInterestProtection = protectionParts.length > 0 ? protectionParts.join(", ") : "n/a";

  const similarityParts: string[] = [];
  for (const group of BARCELONA_SIMILARITY_GROUPS) {
    const cap = group.unlockedByInterest && interests.includes(group.unlockedByInterest) ? (group.maxWithInterest ?? group.maxByDefault) : group.maxByDefault;
    const count = group.placeIds.filter((id) => allStopIds.includes(id)).length;
    if (count === cap && group.placeIds.length > cap) similarityParts.push(`${group.id}(${count}/${cap})`);
  }
  const similarityTriggered = similarityParts.length > 0 ? similarityParts.join(", ") : "none";

  qualityRows.push({
    label,
    totalStops: allStopIds.length,
    stopsPerDay,
    maxVisitMinutes,
    tierACoverage,
    specialInterestProtection,
    threeClusterDay,
    shortDay,
    similarityTriggered,
  });
}

console.log("\n\n================ QUALITY AUDIT (all 41 profiles) ================");
for (const row of qualityRows) {
  console.log(
    `[${row.label}] stops=${row.totalStops} perDay=${row.stopsPerDay.join(",")} maxMin=${row.maxVisitMinutes} ` +
      `tierA=${row.tierACoverage} protection=${row.specialInterestProtection} 3cluster=${row.threeClusterDay} ` +
      `shortDay=${row.shortDay} similarity=${row.similarityTriggered}`
  );
}

console.log("\n\n================ TRANSPORT COVERAGE SUMMARY ================");
console.log("Total leg instances:", totalLegInstances);
console.log("Verified:", statusCounts.verified);
console.log("Existing-project-data:", statusCounts["existing-project-data"]);
console.log("Unresolved:", statusCounts.unresolved);

console.log("\n-- Unique unresolved pairs --");
[...unresolvedPairCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => console.log(`  ${key.replace("::", " -> ")}  occurrenceCount=${count}`));
console.log("Unique unresolved pair count:", unresolvedPairCounts.size);

console.log("\n\n================ FULL UNIQUE ROUTE INVENTORY ================");
console.log("Total unique route pairs:", routeInventory.size);
[...routeInventory.values()]
  .sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.from.localeCompare(b.from))
  .forEach((entry) => console.log(`  ${entry.from} -> ${entry.to}  [${entry.sourceStatus}]  occurrenceCount=${entry.occurrenceCount}`));

console.log("\n\n================ SPECIAL CHECKS ================");
console.log("Old placeId montjuic ever appears as a stop?", montjuicSeenAnywhere, "(expected: false)");
console.log("Any resolved MNAC leg outside the 3 verified pairs?", mnacResolvedButNotOneOfThe3Verified, "(expected: false)");
console.log("Any unresolved leg carrying options/recommendedMode (fabricated)?", unresolvedWithFabricatedOptions, "(expected: false)");
console.log("Any missing leg between consecutive stops?", missingLegBetweenConsecutiveStops, "(expected: false)");

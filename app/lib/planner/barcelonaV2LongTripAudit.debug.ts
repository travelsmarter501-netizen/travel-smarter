/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 *
 * Barcelona Personalized Planner V2 — full 1-10 day itinerary quality audit. Exercises the
 * real, non-server-only pipeline (generateTravelPlan -> Day Builder -> Route Optimizer ->
 * buildBarcelonaPlannerPlanRouteLegs) directly, exactly as barcelonaV2Resolve.ts (server-only,
 * not reachable from plain tsx) would, for every requested day count 1-10 across 8 interest
 * scenarios plus 3 accommodation variants. Prints a machine-readable-ish summary per scenario
 * and a final aggregate table + route-leg coverage report.
 *
 * Run with:
 *   npx tsx app/lib/planner/barcelonaV2LongTripAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { getBarcelonaV2PlannerPlaces, getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { classifyDayDensity } from "./barcelonaV2Density";
import { BARCELONA_ROUTE_CONFIG } from "./barcelona-planner-route-config";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import type { PlannerInterest } from "./plannerTypes";
import type { DestinationConfig } from "./destinationConfig";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

const POOL = getBarcelonaV2PlannerPlaces();
const POOL_SIZE = POOL.length;
const CLUSTER_ADJACENCY = BARCELONA_ROUTE_CONFIG.clusterAdjacency;

// Post-Route-First Coverage Recovery: scenario A now uses the REAL current Surprise Me
// interest set (SURPRISE_ME_LEGACY_INTERESTS, v2InterestAdapter.ts) instead of the old
// 3-interest preset this script was still testing -- a stale baseline would have measured the
// wrong thing entirely for this whole coverage-recovery task. Scenarios G/H also now apply the
// SAME Teleferic Conditional Eligibility gate the real Server Action applies (see
// EXPERIENCES_SELECTED_SCENARIOS below) so their measured pair frequencies -- and therefore
// this audit's verification priorities -- reflect what a real customer actually sees, not an
// inflated frequency from a place that's gated out of every other scenario in real usage.
type Scenario = { label: string; interests: PlannerInterest[] };

const SCENARIOS: Scenario[] = [
  { label: "A) Surprise Me", interests: SURPRISE_ME_LEGACY_INTERESTS },
  { label: "B) Popular+Culture", interests: ["popular", "cultureLocal"] },
  { label: "C) Food", interests: ["foodShoppingNightlife"] },
  { label: "D) Shopping", interests: ["foodShoppingNightlife"] },
  { label: "E) Nightlife", interests: ["foodShoppingNightlife"] },
  { label: "F) Nature/Views", interests: ["viewsNature"] },
  { label: "G) Football/Experiences", interests: ["footballExperiences"] },
  {
    label: "H) All 8 (legacy union)",
    interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"],
  },
];

// Mirrors app/smart-planner/barcelona-v2/actions.ts's real EXPERIENCES_GATED_PLACE_IDS /
// isPlaceEligibleForDay logic (that file is "use server", not importable here) -- ONLY G/H
// unambiguously imply the real V2-level footballExperiences key was selected; the other
// scenarios' legacy "foodShoppingNightlife" is also reachable via food/shopping (not just
// nightlife), so this script cannot safely assume the experiences gate would be open for them.
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);
const EXPERIENCES_SELECTED_SCENARIOS = new Set(["G) Football/Experiences", "H) All 8 (legacy union)"]);

function configForScenario(scenario: Scenario): DestinationConfig {
  const experiencesSelected = EXPERIENCES_SELECTED_SCENARIOS.has(scenario.label);
  return {
    ...BARCELONA_V2_DESTINATION_CONFIG,
    dayBuilderConfig: {
      ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig,
      isPlaceEligibleForDay: (placeId: string) => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || experiencesSelected,
    },
  };
}

function adjacencyLevel(a: string, b: string): "same" | "strong" | "medium" | "weak" | "unknown" {
  if (a === b) return "same";
  const level = CLUSTER_ADJACENCY[a]?.[b] ?? CLUSTER_ADJACENCY[b]?.[a];
  return level ?? "unknown";
}

function legKnownMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  if (!option) return null;
  return Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2);
}

type DayAudit = {
  dayNumber: number;
  stopCount: number;
  totalVisitMinutes: number;
  knownTravelMinutes: number;
  clusters: string[];
  resolvedLegs: number;
  unresolvedLegs: number;
  verifiedLegs: number;
  existingDataLegs: number;
  density: string;
  suspiciousJumps: string[];
  backtrack: boolean;
};

type ScenarioResult = {
  scenario: string;
  days: number;
  ok: boolean;
  error?: string;
  daysGenerated: number;
  dayAudits: DayAudit[];
  totalMainStops: number;
  uniqueMainStops: number;
  duplicateStops: string[];
  thinDays: number[];
  veryThinDays: number[];
  overloadedDays: number[];
  under4on6to10: number[];
  totalLegs: number;
  resolvedLegs: number;
  unresolvedLegs: number;
  guardedLegs: number;
  unresolvedPairs: string[];
};

const MONTJUIC_GUARDED_ID = "montjuic";

const unresolvedPairFrequency = new Map<string, number>();

function auditScenario(scenario: Scenario, days: number): ScenarioResult {
  const result = generateTravelPlan(configForScenario(scenario), { interests: scenario.interests }, days);
  if (!result.ok) {
    return {
      scenario: scenario.label,
      days,
      ok: false,
      error: result.error,
      daysGenerated: 0,
      dayAudits: [],
      totalMainStops: 0,
      uniqueMainStops: 0,
      duplicateStops: [],
      thinDays: [],
      veryThinDays: [],
      overloadedDays: [],
      under4on6to10: [],
      totalLegs: 0,
      resolvedLegs: 0,
      unresolvedLegs: 0,
      guardedLegs: 0,
      unresolvedPairs: [],
    };
  }

  const { plan, legsByDay } = result.data;
  const allStopIds: string[] = [];
  const dayAudits: DayAudit[] = [];
  const thinDays: number[] = [];
  const veryThinDays: number[] = [];
  const overloadedDays: number[] = [];
  const under4on6to10: number[] = [];
  let totalLegs = 0;
  let resolvedLegsTotal = 0;
  let unresolvedLegsTotal = 0;
  let guardedLegsTotal = 0;
  const unresolvedPairs: string[] = [];

  plan.days.forEach((day, idx) => {
    const legs = legsByDay[idx] ?? [];
    const stopClusters = day.stops.map((s) => getBarcelonaV2PlannerMetadataById(s.placeId)?.cluster ?? "unknown");
    const resolved = legs.filter((l) => l.sourceStatus !== "unresolved").length;
    const unresolved = legs.filter((l) => l.sourceStatus === "unresolved").length;
    const verified = legs.filter((l) => l.sourceStatus === "verified").length;
    const existing = legs.filter((l) => l.sourceStatus === "existing-project-data").length;
    const knownTravelMinutes = legs.reduce((sum, l) => sum + (legKnownMinutes(l) ?? 0), 0);

    const suspiciousJumps: string[] = [];
    for (let i = 0; i < stopClusters.length - 1; i++) {
      const level = adjacencyLevel(stopClusters[i], stopClusters[i + 1]);
      if (level === "unknown" || level === "weak") {
        suspiciousJumps.push(`${day.stops[i].placeId}(${stopClusters[i]}) -> ${day.stops[i + 1].placeId}(${stopClusters[i + 1]}) [${level}]`);
      }
    }
    // A -> B -> A cluster pattern (revisit a cluster already left behind) = likely backtrack.
    let backtrack = false;
    for (let i = 0; i < stopClusters.length; i++) {
      for (let j = i + 2; j < stopClusters.length; j++) {
        if (stopClusters[i] === stopClusters[j] && stopClusters[i] !== stopClusters[i + 1]) backtrack = true;
      }
    }

    const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
    if (density === "thin") thinDays.push(day.dayNumber);
    if (density === "veryThin") veryThinDays.push(day.dayNumber);
    // NOTE: the Day Builder's own 420-min cap applies to VISIT time only (see
    // plannerDayBuilder.ts SOFT_MINUTES_UPPER) -- a full 420-min visit day plus a realistic
    // amount of travel is normal, not overloaded. For AUDIT purposes (task section 4: visit +
    // known travel + reasonable operational buffer), use a materially higher combined
    // threshold (540min = 9 real hours of visiting+moving) to flag genuinely unrealistic days,
    // plus the hard >6-stop ceiling regardless of duration.
    if (day.totalVisitMinutes + knownTravelMinutes > 540 || day.stops.length > 6) overloadedDays.push(day.dayNumber);
    if (days >= 6 && day.stops.length < 4) under4on6to10.push(day.dayNumber);

    legs.forEach((l) => {
      if (l.sourceStatus === "unresolved") {
        const key = `${l.fromPlaceId} -> ${l.toPlaceId}`;
        unresolvedPairs.push(key);
        unresolvedPairFrequency.set(key, (unresolvedPairFrequency.get(key) ?? 0) + 1);
        if (l.fromPlaceId === MONTJUIC_GUARDED_ID || l.toPlaceId === MONTJUIC_GUARDED_ID) guardedLegsTotal++;
      }
    });

    totalLegs += legs.length;
    resolvedLegsTotal += resolved;
    unresolvedLegsTotal += unresolved;

    dayAudits.push({
      dayNumber: day.dayNumber,
      stopCount: day.stops.length,
      totalVisitMinutes: day.totalVisitMinutes,
      knownTravelMinutes,
      clusters: day.clusters,
      resolvedLegs: resolved,
      unresolvedLegs: unresolved,
      verifiedLegs: verified,
      existingDataLegs: existing,
      density,
      suspiciousJumps,
      backtrack,
    });

    allStopIds.push(...day.stops.map((s) => s.placeId));
  });

  const seen = new Set<string>();
  const duplicateStops: string[] = [];
  for (const id of allStopIds) {
    if (seen.has(id)) duplicateStops.push(id);
    seen.add(id);
  }

  return {
    scenario: scenario.label,
    days,
    ok: true,
    daysGenerated: plan.days.length,
    dayAudits,
    totalMainStops: allStopIds.length,
    uniqueMainStops: seen.size,
    duplicateStops,
    thinDays,
    veryThinDays,
    overloadedDays,
    under4on6to10,
    totalLegs,
    resolvedLegs: resolvedLegsTotal,
    unresolvedLegs: unresolvedLegsTotal,
    guardedLegs: guardedLegsTotal,
    unresolvedPairs,
  };
}

console.log(`Candidate pool size (V2): ${POOL_SIZE}`);
console.log("========================================================================");

const allResults: ScenarioResult[] = [];

for (let days = 1; days <= 10; days++) {
  console.log(`\n\n################ DURATION: ${days} day(s) ################`);
  for (const scenario of SCENARIOS) {
    const res = auditScenario(scenario, days);
    allResults.push(res);
    if (!res.ok) {
      console.log(`\n[${scenario.label}] FAILED: ${res.error}`);
      continue;
    }
    console.log(
      `\n[${scenario.label}] daysGenerated=${res.daysGenerated}/${days} totalStops=${res.totalMainStops} uniqueStops=${res.uniqueMainStops} dup=${res.duplicateStops.length} thin=${res.thinDays.length} veryThin=${res.veryThinDays.length} overloaded=${res.overloadedDays.length} under4(6-10d)=${res.under4on6to10.length} legs=${res.resolvedLegs}/${res.totalLegs}`
    );
    for (const d of res.dayAudits) {
      const flag = d.density !== "healthy" ? ` <<${d.density.toUpperCase()}>>` : "";
      const overloadFlag = d.totalVisitMinutes + d.knownTravelMinutes > 540 || d.stopCount > 6 ? " <<OVERLOAD>>" : "";
      const backtrackFlag = d.backtrack ? " <<BACKTRACK>>" : "";
      console.log(
        `   Day ${d.dayNumber}: ${d.stopCount} stops, ${d.totalVisitMinutes}min visit + ${d.knownTravelMinutes}min known travel, clusters=[${d.clusters.join(",")}], legs ${d.resolvedLegs}/${d.resolvedLegs + d.unresolvedLegs} resolved (v${d.verifiedLegs}/e${d.existingDataLegs}/u${d.unresolvedLegs})${flag}${overloadFlag}${backtrackFlag}`
      );
      if (d.suspiciousJumps.length > 0) {
        console.log(`      suspicious jumps: ${d.suspiciousJumps.join(" | ")}`);
      }
    }
  }
}

// ---- Aggregate table ----
console.log("\n\n================ AGGREGATE TABLE (Duration | Scenario | Verdict) ================");
for (const r of allResults) {
  if (!r.ok) {
    console.log(`${r.days}d | ${r.scenario} | GENERATION FAILED: ${r.error}`);
    continue;
  }
  const coverage = r.totalLegs > 0 ? ((r.resolvedLegs / r.totalLegs) * 100).toFixed(1) : "N/A";
  let verdict = "OK";
  if (r.duplicateStops.length > 0) verdict = "FAIL(dup)";
  else if (r.overloadedDays.length > 0) verdict = "FAIL(overload)";
  else if (r.veryThinDays.length > 0) verdict = "REVIEW(veryThin)";
  else if (r.days >= 6 && r.under4on6to10.length > 0) verdict = "REVIEW(<4 stops)";
  else if (r.thinDays.length > 0) verdict = "REVIEW(thin)";
  console.log(
    `${r.days}d | ${r.scenario} | days=${r.daysGenerated} | mainStops=${r.totalMainStops} | unique=${r.uniqueMainStops} | thin=${r.thinDays.length} | veryThin=${r.veryThinDays.length} | overload=${r.overloadedDays.length} | dup=${r.duplicateStops.length} | routeCoverage=${coverage}% (${r.resolvedLegs}/${r.totalLegs}) | ${verdict}`
  );
}

// ---- Route leg coverage report ----
console.log("\n\n================ ROUTE LEG COVERAGE REPORT ================");
const totalLegsAll = allResults.reduce((s, r) => s + r.totalLegs, 0);
const resolvedLegsAll = allResults.reduce((s, r) => s + r.resolvedLegs, 0);
const unresolvedLegsAll = totalLegsAll - resolvedLegsAll;
const guardedLegsAll = allResults.reduce((s, r) => s + r.guardedLegs, 0);
const fixableTotal = totalLegsAll - guardedLegsAll;
const fixableUnresolved = unresolvedLegsAll - guardedLegsAll;
console.log(`Total leg instances across all scenarios: ${totalLegsAll}`);
console.log(`Resolved: ${resolvedLegsAll} (${((resolvedLegsAll / totalLegsAll) * 100).toFixed(1)}% RAW coverage)`);
console.log(`Unresolved: ${unresolvedLegsAll} (${((unresolvedLegsAll / totalLegsAll) * 100).toFixed(1)}%)`);
console.log(`  of which permanently guarded (montjuic, intentional -- never fixable): ${guardedLegsAll}`);
console.log(`  of which genuinely fixable-but-currently-unresolved: ${fixableUnresolved}`);
console.log(
  `FIXABLE coverage (excludes guarded pairs from both numerator and denominator): ${((resolvedLegsAll / fixableTotal) * 100).toFixed(1)}% (${resolvedLegsAll}/${fixableTotal})`
);
console.log("\nTop unresolved pairs by frequency:");
const sortedPairs = [...unresolvedPairFrequency.entries()].sort((a, b) => b[1] - a[1]);
for (const [pair, freq] of sortedPairs.slice(0, 30)) {
  // Exact placeId match only -- a naive substring check would wrongly flag "teleferic-montjuic"
  // (a real, distinct, unguarded id that merely contains "montjuic" as a substring) as guarded.
  const pairIds = pair.split(" -> ");
  const guarded = pairIds.includes(MONTJUIC_GUARDED_ID) ? " [GUARDED]" : "";
  console.log(`  ${pair}  x${freq}${guarded}`);
}
console.log(`\nTotal unique unresolved pairs: ${sortedPairs.length}`);

// ---- Coverage by trip-length bucket ----
console.log("\n\n================ COVERAGE BY TRIP-LENGTH BUCKET ================");
const buckets: { label: string; test: (d: number) => boolean }[] = [
  { label: "1-3 days", test: (d) => d >= 1 && d <= 3 },
  { label: "4-5 days", test: (d) => d >= 4 && d <= 5 },
  { label: "6-8 days", test: (d) => d >= 6 && d <= 8 },
  { label: "9-10 days", test: (d) => d >= 9 && d <= 10 },
];
for (const bucket of buckets) {
  const rows = allResults.filter((r) => r.ok && bucket.test(r.days));
  const total = rows.reduce((s, r) => s + r.totalLegs, 0);
  const resolved = rows.reduce((s, r) => s + r.resolvedLegs, 0);
  const guarded = rows.reduce((s, r) => s + r.guardedLegs, 0);
  const fixable = total - guarded;
  console.log(
    `${bucket.label}: raw=${((resolved / total) * 100).toFixed(1)}% (${resolved}/${total}) | fixable=${((resolved / fixable) * 100).toFixed(1)}% (${resolved}/${fixable}) | unresolved=${total - resolved}`
  );
}

// ---- 6-10 day focused report ----
console.log("\n\n================ 6-10 DAY LONG-TRIP REPORT ================");
for (const r of allResults.filter((r) => r.days >= 6 && r.ok)) {
  const stopCounts = r.dayAudits.map((d) => d.stopCount);
  console.log(
    `${r.days}d | ${r.scenario} | stopsPerDay=[${stopCounts.join(",")}] | worstDay=${Math.min(...stopCounts)} stops | bestDay=${Math.max(...stopCounts)} stops | uniquePoolUsed=${r.uniqueMainStops}/${POOL_SIZE}`
  );
}

// ---- Accommodation impact test ----
console.log("\n\n================ ACCOMMODATION IMPACT TEST ================");
const accommodationTexts = [
  { label: "not booked", text: null },
  { label: "central (Passeig de Gracia)", text: "Passeig de Gracia" },
  { label: "distant (Tibidabo)", text: "Tibidabo" },
];
for (const days of [3, 5, 7]) {
  for (const acc of accommodationTexts) {
    const cluster = acc.text ? resolveBarcelonaAccommodationCluster(acc.text) : null;
    const preferences = {
      interests: SCENARIOS[0].interests,
      accommodation: acc.text ? { text: acc.text, useAsDailyAnchor: true, cluster } : undefined,
    };
    const result = generateTravelPlan(BARCELONA_V2_DESTINATION_CONFIG, preferences, days);
    if (!result.ok) {
      console.log(`${days}d | ${acc.label} | FAILED: ${result.error}`);
      continue;
    }
    const day1Clusters = result.data.plan.days[0]?.clusters.join(",");
    console.log(`${days}d | ${acc.label} (cluster=${cluster ?? "null"}) | Day1 clusters=[${day1Clusters}]`);
  }
}

console.log("\n\nDONE.");

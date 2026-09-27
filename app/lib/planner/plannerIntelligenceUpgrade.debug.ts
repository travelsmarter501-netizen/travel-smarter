/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 *
 * Planner Intelligence Upgrade audit: Surprise Me (old preset vs new diversified set),
 * Teleferic conditional eligibility (replicated here to match app/smart-planner/barcelona-v2/
 * actions.ts's real gate exactly, since that file is "use server" and not safely importable
 * from plain tsx -- cross-checked additionally via live browser generation per the task's own
 * "confirm with real generation" instruction), and route-first before/after comparison (same
 * scenario run once against the OLD cluster-only Route Optimizer/Day Builder config and once
 * against the real BARCELONA_V2_DESTINATION_CONFIG, which now opts into verified-minutes-aware
 * selection tie-breaking and ordering).
 *
 * Run with:
 *   npx tsx app/lib/planner/plannerIntelligenceUpgrade.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import type { PlannerInterest } from "./plannerTypes";
import type { DestinationConfig } from "./destinationConfig";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

// "BEFORE" config: the exact same object, minus the Route-First Planning Upgrade's two new
// optional fields -- isolates exactly what those fields change, nothing else.
const BEFORE_CONFIG: DestinationConfig = {
  ...BARCELONA_V2_DESTINATION_CONFIG,
  dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, getVerifiedTravelMinutes: undefined },
  routeOptimizationConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.routeOptimizationConfig, verifiedMinutesLookup: undefined },
};
const AFTER_CONFIG = BARCELONA_V2_DESTINATION_CONFIG;

// Mirrors app/smart-planner/barcelona-v2/actions.ts's real EXPERIENCES_GATED_PLACE_IDS /
// isPlaceEligibleForDay logic exactly (that file is "use server", not importable here).
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);
function buildTeleferixConfig(base: DestinationConfig, experiencesSelected: boolean): DestinationConfig {
  return {
    ...base,
    dayBuilderConfig: {
      ...base.dayBuilderConfig,
      isPlaceEligibleForDay: (placeId: string) => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || experiencesSelected,
    },
  };
}

function legMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

function dayMetrics(days: number, config: DestinationConfig, interests: PlannerInterest[]) {
  const result = generateTravelPlan(config, { interests }, days);
  if (!result.ok) return null;
  const { plan, legsByDay } = result.data;

  return plan.days.map((day, idx) => {
    const legs = legsByDay[idx] ?? [];
    const knownMinutes = legs.map(legMinutes).filter((m): m is number => m !== null);
    const clusters = day.stops.map((s) => getBarcelonaV2PlannerMetadataById(s.placeId)?.cluster ?? "unknown");
    const uniqueClusters = new Set(clusters);

    let backtracks = 0;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 2; j < clusters.length; j++) {
        if (clusters[i] === clusters[j] && clusters[i] !== clusters[i + 1]) backtracks++;
      }
    }

    return {
      dayNumber: day.dayNumber,
      stopIds: day.stops.map((s) => s.placeId),
      stopCount: day.stops.length,
      clusterCount: uniqueClusters.size,
      totalVisitMinutes: day.totalVisitMinutes,
      totalKnownTravelMinutes: knownMinutes.reduce((a, b) => a + b, 0),
      unresolvedLegCount: legs.length - knownMinutes.length,
      largestLeg: knownMinutes.length > 0 ? Math.max(...knownMinutes) : 0,
      backtracks,
      hasTeleferic: day.stops.some((s) => s.placeId === "teleferic-montjuic"),
    };
  });
}

console.log("================ PART A: SURPRISE ME -- OLD vs NEW ================");
const OLD_SURPRISE_ME: PlannerInterest[] = ["popular", "cultureLocal", "viewsNature"];
for (const days of [1, 3, 5, 7, 10]) {
  const oldMetrics = dayMetrics(days, AFTER_CONFIG, OLD_SURPRISE_ME);
  const newMetrics = dayMetrics(days, AFTER_CONFIG, SURPRISE_ME_LEGACY_INTERESTS);
  console.log(`\n-- ${days}-day --`);
  if (oldMetrics) {
    const allIds = oldMetrics.flatMap((d) => d.stopIds);
    const uniqueClusters = new Set(oldMetrics.flatMap((d) => d.stopIds.map((id) => getBarcelonaV2PlannerMetadataById(id)?.cluster)));
    console.log(`  OLD (popular+cultureLocal+viewsNature): ${allIds.length} stops, ${new Set(allIds).size} unique, clusters used: ${uniqueClusters.size}, dup=${allIds.length !== new Set(allIds).size}`);
  }
  if (newMetrics) {
    const allIds = newMetrics.flatMap((d) => d.stopIds);
    const uniqueClusters = new Set(newMetrics.flatMap((d) => d.stopIds.map((id) => getBarcelonaV2PlannerMetadataById(id)?.cluster)));
    const teleferic = newMetrics.some((d) => d.hasTeleferic);
    console.log(
      `  NEW (5-interest diversified): ${allIds.length} stops, ${new Set(allIds).size} unique, clusters used: ${uniqueClusters.size}, dup=${allIds.length !== new Set(allIds).size}, teleferic=${teleferic}`
    );
    console.log(`     stop ids: ${allIds.join(", ")}`);
  }
}

console.log("\n\n================ PART B: TELEFERIC ELIGIBILITY (real generation, gate replicated from actions.ts) ================");
const TELEFERIC_SCENARIOS: { label: string; interests: PlannerInterest[]; experiencesSelected: boolean }[] = [
  { label: "Popular only", interests: ["popular"], experiencesSelected: false },
  { label: "Culture only", interests: ["cultureLocal"], experiencesSelected: false },
  { label: "Nature+Beaches (viewsNature+beachRelax)", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food (foodShoppingNightlife)", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Experiences+Entertainment (footballExperiences+foodShoppingNightlife as nightlife proxy)", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Surprise Me (new)", interests: SURPRISE_ME_LEGACY_INTERESTS, experiencesSelected: false },
];
for (const scenario of TELEFERIC_SCENARIOS) {
  const config = buildTeleferixConfig(AFTER_CONFIG, scenario.experiencesSelected);
  let anyTeleferic = false;
  let eligibleWithoutGateCount = 0;
  for (const days of [3, 6, 9, 10]) {
    const metrics = dayMetrics(days, config, scenario.interests);
    if (metrics?.some((d) => d.hasTeleferic)) anyTeleferic = true;
    // Also check WITHOUT the gate, to see if teleferic would have been a real, natural
    // candidate for this profile absent the new eligibility rule (proves the gate is doing
    // real work, not just gating something that would never have been picked anyway).
    const withoutGate = dayMetrics(days, AFTER_CONFIG, scenario.interests);
    if (withoutGate?.some((d) => d.hasTeleferic)) eligibleWithoutGateCount++;
  }
  console.log(`${scenario.label} (experiencesSelected=${scenario.experiencesSelected}): teleferic appears with gate = ${anyTeleferic} | would appear WITHOUT gate (any of 3/6/9/10d) = ${eligibleWithoutGateCount > 0}`);
}

console.log("\n\n================ PART C: ROUTE-FIRST BEFORE/AFTER ================");
const ROUTE_FIRST_SCENARIOS: { label: string; interests: PlannerInterest[] }[] = [
  { label: "3d Popular+Culture", interests: ["popular", "cultureLocal"] },
  { label: "5d All (legacy union)", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"] },
  { label: "7d Food+Nightlife (foodShoppingNightlife)", interests: ["foodShoppingNightlife"] },
  { label: "7d Surprise Me (new)", interests: SURPRISE_ME_LEGACY_INTERESTS },
  { label: "10d All (legacy union)", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"] },
  { label: "10d Surprise Me (new)", interests: SURPRISE_ME_LEGACY_INTERESTS },
];
for (const scenario of ROUTE_FIRST_SCENARIOS) {
  const days = parseInt(scenario.label, 10);
  const before = dayMetrics(days, BEFORE_CONFIG, scenario.interests);
  const after = dayMetrics(days, AFTER_CONFIG, scenario.interests);
  console.log(`\n-- ${scenario.label} --`);
  if (!before || !after) {
    console.log("  generation failed");
    continue;
  }
  const beforeStopIds = before.map((d) => d.stopIds.join(",")).join(" | ");
  const afterStopIds = after.map((d) => d.stopIds.join(",")).join(" | ");
  console.log(`  selection changed: ${beforeStopIds !== afterStopIds}`);
  for (let i = 0; i < before.length; i++) {
    const b = before[i];
    const a = after[i];
    const orderChanged = b.stopIds.join(",") !== a.stopIds.join(",") && new Set(b.stopIds).size === new Set(a.stopIds).size && [...new Set(b.stopIds)].every((id) => a.stopIds.includes(id));
    console.log(
      `  Day ${b.dayNumber}: BEFORE stops=${b.stopCount} clusters=${b.clusterCount} travel=${b.totalKnownTravelMinutes}min largestLeg=${b.largestLeg}min backtrack=${b.backtracks} unresolved=${b.unresolvedLegCount} | AFTER stops=${a.stopCount} clusters=${a.clusterCount} travel=${a.totalKnownTravelMinutes}min largestLeg=${a.largestLeg}min backtrack=${a.backtracks} unresolved=${a.unresolvedLegCount}${orderChanged ? " <<ORDER CHANGED (same stops)>>" : ""}`
    );
  }
}

console.log("\n\n================ PART D: TIBIDABO / BUNKERS-CARMEL CO-OCCURRENCE ================");
for (const scenario of [
  { label: "Nature+Views (viewsNature)", interests: ["viewsNature"] as PlannerInterest[] },
  { label: "Surprise Me (new)", interests: SURPRISE_ME_LEGACY_INTERESTS },
]) {
  for (const days of [3, 5, 7, 10]) {
    const after = dayMetrics(days, AFTER_CONFIG, scenario.interests);
    const before = dayMetrics(days, BEFORE_CONFIG, scenario.interests);
    const afterSameDay = after?.find((d) => d.stopIds.includes("tibidabo") && d.stopIds.includes("bunkers-carmel"));
    const beforeSameDay = before?.find((d) => d.stopIds.includes("tibidabo") && d.stopIds.includes("bunkers-carmel"));
    if (afterSameDay || beforeSameDay) {
      console.log(
        `${scenario.label} ${days}d: BEFORE same-day=${!!beforeSameDay} (leg=${beforeSameDay?.largestLeg ?? "-"}min) | AFTER same-day=${!!afterSameDay} (leg=${afterSameDay?.largestLeg ?? "-"}min)`
      );
    }
  }
}

console.log("\n\nDONE.");

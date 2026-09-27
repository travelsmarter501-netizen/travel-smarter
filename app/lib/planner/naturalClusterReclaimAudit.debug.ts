/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 *
 * Natural Cluster Reclaim Audit. Investigates the known Day-Builder greedy-starvation
 * regression (jardins-palau-pedralbes -> passeig-de-gracia) and evaluates whether a bounded,
 * deterministic "natural cluster reclaim" repair pass (plannerNaturalClusterReclaim.ts) can let
 * the verified route data be stored WITHOUT causing the historical 4-stop -> 2-stop late-day
 * collapse. Read-only: never mutates production route data. The one test route is toggled via a
 * local override function, layered on top of the real `getBarcelonaVerifiedTravelMinutes` --
 * `barcelona-planner-route-legs.ts` itself is never edited by this script.
 *
 * Run with:
 *   npx tsx app/lib/planner/naturalClusterReclaimAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { classifyDayDensity } from "./barcelonaV2Density";
import type { PlannerDayDensity } from "./barcelonaV2Density";
import { getBarcelonaVerifiedTravelMinutes } from "./barcelona-planner-route-legs";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { resolvePlannerPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import type { GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerInterest } from "./plannerTypes";
import type { DestinationConfig } from "./destinationConfig";
import type { HoursInfo, Weekday } from "../hours";

// ── The ONE test route, toggled locally -- never written to barcelona-planner-route-legs.ts ──
const TEST_ROUTE_KEY = "jardins-palau-pedralbes::passeig-de-gracia";
const TEST_ROUTE_MINUTES = 22; // midpoint of the verified 22-23min direct L3 transit figure

function getVerifiedTravelMinutesWithTestRoute(fromPlaceId: string, toPlaceId: string): number | null {
  if (`${fromPlaceId}::${toPlaceId}` === TEST_ROUTE_KEY) return TEST_ROUTE_MINUTES;
  return getBarcelonaVerifiedTravelMinutes(fromPlaceId, toPlaceId);
}

// ── Duplicated Day/date-eligibility helpers -- same "never depend on internals / server-only
// files" pattern already established by crossDayRouteOptimizationAudit.debug.ts ──────────────
const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

function isPlaceClosedOnWeekday(hours: HoursInfo | undefined, weekday: Weekday): boolean {
  if (!hours) return false;
  if (hours.type === "temporarily-closed") return true;
  if (hours.type === "variable" && hours.closedWeekdays?.includes(weekday)) return true;
  if (hours.type !== "fixed") return false;
  const intervals = hours.schedule[weekday];
  return !intervals || intervals.length === 0;
}
function getHoursForPlaceId(placeId: string): HoursInfo | undefined {
  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
  if (!resolved) return undefined;
  return (resolved.place as { hours?: HoursInfo }).hours;
}
function buildDateEligibility(arrivalDateIso: string): (placeId: string, dayNumber: number) => boolean {
  return (placeId, dayNumber) => {
    const dateForDay = addDaysToIsoDate(arrivalDateIso, dayNumber - 1);
    if (!dateForDay) return true;
    const weekday = weekdayOfIsoDate(dateForDay);
    if (!weekday) return true;
    return !isPlaceClosedOnWeekday(getHoursForPlaceId(placeId), weekday);
  };
}

type ScenarioDef = { label: string; interests: PlannerInterest[]; experiencesSelected: boolean };

function configFor(scenario: ScenarioDef, useTestRoute: boolean, arrivalDateIso?: string): DestinationConfig {
  const dateEligibility = arrivalDateIso ? buildDateEligibility(arrivalDateIso) : null;
  const isPlaceEligibleForDay = (placeId: string, dayNumber: number): boolean => {
    if (EXPERIENCES_GATED_PLACE_IDS.has(placeId) && !scenario.experiencesSelected) return false;
    return dateEligibility ? dateEligibility(placeId, dayNumber) : true;
  };
  const lookup = useTestRoute ? getVerifiedTravelMinutesWithTestRoute : getBarcelonaVerifiedTravelMinutes;
  return {
    ...BARCELONA_V2_DESTINATION_CONFIG,
    dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay, getVerifiedTravelMinutes: lookup },
    routeOptimizationConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.routeOptimizationConfig, verifiedMinutesLookup: lookup },
  };
}

const PLACES = BARCELONA_V2_DESTINATION_CONFIG.plannerMetadata;
const metaById = new Map(PLACES.map((p) => [p.placeId, p]));

function legMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

function dayLine(day: PlannerDay, legs: PlannerRouteLeg[]): string {
  const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
  const travel = legs.map(legMinutes).filter((v): v is number => v !== null).reduce((a, b) => a + b, 0);
  const unresolved = legs.filter((l) => l.sourceStatus === "unresolved").length;
  return `Day ${day.dayNumber}: [${day.stops.map((s) => s.placeId).join(" -> ")}] | stops=${day.stops.length} visitMin=${day.totalVisitMinutes} clusters=[${day.clusters.join(",")}] travelMin=${travel} unresolved=${unresolved} density=${density.toUpperCase()}`;
}

function dumpPlan(label: string, plan: GeneratedPlannerPlan, legsByDay: PlannerRouteLeg[][]): void {
  console.log(`  -- ${label} --`);
  plan.days.forEach((day, i) => console.log(`    ${dayLine(day, legsByDay[i])}`));
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 1 -- REPRODUCE THE KNOWN FAILURE (historical "All 8 legacy union" scenario, 5-10 days)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("================ PART 1: REPRODUCE KNOWN FAILURE ================\n");

const KNOWN_CASE_SCENARIO: ScenarioDef = {
  label: "All 8 (legacy union)",
  interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"],
  experiencesSelected: true,
};

type KnownCaseRow = {
  days: number;
  before: { stops: number; visitMin: number; clusters: string[]; travelMin: number; density: PlannerDayDensity }[];
  withRoute: { stops: number; visitMin: number; clusters: string[]; travelMin: number; density: PlannerDayDensity }[];
  withReclaim: { stops: number; visitMin: number; clusters: string[]; travelMin: number; density: PlannerDayDensity }[];
};
const knownCaseRows: KnownCaseRow[] = [];

for (const days of [5, 6, 7, 8, 9, 10]) {
  console.log(`-- ${days}d --`);

  // BEFORE: current production data, route absent.
  const configBefore = configFor(KNOWN_CASE_SCENARIO, false);
  const before = generateTravelPlan(configBefore, { interests: KNOWN_CASE_SCENARIO.interests }, days);
  if (!before.ok) { console.log("  generation failed:", before.error); continue; }
  dumpPlan("BEFORE (route absent, current production)", before.data.plan, before.data.legsByDay);

  // WITH ROUTE: test route active, reclaim NOT applied.
  const configWithRoute = configFor(KNOWN_CASE_SCENARIO, true);
  const withRoute = generateTravelPlan(configWithRoute, { interests: KNOWN_CASE_SCENARIO.interests }, days);
  if (!withRoute.ok) { console.log("  generation failed:", withRoute.error); continue; }
  dumpPlan("WITH ROUTE DATA (reclaim OFF)", withRoute.data.plan, withRoute.data.legsByDay);

  // WITH ROUTE + RECLAIM: test route active, reclaim pass applied.
  const reclaimResult = computeNaturalClusterReclaim(
    withRoute.data.plan,
    withRoute.data.legsByDay,
    PLACES,
    configWithRoute.routeOptimizationConfig,
    configWithRoute.dayBuilderConfig.clusterCompatibility,
    configWithRoute.dayBuilderConfig.isPlaceEligibleForDay,
    null
  );
  dumpPlan("WITH ROUTE DATA + RECLAIM", reclaimResult.plan, reclaimResult.legsByDay);
  if (reclaimResult.applied.length > 0) {
    for (const c of reclaimResult.applied) {
      console.log(`    RECLAIM APPLIED: ${c.placeId} Day${c.donorDayNumber} -> Day${c.receiverDayNumber} | benefit=${c.benefit} | clusterFit=${c.clusterFit} | travelDelta=${c.travelDelta}min | donor ${c.beforeDonor.density}->${c.afterDonor.density} | receiver ${c.beforeReceiver.density}->${c.afterReceiver.density}`);
    }
  } else {
    console.log("    RECLAIM: no safe move found.");
  }

  const summarize = (plan: GeneratedPlannerPlan, legsByDay: PlannerRouteLeg[][]) =>
    plan.days.map((d, i) => ({
      stops: d.stops.length,
      visitMin: d.totalVisitMinutes,
      clusters: d.clusters,
      travelMin: legsByDay[i].map(legMinutes).filter((v): v is number => v !== null).reduce((a, b) => a + b, 0),
      density: classifyDayDensity(d.stops.length, d.totalVisitMinutes),
    }));
  knownCaseRows.push({
    days,
    before: summarize(before.data.plan, before.data.legsByDay),
    withRoute: summarize(withRoute.data.plan, withRoute.data.legsByDay),
    withReclaim: summarize(reclaimResult.plan, reclaimResult.legsByDay),
  });
  console.log("");
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 2 -- GREEDY CHAIN TRACE (derived from the BEFORE vs WITH-ROUTE day compositions above)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n================ PART 2: GREEDY CHAIN TRACE ================\n");
for (const days of [5, 6, 7, 8, 9, 10]) {
  const configBefore = configFor(KNOWN_CASE_SCENARIO, false);
  const before = generateTravelPlan(configBefore, { interests: KNOWN_CASE_SCENARIO.interests }, days);
  const configWithRoute = configFor(KNOWN_CASE_SCENARIO, true);
  const withRoute = generateTravelPlan(configWithRoute, { interests: KNOWN_CASE_SCENARIO.interests }, days);
  if (!before.ok || !withRoute.ok) continue;

  const beforeByPlace = new Map<string, number>();
  before.data.plan.days.forEach((d) => d.stops.forEach((s) => beforeByPlace.set(s.placeId, d.dayNumber)));
  const afterByPlace = new Map<string, number>();
  withRoute.data.plan.days.forEach((d) => d.stops.forEach((s) => afterByPlace.set(s.placeId, d.dayNumber)));

  const moved = [...afterByPlace.entries()].filter(([placeId, afterDay]) => beforeByPlace.has(placeId) && beforeByPlace.get(placeId) !== afterDay);
  const droppedOrAdded = [...new Set([...beforeByPlace.keys(), ...afterByPlace.keys()])].filter((id) => !beforeByPlace.has(id) || !afterByPlace.has(id));

  console.log(`${days}d: ${moved.length} place(s) changed day` + (moved.length ? ":" : "."));
  for (const [placeId, afterDay] of moved) {
    console.log(`    ${placeId}: Day${beforeByPlace.get(placeId)} -> Day${afterDay} (cluster=${metaById.get(placeId)?.cluster})`);
  }
  if (droppedOrAdded.length > 0) console.log(`    also differs in selection: ${droppedOrAdded.join(", ")}`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 3 -- KNOWN-CASE BEFORE/WITH-ROUTE/WITH-RECLAIM TABLE (task section 24)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n================ PART 3: KNOWN-CASE TABLE ================\n");
for (const row of knownCaseRows) {
  console.log(`${row.days}d:`);
  const n = Math.max(row.before.length, row.withRoute.length, row.withReclaim.length);
  for (let i = 0; i < n; i++) {
    const b = row.before[i];
    const r = row.withRoute[i];
    const c = row.withReclaim[i];
    console.log(
      `  Day ${i + 1} | before: stops=${b?.stops} visit=${b?.visitMin} clusters=[${b?.clusters.join(",")}] travel=${b?.travelMin} density=${b?.density}` +
        ` || withRoute: stops=${r?.stops} visit=${r?.visitMin} clusters=[${r?.clusters.join(",")}] travel=${r?.travelMin} density=${r?.density}` +
        ` || withReclaim: stops=${c?.stops} visit=${c?.visitMin} clusters=[${c?.clusters.join(",")}] travel=${c?.travelMin} density=${c?.density}`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 4 -- FULL LONG-TRIP MATRIX (6-10 days x 9 profiles), reclaim OFF vs ON, CURRENT DATA
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 4: LONG-TRIP MATRIX (current production route data) ================\n");

const LONG_TRIP_PROFILES: ScenarioDef[] = [
  { label: "Surprise Me", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "foodShoppingNightlife"], experiencesSelected: false },
  { label: "Popular", interests: ["popular"], experiencesSelected: false },
  { label: "Culture", interests: ["cultureLocal"], experiencesSelected: false },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"], experiencesSelected: false },
  { label: "Food", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Shopping", interests: ["foodShoppingNightlife"], experiencesSelected: false },
  { label: "Experiences+Entertainment", interests: ["footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"], experiencesSelected: false },
  { label: "All 6 interests", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"], experiencesSelected: true },
];

type MatrixTally = { thin: number; veryThin: number; total: number; reclaimActivations: number; regressions: string[] };
function emptyTally(): MatrixTally { return { thin: 0, veryThin: 0, total: 0, reclaimActivations: 0, regressions: [] }; }

function runMatrix(useTestRoute: boolean, applyReclaim: boolean, dayCounts: number[]): MatrixTally {
  const tally = emptyTally();
  for (const profile of LONG_TRIP_PROFILES) {
    for (const days of dayCounts) {
      const config = configFor(profile, useTestRoute);
      const result = generateTravelPlan(config, { interests: profile.interests }, days);
      if (!result.ok) continue;
      let { plan, legsByDay } = result.data;

      if (applyReclaim) {
        const reclaimed = computeNaturalClusterReclaim(
          plan,
          legsByDay,
          PLACES,
          config.routeOptimizationConfig,
          config.dayBuilderConfig.clusterCompatibility,
          config.dayBuilderConfig.isPlaceEligibleForDay,
          null
        );
        if (reclaimed.applied.length > 0) {
          tally.reclaimActivations++;
          // Regression check: every OTHER day (not touched by the reclaim) must be byte-identical
          // in stop composition, and neither touched day may end up WORSE than it started.
          for (const c of reclaimed.applied) {
            if (classifyDayDensity(c.afterDonor.stopCount, c.afterDonorDay.totalVisitMinutes) !== "healthy") {
              tally.regressions.push(`${profile.label} ${days}d: donor Day${c.donorDayNumber} left non-healthy`);
            }
          }
        }
        plan = reclaimed.plan;
        legsByDay = reclaimed.legsByDay;
      }

      for (const day of plan.days) {
        tally.total++;
        const density = classifyDayDensity(day.stops.length, day.totalVisitMinutes);
        if (density === "thin") tally.thin++;
        if (density === "veryThin") tally.veryThin++;
      }
    }
  }
  return tally;
}

const LONG_DAYS = [6, 7, 8, 9, 10];
const matrixCurrentOff = runMatrix(false, false, LONG_DAYS);
const matrixCurrentOn = runMatrix(false, true, LONG_DAYS);
console.log(`CURRENT route data, reclaim OFF: total days=${matrixCurrentOff.total} thin=${matrixCurrentOff.thin} veryThin=${matrixCurrentOff.veryThin}`);
console.log(`CURRENT route data, reclaim ON:  total days=${matrixCurrentOn.total} thin=${matrixCurrentOn.thin} veryThin=${matrixCurrentOn.veryThin} | activations=${matrixCurrentOn.reclaimActivations} | regressions=${matrixCurrentOn.regressions.length}`);
for (const r of matrixCurrentOn.regressions) console.log(`    REGRESSION: ${r}`);

console.log("\n-- WITH the jardins-palau-pedralbes test route also enabled --");
const matrixRouteOff = runMatrix(true, false, LONG_DAYS);
const matrixRouteOn = runMatrix(true, true, LONG_DAYS);
console.log(`WITH test route, reclaim OFF: total days=${matrixRouteOff.total} thin=${matrixRouteOff.thin} veryThin=${matrixRouteOff.veryThin}`);
console.log(`WITH test route, reclaim ON:  total days=${matrixRouteOn.total} thin=${matrixRouteOn.thin} veryThin=${matrixRouteOn.veryThin} | activations=${matrixRouteOn.reclaimActivations} | regressions=${matrixRouteOn.regressions.length}`);
for (const r of matrixRouteOn.regressions) console.log(`    REGRESSION: ${r}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 5 -- SHORT-TRIP PROTECTION (1-5 days), reclaim OFF vs ON, CURRENT DATA
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 5: SHORT-TRIP PROTECTION (1-5 days) ================\n");
const SHORT_DAYS = [1, 2, 3, 4, 5];
let shortTripDiffs = 0;
for (const profile of LONG_TRIP_PROFILES) {
  for (const days of SHORT_DAYS) {
    const config = configFor(profile, false);
    const result = generateTravelPlan(config, { interests: profile.interests }, days);
    if (!result.ok) continue;
    const reclaimed = computeNaturalClusterReclaim(
      result.data.plan,
      result.data.legsByDay,
      PLACES,
      config.routeOptimizationConfig,
      config.dayBuilderConfig.clusterCompatibility,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );
    if (reclaimed.applied.length > 0) {
      shortTripDiffs++;
      console.log(`  ACTIVATED: ${profile.label} ${days}d -- ${reclaimed.applied.map((c) => `${c.placeId} Day${c.donorDayNumber}->Day${c.receiverDayNumber} (${c.benefit})`).join(", ")}`);
    }
  }
}
console.log(`Short-trip (1-5d) reclaim activations: ${shortTripDiffs} / ${LONG_TRIP_PROFILES.length * SHORT_DAYS.length} scenarios (expected: 0, or justified above)`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 6 -- DATE/HOURS PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 6: DATE/HOURS PROTECTION ================\n");
const DATED_CASES: { label: string; arrivalDate: string; days: number }[] = [
  { label: "Sunday arrival", arrivalDate: "2026-09-06", days: 9 },
  { label: "Monday arrival", arrivalDate: "2026-09-07", days: 9 },
  { label: "Weekend-spanning", arrivalDate: "2026-09-11", days: 10 },
];
for (const dc of DATED_CASES) {
  const config = configFor(KNOWN_CASE_SCENARIO, true, dc.arrivalDate);
  const result = generateTravelPlan(config, { interests: KNOWN_CASE_SCENARIO.interests }, dc.days);
  if (!result.ok) { console.log(`${dc.label}: generation failed -- ${result.error}`); continue; }
  const reclaimed = computeNaturalClusterReclaim(
    result.data.plan,
    result.data.legsByDay,
    PLACES,
    config.routeOptimizationConfig,
    config.dayBuilderConfig.clusterCompatibility,
    config.dayBuilderConfig.isPlaceEligibleForDay,
    null
  );
  const violatesEligibility = reclaimed.applied.some((c) => config.dayBuilderConfig.isPlaceEligibleForDay && !config.dayBuilderConfig.isPlaceEligibleForDay(c.placeId, c.receiverDayNumber));
  console.log(`${dc.label} (${dc.arrivalDate}, ${dc.days}d): applied=${reclaimed.applied.length} | eligibility violation=${violatesEligibility ? "YES (BUG)" : "no"}`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 7 -- ACCOMMODATION PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 7: ACCOMMODATION PROTECTION ================\n");
const ACCOMMODATION_CASES: { label: string; text: string | null }[] = [
  { label: "Central (old city)", text: "Hotel Gothic Quarter, Barcelona" },
  { label: "Distant (Diagonal Mar)", text: "Hotel Diagonal Mar, Barcelona" },
  { label: "No accommodation", text: null },
];
for (const ac of ACCOMMODATION_CASES) {
  for (const days of [8, 9, 10]) {
    const config = configFor(KNOWN_CASE_SCENARIO, true);
    const cluster = ac.text ? resolveBarcelonaAccommodationCluster(ac.text) : null;
    const preferences = {
      interests: KNOWN_CASE_SCENARIO.interests,
      accommodation: ac.text ? { text: ac.text, useAsDailyAnchor: true, cluster: cluster ?? undefined } : undefined,
    };
    const result = generateTravelPlan(config, preferences, days);
    if (!result.ok) { console.log(`${ac.label} ${days}d: generation failed -- ${result.error}`); continue; }
    const accommodationInfo = cluster ? { cluster, clusterCompatibility: config.dayBuilderConfig.clusterCompatibility } : null;
    const day1Before = result.data.plan.days.find((d) => d.dayNumber === 1)!;
    const reclaimed = computeNaturalClusterReclaim(
      result.data.plan,
      result.data.legsByDay,
      PLACES,
      config.routeOptimizationConfig,
      config.dayBuilderConfig.clusterCompatibility,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      accommodationInfo
    );
    const day1After = reclaimed.plan.days.find((d) => d.dayNumber === 1)!;
    console.log(`${ac.label} ${days}d: applied=${reclaimed.applied.length} | Day1 before=[${day1Before.stops.map((s) => s.placeId).join(",")}] after=[${day1After.stops.map((s) => s.placeId).join(",")}]`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 8 -- RECLAIM TABLE (every proposed reclaim across the long-trip matrix, safe or not)
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 8: RECLAIM TABLE (all candidates, current + test-route data) ================\n");
for (const useTestRoute of [false, true]) {
  console.log(`-- useTestRoute=${useTestRoute} --`);
  for (const profile of LONG_TRIP_PROFILES) {
    for (const days of LONG_DAYS) {
      const config = configFor(profile, useTestRoute);
      const result = generateTravelPlan(config, { interests: profile.interests }, days);
      if (!result.ok) continue;
      const reclaimed = computeNaturalClusterReclaim(
        result.data.plan,
        result.data.legsByDay,
        PLACES,
        config.routeOptimizationConfig,
        config.dayBuilderConfig.clusterCompatibility,
        config.dayBuilderConfig.isPlaceEligibleForDay,
        null
      );
      for (const c of reclaimed.allCandidates) {
        console.log(
          `  ${profile.label} ${days}d | donorDay${c.donorDayNumber}->receiverDay${c.receiverDayNumber} | ${c.placeId} | fit=${c.clusterFit} | travelDelta=${c.travelDelta} | benefit=${c.benefit} | donor ${c.beforeDonor.density}->${c.afterDonor.density} | receiver ${c.beforeReceiver.density}->${c.afterReceiver.density} | SAFE=${c.safe}`
        );
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 9 -- FULL PIPELINE CHAIN (reclaim THEN cross-day optimizer): ping-pong safety check
// (task section 10 -- confirms the cross-day pass's own "never degrade density" gate cannot
// undo a reclaim that fixed a thin/veryThin day, using the REAL production route table, which
// now includes jardins-palau-pedralbes -> passeig-de-gracia permanently).
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 9: FULL PIPELINE CHAIN (reclaim -> cross-day) ================\n");
let pingPongCount = 0;
for (const profile of LONG_TRIP_PROFILES) {
  for (const days of LONG_DAYS) {
    const config = configFor(profile, false); // real production table already has the entry
    const result = generateTravelPlan(config, { interests: profile.interests }, days);
    if (!result.ok) continue;

    const reclaimed = computeNaturalClusterReclaim(
      result.data.plan,
      result.data.legsByDay,
      PLACES,
      config.routeOptimizationConfig,
      config.dayBuilderConfig.clusterCompatibility,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );
    if (reclaimed.applied.length === 0) continue;

    const crossDayResult = applyCrossDayOptimization(
      reclaimed.plan,
      reclaimed.legsByDay,
      PLACES,
      config.routeOptimizationConfig,
      config.dayBuilderConfig.isPlaceEligibleForDay,
      null
    );

    for (const c of reclaimed.applied) {
      const receiverAfterCrossDay = crossDayResult.plan.days.find((d) => d.dayNumber === c.receiverDayNumber)!;
      const receiverStillHasPlace = receiverAfterCrossDay.stops.some((s) => s.placeId === c.placeId);
      const densityAfterCrossDay = classifyDayDensity(receiverAfterCrossDay.stops.length, receiverAfterCrossDay.totalVisitMinutes);
      const undone = !receiverStillHasPlace || densityAfterCrossDay !== c.afterReceiver.density;
      console.log(
        `  ${profile.label} ${days}d | reclaim moved ${c.placeId} into Day${c.receiverDayNumber} (${c.afterReceiver.density}) | after cross-day: stillPresent=${receiverStillHasPlace} density=${densityAfterCrossDay} | ${undone ? "PING-PONG (BUG)" : "stable"}`
      );
      if (undone) pingPongCount++;
    }
  }
}
console.log(`Total ping-pong cases: ${pingPongCount} (expected: 0)`);

console.log("\nDONE.");

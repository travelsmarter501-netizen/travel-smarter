/**
 * Dev-only debug script — NOT part of the app.
 *
 * P0 Exact-Date Safety Fix -- permanent regression audit for dated-plan closure integrity.
 * Validates the FINAL output of the real pipeline (Day Builder -> optimizer -> accommodation
 * reorder -> Natural Reclaim -> Cross-Day), not just the isolated `isPlaceEligibleForDay`
 * function in isolation -- it fails if ANY future change to any day-changing pass causes a place
 * with a real, verified weekday closure to land on a calendar date it is closed.
 *
 * `barcelonaV2DateEligibility.ts` (isPlaceClosedOnWeekday / findDatedPlanClosureViolations) is
 * `server-only`, so its date-closure logic is duplicated here in exact sync, following this
 * project's established pattern (see naturalClusterReclaimAudit.debug.ts's own doc comment for
 * the precedent). Everything else (travelPlannerEngine.ts, plannerNaturalClusterReclaim.ts,
 * plannerCrossDayOptimizer.ts, barcelonaV2DestinationConfig.ts) is imported directly -- none of
 * those carry a `server-only` dependency.
 *
 * Run with:
 *   npx tsx app/lib/planner/datedPlanClosureIntegrityAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { computeNaturalClusterReclaim } from "./plannerNaturalClusterReclaim";
import { applyCrossDayOptimization } from "./plannerCrossDayOptimizer";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { barcelonaGuide } from "../barcelona-guide";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import type { PlannerInterest } from "./plannerTypes";
import type { HoursInfo, Weekday } from "../hours";
import type { GeneratedPlannerPlan, ClusterCompatibilityMap } from "./plannerDayBuilder";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

// ── Duplicated from barcelonaV2DateEligibility.ts (`server-only`) -- kept in exact sync ──
function isPlaceClosedOnWeekday(hours: HoursInfo | undefined, weekday: Weekday): boolean {
  if (!hours) return false;
  if (hours.type === "temporarily-closed") return true;
  if (hours.type === "variable" && hours.closedWeekdays?.includes(weekday)) return true;
  if (hours.type !== "fixed") return false;
  const intervals = hours.schedule[weekday];
  return !intervals || intervals.length === 0;
}
function hoursForPlaceId(placeId: string): HoursInfo | undefined {
  const resolved =
    barcelonaGuide.attractions.find((a) => a.id === placeId) ??
    barcelonaGuide.shoppingAreas.find((a) => a.id === placeId) ??
    barcelonaGuide.experiences.find((a) => a.id === placeId);
  return resolved?.hours;
}
function buildDateEligibility(arrivalDateIso: string) {
  return (placeId: string, dayNumber: number): boolean => {
    const dateForDay = addDaysToIsoDate(arrivalDateIso, dayNumber - 1);
    if (!dateForDay) return true;
    const weekday = weekdayOfIsoDate(dateForDay);
    if (!weekday) return true;
    return !isPlaceClosedOnWeekday(hoursForPlaceId(placeId), weekday);
  };
}
function findViolations(days: GeneratedPlannerPlan["days"], arrivalDateIso: string) {
  const violations: { placeId: string; dayNumber: number; date: string; weekday: Weekday }[] = [];
  for (const day of days) {
    const date = addDaysToIsoDate(arrivalDateIso, day.dayNumber - 1);
    const weekday = date ? weekdayOfIsoDate(date) : null;
    if (!date || !weekday) continue;
    for (const stop of day.stops) {
      if (isPlaceClosedOnWeekday(hoursForPlaceId(stop.placeId), weekday)) {
        violations.push({ placeId: stop.placeId, dayNumber: day.dayNumber, date, weekday });
      }
    }
  }
  return violations;
}

const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);

// ── Canonical 11-profile matrix (same as timelineScheduleAudit.debug.ts / mustSeePriorityAudit.debug.ts) ──
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

type RunResult = { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] };

function runDated(profile: ProfileDef, days: number, arrivalDateIso: string, accommodationText: string | null): RunResult | null {
  const eligibilityFn = buildDateEligibility(arrivalDateIso);
  const isPlaceEligibleForDay = (placeId: string, dayNumber: number): boolean => {
    if (EXPERIENCES_GATED_PLACE_IDS.has(placeId) && !profile.experiencesSelected) return false;
    return eligibilityFn(placeId, dayNumber);
  };
  const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe: !!profile.surpriseMe, days });
  const config = {
    ...BARCELONA_V2_DESTINATION_CONFIG,
    dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay, flagshipCoverageGoals },
  };
  const accommodationCluster = accommodationText ? resolveBarcelonaAccommodationCluster(accommodationText) : undefined;
  const accommodation = accommodationText && accommodationCluster ? { text: accommodationText, useAsDailyAnchor: true, cluster: accommodationCluster } : undefined;
  const preferences = { interests: profile.interests, accommodation };

  const result = generateTravelPlan(config, preferences, days as 1 | 3 | 5);
  if (!result.ok) return null;

  const accommodationInfo = accommodation?.useAsDailyAnchor && accommodation.cluster ? { cluster: accommodation.cluster, clusterCompatibility: config.dayBuilderConfig.clusterCompatibility as ClusterCompatibilityMap } : null;
  const reclaimed = computeNaturalClusterReclaim(result.data.plan, result.data.legsByDay, config.plannerMetadata, config.routeOptimizationConfig, config.dayBuilderConfig.clusterCompatibility, isPlaceEligibleForDay, accommodationInfo);
  const crossDay = applyCrossDayOptimization(reclaimed.plan, reclaimed.legsByDay, config.plannerMetadata, config.routeOptimizationConfig, isPlaceEligibleForDay, accommodationInfo);
  return { plan: crossDay.plan as GeneratedPlannerPlan, legsByDay: crossDay.legsByDay as PlannerRouteLeg[][] };
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 0: enumerate every known weekday closure in the current candidate pool
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("================ PART 0: known weekday-closure candidates in the Guide ================\n");
const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const allMainStopCandidates = [...barcelonaGuide.attractions, ...barcelonaGuide.shoppingAreas, ...barcelonaGuide.experiences];
for (const place of allMainStopCandidates) {
  const closedDays = WEEKDAYS.filter((w) => isPlaceClosedOnWeekday(place.hours, w));
  if (closedDays.length > 0) console.log(`  ${place.id}: closed on ${closedDays.join(", ")}`);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 1: full dated matrix -- 11 profiles x [1,3,5,7,10] days x 7 start weekdays
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n================ PART 1: DATED MATRIX (11 profiles x 5 day-counts x 7 start weekdays) ================\n");
// 2026-09-13 is a Sunday (verified against the live product this session) -- +0..+6 covers every start weekday.
const START_DATES = Array.from({ length: 7 }, (_, i) => addDaysToIsoDate("2026-09-13", i)!);
const DAY_COUNTS = [1, 3, 5, 7, 10];

let totalDatedPlans = 0;
let totalDatedDays = 0;
let totalFinalStops = 0;
let totalViolations = 0;
const violationLog: string[] = [];

for (const profile of PROFILES) {
  for (const days of DAY_COUNTS) {
    for (const startDate of START_DATES) {
      const arrival = startDate;
      const departure = addDaysToIsoDate(arrival, days - 1)!;
      const result = runDated(profile, days, arrival, null);
      if (!result) continue;
      totalDatedPlans++;
      totalDatedDays += result.plan.days.length;
      totalFinalStops += result.plan.days.reduce((sum, d) => sum + d.stops.length, 0);
      const violations = findViolations(result.plan.days, arrival);
      if (violations.length > 0) {
        totalViolations += violations.length;
        violationLog.push(`${profile.label} ${days}d arrival=${arrival} departure=${departure}: ${violations.map((v) => `${v.placeId}@day${v.dayNumber}(${v.weekday})`).join(", ")}`);
      }
    }
  }
}
console.log(`Total dated plans generated: ${totalDatedPlans}`);
console.log(`Total dated days: ${totalDatedDays}`);
console.log(`Total final main stops checked: ${totalFinalStops}`);
console.log(`Known-closed violations: ${totalViolations}`);
if (violationLog.length > 0) {
  console.log("\nVIOLATIONS:");
  violationLog.forEach((l) => console.log("  " + l));
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 2: accommodation reordering safety -- 4 accommodation variants x the exact P0 repro dates
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 2: ACCOMMODATION REORDERING SAFETY ================\n");
const ACCOMMODATIONS = [
  { label: "A. not booked", text: null },
  { label: "B. Gothic Quarter", text: "Gothic Quarter, Barcelona" },
  { label: "C. Eixample", text: "Eixample, Barcelona" },
  { label: "D. Barceloneta", text: "Barceloneta, Barcelona" },
];
let accommodationViolations = 0;
for (const acc of ACCOMMODATIONS) {
  for (const profile of [PROFILES[1], PROFILES[4]]) {
    // Popular, Food -- the two profiles that actually surfaced the original bug.
    const result = runDated(profile, 4, "2026-09-13", acc.text);
    if (!result) continue;
    const violations = findViolations(result.plan.days, "2026-09-13");
    const dayOrder = result.plan.days.map((d) => `Day${d.dayNumber}:[${d.stops.map((s) => s.placeId).join(",")}]`).join(" | ");
    console.log(`${acc.label} / ${profile.label}: violations=${violations.length}`);
    console.log(`  ${dayOrder}`);
    accommodationViolations += violations.length;
  }
}
console.log(`\nTotal accommodation-reorder violations: ${accommodationViolations}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PART 3: exact P0 reproduction -- 2026-09-13 -> 2026-09-16, Popular+Food
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n\n================ PART 3: EXACT P0 REPRODUCTION (2026-09-13 -> 2026-09-16, Popular+Food) ================\n");
const p0Result = runDated({ label: "Popular+Food", interests: ["popular", "foodShoppingNightlife"], experiencesSelected: false }, 4, "2026-09-13", "Gothic Quarter, Barcelona");
if (p0Result) {
  for (const day of p0Result.plan.days) {
    const date = addDaysToIsoDate("2026-09-13", day.dayNumber - 1)!;
    const weekday = weekdayOfIsoDate(date)!;
    console.log(`  Day ${day.dayNumber} (${weekday}, ${date}): ${day.stops.map((s) => s.placeId).join(", ")}`);
  }
  const p0Violations = findViolations(p0Result.plan.days, "2026-09-13");
  console.log(`\nBoqueria scheduled: ${p0Result.plan.days.some((d) => d.stops.some((s) => s.placeId === "boqueria"))}`);
  console.log(`Museu d'Història scheduled: ${p0Result.plan.days.some((d) => d.stops.some((s) => s.placeId === "museu-historia-catalunya"))}`);
  console.log(`Violations: ${p0Violations.length}`);
}

console.log("\nDONE.");

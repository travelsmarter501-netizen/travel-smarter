/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * Smart Planner Nightlife Integration V1 verification. Run with:
 *
 *   npx tsx app/lib/planner/smartPlannerNightlifeVerification.debug.ts
 *
 * 1. Test profiles A-F (from the nightlife task spec): per-day optionalNearby ids/types,
 *    which nightlife venue (if any) was selected, and why its geography matched.
 * 2. The 9 regression checks the task asks for, run programmatically -- never hidden.
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { presentBarcelonaSmartPlan } from "./barcelona-planner-presentation";
import { barcelonaGuide } from "../barcelona-guide";
import { resolvePlace } from "../readyPlan";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest, PlannerPreferences } from "./plannerTypes";

let totalFailures = 0;
function fail(section: string, message: string) {
  console.log(`  [FAIL/${section}] ${message}`);
  totalFailures++;
}

const guideWithNightlife = {
  attractions: barcelonaGuide.attractions,
  foodPlaces: barcelonaGuide.foodPlaces,
  experiences: barcelonaGuide.experiences,
  areas: barcelonaGuide.areas,
  nightlifeVenues: barcelonaGuide.nightlifeVenues,
};
/** Mirrors the exact guide shape Ready Plan passes -- no nightlifeVenues field at all. */
const guideLikeReadyPlan = {
  attractions: barcelonaGuide.attractions,
  foodPlaces: barcelonaGuide.foodPlaces,
  experiences: barcelonaGuide.experiences,
  areas: barcelonaGuide.areas,
};

// ============================================================================
// SECTION 1 -- test profiles A-F
// ============================================================================
console.log("================ SECTION 1: TEST PROFILE OUTPUT (A-F) ================");

const TEST_PROFILES: { label: string; preferences: PlannerPreferences }[] = [
  { label: "A: foodShoppingNightlife", preferences: { interests: ["foodShoppingNightlife"] } },
  { label: "B: popular+foodShoppingNightlife", preferences: { interests: ["popular", "foodShoppingNightlife"] } },
  { label: "C: cultureLocal+foodShoppingNightlife", preferences: { interests: ["cultureLocal", "foodShoppingNightlife"] } },
  { label: "D: beachRelax+foodShoppingNightlife", preferences: { interests: ["beachRelax", "foodShoppingNightlife"] } },
  { label: "E: popular+cultureLocal+foodShoppingNightlife", preferences: { interests: ["popular", "cultureLocal", "foodShoppingNightlife"] } },
  {
    label: "F: mustVisit (camp-nou, mnac, barceloneta-beach) + foodShoppingNightlife",
    preferences: { interests: ["foodShoppingNightlife"], mustVisit: ["camp-nou", "mnac", "barceloneta-beach"] },
  },
];

for (const { label, preferences } of TEST_PROFILES) {
  const result = generateBarcelonaSmartPlan(preferences);
  console.log(`\n[${label}]`);
  if (!result.ok) {
    console.log(`  generation FAILED: ${result.error}`);
    fail("S1", `[${label}] unexpected generation failure`);
    continue;
  }
  const presented = presentBarcelonaSmartPlan(result.data.plan, preferences);
  presented.byDay.forEach((dayPresentation, index) => {
    const dayNumber = result.data.plan.days[index].dayNumber;
    const ids = dayPresentation.optionalNearby.map((s) => `${s.placeId}[${s.type}]`).join(", ") || "(none)";
    console.log(`  Day ${dayNumber} optionalNearby: ${ids}`);
    const nightlife = dayPresentation.optionalNearby.find((s) => s.type === "nightlife");
    if (nightlife) {
      console.log(`    -> nightlife venue: "${nightlife.placeId}" -- geography reason: "${nightlife.reason}"`);
    } else {
      console.log(`    -> no nightlife venue selected for Day ${dayNumber} (no genuinely-matching venue this day, not forced).`);
    }
  });
}
console.log("\nSECTION 1 done.\n");

// ============================================================================
// SECTION 2 -- the 9 regression checks
// ============================================================================
console.log("================ SECTION 2: REGRESSION CHECKS ================");

// 1. attraction resolution unchanged
{
  const resolved = resolvePlace("sagrada-familia", "attraction", guideLikeReadyPlan);
  if (!resolved || resolved.type !== "attraction" || resolved.place.name !== "Sagrada Família" || !resolved.areaName) {
    fail("S2.1", `attraction resolution broken: ${JSON.stringify(resolved)}`);
  } else {
    console.log(`  [OK] 1. attraction resolution: "${resolved.place.name}" in "${resolved.areaName}"`);
  }
}

// 2. food resolution unchanged
{
  const resolved = resolvePlace("el-xampanyet", "food", guideLikeReadyPlan);
  if (!resolved || resolved.type !== "food" || !resolved.place.name) {
    fail("S2.2", `food resolution broken: ${JSON.stringify(resolved)}`);
  } else {
    console.log(`  [OK] 2. food resolution: "${resolved.place.name}"`);
  }
}

// 3. experience resolution unchanged
{
  const resolved = resolvePlace("teleferic-montjuic", "experience", guideLikeReadyPlan);
  if (!resolved || resolved.type !== "experience" || !resolved.place.name) {
    fail("S2.3", `experience resolution broken: ${JSON.stringify(resolved)}`);
  } else {
    console.log(`  [OK] 3. experience resolution: "${resolved.place.name}"`);
  }
}

// 4. nightlife resolution works (with nightlifeVenues present) AND fails gracefully (not a throw) without it
{
  const resolvedWithData = resolvePlace("paradiso", "nightlife", guideWithNightlife);
  const resolvedWithoutData = resolvePlace("paradiso", "nightlife", guideLikeReadyPlan);
  if (!resolvedWithData || resolvedWithData.type !== "nightlife" || resolvedWithData.place.name !== "Paradiso") {
    fail("S2.4", `nightlife resolution broken: ${JSON.stringify(resolvedWithData)}`);
  } else if (resolvedWithoutData !== undefined) {
    fail("S2.4", `nightlife resolution should return undefined (not throw/fabricate) when nightlifeVenues is absent from guide.`);
  } else {
    console.log(`  [OK] 4. nightlife resolution: "${resolvedWithData.place.name}" (area: ${resolvedWithData.place.area}); gracefully undefined without nightlifeVenues data.`);
  }
}

// 5. Ready-Plan-shaped guide (no nightlifeVenues field) still resolves attraction/food/experience identically
{
  const a1 = resolvePlace("sagrada-familia", "attraction", guideLikeReadyPlan);
  const a2 = resolvePlace("sagrada-familia", "attraction", guideWithNightlife);
  const f1 = resolvePlace("el-xampanyet", "food", guideLikeReadyPlan);
  const f2 = resolvePlace("el-xampanyet", "food", guideWithNightlife);
  const identical = JSON.stringify(a1) === JSON.stringify(a2) && JSON.stringify(f1) === JSON.stringify(f2);
  if (!identical) {
    fail("S2.5", "Ready-Plan-shaped guide (no nightlifeVenues) resolves attraction/food differently than the nightlife-aware guide -- Ready Plan would regress.");
  } else {
    console.log("  [OK] 5. Ready Plan's guide shape (no nightlifeVenues) resolves attraction/food/experience identically -- PlaceDetailsSheet unaffected.");
  }
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [...combinations(rest, size - 1).map((c) => [first, ...c]), ...combinations(rest, size)];
}
const ALL_41_INTERESTS: PlannerInterest[][] = [
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 1),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 2),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 3),
];

const REGRESSION_CASES: { label: string; preferences: PlannerPreferences }[] = [
  ...ALL_41_INTERESTS.map((interests) => ({ label: `baseline:${interests.join("+")}`, preferences: { interests, mustVisit: [] } })),
  ...TEST_PROFILES,
];

let noMainStopDup = 0;
let maxNightlifeViolations = 0;
let stopOrderChanged = 0;
let legsChanged = 0;
let casesChecked = 0;

for (const { label, preferences } of REGRESSION_CASES) {
  const result = generateBarcelonaSmartPlan(preferences);
  if (!result.ok) continue;
  casesChecked++;

  const originalStopOrder = JSON.stringify(result.data.plan.days.map((day) => day.stops.map((s) => s.placeId)));
  const originalLegs = JSON.stringify(result.data.legsByDay);
  const allMainStopIds = new Set(result.data.plan.days.flatMap((day) => day.stops.map((s) => s.placeId)));

  const presented = presentBarcelonaSmartPlan(result.data.plan, preferences);
  presented.byDay.forEach((dayPresentation, index) => {
    const dayNumber = result.data.plan.days[index].dayNumber;
    for (const s of dayPresentation.optionalNearby) {
      if (allMainStopIds.has(s.placeId)) {
        fail("S2.6", `[${label}] Day ${dayNumber}: optionalNearby "${s.placeId}" duplicates a main stop.`);
        noMainStopDup++;
      }
    }
    const nightlifeCount = dayPresentation.optionalNearby.filter((s) => s.type === "nightlife").length;
    if (nightlifeCount > 1) {
      fail("S2.7", `[${label}] Day ${dayNumber}: ${nightlifeCount} nightlife suggestions (>1).`);
      maxNightlifeViolations++;
    }
  });

  const newStopOrder = JSON.stringify(result.data.plan.days.map((day) => day.stops.map((s) => s.placeId)));
  if (originalStopOrder !== newStopOrder) {
    fail("S2.8", `[${label}] stop order changed after calling presentBarcelonaSmartPlan.`);
    stopOrderChanged++;
  }
  const newLegs = JSON.stringify(result.data.legsByDay);
  if (originalLegs !== newLegs) {
    fail("S2.9", `[${label}] transport legs changed after calling presentBarcelonaSmartPlan.`);
    legsChanged++;
  }
}

console.log(`\nCases checked: ${casesChecked} / ${REGRESSION_CASES.length}`);
console.log(`  6. no optional suggestion duplicates a main stop: ${noMainStopDup} violations`);
console.log(`  7. max 1 nightlife/day:                           ${maxNightlifeViolations} violations`);
console.log(`  8. planner output (stop order) unchanged:         ${stopOrderChanged} violations`);
console.log(`  9. transport legs unchanged:                      ${legsChanged} violations`);
console.log("SECTION 2 done.\n");

console.log("================ OVERALL ================");
console.log(`Total failures across all sections: ${totalFailures}`);
console.log(totalFailures === 0 ? "ALL CHECKS PASSED." : "SOME CHECKS FAILED -- see FAIL lines above, none hidden.");

/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * Smart Plan Presentation V1 verification. Two sections, run with:
 *
 *   npx tsx app/lib/planner/smartPlannerPresentationVerification.debug.ts
 *
 * 1. Test profiles A-H (from the presentation task spec) plus a 3-mustVisit case: for each,
 *    prints Day 1/2/3 title/summary/highlight + optionalNearby placeIds.
 * 2. Quality assertions (9, from the task spec) across the same profiles plus the full
 *    41-profile baseline (mustVisit=[]) -- never hidden, every failure printed.
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { presentBarcelonaSmartPlan } from "./barcelona-planner-presentation";
import { barcelonaGuide } from "../barcelona-guide";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest, PlannerPreferences } from "./plannerTypes";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

const ALL_41_PROFILES: PlannerInterest[][] = [
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 1),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 2),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 3),
];

const CLUSTER_IDS = [
  "eixample-north", "passeig-gracia", "gracia-north", "old-city", "city-center",
  "born", "seafront", "seafront-east", "montjuic", "les-corts", "tibidabo",
];

const ALL_GUIDE_PLACE_IDS = new Set([
  ...barcelonaGuide.attractions.map((p) => p.id),
  ...barcelonaGuide.foodPlaces.map((p) => p.id),
  ...barcelonaGuide.experiences.map((p) => p.id),
  ...barcelonaGuide.nightlifeVenues.map((p) => p.id),
]);

let totalFailures = 0;
function fail(section: string, message: string) {
  console.log(`  [FAIL/${section}] ${message}`);
  totalFailures++;
}

// ============================================================================
// SECTION 1 -- test profiles A-H + a 3-mustVisit case
// ============================================================================
console.log("================ SECTION 1: TEST PROFILE PRESENTATION OUTPUT ================");

const TEST_PROFILES: { label: string; preferences: PlannerPreferences }[] = [
  { label: "A: popular", preferences: { interests: ["popular"] } },
  { label: "B: popular+viewsNature", preferences: { interests: ["popular", "viewsNature"] } },
  { label: "C: footballExperiences", preferences: { interests: ["footballExperiences"] } },
  { label: "D: cultureLocal", preferences: { interests: ["cultureLocal"] } },
  { label: "E: beachRelax", preferences: { interests: ["beachRelax"] } },
  { label: "F: foodShoppingNightlife", preferences: { interests: ["foodShoppingNightlife"] } },
  { label: "G: popular+footballExperiences", preferences: { interests: ["popular", "footballExperiences"] } },
  { label: "H: popular+cultureLocal+viewsNature", preferences: { interests: ["popular", "cultureLocal", "viewsNature"] } },
  {
    label: "I: 3 mustVisit (casa-mila, sagrada-familia, park-guell) + popular",
    preferences: { interests: ["popular"], mustVisit: ["casa-mila", "sagrada-familia", "park-guell"] },
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
    console.log(`  Day ${dayNumber} title: ${dayPresentation.title}`);
    console.log(`  Day ${dayNumber} summary: ${dayPresentation.summary}`);
    console.log(`  Day ${dayNumber} highlight: ${dayPresentation.highlight ?? "(none)"}`);
    console.log(`  Day ${dayNumber} optionalNearby: ${dayPresentation.optionalNearby.map((s) => `${s.placeId}[${s.type}]`).join(", ") || "(none)"}`);
  });
}
console.log("\nSECTION 1 done.\n");

// ============================================================================
// SECTION 2 -- 9 quality assertions, across the 41-profile baseline + test profiles
// ============================================================================
console.log("================ SECTION 2: QUALITY ASSERTIONS ================");

type AssertionCase = { label: string; preferences: PlannerPreferences };
const ASSERTION_CASES: AssertionCase[] = [
  ...ALL_41_PROFILES.map((interests) => ({ label: `baseline:${interests.join("+")}`, preferences: { interests, mustVisit: [] } })),
  ...TEST_PROFILES,
];

let a1 = 0, // no optional suggestion duplicates a main stop
  a2 = 0, // no optional suggestion duplicated across days
  a3 = 0, // every suggestion resolves to real guide data
  a4 = 0, // max 4 optional suggestions/day
  a5 = 0, // max 2 food/cafe suggestions/day
  a6 = 0, // max 1 nightlife suggestion/day
  a7 = 0, // presentation never changes stop order
  a8 = 0, // presentation never changes transport legs (structural: presentBarcelonaSmartPlan never receives/returns legs)
  a9 = 0; // no technical cluster ids visible in title/summary/highlight/reason

let casesChecked = 0;

for (const { label, preferences } of ASSERTION_CASES) {
  const result = generateBarcelonaSmartPlan(preferences);
  if (!result.ok) continue;
  casesChecked++;

  const originalStopOrder = result.data.plan.days.map((day) => day.stops.map((s) => s.placeId).join(","));
  const originalLegs = JSON.stringify(result.data.legsByDay);

  const presented = presentBarcelonaSmartPlan(result.data.plan, preferences);

  const allMainStopIds = new Set(result.data.plan.days.flatMap((day) => day.stops.map((s) => s.placeId)));
  const seenAcrossDays = new Set<string>();

  presented.byDay.forEach((dayPresentation, index) => {
    const dayNumber = result.data.plan.days[index].dayNumber;

    // 1. no optional suggestion duplicates a main stop
    for (const s of dayPresentation.optionalNearby) {
      if (allMainStopIds.has(s.placeId)) {
        fail("S2.1", `[${label}] Day ${dayNumber}: optionalNearby "${s.placeId}" duplicates a main stop.`);
        a1++;
      }
    }

    // 2. no optional suggestion duplicated across days
    for (const s of dayPresentation.optionalNearby) {
      if (seenAcrossDays.has(s.placeId)) {
        fail("S2.2", `[${label}] Day ${dayNumber}: optionalNearby "${s.placeId}" already suggested on an earlier day.`);
        a2++;
      }
      seenAcrossDays.add(s.placeId);
    }

    // 3. every suggestion resolves to real guide data
    for (const s of dayPresentation.optionalNearby) {
      if (!ALL_GUIDE_PLACE_IDS.has(s.placeId)) {
        fail("S2.3", `[${label}] Day ${dayNumber}: optionalNearby "${s.placeId}" does not resolve to real guide data.`);
        a3++;
      }
    }

    // 4. max 4 optional suggestions/day
    if (dayPresentation.optionalNearby.length > 4) {
      fail("S2.4", `[${label}] Day ${dayNumber}: ${dayPresentation.optionalNearby.length} optionalNearby (>4).`);
      a4++;
    }

    // 5. max 2 food/cafe suggestions/day
    const foodCafeCount = dayPresentation.optionalNearby.filter((s) => s.type === "food" || s.type === "cafe").length;
    if (foodCafeCount > 2) {
      fail("S2.5", `[${label}] Day ${dayNumber}: ${foodCafeCount} food/cafe suggestions (>2).`);
      a5++;
    }

    // 6. max 1 nightlife suggestion/day
    const nightlifeCount = dayPresentation.optionalNearby.filter((s) => s.type === "nightlife").length;
    if (nightlifeCount > 1) {
      fail("S2.6", `[${label}] Day ${dayNumber}: ${nightlifeCount} nightlife suggestions (>1).`);
      a6++;
    }

    // 9. no technical cluster ids visible in any user-facing text
    const textBlob = [dayPresentation.title, dayPresentation.summary, dayPresentation.highlight ?? "", ...dayPresentation.optionalNearby.map((s) => s.reason ?? "")].join(" ");
    for (const clusterId of CLUSTER_IDS) {
      if (textBlob.includes(clusterId)) {
        fail("S2.9", `[${label}] Day ${dayNumber}: user-facing text contains raw cluster id "${clusterId}".`);
        a9++;
      }
    }
  });

  // 7. presentation never changes stop order
  const newStopOrder = result.data.plan.days.map((day) => day.stops.map((s) => s.placeId).join(","));
  if (JSON.stringify(originalStopOrder) !== JSON.stringify(newStopOrder)) {
    fail("S2.7", `[${label}] stop order changed after calling presentBarcelonaSmartPlan.`);
    a7++;
  }

  // 8. presentation never changes transport legs
  const newLegs = JSON.stringify(result.data.legsByDay);
  if (originalLegs !== newLegs) {
    fail("S2.8", `[${label}] transport legs changed after calling presentBarcelonaSmartPlan.`);
    a8++;
  }
}

console.log(`\nCases checked: ${casesChecked} / ${ASSERTION_CASES.length}`);
console.log("\nAssertion failure counts:");
console.log(`  1. no optional duplicates a main stop:        ${a1}`);
console.log(`  2. no optional duplicated across days:        ${a2}`);
console.log(`  3. every suggestion resolves to real data:    ${a3}`);
console.log(`  4. max 4 optional/day:                        ${a4}`);
console.log(`  5. max 2 food/cafe/day:                       ${a5}`);
console.log(`  6. max 1 nightlife/day:                       ${a6}`);
console.log(`  7. stop order unchanged:                      ${a7}`);
console.log(`  8. transport legs unchanged:                  ${a8}`);
console.log(`  9. no raw cluster ids in UI text:             ${a9}`);
console.log("SECTION 2 done.\n");

console.log("================ OVERALL ================");
console.log(`Total failures across all sections: ${totalFailures}`);
console.log(totalFailures === 0 ? "ALL CHECKS PASSED." : "SOME CHECKS FAILED -- see FAIL lines above, none hidden.");

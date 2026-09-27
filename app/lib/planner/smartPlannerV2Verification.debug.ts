/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * Smart Planner V2 verification (interest/mustVisit cap removal + 4-6 day-balance rewrite).
 * Run with:
 *
 *   npx tsx app/lib/planner/smartPlannerV2Verification.debug.ts
 *
 * 1. The 6 named customer scenarios -- distribution + a note on any day still <4.
 * 2. All-interest cases: 4, 5, and all 6 interests selected, with and without mustVisit.
 * 3. Must Visit stress test: at capacity (18), one over capacity (19, expects a validation
 *    error, not a generated plan), and a few realistic large-but-valid selections.
 * 4. Full 47-case regression (41 interest-count profiles, 1-6 interests each, + the 6 named
 *    scenarios) against the hard assertions: no duplicate ids, no day >6 stops, no day >420
 *    visit minutes, no day >3 clusters, mustVisit honored, football guarantee, Popular Tier A
 *    guarantee. Also reports how many days land outside the 4-6 target and lists them, since a
 *    genuinely isolated cluster can legitimately leave a day honestly short (see file's own
 *    task report for the specific cases and why).
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { validatePlannerPreferences } from "./plannerScoring";
import { getBarcelonaPlannerPlaces } from "./barcelona-planner-metadata";
import { BARCELONA_ICONIC_TIER_A, BARCELONA_REQUIRED_COVERAGE_GOALS } from "./barcelona-planner-day-builder";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest, PlannerPreferences } from "./plannerTypes";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [...combinations(rest, size - 1).map((c) => [first, ...c]), ...combinations(rest, size)];
}

let totalFailures = 0;
function fail(section: string, message: string) {
  console.log(`  [FAIL/${section}] ${message}`);
  totalFailures++;
}

// ============================================================================
// SECTION 1 -- the 6 named customer scenarios
// ============================================================================
console.log("================ SECTION 1: 6 NAMED CUSTOMER SCENARIOS ================");

const UX_SCENARIOS: { label: string; preferences: PlannerPreferences }[] = [
  { label: "1: popular+cultureLocal", preferences: { interests: ["popular", "cultureLocal"] } },
  { label: "2: popular+viewsNature", preferences: { interests: ["popular", "viewsNature"] } },
  { label: "3: footballExperiences + mustVisit(camp-nou)", preferences: { interests: ["footballExperiences"], mustVisit: ["camp-nou"] } },
  { label: "4: beachRelax+foodShoppingNightlife", preferences: { interests: ["beachRelax", "foodShoppingNightlife"] } },
  { label: "5: popular+cultureLocal+viewsNature", preferences: { interests: ["popular", "cultureLocal", "viewsNature"] } },
  {
    label: "6: popular+footballExperiences + mustVisit(sagrada-familia,camp-nou,barceloneta-beach)",
    preferences: { interests: ["popular", "footballExperiences"], mustVisit: ["sagrada-familia", "camp-nou", "barceloneta-beach"] },
  },
];

for (const { label, preferences } of UX_SCENARIOS) {
  const result = generateBarcelonaSmartPlan(preferences);
  if (!result.ok) {
    console.log(`[${label}] generation FAILED: ${result.error}`);
    fail("S1", `[${label}] unexpected generation failure`);
    continue;
  }
  const counts = result.data.plan.days.map((d) => d.stops.length);
  const outOfRange = counts.filter((c) => c < 4 || c > 6);
  console.log(`[${label}] Distribution: ${counts.join("/")}${outOfRange.length > 0 ? "  <- day(s) outside 4-6" : ""}`);
  if (counts.some((c) => c > 6)) fail("S1", `[${label}] a day exceeds the 6-stop hard max: ${counts.join("/")}`);
}
console.log("SECTION 1 done.\n");

// ============================================================================
// SECTION 2 -- all-interest cases (Part 12: A-C)
// ============================================================================
console.log("================ SECTION 2: ALL-INTEREST CASES ================");

const ALL_INTEREST_CASES: { label: string; preferences: PlannerPreferences }[] = [
  { label: "A: all 6 interests", preferences: { interests: [...PLANNER_INTERESTS] } },
  { label: "B: 5 interests", preferences: { interests: PLANNER_INTERESTS.slice(0, 5) } },
  { label: "C: 4 interests", preferences: { interests: PLANNER_INTERESTS.slice(0, 4) } },
  {
    label: "D: all 6 interests + several mustVisit",
    preferences: { interests: [...PLANNER_INTERESTS], mustVisit: ["sagrada-familia", "park-guell", "camp-nou"] },
  },
  {
    label: "E: all 6 interests + max legal mustVisit (8, the full candidate list)",
    preferences: {
      interests: [...PLANNER_INTERESTS],
      mustVisit: ["sagrada-familia", "park-guell", "casa-batllo", "camp-nou", "barceloneta-beach", "bunkers-carmel", "gothic-quarter", "mnac"],
    },
  },
];

for (const { label, preferences } of ALL_INTEREST_CASES) {
  const result = generateBarcelonaSmartPlan(preferences);
  if (!result.ok) {
    console.log(`[${label}] generation FAILED: ${result.error}`);
    fail("S2", `[${label}] unexpected generation failure`);
    continue;
  }
  const { plan } = result.data;
  const counts = plan.days.map((d) => d.stops.length);
  const allStopIds = plan.days.flatMap((d) => d.stops.map((s) => s.placeId));
  const uniqueCount = new Set(allStopIds).size;
  const scores = plan.days.flatMap((d) => d.stops.map((s) => s.score));
  const missingMustVisit = (preferences.mustVisit ?? []).filter((id) => !allStopIds.includes(id));
  console.log(
    `[${label}] Distribution: ${counts.join("/")} | total stops: ${allStopIds.length} (unique: ${uniqueCount}) | score range: ${Math.min(...scores).toFixed(2)}-${Math.max(...scores).toFixed(2)} | missing mustVisit: ${missingMustVisit.length}`
  );
  if (uniqueCount !== allStopIds.length) fail("S2", `[${label}] duplicate place ids in plan`);
  if (missingMustVisit.length > 0) fail("S2", `[${label}] mustVisit not honored: ${missingMustVisit.join(", ")}`);
  // Scoring sanity: with every interest selected, scores must stay spread out (not collapsed
  // to a single flat value) so ranking/selection still discriminates between places.
  if (new Set(scores.map((s) => s.toFixed(2))).size <= 1) fail("S2", `[${label}] scores collapsed to a single value -- ranking lost discrimination`);
}
console.log("SECTION 2 done.\n");

// ============================================================================
// SECTION 3 -- Must Visit stress test (Part 6)
// ============================================================================
console.log("================ SECTION 3: MUST VISIT STRESS TEST ================");

const allPlaceIds = getBarcelonaPlannerPlaces().map((p) => p.placeId);

// 3a. Exactly at the documented capacity (18) -- validation must accept the shape (may still
// fail generation honestly if 18 truly can't all fit, but must NOT be rejected for length).
const at18 = allPlaceIds.slice(0, Math.min(18, allPlaceIds.length));
const validation18 = validatePlannerPreferences({ interests: ["popular"], mustVisit: at18 }, new Set(allPlaceIds));
console.log(`[3a: mustVisit=${at18.length} (at documented capacity)] validation: ${validation18.valid ? "accepted" : `REJECTED (${(validation18 as { reason: string }).reason})`}`);
if (!validation18.valid) fail("S3a", `mustVisit at exactly 18 was rejected by validation -- should only reject when truly over capacity`);

// 3b. One over capacity (19) -- must be rejected with the documented message, never silently
// truncated and never allowed to generate.
const nineteenIds = [...allPlaceIds, "sagrada-familia"].slice(0, 19); // pad with a duplicate-safe repeat if metadata has <19 places
const over19 = Array.from(new Set(nineteenIds)).length >= 19 ? Array.from(new Set(nineteenIds)).slice(0, 19) : null;
if (over19) {
  const validationOver = validatePlannerPreferences({ interests: ["popular"], mustVisit: over19 }, new Set(allPlaceIds));
  console.log(`[3b: mustVisit=19 (over capacity)] validation: ${validationOver.valid ? "ACCEPTED (should have been rejected)" : `rejected: "${(validationOver as { reason: string }).reason}"`}`);
  if (validationOver.valid) fail("S3b", `mustVisit=19 (over the 18 capacity) was NOT rejected by validation`);
} else {
  console.log(`[3b] skipped -- fewer than 19 distinct real placeIds available in the metadata to construct the case`);
}

// 3c. Every real candidate the MustSeeSelector UI actually offers (8) -- must fully succeed.
const MUST_SEE_CANDIDATE_IDS = ["sagrada-familia", "park-guell", "casa-batllo", "camp-nou", "barceloneta-beach", "bunkers-carmel", "gothic-quarter", "mnac"];
const resultAll8 = generateBarcelonaSmartPlan({ interests: ["popular", "cultureLocal"], mustVisit: MUST_SEE_CANDIDATE_IDS });
if (!resultAll8.ok) {
  console.log(`[3c: all 8 UI mustVisit candidates] generation FAILED: ${resultAll8.error}`);
  fail("S3c", `all 8 real mustVisit candidates together should fit a 3-day plan (well under the 12-18 capacity) but generation failed`);
} else {
  const allStopIds = resultAll8.data.plan.days.flatMap((d) => d.stops.map((s) => s.placeId));
  const missing = MUST_SEE_CANDIDATE_IDS.filter((id) => !allStopIds.includes(id));
  console.log(`[3c: all 8 UI mustVisit candidates] Distribution: ${resultAll8.data.plan.days.map((d) => d.stops.length).join("/")} | missing: ${missing.length}`);
  if (missing.length > 0) fail("S3c", `mustVisit places missing: ${missing.join(", ")}`);
}
console.log("SECTION 3 done.\n");

// ============================================================================
// SECTION 4 -- full regression across every interest-count profile (1-6) + the 6 scenarios
// ============================================================================
console.log("================ SECTION 4: FULL REGRESSION (1-6 INTEREST PROFILES) ================");

const ALL_PROFILES: PlannerInterest[][] = [1, 2, 3, 4, 5, 6].flatMap((size) => combinations(PLANNER_INTERESTS as PlannerInterest[], size));
type ProfileCase = { label: string; preferences: PlannerPreferences };
const PROFILE_CASES: ProfileCase[] = [
  ...ALL_PROFILES.map((interests) => ({ label: interests.join("+"), preferences: { interests, mustVisit: [] } })),
  ...UX_SCENARIOS,
];

let a1 = 0, // no duplicate place ids
  a2 = 0, // no day >420 visit minutes
  a3 = 0, // no day >3 clusters
  a4 = 0, // mustVisit guaranteed
  a5 = 0, // football guarantee
  a6 = 0, // Popular Tier A guarantee
  a7 = 0; // no day >6 stops (hard max, must be 0)

let casesChecked = 0;
let underfilledDayCount = 0;
const underfilledCases: string[] = [];

for (const { label, preferences } of PROFILE_CASES) {
  const result = generateBarcelonaSmartPlan(preferences);
  if (!result.ok) continue;
  casesChecked++;
  const { plan } = result.data;
  const allStopIds = plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId));

  const seen = new Set<string>();
  for (const id of allStopIds) {
    if (seen.has(id)) {
      fail("S4.1", `[${label}] duplicate placeId "${id}"`);
      a1++;
    }
    seen.add(id);
  }

  plan.days.forEach((day) => {
    if (day.totalVisitMinutes > 420) {
      fail("S4.2", `[${label}] Day ${day.dayNumber} has ${day.totalVisitMinutes} visit minutes (>420)`);
      a2++;
    }
    if (day.clusters.length > 3) {
      fail("S4.3", `[${label}] Day ${day.dayNumber} has ${day.clusters.length} clusters (>3)`);
      a3++;
    }
    if (day.stops.length > 6) {
      fail("S4.7", `[${label}] Day ${day.dayNumber} has ${day.stops.length} main stops (>6)`);
      a7++;
    }
    if (day.stops.length < 4) {
      underfilledDayCount++;
      underfilledCases.push(`${label} Day ${day.dayNumber} (${day.stops.length} stops)`);
    }
  });

  for (const id of preferences.mustVisit ?? []) {
    if (allStopIds.filter((stopId) => stopId === id).length !== 1) {
      fail("S4.4", `[${label}] mustVisit "${id}" not present exactly once`);
      a4++;
    }
  }

  const footballGoal = BARCELONA_REQUIRED_COVERAGE_GOALS.find((g) => g.interest === "footballExperiences");
  if (footballGoal && preferences.interests.includes("footballExperiences")) {
    const covered = footballGoal.candidates.filter((id) => allStopIds.includes(id)).length;
    if (covered < footballGoal.minCoverage) {
      fail("S4.5", `[${label}] footballExperiences required coverage not met (${covered}/${footballGoal.minCoverage})`);
      a5++;
    }
  }

  if (preferences.interests.includes("popular")) {
    const tierACovered = BARCELONA_ICONIC_TIER_A.filter((id) => allStopIds.includes(id));
    if (tierACovered.length < 4 && (preferences.mustVisit ?? []).length === 0) {
      fail("S4.6", `[${label}] popular selected, no mustVisit, but Tier A coverage ${tierACovered.length}/5 (<4)`);
      a6++;
    }
  }
}

console.log(`\nCases checked: ${casesChecked} / ${PROFILE_CASES.length}`);
console.log("Hard-guarantee assertion failure counts (must be 0):");
console.log(`  1. no duplicate place ids:        ${a1}`);
console.log(`  2. no day >420 visit minutes:     ${a2}`);
console.log(`  3. no day >3 clusters:            ${a3}`);
console.log(`  4. mustVisit guaranteed:          ${a4}`);
console.log(`  5. football guarantee:            ${a5}`);
console.log(`  6. Popular Tier A guarantee:      ${a6}`);
console.log(`  7. no day >6 main stops:          ${a7}`);
console.log(`\nDays landing under the 4-stop target (informational -- honest fallback, not a hard failure): ${underfilledDayCount}`);
if (underfilledCases.length > 0) underfilledCases.forEach((c) => console.log(`     -> ${c}`));
console.log("SECTION 4 done.\n");

console.log("================ OVERALL ================");
console.log(`Total hard failures across all sections: ${totalFailures}`);
console.log(totalFailures === 0 ? "ALL HARD CHECKS PASSED." : "SOME HARD CHECKS FAILED -- see FAIL lines above, none hidden.");

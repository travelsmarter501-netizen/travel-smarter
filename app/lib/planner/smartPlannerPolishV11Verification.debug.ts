/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * Smart Planner Polish V1.1 verification. Run with:
 *
 *   npx tsx app/lib/planner/smartPlannerPolishV11Verification.debug.ts
 *
 * 1. The 6 UX-audit customer scenarios: reports each day's stop count, title, summary.
 * 2. Full 41-profile audit against the 12 assertions listed in the polish task spec.
 * 3. Every newly-introduced unresolved transport pair, collected across all cases run.
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { presentBarcelonaSmartPlan } from "./barcelona-planner-presentation";
import { BARCELONA_ICONIC_TIER_A, BARCELONA_REQUIRED_COVERAGE_GOALS } from "./barcelona-planner-day-builder";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest, PlannerPreferences } from "./plannerTypes";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  return [...combinations(rest, size - 1).map((c) => [first, ...c]), ...combinations(rest, size)];
}
const ALL_41_PROFILES: PlannerInterest[][] = [
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 1),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 2),
  ...combinations(PLANNER_INTERESTS as PlannerInterest[], 3),
];

let totalFailures = 0;
function fail(section: string, message: string) {
  console.log(`  [FAIL/${section}] ${message}`);
  totalFailures++;
}

const newUnresolvedPairs = new Map<string, number>();

// ============================================================================
// SECTION 1 -- the 6 UX-audit customer scenarios
// ============================================================================
console.log("================ SECTION 1: 6 UX-AUDIT SCENARIOS ================");

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
  console.log(`\n[${label}]`);
  if (!result.ok) {
    console.log(`  generation FAILED: ${result.error}`);
    fail("S1", `[${label}] unexpected generation failure`);
    continue;
  }
  const presented = presentBarcelonaSmartPlan(result.data.plan, preferences);
  const counts = result.data.plan.days.map((d) => d.stops.length);
  console.log(`  Distribution: ${counts.join("/")}`);
  const hasSevere = counts.some((c) => c <= 1) && counts.some((c) => c >= 5);
  if (hasSevere) fail("S1", `[${label}] STILL has a severe 1-vs-5+ imbalance: ${counts.join("/")}`);

  presented.byDay.forEach((p, i) => {
    console.log(`  Day ${i + 1} (${counts[i]} stops): "${p.title}" | "${p.summary}"${p.highlight ? ` | highlight: "${p.highlight}"` : ""}`);
  });

  const summaries = presented.byDay.map((p) => p.summary);
  const dupSummaries = summaries.filter((s, i) => summaries.indexOf(s) !== i);
  if (dupSummaries.length > 0) console.log(`  [note] duplicate summaries within this plan: ${dupSummaries.join(" | ")}`);
}
console.log("\nSECTION 1 done.\n");

// ============================================================================
// SECTION 2 -- full 41-profile audit against the 12 listed assertions
// ============================================================================
console.log("================ SECTION 2: 41-PROFILE AUDIT ================");

type ProfileCase = { label: string; preferences: PlannerPreferences };
const PROFILE_CASES: ProfileCase[] = [
  ...ALL_41_PROFILES.map((interests) => ({ label: interests.join("+"), preferences: { interests, mustVisit: [] } })),
  ...UX_SCENARIOS,
];

let a1 = 0, // no duplicate place ids
  a2 = 0, // no day >420 visit minutes
  a3 = 0, // no day >3 clusters
  a4 = 0, // mustVisit guaranteed
  a5 = 0, // football guarantee
  a6 = 0, // Popular Tier A guarantee
  a9contradiction = 0; // summary contradicts content ("مليء بالمعالم" on a <=2 stop day, or title/summary beach mismatch)

let severeImbalanceCount = 0;
const severeImbalanceProfiles: string[] = [];
let duplicateSummaryWithinPlanCount = 0;
let sameTypeThreeOrMoreCount = 0;
let casesChecked = 0;

for (const { label, preferences } of PROFILE_CASES) {
  const result = generateBarcelonaSmartPlan(preferences);
  if (!result.ok) continue;
  casesChecked++;
  const { plan, legsByDay } = result.data;
  const allStopIds = plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId));

  // 1. no duplicate place ids
  const seen = new Set<string>();
  for (const id of allStopIds) {
    if (seen.has(id)) {
      fail("S2.1", `[${label}] duplicate placeId "${id}"`);
      a1++;
    }
    seen.add(id);
  }

  // 2. no day > 420 visit minutes
  plan.days.forEach((day) => {
    if (day.totalVisitMinutes > 420) {
      fail("S2.2", `[${label}] Day ${day.dayNumber} has ${day.totalVisitMinutes} visit minutes (>420)`);
      a2++;
    }
  });

  // 3. no day > 3 clusters
  plan.days.forEach((day) => {
    if (day.clusters.length > 3) {
      fail("S2.3", `[${label}] Day ${day.dayNumber} has ${day.clusters.length} clusters (>3)`);
      a3++;
    }
  });

  // 4. mustVisit still guaranteed
  for (const id of preferences.mustVisit ?? []) {
    if (allStopIds.filter((stopId) => stopId === id).length !== 1) {
      fail("S2.4", `[${label}] mustVisit "${id}" not present exactly once`);
      a4++;
    }
  }

  // 5. football guarantee still works
  const footballGoal = BARCELONA_REQUIRED_COVERAGE_GOALS.find((g) => g.interest === "footballExperiences");
  if (footballGoal && preferences.interests.includes("footballExperiences")) {
    const covered = footballGoal.candidates.filter((id) => allStopIds.includes(id)).length;
    if (covered < footballGoal.minCoverage) {
      fail("S2.5", `[${label}] footballExperiences required coverage not met (${covered}/${footballGoal.minCoverage})`);
      a5++;
    }
  }

  // 6. Popular Tier A still satisfies current guarantee (unless directly conflicted by mustVisit, same rule as before)
  if (preferences.interests.includes("popular")) {
    const tierACovered = BARCELONA_ICONIC_TIER_A.filter((id) => allStopIds.includes(id));
    if (tierACovered.length < 4 && (preferences.mustVisit ?? []).length === 0) {
      fail("S2.6", `[${label}] popular selected, no mustVisit, but Tier A coverage ${tierACovered.length}/5 (<4)`);
      a6++;
    }
  }

  // 7. severe 1-vs-5+ day imbalance (informational -- some genuinely-niche profiles may still show it)
  const counts = plan.days.map((d) => d.stops.length);
  if (counts.some((c) => c <= 1) && counts.some((c) => c >= 5)) {
    severeImbalanceCount++;
    severeImbalanceProfiles.push(`${label} [${counts.join("/")}]`);
  }

  // 8/9/10 -- presentation-layer checks
  const presented = presentBarcelonaSmartPlan(plan, preferences);
  const summaries = presented.byDay.map((p) => p.summary);
  const dupSummaries = summaries.filter((s, i) => summaries.indexOf(s) !== i);
  if (dupSummaries.length > 0) duplicateSummaryWithinPlanCount++;

  presented.byDay.forEach((p, i) => {
    const day = plan.days[i];
    const stopCount = day.stops.length;

    // 9. "مليء بالمعالم"-style claim only when stop count actually supports it
    if (p.summary.includes("مليء بالمعالم") && stopCount < 4) {
      fail("S2.9", `[${label}] Day ${i + 1}: summary claims "مليء بالمعالم" but only has ${stopCount} stops`);
      a9contradiction++;
    }
    // title/summary beach consistency
    if (p.title.includes("والبحر") && !(p.summary.includes("البحر") || p.summary.includes("الشاطئ"))) {
      fail("S2.9", `[${label}] Day ${i + 1}: title "${p.title}" mentions the sea but summary doesn't: "${p.summary}"`);
      a9contradiction++;
    }

    // 10. optionalNearby type diversity (informational)
    const typeCounts = new Map<string, number>();
    for (const s of p.optionalNearby) typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
    if ([...typeCounts.values()].some((count) => count >= 3)) sameTypeThreeOrMoreCount++;

    // every optional suggestion must still be a real stop resolvable elsewhere (no main-stop duplication)
    for (const s of p.optionalNearby) {
      if (allStopIds.includes(s.placeId)) {
        fail("S2.opt", `[${label}] Day ${i + 1}: optionalNearby "${s.placeId}" duplicates a main stop`);
      }
    }
  });

  // transport: collect any unresolved leg (expected/new after rebalancing -- reported, not failed)
  for (const legs of legsByDay) {
    for (const leg of legs) {
      if (leg.sourceStatus === "unresolved") {
        const key = `${leg.fromPlaceId}::${leg.toPlaceId}`;
        newUnresolvedPairs.set(key, (newUnresolvedPairs.get(key) ?? 0) + 1);
        if (leg.options.length > 0 || leg.recommendedMode !== null) {
          fail("S2.transport", `[${label}] unresolved leg ${key} carries fabricated data`);
        }
      }
    }
  }
}

console.log(`\nCases checked: ${casesChecked} / ${PROFILE_CASES.length}`);
console.log("\nHard-guarantee assertion failure counts (1-6, must be 0):");
console.log(`  1. no duplicate place ids:        ${a1}`);
console.log(`  2. no day >420 visit minutes:     ${a2}`);
console.log(`  3. no day >3 clusters:            ${a3}`);
console.log(`  4. mustVisit guaranteed:          ${a4}`);
console.log(`  5. football guarantee:            ${a5}`);
console.log(`  6. Popular Tier A guarantee:      ${a6}`);
console.log("\nDensity/presentation metrics (7-10, informational + hard where noted):");
console.log(`  7. profiles still severely imbalanced (1-vs-5+): ${severeImbalanceCount} / ${casesChecked}`);
if (severeImbalanceProfiles.length > 0) console.log(`     -> ${severeImbalanceProfiles.join(", ")}`);
console.log(`  8. plans with a duplicate summary within them:    ${duplicateSummaryWithinPlanCount} / ${casesChecked}`);
console.log(`  9. summary/title contradiction failures (hard, must be 0): ${a9contradiction}`);
console.log(`  10. day-presentations with 3+ same-type optional suggestions: ${sameTypeThreeOrMoreCount}`);
console.log("SECTION 2 done.\n");

// ============================================================================
// SECTION 3 -- new unresolved transport pairs (report only, never verify/invent here)
// ============================================================================
console.log("================ SECTION 3: UNRESOLVED TRANSPORT PAIRS ================");
console.log(`Unique unresolved pairs across baseline (mustVisit=[]) + 6 UX scenarios: ${newUnresolvedPairs.size}`);
[...newUnresolvedPairs.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => console.log(`  ${key.replace("::", " -> ")}  occurrenceCount=${count}`));
console.log("SECTION 3 done.\n");

console.log("================ OVERALL ================");
console.log(`Total hard failures across all sections: ${totalFailures}`);
console.log(totalFailures === 0 ? "ALL HARD CHECKS PASSED." : "SOME HARD CHECKS FAILED -- see FAIL lines above, none hidden.");

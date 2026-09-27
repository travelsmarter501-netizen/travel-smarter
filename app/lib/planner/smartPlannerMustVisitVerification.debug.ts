/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * Barcelona Smart Planner -- Must Visit V1.3 verification. Four sections, run with:
 *
 *   npx tsx app/lib/planner/smartPlannerMustVisitVerification.debug.ts
 *
 * 1. 41-profile regression: mustVisit=[] through the real pipeline, compared against the
 *    known-good V1.2 baseline (transport coverage counts) to confirm byte-for-byte identical
 *    behavior when mustVisit is absent.
 * 2. Test matrix A-F (from the mustVisit task spec).
 * 3. mustVisit-specific transport audit: each of the 8 curated candidates solo, plus
 *    representative pairs/triples -- reports any newly-introduced unresolved transport pair
 *    (never fills/estimates/verifies one -- discovery only).
 * 4. 9 hard assertions across the 41-profile baseline plus every mustVisit test case above.
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { getBarcelonaPlannerMetadata } from "./barcelona-planner-metadata";
import { BARCELONA_ICONIC_TIER_A, BARCELONA_REQUIRED_COVERAGE_GOALS } from "./barcelona-planner-day-builder";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest } from "./plannerTypes";
import type { RouteLegSourceStatus } from "./plannerTransportTypes";
import type { GenerateSmartPlanResult } from "./generateBarcelonaSmartPlan";

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

const MUST_SEE_CANDIDATES = [
  "sagrada-familia",
  "park-guell",
  "casa-batllo",
  "camp-nou",
  "barceloneta-beach",
  "bunkers-carmel",
  "gothic-quarter",
  "mnac",
];

let totalFailures = 0;
function fail(section: string, message: string) {
  console.log(`  [FAIL/${section}] ${message}`);
  totalFailures++;
}

// ============================================================================
// SECTION 1 -- 41-profile regression (mustVisit=[]) vs. the known V1.2 baseline
// ============================================================================
console.log("================ SECTION 1: 41-PROFILE REGRESSION (mustVisit=[]) ================");

// Updated for the "Barcelona Guide Gap Fill" task: 4 new Guide places (monestir-pedralbes,
// jardins-palau-pedralbes, santa-maria-del-mar, museu-historia-catalunya) + their planner
// metadata changed which stops/legs appear, and all 38 newly-introduced unresolved pairs were
// verified and closed in this same task -- unresolved is back to 0.
const KNOWN_BASELINE = {
  totalLegInstances: 465,
  verified: 351,
  existingProjectData: 114,
  unresolved: 0,
  uniquePairs: 80,
  uniqueUnresolvedPairs: 0,
};

let s1TotalLegInstances = 0;
const s1StatusCounts: Record<RouteLegSourceStatus, number> = { verified: 0, "existing-project-data": 0, unresolved: 0 };
const s1UniquePairs = new Set<string>();
const s1UnresolvedPairs = new Set<string>();
let s1ValidationFailures = 0;

for (const interests of ALL_PROFILES) {
  const result = generateBarcelonaSmartPlan({ interests, mustVisit: [] });
  if (!result.ok) {
    fail("S1", `[${interests.join("+")}] unexpected validation failure with mustVisit=[]: ${result.error}`);
    s1ValidationFailures++;
    continue;
  }
  for (const legs of result.data.legsByDay) {
    for (const leg of legs) {
      s1TotalLegInstances++;
      s1StatusCounts[leg.sourceStatus]++;
      const key = `${leg.fromPlaceId}::${leg.toPlaceId}`;
      s1UniquePairs.add(key);
      if (leg.sourceStatus === "unresolved") s1UnresolvedPairs.add(key);
    }
  }
}

console.log(`Profiles checked: ${ALL_PROFILES.length}, validation failures: ${s1ValidationFailures} (expect 0)`);
console.log(`Total leg instances: ${s1TotalLegInstances} (baseline: ${KNOWN_BASELINE.totalLegInstances})`);
console.log(`Verified: ${s1StatusCounts.verified} (baseline: ${KNOWN_BASELINE.verified})`);
console.log(`Existing-project-data: ${s1StatusCounts["existing-project-data"]} (baseline: ${KNOWN_BASELINE.existingProjectData})`);
console.log(`Unresolved: ${s1StatusCounts.unresolved} (baseline: ${KNOWN_BASELINE.unresolved})`);
console.log(`Unique pairs: ${s1UniquePairs.size} (baseline: ${KNOWN_BASELINE.uniquePairs})`);
console.log(`Unique unresolved pairs: ${s1UnresolvedPairs.size} (baseline: ${KNOWN_BASELINE.uniqueUnresolvedPairs})`);
if (s1UnresolvedPairs.size > 0) [...s1UnresolvedPairs].forEach((key) => console.log(`  ${key.replace("::", " -> ")}`));

if (s1ValidationFailures !== 0) fail("S1", "mustVisit=[] must never cause a validation failure.");
if (s1TotalLegInstances !== KNOWN_BASELINE.totalLegInstances) fail("S1", "total leg instances regressed vs. baseline.");
if (s1StatusCounts.verified !== KNOWN_BASELINE.verified) fail("S1", "verified leg count regressed vs. baseline.");
if (s1StatusCounts["existing-project-data"] !== KNOWN_BASELINE.existingProjectData) fail("S1", "existing-project-data leg count regressed vs. baseline.");
if (s1StatusCounts.unresolved !== KNOWN_BASELINE.unresolved) fail("S1", "unresolved leg count regressed vs. baseline.");
if (s1UniquePairs.size !== KNOWN_BASELINE.uniquePairs) fail("S1", "unique pair count regressed vs. baseline.");
if (s1UnresolvedPairs.size !== KNOWN_BASELINE.uniqueUnresolvedPairs) fail("S1", "unique unresolved pair count regressed vs. baseline.");

console.log(s1ValidationFailures === 0 && s1TotalLegInstances === KNOWN_BASELINE.totalLegInstances ? "SECTION 1: baseline match, no regression.\n" : "SECTION 1: REGRESSION DETECTED -- see FAIL lines above.\n");

// ============================================================================
// SECTION 2 -- Test matrix A-F
// ============================================================================
console.log("================ SECTION 2: TEST MATRIX A-F ================");

function stopIdsOf(result: GenerateSmartPlanResult): string[] {
  if (!result.ok) return [];
  return result.data.plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId));
}

function maxVisitMinutesOf(result: GenerateSmartPlanResult): number {
  if (!result.ok) return -1;
  return Math.max(...result.data.plan.days.map((day) => day.totalVisitMinutes));
}

function maxClustersOf(result: GenerateSmartPlanResult): number {
  if (!result.ok) return -1;
  return Math.max(...result.data.plan.days.map((day) => day.clusters.length));
}

// -- A: Camp Nou via mustVisit alone (footballExperiences NOT selected) ----------------
{
  const label = "A: camp-nou via mustVisit alone";
  const result = generateBarcelonaSmartPlan({ interests: ["popular"], mustVisit: ["camp-nou"] });
  const ids = stopIdsOf(result);
  console.log(`[${label}] ok=${result.ok} stops=${ids.length}`);
  if (!result.ok) fail("2A", `generation failed: ${result.error}`);
  else if (!ids.includes("camp-nou")) fail("2A", "camp-nou missing despite mustVisit.");
}

// -- B: Sagrada via mustVisit under viewsNature -----------------------------------------
{
  const label = "B: sagrada-familia via mustVisit under viewsNature";
  const result = generateBarcelonaSmartPlan({ interests: ["viewsNature"], mustVisit: ["sagrada-familia"] });
  const ids = stopIdsOf(result);
  console.log(`[${label}] ok=${result.ok} stops=${ids.length}`);
  if (!result.ok) fail("2B", `generation failed: ${result.error}`);
  else if (!ids.includes("sagrada-familia")) fail("2B", "sagrada-familia missing despite mustVisit.");
}

// -- C: Camp Nou via required-interest AND Barceloneta via mustVisit coexisting --------
{
  const label = "C: camp-nou (interest) + barceloneta-beach (mustVisit) coexisting";
  const result = generateBarcelonaSmartPlan({ interests: ["footballExperiences"], mustVisit: ["barceloneta-beach"] });
  const ids = stopIdsOf(result);
  console.log(`[${label}] ok=${result.ok} stops=${ids.length}`);
  if (!result.ok) fail("2C", `generation failed: ${result.error}`);
  else {
    if (!ids.includes("camp-nou")) fail("2C", "camp-nou missing (required-interest protection broke).");
    if (!ids.includes("barceloneta-beach")) fail("2C", "barceloneta-beach missing despite mustVisit.");
  }
}

// -- D: all 3 Gaudi mustVisit picks survive the similarity cap (incl. casa-mila) -------
{
  const label = "D: 3 Gaudi mustVisit picks (casa-mila, sagrada-familia, park-guell) survive similarity cap";
  const result = generateBarcelonaSmartPlan({ interests: ["popular"], mustVisit: ["casa-mila", "sagrada-familia", "park-guell"] });
  const ids = stopIdsOf(result);
  console.log(`[${label}] ok=${result.ok} stops=${ids.length} casa-batllo present=${ids.includes("casa-batllo")}`);
  if (!result.ok) fail("2D", `generation failed: ${result.error}`);
  else {
    for (const id of ["casa-mila", "sagrada-familia", "park-guell"]) {
      if (!ids.includes(id)) fail("2D", `${id} missing despite mustVisit (Gaudi similarity cap should never win over mustVisit).`);
    }
  }
}

// -- E: camp-nou + mnac mustVisit under beachRelax while a beach remains preferred -----
{
  const label = "E: camp-nou + mnac mustVisit under beachRelax";
  const result = generateBarcelonaSmartPlan({ interests: ["beachRelax"], mustVisit: ["camp-nou", "mnac"] });
  const ids = stopIdsOf(result);
  const beachPresent = ["barceloneta-beach", "bogatell", "nova-icaria"].some((id) => ids.includes(id));
  console.log(`[${label}] ok=${result.ok} stops=${ids.length} beachPresent=${beachPresent}`);
  if (!result.ok) fail("2E", `generation failed: ${result.error}`);
  else {
    if (!ids.includes("camp-nou")) fail("2E", "camp-nou missing despite mustVisit.");
    if (!ids.includes("mnac")) fail("2E", "mnac missing despite mustVisit.");
    if (!beachPresent) console.log(`  [note/2E] no beach present -- beachRelax coverage is boost-only (no repair guarantee), not a hard failure.`);
  }
}

// -- F: 3-interest + 3-mustVisit combined -- Tier A still attempts >=4, density valid --
{
  const label = "F: 3 interests + 3 mustVisit combined, Tier A + density check";
  const interests: PlannerInterest[] = ["popular", "cultureLocal", "viewsNature"];
  const mustVisit = ["camp-nou", "mnac", "bunkers-carmel"];
  const result = generateBarcelonaSmartPlan({ interests, mustVisit });
  const ids = stopIdsOf(result);
  const tierACovered = BARCELONA_ICONIC_TIER_A.filter((id) => ids.includes(id));
  const maxMinutes = maxVisitMinutesOf(result);
  const maxClusters = maxClustersOf(result);
  console.log(`[${label}] ok=${result.ok} stops=${ids.length} tierA=${tierACovered.length}/5 maxMinutes=${maxMinutes} maxClusters=${maxClusters}`);
  if (!result.ok) fail("2F", `generation failed: ${result.error}`);
  else {
    for (const id of mustVisit) {
      if (!ids.includes(id)) fail("2F", `${id} missing despite mustVisit.`);
    }
    if (tierACovered.length < 4) {
      console.log(`  [note/2F] Tier A coverage ${tierACovered.length}/5 (<4) -- acceptable ONLY if directly conflicted by mustVisit occupying the slots; verify manually.`);
    }
    if (maxMinutes > 420) fail("2F", `a day exceeds 420 minutes (${maxMinutes}).`);
    if (maxClusters > 3) fail("2F", `a day exceeds 3 clusters (${maxClusters}).`);
  }
}

console.log("SECTION 2 done.\n");

// ============================================================================
// SECTION 3 -- mustVisit-specific transport audit (discovery only, never verifies)
// ============================================================================
console.log("================ SECTION 3: MUST-VISIT TRANSPORT AUDIT ================");

const MUST_VISIT_AUDIT_CASES: { label: string; mustVisit: string[] }[] = [
  ...MUST_SEE_CANDIDATES.map((id) => ({ label: `solo:${id}`, mustVisit: [id] })),
  { label: "pair:sagrada-familia+camp-nou", mustVisit: ["sagrada-familia", "camp-nou"] },
  { label: "pair:park-guell+barceloneta-beach", mustVisit: ["park-guell", "barceloneta-beach"] },
  { label: "pair:casa-batllo+mnac", mustVisit: ["casa-batllo", "mnac"] },
  { label: "pair:bunkers-carmel+gothic-quarter", mustVisit: ["bunkers-carmel", "gothic-quarter"] },
  { label: "triple:sagrada-familia+park-guell+casa-batllo", mustVisit: ["sagrada-familia", "park-guell", "casa-batllo"] },
  { label: "triple:camp-nou+mnac+barceloneta-beach", mustVisit: ["camp-nou", "mnac", "barceloneta-beach"] },
  { label: "triple:gothic-quarter+bunkers-carmel+camp-nou", mustVisit: ["gothic-quarter", "bunkers-carmel", "camp-nou"] },
];

const s3NewUnresolvedPairs = new Map<string, number>();
let s3UnsatisfiedCount = 0;

for (const testCase of MUST_VISIT_AUDIT_CASES) {
  const result = generateBarcelonaSmartPlan({ interests: ["popular"], mustVisit: testCase.mustVisit });
  if (!result.ok) {
    console.log(`  [${testCase.label}] generation FAILED: ${result.error}`);
    s3UnsatisfiedCount++;
    continue;
  }
  const ids = stopIdsOf(result);
  const missing = testCase.mustVisit.filter((id) => !ids.includes(id));
  if (missing.length > 0) fail("S3", `[${testCase.label}] mustVisit place(s) missing from a supposedly-ok plan: ${missing.join(", ")}`);

  for (const legs of result.data.legsByDay) {
    for (const leg of legs) {
      if (leg.sourceStatus === "unresolved") {
        const key = `${leg.fromPlaceId}::${leg.toPlaceId}`;
        s3NewUnresolvedPairs.set(key, (s3NewUnresolvedPairs.get(key) ?? 0) + 1);
        if (leg.options.length > 0 || leg.recommendedMode !== null) {
          fail("S3", `[${testCase.label}] unresolved leg ${key} carries fabricated options/recommendedMode.`);
        }
      }
    }
  }
}

console.log(`Cases run: ${MUST_VISIT_AUDIT_CASES.length}, unsatisfiable (typed error): ${s3UnsatisfiedCount}`);
console.log(`Newly-introduced unresolved transport pairs across all mustVisit cases: ${s3NewUnresolvedPairs.size}`);
[...s3NewUnresolvedPairs.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([key, count]) => console.log(`  ${key.replace("::", " -> ")}  occurrenceCount=${count}  (reported only -- NOT verified, NOT filled in)`));
console.log("SECTION 3 done.\n");

// ============================================================================
// SECTION 4 -- 9 hard assertions, across the 41-profile baseline + every mustVisit case
// ============================================================================
console.log("================ SECTION 4: 9 HARD ASSERTIONS ================");

type AssertionCase = { label: string; interests: PlannerInterest[]; mustVisit: string[] };

const ASSERTION_CASES: AssertionCase[] = [
  ...ALL_PROFILES.map((interests) => ({ label: `baseline:${interests.join("+")}`, interests, mustVisit: [] })),
  { label: "A", interests: ["popular"], mustVisit: ["camp-nou"] },
  { label: "B", interests: ["viewsNature"], mustVisit: ["sagrada-familia"] },
  { label: "C", interests: ["footballExperiences"], mustVisit: ["barceloneta-beach"] },
  { label: "D", interests: ["popular"], mustVisit: ["casa-mila", "sagrada-familia", "park-guell"] },
  { label: "E", interests: ["beachRelax"], mustVisit: ["camp-nou", "mnac"] },
  { label: "F", interests: ["popular", "cultureLocal", "viewsNature"], mustVisit: ["camp-nou", "mnac", "bunkers-carmel"] },
  ...MUST_VISIT_AUDIT_CASES.map((testCase) => ({ label: testCase.label, interests: ["popular"] as PlannerInterest[], mustVisit: testCase.mustVisit })),
];

let a1 = 0,
  a2 = 0,
  a3 = 0,
  a4 = 0,
  a5 = 0,
  a6 = 0,
  a7 = 0,
  a8 = 0;

for (const testCase of ASSERTION_CASES) {
  const result = generateBarcelonaSmartPlan({ interests: testCase.interests, mustVisit: testCase.mustVisit });
  if (!result.ok) {
    // A typed error is a valid outcome only if mustVisit is non-empty (unsatisfiable request).
    // A baseline (mustVisit=[]) profile must never fail -- already covered by Section 1.
    continue;
  }
  const { plan, legsByDay } = result.data;
  const allStopIds = plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId));

  // 1. mustVisit-exactly-once.
  for (const id of testCase.mustVisit) {
    const count = allStopIds.filter((stopId) => stopId === id).length;
    if (count !== 1) {
      fail("S4.1", `[${testCase.label}] mustVisit place "${id}" appears ${count} time(s), expected exactly 1.`);
      a1++;
    }
  }

  // 2. no duplicate stops (any place, not just mustVisit).
  const seen = new Set<string>();
  for (const id of allStopIds) {
    if (seen.has(id)) {
      fail("S4.2", `[${testCase.label}] duplicate placeId "${id}" in the same plan.`);
      a2++;
    }
    seen.add(id);
  }

  // 3. no day > 420 visit minutes.
  plan.days.forEach((day) => {
    if (day.totalVisitMinutes > 420) {
      fail("S4.3", `[${testCase.label}] Day ${day.dayNumber} has ${day.totalVisitMinutes} visit minutes (>420).`);
      a3++;
    }
  });

  // 4. no day > 3 clusters.
  plan.days.forEach((day) => {
    if (day.clusters.length > 3) {
      fail("S4.4", `[${testCase.label}] Day ${day.dayNumber} has ${day.clusters.length} clusters (>3).`);
      a4++;
    }
  });

  // 5. football-required-protection still works.
  const footballRequired = BARCELONA_REQUIRED_COVERAGE_GOALS.find((goal) => goal.interest === "footballExperiences");
  if (footballRequired && testCase.interests.includes("footballExperiences")) {
    const covered = footballRequired.candidates.filter((id) => allStopIds.includes(id));
    if (covered.length < footballRequired.minCoverage) {
      fail("S4.5", `[${testCase.label}] footballExperiences selected but required coverage not met (${covered.length}/${footballRequired.minCoverage}).`);
      a5++;
    }
  }

  // 6. Tier-A guarantee still works, unless directly conflicted by mustVisit occupying slots.
  if (testCase.interests.includes("popular")) {
    const tierACovered = BARCELONA_ICONIC_TIER_A.filter((id) => allStopIds.includes(id));
    if (tierACovered.length < 4) {
      if (testCase.mustVisit.length === 0) {
        fail("S4.6", `[${testCase.label}] popular selected, no mustVisit, but Tier A coverage ${tierACovered.length}/5 (<4).`);
        a6++;
      } else {
        console.log(`  [note/S4.6] [${testCase.label}] Tier A coverage ${tierACovered.length}/5 (<4) with mustVisit=[${testCase.mustVisit.join(",")}] active -- logged, not a hard failure.`);
      }
    }
  }

  // 7. all stops exist in planner metadata.
  for (const id of allStopIds) {
    if (!getBarcelonaPlannerMetadata(id)) {
      fail("S4.7", `[${testCase.label}] stop "${id}" has no planner metadata entry.`);
      a7++;
    }
  }

  // 8. unknown/unresolved transport pairs stay unresolved with empty options and no recommendedMode.
  for (const legs of legsByDay) {
    for (const leg of legs) {
      if (leg.sourceStatus === "unresolved" && (leg.options.length > 0 || leg.recommendedMode !== null)) {
        fail("S4.8", `[${testCase.label}] unresolved leg ${leg.fromPlaceId}->${leg.toPlaceId} carries fabricated data.`);
        a8++;
      }
    }
  }
}

// 9. 41-profile no-mustVisit baseline non-regression (Section 1's own result).
const a9 = s1ValidationFailures === 0 && s1TotalLegInstances === KNOWN_BASELINE.totalLegInstances && s1UnresolvedPairs.size === KNOWN_BASELINE.uniqueUnresolvedPairs ? 0 : 1;
if (a9 !== 0) fail("S4.9", "41-profile no-mustVisit baseline regressed -- see Section 1 output above.");

console.log("\nAssertion failure counts:");
console.log(`  1. mustVisit-exactly-once:              ${a1}`);
console.log(`  2. no duplicate stops:                  ${a2}`);
console.log(`  3. no day > 420 min:                    ${a3}`);
console.log(`  4. no day > 3 clusters:                 ${a4}`);
console.log(`  5. football-required-protection:        ${a5}`);
console.log(`  6. Tier-A guarantee (unless conflicted): ${a6}`);
console.log(`  7. all stops exist in metadata:          ${a7}`);
console.log(`  8. unresolved pairs stay empty/null:     ${a8}`);
console.log(`  9. 41-profile baseline non-regression:   ${a9}`);
console.log("SECTION 4 done.\n");

console.log("================ OVERALL ================");
console.log(`Total failures across all sections: ${totalFailures}`);
console.log(totalFailures === 0 ? "ALL CHECKS PASSED." : "SOME CHECKS FAILED -- see FAIL lines above, none hidden.");

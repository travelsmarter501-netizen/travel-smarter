/**
 * Dev-only debug script — NOT part of the app.
 *
 * P1 Personalization Fix (Shopping/Nightlife) -- permanent regression audit. Detects the
 * regression this task fixed: Shopping-only / Food-only / Experiences-only collapsing back into
 * effectively identical main itineraries. Runs the REAL pipeline (Day Builder -> optimizer,
 * `travelPlannerEngine.ts`/`plannerDayBuilder.ts`/`barcelonaV2DestinationConfig.ts` -- none
 * `server-only`) twice per case: once with `placeSelectionBonus` OMITTED (BEFORE -- the exact
 * pre-fix behavior) and once with it applied via `buildBarcelonaV2PlaceSelectionBonus` (AFTER),
 * so this one script proves the fix against its own honest baseline rather than an assumption.
 *
 * Uses reasonable semantic checks (main-stop overlap %, intent-specific stop counts), never a
 * hard "0 overlap" requirement -- see this task's own explicit "no fake differentiation" rule.
 *
 * Run with:
 *   npx tsx app/lib/planner/personalizationDifferentiationAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { mapV2InterestsToLegacy, SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { getBarcelonaFlagshipCoverageGoals } from "./barcelonaMustSeePolicy";
import { buildBarcelonaV2PlaceSelectionBonus } from "./barcelonaV2PersonalizationScoring";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { DestinationConfig } from "./destinationConfig";

const EXPERIENCES_GATED_PLACE_IDS = new Set(["teleferic-montjuic"]);
const SHOPPING_INTENT_IDS = new Set(["passeig-de-gracia", "portal-angel"]);
const EXPERIENCE_INTENT_IDS = new Set(["tablao-cordobes-flamenco", "gaudi-bike-tour", "sunset-catamaran-sail", "gothic-quarter-tapas-wine-tour", "teleferic-montjuic", "camp-nou", "mnac", "tibidabo"]);

type Profile = { label: string; v2Interests: V2PlannerInterest[]; surpriseMe?: boolean };
const PROFILES: Profile[] = [
  { label: "Shopping only", v2Interests: ["shopping"] },
  { label: "Food only", v2Interests: ["food"] },
  { label: "Experiences only", v2Interests: ["footballExperiences", "nightlife"] },
  { label: "Popular only", v2Interests: ["popular"] },
  { label: "Food + Shopping", v2Interests: ["food", "shopping"] },
  { label: "Popular + Shopping", v2Interests: ["popular", "shopping"] },
  { label: "Popular + Experiences", v2Interests: ["popular", "footballExperiences", "nightlife"] },
  { label: "All interests", v2Interests: ["popular", "cultureHistory", "natureViews", "beachRelax", "footballExperiences", "food", "shopping", "nightlife"] },
  { label: "Surprise Me", v2Interests: [], surpriseMe: true },
];

function runOne(profile: Profile, days: number, useBonus: boolean): Set<string> | null {
  const experiencesSelected = profile.v2Interests.includes("footballExperiences") || profile.v2Interests.includes("nightlife");
  const isPlaceEligibleForDay = (placeId: string): boolean => !EXPERIENCES_GATED_PLACE_IDS.has(placeId) || experiencesSelected;
  const flagshipCoverageGoals = getBarcelonaFlagshipCoverageGoals({ surpriseMe: !!profile.surpriseMe, days });
  const placeSelectionBonus = useBonus ? buildBarcelonaV2PlaceSelectionBonus(profile.v2Interests) : undefined;
  const config: DestinationConfig = {
    ...BARCELONA_V2_DESTINATION_CONFIG,
    dayBuilderConfig: { ...BARCELONA_V2_DESTINATION_CONFIG.dayBuilderConfig, isPlaceEligibleForDay, flagshipCoverageGoals, placeSelectionBonus },
  };
  const legacyInterests = profile.surpriseMe ? SURPRISE_ME_LEGACY_INTERESTS : mapV2InterestsToLegacy(profile.v2Interests);
  const result = generateTravelPlan(config, { interests: legacyInterests }, days as 1 | 3 | 5 | 7);
  if (!result.ok) return null;
  return new Set(result.data.plan.days.flatMap((d) => d.stops.map((s) => s.placeId)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter((id) => b.has(id)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

function intentCount(ids: ReadonlySet<string>, intentSet: ReadonlySet<string>): number {
  return [...ids].filter((id) => intentSet.has(id)).length;
}

const DAY_COUNTS = [1, 3, 5, 7];

console.log("================ PART 1: BEFORE vs AFTER -- main-stop set per profile ================\n");
const before: Record<string, Record<number, Set<string>>> = {};
const after: Record<string, Record<number, Set<string>>> = {};
for (const profile of PROFILES) {
  before[profile.label] = {};
  after[profile.label] = {};
  for (const days of DAY_COUNTS) {
    const b = runOne(profile, days, false);
    const a = runOne(profile, days, true);
    if (b) before[profile.label][days] = b;
    if (a) after[profile.label][days] = a;
  }
}

console.log("================ PART 2: Shopping vs Food overlap (BEFORE vs AFTER) ================\n");
for (const days of DAY_COUNTS) {
  const shopB = before["Shopping only"][days], foodB = before["Food only"][days];
  const shopA = after["Shopping only"][days], foodA = after["Food only"][days];
  if (!shopB || !foodB || !shopA || !foodA) continue;
  console.log(`${days}d: BEFORE Shopping-vs-Food overlap=${(jaccard(shopB, foodB) * 100).toFixed(0)}%  |  AFTER overlap=${(jaccard(shopA, foodA) * 100).toFixed(0)}%`);
  console.log(`     BEFORE Shopping intent-stops=${intentCount(shopB, SHOPPING_INTENT_IDS)}  ->  AFTER intent-stops=${intentCount(shopA, SHOPPING_INTENT_IDS)}  [${[...shopA].filter((id) => SHOPPING_INTENT_IDS.has(id)).join(", ")}]`);
}

console.log("\n================ PART 3: Shopping vs Popular overlap (BEFORE vs AFTER) ================\n");
for (const days of DAY_COUNTS) {
  const shopB = before["Shopping only"][days], popB = before["Popular only"][days];
  const shopA = after["Shopping only"][days], popA = after["Popular only"][days];
  if (!shopB || !popB || !shopA || !popA) continue;
  console.log(`${days}d: BEFORE overlap=${(jaccard(shopB, popB) * 100).toFixed(0)}%  |  AFTER overlap=${(jaccard(shopA, popA) * 100).toFixed(0)}%  |  exactEqual(AFTER)=${shopA.size === popA.size && [...shopA].every((id) => popA.has(id))}`);
}

console.log("\n================ PART 4: Experiences vs Popular overlap + intent-stop counts (BEFORE vs AFTER) ================\n");
for (const days of DAY_COUNTS) {
  const expB = before["Experiences only"][days], popB = before["Popular only"][days];
  const expA = after["Experiences only"][days], popA = after["Popular only"][days];
  if (!expB || !popB || !expA || !popA) continue;
  console.log(`${days}d: BEFORE overlap=${(jaccard(expB, popB) * 100).toFixed(0)}%  |  AFTER overlap=${(jaccard(expA, popA) * 100).toFixed(0)}%`);
  console.log(`     BEFORE Experiences intent-stops=${intentCount(expB, EXPERIENCE_INTENT_IDS)}  ->  AFTER=${intentCount(expA, EXPERIENCE_INTENT_IDS)}  vs Popular AFTER=${intentCount(popA, EXPERIENCE_INTENT_IDS)}  [Experiences AFTER: ${[...expA].filter((id) => EXPERIENCE_INTENT_IDS.has(id)).join(", ")}]`);
}

console.log("\n================ PART 5: Food unchanged? (BEFORE vs AFTER, should be identical) ================\n");
let foodUnchanged = true;
for (const days of DAY_COUNTS) {
  const b = before["Food only"][days], a = after["Food only"][days];
  if (!b || !a) continue;
  const identical = b.size === a.size && [...b].every((id) => a.has(id));
  if (!identical) foodUnchanged = false;
  console.log(`${days}d: Food-only BEFORE===AFTER: ${identical}`);
}
console.log(`Food fully unchanged across all day-counts: ${foodUnchanged}`);

console.log("\n================ PART 6: Popular unchanged? (BEFORE vs AFTER, should be identical) ================\n");
let popularUnchanged = true;
for (const days of DAY_COUNTS) {
  const b = before["Popular only"][days], a = after["Popular only"][days];
  if (!b || !a) continue;
  const identical = b.size === a.size && [...b].every((id) => a.has(id));
  if (!identical) popularUnchanged = false;
  console.log(`${days}d: Popular-only BEFORE===AFTER: ${identical}`);
}
console.log(`Popular fully unchanged across all day-counts: ${popularUnchanged}`);

console.log("\n================ PART 7: Surprise Me unchanged? (should never resemble Shopping/Nightlife) ================\n");
let surpriseMeUnchanged = true;
for (const days of DAY_COUNTS) {
  const b = before["Surprise Me"][days], a = after["Surprise Me"][days];
  if (!b || !a) continue;
  const identical = b.size === a.size && [...b].every((id) => a.has(id));
  if (!identical) surpriseMeUnchanged = false;
  console.log(`${days}d: Surprise Me BEFORE===AFTER: ${identical}`);
}
console.log(`Surprise Me fully unchanged across all day-counts: ${surpriseMeUnchanged}`);

// ═══════════════════════════════════════════════════════════════════════════════════════
// PERMANENT REGRESSION GATE -- fails if Shopping/Food/Experiences collapse back to near-identical
// ═══════════════════════════════════════════════════════════════════════════════════════
console.log("\n================ PERMANENT REGRESSION GATE (AFTER only) ================\n");
let gateFailures = 0;
for (const days of [3, 5]) {
  const shop = after["Shopping only"][days];
  const food = after["Food only"][days];
  const exp = after["Experiences only"][days];
  const pop = after["Popular only"][days];
  if (!shop || !food || !exp || !pop) continue;

  const shopVsFood = jaccard(shop, food);
  const shopVsPop = jaccard(shop, pop);
  const shopIntent = intentCount(shop, SHOPPING_INTENT_IDS);
  const expIntent = intentCount(exp, EXPERIENCE_INTENT_IDS);
  const popExpIntent = intentCount(pop, EXPERIENCE_INTENT_IDS);

  // Semantic checks (reasonable, not "0 overlap"): Shopping must carry at least one real
  // shopping-intent stop, and must not be byte-identical to Food or Popular; Experiences must
  // surface at least as many intent-relevant stops as Popular does.
  if (shopIntent === 0) {
    console.log(`FAIL (${days}d): Shopping-only has 0 real shopping-intent stops (${[...shop].join(", ")})`);
    gateFailures++;
  }
  if (shopVsFood >= 0.95 && shop.size === food.size) {
    console.log(`FAIL (${days}d): Shopping-only is byte-identical to Food-only`);
    gateFailures++;
  }
  if (shopVsPop >= 0.95 && shop.size === pop.size) {
    console.log(`FAIL (${days}d): Shopping-only is byte-identical to Popular-only`);
    gateFailures++;
  }
  if (expIntent < popExpIntent) {
    console.log(`FAIL (${days}d): Experiences-only (${expIntent} intent stops) has FEWER intent-relevant stops than Popular-only (${popExpIntent})`);
    gateFailures++;
  }
  console.log(`${days}d: shopIntent=${shopIntent} shopVsFood=${(shopVsFood * 100).toFixed(0)}% shopVsPop=${(shopVsPop * 100).toFixed(0)}% expIntent=${expIntent} popExpIntent=${popExpIntent} -- ${gateFailures === 0 ? "OK" : "SEE FAILURES ABOVE"}`);
}
console.log(`\nGate failures: ${gateFailures} (target: 0)`);

console.log("\nDONE.");

console.log("\n================ PART 8: Full stop lists for report examples ================\n");
for (const label of ["Shopping only", "Experiences only"]) {
  for (const days of [1, 3, 5]) {
    const b = before[label][days];
    const a = after[label][days];
    if (!b || !a) continue;
    console.log(`${label} ${days}d BEFORE: ${[...b].join(", ")}`);
    console.log(`${label} ${days}d AFTER:  ${[...a].join(", ")}`);
  }
}

/**
 * Dev-only debug script — NOT part of the app.
 *
 * Fix Place Details Opening From Generated Plans -- 36-candidate audit (task section 14).
 * Verifies every V2 planner main-candidate placeId resolves against the real Guide data via
 * the exact same `resolvePlannerPlace` used everywhere else -- no fuzzy matching, no new
 * mapping table unless a genuine mismatch is found.
 *
 * Run with:
 *   npx tsx app/lib/planner/placeDetailsResolutionAudit.debug.ts
 */
import { getBarcelonaV2PlannerPlaces } from "./barcelonaV2Metadata";
import { resolvePlannerPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";

const places = getBarcelonaV2PlannerPlaces();
console.log(`Total planner candidates: ${places.length}`);

let resolved = 0;
const unmatched: string[] = [];
const seen = new Map<string, number>();

for (const place of places) {
  seen.set(place.placeId, (seen.get(place.placeId) ?? 0) + 1);
  const result = resolvePlannerPlace(place.placeId, barcelonaGuide);
  if (result) {
    resolved++;
  } else {
    unmatched.push(place.placeId);
  }
}

const duplicates = [...seen.entries()].filter(([, count]) => count > 1);

console.log(`Resolved: ${resolved}`);
console.log(`Unmatched: ${unmatched.length}`);
if (unmatched.length > 0) {
  console.log("Unmatched placeIds:");
  for (const id of unmatched) console.log(`  - ${id}`);
}
console.log(`Duplicate candidate placeIds: ${duplicates.length}`);
for (const [id, count] of duplicates) console.log(`  - ${id} x${count}`);

// ID-identity check: confirm resolved.place.id === the planner placeId for every match (i.e.
// no silent mapping/normalization happening anywhere in the resolution chain).
let idMismatches = 0;
for (const place of places) {
  const result = resolvePlannerPlace(place.placeId, barcelonaGuide);
  if (result && result.place.id !== place.placeId) {
    idMismatches++;
    console.log(`  ID MISMATCH: planner="${place.placeId}" guide="${result.place.id}"`);
  }
}
console.log(`ID mismatches (planner placeId !== resolved guide place.id): ${idMismatches}`);

console.log("\nDONE.");

/**
 * Dev-only debug script -- NOT part of the app (never imported by any page/component).
 * V1.2 hard assertions (Section H of the task spec): programmatically checks all 6 required
 * invariants across every valid interest-combination profile. Never silently fixes or
 * hides a failure -- prints every one it finds. Run with:
 *
 *   npx tsx app/lib/planner/smartPlannerHardAssertions.debug.ts
 *
 * V2: covers 1-6 interests (up from 1-3), matching the removal of the old 3-interest UI cap.
 */
import { generateBarcelonaSmartPlan } from "./generateBarcelonaSmartPlan";
import { getBarcelonaPlannerMetadata } from "./barcelona-planner-metadata";
import { BARCELONA_ICONIC_TIER_A } from "./barcelona-planner-day-builder";
import { PLANNER_INTERESTS } from "./plannerTypes";
import type { PlannerInterest } from "./plannerTypes";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

const ALL_PROFILES: PlannerInterest[][] = [1, 2, 3, 4, 5, 6].flatMap((size) => combinations(PLANNER_INTERESTS as PlannerInterest[], size));

let failures = 0;
let checkedProfiles = 0;

for (const interests of ALL_PROFILES) {
  const label = interests.join("+");
  const result = generateBarcelonaSmartPlan({ interests });
  if (!result.ok) {
    console.log(`[${label}] VALIDATION FAILED: ${result.error}`);
    failures++;
    continue;
  }
  checkedProfiles++;

  const { plan } = result.data;
  const allStopIds = plan.days.flatMap((day) => day.stops.map((stop) => stop.placeId));

  // 1. footballExperiences selected -> camp-nou must exist.
  if (interests.includes("footballExperiences") && !allStopIds.includes("camp-nou")) {
    console.log(`[${label}] ASSERTION 1 FAILED: footballExperiences selected but camp-nou is absent.`);
    failures++;
  }

  // 2. popular selected -> Tier A coverage >= 4.
  if (interests.includes("popular")) {
    const tierACovered = BARCELONA_ICONIC_TIER_A.filter((id) => allStopIds.includes(id));
    if (tierACovered.length < 4) {
      console.log(`[${label}] ASSERTION 2 FAILED: Tier A coverage ${tierACovered.length}/5 (need >=4).`);
      failures++;
    }
  }

  // 3. No day > 420 visit minutes.
  plan.days.forEach((day) => {
    if (day.totalVisitMinutes > 420) {
      console.log(`[${label}] ASSERTION 3 FAILED: Day ${day.dayNumber} has ${day.totalVisitMinutes} visit minutes (>420).`);
      failures++;
    }
  });

  // 4. No duplicate placeId in the same generated plan.
  const seen = new Set<string>();
  for (const id of allStopIds) {
    if (seen.has(id)) {
      console.log(`[${label}] ASSERTION 4 FAILED: duplicate placeId "${id}" in the same plan.`);
      failures++;
    }
    seen.add(id);
  }

  // 5. No day > 3 clusters.
  plan.days.forEach((day) => {
    if (day.clusters.length > 3) {
      console.log(`[${label}] ASSERTION 5 FAILED: Day ${day.dayNumber} has ${day.clusters.length} clusters (>3).`);
      failures++;
    }
  });

  // 6. Every selected stop exists in planner metadata.
  for (const id of allStopIds) {
    if (!getBarcelonaPlannerMetadata(id)) {
      console.log(`[${label}] ASSERTION 6 FAILED: stop "${id}" has no planner metadata entry.`);
      failures++;
    }
  }
}

console.log(`\nProfiles checked: ${checkedProfiles} / ${ALL_PROFILES.length}`);
console.log(`Total assertion failures: ${failures}`);
console.log(failures === 0 ? "ALL HARD ASSERTIONS PASSED across all 41 profiles." : "SOME ASSERTIONS FAILED -- see above, not hidden.");

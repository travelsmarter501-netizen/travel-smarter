/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 * Runs the full pipeline (Scoring -> Day Builder V1.1 -> Route Optimizer V1) for a set of
 * interest profiles and prints BEFORE/AFTER stop order per day plus a quality audit, so the
 * route-ordering behavior can be eyeballed for sanity before any UI is built. Run with:
 *
 *   npx tsx app/lib/planner/plannerRouteOptimizer.debug.ts
 */
import { buildBarcelonaPlannerPlan } from "./barcelona-planner-day-builder";
import { optimizeBarcelonaPlannerPlan, BARCELONA_CLUSTER_DIRECTIONAL_ORDER } from "./barcelona-planner-route-config";
import { getBarcelonaPlannerMetadata } from "./barcelona-planner-metadata";
import type { PlannerDay } from "./plannerDayBuilder";
import type { PlannerInterest, PreferredTime } from "./plannerTypes";

const TIME_BUCKET_ORDER: PreferredTime[] = [
  "morning",
  "morning/daytime",
  "daytime",
  "anytime",
  "afternoon",
  "morning/afternoon",
  "daytime/evening",
  "evening",
  "daytime/sunset",
  "sunset",
];

const profiles: { label: string; interests: PlannerInterest[] }[] = [
  { label: "A) popular", interests: ["popular"] },
  { label: "B) popular + viewsNature", interests: ["popular", "viewsNature"] },
  { label: "C) footballExperiences", interests: ["footballExperiences"] },
  { label: "D) cultureLocal", interests: ["cultureLocal"] },
  { label: "E) beachRelax", interests: ["beachRelax"] },
  { label: "F) popular + footballExperiences", interests: ["popular", "footballExperiences"] },
  { label: "G) popular + cultureLocal + viewsNature", interests: ["popular", "cultureLocal", "viewsNature"] },
];

function clusterSwitches(order: string[]): number {
  let switches = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const clusterA = getBarcelonaPlannerMetadata(order[i])!.cluster;
    const clusterB = getBarcelonaPlannerMetadata(order[i + 1])!.cluster;
    if (clusterA !== clusterB) switches++;
  }
  return switches;
}

/** Reporting-only diagnostic: count of adjacent pairs where the preferred-time bucket goes backwards. */
function preferredTimeViolations(order: string[]): number {
  let violations = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const bucketA = TIME_BUCKET_ORDER.indexOf(getBarcelonaPlannerMetadata(order[i])!.preferredTime);
    const bucketB = TIME_BUCKET_ORDER.indexOf(getBarcelonaPlannerMetadata(order[i + 1])!.preferredTime);
    if (bucketB < bucketA) violations++;
  }
  return violations;
}

function printDay(day: PlannerDay, beforeOrder: string[], afterOrder: string[]) {
  const clustersOf = (order: string[]) => order.map((id) => getBarcelonaPlannerMetadata(id)!.cluster);
  console.log(`\n-- Day ${day.dayNumber} -- (${day.stops.length} stops, ${day.totalVisitMinutes} min)`);
  console.log("  Before:", beforeOrder.join(" -> "));
  console.log("  After: ", afterOrder.join(" -> "));
  console.log("  Order changed?", JSON.stringify(beforeOrder) !== JSON.stringify(afterOrder));
  console.log("  Cluster switches before/after:", clusterSwitches(beforeOrder), "/", clusterSwitches(afterOrder));
  console.log("  Preferred-time violations before/after:", preferredTimeViolations(beforeOrder), "/", preferredTimeViolations(afterOrder));
  console.log("  Before clusters:", clustersOf(beforeOrder).join(", "));
  console.log("  After clusters: ", clustersOf(afterOrder).join(", "));
}

for (const profile of profiles) {
  console.log(`\n\n================ ${profile.label} ================`);
  const builtPlan = buildBarcelonaPlannerPlan({ days: 3, preferences: { interests: profile.interests } });
  const optimizedPlan = optimizeBarcelonaPlannerPlan(builtPlan);

  for (let i = 0; i < builtPlan.days.length; i++) {
    const beforeDay = builtPlan.days[i];
    const afterDay = optimizedPlan.days[i];
    printDay(afterDay, beforeDay.stops.map((s) => s.placeId), afterDay.stops.map((s) => s.placeId));
  }
}

// ── Special audit: explicit logical-order expectations ──────────────────────────────────
console.log("\n\n================ SPECIAL AUDIT ================");
console.log("Directional order used (backtracking detection only):", BARCELONA_CLUSTER_DIRECTIONAL_ORDER.join(" -> "));

function checkPairOrder(order: string[], first: string, second: string): string {
  const posFirst = order.indexOf(first);
  const posSecond = order.indexOf(second);
  if (posFirst === -1 || posSecond === -1) return "n/a (not both present)";
  return posFirst < posSecond ? `OK (${first} before ${second})` : `VIOLATION (${second} before ${first})`;
}

for (const profile of profiles) {
  const builtPlan = buildBarcelonaPlannerPlan({ days: 3, preferences: { interests: profile.interests } });
  const optimizedPlan = optimizeBarcelonaPlannerPlan(builtPlan);

  console.log(`\n-- ${profile.label} --`);
  for (const day of optimizedPlan.days) {
    const order = day.stops.map((s) => s.placeId);
    if (order.includes("sagrada-familia") && order.includes("sant-pau")) {
      console.log(`  Day ${day.dayNumber} Sagrada -> Sant Pau:`, checkPairOrder(order, "sagrada-familia", "sant-pau"));
    }
    if (order.includes("park-guell") && order.includes("bunkers-carmel")) {
      console.log(`  Day ${day.dayNumber} Park Guell -> Bunkers:`, checkPairOrder(order, "park-guell", "bunkers-carmel"));
    }
    if (order.includes("casa-mila") && order.includes("casa-batllo")) {
      console.log(`  Day ${day.dayNumber} Casa Mila -> Casa Batllo:`, checkPairOrder(order, "casa-mila", "casa-batllo"));
    }
    const oldCityBorn = order.filter((id) => ["old-city", "born"].includes(getBarcelonaPlannerMetadata(id)!.cluster));
    if (oldCityBorn.length >= 3) {
      const clusters = oldCityBorn.map((id) => getBarcelonaPlannerMetadata(id)!.cluster);
      let bounces = 0;
      for (let i = 0; i < clusters.length - 2; i++) {
        if (clusters[i] !== clusters[i + 1] && clusters[i] === clusters[i + 2]) bounces++;
      }
      console.log(`  Day ${day.dayNumber} old-city/born sequence: ${clusters.join(",")} (bounces: ${bounces})`);
    }
    if (order.includes("barceloneta-beach")) {
      const idx = order.indexOf("barceloneta-beach");
      const neighborClusters = [order[idx - 1], order[idx + 1]].filter(Boolean).map((id) => getBarcelonaPlannerMetadata(id)!.cluster);
      console.log(`  Day ${day.dayNumber} Barceloneta neighbors' clusters:`, neighborClusters.join(", ") || "(only stop)");
    }
    if (order.includes("bunkers-carmel")) {
      const idx = order.indexOf("bunkers-carmel");
      console.log(`  Day ${day.dayNumber} Bunkers position: ${idx + 1}/${order.length}`);
    }
    if (order.includes("mnac")) {
      const idx = order.indexOf("mnac");
      console.log(`  Day ${day.dayNumber} Montjuic position: ${idx + 1}/${order.length}, order: ${order.join(" -> ")}`);
    }
  }
}

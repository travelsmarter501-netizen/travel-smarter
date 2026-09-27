/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 * Runs the full pipeline (Scoring -> Day Builder V1.1 -> Route Optimizer V1 -> Route Legs V1)
 * for a set of interest profiles and prints every consecutive route pair's resolution status,
 * so the transport-leg layer can be eyeballed for sanity before any UI is built. Run with:
 *
 *   npx tsx app/lib/planner/plannerRouteLegs.debug.ts
 */
import { buildBarcelonaPlannerPlan } from "./barcelona-planner-day-builder";
import { optimizeBarcelonaPlannerPlan } from "./barcelona-planner-route-config";
import { buildBarcelonaPlannerPlanRouteLegs } from "./barcelona-planner-route-legs";
import type { PlannerInterest } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

const profiles: { label: string; interests: PlannerInterest[] }[] = [
  { label: "A) popular", interests: ["popular"] },
  { label: "B) popular + viewsNature", interests: ["popular", "viewsNature"] },
  { label: "C) footballExperiences", interests: ["footballExperiences"] },
  { label: "D) cultureLocal", interests: ["cultureLocal"] },
  { label: "E) beachRelax", interests: ["beachRelax"] },
  { label: "F) popular + footballExperiences", interests: ["popular", "footballExperiences"] },
  { label: "G) popular + cultureLocal + viewsNature", interests: ["popular", "cultureLocal", "viewsNature"] },
];

let totalVerified = 0;
let totalExisting = 0;
let totalUnresolved = 0;
const unresolvedPairs = new Set<string>();
const reversedPairsUsed = new Set<string>();

for (const profile of profiles) {
  console.log(`\n\n================ ${profile.label} ================`);
  const builtPlan = buildBarcelonaPlannerPlan({ days: 3, preferences: { interests: profile.interests } });
  const optimizedPlan = optimizeBarcelonaPlannerPlan(builtPlan);
  const dayLegs = buildBarcelonaPlannerPlanRouteLegs(optimizedPlan);

  optimizedPlan.days.forEach((day, i) => {
    const legs = dayLegs[i];
    console.log(`\n-- Day ${day.dayNumber} -- order: ${day.stops.map((s) => s.placeId).join(" -> ")}`);
    for (const leg of legs) {
      const modeSummary = leg.options.map((o) => `${o.mode} ${o.durationMinutesMin}-${o.durationMinutesMax}m${o.distanceKm ? `/${o.distanceKm}km` : ""}`).join(", ");
      console.log(`  ${leg.fromPlaceId} -> ${leg.toPlaceId}: [${leg.sourceStatus}] recommended=${leg.recommendedMode ?? "n/a"} ${modeSummary ? `(${modeSummary})` : "(no options)"}`);

      if (leg.sourceStatus === "verified") totalVerified++;
      else if (leg.sourceStatus === "existing-project-data") totalExisting++;
      else {
        totalUnresolved++;
        unresolvedPairs.add(`${leg.fromPlaceId} -> ${leg.toPlaceId}`);
      }

      const reverseNote = leg.options.find((o) => o.note?.includes("Reverse-direction reuse"));
      if (reverseNote) reversedPairsUsed.add(`${leg.fromPlaceId} -> ${leg.toPlaceId}`);
    }
  });
}

console.log("\n\n================ AUDIT SUMMARY ================");
console.log("Total verified legs:", totalVerified);
console.log("Total existing-project-data legs:", totalExisting);
console.log("Total unresolved legs:", totalUnresolved);
console.log("\nUnique unresolved pairs across all profiles:");
[...unresolvedPairs].sort().forEach((pair) => console.log("  -", pair));
console.log("\nReversed-direction pairs actually reused:");
[...reversedPairsUsed].sort().forEach((pair) => console.log("  -", pair));

console.log("montjuic permanent-guard check (must ALWAYS be unresolved):");
let montjuicViolation = false;
console.log("mnac pairs check (the 3 audited pairs must be verified; any other pair must be unresolved):");
let mnacViolation = false;
const VERIFIED_MNAC_PAIRS = new Set(["gothic-quarter::mnac", "la-rambla::mnac", "placa-catalunya::mnac"]);
for (const profile of profiles) {
  const builtPlan = buildBarcelonaPlannerPlan({ days: 3, preferences: { interests: profile.interests } });
  const optimizedPlan = optimizeBarcelonaPlannerPlan(builtPlan);
  const dayLegs = buildBarcelonaPlannerPlanRouteLegs(optimizedPlan);
  dayLegs.flat().forEach((leg: PlannerRouteLeg) => {
    if (leg.fromPlaceId === "montjuic" || leg.toPlaceId === "montjuic") {
      const ok = leg.sourceStatus === "unresolved" && leg.options.length === 0 && leg.recommendedMode === null;
      console.log(`  ${leg.fromPlaceId} -> ${leg.toPlaceId}: sourceStatus=${leg.sourceStatus}, options=${leg.options.length}, recommendedMode=${leg.recommendedMode} -> ${ok ? "OK" : "VIOLATION"}`);
      if (!ok) montjuicViolation = true;
    }
    if (leg.fromPlaceId === "mnac" || leg.toPlaceId === "mnac") {
      const isAudited = VERIFIED_MNAC_PAIRS.has(`${leg.fromPlaceId}::${leg.toPlaceId}`);
      const ok = isAudited ? leg.sourceStatus === "verified" : leg.sourceStatus === "unresolved";
      console.log(`  ${leg.fromPlaceId} -> ${leg.toPlaceId}: sourceStatus=${leg.sourceStatus} (expected ${isAudited ? "verified" : "unresolved"}) -> ${ok ? "OK" : "VIOLATION"}`);
      if (!ok) mnacViolation = true;
    }
  });
}
console.log("Any \"montjuic\" safety violation?", montjuicViolation);
console.log("Any \"mnac\" verified-pair-first/unresolved-fallback violation?", mnacViolation);

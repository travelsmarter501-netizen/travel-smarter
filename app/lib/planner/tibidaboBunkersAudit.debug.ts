/**
 * Dev-only debug script — NOT part of the app (never imported by any page/component).
 *
 * Tibidabo + Bunkers del Carmel co-occurrence audit (Post Route-First Coverage Recovery task,
 * Part B). Scans every scenario/duration for days where both places were selected together,
 * then builds a QA-ONLY counterfactual (move one of the two to its best compatible sibling
 * day, using the exact same real verified-minutes-aware cost/tie-break logic already live in
 * plannerRouteOptimizer.ts/plannerDayBuilder.ts) and compares total verified travel minutes,
 * density, and stop counts before/after. Never mutates production; this is read-only analysis.
 *
 * Run with:
 *   npx tsx app/lib/planner/tibidaboBunkersAudit.debug.ts
 */
import { generateTravelPlan } from "./travelPlannerEngine";
import { BARCELONA_V2_DESTINATION_CONFIG } from "./barcelonaV2DestinationConfig";
import { getBarcelonaV2PlannerMetadataById } from "./barcelonaV2Metadata";
import { classifyDayDensity } from "./barcelonaV2Density";
import { SURPRISE_ME_LEGACY_INTERESTS } from "./v2InterestAdapter";
import { getBarcelonaVerifiedTravelMinutes } from "./barcelona-planner-route-legs";
import type { PlannerInterest } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { PlannerDay } from "./plannerDayBuilder";

const SCENARIOS: { label: string; interests: PlannerInterest[] }[] = [
  { label: "Surprise Me (new)", interests: SURPRISE_ME_LEGACY_INTERESTS },
  { label: "Popular+Culture", interests: ["popular", "cultureLocal"] },
  { label: "Nature/Views", interests: ["viewsNature"] },
  { label: "Nature+Beaches", interests: ["viewsNature", "beachRelax"] },
  { label: "All 8 (legacy union)", interests: ["popular", "cultureLocal", "viewsNature", "beachRelax", "footballExperiences", "foodShoppingNightlife"] },
];

function legMinutes(leg: PlannerRouteLeg): number | null {
  if (leg.sourceStatus === "unresolved" || !leg.recommendedMode) return null;
  const option = leg.options.find((o) => o.mode === leg.recommendedMode) ?? leg.options[0];
  return option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : null;
}

function dayTravelMinutes(day: PlannerDay, legs: PlannerRouteLeg[]): number {
  return legs.reduce((sum, leg) => sum + (legMinutes(leg) ?? 0), 0);
}

function dayDensityLabel(day: PlannerDay): string {
  return classifyDayDensity(day.stops.length, day.totalVisitMinutes);
}

console.log("================ TIBIDABO / BUNKERS DEL CARMEL CO-OCCURRENCE AUDIT ================");

let totalOccurrences = 0;

for (const scenario of SCENARIOS) {
  for (let days = 1; days <= 10; days++) {
    const result = generateTravelPlan(BARCELONA_V2_DESTINATION_CONFIG, { interests: scenario.interests }, days);
    if (!result.ok) continue;
    const { plan, legsByDay } = result.data;

    const dayIndex = plan.days.findIndex((d) => d.stops.some((s) => s.placeId === "tibidabo") && d.stops.some((s) => s.placeId === "bunkers-carmel"));
    if (dayIndex === -1) continue;

    totalOccurrences++;
    const day = plan.days[dayIndex];
    const legs = legsByDay[dayIndex] ?? [];
    const currentTravel = dayTravelMinutes(day, legs);
    const currentDensity = dayDensityLabel(day);
    const otherStops = day.stops.filter((s) => s.placeId !== "tibidabo" && s.placeId !== "bunkers-carmel").map((s) => s.placeId);

    console.log(`\n-- ${scenario.label}, ${days}d, Day ${day.dayNumber} --`);
    console.log(`   Current sequence: ${day.stops.map((s) => s.placeId).join(" -> ")}`);
    console.log(`   Current total travel: ${currentTravel}min | visit: ${day.totalVisitMinutes}min | density: ${currentDensity} | clusters: ${day.clusters.join(",")}`);
    console.log(`   Other stops that day: ${otherStops.join(", ") || "(none)"}`);

    // Counterfactual: for each sibling day, test moving "bunkers-carmel" there (swap with the
    // sibling's lowest-priority stop if the sibling is already at 6, else just add it and
    // remove it from the tibidabo day) and recompute total plan travel minutes. This is a
    // read-only simulation over the ALREADY-GENERATED plan's own stop set -- it never re-runs
    // the Day Builder/scoring, so it cannot invent a "better" selection, only test relocating
    // the exact two real candidates already chosen.
    let bestAlternative: { siblingDayNumber: number; totalTravelBefore: number; totalTravelAfter: number; siblingDensityAfter: string; tibidaboDensityAfter: string } | null = null;

    for (let i = 0; i < plan.days.length; i++) {
      if (i === dayIndex) continue;
      const sibling = plan.days[i];
      if (sibling.stops.length >= 6) continue; // can't exceed the hard cap

      // Simulate: remove bunkers-carmel from `day`, append to `sibling`.
      const newTibidaboStops = day.stops.filter((s) => s.placeId !== "bunkers-carmel");
      const bunkersMeta = getBarcelonaV2PlannerMetadataById("bunkers-carmel");
      if (!bunkersMeta) continue;
      const newSiblingStops = [...sibling.stops, day.stops.find((s) => s.placeId === "bunkers-carmel")!];

      const newTibidaboVisitMinutes = newTibidaboStops.reduce((sum, s) => sum + (getBarcelonaV2PlannerMetadataById(s.placeId)?.visitDurationMinutes ?? 0), 0);
      const newSiblingVisitMinutes = sibling.totalVisitMinutes + bunkersMeta.visitDurationMinutes;
      if (newSiblingVisitMinutes > 420) continue; // would violate the real day-minutes cap

      // Travel-minutes estimate for the counterfactual: keep the tibidabo day's remaining
      // known legs (minus whichever touched bunkers-carmel) and add a real verified leg for
      // bunkers-carmel's new adjacency on the sibling day, when one exists -- otherwise treat
      // as unresolved (0 known minutes), same honesty rule the real product follows.
      const tibidaboLegsAfter = legs.filter((l) => l.fromPlaceId !== "bunkers-carmel" && l.toPlaceId !== "bunkers-carmel");
      const tibidaboTravelAfter = dayTravelMinutes({ ...day, stops: newTibidaboStops }, tibidaboLegsAfter);

      const siblingLastStop = sibling.stops[sibling.stops.length - 1]?.placeId;
      const newLegMinutes = siblingLastStop ? (getBarcelonaVerifiedTravelMinutes(siblingLastStop, "bunkers-carmel") ?? 0) : 0;
      const siblingLegsBefore = legsByDay[i] ?? [];
      const siblingTravelBefore = dayTravelMinutes(sibling, siblingLegsBefore);
      const siblingTravelAfter = siblingTravelBefore + newLegMinutes;

      const totalTravelBefore = currentTravel + siblingTravelBefore;
      const totalTravelAfter = tibidaboTravelAfter + siblingTravelAfter;

      const tibidaboDensityAfter = classifyDayDensity(newTibidaboStops.length, newTibidaboVisitMinutes);
      const siblingDensityAfter = classifyDayDensity(newSiblingStops.length, newSiblingVisitMinutes);

      if (!bestAlternative || totalTravelAfter < bestAlternative.totalTravelAfter) {
        bestAlternative = { siblingDayNumber: sibling.dayNumber, totalTravelBefore, totalTravelAfter, siblingDensityAfter, tibidaboDensityAfter };
      }
    }

    if (bestAlternative) {
      const saved = bestAlternative.totalTravelBefore - bestAlternative.totalTravelAfter;
      console.log(
        `   BEST counterfactual: move bunkers-carmel -> Day ${bestAlternative.siblingDayNumber} | travel before=${bestAlternative.totalTravelBefore}min after=${bestAlternative.totalTravelAfter}min | saved=${saved}min | tibidabo-day density after=${bestAlternative.tibidaboDensityAfter} | sibling density after=${bestAlternative.siblingDensityAfter}`
      );
      const decision =
        saved >= 15 && bestAlternative.tibidaboDensityAfter === "healthy" && bestAlternative.siblingDensityAfter === "healthy"
          ? "SEPARATE / FIX NEEDED"
          : "KEEP TOGETHER";
      console.log(`   DECISION: ${decision}`);
    } else {
      console.log("   No legal counterfactual sibling day found (would violate 6-stop cap, 420min cap, or no other day exists). DECISION: KEEP TOGETHER (no alternative).");
    }
  }
}

console.log(`\n\nTotal same-day Tibidabo+Bunkers occurrences found: ${totalOccurrences}`);
console.log("DONE.");

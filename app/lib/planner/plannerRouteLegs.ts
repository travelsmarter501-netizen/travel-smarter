import type { PlannerDay, GeneratedPlannerPlan } from "./plannerDayBuilder";
import type { PlannerRouteLeg, RouteLegDataEntry, TransportMode, TransportOption } from "./plannerTransportTypes";

/**
 * Barcelona Smart Planner — Route Legs / Transport Layer V1.
 *
 * Generic, destination-agnostic core: given an already-ordered day (from the Route
 * Optimizer) and a destination's known route-leg data table, produce one transport leg per
 * consecutive stop pair. This layer does NOT choose which places are visited or their order
 * — it only describes the trip between stops the pipeline already decided on.
 *
 * No live routing, no invented numbers: every returned leg is either an exact match, an
 * explicitly-allowed reverse-direction reuse (walking only), or `sourceStatus: "unresolved"`
 * with empty `options`. See barcelona-planner-route-legs.ts for Barcelona's actual data table
 * and its Montjuïc safety override.
 */

const WALKING_SHORT_THRESHOLD_MINUTES = 20; // walking is preferred outright at/under this max duration

/**
 * V1 recommended-mode heuristic, used only when a data entry doesn't already specify one
 * (an already-curated `recommendedMode` on the entry is always preferred over this — it
 * reflects human judgment, e.g. "prefer transit because the walk is uphill", that a naive
 * duration comparison can't know about).
 *
 *   - walking, if its max duration is short and practical (<= 20 min)
 *   - otherwise transit, if it's materially faster than walking
 *   - otherwise car, if it's at least as fast as any available transit and no slower than walking
 *   - otherwise whichever mode is available, in walking > transit > car preference order
 */
export function chooseRecommendedMode(options: TransportOption[]): TransportMode | null {
  if (options.length === 0) return null;
  const byMode = new Map(options.map((option) => [option.mode, option]));
  const walking = byMode.get("walking");
  const transit = byMode.get("transit");
  const car = byMode.get("car");

  if (walking && walking.durationMinutesMax <= WALKING_SHORT_THRESHOLD_MINUTES) return "walking";
  if (transit && (!walking || transit.durationMinutesMax < walking.durationMinutesMax)) return "transit";
  if (car && (!walking || car.durationMinutesMax < walking.durationMinutesMax) && (!transit || car.durationMinutesMax <= transit.durationMinutesMax)) return "car";
  if (walking) return "walking";
  if (transit) return "transit";
  return car!.mode;
}

function pairKey(fromPlaceId: string, toPlaceId: string): string {
  return `${fromPlaceId}::${toPlaceId}`;
}

function unresolvedLeg(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  return { fromPlaceId, toPlaceId, recommendedMode: null, options: [], sourceStatus: "unresolved" };
}

/** Exported (Route-First Planning Upgrade) so a destination's own route-leg-data module can
 * build a pairwise verified-minutes lookup on top of the exact same resolution rules (exact
 * match, then opt-in reverse-walking-reuse, then unresolved) without duplicating this logic --
 * see barcelona-planner-route-legs.ts's getBarcelonaVerifiedTravelMinutes. */
export function resolveLeg(fromPlaceId: string, toPlaceId: string, byPair: Map<string, RouteLegDataEntry>): PlannerRouteLeg {
  const exact = byPair.get(pairKey(fromPlaceId, toPlaceId));
  if (exact) {
    return {
      fromPlaceId,
      toPlaceId,
      recommendedMode: exact.recommendedMode ?? chooseRecommendedMode(exact.options),
      options: exact.options,
      sourceStatus: exact.sourceStatus,
    };
  }

  // Reverse-direction reuse: ONLY the walking option, ONLY when the forward entry explicitly
  // allows it (short/flat paths with no known elevation or one-way asymmetry). Transit/car
  // durations are never assumed symmetric, per the task's matching rules.
  const reverse = byPair.get(pairKey(toPlaceId, fromPlaceId));
  const reusableWalking = reverse?.allowReverseWalkingReuse ? reverse.options.find((option) => option.mode === "walking") : undefined;
  if (reverse && reusableWalking) {
    const reverseNote = `Reverse-direction reuse of ${reverse.fromPlaceId} -> ${reverse.toPlaceId} (walking only, short/flat path).`;
    return {
      fromPlaceId,
      toPlaceId,
      recommendedMode: "walking",
      options: [{ ...reusableWalking, note: [reusableWalking.note, reverseNote].filter(Boolean).join(" ") }],
      sourceStatus: reverse.sourceStatus,
    };
  }

  return unresolvedLeg(fromPlaceId, toPlaceId);
}

/** Builds one transport leg per consecutive stop pair in an already-ordered day. */
export function buildPlannerRouteLegs(optimizedDay: PlannerDay, routeLegData: RouteLegDataEntry[]): PlannerRouteLeg[] {
  const byPair = new Map<string, RouteLegDataEntry>();
  for (const entry of routeLegData) byPair.set(pairKey(entry.fromPlaceId, entry.toPlaceId), entry);

  const placeIds = optimizedDay.stops.map((stop) => stop.placeId);
  const legs: PlannerRouteLeg[] = [];
  for (let i = 0; i < placeIds.length - 1; i++) {
    legs.push(resolveLeg(placeIds[i], placeIds[i + 1], byPair));
  }
  return legs;
}

/** Applies `buildPlannerRouteLegs` to every day of an optimized plan — one leg array per day, in day order. */
export function buildPlannerPlanRouteLegs(optimizedPlan: GeneratedPlannerPlan, routeLegData: RouteLegDataEntry[]): PlannerRouteLeg[][] {
  return optimizedPlan.days.map((day) => buildPlannerRouteLegs(day, routeLegData));
}

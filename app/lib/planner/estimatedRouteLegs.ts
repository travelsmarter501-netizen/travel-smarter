import { haversineDistanceKm, type GeoPoint } from "./geoDistance";
import type { PlannerRouteLeg, TransportOption } from "./plannerTransportTypes";
import type { GeneratedPlannerPlan } from "./plannerDayBuilder";

/**
 * Multi-city foundation: transport ESTIMATES for a city that has no checked route table yet (Prague first).
 *
 * Every number here is derived from the straight-line distance between two places whose coordinates come from an
 * official source -- nothing is looked up in a maps service, so every leg is marked `sourceStatus: "estimated"` and the
 * customer sees "تقدير تقريبي" next to it plus a note to check a maps app (SmartPlannerTransportConnector / Sheet).
 *
 * Model (deliberately simple and conservative, documented so it can be audited):
 * - Street distance ≈ straight line × 1.3 (detour factor for an old-town street grid).
 * - Walking at 4.5 km/h, shown as a range of -10% / +15%.
 * - Public transport is only offered when walking would take more than 20 minutes: in-vehicle time at an average 18
 *   km/h over the street distance plus 10 minutes for walking to / waiting at the stop, shown as -15% / +25%.
 * - Walking is still listed next to transport when it stays at or under 60 minutes.
 * Unknown coordinates on either side -> an honest "unresolved" leg (no duration at all), exactly like Barcelona's rule.
 */

const DETOUR_FACTOR = 1.3;
const WALKING_KMH = 4.5;
const TRANSIT_KMH = 18;
const TRANSIT_ACCESS_MINUTES = 10;
const WALK_ONLY_MAX_MINUTES = 20;
const WALK_LISTED_MAX_MINUTES = 60;

export const ESTIMATED_LEG_NOTE_AR = "تقدير حسب المسافة، مش من تطبيق خرائط. تأكد من الطريق بالتطبيق قبل ما تتحرك.";

function unresolved(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  return { fromPlaceId, toPlaceId, recommendedMode: null, options: [], sourceStatus: "unresolved" };
}

/** Walking minutes (midpoint) between two points, or null without coordinates. Used as the route optimizer's travel signal. */
export function estimatedWalkingMinutes(from: GeoPoint | undefined, to: GeoPoint | undefined): number | null {
  if (!from || !to) return null;
  const streetKm = haversineDistanceKm(from, to) * DETOUR_FACTOR;
  return (streetKm / WALKING_KMH) * 60;
}

export function buildEstimatedLeg(fromPlaceId: string, toPlaceId: string, coordinates: Readonly<Record<string, GeoPoint>>): PlannerRouteLeg {
  const from = coordinates[fromPlaceId];
  const to = coordinates[toPlaceId];
  if (!from || !to || fromPlaceId === toPlaceId) return unresolved(fromPlaceId, toPlaceId);

  const streetKm = haversineDistanceKm(from, to) * DETOUR_FACTOR;
  const walkMinutes = (streetKm / WALKING_KMH) * 60;
  const walking: TransportOption = {
    mode: "walking",
    durationMinutesMin: Math.max(1, Math.round(walkMinutes * 0.9)),
    durationMinutesMax: Math.max(1, Math.round(walkMinutes * 1.15)),
    distanceKm: Math.round(streetKm * 10) / 10,
    note: ESTIMATED_LEG_NOTE_AR,
  };

  if (walking.durationMinutesMax <= WALK_ONLY_MAX_MINUTES) {
    return { fromPlaceId, toPlaceId, recommendedMode: "walking", options: [walking], sourceStatus: "estimated" };
  }

  const transitMinutes = (streetKm / TRANSIT_KMH) * 60 + TRANSIT_ACCESS_MINUTES;
  const transit: TransportOption = {
    mode: "transit",
    durationMinutesMin: Math.round(transitMinutes * 0.85),
    durationMinutesMax: Math.round(transitMinutes * 1.25),
    note: ESTIMATED_LEG_NOTE_AR,
  };
  const options = walking.durationMinutesMax <= WALK_LISTED_MAX_MINUTES ? [walking, transit] : [transit];
  return { fromPlaceId, toPlaceId, recommendedMode: "transit", options, sourceStatus: "estimated" };
}

export function buildEstimatedPlanRouteLegs(plan: GeneratedPlannerPlan, coordinates: Readonly<Record<string, GeoPoint>>): PlannerRouteLeg[][] {
  return plan.days.map((day) => {
    const legs: PlannerRouteLeg[] = [];
    for (let i = 0; i < day.stops.length - 1; i++) legs.push(buildEstimatedLeg(day.stops[i].placeId, day.stops[i + 1].placeId, coordinates));
    return legs;
  });
}

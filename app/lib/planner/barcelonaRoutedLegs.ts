import type { PlannerRouteLeg, TransportOption } from "./plannerTransportTypes";
import { BARCELONA_CAR_ROUTE_KM, BARCELONA_PINNED_POINTS, BARCELONA_ROUTED_WALKS, BARCELONA_WALK_CORRECTIONS } from "./barcelonaRoutedLegData";

/**
 * Barcelona: transfers measured on a real route between PINNED points, for pairs the hand-checked table (barcelona-planner-route-legs.ts)
 * does not cover, or covers with a value shown to be wrong. Data and method: barcelonaRoutedLegData.ts.
 *
 * - A pair with no data at all gets a WALKING leg only when the walk is short (at most 20 minutes, the same limit as Prague's
 *   walk-only legs). A longer pair stays without data: a walking time must not stand in for a bus, metro or taxi time.
 * - A walking value of the table that is proven wrong is replaced (BARCELONA_WALK_CORRECTIONS).
 * - A car time without a distance of its own gets the road distance between the two pinned points; the car TIME stays the table's.
 * Times built here are estimates (4.5 km/h, +20% on a climb) and the leg says so (`sourceStatus: "estimated"`).
 * Only the customer-facing legs use this; the day builder's travel signal (getBarcelonaVerifiedTravelMinutes) is unchanged.
 */

export const ROUTED_WALK_NOTE =
  "Distance from a real walking route (OpenStreetMap, FOSSGIS OSRM) between pinned entrances or building points, 2026-11-12; time at 4.5 km/h (+20% on a climb). Not checked on Google or Apple Maps.";
export const ROUTED_CAR_NOTE = "Car distance: OSRM car route on the OpenStreetMap road network between pinned points, 2026-11-12. The car time is the table's.";

const WALK_KMH = 4.5;
const WALK_ONLY_MAX_MINUTES = 20;

function walkingOption(km: number, climb: 0 | 1): TransportOption {
  const minutes = (km / WALK_KMH) * 60 * (climb ? 1.2 : 1);
  return {
    mode: "walking",
    durationMinutesMin: Math.max(1, Math.round(minutes * 0.9)),
    durationMinutesMax: Math.max(1, Math.round(minutes * 1.15)),
    distanceKm: km,
    note: ROUTED_WALK_NOTE,
  };
}

function routeUrl(fromPlaceId: string, toPlaceId: string): string | undefined {
  const a = BARCELONA_PINNED_POINTS[fromPlaceId];
  const b = BARCELONA_PINNED_POINTS[toPlaceId];
  if (!a || !b) return undefined;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${a[0]}%2C${a[1]}%3B${b[0]}%2C${b[1]}`;
}

export function withBarcelonaRoutedData(leg: PlannerRouteLeg): PlannerRouteLeg {
  const key = `${leg.fromPlaceId}>${leg.toPlaceId}`;

  const correction = BARCELONA_WALK_CORRECTIONS[key];
  if (correction) {
    const walking = walkingOption(correction[0], correction[1]);
    const hasWalking = leg.options.some((option) => option.mode === "walking");
    const options = hasWalking ? leg.options.map((option) => (option.mode === "walking" ? walking : option)) : [walking, ...leg.options];
    const recommendedMode = leg.recommendedMode ?? "walking";
    return { ...leg, options, recommendedMode, sourceStatus: recommendedMode === "walking" ? "estimated" : leg.sourceStatus, routeUrl: routeUrl(leg.fromPlaceId, leg.toPlaceId) };
  }

  if (leg.sourceStatus === "unresolved") {
    const routed = BARCELONA_ROUTED_WALKS[key];
    if (!routed) return leg;
    const walking = walkingOption(routed[0], routed[1]);
    if (walking.durationMinutesMax > WALK_ONLY_MAX_MINUTES) return leg;
    return { ...leg, recommendedMode: "walking", options: [walking], sourceStatus: "estimated", routeUrl: routeUrl(leg.fromPlaceId, leg.toPlaceId) };
  }

  const carKm = BARCELONA_CAR_ROUTE_KM[key];
  if (carKm !== undefined && leg.options.some((option) => option.mode === "car" && option.distanceKm === undefined)) {
    const options = leg.options.map((option) =>
      option.mode === "car" && option.distanceKm === undefined ? { ...option, distanceKm: carKm, note: [option.note, ROUTED_CAR_NOTE].filter(Boolean).join(" ") } : option
    );
    return { ...leg, options };
  }
  return leg;
}

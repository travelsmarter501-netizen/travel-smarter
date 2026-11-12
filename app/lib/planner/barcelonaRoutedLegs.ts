import { haversineDistanceKm } from "./geoDistance";
import type { PlannerRouteLeg, TransportOption } from "./plannerTransportTypes";
import {
  BARCELONA_CAR_ROUTE_KM,
  BARCELONA_ESTIMATE_POINTS,
  BARCELONA_PINNED_POINTS,
  BARCELONA_ROUTED_WALKS,
  BARCELONA_SAME_BUILDING,
  BARCELONA_WALK_CORRECTIONS,
} from "./barcelonaRoutedLegData";

/**
 * Barcelona: transfers the hand-checked table (barcelona-planner-route-legs.ts) does not cover, or covers with a value shown
 * to be wrong. Data, points and evidence: barcelonaRoutedLegData.ts. In order:
 *
 * 1. A walking value of the table that is proven wrong is replaced by the real route (BARCELONA_WALK_CORRECTIONS).
 * 2. A pair with no data and a real walking route of at most 20 minutes gets that walk (the walk-only limit Prague uses too).
 *    The distance has two parts, kept apart in the data: the route on the street network (computed) and the access from each
 *    point to its road point (a short straight-line estimate). The leg shows their sum; the time is an estimate (4.5 km/h,
 *    +20% on a climb).
 * 3. Any other pair with no data gets an ESTIMATE, so no transfer is planned as zero minutes (timeline, day builder, route
 *    optimizer and timing guard all read these legs):
 *    - points: BARCELONA_ESTIMATE_POINTS. A place's own point gives a time and a distance; an area-level point (a park,
 *      beach or quarter stored as one point, or the centre of its area) gives a time only;
 *    - walking: the real route when one was computed, else the straight line x 1.3, at 4.5 km/h, shown -10% / +15%;
 *    - longer than 20 minutes on foot: public transport, (street km / 18 km/h x 60 + 10 min to reach and wait at the stop)
 *      x 1.25, shown -15% / +25%. Basis: on the 351 table pairs where both places have a point, this model without the x 1.25
 *      gave a median 0.8 of the checked public-transport time (p10 0.55, p90 1.16), and the straight-line walk a median 1.0
 *      of the checked walk (p10 0.75, p90 1.16); the recommended-mode time was off by a median 2 and a p90 9 minutes;
 *    - two places in the same building (BARCELONA_SAME_BUILDING): the same estimate between their points, marked as inside.
 *    Every such leg is `sourceStatus: "estimated"` with a note that says how it was estimated (translated, i18n/transportNotes.ts).
 * 4. A car time without a distance of its own gets the road distance between the two points; the car TIME stays the table's.
 *
 * The vague "montjuic" hill id never takes a table value (its permanent guard); it gets this estimate alone, area-level.
 * Limits: no transport mode is checked for an estimated leg (lines, changes and waiting are not known); places with no point at
 * all (day trips, match tickets, a few experiences and restaurants without an address point) stay unresolved and keep the
 * timeline's internal margin. Where estimates are used: the day's clock (timeline, guard), the order of the day's places (route
 * optimizer), the cross-day and guard comparisons, and the display. NOT used to choose WHICH places go into a day: the day builder's
 * tie-break between two equally fitting candidates (getBarcelonaSelectionTravelMinutes) uses checked or routed values only, because an
 * area-level estimate is off by a median 3.5 and a p90 10.5 minutes against the table, wider than the differences that decide a tie;
 * with no such value it falls back to the place's priority, as before (it never treats an unknown transfer as zero).
 */

/** Fixed wording (translated in i18n/transportNotes.ts): the stored note must match a key there exactly. */
export const ROUTED_WALK_NOTE =
  "Distance: a walking route on the street network (OpenStreetMap) between the points used for the two places, plus a short straight-line estimate from each point to the street. Time estimated at 4.5 km/h. Not checked on Google or Apple Maps.";
export const ROUTED_WALK_CLIMB_NOTE =
  "Distance: a walking route on the street network (OpenStreetMap) between the points used for the two places, plus a short straight-line estimate from each point to the street. Time estimated at 4.5 km/h, plus 20% for the climb. Not checked on Google or Apple Maps.";
export const ROUTED_CAR_NOTE = "Car distance from the road network (OpenStreetMap) between the points used for the two places; the car time is the checked one.";
export const ESTIMATED_WALK_NOTE =
  "Estimate: the straight-line distance between the two places x 1.3 for the streets, walking at 4.5 km/h. Not a checked route: check a maps app before you go.";
export const ESTIMATED_TRANSIT_NOTE =
  "Estimate from the distance: 18 km/h plus 10 minutes to reach and wait at the stop, x 1.25 (the gap measured against Barcelona's checked times). The line is not checked: look it up in a maps app.";
export const ESTIMATED_AREA_NOTE =
  "Rough estimate: one of the two is a large place (park, beach, quarter...) with no single entrance point, so only a time is given, measured to a central point. Check a maps app.";
export const SAME_BUILDING_NOTE = "Same building: a few minutes inside, no street route.";

const WALK_KMH = 4.5;
const WALK_ONLY_MAX_MINUTES = 20;
const WALK_LISTED_MAX_MINUTES = 60;
const DETOUR_FACTOR = 1.3;
const TRANSIT_KMH = 18;
const TRANSIT_ACCESS_MINUTES = 10;
/** Model / checked public-transport time was a median 0.8 on the table's pairs (see the header): 1 / 0.8. */
const TRANSIT_CALIBRATION = 1.25;

function walkingOption(networkKm: number, accessM: number, climb: 0 | 1): TransportOption {
  const km = networkKm + accessM / 1000;
  const minutes = (km / WALK_KMH) * 60 * (climb ? 1.2 : 1);
  return {
    mode: "walking",
    durationMinutesMin: Math.max(1, Math.round(minutes * 0.9)),
    durationMinutesMax: Math.max(1, Math.round(minutes * 1.15)),
    distanceKm: Math.round(km * 100) / 100,
    note: climb ? ROUTED_WALK_CLIMB_NOTE : ROUTED_WALK_NOTE,
  };
}

function routeUrl(fromPlaceId: string, toPlaceId: string): string | undefined {
  const a = BARCELONA_PINNED_POINTS[fromPlaceId];
  const b = BARCELONA_PINNED_POINTS[toPlaceId];
  if (!a || !b) return undefined;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${a[0]}%2C${a[1]}%3B${b[0]}%2C${b[1]}`;
}

/** Step 3 of the header: an estimated leg, or the leg unchanged when either place has no point at all. */
function estimatedLeg(leg: PlannerRouteLeg): PlannerRouteLeg {
  const key = `${leg.fromPlaceId}>${leg.toPlaceId}`;
  const a = BARCELONA_ESTIMATE_POINTS[leg.fromPlaceId];
  const b = BARCELONA_ESTIMATE_POINTS[leg.toPlaceId];
  if (!a || !b || leg.fromPlaceId === leg.toPlaceId) return leg;
  const areaLevel = a[2] === 1 || b[2] === 1;
  const sameBuilding = BARCELONA_SAME_BUILDING[key] !== undefined;
  const routed = sameBuilding ? undefined : BARCELONA_ROUTED_WALKS[key];

  let streetKm: number;
  let walking: TransportOption;
  if (routed) {
    streetKm = routed[0] + routed[1] / 1000;
    walking = walkingOption(routed[0], routed[1], routed[2]);
  } else {
    streetKm = haversineDistanceKm({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] }) * DETOUR_FACTOR;
    const minutes = (streetKm / WALK_KMH) * 60;
    walking = {
      mode: "walking",
      durationMinutesMin: Math.max(1, Math.round(minutes * 0.9)),
      durationMinutesMax: Math.max(1, Math.round(minutes * 1.15)),
      ...(areaLevel || sameBuilding ? {} : { distanceKm: Math.round(streetKm * 10) / 10 }),
      note: sameBuilding ? SAME_BUILDING_NOTE : areaLevel ? ESTIMATED_AREA_NOTE : ESTIMATED_WALK_NOTE,
    };
  }
  const base = { fromPlaceId: leg.fromPlaceId, toPlaceId: leg.toPlaceId, sourceStatus: "estimated" as const };
  if (sameBuilding || walking.durationMinutesMax <= WALK_ONLY_MAX_MINUTES) {
    return { ...base, recommendedMode: "walking", options: [walking], ...(routed ? { routeUrl: routeUrl(leg.fromPlaceId, leg.toPlaceId) } : {}) };
  }
  const transitMinutes = ((streetKm / TRANSIT_KMH) * 60 + TRANSIT_ACCESS_MINUTES) * TRANSIT_CALIBRATION;
  const transit: TransportOption = {
    mode: "transit",
    durationMinutesMin: Math.round(transitMinutes * 0.85),
    durationMinutesMax: Math.round(transitMinutes * 1.25),
    note: areaLevel ? ESTIMATED_AREA_NOTE : ESTIMATED_TRANSIT_NOTE,
  };
  const options = walking.durationMinutesMax <= WALK_LISTED_MAX_MINUTES ? [walking, transit] : [transit];
  return { ...base, recommendedMode: "transit", options };
}

const DISTANCE_MODEL_NOTES = new Set([ESTIMATED_WALK_NOTE, ESTIMATED_TRANSIT_NOTE, ESTIMATED_AREA_NOTE, SAME_BUILDING_NOTE]);

/** True when the leg's recommended time comes from the distance model (step 3), not from the table or a computed route. */
export function isDistanceModelEstimate(leg: PlannerRouteLeg): boolean {
  const option = leg.options.find((o) => o.mode === leg.recommendedMode);
  return !!option && DISTANCE_MODEL_NOTES.has(option.note ?? "");
}

/**
 * The estimate alone, for a pair whose table values must never be used (the vague "montjuic" hill id, see
 * barcelona-planner-route-legs.ts): an area-level time, never a checked value. Unresolved when either place has no point.
 */
export function barcelonaEstimateOnlyLeg(fromPlaceId: string, toPlaceId: string): PlannerRouteLeg {
  return estimatedLeg({ fromPlaceId, toPlaceId, recommendedMode: null, options: [], sourceStatus: "unresolved" });
}

export function withBarcelonaRoutedData(leg: PlannerRouteLeg): PlannerRouteLeg {
  const key = `${leg.fromPlaceId}>${leg.toPlaceId}`;

  const correction = BARCELONA_WALK_CORRECTIONS[key];
  if (correction) {
    const walking = walkingOption(correction[0], correction[1], correction[2]);
    const hasWalking = leg.options.some((option) => option.mode === "walking");
    const options = hasWalking ? leg.options.map((option) => (option.mode === "walking" ? walking : option)) : [walking, ...leg.options];
    const recommendedMode = leg.recommendedMode ?? "walking";
    return { ...leg, options, recommendedMode, sourceStatus: recommendedMode === "walking" ? "estimated" : leg.sourceStatus, routeUrl: routeUrl(leg.fromPlaceId, leg.toPlaceId) };
  }

  if (leg.sourceStatus === "unresolved") {
    const routed = BARCELONA_ROUTED_WALKS[key];
    if (routed) {
      const walking = walkingOption(routed[0], routed[1], routed[2]);
      if (walking.durationMinutesMax <= WALK_ONLY_MAX_MINUTES) {
        return { ...leg, recommendedMode: "walking", options: [walking], sourceStatus: "estimated", routeUrl: routeUrl(leg.fromPlaceId, leg.toPlaceId) };
      }
    }
    return estimatedLeg(leg);
  }

  const carKm = BARCELONA_CAR_ROUTE_KM[key];
  if (carKm !== undefined && leg.options.some((option) => option.mode === "car" && option.distanceKm === undefined)) {
    // The car option keeps its own (translated) note when it has one; the distance source is recorded in the data file.
    const options = leg.options.map((option) => (option.mode === "car" && option.distanceKm === undefined ? { ...option, distanceKm: carKm, note: option.note ?? ROUTED_CAR_NOTE } : option));
    return { ...leg, options };
  }
  return leg;
}

/**
 * Accommodation Geo Intelligence -- generic, destination-agnostic haversine distance. Pure math,
 * no Barcelona-specific data. Used ONLY as an internal ranking/tie-break signal (see
 * plannerRouteOptimizer.ts's `preferAccommodationAnchoredStart` and
 * barcelonaClusterCentroids.ts's `nearestBarcelonaCluster`) -- never shown to the customer as a
 * travel time or exact distance (see barcelona-planner-route-legs.ts for the ONLY source of
 * customer-facing transport numbers, which this file has nothing to do with).
 */

export type GeoPoint = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points, in kilometers. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

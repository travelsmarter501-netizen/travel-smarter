/**
 * Lightweight geographic-distance helpers — no external dependency needed.
 * Reused by app/lib/nearby.ts and shared across future destination guides.
 */

export type Coordinates = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points, in kilometers. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** Average lat/lng of a set of real, verified points — e.g. an area's own attractions, used as its "you are here" anchor instead of picking one arbitrary landmark. */
export function centroidOf(points: Coordinates[]): Coordinates | undefined {
  if (points.length === 0) return undefined;
  const sum = points.reduce((acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** Walking-friendly Arabic distance label — "250 م" under 1km, "1.2 كم" / "3 كم" above. Never over-precise. */
export function formatDistanceAr(km: number): string {
  if (km < 1) {
    const meters = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return `${meters} م`;
  }
  if (km < 10) {
    const rounded = Math.round(km * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} كم`;
  }
  return `${Math.round(km)} كم`;
}

/**
 * Reusable "what's nearby" logic, shared across every destination guide.
 * Default behavior is real-geography distance (Haversine); a place can opt out
 * of the automatic result via `overrideIds` (see `Area.nearbyOverrides` in
 * guideTypes.ts) when a maintainer wants to hand-pick the featured nearby list
 * instead — e.g. while coordinates for a category are still unverified.
 */

import { haversineDistanceKm, type Coordinates } from "./geo";

export type NearbyCandidate = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  coordinates?: Coordinates;
  image: string;
  imagePosition?: string;
  href: string;
};

export type NearbyResult<T extends NearbyCandidate> = T & { distanceKm?: number };

const DEFAULT_RADIUS_KM = 2;
const DEFAULT_LIMIT = 5;
/** Below this distance, a candidate is treated as the same physical spot as `current` — even under a different id — and dropped as a duplicate. */
const SAME_PLACE_THRESHOLD_KM = 0.05;

/**
 * Returns nearby places for `current`:
 * 1. Excludes the current place itself (by id — never by name).
 * 2. Also drops any candidate sitting within ~50m of `current` — a different id
 *    can still represent the same real spot (e.g. an area and its own signature
 *    attraction) — and removes duplicate candidates that match each other's coordinates.
 * 3. If `overrideIds` is given, returns exactly those places (still self-excluded
 *    and deduplicated) in the given order — manual curation wins over geography.
 * 4. Otherwise computes real Haversine distance, keeps only candidates within
 *    `radiusKm`, and sorts nearest-first.
 * 5. If `current` has no verified coordinates and no override is given, returns
 *    [] rather than guessing — the caller should show a curated fallback or
 *    nothing, never an invented distance.
 */
export function getNearbyPlaces<T extends NearbyCandidate>(
  current: { id: string; coordinates?: Coordinates },
  candidates: T[],
  options?: { radiusKm?: number; limit?: number; excludeIds?: string[]; overrideIds?: string[] }
): NearbyResult<T>[] {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const excludeIds = new Set<string>([current.id, ...(options?.excludeIds ?? [])]);

  if (options?.overrideIds && options.overrideIds.length > 0) {
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate] as const));
    const seen = new Set<string>();
    const results: NearbyResult<T>[] = [];

    for (const id of options.overrideIds) {
      if (excludeIds.has(id) || seen.has(id)) continue;
      const candidate = byId.get(id);
      if (!candidate) continue;
      seen.add(id);
      const distanceKm =
        current.coordinates && candidate.coordinates ? haversineDistanceKm(current.coordinates, candidate.coordinates) : undefined;
      results.push({ ...candidate, distanceKm });
      if (results.length >= limit) break;
    }
    return results;
  }

  if (!current.coordinates) return [];
  const radiusKm = options?.radiusKm ?? DEFAULT_RADIUS_KM;

  const seenCoordinateKeys = new Set<string>();
  const withDistance: NearbyResult<T>[] = [];

  for (const candidate of candidates) {
    if (excludeIds.has(candidate.id)) continue;
    if (!candidate.coordinates) continue;

    const coordKey = `${candidate.coordinates.lat.toFixed(5)},${candidate.coordinates.lng.toFixed(5)}`;
    if (seenCoordinateKeys.has(coordKey)) continue;

    const distanceKm = haversineDistanceKm(current.coordinates, candidate.coordinates);
    if (distanceKm > radiusKm) continue;
    if (distanceKm < SAME_PLACE_THRESHOLD_KM) continue;

    seenCoordinateKeys.add(coordKey);
    withDistance.push({ ...candidate, distanceKm });
  }

  withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return withDistance.slice(0, limit);
}

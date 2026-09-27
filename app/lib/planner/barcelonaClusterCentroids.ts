import { haversineDistanceKm, type GeoPoint } from "./geoDistance";

/**
 * Accommodation Geo Intelligence -- real cluster centroids, derived from the ALREADY-VERIFIED
 * `coordinates` field on real Guide places (barcelona-guide.ts), averaged per cluster using each
 * place's own cluster assignment in barcelona-planner-metadata.ts -- never invented, never a
 * hand-picked "center of the neighborhood" guess. Computed once via a one-off script that joined
 * every coordinate-bearing Guide place against its cluster id; the count after each entry is how
 * many real places contributed to that average.
 *
 * "seafront-east" is deliberately OMITTED -- its only two member places (bogatell, nova-icaria)
 * have no verified `coordinates` field in the Guide yet, and this table never guesses one. Any
 * feature that needs a "seafront-east" centroid (`nearestBarcelonaCluster` below, or the Day 1
 * start-direction tie-break in plannerRouteOptimizer.ts) simply and safely skips that cluster
 * until a real coordinate is added to the Guide -- the offline keyword matcher
 * (barcelonaAccommodationClusters.ts) still recognizes "poblenou"/"diagonal mar" text
 * independently of this table, so that cluster is not entirely unreachable, just not part of the
 * coordinate-based path yet.
 *
 * Used ONLY as an internal geographic signal -- never displayed to the customer as an exact
 * coordinate or distance.
 */
export const BARCELONA_CLUSTER_CENTROIDS: Record<string, GeoPoint> = {
  born: { lat: 41.38757, lng: 2.18139 }, // ciutadella, arc-de-triomf, palau-musica, santa-maria-del-mar (n=4)
  "city-center": { lat: 41.38667, lng: 2.17 }, // placa-catalunya (n=1)
  "eixample-north": { lat: 41.40736, lng: 2.17525 }, // sagrada-familia, mercat-sagrada-familia, sant-pau (n=3)
  "gracia-north": { lat: 41.41644, lng: 2.15724 }, // park-guell, bunkers-carmel (n=2)
  "les-corts": { lat: 41.38825, lng: 2.11735 }, // camp-nou, monestir-pedralbes, jardins-palau-pedralbes (n=3)
  montjuic: { lat: 41.36844, lng: 2.15357 }, // mnac (n=1)
  "old-city": { lat: 41.382, lng: 2.17467 }, // barcelona-cathedral, la-rambla, gothic-quarter, boqueria, portal-angel (n=5)
  "passeig-gracia": { lat: 41.39343, lng: 2.16329 }, // casa-batllo, casa-mila (n=2)
  seafront: { lat: 41.38014, lng: 2.18744 }, // barceloneta-beach, 1881-sagardi (n=2)
  tibidabo: { lat: 41.4225, lng: 2.11861 }, // tibidabo (n=1)
};

/** Generous Barcelona metro bounding box -- deliberately wide enough to cover every real cluster
 * above (Tibidabo included) without being so wide it would accept a same-named place in a
 * different city or country. */
const BARCELONA_BOUNDS = { minLat: 41.3, maxLat: 41.47, minLng: 2.05, maxLng: 2.25 };

/**
 * Section 4 (Barcelona bias/safety) gate -- rejects any coordinate a geocoding provider returns
 * outside this box, regardless of how confident that provider claims to be. Callers must apply
 * this BEFORE trusting any provider-returned point; never let a misconfigured provider or a
 * same-named place elsewhere in the world silently resolve as if it were in Barcelona.
 */
export function isWithinBarcelonaBounds(point: GeoPoint): boolean {
  return point.lat >= BARCELONA_BOUNDS.minLat && point.lat <= BARCELONA_BOUNDS.maxLat && point.lng >= BARCELONA_BOUNDS.minLng && point.lng <= BARCELONA_BOUNDS.maxLng;
}

/**
 * Deterministic nearest-centroid cluster mapping -- the ONLY path for turning a real, resolved
 * coordinate (from Google Places, once configured) into a planner cluster id; keyword matching
 * (barcelonaAccommodationClusters.ts) is a separate, independent fallback and never the primary
 * path once real coordinates exist. Always returns the closest of the 10 verified centroids
 * above -- callers MUST apply `isWithinBarcelonaBounds` first, so a coordinate genuinely outside
 * Barcelona never reaches this function and gets assigned a nonsensical "nearest" cluster.
 */
export function nearestBarcelonaCluster(point: GeoPoint): { cluster: string; distanceKm: number } {
  let best: { cluster: string; distanceKm: number } | null = null;
  for (const [cluster, centroid] of Object.entries(BARCELONA_CLUSTER_CENTROIDS)) {
    const distanceKm = haversineDistanceKm(point, centroid);
    if (!best || distanceKm < best.distanceKm) best = { cluster, distanceKm };
  }
  return best!;
}

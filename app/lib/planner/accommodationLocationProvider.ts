import "server-only";
import { resolveBarcelonaAccommodationCluster } from "./barcelonaAccommodationClusters";
import { isWithinBarcelonaBounds, nearestBarcelonaCluster } from "./barcelonaClusterCentroids";
import type { GeoPoint } from "./geoDistance";

/**
 * Accommodation Geo Intelligence -- server-side accommodation location resolver.
 *
 * PROVIDER STATUS (Geoapify Live Integration): Geoapify Geocoding ("Search") is the ACTIVE
 * provider -- `GEOAPIFY_API_KEY` is configured in this project's server environment, and
 * `resolveViaGeoapify` below makes real, live requests. `resolveViaGooglePlaces` remains defined
 * below, fully working, and cleanly separated -- kept ONLY as a possible future migration path,
 * never called by `resolveAccommodationLocation` anymore, and never required: accommodation
 * resolution does NOT depend on `GOOGLE_MAPS_API_KEY` existing at all. Both provider functions
 * follow the exact same fail-safe contract: missing key, non-OK HTTP, empty/errored response, a
 * result with no usable geometry, or a network/parse exception all return
 * `{ status: "unresolved" }` -- never a thrown error and never a guessed coordinate.
 */

export type AccommodationLocationSource = "geoapify" | "google_places" | "keyword" | "not_configured";

export type AccommodationLocationResult = {
  status: "resolved" | "unresolved";
  /** The provider's own name for the place (e.g. "W Barcelona"), when resolved via a live provider. */
  displayName?: string;
  /** The provider's own formatted address, when resolved via a live provider. */
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  /** Real planner cluster id (see barcelona-planner-metadata.ts) -- present whenever `status` is
   * "resolved", regardless of which source produced it. */
  plannerCluster?: string;
  source?: AccommodationLocationSource;
  /** "high": a single confident provider match. "medium": either multiple plausible provider
   * candidates (first one used) or the offline keyword fallback (no real coordinates behind it). */
  confidence?: "high" | "medium";
};

// Barcelona center, ~20km radius -- generous enough to cover the whole metro area (including
// far-flung stops like Tibidabo) without being so wide it would bias toward a same-named place
// in a different city. See Section 4 (Barcelona bias/safety) of the Accommodation Geo
// Intelligence task.
const BARCELONA_CENTER: GeoPoint = { lat: 41.3874, lng: 2.1686 };
const LOCATION_BIAS_RADIUS_METERS = 20000;

// Generic hospitality/location words that carry no distinguishing signal for OUR match-quality
// check below -- every customer input is already known to be "a Barcelona-area hotel or
// apartment", so these are stripped from the INPUT side only before comparing against a
// candidate's own (un-stripped) name/address text. Deliberately small and conservative.
const GENERIC_ACCOMMODATION_WORDS = new Set(["hotel", "hotels", "apartment", "apartments", "spa", "barcelona", "spain", "the", "el", "la"]);

// Built from explicit code points (rather than a literal character class in source) to avoid any
// ambiguity about which combining-diacritic characters are actually present in this file --
// U+0300 to U+036F is the full "Combining Diacritical Marks" Unicode block.
const COMBINING_DIACRITICS_PATTERN = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");

function normalizeToTokens(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_PATTERN, "") // strip accents (à->a, ï->i, etc.)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Match-quality gate (Geoapify Live Integration) -- Geoapify's own `rank.confidence` field turned
 * out, on live testing, to be an unreliable signal by itself: a genuinely correct match (e.g.
 * "W Barcelona" -> the real W Barcelona hotel) can score `confidence: 0` (Geoapify's
 * `match_type: "inner_part"` -- only part of the query string matched), while a genuinely WRONG
 * match for garbage input (e.g. "my amazing hotel barcelona xyz" -> an unrelated real hotel,
 * "May Ramblas Hotel") can ALSO score `confidence: 0` yet still come back as `match_type:
 * "full_match"`. A flat confidence threshold could not distinguish these two real, observed
 * cases without wrongly rejecting the correct one.
 *
 * Instead: strip generic hospitality/location words from the CUSTOMER'S input, then require at
 * least half of what's left to appear as exact tokens somewhere in the candidate's own
 * name+formatted-address text (kept intact, never stripped, so a street/number in an address
 * query can still match). This directly tests "does Geoapify's answer actually resemble what the
 * customer typed", which is the real question -- not an opaque ML score. Verified against every
 * required test case: passes W Barcelona, Hotel Arts, Majestic Hotel & Spa, Catalonia Sagrada
 * Familia, and both real addresses; rejects the garbage-input case. Like every other gate here,
 * this can only ever make resolution MORE conservative, never invent a coordinate.
 */
function matchesInputCloselyEnough(inputText: string, candidateName: string | undefined, candidateFormatted: string | undefined): boolean {
  const meaningfulInputTokens = normalizeToTokens(inputText).filter((token) => !GENERIC_ACCOMMODATION_WORDS.has(token));
  if (meaningfulInputTokens.length === 0) return false; // input was purely generic words -- too vague to trust any match

  const candidateTokens = new Set(normalizeToTokens([candidateName, candidateFormatted].filter(Boolean).join(" ")));
  if (candidateTokens.size === 0) return false;

  const overlap = meaningfulInputTokens.filter((token) => candidateTokens.has(token)).length;
  return overlap / meaningfulInputTokens.length >= 0.5;
}

/**
 * Real, ACTIVE Geoapify Geocoding ("Search") call -- the current default provider (Geoapify Live
 * Integration). One endpoint handles both a hotel/place name ("W Barcelona") and a full street
 * address ("Carrer de Mallorca 401, Barcelona") -- Geoapify's geocoder is backed by OpenStreetMap
 * + other place datasets, which include named businesses/POIs, not just addresses.
 * `type: "amenity"` biases toward named places/businesses (verified live: it does NOT break
 * plain address queries -- Geoapify still returns the correct building/address match when no
 * amenity fits, it just isn't a hard category filter).
 *
 * Barcelona safety (Section 4): `filter=circle:...` is a HARD geographic filter -- Geoapify will
 * not even consider a result outside that circle -- and `bias=proximity:...` additionally ranks
 * in-city matches first among whatever the hard filter allows. On top of that, every returned
 * coordinate is STILL re-checked against `isWithinBarcelonaBounds`, and every returned match is
 * re-checked against `matchesInputCloselyEnough` above, before being trusted -- never rely on a
 * single provider's own filter or confidence score alone for a city-scoped product.
 *
 * Fails safe on every error path: missing key, non-OK HTTP response, an empty/errored response,
 * a result with no usable lat/lon, a result that doesn't genuinely resemble what the customer
 * typed, or a network/parse exception all return `{ status: "unresolved" }` -- never a thrown
 * error (which would abort plan generation) and never a guessed coordinate.
 */
async function resolveViaGeoapify(text: string): Promise<AccommodationLocationResult> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return { status: "unresolved", source: "not_configured" };

  try {
    const params = new URLSearchParams({
      text,
      type: "amenity",
      filter: `circle:${BARCELONA_CENTER.lng},${BARCELONA_CENTER.lat},${LOCATION_BIAS_RADIUS_METERS}`,
      bias: `proximity:${BARCELONA_CENTER.lng},${BARCELONA_CENTER.lat}`,
      limit: "1",
      format: "json",
      apiKey,
    });
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`);
    if (!response.ok) return { status: "unresolved", source: "geoapify" };

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) return { status: "unresolved", source: "geoapify" };

    const result = results[0];
    if (typeof result?.lat !== "number" || typeof result?.lon !== "number") {
      return { status: "unresolved", source: "geoapify" };
    }
    const point: GeoPoint = { lat: result.lat, lng: result.lon };
    if (!isWithinBarcelonaBounds(point)) {
      // Section 4: never trust a result outside Barcelona, regardless of Geoapify's own filter.
      return { status: "unresolved", source: "geoapify" };
    }

    const displayName = typeof result.name === "string" ? result.name : typeof result.address_line1 === "string" ? result.address_line1 : undefined;
    const formattedAddress = typeof result.formatted === "string" ? result.formatted : undefined;
    if (!matchesInputCloselyEnough(text, displayName, formattedAddress)) {
      // Geoapify returned SOMETHING, but it doesn't genuinely resemble what the customer typed --
      // never trust a low-quality fuzzy fallback match. See this function's own doc comment.
      return { status: "unresolved", source: "geoapify" };
    }

    const confidenceScore = typeof result.rank?.confidence === "number" ? result.rank.confidence : 0;
    return {
      status: "resolved",
      displayName,
      formattedAddress,
      latitude: point.lat,
      longitude: point.lng,
      source: "geoapify",
      confidence: confidenceScore >= 0.8 ? "high" : "medium",
    };
  } catch {
    return { status: "unresolved", source: "geoapify" };
  }
}

/**
 * Real Google Places "Find Place From Text" call -- NOT currently invoked by
 * `resolveAccommodationLocation` (Geoapify Live Integration made Geoapify the active provider;
 * see Section 3 of that task -- accommodation resolution no longer depends on
 * `GOOGLE_MAPS_API_KEY` existing at all). Kept fully working and cleanly separated only as a
 * possible future migration path. Biased to Barcelona via `locationbias`, and every returned
 * coordinate is re-checked against `isWithinBarcelonaBounds` regardless of what Google itself
 * reports -- never trust a single provider's own confidence blindly for a city-scoped product.
 *
 * Fails safe on every error path: missing key, non-OK HTTP response, an empty/errored Google
 * response, a candidate with no geometry, or a network/parse exception all return
 * `{ status: "unresolved" }` -- never a thrown error (which would abort plan generation) and
 * never a guessed coordinate.
 */
export async function resolveViaGooglePlaces(text: string): Promise<AccommodationLocationResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { status: "unresolved", source: "not_configured" };

  try {
    const params = new URLSearchParams({
      input: text,
      inputtype: "textquery",
      fields: "name,formatted_address,geometry",
      locationbias: `circle:${LOCATION_BIAS_RADIUS_METERS}@${BARCELONA_CENTER.lat},${BARCELONA_CENTER.lng}`,
      key: apiKey,
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`);
    if (!response.ok) return { status: "unresolved", source: "google_places" };

    const data = await response.json();
    if (data?.status !== "OK" || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      return { status: "unresolved", source: "google_places" };
    }

    const candidate = data.candidates[0];
    const rawPoint = candidate?.geometry?.location;
    if (typeof rawPoint?.lat !== "number" || typeof rawPoint?.lng !== "number") {
      return { status: "unresolved", source: "google_places" };
    }
    const point: GeoPoint = { lat: rawPoint.lat, lng: rawPoint.lng };
    if (!isWithinBarcelonaBounds(point)) {
      // Section 4: never trust a result outside Barcelona, regardless of Google's own confidence.
      return { status: "unresolved", source: "google_places" };
    }

    return {
      status: "resolved",
      displayName: typeof candidate.name === "string" ? candidate.name : undefined,
      formattedAddress: typeof candidate.formatted_address === "string" ? candidate.formatted_address : undefined,
      latitude: point.lat,
      longitude: point.lng,
      source: "google_places",
      confidence: data.candidates.length === 1 ? "high" : "medium",
    };
  } catch {
    return { status: "unresolved", source: "google_places" };
  }
}

/**
 * Accommodation Geo Intelligence -- the single entry point for turning a customer's raw
 * hotel/apartment text into a real, trustworthy location. Order (Geoapify Live Integration):
 *   1. Geoapify (when `GEOAPIFY_API_KEY` is configured -- the ACTIVE provider today) -- real
 *      coordinates, mapped to a planner cluster via nearest-centroid (`nearestBarcelonaCluster`).
 *   2. The existing offline keyword matcher (`resolveBarcelonaAccommodationCluster`), kept ONLY
 *      as a conservative fallback -- no coordinates, "medium" confidence -- used ONLY when
 *      Geoapify came back unresolved; it never overwrites a valid Geoapify result.
 *   3. Unresolved -- never guessed, never a fabricated coordinate or cluster.
 *
 * Never throws; safe to call unconditionally whenever the customer entered accommodation text.
 */
export async function resolveAccommodationLocation(text: string): Promise<AccommodationLocationResult> {
  const trimmed = text.trim();
  if (!trimmed) return { status: "unresolved" };

  const geoapifyResult = await resolveViaGeoapify(trimmed);
  if (geoapifyResult.status === "resolved" && geoapifyResult.latitude !== undefined && geoapifyResult.longitude !== undefined) {
    const nearest = nearestBarcelonaCluster({ lat: geoapifyResult.latitude, lng: geoapifyResult.longitude });
    return { ...geoapifyResult, plannerCluster: nearest.cluster };
  }

  const keywordCluster = resolveBarcelonaAccommodationCluster(trimmed);
  if (keywordCluster) {
    return { status: "resolved", plannerCluster: keywordCluster, source: "keyword", confidence: "medium" };
  }

  return { status: "unresolved", source: geoapifyResult.source };
}

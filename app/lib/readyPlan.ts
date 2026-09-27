import { formatDistanceAr } from "./geo";
import type { Attraction, Area, Beach, Experience, FoodPlace, NightlifeVenue, ShoppingArea } from "./guideTypes";
import type { ItineraryStop, ReadyPlanPlaceType, TransportMode, TransportOption } from "./readyPlanTypes";

/**
 * Resolves an itinerary stop's `placeId` against the real, existing guide data —
 * this is the ONLY place that should read attractions/foodPlaces/experiences/nightlifeVenues
 * for the Ready Plan / Smart Planner features, so there is exactly one source of truth for
 * place details.
 */
export type ResolvedPlace =
  | { type: "attraction"; place: Attraction; areaName: string }
  | { type: "food"; place: FoodPlace }
  | { type: "experience"; place: Experience }
  | { type: "nightlife"; place: NightlifeVenue }
  | { type: "beach"; place: Beach }
  | { type: "shopping"; place: ShoppingArea };

/** Everything `resolvePlace` can read from — every field beyond `attractions`/`foodPlaces`/`experiences`/`areas` is optional so existing callers (Ready Plan, MustSee Selector, ...) that only ever resolve "attraction"/"food"/"experience" keep compiling and behaving identically without passing it. */
type ResolvableGuide = {
  attractions: Attraction[];
  foodPlaces: FoodPlace[];
  experiences: Experience[];
  areas: Area[];
  nightlifeVenues?: NightlifeVenue[];
  beaches?: Beach[];
  shoppingAreas?: ShoppingArea[];
};

/**
 * `nightlifeVenues`/`beaches`/`shoppingAreas` are optional on the guide param — most existing
 * callers never resolve those types and don't need to pass them; resolving a type whose array
 * is absent simply returns undefined, never throws.
 */
export function resolvePlace(placeId: string, placeType: ReadyPlanPlaceType, guide: ResolvableGuide): ResolvedPlace | undefined {
  if (placeType === "attraction") {
    const place = guide.attractions.find((item) => item.id === placeId);
    if (!place) return undefined;
    const area = guide.areas.find((item) => item.id === place.areaId);
    return { type: "attraction", place, areaName: area?.name ?? "" };
  }
  if (placeType === "food") {
    const place = guide.foodPlaces.find((item) => item.id === placeId);
    return place ? { type: "food", place } : undefined;
  }
  if (placeType === "nightlife") {
    const place = (guide.nightlifeVenues ?? []).find((item) => item.id === placeId);
    return place ? { type: "nightlife", place } : undefined;
  }
  if (placeType === "beach") {
    const place = (guide.beaches ?? []).find((item) => item.id === placeId);
    return place ? { type: "beach", place } : undefined;
  }
  if (placeType === "shopping") {
    const place = (guide.shoppingAreas ?? []).find((item) => item.id === placeId);
    return place ? { type: "shopping", place } : undefined;
  }
  const place = guide.experiences.find((item) => item.id === placeId);
  return place ? { type: "experience", place } : undefined;
}

/**
 * Every guide-place type a Smart Planner main stop can actually be, in a fixed resolution
 * order — attraction first (so a place like barceloneta-beach, listed both as a real
 * Attraction AND in `beaches`, keeps resolving to its richer Attraction card, unchanged from
 * today), then beach, then shopping, then experience (e.g. a bookable activity like a cooking
 * class — see the "Smart Planner Unresolved Transport Audit" / "Pre-Launch Critical Fixes"
 * tasks, which found planner metadata referencing an Experience-type place with no matching
 * entry here, causing it to silently vanish from the rendered plan despite still being counted
 * in the day's totals/transport/warnings). Deliberately still does NOT include food/nightlife:
 * no current or anticipated planner metadata uses those as main stops, and treating them as
 * valid main-stop types would let something like a restaurant silently become a "main stop" if
 * metadata ever referenced one by mistake, which is exactly the kind of silent failure this
 * order exists to prevent. Extend this order, not resolvePlannerPlace's shape, if a future
 * destination's metadata legitimately needs another type.
 */
const MAIN_STOP_RESOLUTION_ORDER: readonly ReadyPlanPlaceType[] = ["attraction", "beach", "shopping", "experience"];

/**
 * Resolves a Smart Planner MAIN stop generically: `PlannerPlaceMetadata` (see
 * lib/planner/plannerTypes.ts) carries only a `placeId`, never a place type, so unlike
 * `resolvePlace` above (which requires the caller to already know the type) this tries each
 * type in `MAIN_STOP_RESOLUTION_ORDER` and returns the first match — mirroring the same
 * multi-type-fallback shape `SmartPlannerDay.tsx` already used for optional-nearby suggestions
 * before this fix, now applied to main stops too.
 */
export function resolvePlannerPlace(placeId: string, guide: ResolvableGuide): ResolvedPlace | undefined {
  for (const placeType of MAIN_STOP_RESOLUTION_ORDER) {
    const resolved = resolvePlace(placeId, placeType, guide);
    if (resolved) return resolved;
  }
  return undefined;
}

/** A normalized view of a resolved place, just for the compact card + schematic map — never a replacement for the real detail view. */
export type ResolvedPlaceSummary = {
  id: string;
  name: string;
  image?: string;
  imagePosition?: string;
  categoryLabel: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
};

const CATEGORY_LABELS: Record<ReadyPlanPlaceType, string> = {
  attraction: "معلم سياحي",
  food: "مطعم / مقهى",
  experience: "تجربة",
  nightlife: "سهر ليلي",
  beach: "شاطئ",
  shopping: "تسوق",
};

/**
 * Built with an explicit per-type switch, not a blanket `resolved.place.imagePosition` /
 * `.address` access — `ShoppingArea` has no `imagePosition` field at all (see guideTypes.ts),
 * so accessing it across the whole `ResolvedPlace` union without narrowing would either be a
 * type error or silently rely on an `any`. Every branch pulls only fields its own guide type
 * actually declares — never invents one that isn't there.
 */
export function summarizeResolvedPlace(resolved: ResolvedPlace): ResolvedPlaceSummary {
  const base = { id: resolved.place.id, name: resolved.place.name, image: resolved.place.image, categoryLabel: CATEGORY_LABELS[resolved.type] };
  switch (resolved.type) {
    case "attraction":
      return { ...base, imagePosition: resolved.place.imagePosition, address: resolved.place.address, coordinates: resolved.place.coordinates };
    case "food":
    case "experience":
    case "nightlife":
    case "beach":
      return { ...base, imagePosition: resolved.place.imagePosition, address: resolved.place.address };
    case "shopping":
      return { ...base, address: resolved.place.address };
  }
}

/** "دقيقة واحدة" / "دقيقتان" / "٣-١٠ دقائق" / "١١+ دقيقة" — standard Arabic numeral-noun agreement. */
export function formatMinutesAr(minutes: number): string {
  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
}

/** Compact "24 دقيقة · 1.8 كم" style label for a transport option. */
export function formatTransportOptionLabel(option: TransportOption): string {
  const parts: string[] = [];
  if (option.durationMinutes !== undefined) parts.push(formatMinutesAr(option.durationMinutes));
  else if (option.durationLabel) parts.push(option.durationLabel);
  if (option.distanceKm !== undefined) parts.push(formatDistanceAr(option.distanceKm));
  return parts.join(" · ");
}

const GOOGLE_TRAVEL_MODE_PARAM: Record<TransportMode, string> = {
  walking: "walking",
  transit: "transit",
  car: "driving",
};

/** Apple Maps' documented `dirflg` values: d = driving, w = walking, r = public transit ("r" is Apple's own historical code for transit). */
const APPLE_DIRFLG_PARAM: Record<TransportMode, string> = {
  walking: "w",
  transit: "r",
  car: "d",
};

/**
 * Resolves the origin/destination point for a maps URL. Prefers real, verified coordinates
 * when the place has them (currently only attractions do); falls back to the place's real
 * address, then its name — never an invented coordinate. Shared by both map providers below.
 */
function directionsPointParam(point: ResolvedPlaceSummary): string {
  return point.coordinates ? `${point.coordinates.lat},${point.coordinates.lng}` : (point.address ?? `${point.name}, Barcelona, Spain`);
}

/** Builds a Google Maps directions URL between two resolved places. */
export function buildDirectionsUrl(from: ResolvedPlaceSummary, to: ResolvedPlaceSummary, mode: TransportMode): string {
  const params = new URLSearchParams({
    api: "1",
    origin: directionsPointParam(from),
    destination: directionsPointParam(to),
    travelmode: GOOGLE_TRAVEL_MODE_PARAM[mode],
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Builds an Apple Maps directions URL between two resolved places, using Apple's own
 * `maps.apple.com` web-link scheme (saddr/daddr/dirflg) — not embedded, opens externally.
 */
export function buildAppleMapsDirectionsUrl(from: ResolvedPlaceSummary, to: ResolvedPlaceSummary, mode: TransportMode): string {
  const params = new URLSearchParams({
    saddr: directionsPointParam(from),
    daddr: directionsPointParam(to),
    dirflg: APPLE_DIRFLG_PARAM[mode],
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

export const READY_PLAN_TRANSPORT_DISCLAIMER = "أوقات التنقل تقريبية وقد تتغير حسب الزحمة ووقت الانتظار.";

export type { ItineraryStop };

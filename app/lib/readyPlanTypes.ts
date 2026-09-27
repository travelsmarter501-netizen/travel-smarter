/**
 * Types for the "Ready Plan" itinerary feature (e.g. Barcelona 3-Day Ready Plan).
 * Kept separate from guideTypes.ts on purpose: this feature never stores place
 * data (name/image/address/hours/price/rating/...) — it only references existing
 * place ids from barcelona-guide.ts and resolves them at render time, plus its
 * own itinerary-specific metadata (suggested duration, notes) and transport legs.
 */

/**
 * Which existing guide array a stop's `placeId` should be resolved against. "nightlife" was
 * added for the Smart Planner's optional nearby suggestions (see resolvePlace in
 * readyPlan.ts) — purely additive, no existing Ready Plan data uses it, so existing Ready
 * Plan behavior is unaffected. "beach" and "shopping" were added for the Smart Planner's main
 * stops (see resolvePlannerPlace in readyPlan.ts) — same reasoning: purely additive, matches
 * the names already established by useFavorites.ts's FavoriteType, no existing Ready Plan
 * itinerary data references either.
 */
export type ReadyPlanPlaceType = "attraction" | "food" | "experience" | "nightlife" | "beach" | "shopping";

export type ItineraryStop = {
  placeId: string;
  placeType: ReadyPlanPlaceType;
  /** Shown on the place card/details only when explicitly set — never invented. */
  suggestedDuration?: string;
  /** Short itinerary-specific note, e.g. "أفضل وقت: قبل الغروب" or "يفضل الحجز مسبقًا". */
  note?: string;
  /** e.g. "عشاء" for an end-of-day dinner stop — optional flavor text, not a data field duplicate. */
  role?: string;
};

export type TransportMode = "walking" | "transit" | "car";

export type TransportOption = {
  mode: TransportMode;
  durationMinutes?: number;
  durationLabel?: string;
  distanceKm?: number;
  details?: string;
};

export type RouteLeg = {
  fromPlaceId: string;
  toPlaceId: string;
  recommendedMode: TransportMode;
  options: {
    walking?: TransportOption;
    transit?: TransportOption;
    car?: TransportOption;
  };
};

/** An optional nearby suggestion shown alongside (not inside) the main route — never a mandatory stop. */
export type OptionalNearbyStop = {
  placeId: string;
  placeType: ReadyPlanPlaceType;
};

export type ReadyPlanDay = {
  id: string;
  label: string;
  /** Short customer-facing day title, e.g. "Gaudí والمناظر 🌇". */
  theme: string;
  /** Optional one-line description shown under the title — must match the day's actual content, never generic/repeated boilerplate. */
  summary?: string;
  stops: ItineraryStop[];
  /** One leg between each consecutive pair of stops — length === stops.length - 1. */
  legs: RouteLeg[];
  optionalNearby?: OptionalNearbyStop[];
};

export type ReadyPlan = {
  slug: string;
  title: string;
  subtitle: string;
  /** Commercial-UI display price only — not yet backed by a `products` table row. See app/lib/barcelona-ready-plan.ts. */
  priceILS: number;
  days: ReadyPlanDay[];
};

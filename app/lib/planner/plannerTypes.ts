/**
 * Types for the Barcelona Smart Planner metadata layer.
 *
 * This is metadata ONLY — no scoring logic, no UI, no AI. It describes how existing
 * places (referenced by `placeId` only) relate to visitor interests, so a future
 * planner algorithm can use it. It never duplicates place data (name/address/hours/
 * image/rating/price/maps links/description) — see app/lib/barcelona-guide.ts for that.
 */

export type PlannerInterest =
  | "popular"
  | "cultureLocal"
  | "viewsNature"
  | "beachRelax"
  | "footballExperiences"
  | "foodShoppingNightlife";

/** Every valid interest value — the runtime source of truth for validating unknown input (forms, APIs, etc). */
export const PLANNER_INTERESTS: readonly PlannerInterest[] = [
  "popular",
  "cultureLocal",
  "viewsNature",
  "beachRelax",
  "footballExperiences",
  "foodShoppingNightlife",
];

export type PreferredTime =
  | "morning"
  | "daytime"
  | "afternoon"
  | "evening"
  | "sunset"
  | "anytime"
  | "morning/daytime"
  | "daytime/evening"
  | "morning/afternoon"
  | "daytime/sunset";

export type PlannerPlaceMetadata = {
  placeId: string;
  weights: Record<PlannerInterest, number>;
  priority: number;
  preferredTime: PreferredTime;
  cluster: string;
  visitDurationMinutes: number;
};

/**
 * V1: where the customer is staying, as free text only — no coordinates, no geocoding.
 * `cluster` is resolved deterministically (see barcelonaAccommodationClusters.ts) from
 * `text` at the moment the customer types it, and is `null` (never guessed) when no pattern
 * confidently matches. This is purely an ORDERING nudge input for the Barcelona-specific
 * orchestration layer (see generateBarcelonaSmartPlan.ts) — it is never read by
 * plannerScoring.ts, plannerDayBuilder.ts's selection logic, or plannerRouteOptimizer.ts,
 * so it can never change which places are selected.
 */
export type PlannerAccommodation = {
  /** Customer-entered hotel name or address, exactly as typed — the only copy ever displayed back to them. */
  text: string;
  /** Whether the customer wants accommodation used as a daily ordering anchor. Defaults to true in the UI. */
  useAsDailyAnchor: boolean;
  /** Resolved planner cluster id, or null if `text` could not be confidently mapped. Never guessed. */
  cluster?: string | null;
  /** Accommodation Geo Intelligence — real coordinates when resolved via a live geocoding
   * provider (Geoapify, the active provider as of Geoapify Live Integration — see
   * accommodationLocationProvider.ts). Undefined when resolution used the offline keyword
   * fallback or failed entirely — never guessed. Optional/backward-compatible: a
   * PlannerAccommodation built before this field existed (or read back from an old frozen saved
   * plan) simply omits it, and every consumer treats that the same as "no coordinates". */
  coordinates?: { lat: number; lng: number } | null;
  /** The provider's own formatted address/display name, when available — for optional display
   * only; the raw `text` above remains the sole copy ever shown back to the customer as "what
   * you typed". */
  formattedAddress?: string | null;
  /** How `cluster` was actually determined — lets downstream code/audits distinguish a real
   * geocoded result (Geoapify) from the offline keyword fallback, or a failed resolution.
   * "google_places" is kept in the type for backward compatibility with any object built while
   * that provider was active; it is never produced by current code. */
  resolutionSource?: "geoapify" | "google_places" | "keyword" | null;
};

/**
 * Visitor-selected inputs to the scoring engine (see plannerScoring.ts) and Day Builder
 * (see plannerDayBuilder.ts). V1.3: interests + mustVisit — still no budget, walking
 * preference, or excludedPlaces. V1.4: optional accommodation (see PlannerAccommodation) —
 * an ordering-only nudge, never a scoring or selection input. V1.5: optional primaryInterest
 * — an explicit customer intent signal (never inferred from array/click order, which is not
 * a safe source — see generateBarcelonaSmartPlan.ts's normalization and
 * smartPlannerSavedPlans.ts's alphabetical sort). It does NOT change plannerScoring.ts's
 * formula at all; it only gates one narrow, optional mechanism in plannerDayBuilder.ts (a
 * long-experience reservation preference — see `isEligibleLongExperience` there), and never
 * overrides must-visits, cluster compatibility, similarity caps, or the 420-minute cap.
 */
export type PlannerPreferences = {
  /** 1 to 6 interests (all of them may be selected together), no duplicates. */
  interests: PlannerInterest[];
  /**
   * Optional placeIds, no duplicates, each must exist in the destination's planner metadata.
   * No artificial UI cap — validated instead against a 3-day trip's real physical capacity
   * (12-18 main stops, see validatePlannerPreferences in plannerScoring.ts), which rejects an
   * over-capacity selection with a clear message rather than generating an impossible plan.
   * A REAL Day Builder guarantee (see applyCoverageRepairs), not a UI-only label — every valid
   * mustVisit place is guaranteed to appear exactly once in the generated plan, or generation
   * fails with a typed error rather than silently dropping one.
   */
  mustVisit?: string[];
  /** Optional — omitted entirely when the customer hasn't provided accommodation. */
  accommodation?: PlannerAccommodation;
  /**
   * Optional — which of the SELECTED `interests` matters most for this trip. Must also be
   * present in `interests` when set; callers should normalize an inconsistent combination to
   * `undefined` rather than reject it outright (see generateBarcelonaSmartPlan.ts).
   */
  primaryInterest?: PlannerInterest;
};

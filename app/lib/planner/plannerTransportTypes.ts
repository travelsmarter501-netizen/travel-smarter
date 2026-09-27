/**
 * Barcelona Smart Planner — Route Legs / Transport Layer V1 — shared types.
 *
 * Describes transport between two already-ordered stops. This layer never estimates live
 * travel times, calls a maps API, or invents numbers — every leg is either reused from
 * already-verified project data, freshly verified by hand against Google/Apple Maps during
 * a specific task (and recorded as such), or explicitly left unresolved.
 */

export type TransportMode = "walking" | "transit" | "car";

export type TransportOption = {
  mode: TransportMode;
  durationMinutesMin: number;
  durationMinutesMax: number;
  /** Straight source-to-destination path distance, when known. Not always available (e.g. transit). */
  distanceKm?: number;
  /** Free-text caveat carried over from the source data (elevation, single-source-only, high variance between sources, etc). */
  note?: string;
};

export type RouteLegSourceStatus =
  /** Manually checked against Google/Apple Maps directions during the task that added it. */
  | "verified"
  /** Reused from other already-verified project data (e.g. the Ready Plan) — not re-verified in the current task. */
  | "existing-project-data"
  /** No known/verified data for this exact pair — never fabricated. */
  | "unresolved";

/** One transport leg between two consecutive stops in an itinerary. */
export type PlannerRouteLeg = {
  fromPlaceId: string;
  toPlaceId: string;
  /** null when unresolved — there is nothing known to recommend. */
  recommendedMode: TransportMode | null;
  options: TransportOption[];
  sourceStatus: RouteLegSourceStatus;
};

/**
 * One entry in a destination's known route-leg data table (the input to `buildPlannerRouteLegs`).
 * Only ever "verified" or "existing-project-data" — an entry that doesn't exist yet simply isn't
 * in the table, and the builder reports that pair as "unresolved" on its own.
 */
export type RouteLegDataEntry = {
  fromPlaceId: string;
  toPlaceId: string;
  /** Optional — if omitted, the builder derives a sensible mode from the available options (see `chooseRecommendedMode`). */
  recommendedMode?: TransportMode;
  options: TransportOption[];
  sourceStatus: Exclude<RouteLegSourceStatus, "unresolved">;
  /**
   * If true, the REVERSE direction (toPlaceId -> fromPlaceId) may reuse ONLY this entry's
   * walking option (never transit/car — travel time by those modes is never assumed
   * symmetric; see the "matching" rules in the task spec). Opt-in per entry, and only safe
   * for short/flat paths with no known elevation or one-way-street asymmetry — an entry with
   * an elevation/stairs note should leave this false/omitted.
   */
  allowReverseWalkingReuse?: boolean;
};

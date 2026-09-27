/**
 * Barcelona Smart Planner — Presentation layer V1 — shared, destination-agnostic types.
 *
 * Presentation is a pure ADD-ON: it never changes which places are selected, which day they
 * land on, their order, or their transport legs (see plannerDayBuilder.ts / plannerRouteOptimizer.ts
 * / plannerRouteLegs.ts for the actual itinerary — none of that is touched by this layer). This
 * module only describes how to talk about an already-finished GeneratedPlannerPlan: a title, a
 * one-line summary, an optional highlight, and a small set of optional "nearby" suggestions per
 * day — all deterministically derived from the plan's own stops/clusters plus the visitor's
 * selected interests and existing guide data (see barcelona-planner-presentation.ts for the
 * actual Barcelona rules). Nothing here is randomized, estimated live, or AI-generated.
 */

export type PlannerOptionalSuggestionType = "food" | "cafe" | "nightlife" | "experience" | "photo" | "local";

/**
 * A single optional "nearby" recommendation. Only ever references an existing guide placeId —
 * never duplicates name/address/hours/image/rating/maps links, which the guide data (and the
 * existing PlaceDetailsSheet click-through) already owns.
 */
export type PlannerOptionalSuggestion = {
  placeId: string;
  type: PlannerOptionalSuggestionType;
  /** Short, deterministic, human-facing reason — never a claim not backed by real data. */
  reason?: string;
};

/**
 * Presentation content for one day. `highlight` is optional by design: it is only ever set
 * when genuinely supported by the day's actual stops/preferences (see
 * barcelona-planner-presentation.ts) — never invented just to fill the field.
 */
export type PlannerDayPresentation = {
  title: string;
  summary: string;
  highlight?: string;
  optionalNearby: PlannerOptionalSuggestion[];
};

/**
 * The presentation layer's own output — always paired with the GeneratedPlannerPlan it was
 * built from. `byDay[i]` corresponds to `plan.days[i]` (and `legsByDay[i]`) — same order, same
 * length, never reordered or filtered by presentation.
 */
export type PresentedPlannerPlan = {
  byDay: PlannerDayPresentation[];
};

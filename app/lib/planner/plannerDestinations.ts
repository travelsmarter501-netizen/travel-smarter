/**
 * Unified Personalized Plan -- the destination picker's data source (Step 1, "وين مسافر؟").
 *
 * Deliberately a small, self-contained, UI-only list -- NOT the same thing as
 * `DestinationConfig` (destinationConfig.ts), which is the planner ENGINE's per-destination
 * config shape. This file only answers "what can the destination-selection step show and which
 * one is actually clickable" -- it carries no planner metadata, no day-builder config, nothing
 * engine-related. Wiring a new destination into the real product still requires its own
 * `DestinationConfig` (see barcelonaV2DestinationConfig.ts for the only one that exists today)
 * and its own Server Action branch -- adding a row here alone does not "add" a destination.
 *
 * A plain module (no "use client", no "server-only") so it can be imported from the client
 * wizard component and, later, from any server-rendered destination-aware page alike.
 */

export type PlannerDestinationOption = {
  id: string;
  name: string;
  flag: string;
  available: boolean;
};

/** Barcelona is the only real, generation-capable destination right now (see
 * generateBarcelonaPlanV2Action's own `destinationId !== "barcelona"` rejection). Every other
 * entry is shown for real product positioning ("more cities are coming") but is never
 * selectable and never routes anywhere -- selecting one is a no-op in the UI. */
export const PLANNER_DESTINATIONS: PlannerDestinationOption[] = [
  { id: "barcelona", name: "برشلونة", flag: "🇪🇸", available: true },
  { id: "rome", name: "روما", flag: "🇮🇹", available: false },
  { id: "prague", name: "براغ", flag: "🇨🇿", available: false },
  { id: "budapest", name: "بودابست", flag: "🇭🇺", available: false },
  { id: "dubai", name: "دبي", flag: "🇦🇪", available: false },
  { id: "batumi", name: "باتومي", flag: "🇬🇪", available: false },
  { id: "istanbul", name: "إسطنبول", flag: "🇹🇷", available: false },
  { id: "vienna", name: "فيينا", flag: "🇦🇹", available: false },
  { id: "paris", name: "باريس", flag: "🇫🇷", available: false },
  { id: "london", name: "لندن", flag: "🇬🇧", available: false },
];

export const DEFAULT_PLANNER_DESTINATION_ID = "barcelona";

export function isKnownPlannerDestinationId(value: string | null | undefined): boolean {
  return !!value && PLANNER_DESTINATIONS.some((d) => d.id === value);
}

export function isAvailablePlannerDestinationId(value: string | null | undefined): boolean {
  return !!value && PLANNER_DESTINATIONS.some((d) => d.id === value && d.available);
}

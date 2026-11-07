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

import { isReleaseExcludedDestination } from "../releaseScope";

export type PlannerDestinationOption = {
  id: string;
  name: string;
  nameEn: string;
  nameHe: string;
  flag: string;
  /** PUBLIC purchase availability. Only a city whose generation, saving, display, editing and quality checks all pass gets true. */
  available: boolean;
};

/** Barcelona is the only real, generation-capable destination right now (see
 * generateBarcelonaPlanV2Action's own `destinationId !== "barcelona"` rejection). Every other
 * entry is shown for real product positioning ("more cities are coming") but is never
 * selectable and never routes anywhere -- selecting one is a no-op in the UI. */
export const PLANNER_DESTINATIONS: PlannerDestinationOption[] = [
  { id: "barcelona", name: "برشلونة", nameEn: "Barcelona", nameHe: "ברצלונה", flag: "🇪🇸", available: true },
  { id: "rome", name: "روما", nameEn: "Rome", nameHe: "רומא", flag: "🇮🇹", available: false },
  // Prague: planner data + engine module exist (lib/planner/prague/); NOT public until its launch checks pass (docs/PROJECT_PLAN.md).
  { id: "prague", name: "براغ", nameEn: "Prague", nameHe: "פראג", flag: "🇨🇿", available: false },
  { id: "budapest", name: "بودابست", nameEn: "Budapest", nameHe: "בודפשט", flag: "🇭🇺", available: false },
  { id: "dubai", name: "دبي", nameEn: "Dubai", nameHe: "דובאי", flag: "🇦🇪", available: false },
  { id: "batumi", name: "باتومي", nameEn: "Batumi", nameHe: "בטומי", flag: "🇬🇪", available: false },
  { id: "istanbul", name: "إسطنبول", nameEn: "Istanbul", nameHe: "איסטנבול", flag: "🇹🇷", available: false },
  // Vienna: planner data + engine module exist (lib/planner/vienna/); NOT public until its launch checks pass (docs/PROJECT_PLAN.md).
  { id: "vienna", name: "فيينا", nameEn: "Vienna", nameHe: "וינה", flag: "🇦🇹", available: false },
  { id: "paris", name: "باريس", nameEn: "Paris", nameHe: "פריז", flag: "🇫🇷", available: false },
  { id: "london", name: "لندن", nameEn: "London", nameHe: "לונדון", flag: "🇬🇧", available: false },
];

export const DEFAULT_PLANNER_DESTINATION_ID = "barcelona";

export function isKnownPlannerDestinationId(value: string | null | undefined): boolean {
  return !!value && PLANNER_DESTINATIONS.some((d) => d.id === value);
}

/**
 * Multi-city foundation -- LOCAL PREVIEW ONLY. A city that is not publicly available (`available: false`) can be switched
 * on for local testing with NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=prague (comma-separated ids) in the environment of a
 * local `next dev` / `next build`. It is never honoured on the server when running on Vercel (`VERCEL` is set there in
 * every environment), so the server rejects a preview city in production even if the variable were set by mistake --
 * public purchase availability is only ever the `available` flag above. Do not set this variable on Vercel.
 */
function previewPlannerDestinationIds(): string[] {
  // Prague release (2026-11-07): the switch is also honoured on a Vercel PREVIEW deployment (VERCEL_ENV === "preview"), so
  // the owner can review Prague there with a separate test database. It is never honoured on Vercel Production (or any
  // other Vercel environment) on the server, which is what decides: the server refuses the city there even if the
  // variable were set by mistake. Set the variable for the Preview environment only.
  if (typeof window === "undefined" && process.env.VERCEL && process.env.VERCEL_ENV !== "preview") return [];
  const raw = process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => !isReleaseExcludedDestination(id) && PLANNER_DESTINATIONS.some((d) => d.id === id && !d.available));
}

/** Selectable in the questionnaire and accepted by the server: publicly available, or a local preview city (see above). */
export function isAvailablePlannerDestinationId(value: string | null | undefined): boolean {
  if (!value) return false;
  return PLANNER_DESTINATIONS.some((d) => d.id === value && d.available) || previewPlannerDestinationIds().includes(value);
}

/** True only for a city enabled through the local preview switch (shown with a "local preview" label, never public). */
export function isPreviewPlannerDestinationId(value: string | null | undefined): boolean {
  return !!value && previewPlannerDestinationIds().includes(value);
}

/**
 * Per-city wording for an interest group whose default label does not fit the city (Prague has no beaches, so the
 * "طبيعة وشواطئ" group -- still the same two internal keys -- reads "طبيعة وإطلالات" there). Display only.
 */
const INTEREST_GROUP_LABEL_OVERRIDES: Record<string, { ar: Record<string, string>; en: Record<string, string>; he: Record<string, string> }> = {
  prague: { ar: { natureBeaches: "طبيعة وإطلالات" }, en: { natureBeaches: "Nature & views" }, he: { natureBeaches: "טבע ונופים" } },
  vienna: { ar: { natureBeaches: "طبيعة وإطلالات" }, en: { natureBeaches: "Nature & views" }, he: { natureBeaches: "טבע ונופים" } },
};

export function interestGroupLabelForDestination(destinationId: string | null | undefined, groupId: string, language: "ar" | "en" | "he"): string | undefined {
  if (!destinationId) return undefined;
  return INTEREST_GROUP_LABEL_OVERRIDES[destinationId]?.[language]?.[groupId];
}

export function plannerDestinationName(id: string, language: "ar" | "en" | "he" = "ar"): string {
  const destination = PLANNER_DESTINATIONS.find((d) => d.id === id);
  if (!destination) return id;
  return language === "en" ? destination.nameEn : language === "he" ? destination.nameHe : destination.name;
}

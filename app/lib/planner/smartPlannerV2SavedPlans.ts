import { V2_PLANNER_INTERESTS } from "./v2PlannerTypes";
import type { V2PlannerInterest } from "./v2PlannerTypes";
import type { V2Plan } from "./barcelonaV2Resolve";

/**
 * Smart Planner V2 Phase 5 -- saved-plan persistence, mirroring the shape/conventions of
 * smartPlannerSavedPlans.ts (V1) but for V2's own data. Reuses the SAME Supabase table
 * (`smart_planner_saved_plans`) -- no migration needed -- distinguished from V1 rows purely by
 * `product_slug: "barcelona-smart-planner-v2"` (a plain text column, no FK to `products`, so
 * this needed no commerce/payment schema change at all) and by `preferences_json.plannerVersion
 * === "v2"` inside the JSONB blob itself. The table's RLS (`user_id = auth.uid()` on every
 * command) already covers V2 rows identically to V1 -- nothing here weakens or bypasses it.
 *
 * `import type` only from barcelonaV2Resolve.ts (which carries `import "server-only"`) -- type
 * imports are fully erased at compile time, so this file stays safe to import from client
 * components, exactly the same established pattern SmartPlannerV2App.tsx already uses.
 *
 * FROZEN generated output (per the task's own "do not rely on regenerating and hoping for
 * identical future output" instruction): `generated_plan_json.plan` stores the complete,
 * already-resolved V2Plan exactly as returned by generateBarcelonaPlanV2Action at save time --
 * unlike V1 (which stores only placeIds + presentation copy and re-resolves guide content live
 * on reopen), V2's client never imports barcelona-guide.ts at all, so there is no live
 * resolution path to re-run on reopen even if we wanted one. Storing the fully-resolved plan is
 * therefore not a shortcut -- it's the only architecture consistent with V2's existing
 * "resolution happens once, server-side, at generation time" design.
 */

export type SmartPlannerV2SavedPreferences = {
  plannerVersion: "v2";
  destinationId: "barcelona";
  dateMode: "flexible" | "specific";
  durationDays?: number;
  arrivalDate?: string;
  departureDate?: string;
  interests: V2PlannerInterest[];
  /**
   * Planner Intelligence Upgrade: explicit flag distinguishing "generated via فاجئني ✨" from
   * a manual interest selection that happens to match the same underlying legacy interests --
   * optional so older saved rows (written before this field existed) simply read as `undefined`
   * (falsy), never as "true" and never migrated. A row with `undefined` here is displayed by its
   * actual stored `interests`, exactly as it always was -- NEVER inferred as Surprise Me just
   * because those interests happen to match what Surprise Me would have picked, per the task's
   * own explicit "do not infer from key presence alone" rule.
   */
  surpriseMe?: boolean;
  accommodation: { booked: boolean; text?: string };
};

export type SmartPlannerV2GeneratedPlanJson = { plan: V2Plan };

export type SmartPlannerV2SavedPlanRow = {
  id: string;
  user_id: string;
  product_slug: "barcelona-smart-planner-v2";
  destination_slug: "barcelona";
  preferences_json: SmartPlannerV2SavedPreferences;
  generated_plan_json: SmartPlannerV2GeneratedPlanJson;
  created_at: string;
  updated_at: string;
};

export const V2_SAVED_PLAN_PRODUCT_SLUG = "barcelona-smart-planner-v2" as const;

/** Sorts `interests` and drops the inapplicable date-mode pair of fields (never sets them to
 * `undefined` in place -- omits the keys entirely) so the same logical preference set always
 * normalizes to byte-identical JSON, matching V1's own normalizeSmartPlannerPreferences
 * rationale (keeps the DB's `unique(user_id, product_slug, destination_slug, preferences_json)`
 * constraint a reliable duplicate guard). */
export function normalizeSmartPlannerV2Preferences(preferences: SmartPlannerV2SavedPreferences): SmartPlannerV2SavedPreferences {
  const trimmedAccommodationText = preferences.accommodation.text?.trim();
  const base = {
    plannerVersion: "v2" as const,
    destinationId: "barcelona" as const,
    dateMode: preferences.dateMode,
    interests: [...preferences.interests].sort(),
    surpriseMe: !!preferences.surpriseMe,
    accommodation:
      preferences.accommodation.booked && trimmedAccommodationText ? { booked: true as const, text: trimmedAccommodationText } : { booked: false as const },
  };

  if (preferences.dateMode === "flexible") {
    return { ...base, durationDays: preferences.durationDays };
  }
  return { ...base, arrivalDate: preferences.arrivalDate, departureDate: preferences.departureDate };
}

/**
 * Defense-in-depth runtime validation for a row read back from the database (item 11: "no
 * unsafe arbitrary JSON trusted blindly"). Not meant to re-verify every nested field of a
 * resolved V2Plan -- that content only ever came from generateBarcelonaPlanV2Action's own
 * output in the first place -- but it does confirm the row is actually V2-shaped (product_slug
 * + plannerVersion agree) and that every interest key is a real, current V2PlannerInterest,
 * before any of it is trusted enough to render. A row that fails this is treated exactly like
 * "not found" by the saved-plan page -- never rendered half-validated, never thrown as a raw
 * error.
 */
export function isValidSmartPlannerV2SavedPlanRow(row: unknown): row is SmartPlannerV2SavedPlanRow {
  if (!row || typeof row !== "object") return false;
  const candidate = row as Record<string, unknown>;

  if (candidate.product_slug !== V2_SAVED_PLAN_PRODUCT_SLUG) return false;
  if (candidate.destination_slug !== "barcelona") return false;
  if (typeof candidate.id !== "string" || typeof candidate.created_at !== "string") return false;

  const preferences = candidate.preferences_json;
  if (!preferences || typeof preferences !== "object") return false;
  const p = preferences as Record<string, unknown>;
  if (p.plannerVersion !== "v2") return false;
  if (p.dateMode !== "flexible" && p.dateMode !== "specific") return false;
  if (!Array.isArray(p.interests) || !p.interests.every((interest) => (V2_PLANNER_INTERESTS as readonly string[]).includes(interest as string))) {
    return false;
  }
  if (!p.accommodation || typeof p.accommodation !== "object" || typeof (p.accommodation as Record<string, unknown>).booked !== "boolean") {
    return false;
  }

  const generatedPlan = candidate.generated_plan_json;
  if (!generatedPlan || typeof generatedPlan !== "object") return false;
  const plan = (generatedPlan as Record<string, unknown>).plan;
  if (!plan || typeof plan !== "object") return false;
  const planRecord = plan as Record<string, unknown>;
  if (planRecord.destination !== "barcelona" || !Array.isArray(planRecord.days)) return false;

  return true;
}

// ── Pending-save-through-login (mirrors smartPlannerSavedPlans.ts's own convention, but keyed
// and shaped for V2) ────────────────────────────────────────────────────────────────────────

const PENDING_SAVE_STORAGE_KEY = "travelSmarter:smartPlannerV2:pendingSave:barcelona";

export type PendingSmartPlannerV2Save = {
  preferences: SmartPlannerV2SavedPreferences;
  plan: V2Plan;
};

export function readPendingSmartPlannerV2Save(): PendingSmartPlannerV2Save | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_SAVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSmartPlannerV2Save;
  } catch {
    return null;
  }
}

export function writePendingSmartPlannerV2Save(pending: PendingSmartPlannerV2Save): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_SAVE_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Best-effort only -- a full/blocked localStorage just means the pending save won't
    // survive the login round trip; never a fatal error for the user.
  }
}

export function clearPendingSmartPlannerV2Save(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_SAVE_STORAGE_KEY);
  } catch {
    // Best-effort only, same as above.
  }
}

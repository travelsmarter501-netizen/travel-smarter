import type { SmartPlannerPlan } from "./generateBarcelonaSmartPlan";
import type { PresentedPlannerPlan } from "./plannerPresentationTypes";
import type { PlannerAccommodation, PlannerInterest } from "./plannerTypes";
import { PLANNER_INTERESTS } from "./plannerTypes";

/**
 * Smart Planner Commercialization Phase 1 -- the persisted-plan model.
 *
 * A saved plan stores the EXACT generated output (stable place ids/order + the presentation
 * copy produced at save time), never a re-derivable summary -- so reopening it later never
 * regenerates and always shows byte-for-byte what the user saved, even if planner/transport/
 * presentation logic changes afterward. It never duplicates guide place content (images,
 * hours, ratings, addresses) -- callers resolve that live from guide data by placeId, same as
 * the live Smart Planner result does.
 *
 * V1.4: `accommodation` is optional and additive. A plan saved before this feature existed
 * simply has no `accommodation` key in its stored `preferences_json` -- reading code must
 * treat it as optional (never assume it exists), and `normalizeSmartPlannerPreferences` below
 * omits the key entirely (rather than storing `null`) when there is no accommodation, so a
 * no-accommodation save today produces the exact same JSON shape as before this feature
 * existed.
 *
 * V1.5: `primaryInterest` follows the exact same optional/additive pattern as
 * `accommodation` above -- omitted (not `null`) when absent, so old saved rows and new
 * no-primary-interest saves compare identically, and no migration was needed.
 */

export type SmartPlannerSavedPreferences = {
  tripLength: 1 | 3 | 5;
  interests: PlannerInterest[];
  mustVisit: string[];
  accommodation?: PlannerAccommodation;
  primaryInterest?: PlannerInterest;
};

/** Trims and collapses internal whitespace only -- never changes casing or rewrites the
 * address, so the customer's original text is never lost, only its incidental whitespace
 * differences (which would otherwise defeat duplicate-plan detection for no real reason). */
export function normalizeAccommodationText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export type SmartPlannerGeneratedPlanJson = {
  smartPlan: SmartPlannerPlan;
  presentedPlan: PresentedPlannerPlan;
};

export type SmartPlannerSavedPlanRow = {
  id: string;
  user_id: string;
  product_slug: string;
  destination_slug: string;
  preferences_json: SmartPlannerSavedPreferences;
  generated_plan_json: SmartPlannerGeneratedPlanJson;
  created_at: string;
  updated_at: string;
};

/**
 * Sorted copies for consistent duplicate-detection and storage -- never mutates the input.
 * `accommodation` is included in normalization (its `text` whitespace-normalized, see
 * `normalizeAccommodationText`) so the unique constraint on the whole `preferences_json`
 * blob (see the saved-plans migration) reliably treats "same preferences + same
 * accommodation" as a duplicate and "same preferences + different accommodation" as a
 * distinct plan. The key is omitted entirely (not set to `null`/`undefined` explicitly) when
 * there is no accommodation, so `JSON.stringify`/Postgres jsonb serialization drops it -- a
 * no-accommodation save produces byte-for-byte the same JSON shape saved before this feature
 * existed, and old rows (which also lack the key) compare identically.
 */
export function normalizeSmartPlannerPreferences(preferences: SmartPlannerSavedPreferences): SmartPlannerSavedPreferences {
  return {
    tripLength: preferences.tripLength,
    interests: [...preferences.interests].sort(),
    mustVisit: [...preferences.mustVisit].sort(),
    ...(preferences.accommodation
      ? {
          accommodation: {
            text: normalizeAccommodationText(preferences.accommodation.text),
            useAsDailyAnchor: preferences.accommodation.useAsDailyAnchor,
            cluster: preferences.accommodation.cluster ?? null,
          },
        }
      : {}),
    ...(preferences.primaryInterest ? { primaryInterest: preferences.primaryInterest } : {}),
  };
}

/**
 * Final Pre-Payment Master QA: defense-in-depth row validation, mirroring
 * `isValidSmartPlannerV2SavedPlanRow` (smartPlannerV2SavedPlans.ts) exactly -- both V1 and V2
 * save into the SAME `smart_planner_saved_plans` table, distinguished only by shape, and the
 * account page's own row-branching logic falls through to the V1 rendering path for ANY row
 * that fails the V2 check (see app/account/page.tsx) -- so a row that is neither cleanly V1-
 * nor V2-shaped (e.g. a future V2_PLANNER_INTERESTS rename making an old V2 row fail its own
 * validator) would previously have been blindly cast and rendered as if it were V1, on both the
 * account page and `/smart-planner/barcelona/saved/[id]` (which had no runtime check at all,
 * only a compile-time type assertion). Evidence: V1's reopen page and V2's reopen page read the
 * identical table with no `product_slug`/shape filter in the query itself -- RLS only guarantees
 * row OWNERSHIP, never SHAPE. A row that fails this now renders the same honest "not found"
 * fallback V2 already uses for its own invalid rows, instead of a broken/garbled saved-plan page.
 */
export function isValidSmartPlannerSavedPlanRow(row: unknown): row is SmartPlannerSavedPlanRow {
  if (!row || typeof row !== "object") return false;
  const candidate = row as Record<string, unknown>;

  if (candidate.product_slug !== "barcelona-smart-planner") return false;
  if (typeof candidate.destination_slug !== "string") return false;
  if (typeof candidate.id !== "string" || typeof candidate.created_at !== "string") return false;

  const preferences = candidate.preferences_json;
  if (!preferences || typeof preferences !== "object") return false;
  const p = preferences as Record<string, unknown>;
  if (p.tripLength !== 1 && p.tripLength !== 3 && p.tripLength !== 5) return false;
  if (!Array.isArray(p.interests) || !p.interests.every((interest) => (PLANNER_INTERESTS as readonly string[]).includes(interest as string))) {
    return false;
  }

  const generatedPlan = candidate.generated_plan_json;
  if (!generatedPlan || typeof generatedPlan !== "object") return false;
  const smartPlan = (generatedPlan as Record<string, unknown>).smartPlan;
  if (!smartPlan || typeof smartPlan !== "object") return false;
  const plan = (smartPlan as Record<string, unknown>).plan;
  if (!plan || typeof plan !== "object" || !Array.isArray((plan as Record<string, unknown>).days)) return false;
  if (!(generatedPlan as Record<string, unknown>).presentedPlan) return false;

  return true;
}

// ── Pending-save local state ──────────────────────────────────────────────────────────────
// Written right before redirecting an anonymous visitor to /login, so the exact generated plan
// they were about to save survives the auth round trip instead of being silently lost. Read
// back once on the planner page's next mount; see SmartPlannerApp's resume effect.

const PENDING_SAVE_STORAGE_KEY = "travelSmarter:smartPlanner:pendingSave:barcelona";

export type PendingSmartPlanSave = {
  preferences: SmartPlannerSavedPreferences;
  smartPlan: SmartPlannerPlan;
  presentedPlan: PresentedPlannerPlan;
};

export function readPendingSmartPlanSave(): PendingSmartPlanSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_SAVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingSmartPlanSave;
  } catch {
    return null;
  }
}

export function writePendingSmartPlanSave(payload: PendingSmartPlanSave): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_SAVE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private browsing, quota) -- the save simply won't survive the
    // auth redirect; the user can just click "احفظ خطتي" again once they're logged in.
  }
}

export function clearPendingSmartPlanSave(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_SAVE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

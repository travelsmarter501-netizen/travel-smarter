"use server";

import { createClient } from "../../../../../utils/supabase/server";
import { createServiceRoleClient } from "../../../../../utils/supabase/service-role";
import { isValidSmartPlannerV2SavedPlanRow } from "../../../../lib/planner/smartPlannerV2SavedPlans";
import { applyPlanChange, applyPlanCustomizations, parsePlanChange, planAddOptions, sanitizeCustomizations, type PlanAddOptions } from "../../../../lib/planner/planCustomizations";
import { cityForSavedPlan } from "../../../../lib/planner/savedPlanCity";
import { withCurrentPlacePhotos } from "../../../../lib/planner/planPhotos";
import type { V2Day } from "../../../../lib/planner/barcelonaV2Resolve";
import type { ResolvedPlace } from "../../../../lib/readyPlan";

/** Only the changed day goes back (with the details of the places it shows): a 7-day plan is ~177 KB, one day a fraction. */
export type CustomizeSavedPlanResult = { ok: true; dayNumber: number; day: V2Day | null; placeDetails: Record<string, ResolvedPlace>; addOptions: PlanAddOptions } | { ok: false; code: "invalid" | "not_signed_in" | "not_found" | "save_failed" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One button press on the saved-plan page (day start, duration, move, remove, add a nearby place, reset). The user comes
 * from the verified session; the plan is read through RLS (only the user's own row), the change is validated against
 * that plan on the server, and the edits are saved with the same owner-only function the "edit plan" flow already uses
 * (replace_owned_plan_content: same preferences, the original plan untouched, the edits beside it).
 */
export async function customizeSavedPlan(planId: unknown, rawChange: unknown): Promise<CustomizeSavedPlanResult> {
  if (typeof planId !== "string" || !UUID.test(planId)) return { ok: false, code: "invalid" };
  const change = parsePlanChange(rawChange);
  if (!change) return { ok: false, code: "invalid" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "not_signed_in" };

  const { data: row } = await supabase.from("smart_planner_saved_plans").select("*").eq("id", planId).maybeSingle();
  if (!isValidSmartPlannerV2SavedPlanRow(row) || row.user_id !== user.id) return { ok: false, code: "not_found" };

  const base = row.generated_plan_json.plan;
  const city = cityForSavedPlan(base);
  if (!city) return { ok: false, code: "not_found" };
  const current = sanitizeCustomizations((row.generated_plan_json as { customizations?: unknown }).customizations);
  const next = applyPlanChange(city, base, current, change);
  if (!next) return { ok: false, code: "invalid" };

  const { data: saved, error } = await createServiceRoleClient().rpc("replace_owned_plan_content", {
    p_plan_id: planId,
    p_user_id: user.id,
    p_preferences: row.preferences_json,
    p_generated: { plan: base, customizations: next },
  });
  if (error) {
    console.error("[planner] saving plan edits failed:", error.code ?? "no-code");
    return { ok: false, code: "save_failed" };
  }
  if (saved !== true) return { ok: false, code: "not_found" };
  // Same display-time photo fill as the saved-plan page (plans saved before the photos existed). Only the changed day is returned.
  const effective = withCurrentPlacePhotos(applyPlanCustomizations(city, base, next));
  const day = effective.days.find((d) => d.dayNumber === change.dayNumber) ?? null;
  const ids = new Set<string>();
  if (day) for (const x of [...day.stops, ...(day.mealStops ?? []), ...day.optionalNearby, ...(day.foodSuggestions ?? []), ...(day.shoppingSuggestions ?? []), ...(day.nightlifeSuggestions ?? [])]) ids.add(x.id);
  const placeDetails = Object.fromEntries(Object.entries(effective.placeDetails ?? {}).filter(([id]) => ids.has(id)));
  return { ok: true, dayNumber: change.dayNumber, day, placeDetails, addOptions: planAddOptions(city, base, next) };
}

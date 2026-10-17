"use server";

import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";

export type ArchivePlanResult = { ok: true } | { ok: false; code: "login_required" | "not_found" | "failed" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "Remove" / "Restore" for a plan in My Plans. It only hides the plan from the owner's list (smart_planner_saved_plans.archived_at):
 * the plan, its request, the order, the payment and the entitlements are never touched or deleted, and one request still owns one plan.
 *
 * Authorization is entirely here and in the database: the user id comes ONLY from the verified session (never from the arguments),
 * and the SQL function changes one column on a row owned by exactly that user (it is executable by service_role alone, and customers have
 * no UPDATE privilege on the table). A plan id that is not the caller's simply reports "not_found" -- nothing is revealed about it.
 */
export async function setPlanArchivedAction(planId: string, archived: boolean): Promise<ArchivePlanResult> {
  if (typeof planId !== "string" || !UUID.test(planId) || typeof archived !== "boolean") return { ok: false, code: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, code: "login_required" };

  const { data, error } = await createServiceRoleClient().rpc("set_saved_plan_archived", { p_plan_id: planId, p_user_id: user.id, p_archived: archived });
  if (error) {
    console.error("[planner] set_saved_plan_archived failed:", error.code ?? "no-code");
    return { ok: false, code: "failed" };
  }
  return data === true ? { ok: true } : { ok: false, code: "not_found" };
}

"use server";

import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { hashClaimToken, isWellFormedClaimToken } from "../lib/commerce/claimToken";

export type ClaimPurchaseResult =
  | { status: "claimed" | "already_yours" }
  | { status: "not_paid_yet" }
  | { status: "invalid" }
  | { status: "login_required" };

/**
 * Attaches a PAID guest order to the signed-in user (and grants its entitlements) -- atomically, via
 * the claim_guest_order SQL function (single conditional UPDATE + entitlement insert in one
 * transaction; see the guest-checkout migration).
 *
 * Trust model:
 * - The user id comes ONLY from the verified session (auth.getUser()), never from the arguments.
 * - No session -> nothing happens ("login_required"). Claiming without authentication is impossible.
 * - The token is the sole proof of purchase. No email comparison is performed anywhere.
 * - The function is service_role-only; this Server Action is the single caller.
 * - Every failure collapses to a generic status so nothing is revealed about other people's orders.
 *   The token is never logged.
 */
export async function claimPurchaseAction(token: string): Promise<ClaimPurchaseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "login_required" };
  if (!isWellFormedClaimToken(token)) return { status: "invalid" };

  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole.rpc("claim_guest_order", {
    p_token_hash: hashClaimToken(token),
    p_user_id: user.id,
  });

  if (error || typeof data !== "string") {
    console.error("[claim] claim_guest_order failed");
    return { status: "invalid" };
  }

  if (data === "claimed" || data === "already_yours") return { status: data };
  if (data === "not_paid_yet") return { status: "not_paid_yet" };
  return { status: "invalid" };
}

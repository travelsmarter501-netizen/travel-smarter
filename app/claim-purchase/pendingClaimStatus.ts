import "server-only";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { hashClaimToken } from "../lib/commerce/claimToken";
import { readPendingClaimCookie } from "./pendingClaimCookie";

/**
 * Read-only: is there a guest purchase remembered by this browser's HttpOnly resume cookie, and what state is it in?
 *   "paid"    -> payment confirmed and still waiting to be attached to an account;
 *   "pending" -> the payment is not confirmed yet;
 *   "none"    -> no cookie, or the purchase is already attached / expired / unknown.
 * Used by pages that must not treat such a visitor as a brand-new customer (the planner, the personalized checkout). It never
 * writes a cookie, never claims anything and never exposes the token.
 */
export async function pendingClaimState(viewerId: string | null): Promise<"paid" | "pending" | "none"> {
  const token = await readPendingClaimCookie();
  if (!token) return "none";
  const { data, error } = await createServiceRoleClient().rpc("claim_guest_order_status", {
    p_token_hash: hashClaimToken(token),
    p_viewer_id: viewerId,
  });
  if (error || typeof data !== "string") return "none";
  return data === "paid" || data === "pending" ? data : "none";
}

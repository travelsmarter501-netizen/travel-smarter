"use server";

import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { hashClaimToken, isWellFormedClaimToken } from "../lib/commerce/claimToken";
import { clearPendingClaimCookie, readPendingClaimCookie, setPendingClaimCookie } from "./pendingClaimCookie";
import { recordBundledGuideEntitlement } from "../lib/commerce/bundles";
import { claimEmailVerdict } from "../lib/commerce/claimEmail";
import { claimedOrderDestination } from "../lib/commerce/claimDestination";

export type ClaimPurchaseResult =
  /**
   * hasPersonalizedPlan: the claimed order contains a Personalized Plan the buyer can now build (see /planner).
   * next: the in-app path of what they bought (a fixed path chosen by the server, see claimDestination.ts).
   */
  | { status: "claimed" | "already_yours"; hasPersonalizedPlan?: boolean; next: string }
  | { status: "not_paid_yet" }
  | { status: "invalid" }
  | { status: "login_required" }
  /** The signed-in account's verified email is not the email used at checkout: nothing was claimed. */
  | { status: "email_mismatch" }
  /** The signed-in account has no confirmed email yet: nothing was claimed. */
  | { status: "email_unverified" };

/**
 * Which claim token an action works on: the one in the URL the buyer arrived with (if well-formed),
 * otherwise the one remembered in the HttpOnly cookie. A URL token always wins, so opening a fresh
 * link is never overridden by an older remembered one.
 */
async function resolveClaimToken(urlToken: unknown): Promise<{ token: string | null; cookieToken: string | null }> {
  const cookieToken = await readPendingClaimCookie();
  const token = isWellFormedClaimToken(urlToken) ? urlToken : cookieToken;
  return { token, cookieToken };
}

/**
 * Attaches a PAID guest order to the signed-in user (and grants its entitlements) -- atomically, via
 * the claim_guest_order SQL function (single conditional UPDATE + entitlement insert in one
 * transaction; see the guest-checkout migration).
 *
 * Trust model:
 * - The user id comes ONLY from the verified session (auth.getUser()), never from the arguments.
 * - No session -> nothing happens ("login_required"). Claiming without authentication is impossible.
 * - The token is the proof of purchase (from the URL, or the HttpOnly cookie when the buyer came
 *   back from signing in). On top of it the account must have a CONFIRMED email that equals the checkout email
 *   (trim + lowercase, see claimEmail.ts) -- the address typed at checkout is not proof of owning that mailbox.
 *   On a mismatch nothing is claimed and the remembered cookie is kept, so the buyer can switch to the right account.
 * - The function is service_role-only; this Server Action is the single caller.
 * - Every failure collapses to a generic status so nothing is revealed about other people's orders.
 * - The remembered cookie is cleared as soon as it is spent (claimed) or proven useless (invalid).
 * - Logs carry outcomes only -- never the token, its hash, the order id, an email or a user id.
 */
export async function claimPurchaseAction(urlToken?: string): Promise<ClaimPurchaseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.info("[claim] claim attempted without a signed-in session");
    return { status: "login_required" };
  }

  const { token, cookieToken } = await resolveClaimToken(urlToken);
  if (!token) {
    console.info("[claim] claim attempted without a usable token");
    return { status: "invalid" };
  }
  const source = isWellFormedClaimToken(urlToken) ? "url" : "cookie";

  const serviceRole = createServiceRoleClient();
  const tokenHash = hashClaimToken(token);

  // The email rule. An order that is already this user's skips it (it is simply being re-opened); one that belongs to somebody else
  // (or does not exist) falls through to the SQL function, which answers "invalid" without revealing anything.
  const { data: orderRow } = await serviceRole
    .from("orders")
    .select("guest_email, user_id")
    .eq("claim_token_hash", tokenHash)
    .maybeSingle<{ guest_email: string | null; user_id: string | null }>();
  if (orderRow && orderRow.user_id === null) {
    const verdict = claimEmailVerdict({ orderEmail: orderRow.guest_email, accountEmail: user.email, accountEmailConfirmed: !!user.email_confirmed_at });
    if (verdict !== "ok") {
      console.info("[claim] refused:", verdict);
      return { status: verdict === "mismatch" ? "email_mismatch" : "email_unverified" };
    }
  }

  const { data, error } = await serviceRole.rpc("claim_guest_order", {
    p_token_hash: tokenHash,
    p_user_id: user.id,
  });

  if (error || typeof data !== "string") {
    console.error("[claim] claim_guest_order failed:", error?.code ?? "no-code", error?.message ?? "unexpected response");
    return { status: "invalid" };
  }

  console.info("[claim] claim result:", data, "| token source:", source);

  // The remembered token is spent (claimed) or useless (invalid): forget it -- but only if it IS this token.
  if (data !== "not_paid_yet" && cookieToken === token) await clearPendingClaimCookie();

  if (data === "claimed" || data === "already_yours") {
    // "+ Barcelona Guide" bundles: record the guide entitlement for the order THIS user just claimed (the SQL claim
    // grants only the order's own items). Best effort and idempotent: the buyer's access never depends on it
    // (hasProductAccess already accepts a bundle product for the guide), and a repeat claim retries it.
    const { data: claimedOrder } = await serviceRole
      .from("orders")
      .select("id")
      .eq("claim_token_hash", tokenHash)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();
    if (claimedOrder && !(await recordBundledGuideEntitlement(serviceRole, { userId: user.id, orderId: claimedOrder.id }))) {
      console.error("[claim] bundled guide entitlement could not be recorded");
    }
    let hasPersonalizedPlan = false;
    if (claimedOrder) {
      const { data: request } = await serviceRole
        .from("personalized_plan_requests")
        .select("id")
        .eq("order_id", claimedOrder.id)
        .maybeSingle<{ id: string }>();
      hasPersonalizedPlan = !!request;
    }
    return { status: data, hasPersonalizedPlan, next: await claimedOrderDestination(serviceRole, { tokenHash, userId: user.id }) };
  }
  if (data === "not_paid_yet") return { status: "not_paid_yet" };
  return { status: "invalid" };
}

export type PendingClaimSync = {
  /** What is still waiting: a paid purchase to add ("paid"), a payment still being confirmed ("pending"), or nothing. */
  state: "paid" | "pending" | "none";
  /** True when the HttpOnly cookie now holds this token, i.e. sign-in redirects no longer need the token in the URL. */
  remembered: boolean;
  /** For a paid purchase and a signed-in viewer: false when the account's confirmed email is not the checkout email (so it will not be auto-attached). */
  accountMatches?: boolean;
};

/**
 * Keeps the HttpOnly resume cookie in step with the truth in the database. Called by the claim page (with
 * the URL token, if any) and by the /account banner (no argument: the cookie is the only source).
 *
 * - token still claimable (pending/paid) -> make sure the cookie holds it (written only if not already
 *   there, so its short lifetime is never extended);
 * - token claimed (by this user or anyone) / expired / unknown -> clear the cookie if it holds that token;
 * - database hiccup -> change nothing.
 * Read-mostly: it never claims anything and returns no order data.
 */
export async function syncPendingClaimAction(urlToken?: string): Promise<PendingClaimSync> {
  const { token, cookieToken } = await resolveClaimToken(urlToken);
  if (!token) return { state: "none", remembered: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole.rpc("claim_guest_order_status", {
    p_token_hash: hashClaimToken(token),
    p_viewer_id: user?.id ?? null,
  });

  if (error || typeof data !== "string") {
    console.error("[claim] sync could not read claim status");
    return { state: "none", remembered: cookieToken === token };
  }

  if (data === "paid" || data === "pending") {
    if (cookieToken !== token) {
      await setPendingClaimCookie(token);
      console.info("[claim] sync: remembered pending claim (HttpOnly cookie)");
    }
    let accountMatches: boolean | undefined;
    if (data === "paid" && user) {
      const { data: orderRow } = await serviceRole
        .from("orders")
        .select("guest_email")
        .eq("claim_token_hash", hashClaimToken(token))
        .maybeSingle<{ guest_email: string | null }>();
      accountMatches = claimEmailVerdict({ orderEmail: orderRow?.guest_email, accountEmail: user.email, accountEmailConfirmed: !!user.email_confirmed_at }) === "ok";
    }
    return { state: data, remembered: true, accountMatches };
  }

  // "mine" (already attached to this user) or "invalid" (unknown / expired / claimed by someone else)
  if (cookieToken === token) {
    await clearPendingClaimCookie();
    console.info("[claim] sync: cleared remembered claim (" + data + ")");
  }
  return { state: "none", remembered: false };
}

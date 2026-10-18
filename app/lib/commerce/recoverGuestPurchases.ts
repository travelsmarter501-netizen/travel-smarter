import "server-only";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";
import { normalizeEmailForClaim } from "./claimEmail";
import { hashClaimToken } from "./claimToken";
import { recordBundledGuideEntitlement } from "./bundles";
import { clearPendingClaimCookie, readPendingClaimCookie } from "../../claim-purchase/pendingClaimCookie";
import { setLinkedNoticeCookie } from "./linkedNoticeCookie";

/**
 * Automatic recovery of GUEST purchases by verified email -- the cross-browser safety net.
 *
 * A guest purchase is normally attached through its claim link (URL / HttpOnly cookie of the browser that paid). When the customer
 * continues in a different browser, that link is not there. Recovery attaches the same purchase WITHOUT it, using only what the server can
 * verify about the signed-in account:
 *
 *   - the account has a CONFIRMED email (Supabase confirms it for Google and after the email link);
 *   - that email equals the order's checkout email after trim + lowercase (no dot / "+tag" folding -- two different mailboxes never match);
 *   - the order is PAID, still UNOWNED, and inside its 30-day claim window.
 *
 * It does not re-implement ownership. Every order goes through the existing atomic claim_guest_order() SQL function (service_role only):
 * one conditional UPDATE that only succeeds for a paid, unowned, unexpired order, an owner that can never be changed afterwards (trigger),
 * and entitlements granted idempotently in the same transaction. So an order owned by another account can never be moved, a replay finds
 * nothing left to recover, and two accounts racing for the same order cannot both win (the loser gets "invalid").
 *
 * Safe by construction: the lookup (an ILIKE pre-filter on the checkout email) only NARROWS the candidates; each candidate is re-checked here
 * with the exact normalized comparison and the expiry, and the database re-checks paid / unowned / expiry again. The raw claim token never
 * exists server-side after payment (only its hash is stored), the hashes are read only to be handed straight back to the SQL function and are
 * never returned to the caller, logged or sent to the browser. Logs carry counts only -- never an email, an order id, a hash or a user id.
 */

const MAX_ORDERS_PER_PASS = 25;

export type RecoverableUser = { id: string; email?: string | null; email_confirmed_at?: string | null };

type CandidateRow = { id: string; claim_token_hash: string | null; guest_email: string | null; claim_expires_at: string | null };

/**
 * Escapes LIKE wildcards in the pre-filter pattern. This is a courtesy, not a guarantee: the REST layer in front of Postgres may still treat
 * an address character such as "_" as a wildcard, which only makes the candidate list WIDER. Safety never depends on it -- every candidate is
 * re-checked below with exact normalized equality, and a wider list can only mean more rows are inspected, never more rows are attached.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/**
 * Attaches every eligible guest purchase to this account. Returns how many were attached in this pass (0 for most visits).
 * Never throws: a failure only means nothing was recovered this time (the next sign-in tries again).
 *
 * `canWriteCookies`: in a Server Action / Route Handler (where cookies can be written), also forget the browser's pending-claim cookie if it
 * pointed at an order that was just recovered. Server Components must leave it off (they cannot write cookies).
 */
export async function recoverGuestPurchases(user: RecoverableUser | null | undefined, options: { canWriteCookies?: boolean } = {}): Promise<number> {
  try {
    if (!user?.id || !user.email_confirmed_at) return 0;
    const email = normalizeEmailForClaim(user.email);
    if (!email) return 0;

    const serviceRole = createServiceRoleClient();
    const { data, error } = await serviceRole
      .from("orders")
      .select("id, claim_token_hash, guest_email, claim_expires_at")
      .is("user_id", null)
      .eq("status", "paid")
      .ilike("guest_email", escapeLike(email))
      .limit(MAX_ORDERS_PER_PASS)
      .returns<CandidateRow[]>();

    if (error) {
      console.error("[claim] email recovery lookup failed:", error.code ?? "no-code");
      return 0;
    }

    const recoveredHashes: string[] = [];
    for (const row of data ?? []) {
      if (!row.claim_token_hash) continue;
      // The pre-filter is not the rule: the rule is exact equality of the normalized addresses...
      if (normalizeEmailForClaim(row.guest_email) !== email) continue;
      // ...and the claim window (the database enforces it again).
      if (row.claim_expires_at && new Date(row.claim_expires_at).getTime() <= Date.now()) continue;

      const { data: result, error: claimError } = await serviceRole.rpc("claim_guest_order", { p_token_hash: row.claim_token_hash, p_user_id: user.id });
      if (claimError || typeof result !== "string") {
        console.error("[claim] email recovery: claim_guest_order failed:", claimError?.code ?? "no-code");
        continue;
      }
      // "claimed" is the only outcome that moved anything. "already_yours" / "invalid" / "not_paid_yet": nothing to do, nothing changed.
      if (result !== "claimed") continue;

      recoveredHashes.push(row.claim_token_hash);
      // Same follow-up the token claim does: record the Barcelona Guide a bundle includes. Best effort and idempotent.
      if (!(await recordBundledGuideEntitlement(serviceRole, { userId: user.id, orderId: row.id }))) {
        console.error("[claim] email recovery: bundled guide entitlement could not be recorded");
      }
    }

    if (recoveredHashes.length > 0) {
      console.info("[claim] email recovery: attached", recoveredHashes.length, "purchase(s)");
      if (options.canWriteCookies) {
        await setLinkedNoticeCookie(); // lets /account say so once, however many times the destination gets rendered
        const cookieToken = await readPendingClaimCookie();
        if (cookieToken && recoveredHashes.includes(hashClaimToken(cookieToken))) await clearPendingClaimCookie();
      }
    }
    return recoveredHashes.length;
  } catch (error) {
    console.error("[claim] email recovery failed:", error instanceof Error ? error.message : "unknown error");
    return 0;
  }
}

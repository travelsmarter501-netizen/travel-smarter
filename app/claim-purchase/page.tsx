import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { hashClaimToken, isWellFormedClaimToken } from "../lib/commerce/claimToken";
import { claimEmailVerdict } from "../lib/commerce/claimEmail";
import { claimedOrderDestination } from "../lib/commerce/claimDestination";
import { readPendingClaimCookie } from "./pendingClaimCookie";
import { recoverGuestPurchases } from "../lib/commerce/recoverGuestPurchases";
import { hasLinkedNoticeCookie } from "../lib/commerce/linkedNoticeCookie";
import ClaimPurchaseClient, { type ClaimViewState } from "./ClaimPurchaseClient";

/**
 * Post-payment claim page for guest purchases. The token in the URL is the buyer's proof of
 * purchase: this page never trusts it for anything by itself -- it only asks the database for a
 * coarse state (claim_guest_order_status), and the actual claim happens in a Server Action behind
 * an authenticated session. A signed-in buyer whose confirmed email is the checkout email is attached
 * automatically (no button); anyone else sees why and what to do (see ClaimPurchaseClient.tsx).
 *
 * - The token comes from the URL (first landing) or, after the buyer bounced through sign-in and came
 *   back to a plain /claim-purchase, from the HttpOnly resume cookie (see pendingClaimCookie.ts). A token
 *   that came from the cookie is never passed to the client component -- it stays server-side.
 * - noindex + no-referrer so the token URL is not indexed and is not leaked to other sites.
 * - dynamic: it reads the session cookie, the resume cookie and searchParams.
 */
export const metadata: Metadata = {
  title: "Your purchase | Travel Smarter",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ClaimPurchasePage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: rawToken } = await searchParams;
  const urlToken = isWellFormedClaimToken(rawToken) ? rawToken : null;
  // A fresh link in the URL always wins; otherwise resume from the HttpOnly cookie.
  const token = urlToken ?? (await readPendingClaimCookie());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!token) {
    // No claim link here -- what rescues a buyer who continued in a different browser and no longer has it: a signed-in visitor with a VERIFIED
    // email gets any guest purchase made with that email attached (see recoverGuestPurchases), then goes straight to their account. A visitor who
    // does hold the claim link never reaches this branch: the link claim below is untouched. The flag cookie covers the sign-in step having
    // already linked them in an earlier request (the destination can be rendered more than once).
    const recoveredByEmail = await recoverGuestPurchases(user);
    if (recoveredByEmail > 0 || (await hasLinkedNoticeCookie())) redirect("/account");
    return <ClaimPurchaseClient state="invalid" />;
  }

  // Read-only coarse state; the (server-verified) viewer id lets the owner re-open their own claimed link.
  const serviceRole = createServiceRoleClient();
  const { data, error } = await serviceRole.rpc("claim_guest_order_status", {
    p_token_hash: hashClaimToken(token),
    p_viewer_id: user?.id ?? null,
  });

  let state: ClaimViewState = "invalid";
  if (!error && typeof data === "string") {
    if (data === "pending") state = "pending";
    else if (data === "mine") state = "done";
    else if (data === "paid") state = user ? "ready" : "signin";
  }

  // The email rule (the same one the claim action enforces): decided here only so a wrong account is told why up front,
  // instead of the page trying to claim and failing.
  if (state === "ready" && user) {
    const { data: orderRow } = await serviceRole
      .from("orders")
      .select("guest_email")
      .eq("claim_token_hash", hashClaimToken(token))
      .maybeSingle<{ guest_email: string | null }>();
    const verdict = claimEmailVerdict({ orderEmail: orderRow?.guest_email, accountEmail: user.email, accountEmailConfirmed: !!user.email_confirmed_at });
    if (verdict === "mismatch") state = "mismatch";
    else if (verdict === "unverified") state = "unverified";
  }

  // Already in this account: the page just forwards to what they bought.
  const nextPath = state === "done" && user ? await claimedOrderDestination(serviceRole, { tokenHash: hashClaimToken(token), userId: user.id }) : undefined;

  if (state !== "pending") console.info("[claim] page state:", state, "| signedIn:", !!user, "| token source:", urlToken ? "url" : "cookie");

  // Only a URL-sourced token goes to the client (it is already in the address bar); a cookie-sourced one never does.
  return <ClaimPurchaseClient state={state} token={state !== "invalid" && urlToken ? urlToken : undefined} userEmail={user?.email ?? null} nextPath={nextPath} />;
}

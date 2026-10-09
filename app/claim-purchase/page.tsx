import type { Metadata } from "next";
import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { hashClaimToken, isWellFormedClaimToken } from "../lib/commerce/claimToken";
import ClaimPurchaseClient, { type ClaimViewState } from "./ClaimPurchaseClient";

/**
 * Post-payment claim page for guest purchases. The token in the URL is the buyer's proof of
 * purchase: this page never trusts it for anything by itself -- it only asks the database for a
 * coarse state (claim_guest_order_status), and the actual claim happens in a Server Action behind
 * an authenticated session.
 *
 * - noindex + no-referrer so the token URL is not indexed and is not leaked to other sites.
 * - dynamic: it reads the session cookie and searchParams.
 */
export const metadata: Metadata = {
  title: "Your purchase | Travel Smarter",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ClaimPurchasePage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: rawToken } = await searchParams;
  const token = typeof rawToken === "string" ? rawToken : "";

  if (!isWellFormedClaimToken(token)) {
    return <ClaimPurchaseClient state="invalid" />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return <ClaimPurchaseClient state={state} token={state === "invalid" ? undefined : token} userEmail={user?.email ?? null} />;
}

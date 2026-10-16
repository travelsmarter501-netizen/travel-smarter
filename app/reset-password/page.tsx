import type { Metadata } from "next";
import { createClient } from "../../utils/supabase/server";
import { safeNextPath } from "../lib/authRedirect";
import { readPendingClaimCookie } from "../claim-purchase/pendingClaimCookie";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset password | Travel Smarter",
  robots: { index: false, follow: false },
};

/**
 * The page the password-reset email leads to (via /auth/callback, which has already turned the link into a session).
 * No session means the link was invalid, expired or opened in another browser -- the page then says so and offers a new link.
 *
 * After the new password is saved the customer continues to `next` (a safe in-app path), and if this browser still holds a
 * pending paid-purchase claim (the HttpOnly resume cookie), to /claim-purchase so the purchase is attached straight away.
 */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next: rawNext } = await searchParams;
  const requestedNext = safeNextPath(Array.isArray(rawNext) ? rawNext[0] : rawNext);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasPendingClaim = !!user && !!(await readPendingClaimCookie());
  const continueTo = hasPendingClaim && !requestedNext.startsWith("/claim-purchase") ? "/claim-purchase" : requestedNext;

  return <ResetPasswordClient hasSession={!!user} continueTo={continueTo} next={requestedNext} />;
}

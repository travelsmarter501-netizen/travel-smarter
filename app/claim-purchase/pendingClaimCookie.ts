import "server-only";
import { cookies } from "next/headers";
import { isWellFormedClaimToken } from "../lib/commerce/claimToken";

/**
 * Server-side "resume pointer" for a paid guest purchase that has not been claimed yet.
 *
 * The claim token is a bearer credential, so it is NOT kept anywhere JavaScript can read it. After the
 * buyer lands on /claim-purchase?token=..., the server stores it in an HttpOnly cookie. If they then
 * bounce through sign-in / Google / email confirmation and come back to a plain /claim-purchase (no token
 * in the URL), the page and the claim action read it from that cookie.
 *
 * - HttpOnly: invisible to client JS (no XSS read, never in RSC props or the DOM).
 * - Secure + `__Host-` prefix in production: HTTPS only, host-only (no Domain), Path=/ -- not shared with
 *   subdomains. (Plain name + non-Secure in local development, where http://localhost is used.)
 * - SameSite=Lax: not sent on cross-site POSTs.
 * - Short life (4 h, far below the 30-day claim window): it only needs to survive a sign-in. The URL link
 *   stays the durable proof; support can re-issue it.
 * - Never extended: it is only (re)written when it does not already hold the token.
 * - Cleared as soon as the order is claimed, or the token turns out invalid/expired.
 *
 * What this does not change: the token is still the only proof of purchase, claiming still needs a
 * signed-in session + an explicit click, and the database still claims atomically, once.
 */
export const PENDING_CLAIM_COOKIE_MAX_AGE_SECONDS = 4 * 60 * 60;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function pendingClaimCookieName(): string {
  return isProduction() ? "__Host-ts_pending_claim" : "ts_pending_claim";
}

function cookieAttributes(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** The remembered token, or null. A malformed value is treated as absent. */
export async function readPendingClaimCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(pendingClaimCookieName())?.value;
  return isWellFormedClaimToken(value) ? value : null;
}

/** Server Action / Route Handler only (cookies cannot be written while rendering). */
export async function setPendingClaimCookie(token: string): Promise<void> {
  if (!isWellFormedClaimToken(token)) return;
  const store = await cookies();
  store.set(pendingClaimCookieName(), token, cookieAttributes(PENDING_CLAIM_COOKIE_MAX_AGE_SECONDS));
}

/** Server Action / Route Handler only. Expires the cookie immediately (same attributes, so `__Host-` accepts it). */
export async function clearPendingClaimCookie(): Promise<void> {
  const store = await cookies();
  store.set(pendingClaimCookieName(), "", cookieAttributes(0));
}

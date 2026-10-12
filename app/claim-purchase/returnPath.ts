/**
 * Where sign-in / sign-up send a guest buyer back to, as a `next` path.
 *
 * Normally just "/claim-purchase": the server already holds the claim token in its HttpOnly resume cookie
 * (or the token was never in the URL), so no credential has to travel through the Supabase / Google
 * redirects. Only while the cookie is not confirmed yet (a slow or failed write) does the path also carry
 * the token, so the purchase can never be lost to a timing problem.
 */
export function claimReturnPath(urlToken: string | undefined, cookieConfirmed: boolean): string {
  return urlToken && !cookieConfirmed ? `/claim-purchase?token=${urlToken}` : "/claim-purchase";
}

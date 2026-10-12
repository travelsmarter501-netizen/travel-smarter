/**
 * The ONE place that decides where an auth flow may send the user back to.
 *
 * Login, signup, Google OAuth and /auth/callback all carry a `next` path (e.g. "/claim-purchase" after a
 * guest purchase) so the user returns to what they were doing once signed in. They all use these helpers,
 * so the rules cannot drift apart: `next` must be a plain same-site path -- never an absolute URL, a
 * protocol-relative "//host", a backslash trick, or anything with control characters -- and it must not
 * point back into the auth pages themselves (which could loop).
 *
 * Pure functions, safe to import from both client and server code.
 */
export const DEFAULT_NEXT_PATH = "/account";

const MAX_NEXT_LENGTH = 2048;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const AUTH_PAGES = /^\/(login|signup|auth)(\/|\?|#|$)/;

export function safeNextPath(value: string | null | undefined, fallback: string = DEFAULT_NEXT_PATH): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_NEXT_LENGTH) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || CONTROL_CHARS.test(value)) return fallback;
  if (AUTH_PAGES.test(value)) return fallback;

  // Same-origin check on the parsed form: whatever the browser would resolve must stay on this site.
  try {
    const base = "http://same-site.invalid";
    const parsed = new URL(value, base);
    if (parsed.origin !== base) return fallback;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

function withNext(path: string, next: string): string {
  const safe = safeNextPath(next);
  return safe === DEFAULT_NEXT_PATH ? path : `${path}?next=${encodeURIComponent(safe)}`;
}

/** "/login" (+ "?next=..." unless it is just the default landing page). */
export function loginHref(next: string): string {
  return withNext("/login", next);
}

/** "/signup" (+ "?next=..." unless it is just the default landing page). */
export function signupHref(next: string): string {
  return withNext("/signup", next);
}

/** The absolute URL Supabase sends the browser back to after Google / email confirmation. */
export function authCallbackUrl(origin: string, next: string): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

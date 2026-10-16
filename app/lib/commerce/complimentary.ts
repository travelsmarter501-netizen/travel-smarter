import "server-only";

/**
 * Complimentary (demo) Personalized Plans -- who may skip payment.
 *
 * The allowlist is the server-side environment variable COMPLIMENTARY_USER_IDS: Supabase auth user ids (UUIDs) separated by
 * commas, spaces or newlines. It is read here, on the server, and nowhere else:
 *   - this module is "server-only", so it can never be bundled into client JavaScript;
 *   - no id, email or list is hardcoded anywhere in the repository (an unset variable means NOBODY is allowlisted);
 *   - callers pass the id of the VERIFIED session user (supabase.auth.getUser()), never an id taken from the browser;
 *   - the client is only ever told a boolean about its OWN session ("you may create a complimentary plan"), never the list.
 *
 * Anything that is not a well-formed UUID in the variable is ignored, so a typo cannot widen access. Ids are never logged.
 * This only decides who may CREATE a complimentary request; generating the plan is separately authorized per request in the
 * database (begin_personalized_plan_generation).
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function allowlist(): Set<string> {
  const raw = process.env.COMPLIMENTARY_USER_IDS ?? "";
  return new Set(
    raw
      .split(/[\s,;]+/)
      .map((id) => id.trim().toLowerCase())
      .filter((id) => UUID_PATTERN.test(id))
  );
}

export function isComplimentaryUser(userId: string | null | undefined): boolean {
  if (typeof userId !== "string") return false;
  const id = userId.trim().toLowerCase();
  return UUID_PATTERN.test(id) && allowlist().has(id);
}

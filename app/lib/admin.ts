import "server-only";
import { createClient } from "../../utils/supabase/server";

/**
 * Custom Plan Admin Builder V1 -- admin authorization.
 *
 * V1 deliberately has no `role`/`is_admin` column or DB-level admin concept: an admin is
 * simply an authenticated user whose email appears in the server-only ADMIN_EMAILS env var
 * (comma-separated). This is intentionally NOT a NEXT_PUBLIC_* var and is never read by, or
 * exposed to, client code -- only this file (and code that imports it) ever touches it, and
 * this file itself never returns the allowlist, only a yes/no decision for one user.
 *
 * Every admin page and every admin Server Action must call getAdminUser() itself and check
 * for null -- a page-level check is NOT inherited by the Server Actions it renders buttons
 * for; those actions run as their own request and must re-verify independently (see the
 * "admin authorization rechecked on every write action" requirement).
 */

export type AdminUser = { id: string; email: string };

function adminEmailAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)
  );
}

/**
 * Server-only. Resolves the current session and checks it against ADMIN_EMAILS. Returns null
 * for a logged-out visitor, a logged-in non-admin, or a misconfigured/empty allowlist (fails
 * closed -- an empty/unset ADMIN_EMAILS means nobody is an admin, never "everyone is").
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const allowlist = adminEmailAllowlist();
  if (allowlist.size === 0) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;
  if (!allowlist.has(user.email.toLowerCase())) return null;

  return { id: user.id, email: user.email };
}

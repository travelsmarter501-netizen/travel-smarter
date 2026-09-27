import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client authenticated as `service_role` -- bypasses Row Level Security
 * entirely. This must NEVER be imported by a client component, and must NEVER be used to
 * satisfy a request whose identity hasn't already been independently verified (e.g. via
 * `supabase.auth.getUser()` on the normal session-bound client from utils/supabase/server.ts).
 *
 * Reserved for genuinely trusted, backend-only operations that a real user session cannot
 * perform under RLS -- today that's exactly `create_pending_order` (see app/lib/orders.ts);
 * later, a payment webhook and entitlement-granting will use it too. It is never a shortcut
 * for "make development easier" -- see the Commerce Foundation V1 task's explicit rule against
 * permissive client-write policies, which this client exists to avoid ever needing.
 *
 * The `import "server-only"` at the top makes any accidental import from client code fail
 * the build immediately, rather than silently shipping (a broken, key-less client, since
 * SUPABASE_SERVICE_ROLE_KEY is never a NEXT_PUBLIC_* var and so is never embedded in a client
 * bundle anyway -- this is a second, earlier layer of protection on top of that).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Deliberately does not include the env var's value (or lack thereof) in the message --
  // only ever names which variable is missing, never anything that could leak a partial or
  // full secret into logs/error trackers.
  if (!url) {
    throw new Error("createServiceRoleClient: NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  if (!serviceRoleKey) {
    throw new Error("createServiceRoleClient: SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      // This client never represents a real signed-in visitor and never persists/refreshes a
      // session -- it authenticates purely via the service-role key on every request.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

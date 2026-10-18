"use server";

import { createClient } from "../../utils/supabase/server";
import { recoverGuestPurchases } from "../lib/commerce/recoverGuestPurchases";

/**
 * Called by the login page right after a successful email + password sign-in (see lib/commerce/recoverGuestPurchases.ts for the rules).
 * Takes no arguments: the account comes ONLY from the verified session (auth.getUser()), so a caller cannot ask for anyone else's purchases.
 * Returns just a count -- never an order, an email, a token or a hash.
 */
export async function recoverPurchasesAction(): Promise<{ recovered: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { recovered: 0 };
  return { recovered: await recoverGuestPurchases(user, { canWriteCookies: true }) };
}

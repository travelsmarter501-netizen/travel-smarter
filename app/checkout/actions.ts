"use server";

import { createClient } from "../../utils/supabase/server";
import { createPendingOrder, createGuestPendingOrder } from "../lib/orders";
import { generateClaimToken, normalizeGuestEmail } from "../lib/commerce/claimToken";
import { createCustomPlanPendingOrder } from "../lib/customPlanCommerce";
import { createAllpayRedirectCheckout } from "../lib/allpay/createPayment";
import { resolveCheckoutProductSlugs } from "../lib/commerce/catalog";

export type StartCheckoutResult =
  | { ok: true; paymentUrl: string; orderId: string }
  | { ok: false; error: string; requiresLogin?: boolean };

function clientProfile(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  return { name, email: user.email ?? null };
}

/**
 * Checkout works for guests AND signed-in customers.
 *
 * - Signed in (verified session): exactly the previous flow -- the order is owned by that user from
 *   the start and the verified webhook grants the entitlement directly. `input.email` is ignored.
 * - Guest: an email is required (receipt/contact only -- never proof of ownership). The order has no
 *   owner; a one-time claim token is generated here, only its hash is stored, and the buyer returns
 *   from Allpay to /claim-purchase?token=... to attach the paid order to an account.
 *
 * Prices and product metadata are never read from the browser: only cart ids / known slugs come in,
 * and the database computes the total.
 */
export async function startCartCheckout(input: { cartIds?: string[]; productSlugs?: string[]; email?: string }): Promise<StartCheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let slugs: string[];
  try {
    slugs = resolveCheckoutProductSlugs(input);
  } catch {
    return { ok: false, error: "منتج غير صالح في السلة." };
  }

  if (slugs.length === 0) {
    return { ok: false, error: "السلة فارغة." };
  }

  if (user) {
    const order = await createPendingOrder(slugs);
    if (!order.ok) {
      return { ok: false, error: order.error };
    }

    return createAllpayRedirectCheckout(order.data.id, clientProfile(user));
  }

  // ---- Guest checkout ----
  const email = normalizeGuestEmail(input.email);
  if (!email) {
    return { ok: false, error: "أدخل بريدًا إلكترونيًا صحيحًا — بنرسل عليه تأكيد الدفع." };
  }

  const claimToken = generateClaimToken();
  const order = await createGuestPendingOrder(slugs, email, claimToken);
  if (!order.ok) {
    return { ok: false, error: order.error };
  }

  return createAllpayRedirectCheckout(order.data.id, { email }, { claimToken });
}

export async function startCustomPlanAllpayCheckout(requestId: string): Promise<StartCheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "لازم تسجل الدخول لإتمام الدفع.", requiresLogin: true };
  }

  const pending = await createCustomPlanPendingOrder(requestId);
  if (!pending.ok) {
    return { ok: false, error: pending.error, requiresLogin: pending.requiresLogin };
  }

  if (pending.data.orderStatus === "paid") {
    return { ok: false, error: "هذا الطلب مدفوع مسبقًا." };
  }

  return createAllpayRedirectCheckout(pending.data.orderId, clientProfile(user));
}

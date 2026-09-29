"use server";

import { createClient } from "../../utils/supabase/server";
import { createPendingOrder } from "../lib/orders";
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

export async function startCartCheckout(input: { cartIds?: string[]; productSlugs?: string[] }): Promise<StartCheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "لازم تسجل الدخول لإتمام الدفع.", requiresLogin: true };
  }

  let slugs: string[];
  try {
    slugs = resolveCheckoutProductSlugs(input);
  } catch {
    return { ok: false, error: "منتج غير صالح في السلة." };
  }

  if (slugs.length === 0) {
    return { ok: false, error: "السلة فارغة." };
  }

  const order = await createPendingOrder(slugs);
  if (!order.ok) {
    return { ok: false, error: order.error };
  }

  return createAllpayRedirectCheckout(order.data.id, clientProfile(user));
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

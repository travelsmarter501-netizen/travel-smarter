import "server-only";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";

type OrderRow = {
  id: string;
  user_id: string;
  status: string;
  total_ils: number;
  currency: string;
};

function amountsMatch(webhookAmount: unknown, orderTotal: number): boolean {
  const paid = typeof webhookAmount === "number" ? webhookAmount : Number(webhookAmount);
  if (!Number.isFinite(paid)) return false;
  return Math.abs(paid - Number(orderTotal)) < 0.01;
}

/**
 * Grants entitlements only after a verified Allpay webhook (status == 1).
 * Duplicate deliveries are no-ops: a paid order is never fulfilled twice.
 */
export async function fulfillPaidAllpayOrder(params: {
  orderId: string;
  amount: unknown;
  currency: unknown;
}): Promise<{ ok: true; duplicate: boolean } | { ok: false; error: string }> {
  const serviceRole = createServiceRoleClient();

  const { data: order, error: orderError } = await serviceRole
    .from("orders")
    .select("id, user_id, status, total_ils, currency")
    .eq("id", params.orderId)
    .maybeSingle<OrderRow>();

  if (orderError || !order) {
    return { ok: false, error: "order_not_found" };
  }

  if (order.status === "paid") {
    await grantOrderEntitlements(serviceRole, order);
    return { ok: true, duplicate: true };
  }

  if (order.status !== "pending") {
    return { ok: false, error: "order_not_pending" };
  }

  const currency = typeof params.currency === "string" ? params.currency : String(params.currency ?? "");
  if (currency && currency.toUpperCase() !== String(order.currency || "ILS").toUpperCase()) {
    return { ok: false, error: "currency_mismatch" };
  }

  if (!amountsMatch(params.amount, Number(order.total_ils))) {
    return { ok: false, error: "amount_mismatch" };
  }

  const { data: paidRows, error: updateError } = await serviceRole
    .from("orders")
    .update({ status: "paid", provider: "allpay", provider_order_id: order.id })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .returns<{ id: string }[]>();

  if (updateError) {
    return { ok: false, error: "update_failed" };
  }

  if (!paidRows || paidRows.length === 0) {
    const { data: again } = await serviceRole.from("orders").select("status").eq("id", order.id).maybeSingle<{ status: string }>();
    if (again?.status === "paid") {
      await grantOrderEntitlements(serviceRole, order);
      return { ok: true, duplicate: true };
    }
    return { ok: false, error: "update_race" };
  }

  const granted = await grantOrderEntitlements(serviceRole, order);
  if (!granted) {
    return { ok: false, error: "entitlement_failed" };
  }

  return { ok: true, duplicate: false };
}

async function grantOrderEntitlements(
  serviceRole: ReturnType<typeof createServiceRoleClient>,
  order: OrderRow
): Promise<boolean> {
  const { data: items, error: itemsError } = await serviceRole
    .from("order_items")
    .select("product_id")
    .eq("order_id", order.id)
    .returns<{ product_id: string }[]>();

  if (itemsError || !items) return false;

  const entitlementRows = items.map((item) => ({
    user_id: order.user_id,
    product_id: item.product_id,
    source: "allpay",
    payment_reference: order.id,
  }));

  const { error: entitlementError } = await serviceRole.from("user_entitlements").upsert(entitlementRows, {
    onConflict: "user_id,product_id",
    ignoreDuplicates: true,
  });

  if (entitlementError) return false;

  await serviceRole.from("custom_plan_requests").update({ status: "paid" }).eq("order_id", order.id).eq("status", "pending_payment");
  return true;
}

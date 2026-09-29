import "server-only";
import { ALLPAY_CREATE_PAYMENT_URL, assertAllpayTestMode, getAllpayCredentials, getPublicBaseUrl } from "./config";
import { allpaySign } from "./sign";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";

type OrderItemWithProduct = {
  price_ils_at_purchase: number;
  products: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

function productName(row: OrderItemWithProduct): string {
  const products = row.products;
  if (Array.isArray(products)) return products[0]?.name ?? "Travel Smarter";
  return products?.name ?? "Travel Smarter";
}

export type CreateAllpayCheckoutResult = { ok: true; paymentUrl: string; orderId: string } | { ok: false; error: string };

/**
 * Creates an Allpay Redirect Checkout session for an existing pending order.
 * Prices come from snapshotted order_items, never from the browser.
 */
export async function createAllpayRedirectCheckout(orderId: string, client: { name?: string | null; email?: string | null }): Promise<CreateAllpayCheckoutResult> {
  try {
    assertAllpayTestMode();
    const { login, apiKey } = getAllpayCredentials();
    const baseUrl = getPublicBaseUrl();

    const serviceRole = createServiceRoleClient();
    const { data: order, error: orderError } = await serviceRole
      .from("orders")
      .select("id, status, total_ils, currency")
      .eq("id", orderId)
      .maybeSingle<{ id: string; status: string; total_ils: number; currency: string }>();

    if (orderError || !order) {
      return { ok: false, error: "الطلب غير موجود." };
    }
    if (order.status !== "pending") {
      return { ok: false, error: "هذا الطلب لم يعد بانتظار الدفع." };
    }

    const { data: itemRows, error: itemsError } = await serviceRole
      .from("order_items")
      .select("price_ils_at_purchase, products(name, slug)")
      .eq("order_id", orderId)
      .returns<OrderItemWithProduct[]>();

    if (itemsError || !itemRows || itemRows.length === 0) {
      return { ok: false, error: "تعذّر تحميل منتجات الطلب." };
    }

    const items = itemRows.map((row) => ({
      name: productName(row),
      qty: "1",
      price: String(Number(row.price_ils_at_purchase)),
      vat: "1",
    }));

    const body: Record<string, unknown> = {
      login,
      order_id: order.id,
      items,
      currency: order.currency || "ILS",
      lang: "AR",
      webhook_url: `${baseUrl}/api/allpay/webhook`,
      success_url: `${baseUrl}/checkout/success?order_id=${encodeURIComponent(order.id)}`,
      backlink_url: `${baseUrl}/checkout/cancelled?order_id=${encodeURIComponent(order.id)}`,
      client_tehudat: "000000000",
      // Explicit defense-in-depth: overrides the Allpay integration's own dashboard Test Mode
      // setting for this specific request (per Allpay's current API docs), so this app forces
      // test payments even if the dashboard setting is ever changed. assertAllpayTestMode()
      // above is the primary guard; this is a second, API-level one, not a replacement for it.
      test_mode: 1,
    };

    if (client.name && client.name.trim()) body.client_name = client.name.trim();
    if (client.email && client.email.trim()) body.client_email = client.email.trim();

    body.sign = allpaySign(body, apiKey);

    const response = await fetch(ALLPAY_CREATE_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { payment_url?: string; error_code?: number; error_msg?: string };

    if (!data.payment_url) {
      return { ok: false, error: "تعذّر فتح صفحة الدفع. حاول مرة أخرى." };
    }

    await serviceRole.from("orders").update({ provider: "allpay", provider_order_id: order.id }).eq("id", order.id).eq("status", "pending");

    return { ok: true, paymentUrl: data.payment_url, orderId: order.id };
  } catch {
    return { ok: false, error: "تعذّر تجهيز الدفع التجريبي. تأكد من إعدادات Allpay (وضع الاختبار) وروابط الموقع." };
  }
}

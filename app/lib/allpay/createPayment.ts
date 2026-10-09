import "server-only";
import { ALLPAY_CREATE_PAYMENT_URL, getAllpayCredentials, getAllpayMode, getPublicBaseUrl } from "./config";
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
 *
 * Guest orders pass `claimToken`: the buyer returns to /claim-purchase?token=... instead of the
 * logged-in success page. The token is only a URL parameter on the buyer's own redirect (it is
 * never logged, and claiming still requires the order to be webhook-verified as paid).
 */
export async function createAllpayRedirectCheckout(
  orderId: string,
  client: { name?: string | null; email?: string | null },
  options: { claimToken?: string } = {}
): Promise<CreateAllpayCheckoutResult> {
  try {
    const mode = getAllpayMode();
    const { login, apiKey } = getAllpayCredentials();
    const baseUrl = getPublicBaseUrl(mode);

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
      // Osek Patur (VAT-exempt dealer): per Allpay's docs "0" = no VAT. Prices are not changed.
      vat: "0",
    }));

    const body: Record<string, unknown> = {
      login,
      order_id: order.id,
      items,
      currency: order.currency || "ILS",
      lang: "AR",
      webhook_url: `${baseUrl}/api/allpay/webhook`,
      success_url: options.claimToken
        ? `${baseUrl}/claim-purchase?token=${encodeURIComponent(options.claimToken)}`
        : `${baseUrl}/checkout/success?order_id=${encodeURIComponent(order.id)}`,
      backlink_url: `${baseUrl}/checkout/cancelled?order_id=${encodeURIComponent(order.id)}`,
      client_tehudat: "000000000",
      // Sent explicitly in BOTH modes so ALLPAY_MODE (this app's own setting) is the single source
      // of truth: per Allpay's docs it overrides the integration's dashboard setting for this
      // request. 1 = test (cards are not charged), 0 = live. Accounts still in Allpay's
      // "developing" status are forced to test by Allpay regardless of this value.
      test_mode: mode === "live" ? 0 : 1,
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
      console.error("[allpay] Create Payment was rejected:", data.error_code, data.error_msg);
      return { ok: false, error: "تعذّر فتح صفحة الدفع. حاول مرة أخرى." };
    }

    await serviceRole.from("orders").update({ provider: "allpay", provider_order_id: order.id }).eq("id", order.id).eq("status", "pending");

    return { ok: true, paymentUrl: data.payment_url, orderId: order.id };
  } catch (error) {
    console.error("[allpay] Could not create the payment session:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, error: "تعذّر تجهيز الدفع حاليًا. حاول مرة أخرى بعد قليل، وإذا استمرت المشكلة تواصل معنا." };
  }
}

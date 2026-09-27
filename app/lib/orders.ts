import "server-only";
import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { hasProductAccess, GUIDE_BUNDLE_PRODUCT_SLUGS } from "./entitlements";

/**
 * Commerce Foundation V1 -- order domain helpers.
 *
 * No payment provider is wired up yet. This module only ever creates `pending` orders (zero
 * product access on their own -- see the orders table's own migration comment) and reads a
 * user's own orders back. Nothing here grants a user_entitlements row; that will only ever
 * happen later, from a verified payment webhook.
 *
 * Every read/write here derives the current user from the verified session
 * (`supabase.auth.getUser()`), never from a caller-supplied id -- the same trust boundary
 * `hasProductAccess` and every account/route-gate check in this project already use.
 */

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalIls: number;
  currency: string;
  provider: string | null;
  providerOrderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  priceIlsAtPurchase: number;
  createdAt: string;
};

export type OrderWithItems = Order & { items: OrderItem[] };

type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_ils: number;
  currency: string;
  provider: string | null;
  provider_order_id: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  price_ils_at_purchase: number;
  created_at: string;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    totalIls: row.total_ils,
    currency: row.currency,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    priceIlsAtPurchase: row.price_ils_at_purchase,
    createdAt: row.created_at,
  };
}

/** Every active order for the current user, newest first. Empty array if logged out. */
export async function getUserOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // RLS (user_id = auth.uid()) already scopes this to the current user alone -- the
  // .eq("user_id", ...) below is redundant with it, kept only for query clarity (same
  // convention already used in app/account/page.tsx for smart_planner_saved_plans).
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error || !data) return [];
  return data.map(mapOrder);
}

/** One order by id, only if it belongs to the current user. Null if missing, foreign, or logged out. */
export async function getUserOrder(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle<OrderRow>();

  if (error || !data) return null;
  return mapOrder(data);
}

/** One order plus its line items, only if the order belongs to the current user. */
export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle<OrderRow>();

  if (orderError || !orderRow) return null;

  // RLS on order_items (EXISTS against orders.user_id = auth.uid()) already guarantees this
  // only ever returns items for an order that passed the same-user check above.
  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .returns<OrderItemRow[]>();

  if (itemsError || !itemRows) return null;

  return { ...mapOrder(orderRow), items: itemRows.map(mapOrderItem) };
}

export type CreatePendingOrderResult = { ok: true; data: OrderWithItems } | { ok: false; error: string };

/**
 * Server-only, authoritative order creation. NOT a public browser-side "createOrder" -- this
 * is meant to be called from trusted Next.js server code only (a future Server Action/Route
 * Handler for checkout), and itself calls a service_role-only Postgres RPC that no client can
 * reach directly (see create_pending_order in the Commerce Foundation V1 migration for the
 * full trust-model writeup).
 *
 * Applies two catalog-specific normalization rules BEFORE creating anything, so the RPC
 * itself can stay a dumb/generic primitive:
 *
 * 1. Redundant Guide removal -- if the requested slugs include "barcelona-guide" AND a
 *    product that already bundles it (GUIDE_BUNDLE_PRODUCT_SLUGS, from entitlements.ts --
 *    reused, not reimplemented), the separate Guide line is dropped. barcelona-ready-plan-1day
 *    is NOT in that bundle list, so 1-day + Guide is correctly left untouched.
 * 2. Already-owned exclusion -- any slug the user already has access to (via
 *    hasProductAccess, reused as-is) is dropped, INCLUDING Guide access inherited from an
 *    already-owned bundle product (hasProductAccess("barcelona-guide", ...) already checks
 *    the bundle itself, so this falls out for free, no extra logic needed).
 *
 * If nothing is left to purchase after normalization, the whole request is rejected rather
 * than silently creating an empty order.
 */
export async function createPendingOrder(productSlugs: string[]): Promise<CreatePendingOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "يجب تسجيل الدخول لإتمام عملية الشراء." };
  }

  const deduped = [...new Set((productSlugs ?? []).map((slug) => slug?.trim()).filter((slug): slug is string => !!slug))];
  if (deduped.length === 0) {
    return { ok: false, error: "لم يتم تحديد أي منتج للشراء." };
  }

  // Rule 1: redundant Guide removal.
  const requestsBundleProduct = deduped.some((slug) => (GUIDE_BUNDLE_PRODUCT_SLUGS as readonly string[]).includes(slug));
  const afterGuideNormalization = deduped.filter((slug) => !(slug === "barcelona-guide" && requestsBundleProduct));

  // Rule 2: already-owned exclusion (direct ownership OR inherited Guide access both handled
  // by hasProductAccess itself -- see its own bundle-expansion logic in entitlements.ts).
  const ownershipChecks = await Promise.all(
    afterGuideNormalization.map(async (slug) => ({ slug, owned: await hasProductAccess(slug, user.id) }))
  );
  const finalSlugs = ownershipChecks.filter((check) => !check.owned).map((check) => check.slug);

  if (finalSlugs.length === 0) {
    return { ok: false, error: "كل المنتجات المطلوبة إما مملوكة لديك مسبقًا أو متضمنة ضمن منتج تملكه." };
  }

  // The RPC is service_role-only by design (see its own migration comment) -- this is the one
  // and only place in this module that needs the service-role client, and only after identity
  // has already been independently verified above via the session-bound client.
  const serviceRole = createServiceRoleClient();
  const { data: orderRow, error: rpcError } = await serviceRole
    .rpc("create_pending_order", { p_user_id: user.id, p_product_slugs: finalSlugs })
    .single<OrderRow>();

  if (rpcError || !orderRow) {
    return { ok: false, error: "تعذّر إنشاء الطلب. حاول مرة أخرى." };
  }

  const { data: itemRows, error: itemsError } = await serviceRole
    .from("order_items")
    .select("*")
    .eq("order_id", orderRow.id)
    .returns<OrderItemRow[]>();

  if (itemsError || !itemRows) {
    return { ok: false, error: "تعذّر تحميل تفاصيل الطلب بعد إنشائه." };
  }

  return { ok: true, data: { ...mapOrder(orderRow), items: itemRows.map(mapOrderItem) } };
}

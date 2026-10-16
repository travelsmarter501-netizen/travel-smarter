import "server-only";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";
import { PRODUCT_CONTENT_ROUTES, PRODUCT_SLUGS } from "./catalog";

type ServiceRole = ReturnType<typeof createServiceRoleClient>;

/**
 * Where a customer goes right after a purchase is attached to their account -- straight to what they bought:
 *   - a Personalized Plan  -> /planner (its "Build my plan" card);
 *   - exactly one product with a content page (guide, 1/3/5-day plan) -> that page;
 *   - anything else (several products) -> /account.
 * Only fixed in-app paths are ever returned, never anything taken from the browser.
 */
export function destinationForPurchase(productSlugs: readonly string[], hasPersonalizedRequest: boolean): string {
  if (hasPersonalizedRequest || productSlugs.includes(PRODUCT_SLUGS.personalizedPlan)) return "/planner";
  const routes = [...new Set(productSlugs.map((slug) => PRODUCT_CONTENT_ROUTES[slug]).filter((route): route is string => !!route))];
  return routes.length === 1 ? routes[0] : "/account";
}

type ItemRow = { products: { slug: string } | { slug: string }[] | null };

/** The destination for the order with this claim-token hash, which must already belong to `userId`. Falls back to /account. */
export async function claimedOrderDestination(serviceRole: ServiceRole, params: { tokenHash: string; userId: string }): Promise<string> {
  try {
    const { data: order } = await serviceRole
      .from("orders")
      .select("id")
      .eq("claim_token_hash", params.tokenHash)
      .eq("user_id", params.userId)
      .maybeSingle<{ id: string }>();
    if (!order) return "/account";

    const [{ data: items }, { data: request }] = await Promise.all([
      serviceRole.from("order_items").select("products(slug)").eq("order_id", order.id).returns<ItemRow[]>(),
      serviceRole.from("personalized_plan_requests").select("id").eq("order_id", order.id).maybeSingle<{ id: string }>(),
    ]);
    const slugs = (items ?? []).flatMap((item) => (Array.isArray(item.products) ? item.products.map((p) => p.slug) : item.products ? [item.products.slug] : []));
    return destinationForPurchase(slugs, !!request);
  } catch {
    return "/account";
  }
}

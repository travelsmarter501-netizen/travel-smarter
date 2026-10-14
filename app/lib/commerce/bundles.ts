import "server-only";
import { createServiceRoleClient } from "../../../utils/supabase/service-role";
import { GUIDE_BUNDLE_PRODUCT_SLUGS } from "../entitlements";
import { PRODUCT_SLUGS } from "./catalog";
import { destinationIncludesGuide } from "../planner/personalizedPlanAnswers";

type ServiceRole = ReturnType<typeof createServiceRoleClient>;

type ItemRow = { products: { slug: string } | { slug: string }[] | null };

/**
 * The 3-day and 5-day Ready Plans are sold as "+ Barcelona Guide". Access was already covered (a bundle
 * product is accepted wherever the guide is checked -- see hasProductAccess), but no guide entitlement ROW
 * was ever created, so the guide never appeared as one of the buyer's purchases.
 *
 * This records that row. It is called from the two places entitlements are created from a paid order, so a
 * signed-in purchase and a claimed guest purchase end with the identical set:
 *   - the verified Allpay webhook (fulfillPaidOrder.ts), for an order that already has an owner;
 *   - the guest claim (claim-purchase/actions.ts), for the order the authenticated user just claimed.
 *
 * The Personalized Plan also bundles the guide, but by DESTINATION rather than by product: a Barcelona plan includes
 * the Barcelona guide, any other destination grants none (see DESTINATION_INCLUDED_GUIDE_SLUG). The destination is
 * read from the order's own personalized_plan_requests row, which was validated against the server's allow-list
 * when the order was created and can never be edited afterwards.
 *
 * Rules: it only ever acts for an order the caller has already established as PAID and OWNED by `userId`;
 * it grants nothing unless the order contains a bundle product (or a personalized plan for a destination that
 * includes a guide); the row is inserted with the same
 * (user_id, product_id) upsert-ignore the other entitlements use, so repeats and a pre-existing guide
 * entitlement (e.g. an earlier direct purchase) are harmless. No price, order total or order_items row is
 * touched -- the guide is not a charged line.
 *
 * Returns false on any database error so the caller can retry (the webhook then answers 500 and Allpay
 * redelivers; the redelivery goes through the idempotent "already paid" path and calls this again).
 */
export async function recordBundledGuideEntitlement(serviceRole: ServiceRole, params: { userId: string; orderId: string }): Promise<boolean> {
  const { data: items, error: itemsError } = await serviceRole
    .from("order_items")
    .select("products(slug)")
    .eq("order_id", params.orderId)
    .returns<ItemRow[]>();

  if (itemsError || !items) return false;

  const slugs = items.flatMap((item) => (Array.isArray(item.products) ? item.products.map((p) => p.slug) : item.products ? [item.products.slug] : []));
  let grantsGuide = slugs.some((slug) => (GUIDE_BUNDLE_PRODUCT_SLUGS as readonly string[]).includes(slug));

  if (!grantsGuide && slugs.includes(PRODUCT_SLUGS.personalizedPlan)) {
    const { data: request, error: requestError } = await serviceRole
      .from("personalized_plan_requests")
      .select("destination_id")
      .eq("order_id", params.orderId)
      .maybeSingle<{ destination_id: string }>();
    if (requestError) return false;
    grantsGuide = destinationIncludesGuide(request?.destination_id);
  }

  if (!grantsGuide) return true;

  const { data: guide, error: guideError } = await serviceRole.from("products").select("id").eq("slug", PRODUCT_SLUGS.guide).maybeSingle<{ id: string }>();
  if (guideError || !guide) return false;

  const { error } = await serviceRole.from("user_entitlements").upsert(
    [{ user_id: params.userId, product_id: guide.id, source: "allpay", payment_reference: params.orderId }],
    { onConflict: "user_id,product_id", ignoreDuplicates: true }
  );
  return !error;
}

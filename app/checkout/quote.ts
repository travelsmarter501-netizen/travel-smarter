"use server";

import { createClient } from "../../utils/supabase/server";
import { createServiceRoleClient } from "../../utils/supabase/service-role";
import { resolveCheckoutProductSlugs, PRODUCT_SLUGS } from "../lib/commerce/catalog";
import { GUIDE_BUNDLE_PRODUCT_SLUGS, hasProductAccess } from "../lib/entitlements";

/**
 * "What will I be charged?" for the checkout page. READ-ONLY: it creates no order, calls no payment provider and grants nothing.
 *
 * The amounts come from the database (public.products.price_ils) -- the same table create_pending_order sums to compute the real charge --
 * and the same two normalization rules createPendingOrder applies are applied here, so the number the customer reads is the number that will be
 * charged:
 *   1. a stand-alone Guide line is dropped when the cart holds a plan that already includes the Guide (not charged, shown as "included");
 *   2. for a signed-in customer, anything they already own is dropped (not charged, shown as "owned"). Guests have no verified identity,
 *      so nothing is excluded for them -- exactly like guest checkout.
 * The Personalized Plan is never quoted here (it is bought from the planner, which already shows its database price).
 *
 * This is information only. startCartCheckout still recomputes everything itself; nothing here is trusted by it.
 */
export type CheckoutQuoteLine = { slug: string; priceIls: number; notCharged?: "included" | "owned" };
export type CheckoutQuote = { ok: true; lines: CheckoutQuoteLine[]; totalIls: number } | { ok: false };

const MAX_ITEMS = 10;

export async function quoteCheckout(input: { cartIds?: string[]; productSlugs?: string[] }): Promise<CheckoutQuote> {
  const cartIds = Array.isArray(input?.cartIds) ? input.cartIds.filter((x): x is string => typeof x === "string").slice(0, MAX_ITEMS) : undefined;
  const productSlugs = Array.isArray(input?.productSlugs) ? input.productSlugs.filter((x): x is string => typeof x === "string").slice(0, MAX_ITEMS) : undefined;

  let slugs: string[];
  try {
    slugs = resolveCheckoutProductSlugs({ cartIds, productSlugs });
  } catch {
    return { ok: false };
  }
  slugs = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  if (slugs.length === 0 || slugs.includes(PRODUCT_SLUGS.personalizedPlan)) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const includesGuideBundle = slugs.some((slug) => (GUIDE_BUNDLE_PRODUCT_SLUGS as readonly string[]).includes(slug));
  const status = new Map<string, "included" | "owned" | undefined>();
  for (const slug of slugs) {
    if (slug === PRODUCT_SLUGS.guide && includesGuideBundle) status.set(slug, "included");
    else if (user && (await hasProductAccess(slug, user.id))) status.set(slug, "owned");
    else status.set(slug, undefined);
  }

  const { data: rows, error } = await createServiceRoleClient()
    .from("products")
    .select("slug, price_ils")
    .in("slug", slugs)
    .eq("active", true)
    .returns<{ slug: string; price_ils: number | string }[]>();
  if (error || !rows) return { ok: false };

  const priceOf = new Map(rows.map((row) => [row.slug, Number(row.price_ils)]));
  const lines: CheckoutQuoteLine[] = [];
  for (const slug of slugs) {
    const price = priceOf.get(slug);
    if (price === undefined || !Number.isFinite(price)) return { ok: false };
    const notCharged = status.get(slug);
    lines.push(notCharged ? { slug, priceIls: price, notCharged } : { slug, priceIls: price });
  }

  const totalIls = lines.filter((line) => !line.notCharged).reduce((sum, line) => sum + line.priceIls, 0);
  return { ok: true, lines, totalIls };
}

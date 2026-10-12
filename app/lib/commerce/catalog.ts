/**
 * The ONE place that names each paid product's `public.products.slug`. Both sides import these:
 * checkout (CART_ID_TO_PRODUCT_SLUG below -> orders -> user_entitlements.product_id) and every
 * protected page / server action (hasProductAccess). Because they share the same constant, a
 * product can never be sold under one identifier and gated under another.
 */
export const PRODUCT_SLUGS = {
  guide: "barcelona-guide",
  readyPlan1Day: "barcelona-ready-plan-1day",
  readyPlan3Day: "barcelona-ready-plan-3day",
  readyPlan5Day: "barcelona-ready-plan",
  personalizedPlan: "travel-smarter-personalized-plan",
} as const;

/**
 * Where each owned product opens (the entitlement-gated content route). /account links owners here;
 * normal shoppers never are -- the storefront sells through /#products + /checkout. Keyed by the same
 * PRODUCT_SLUGS the checkout and the page gates use, so a product cannot be sold under one slug and
 * listed under another. (Legacy slugs are kept only so old entitlement rows still resolve to a page.)
 */
export const PRODUCT_CONTENT_ROUTES: Record<string, string> = {
  [PRODUCT_SLUGS.guide]: "/guides/barcelona",
  [PRODUCT_SLUGS.readyPlan1Day]: "/ready-plans/barcelona/1-day",
  [PRODUCT_SLUGS.readyPlan3Day]: "/ready-plans/barcelona/3-days",
  [PRODUCT_SLUGS.readyPlan5Day]: "/ready-plans/barcelona",
  [PRODUCT_SLUGS.personalizedPlan]: "/planner",
  "barcelona-smart-planner": "/planner",
};

/**
 * Maps storefront cart ids (homepage / localStorage) to `public.products.slug`.
 * Checkout never trusts client-supplied prices — only these slugs are sent to createPendingOrder.
 */
export const CART_ID_TO_PRODUCT_SLUG: Record<string, string> = {
  "personalized-trip-plan": PRODUCT_SLUGS.personalizedPlan,
  "barcelona-1day": PRODUCT_SLUGS.readyPlan1Day,
  "barcelona-guide": PRODUCT_SLUGS.guide,
  "barcelona-3day": PRODUCT_SLUGS.readyPlan3Day,
  "barcelona-5day": PRODUCT_SLUGS.readyPlan5Day,
};

const PRODUCT_SLUG_SET = new Set([
  ...Object.values(CART_ID_TO_PRODUCT_SLUG),
  "barcelona-smart-planner",
  "barcelona-custom-plan",
]);

export function isSellableProductSlug(slug: string): boolean {
  return PRODUCT_SLUG_SET.has(slug);
}

export function resolveCheckoutProductSlugs(input: { cartIds?: string[]; productSlugs?: string[] }): string[] {
  const slugs: string[] = [];
  for (const cartId of input.cartIds ?? []) {
    const slug = CART_ID_TO_PRODUCT_SLUG[cartId];
    if (!slug) {
      throw new Error(`Unknown cart product: ${cartId}`);
    }
    slugs.push(slug);
  }
  for (const slug of input.productSlugs ?? []) {
    if (!PRODUCT_SLUG_SET.has(slug)) {
      throw new Error(`Unknown product: ${slug}`);
    }
    slugs.push(slug);
  }
  return slugs;
}

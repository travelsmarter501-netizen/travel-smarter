/**
 * Maps storefront cart ids (homepage / localStorage) to `public.products.slug`.
 * Checkout never trusts client-supplied prices — only these slugs are sent to createPendingOrder.
 */
export const CART_ID_TO_PRODUCT_SLUG: Record<string, string> = {
  "personalized-trip-plan": "travel-smarter-personalized-plan",
  "barcelona-1day": "barcelona-ready-plan-1day",
  "barcelona-guide": "barcelona-guide",
  "barcelona-3day": "barcelona-ready-plan-3day",
  "barcelona-5day": "barcelona-ready-plan",
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

/**
 * ONE place for the PRICES THE SITE DISPLAYS -- and for the launch-sale "was" prices.
 *
 * What is authoritative: the amount a customer is CHARGED comes only from the database, public.products.price_ils.
 * create_pending_order sums it, order_items snapshots it, Allpay is asked for exactly that snapshot and the webhook verifies it.
 * Nothing in this file is ever read by order creation, Allpay, payment verification or any report.
 *
 * - "launch" is the current price. It must equal products.price_ils (a migration sets it; app/lib/commerce/pricing.debug.ts fails if
 *   this file, the migrations, the homepage catalog and the product data files ever disagree).
 * - "reference" is the old price, shown struck through next to the launch price as a marketing reference ONLY.
 *
 * Keys are the storefront cart ids (the same ids as CART_ID_TO_PRODUCT_SLUG in catalog.ts). Plain module: safe to import from
 * server and client code.
 */
export type PricedCartId = "personalized-trip-plan" | "barcelona-1day" | "barcelona-guide" | "barcelona-3day" | "barcelona-5day";

type PriceEntry = { launch: number; reference: number };

export const PRODUCT_PRICES_ILS: Record<PricedCartId, PriceEntry> = {
  "personalized-trip-plan": { launch: 39, reference: 59 },
  "barcelona-1day": { launch: 12, reference: 19 },
  "barcelona-guide": { launch: 17, reference: 29 },
  "barcelona-3day": { launch: 22, reference: 34 },
  "barcelona-5day": { launch: 27, reference: 39 },
};

const entryFor = (cartId: string): PriceEntry | undefined => (PRODUCT_PRICES_ILS as Record<string, PriceEntry | undefined>)[cartId];

/** The launch price for a storefront cart id, or undefined for anything that is not one of the five products. */
export function launchPriceIls(cartId: string): number | undefined {
  return entryFor(cartId)?.launch;
}

/**
 * The struck-through "was" price to show next to currentIls, or undefined when there is nothing honest to strike (no reference
 * price, or the price being shown is not actually lower than it). DISPLAY ONLY.
 */
export function referencePriceIfDiscounted(cartId: string, currentIls: number): number | undefined {
  const reference = entryFor(cartId)?.reference;
  return reference !== undefined && reference > currentIls ? reference : undefined;
}

/**
 * The 3-day and 5-day plans already include the Barcelona Guide, so a cart holding one of them AND the stand-alone Guide is only
 * charged for the plan (the server drops the separate Guide line -- see dropRedundantGuide in orders.ts). This mirrors that rule for
 * DISPLAY ONLY (cart subtotal and an "included" label); the real quote and the real charge are computed on the server.
 */
export const GUIDE_INCLUDING_CART_IDS: readonly string[] = ["barcelona-3day", "barcelona-5day"];

export function isGuideIncludedInCart(cartIds: readonly string[], cartId: string): boolean {
  return cartId === "barcelona-guide" && cartIds.some((id) => GUIDE_INCLUDING_CART_IDS.includes(id));
}

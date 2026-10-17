import { homepageTranslations, type Language } from "./homepageTranslations";
import { CART_ID_TO_PRODUCT_SLUG, PRODUCT_CONTENT_ROUTES } from "./commerce/catalog";
import type { OwnedProduct } from "./entitlements";

/**
 * What the account page's "Purchases" list shows, built from plain data so it can be tested without a browser: product name, the date it
 * was bought and where "Open" goes. The customer never sees "entitlements" or "claiming".
 *
 * The Personalized Plan is ONE purchase like any other product -- it unlocks the planner -- so it stays in this list (opening /planner)
 * for as long as the customer owns it, whether they have saved plans or deleted them all. Their individual plans are listed under "My plans".
 */
export type AccountPurchase = { key: string; slug: string; fallbackName: string; purchasedAt: string; href: string | null };

export function buildAccountPurchases(input: { entitlements: readonly OwnedProduct[] }): AccountPurchase[] {
  return input.entitlements
    .map((owned) => ({
      key: `product:${owned.productSlug}`,
      slug: owned.productSlug,
      fallbackName: owned.productName,
      purchasedAt: owned.grantedAt,
      href: PRODUCT_CONTENT_ROUTES[owned.productSlug] ?? null,
    }))
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
}

/** The product's name in the visitor's language (the storefront's own titles), falling back to the database name. */
export function productDisplayName(slug: string, language: Language, fallback: string): string {
  const cartId = Object.keys(CART_ID_TO_PRODUCT_SLUG).find((id) => CART_ID_TO_PRODUCT_SLUG[id] === slug);
  if (!cartId) return fallback;
  return homepageTranslations[language].products.items.find((item) => item.id === cartId)?.title ?? fallback;
}

/**
 * dd/mm/yyyy in Israel time, the same digits in Arabic and English (so "16/10/2026" reads the same everywhere and the server and
 * the browser always agree, whatever the visitor's own time zone is).
 */
export function formatPurchaseDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Jerusalem" }).format(date);
}

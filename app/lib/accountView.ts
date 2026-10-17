import { homepageTranslations, type Language } from "./homepageTranslations";
import { CART_ID_TO_PRODUCT_SLUG, PRODUCT_CONTENT_ROUTES, PRODUCT_SLUGS } from "./commerce/catalog";
import type { OwnedProduct } from "./entitlements";
import type { TripDetailsInput } from "./planner/personalizedSummary";

/**
 * What the account page's "Purchases" list shows, built from plain data so it can be tested without a browser:
 *   product name, the date it was bought, and where "Open" goes. The customer never sees "entitlements" or "claiming".
 *
 * A Personalized Plan is bought PER TRIP, so each paid request is its own purchase row (with its own date and destination).
 * The product-level entitlement row for the Personalized Plan (one per account, from before the questionnaire-first model) is
 * only shown when the customer has no paid personalized request at all -- otherwise it would look like a single permanent
 * purchase of something that is bought again for every trip.
 */

export type PersonalizedPurchase = {
  requestId: string;
  destinationId: string;
  days: number | null;
  /** The questionnaire answers this purchase was made for (interests / accommodation), shown instead of a purchase date. */
  details: TripDetailsInput;
  /** When the order was paid (falls back to when it was created). */
  purchasedAt: string;
  /** True once the plan was built (generated_at is set) -- stays true even if the saved plan was deleted later. */
  generated: boolean;
  /** The saved plan this purchase produced, if it still exists. */
  planId: string | null;
};

export type AccountPurchase =
  | { key: string; kind: "product"; slug: string; fallbackName: string; purchasedAt: string; href: string | null }
  | { key: string; kind: "personalized"; requestId: string; destinationId: string; days: number | null; details: TripDetailsInput; purchasedAt: string; href: string | null; built: boolean };

const LEGACY_PERSONALIZED_SLUGS: readonly string[] = [PRODUCT_SLUGS.personalizedPlan, "barcelona-smart-planner"];

export function buildAccountPurchases(input: { entitlements: readonly OwnedProduct[]; personalized: readonly PersonalizedPurchase[] }): AccountPurchase[] {
  const hasPersonalizedPurchases = input.personalized.length > 0;

  const products: AccountPurchase[] = input.entitlements
    .filter((owned) => !(hasPersonalizedPurchases && LEGACY_PERSONALIZED_SLUGS.includes(owned.productSlug)))
    .map((owned) => ({
      key: `product:${owned.productSlug}`,
      kind: "product" as const,
      slug: owned.productSlug,
      fallbackName: owned.productName,
      purchasedAt: owned.grantedAt,
      href: PRODUCT_CONTENT_ROUTES[owned.productSlug] ?? null,
    }));

  const personalized: AccountPurchase[] = input.personalized.map((purchase) => ({
    key: `personalized:${purchase.requestId}`,
    kind: "personalized" as const,
    requestId: purchase.requestId,
    destinationId: purchase.destinationId,
    days: purchase.days,
    details: purchase.details,
    purchasedAt: purchase.purchasedAt,
    // built -> its plan (no button if that plan was deleted); not built yet -> the planner's "Build my plan".
    href: purchase.planId ? `/smart-planner/barcelona-v2/saved/${purchase.planId}` : purchase.generated ? null : "/planner",
    built: purchase.generated,
  }));

  return [...products, ...personalized].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
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

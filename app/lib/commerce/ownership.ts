import { CART_ID_TO_PRODUCT_SLUG, PRODUCT_SLUGS } from "./catalog";
import { GUIDE_BUNDLE_PRODUCT_SLUGS } from "./guideBundles";

/**
 * Which storefront cards (cart ids) a signed-in customer already owns -- so those cards can offer "Open" instead of a price and a
 * buy button. Display logic only: nothing is granted or protected here (every content page still checks the entitlement on the
 * server), and checkout independently refuses to charge for something already owned.
 *
 *   - barcelona-1day / -3day / -5day: owned exactly when that product's entitlement exists. Owning one plan never marks another
 *     as owned (a 5-day plan does not unlock the 1-day or 3-day plan).
 *   - barcelona-guide: also owned through a Guide-bundle product (3-day, 5-day), mirroring hasProductAccess on the server.
 *   - the Personalized Plan is deliberately NEVER "owned": it is bought again for every trip, and having bought it once (or having
 *     the legacy entitlement) must not hide the way to buy another.
 */
export const OWNABLE_CART_IDS = Object.keys(CART_ID_TO_PRODUCT_SLUG).filter((cartId) => CART_ID_TO_PRODUCT_SLUG[cartId] !== PRODUCT_SLUGS.personalizedPlan);

export function ownedCartIds(ownedProductSlugs: Iterable<string>): Set<string> {
  const owned = new Set(ownedProductSlugs);
  const result = new Set<string>();
  for (const cartId of OWNABLE_CART_IDS) {
    const slug = CART_ID_TO_PRODUCT_SLUG[cartId];
    if (owned.has(slug)) {
      result.add(cartId);
    } else if (slug === PRODUCT_SLUGS.guide && GUIDE_BUNDLE_PRODUCT_SLUGS.some((bundle) => owned.has(bundle))) {
      result.add(cartId);
    }
  }
  return result;
}

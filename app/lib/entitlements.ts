import { createClient } from "../../utils/supabase/server";

export type OwnedProduct = {
  productSlug: string;
  productName: string;
  grantedAt: string;
};

/**
 * Products whose purchase also includes Barcelona Guide access, even though the owner never
 * bought "barcelona-guide" directly -- see the "Guide-Included Value" task. Deliberately does
 * NOT include "barcelona-ready-plan-1day": the 1-day plan is a standalone product and does
 * not bundle Guide access. This list only ever affects a check FOR "barcelona-guide" itself
 * (see hasProductAccess below) -- it never grants cross-access between arbitrary products, so
 * it cannot change how entitlement checks behave for any other destination or product.
 *
 * NOTE: "barcelona-guide" and (as of this task) "barcelona-ready-plan-3day" exist as real
 * rows in the products table (see supabase/migrations/). "barcelona-ready-plan" (5-day) and
 * "barcelona-smart-planner" have still not been seeded, so this bundle logic is correct for
 * all three but currently only has an observable effect for the 3-day product until those
 * two rows are also added via a migration -- see this task's final report.
 */
export const GUIDE_BUNDLE_PRODUCT_SLUGS = ["barcelona-ready-plan", "barcelona-ready-plan-3day", "barcelona-smart-planner"] as const;

type EntitlementRow = {
  granted_at: string;
  products: { slug: string; name: string; active: boolean } | null;
};

/**
 * Server-only. Checks whether the currently authenticated user (identity read
 * from the Supabase session cookie — never from client-supplied input) owns
 * the given active product.
 *
 * Pass `knownUserId` when the caller already resolved the user via
 * `supabase.auth.getUser()` (e.g. to also decide a logged-out redirect), so this
 * doesn't make a second round-trip to the auth server for the same request.
 */
export async function hasProductAccess(productSlug: string, knownUserId?: string | null): Promise<boolean> {
  const supabase = await createClient();

  let userId = knownUserId;
  if (userId === undefined) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return false;

  // A check for "barcelona-guide" also accepts any of the bundle products above -- e.g. owning
  // the 5-day Ready Plan grants Guide access too, since the Guide is included with it. Any
  // other productSlug is checked exactly as before (a single-element list behaves identically
  // to the old .eq(...) check).
  const acceptedSlugs: readonly string[] =
    productSlug === "barcelona-guide" ? [productSlug, ...GUIDE_BUNDLE_PRODUCT_SLUGS] : [productSlug];

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("granted_at, products!inner(slug, name, active)")
    .eq("user_id", userId)
    .in("products.slug", acceptedSlugs)
    .eq("products.active", true)
    .limit(1)
    .maybeSingle<EntitlementRow>();

  if (error || !data) return false;
  return data.products?.active === true;
}

/** Server-only. Returns every active product the currently authenticated user owns. */
export async function getUserEntitlements(): Promise<OwnedProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("granted_at, products!inner(slug, name, active)")
    .eq("user_id", user.id)
    .eq("products.active", true)
    .order("granted_at", { ascending: false })
    .returns<EntitlementRow[]>();

  if (error || !data) return [];

  return data
    .filter((row): row is EntitlementRow & { products: NonNullable<EntitlementRow["products"]> } => row.products !== null)
    .map((row) => ({
      productSlug: row.products.slug,
      productName: row.products.name,
      grantedAt: row.granted_at,
    }));
}

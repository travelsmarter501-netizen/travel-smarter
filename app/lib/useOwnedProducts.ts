"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { useAuthStatus } from "./useAuthStatus";
import { ownedCartIds } from "./commerce/ownership";
import { V2_SAVED_PLAN_PRODUCT_SLUG } from "./planner/smartPlannerV2SavedPlans";

export type OwnedProductsState = {
  /**
   * "unknown": the session is not known yet (this is also what the server renders -- show the normal storefront);
   * "loading": a signed-in visitor whose purchases are still being read; "signedOut": nobody to look up; "ready": looked up.
   */
  status: "unknown" | "loading" | "signedOut" | "ready";
  /** Storefront card ids (barcelona-guide, barcelona-3day, ...) the visitor already owns. Never contains the Personalized Plan. */
  ownedCartIds: ReadonlySet<string>;
  /** The visitor has at least one personalized plan or paid plan request (so "Open my plans" is useful). */
  hasPersonalizedPlans: boolean;
};

const EMPTY: ReadonlySet<string> = new Set();
type Loaded = { ownedCartIds: ReadonlySet<string>; hasPersonalizedPlans: boolean };

/**
 * For the homepage cards only: which products the signed-in visitor already owns. Read with the visitor's own browser session, so
 * row-level security decides what comes back (their entitlements, their requests, their saved plans) -- nothing here can see anyone
 * else's data, and nothing here grants anything. Signed-out visitors cost no request.
 */
export function useOwnedProducts(): OwnedProductsState {
  const auth = useAuthStatus();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (auth !== "signedIn") return;
    let cancelled = false;
    const supabase = createClient();

    Promise.all([
      supabase.from("user_entitlements").select("products!inner(slug, active)").eq("products.active", true).returns<{ products: { slug: string } | { slug: string }[] }[]>(),
      supabase.from("personalized_plan_requests").select("id, source, orders(status)").limit(20),
      supabase.from("smart_planner_saved_plans").select("id").eq("product_slug", V2_SAVED_PLAN_PRODUCT_SLUG).limit(1),
    ])
      .then(([entitlements, requests, plans]) => {
        if (cancelled) return;
        const slugs = (entitlements.data ?? []).flatMap((row) => (Array.isArray(row.products) ? row.products.map((p) => p.slug) : [row.products.slug]));
        const requestRows = (requests.data ?? []) as { source: string; orders: { status: string } | { status: string }[] | null }[];
        const hasPaidRequest = requestRows.some((row) => {
          if (row.source === "complimentary") return true;
          const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
          return order?.status === "paid";
        });
        setLoaded({ ownedCartIds: ownedCartIds(slugs), hasPersonalizedPlans: hasPaidRequest || (plans.data ?? []).length > 0 });
      })
      .catch(() => {
        // Could not read purchases: show the normal storefront (the server still protects everything).
        if (!cancelled) setLoaded({ ownedCartIds: EMPTY, hasPersonalizedPlans: false });
      });

    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (auth === "loading") return { status: "unknown", ownedCartIds: EMPTY, hasPersonalizedPlans: false };
  if (auth === "signedOut") return { status: "signedOut", ownedCartIds: EMPTY, hasPersonalizedPlans: false };
  if (!loaded) return { status: "loading", ownedCartIds: EMPTY, hasPersonalizedPlans: false };
  return { status: "ready", ownedCartIds: loaded.ownedCartIds, hasPersonalizedPlans: loaded.hasPersonalizedPlans };
}

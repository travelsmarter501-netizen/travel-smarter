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
  /**
   * Where the visitor stands with the Personalized Plan (which is bought per trip, so it is never in ownedCartIds):
   * "generated" = at least one plan built from a paid / complimentary request (or a saved personalized plan) -> the card shows "Open my plan";
   * "unbuilt"   = a paid request is waiting to be built (takes precedence)                                       -> "Build my plan";
   * "none"      = nothing yet                                                                                    -> the normal sell state.
   */
  personalized: "none" | "unbuilt" | "generated";
};

const EMPTY: ReadonlySet<string> = new Set();
type Loaded = { ownedCartIds: ReadonlySet<string>; personalized: OwnedProductsState["personalized"] };

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
      supabase.from("personalized_plan_requests").select("id, source, generated_at, orders(status)").limit(50),
      supabase.from("smart_planner_saved_plans").select("id").eq("product_slug", V2_SAVED_PLAN_PRODUCT_SLUG).limit(1),
    ])
      .then(([entitlements, requests, plans]) => {
        if (cancelled) return;
        const slugs = (entitlements.data ?? []).flatMap((row) => (Array.isArray(row.products) ? row.products.map((p) => p.slug) : [row.products.slug]));
        const requestRows = (requests.data ?? []) as { source: string; generated_at: string | null; orders: { status: string } | { status: string }[] | null }[];
        const isPaid = (row: (typeof requestRows)[number]) => {
          if (row.source === "complimentary") return true;
          const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
          return order?.status === "paid";
        };
        const unbuilt = requestRows.some((row) => isPaid(row) && !row.generated_at);
        const generated = requestRows.some((row) => isPaid(row) && !!row.generated_at) || (plans.data ?? []).length > 0;
        setLoaded({ ownedCartIds: ownedCartIds(slugs), personalized: unbuilt ? "unbuilt" : generated ? "generated" : "none" });
      })
      .catch(() => {
        // Could not read purchases: show the normal storefront (the server still protects everything).
        if (!cancelled) setLoaded({ ownedCartIds: EMPTY, personalized: "none" });
      });

    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (auth === "loading") return { status: "unknown", ownedCartIds: EMPTY, personalized: "none" };
  if (auth === "signedOut") return { status: "signedOut", ownedCartIds: EMPTY, personalized: "none" };
  if (!loaded) return { status: "loading", ownedCartIds: EMPTY, personalized: "none" };
  return { status: "ready", ownedCartIds: loaded.ownedCartIds, personalized: loaded.personalized };
}

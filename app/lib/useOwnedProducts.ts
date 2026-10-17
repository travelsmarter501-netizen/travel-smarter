"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { useAuthStatus } from "./useAuthStatus";
import { ownedCartIds } from "./commerce/ownership";

export type OwnedProductsState = {
  /**
   * "unknown": the session is not known yet (this is also what the server renders -- show the normal storefront);
   * "loading": a signed-in visitor whose purchases are still being read; "signedOut": nobody to look up; "ready": looked up.
   */
  status: "unknown" | "loading" | "signedOut" | "ready";
  /** Storefront card ids (barcelona-guide, barcelona-3day, ...) the visitor already owns. Never contains the Personalized Plan. */
  ownedCartIds: ReadonlySet<string>;
  /**
   * The visitor OWNS the Personalized Plan (an entitlement from any earlier model, or a paid purchase of theirs): the planner is unlocked for
   * them, so its card is "Purchased" with ONE button into the planner. It is not part of ownedCartIds (those cards open a content page).
   */
  ownsPersonalizedPlanner: boolean;
};

const EMPTY: ReadonlySet<string> = new Set();
type Loaded = { ownedCartIds: ReadonlySet<string>; ownsPersonalizedPlanner: boolean };

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
      supabase.from("personalized_plan_requests").select("id, source, orders(status)").limit(50),
    ])
      .then(([entitlements, requests]) => {
        if (cancelled) return;
        const slugs = (entitlements.data ?? []).flatMap((row) => (Array.isArray(row.products) ? row.products.map((p) => p.slug) : [row.products.slug]));
        // Ownership mirrors the server's rule: an entitlement to the product, or a PAID order of theirs that contains it.
        const hasPaidRequest = ((requests.data ?? []) as { orders: { status: string } | { status: string }[] | null }[]).some((row) => {
          const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
          return order?.status === "paid";
        });
        setLoaded({ ownedCartIds: ownedCartIds(slugs), ownsPersonalizedPlanner: slugs.includes("travel-smarter-personalized-plan") || hasPaidRequest });
      })
      .catch(() => {
        // Could not read purchases: show the normal storefront (the server still protects everything).
        if (!cancelled) setLoaded({ ownedCartIds: EMPTY, ownsPersonalizedPlanner: false });
      });

    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (auth === "loading") return { status: "unknown", ownedCartIds: EMPTY, ownsPersonalizedPlanner: false };
  if (auth === "signedOut") return { status: "signedOut", ownedCartIds: EMPTY, ownsPersonalizedPlanner: false };
  if (!loaded) return { status: "loading", ownedCartIds: EMPTY, ownsPersonalizedPlanner: false };
  return { status: "ready", ownedCartIds: loaded.ownedCartIds, ownsPersonalizedPlanner: loaded.ownsPersonalizedPlanner };
}

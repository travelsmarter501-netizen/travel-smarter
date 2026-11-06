"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOwnedProducts } from "../../lib/useOwnedProducts";

/**
 * Who is looking at the homepage, for wording only -- it grants nothing and protects nothing (every protected page and action still checks
 * the session on the server).
 *
 *   "visitor"  signed out, or signed in without the Personalized Plan: the normal "start your plan" messaging
 *   "pending"  signed in, purchases still being read: purchase messaging stays reserved but hidden, so an owner is never told to buy
 *   "owner"    owns the Personalized Plan: "create a new plan" / "my plans", no price
 *
 * One provider reads ownership once (the existing useOwnedProducts mechanism, which uses the visitor's own session and row-level security);
 * the hero and the price section both read the result.
 */
export type HomeAudienceState = {
  audience: "visitor" | "pending" | "owner";
  signedIn: boolean;
  /** False only until the session is known (the server render and the first client pass): nothing purchase-related that depends on it is shown before. */
  resolved: boolean;
};

const HomeAudienceContext = createContext<HomeAudienceState>({ audience: "visitor", signedIn: false, resolved: false });

export function HomeAudienceProvider({ children }: { children: ReactNode }) {
  const owned = useOwnedProducts();
  const signedIn = owned.status === "loading" || owned.status === "ready";
  const audience: HomeAudienceState["audience"] =
    owned.status === "loading" ? "pending" : owned.status === "ready" && owned.ownsPersonalizedPlanner ? "owner" : "visitor";
  const resolved = owned.status !== "unknown";
  return <HomeAudienceContext.Provider value={{ audience, signedIn, resolved }}>{children}</HomeAudienceContext.Provider>;
}

export function useHomeAudience(): HomeAudienceState {
  return useContext(HomeAudienceContext);
}

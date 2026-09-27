"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { homepageTranslations } from "./homepageTranslations";

export type CartItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  priceILS: number;
  route: string;
};

const STORAGE_KEY = "travel-smarter-cart";
const listeners = new Set<() => void>();
const EMPTY_CART: CartItem[] = [];

// Cart items persist their priceILS into localStorage at add-to-cart time, so a price change
// in the catalog (homepageTranslations) does not retroactively update carts saved before the
// change. Prices are locale-independent (ar/en entries always match), so the ar catalog is a
// safe single source for id -> current price lookups, keeping the live catalog price
// authoritative anywhere a cart item's price is shown, without touching what's in storage.
const CATALOG_PRICE_BY_ID: Record<string, number> = Object.fromEntries(
  homepageTranslations.ar.products.items.map((item) => [item.id, item.priceILS]),
);

function currentPriceILS(item: CartItem): number {
  return CATALOG_PRICE_BY_ID[item.id] ?? item.priceILS;
}

// useSyncExternalStore calls getSnapshot on every render and compares the result with
// Object.is -- returning a freshly-parsed array (a new reference) every call, even when
// localStorage has not actually changed, makes React think the store changed on every
// render and causes an infinite update loop. Caching the last raw string + parsed result
// keeps the same array reference across calls until the underlying value truly changes.
let cachedRaw: string | null = null;
let cachedCart: CartItem[] = EMPTY_CART;

function readStoredCart(): CartItem[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_CART;
  }
  if (raw === cachedRaw) return cachedCart;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedCart = Array.isArray(parsed) ? parsed : EMPTY_CART;
  } catch {
    cachedCart = EMPTY_CART;
  }
  return cachedCart;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Empty cart is the SSR snapshot -- the real persisted cart (if any) is only read via
// getSnapshot on the client, matching the same useSyncExternalStore pattern used by
// lib/language.tsx (see its comment for why this avoids the setState-in-effect anti-pattern).
// Returns the same cached EMPTY_CART reference every call (see readStoredCart's comment above
// for why a fresh [] literal on every call would break useSyncExternalStore).
function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function writeCart(items: CartItem[]) {
  const serialized = JSON.stringify(items);
  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // localStorage unavailable -- cart still works for this session
  }
  // Update the cache directly (not just relying on the next readStoredCart call) so the
  // very next render sees this exact array reference, matching what was just written.
  cachedRaw = serialized;
  cachedCart = items;
  listeners.forEach((listener) => listener());
}

type CartContextValue = {
  items: CartItem[];
  /** Returns false (no-op) if the item id is already in the cart -- duplicate-prevention by stable product id. */
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalILS: number;
  isInCart: (id: string) => boolean;
  /** Current catalog price for a cart item, ignoring any stale price captured at add-to-cart time. */
  getPriceILS: (item: CartItem) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Lightweight cart: plain React context + localStorage, no Redux/Zustand -- these are
 * one-time digital products (no meaningful "quantity"), so the only operations needed are
 * add/remove/clear with duplicate-prevention by product id. Payment/checkout is not wired up
 * yet (see CartWidget's "Continue" action); this only manages what's in the cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readStoredCart, getServerSnapshot);

  const addItem = (item: CartItem) => {
    if (items.some((existing) => existing.id === item.id)) return false;
    writeCart([...items, item]);
    return true;
  };

  const removeItem = (id: string) => {
    writeCart(items.filter((item) => item.id !== id));
  };

  const clearCart = () => writeCart([]);

  const isInCart = (id: string) => items.some((item) => item.id === id);

  const totalILS = items.reduce((sum, item) => sum + currentPriceILS(item), 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, totalILS, isInCart, getPriceILS: currentPriceILS }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

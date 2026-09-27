"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Saves favorited items in the browser's localStorage, scoped per guide
 * (e.g. "travel-smarter:favorites:barcelona"). No account/login/database yet —
 * this is purely local to the visitor's browser.
 *
 * Items are stored as composite keys ("type:id", e.g. "attraction:sagrada-familia")
 * so attractions, restaurants, beaches, photo spots, and shopping spots can all be
 * saved and shown together in "My Barcelona".
 *
 * Uses useSyncExternalStore (React's built-in tool for external data sources like
 * localStorage) instead of useState+useEffect, so the server-rendered page and the
 * first client render always agree — no hydration mismatch.
 */

export type FavoriteType = "attraction" | "food" | "beach" | "photo-spot" | "shopping" | "nightlife" | "experience" | "hotel" | "casino";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getServerSnapshot() {
  return "[]";
}

function makeKey(type: FavoriteType, id: string) {
  return `${type}:${id}`;
}

export function useFavorites(guideSlug: string) {
  const storageKey = `travel-smarter:favorites:${guideSlug}`;

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? "[]";
    } catch {
      return "[]";
    }
  }, [storageKey]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let favorites: string[];
  try {
    favorites = JSON.parse(raw) as string[];
  } catch {
    favorites = [];
  }

  const toggleFavorite = useCallback(
    (type: FavoriteType, id: string) => {
      const key = makeKey(type, id);
      const next = favorites.includes(key) ? favorites.filter((item) => item !== key) : [...favorites, key];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // localStorage unavailable (private mode, etc.) — favorites just won't persist.
      }
      emitChange();
    },
    [storageKey, favorites]
  );

  const isFavorite = useCallback((type: FavoriteType, id: string) => favorites.includes(makeKey(type, id)), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

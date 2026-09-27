"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Persists checked checklist items in localStorage, scoped per guide. Same pattern as useFavorites. */

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

export function useChecklist(guideSlug: string) {
  const storageKey = `travel-smarter:checklist:${guideSlug}`;

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? "[]";
    } catch {
      return "[]";
    }
  }, [storageKey]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let checked: string[];
  try {
    checked = JSON.parse(raw) as string[];
  } catch {
    checked = [];
  }

  const toggle = useCallback(
    (id: string) => {
      const next = checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // localStorage unavailable — selection just won't persist.
      }
      emitChange();
    },
    [storageKey, checked]
  );

  const isChecked = useCallback((id: string) => checked.includes(id), [checked]);

  return { checked, toggle, isChecked };
}

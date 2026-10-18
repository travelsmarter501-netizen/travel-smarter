"use client";

import { useEffect } from "react";

/**
 * Runs `reset` when the browser re-shows this page from its back/forward cache.
 *
 * Safari (and the in-app browsers built on it) can restore a page exactly as it was left -- including React state -- when the visitor
 * comes back with the Back button / swipe. A button that was put into a "processing..." state right before the page navigated away
 * (e.g. to the payment provider) would then come back permanently disabled. `pageshow` with `persisted` is the browser's signal that
 * this happened, so the page can put such UI state back to normal. It only resets what the caller passes in; nothing server-side.
 */
export function useResetOnPageShow(reset: () => void) {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reset();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reset]);
}

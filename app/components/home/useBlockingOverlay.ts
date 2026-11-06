"use client";

import { useSyncExternalStore } from "react";

/**
 * True while something that should cover the page is open: a modal dialog (the cart drawer and every bottom sheet render
 * role="dialog" aria-modal="true") or the mobile navigation menu (#mobile-menu exists only while it is open). The floating purchase
 * button uses this to get out of the way. It reads the DOM instead of adding shared state to those components, so they stay untouched.
 */
const SELECTOR = '[role="dialog"][aria-modal="true"], #mobile-menu';

function snapshot(): boolean {
  return document.querySelector(SELECTOR) !== null;
}

function subscribe(callback: () => void) {
  let frame = 0;
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(callback);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}

export function useBlockingOverlay(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

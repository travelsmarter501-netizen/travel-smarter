"use client";

import { useEffect } from "react";

/**
 * Tells the rest of the client whether the navigation that just happened was the browser's Back/Forward (a "traversal")
 * or the visitor following a link / pressing a button.
 *
 * Why: on some mobile browsers (iPhone Safari, in-app browsers) a page reached by tapping a link can open at the previous page's
 * scroll offset -- e.g. near the footer of a short page -- instead of at the top. A page that wants to open at the top
 * (see <ScrollToTop />) needs to do that for a normal forward navigation ONLY: on Back/Forward the browser must keep restoring
 * the position the visitor had, so those are detected here and left alone.
 *
 * Heuristic: "popstate" fires for Back/Forward (and never for link clicks or router.push), and a click clears it again.
 * It is mounted once in the root layout, so the listeners exist before any navigation happens.
 */
let lastNavigationWasTraversal = false;

export function navigationWasTraversal(): boolean {
  return lastNavigationWasTraversal;
}

export default function NavigationIntentTracker() {
  useEffect(() => {
    const onPopState = () => {
      lastNavigationWasTraversal = true;
    };
    const onForwardIntent = () => {
      lastNavigationWasTraversal = false;
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("click", onForwardIntent, true);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("click", onForwardIntent, true);
    };
  }, []);
  return null;
}

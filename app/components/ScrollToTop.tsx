"use client";

import { useLayoutEffect } from "react";
import { navigationWasTraversal } from "./NavigationIntentTracker";

/**
 * Renders nothing. When a page that contains it appears after a normal forward navigation (a tap on a link or button, a redirect after
 * sign-in), it puts the page at scroll position 0 before the browser paints -- so the heading is the first thing seen and there is
 * no visible jump.
 *
 * It does nothing on Back/Forward (the browser restores the visitor's position there), nothing when the URL carries a #hash
 * (that is a deliberate anchor), and nothing when the page is already at the top. `behavior: "instant"` bypasses the site's
 * CSS `scroll-behavior: smooth`, which on some mobile browsers turns a reset into a slow animation that a late layout change can cut short.
 */
export default function ScrollToTop() {
  useLayoutEffect(() => {
    if (window.location.hash) return;
    if (navigationWasTraversal()) return;
    if (window.scrollY === 0 && window.scrollX === 0) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return null;
}

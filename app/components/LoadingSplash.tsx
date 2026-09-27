"use client";

import { useLanguage } from "../lib/language";
import Logo from "./Logo";

/**
 * Purely decorative branded moment on first load -- NOT a gate on real content. This lives in
 * the root layout, so it mounts once per hard navigation (App Router keeps layout.tsx mounted
 * across client-side <Link> navigations, so it does not replay on every route change). The
 * page underneath is already fully rendered at the same time; this overlay just fades itself
 * out via CSS (see the `splashFadeOut` animation in globals.css) -- there is no
 * setTimeout/JS-driven delay, and `pointer-events-none` means it never blocks interaction,
 * even during its brief fade. `prefers-reduced-motion` disables the animation and the overlay
 * simply never becomes visible.
 */
export default function LoadingSplash() {
  const { t } = useLanguage();

  return (
    <div
      aria-hidden="true"
      role="presentation"
      aria-label={t.loadingSplash.ariaLabel}
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-white [animation:splashFadeOut_700ms_ease-out_forwards] motion-reduce:hidden"
    >
      <div className="[animation:splashLogoIn_400ms_ease-out_forwards]">
        <Logo size="lg" />
      </div>
    </div>
  );
}

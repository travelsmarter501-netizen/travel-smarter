"use client";

import { useEffect } from "react";
import Link from "next/link";
import Price from "../Price";
import { useHomeAudience } from "./HomeAudience";
import { PLAN_PRICE_ILS, START_PLAN_HREF } from "./homeOffer";
import { useBlockingOverlay } from "./useBlockingOverlay";
import { useLanguage } from "../../lib/language";

/**
 * The homepage's floating purchase button: one solid blue pill fixed near the bottom edge (no animation).
 *
 *   - Everyone: it is ONE link to /planner?new=1 -- never the cart, never checkout, never a page section. The planner page keeps its own
 *     safeguards (a paid purchase waiting to be attached goes to /claim-purchase first; an owner's questionnaire ends in "create", not in payment).
 *   - Not an owner: "Buy now | <price>", the price from the same source and currency formatting as the price section.
 *   - Owner: "Create a new plan", no price.
 *   - It is not rendered at all until we know who is looking (so an owner never sees purchase wording, not even for a moment), nor while a
 *     modal / cart drawer / bottom sheet / mobile menu is open.
 *
 * While mounted it marks <body data-home-cta>, which gives the footer extra bottom padding (globals.css) so the last footer line stays visible.
 * Mobile: nearly full width with side margins and the iPhone safe area; desktop: a restrained centered width.
 */
export default function HomeBottomCta() {
  const { t } = useLanguage();
  const { audience, resolved } = useHomeAudience();
  const overlayOpen = useBlockingOverlay();

  useEffect(() => {
    document.body.setAttribute("data-home-cta", "");
    return () => document.body.removeAttribute("data-home-cta");
  }, []);

  if (!resolved || audience === "pending" || overlayOpen) return null;
  const owner = audience === "owner";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <Link
        href={START_PLAN_HREF}
        data-home-bottom-cta=""
        className="pointer-events-auto relative isolate flex w-full max-w-md items-center justify-center gap-4 overflow-hidden rounded-full bg-brand px-6 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(23,36,59,0.22)] transition-[background-color,transform] hover:bg-brand-strong active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:max-w-sm"
      >
        {/* Visitors only: a soft diagonal light sweeps across the blue once every 7 s (CSS, globals.css; none with reduced motion). It sits
            under the text, inside the rounded edge, and never takes clicks. The bar is not rendered while a menu or sheet is open. */}
        {!owner && <span aria-hidden="true" className="home-cta-shine pointer-events-none absolute inset-0 -z-10" />}
        <span>{owner ? t.home.bottomCta.owner : t.home.bottomCta.buy}</span>
        {!owner && (
          <>
            <span aria-hidden="true" className="h-5 w-px bg-white/40" />
            <Price ils={PLAN_PRICE_ILS} className="font-bold" />
          </>
        )}
      </Link>
    </div>
  );
}

"use client";

import { useEffect } from "react";

// Reveal timing (ui-ux-pro-max "Scroll Reveal / Standard"): 20px rise, 0.5s, 0.1s between items that enter together.
const RISE = 20;
const DURATION = 0.5;
const STAGGER = 0.1;

/**
 * The homepage's scroll-linked motion (renders nothing). GSAP and ScrollTrigger are loaded with a dynamic import after the page is interactive;
 * everything they touch is already visible in the HTML, and is hidden only once this has loaded and set itself up, so content never disappears
 * when JavaScript or the import fails.
 *
 *  - Every `data-reveal` element below the first screen (section titles, their lines, each chat bubble, each product scene, each price point,
 *    each question) fades in and rises 20px when the visitor reaches it; elements that arrive together follow each other 0.1s apart
 *    (ScrollTrigger.batch). It happens once: scrolling back up leaves everything visible. Titles and paragraphs move as whole blocks (no text is
 *    split; Arabic letters stay joined) and the page scrolls normally (no pinning, no scroll hijacking).
 *  - Anything already on the first screen is left alone (the introduction has its own short CSS entrance).
 *  - If keyboard focus lands inside an element that has not been revealed yet, it is shown at once.
 *  - The stops of the free example arrive one after the other each time the example is opened.
 *
 * Everything runs inside gsap.matchMedia("(prefers-reduced-motion: no-preference)"): with reduced motion nothing is hidden or moved. The fixed
 * purchase bar is not part of any of this.
 */
export default function HomeMotion() {
  useEffect(() => {
    let cancelled = false;
    let revert: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const pending = gsap.utils.toArray<HTMLElement>("main [data-reveal]").filter((element) => element.getBoundingClientRect().top > window.innerHeight * 0.92);
        const shown = new WeakSet<Element>();
        const show = (elements: Element[], animate: boolean) => {
          const fresh = elements.filter((element) => !shown.has(element));
          fresh.forEach((element) => shown.add(element));
          if (fresh.length === 0) return;
          // Whatever is already above the screen (a fast jump went past it) appears at once; the rest animates, and the stagger shrinks when many
          // elements arrive together, so the whole group is always in place within about a second.
          const passed = animate ? fresh.filter((element) => element.getBoundingClientRect().bottom < 0) : fresh;
          const moving = fresh.filter((element) => !passed.includes(element));
          if (passed.length) gsap.set(passed, { opacity: 1, y: 0, clearProps: "opacity,transform" });
          if (moving.length) {
            const each = Math.min(STAGGER, 0.4 / moving.length);
            gsap.to(moving, { opacity: 1, y: 0, duration: DURATION, ease: "power2.out", stagger: each, overwrite: true, clearProps: "opacity,transform" });
          }
        };

        if (pending.length > 0) {
          gsap.set(pending, { opacity: 0, y: RISE });
          // onEnter animates what the visitor reaches; onLeave catches whatever a fast jump skipped over (it is shown at once, off screen), so a
          // quick scroll never leaves hidden content behind. show() ignores elements already shown, so each element is revealed only once.
          ScrollTrigger.batch(pending, { start: "top 88%", onEnter: (batch) => show(batch, true), onLeave: (batch) => show(batch, false) });
        }

        const onFocus = (event: FocusEvent) => {
          const element = (event.target as Element | null)?.closest?.("[data-reveal]");
          if (element && pending.includes(element as HTMLElement)) show([element], false);
        };
        document.addEventListener("focusin", onFocus);

        const details = document.querySelector<HTMLDetailsElement>("#example details");
        const onToggle = () => {
          if (!details?.open) return;
          gsap.from(details.querySelectorAll("[data-example-stop]"), { opacity: 0, y: 12, duration: 0.4, ease: "power2.out", stagger: 0.1, clearProps: "opacity,transform" });
        };
        details?.addEventListener("toggle", onToggle);

        return () => {
          document.removeEventListener("focusin", onFocus);
          details?.removeEventListener("toggle", onToggle);
        };
      });
      revert = () => mm.revert();
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return null;
}

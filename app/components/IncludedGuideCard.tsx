"use client";

import Button from "./Button";
import { useLanguage } from "../lib/language";

/**
 * "Included with your plan" card: the 3-day and 5-day Ready Plans are sold as "+ Barcelona Guide", so inside
 * those two pages (and only those two -- the 1-day plan is a standalone product) the buyer gets a clear way
 * to open the included guide.
 *
 * It is only a heading and a link. No guide content is rendered or passed here, and it is rendered only after
 * the page's own entitlement gate has passed. The link target, /guides/barcelona, is separately protected by
 * its own entitlement check (which accepts these bundle products).
 */
export default function IncludedGuideCard() {
  const { t } = useLanguage();
  const card = t.productPage.includedGuide;

  return (
    <section aria-label={card.title} className="rounded-3xl border border-teal-200 bg-teal-50/70 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p dir="auto" className="text-sm font-bold text-teal-800">
            {card.badge}
          </p>
          <h2 dir="auto" className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
            {card.title}
          </h2>
        </div>
        <Button href="/guides/barcelona" className="w-full sm:w-auto sm:shrink-0">
          {card.cta}
        </Button>
      </div>
    </section>
  );
}

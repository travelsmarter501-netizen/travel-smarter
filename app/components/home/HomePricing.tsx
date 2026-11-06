"use client";

import Link from "next/link";
import Container from "../Container";
import TextWithPrice from "./TextWithPrice";
import { useHomeAudience } from "./HomeAudience";
import { MY_PLANS_HREF, PLAN_PRICE_ILS } from "./homeOffer";
import { IconCheck } from "../icons";
import { useLanguage } from "../../lib/language";

/**
 * The price, set directly on the deep-navy band (no card): on the start side the one-time price from the shared price source, large, with
 * "الأسئلة مجانًا، والدفع بعد ما تخلّص." under it; on the other side what it includes (multiple plans and editing up to 30 saved plans, all
 * supported cities with Barcelona the only one today, the included Barcelona guide). Stacked on phones. The purchase button is the floating one
 * (HomeBottomCta). Nothing here changes payment or access.
 *
 * Anchors: `id="price"` is the navigation target. `#products` and `#destinations` are kept as legacy anchors (old links and the guide / package
 * pages point at them). Owner: no price, "unlocked" and a link to their plans. While a signed-in visitor's purchases are being read, the
 * purchase content keeps its space but stays hidden.
 */
export default function HomePricing() {
  const { t } = useLanguage();
  const { audience } = useHomeAudience();
  const copy = t.home.pricing;
  const owner = audience === "owner";
  const pending = audience === "pending";

  return (
    <section id="price" className="scroll-mt-20 bg-brand-deep py-10 text-white sm:py-12">
      <span id="products" className="block scroll-mt-20" aria-hidden="true" />
      <span id="destinations" className="block scroll-mt-20" aria-hidden="true" />
      <Container>
        <div className="mx-auto grid max-w-4xl gap-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12">
          {owner ? (
            <>
              <div data-reveal>
                <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{copy.ownerTitle}</h2>
                <p className="mt-3 text-base leading-7 text-on-deep">{copy.ownerBody}</p>
                <Link
                  href={MY_PLANS_HREF}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-brand-deep transition-colors hover:bg-sky-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {copy.myPlans}
                </Link>
              </div>
              <div>
                <PointList points={copy.points} />
                <NotIncluded text={copy.notIncluded} />
              </div>
            </>
          ) : (
            <div className="contents">
              <div data-reveal className={pending ? "invisible" : undefined} aria-hidden={pending || undefined}>
                <h2 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-bold sm:text-3xl">
                  <TextWithPrice text={copy.title} ils={PLAN_PRICE_ILS} priceClassName="text-6xl font-bold tracking-tight text-white sm:text-7xl" />
                </h2>
              </div>
              <div className={pending ? "invisible" : undefined} aria-hidden={pending || undefined}>
                <PointList points={copy.points} />
                <NotIncluded text={copy.notIncluded} />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function NotIncluded({ text }: { text: string }) {
  return (
    <p data-reveal className="mt-4 text-[0.95rem] leading-7 text-on-deep sm:text-base">
      {text}
    </p>
  );
}

function PointList({ points }: { points: string[] }) {
  return (
    <ul className="divide-y divide-white/10 border-y border-white/10">
      {points.map((point) => (
        <li key={point} data-reveal className="flex items-start gap-3 py-3.5 text-[0.95rem] leading-7 text-on-deep sm:text-base">
          <IconCheck className="mt-1.5 h-4 w-4 shrink-0 text-apricot" aria-hidden="true" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

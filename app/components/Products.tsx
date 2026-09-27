"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import SectionHeading from "./SectionHeading";
import Price from "./Price";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { homepageTranslations } from "../lib/homepageTranslations";
import { destinations } from "../lib/content";

const barcelonaImage = destinations.find((destination) => destination.slug === "barcelona")?.image ?? "";

/**
 * The homepage's primary sales section -- 5 real, working Barcelona products: 1-day, Guide,
 * 3-day, 5-day, and Smart Planner Ready Plans (routes: /ready-plans/barcelona/1-day,
 * /guides/barcelona, /ready-plans/barcelona/3-days, /ready-plans/barcelona,
 * /smart-planner/barcelona). The 3-day product was rebuilt as its own standalone product in
 * the "Restore the 3-Day Plan" task -- see that task's final report for what was genuinely
 * recovered vs. newly designed.
 */
export default function Products() {
  const { t } = useLanguage();
  const { addItem, isInCart } = useCart();

  return (
    <section id="products" className="scroll-mt-20 py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow={t.products.eyebrow} title={t.products.title} />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.products.items.map((product) => {
            const inCart = isInCart(product.id);
            return (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  <Image
                    src={barcelonaImage}
                    alt={product.title}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  {product.badge && (
                    <span
                      dir="auto"
                      className="absolute top-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-teal-700 shadow-sm start-2"
                    >
                      {product.badge}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p dir="auto" className="text-sm font-bold text-slate-900">
                    {product.title}
                  </p>
                  <p dir="auto" className="mt-1.5 flex-1 text-xs leading-5 text-slate-600">
                    {product.description}
                  </p>
                  {product.includesGuideLabel && (
                    <p dir="auto" className="mt-1.5 text-xs font-semibold text-teal-700">
                      {product.includesGuideLabel}
                    </p>
                  )}
                  <p className="mt-3 flex items-baseline gap-1.5">
                    {product.startingFrom && (
                      <span dir="auto" className="text-xs font-semibold text-slate-500">
                        {t.products.startingFromLabel}
                      </span>
                    )}
                    <Price ils={product.priceILS} className="text-lg font-bold text-slate-900" />
                  </p>

                  <Link
                    href={product.route}
                    className="mt-3 flex items-center justify-center rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                  >
                    {product.ctaLabel}
                  </Link>
                  {product.comparisonHint && (
                    <p dir="auto" className="mt-1.5 text-center text-[11px] leading-4 text-slate-400">
                      {product.comparisonHint}
                    </p>
                  )}
                  {product.addToCartLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        const arTitle = homepageTranslations.ar.products.items.find((item) => item.id === product.id)?.title ?? product.title;
                        const enTitle = homepageTranslations.en.products.items.find((item) => item.id === product.id)?.title ?? product.title;
                        addItem({
                          id: product.id,
                          titleAr: arTitle,
                          titleEn: enTitle,
                          priceILS: product.priceILS,
                          route: product.route,
                        });
                      }}
                      disabled={inCart}
                      className="mt-2 flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-default disabled:border-teal-200 disabled:bg-teal-50 disabled:text-teal-700"
                    >
                      {inCart ? t.cart.alreadyInCart : product.addToCartLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

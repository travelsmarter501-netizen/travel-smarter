"use client";

import Button from "../Button";
import PlanCard, { type PlanCardData } from "../planner/PlanCard";
import { useLanguage } from "../../lib/language";
import { fillCopy } from "../../lib/plannerCopy";
import { formatPurchaseDate, productDisplayName, type AccountPurchase } from "../../lib/accountView";
import { personalizedTripDetails } from "../../lib/planner/personalizedSummary";
import { PRODUCT_SLUGS } from "../../lib/commerce/catalog";

const copy = {
  ar: {
    purchasesTitle: "مشترياتي",
    purchasesEmpty: "لسا ما عندك منتجات مشتراة.",
    purchasedOn: "تم الشراء بتاريخ {date}",
    open: "افتح",
    openPlan: "افتح الخطة",
    build: "ابنِ خطتي ✨",
    personalizedName: "خطة مخصصة إلى {destination}",
    includedWith: "متضمن مع {name} — بدون شراء منفصل",
    guideName: "دليل برشلونة",
    openGuide: "افتح الدليل",
    plansTitle: "خططي",
    plansEmpty: "لسا ما عندك أي خطة.",
    daysCount: "{n} أيام",
    dayOne: "يوم",
  },
  en: {
    purchasesTitle: "My purchases",
    purchasesEmpty: "You haven't bought anything yet.",
    purchasedOn: "Purchased on {date}",
    open: "Open",
    openPlan: "Open plan",
    build: "Build my plan ✨",
    personalizedName: "Personalized plan to {destination}",
    includedWith: "Included with {name} — no separate purchase",
    guideName: "Barcelona Travel Guide",
    openGuide: "Open guide",
    plansTitle: "My plans",
    plansEmpty: "You don't have any plan yet.",
    daysCount: "{n} days",
    dayOne: "day",
  },
} as const;

const DESTINATION_NAMES = {
  ar: { barcelona: "برشلونة" },
  en: { barcelona: "Barcelona" },
} as const;

function destinationName(language: "ar" | "en", id: string): string {
  return (DESTINATION_NAMES[language] as Record<string, string>)[id] ?? id;
}

function daysText(c: (typeof copy)["ar"] | (typeof copy)["en"], days: number | null): string | null {
  if (days === null) return null;
  return days === 1 ? `1 ${c.dayOne}` : fillCopy(c.daysCount, { n: days });
}

export function AccountPurchases({ purchases, inheritedGuideFrom }: { purchases: AccountPurchase[]; inheritedGuideFrom: { slug: string; name: string } | null }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "ar";
  const c = copy[lang];

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-lg font-bold text-slate-900">{c.purchasesTitle}</h2>

      {purchases.length === 0 && !inheritedGuideFrom ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">{c.purchasesEmpty}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {purchases.map((purchase) => {
            if (purchase.kind === "personalized") {
              // A Personalized Plan row is about the TRIP it was bought for (destination, days, interests, accommodation) -- the useful
              // information -- not about when it was bought, so no purchase date is shown here.
              const trip = personalizedTripDetails(purchase.details, lang);
              const title = fillCopy(c.personalizedName, { destination: destinationName(lang, purchase.destinationId) });
              return (
                <li key={purchase.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                  <div className="min-w-0">
                    <p dir="auto" className="font-semibold text-slate-900">
                      {title}
                    </p>
                    {daysText(c, purchase.days) && (
                      <p dir="auto" className="text-xs text-slate-600">
                        {daysText(c, purchase.days)}
                      </p>
                    )}
                    {trip.interests && (
                      <p dir="auto" className="text-xs text-slate-600">
                        {trip.interests}
                      </p>
                    )}
                    {trip.accommodation && (
                      <p dir="auto" className="text-xs text-slate-600">
                        {trip.accommodation}
                      </p>
                    )}
                  </div>
                  {purchase.href && (
                    <Button href={purchase.href} size="md">
                      {purchase.built ? c.openPlan : c.build}
                    </Button>
                  )}
                </li>
              );
            }
            const name = productDisplayName(purchase.slug, lang, purchase.fallbackName);
            const openLabel = purchase.slug === PRODUCT_SLUGS.guide ? c.openGuide : c.open;
            return (
              <li key={purchase.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="min-w-0">
                  <p dir="auto" className="font-semibold text-slate-900">
                    {name}
                  </p>
                  <p className="text-xs text-slate-500">{fillCopy(c.purchasedOn, { date: formatPurchaseDate(purchase.purchasedAt) })}</p>
                </div>
                {purchase.href && (
                  <Button href={purchase.href} size="md">
                    {openLabel}
                  </Button>
                )}
              </li>
            );
          })}
          {inheritedGuideFrom && (
            <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{c.guideName}</p>
                <p dir="auto" className="text-xs text-teal-700">
                  {fillCopy(c.includedWith, { name: productDisplayName(inheritedGuideFrom.slug, lang, inheritedGuideFrom.name) })}
                </p>
              </div>
              <Button href="/guides/barcelona" size="md">
                {c.openGuide}
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** "My plans" on the account page: the same cards as /planner (destination, days, trip details, Open plan, Remove). */
export function AccountPlans({ plans }: { plans: PlanCardData[] }) {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-lg font-bold text-slate-900">{c.plansTitle}</h2>

      {plans.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">{c.plansEmpty}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import Button from "../Button";
import DeleteSavedPlanButton from "./DeleteSavedPlanButton";
import { useLanguage } from "../../lib/language";
import { fillCopy } from "../../lib/plannerCopy";
import { formatPurchaseDate, productDisplayName, type AccountPurchase } from "../../lib/accountView";
import { PRODUCT_SLUGS } from "../../lib/commerce/catalog";

const copy = {
  ar: {
    purchasesTitle: "مشترياتي",
    purchasesEmpty: "لسا ما عندك منتجات مشتراة.",
    purchasedOn: "تم الشراء بتاريخ {date}",
    open: "افتح",
    build: "ابنِ خطتي ✨",
    personalizedName: "خطة مخصصة · {destination}",
    includedWith: "متضمن مع {name} — بدون شراء منفصل",
    guideName: "دليل برشلونة",
    openGuide: "افتح الدليل",
    plansTitle: "خططي",
    plansEmpty: "لسا ما حفظت أي خطة.",
    openPlan: "افتح الخطة",
    linkedToPurchase: "مرتبطة بعملية شراء",
    daysCount: "{n} أيام",
    dayOne: "يوم",
    surprise: "فاجئني ✨",
  },
  en: {
    purchasesTitle: "My purchases",
    purchasesEmpty: "You haven't bought anything yet.",
    purchasedOn: "Purchased on {date}",
    open: "Open",
    build: "Build my plan ✨",
    personalizedName: "Personalized plan · {destination}",
    includedWith: "Included with {name} — no separate purchase",
    guideName: "Barcelona Travel Guide",
    openGuide: "Open guide",
    plansTitle: "My plans",
    plansEmpty: "You haven't saved any plan yet.",
    openPlan: "Open plan",
    linkedToPurchase: "Linked to a purchase",
    daysCount: "{n} days",
    dayOne: "day",
    surprise: "Surprise me ✨",
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
            const name =
              purchase.kind === "product"
                ? productDisplayName(purchase.slug, lang, purchase.fallbackName)
                : [fillCopy(c.personalizedName, { destination: destinationName(lang, purchase.destinationId) }), daysText(c, purchase.days)].filter(Boolean).join(" · ");
            const href = purchase.href;
            const openLabel = purchase.kind === "personalized" && !purchase.built ? c.build : purchase.kind === "product" && purchase.slug === PRODUCT_SLUGS.guide ? c.openGuide : c.open;
            return (
              <li key={purchase.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="min-w-0">
                  <p dir="auto" className="font-semibold text-slate-900">
                    {name}
                  </p>
                  <p className="text-xs text-slate-500">{fillCopy(c.purchasedOn, { date: formatPurchaseDate(purchase.purchasedAt) })}</p>
                </div>
                {href && (
                  <Button href={href} size="md">
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

/** One saved plan, already reduced by the server to plain values (see account/page.tsx). */
export type AccountPlanView = {
  id: string;
  destinationId: string;
  days: number | null;
  /** The interests line (or "surprise me"); null when there is none. */
  interests: string | null;
  surprise: boolean;
  createdAt: string;
  href: string;
  /** Built from a paid purchase: it is that purchase's product, so it cannot be deleted. */
  linkedToPurchase: boolean;
  deletable: boolean;
};

export function AccountPlans({ plans }: { plans: AccountPlanView[] }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "ar";
  const c = copy[lang];

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-lg font-bold text-slate-900">{c.plansTitle}</h2>

      {plans.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">{c.plansEmpty}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {plans.map((plan) => {
            const days = daysText(c, plan.days);
            return (
              <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="min-w-0">
                  <p dir="auto" className="font-semibold text-slate-900">
                    {[destinationName(lang, plan.destinationId), days].filter(Boolean).join(" · ")}
                  </p>
                  {(plan.surprise || plan.interests) && (
                    <p dir="auto" className="text-xs text-slate-500">
                      {plan.surprise ? c.surprise : plan.interests}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">{formatPurchaseDate(plan.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button href={plan.href} size="md">
                    {c.openPlan}
                  </Button>
                  {plan.linkedToPurchase ? <span className="text-xs font-semibold text-slate-400">{c.linkedToPurchase}</span> : plan.deletable ? <DeleteSavedPlanButton id={plan.id} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

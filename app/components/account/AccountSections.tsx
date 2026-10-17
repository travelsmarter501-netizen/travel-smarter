"use client";

import Button from "../Button";
import PlansLists from "../planner/PlansLists";
import type { PlanCardData } from "../planner/PlanCard";
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
    openPlanner: "افتح المخطط",
    includedWith: "متضمن مع {name} — بدون شراء منفصل",
    guideName: "دليل برشلونة",
    openGuide: "افتح الدليل",
    plansTitle: "خططي",
    plansEmpty: "لسا ما عندك أي خطة.",
  },
  en: {
    purchasesTitle: "My purchases",
    purchasesEmpty: "You haven't bought anything yet.",
    purchasedOn: "Purchased on {date}",
    open: "Open",
    openPlanner: "Open planner",
    includedWith: "Included with {name} — no separate purchase",
    guideName: "Barcelona Travel Guide",
    openGuide: "Open guide",
    plansTitle: "My plans",
    plansEmpty: "You don't have any plan yet.",
  },
} as const;

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
            const name = productDisplayName(purchase.slug, lang, purchase.fallbackName);
            const openLabel = purchase.slug === PRODUCT_SLUGS.guide ? c.openGuide : purchase.slug === PRODUCT_SLUGS.personalizedPlan ? c.openPlanner : c.open;
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

/** "My plans" on the account page: the same cards as /planner (destination, days, trip details, Open plan, Edit plan, Delete). */
export function AccountPlans({ plans }: { plans: PlanCardData[] }) {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-lg font-bold text-slate-900">{c.plansTitle}</h2>

      <PlansLists plans={plans} emptyText={c.plansEmpty} />
    </div>
  );
}

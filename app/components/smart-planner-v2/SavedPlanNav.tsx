"use client";

import Link from "next/link";
import BackLink from "../detail/BackLink";
import { useLanguage } from "../../lib/language";

/**
 * Saved-plan page wording in the visitor's language (the page itself is a server component). Arabic text is unchanged.
 */
const COPY = {
  ar: { myPlans: "خططي", newPlan: "＋ خطة جديدة", account: "حسابي", notFound: "ما لقينا هاي الخطة. ممكن تكون انحذفت." },
  en: { myPlans: "My plans", newPlan: "＋ New plan", account: "My account", notFound: "We couldn't find this plan. It may have been deleted." },
  he: { myPlans: "התוכניות שלי", newPlan: "＋ תוכנית חדשה", account: "החשבון שלי", notFound: "לא מצאנו את התוכנית הזו. ייתכן שהיא נמחקה." },
};

/** Back to "My plans" + start a new plan. */
export function SavedPlanNav() {
  const { language } = useLanguage();
  const copy = COPY[language];
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <BackLink href="/planner" label={copy.myPlans} />
      <Link href="/planner?new=1" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
        {copy.newPlan}
      </Link>
    </div>
  );
}

/** Shown when the plan id does not resolve to one of the visitor's own valid saved plans. */
export function SavedPlanNotFound() {
  const { language } = useLanguage();
  const copy = COPY[language];
  return (
    <>
      <BackLink href="/account" label={copy.account} />
      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-600">{copy.notFound}</p>
      </div>
    </>
  );
}

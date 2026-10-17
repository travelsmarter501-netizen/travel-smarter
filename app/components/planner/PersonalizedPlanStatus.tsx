"use client";

import Link from "next/link";
import Container from "../Container";
import { useLanguage } from "../../lib/language";
import { PLANNER_MY_PLANS, PLANNER_NEW_PLAN } from "../../lib/planner/planLinks";

const copy = {
  ar: {
    readyTitle: "خطتك المخصصة جاهزة ✅",
    readyBody: "خطتك محفوظة في حسابك، ولا حاجة لدفع جديد لفتحها.",
    open: "افتح خطتي",
    another: "إنشاء خطة جديدة",
    anotherNote: "الخطة الجديدة لرحلة أخرى تتطلب عملية شراء جديدة.",
    buildTitle: "تم تأكيد الدفع ✅",
    buildBody: "خطتك جاهزة للبناء — لا حاجة لدفع جديد.",
    build: "ابنِ خطتي ✨",
  },
  en: {
    readyTitle: "Your personalized plan is ready ✅",
    readyBody: "Your plan is saved in your account — there's nothing more to pay to open it.",
    open: "Open my plan",
    another: "Create another plan",
    anotherNote: "A new plan for another trip needs a new purchase.",
    buildTitle: "Payment confirmed ✅",
    buildBody: "Your plan is ready to build — there's nothing more to pay.",
    build: "Build my plan ✨",
  },
} as const;

/**
 * What /checkout?plan=personalized shows a customer who has ALREADY paid: no price, no summary, no payment button.
 *   "generated": their plan exists -> "Open my plan" (and the one explicit way to buy another: "Create another plan");
 *   "unbuilt":   paid, not built yet -> "Build my plan".
 * The decision is made on the server (see getPersonalizedPlanState); this only displays it.
 */
export default function PersonalizedPlanStatus({ state }: { state: "generated" | "unbuilt" }) {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{state === "generated" ? c.readyTitle : c.buildTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{state === "generated" ? c.readyBody : c.buildBody}</p>
          <Link
            href={PLANNER_MY_PLANS}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            {state === "generated" ? c.open : c.build}
          </Link>
          {state === "generated" && (
            <>
              <Link
                href={PLANNER_NEW_PLAN}
                className="mt-3 flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                {c.another}
              </Link>
              <p className="mt-2 text-xs text-slate-400">{c.anotherNote}</p>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}

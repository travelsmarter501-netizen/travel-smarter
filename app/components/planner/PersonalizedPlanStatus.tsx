"use client";

import Link from "next/link";
import Container from "../Container";
import { useLanguage } from "../../lib/language";
import { PLANNER_NEW_PLAN } from "../../lib/planner/planLinks";

const copy = {
  ar: {
    title: "مخطط الرحلات المخصص مفتوح لك ✅",
    body: "اشتريته مسبقًا — أنشئ خطتك وعدّلها بالطريقة التي تناسبك، بدون أي دفع جديد.",
    open: "افتح خطتي المخصصة",
  },
  en: {
    title: "Your personalized planner is unlocked ✅",
    body: "You already bought it — create and edit your plan whenever you like, with no new payment.",
    open: "Open my personalized planner",
  },
} as const;

/**
 * What /checkout?plan=personalized shows a customer who ALREADY owns the Personalized Plan: no price, no summary, no payment button --
 * just the way into their (unlocked) planner. Whether they own it is decided on the server; this only displays it.
 */
export default function PersonalizedPlanStatus() {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{c.body}</p>
          <Link
            href={PLANNER_NEW_PLAN}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            {c.open}
          </Link>
        </div>
      </Container>
    </main>
  );
}

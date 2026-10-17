"use client";

import Link from "next/link";
import { useLanguage } from "../../lib/language";

const copy = {
  ar: {
    badge: "🎁 مشمول مع خطتك",
    title: "دليل برشلونة الكامل",
    body: "الأماكن، المطاعم، التسوق والمزيد",
    cta: "افتح دليل برشلونة",
  },
  en: {
    badge: "🎁 Included with your plan",
    title: "Complete Barcelona Guide",
    body: "Places, restaurants, shopping and more",
    cta: "Open Barcelona Guide",
  },
} as const;

/**
 * Shown inside a personalized plan whose destination includes a guide, ONLY for an owner who actually has the guide (the page checks the
 * entitlement on the server before rendering this). It just links to the real guide -- the guide's content is never duplicated here.
 */
export default function IncludedGuideCard() {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];

  return (
    <section className="rounded-3xl border border-teal-200 bg-teal-50/70 p-5 sm:p-6">
      <p className="text-sm font-bold text-teal-800">{c.badge}</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">{c.title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{c.body}</p>
      <Link
        href="/guides/barcelona"
        className="mt-4 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 sm:w-auto"
      >
        {c.cta}
      </Link>
    </section>
  );
}

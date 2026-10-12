"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../lib/language";
import { syncPendingClaimAction } from "../../claim-purchase/actions";

const copy = {
  ar: {
    paid: "عندك مشتريات مدفوعة بانتظار إضافتها لحسابك.",
    pending: "دفعتك لسا قيد التأكيد. افتح الصفحة لمتابعة إضافة مشترياتك.",
    cta: "أضف مشترياتي إلى حسابي",
  },
  en: {
    paid: "You have a paid purchase waiting to be added to your account.",
    pending: "Your payment is still being confirmed. Open the page to finish adding your purchase.",
    cta: "Add my purchase to my account",
  },
} as const;

/**
 * Shown on /account when this browser still has an unclaimed guest purchase remembered by the server
 * (an HttpOnly cookie -- see claim-purchase/pendingClaimCookie.ts). The browser never sees the token:
 * it only asks the server "is something waiting?" and gets back a state. The button opens the plain
 * /claim-purchase page, where the buyer still has to click "Add my purchase to my account".
 */
export default function PendingClaimBanner() {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];
  const [waiting, setWaiting] = useState<"paid" | "pending" | null>(null);

  useEffect(() => {
    let cancelled = false;
    syncPendingClaimAction()
      .then((result) => {
        if (cancelled) return;
        setWaiting(result.state === "paid" || result.state === "pending" ? result.state : null);
      })
      .catch(() => {
        // server hiccup: show nothing this time
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!waiting) return null;

  return (
    <div role="status" className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">{waiting === "paid" ? c.paid : c.pending}</p>
      <Link
        href="/claim-purchase"
        className="mt-3 inline-flex items-center justify-center rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
      >
        {c.cta}
      </Link>
    </div>
  );
}

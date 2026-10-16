"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../lib/language";
import { syncPendingClaimAction } from "../../claim-purchase/actions";

const copy = {
  ar: {
    paid: "جاري إضافة مشترياتك إلى حسابك...",
    pending: "دفعتك لسا قيد التأكيد. سنضيف مشترياتك إلى حسابك تلقائيًا فور تأكيدها.",
    cta: "متابعة",
    differentEmail: "عندك عملية شراء مدفوعة مرتبطة ببريد إلكتروني مختلف عن بريد حسابك الحالي، لذلك لم تُضف تلقائيًا.",
    details: "التفاصيل",
  },
  en: {
    paid: "Adding your purchase to your account...",
    pending: "Your payment is still being confirmed. We'll add your purchase to your account automatically once it is.",
    cta: "Continue",
    differentEmail: "You have a paid purchase linked to a different email than this account's, so it wasn't added automatically.",
    details: "Details",
  },
} as const;

/**
 * Shown on /account when this browser still has an unclaimed guest purchase remembered by the server
 * (an HttpOnly cookie -- see claim-purchase/pendingClaimCookie.ts). The browser never sees the token:
 * it only asks the server "is something waiting?" and gets back a state. A purchase that is already paid is attached
 * by the plain /claim-purchase page (automatically, with the same email checks as always), so this banner just
 * forwards there; one still being confirmed links to the same page, which waits for it.
 */
export default function PendingClaimBanner() {
  const { language } = useLanguage();
  const c = copy[language === "en" ? "en" : "ar"];
  const router = useRouter();
  const [waiting, setWaiting] = useState<"paid" | "pending" | "different" | null>(null);

  useEffect(() => {
    let cancelled = false;
    syncPendingClaimAction()
      .then((result) => {
        if (cancelled) return;
        if (result.state === "paid" && result.accountMatches === false) {
          setWaiting("different");
        } else {
          setWaiting(result.state === "paid" || result.state === "pending" ? result.state : null);
          if (result.state === "paid") router.replace("/claim-purchase");
        }
      })
      .catch(() => {
        // server hiccup: show nothing this time
      });
    return () => {
      cancelled = true;
    };
    // router is stable; this asks the server once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!waiting) return null;

  return (
    <div role="status" className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">{waiting === "paid" ? c.paid : waiting === "different" ? c.differentEmail : c.pending}</p>
      <Link
        href="/claim-purchase"
        className="mt-3 inline-flex items-center justify-center rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
      >
        {waiting === "different" ? c.details : c.cta}
      </Link>
    </div>
  );
}

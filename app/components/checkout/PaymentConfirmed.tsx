"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../lib/language";
import { clearPlannerDraft } from "../../lib/planner/plannerDraft";
import SuccessRefresh from "../../checkout/success/SuccessRefresh";

const AUTO_OPEN_AFTER_MS = 2500;

const copy = {
  ar: {
    confirmedTitle: "تم تأكيد الدفع بنجاح ✅",
    confirmedBody: "مشترياتك جاهزة في حسابك.",
    opening: "جاري فتح مشترياتك...",
    open: "افتح الآن",
    account: "حسابي",
    home: "الرئيسية",
    pendingTitle: "جاري تأكيد الدفع",
    pendingBody: "ما منفعّل المنتج إلا بعد وصول تأكيد Allpay الموقّع. انتظر لحظات — بنحدّث الحالة تلقائيًا.",
  },
  en: {
    confirmedTitle: "Payment confirmed ✅",
    confirmedBody: "Your purchase is ready in your account.",
    opening: "Opening your purchase...",
    open: "Open now",
    account: "My account",
    home: "Home",
    pendingTitle: "Confirming payment",
    pendingBody: "Nothing is unlocked until Allpay's signed confirmation arrives. Wait a moment — this page updates by itself.",
  },
} as const;

/**
 * /checkout/success for a signed-in customer (their order is already theirs, so there is no sign-in or claim step at all).
 * Paid: shows "Payment confirmed" and opens what they bought. Not confirmed yet: says so and refreshes until the verified
 * webhook has marked the order paid -- never an unlocked product on the strength of this page alone.
 */
export default function PaymentConfirmed({ paid, orderId, nextPath, clearDraft }: { paid: boolean; orderId?: string; nextPath: string; clearDraft: boolean }) {
  const { language } = useLanguage();
  const router = useRouter();
  const c = copy[language === "en" ? "en" : "ar"];

  useEffect(() => {
    if (!paid) return;
    if (clearDraft) clearPlannerDraft(); // a confirmed Personalized Plan purchase no longer needs this tab's questionnaire draft
    const timer = window.setTimeout(() => router.replace(nextPath), AUTO_OPEN_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [paid, clearDraft, nextPath, router]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      {!paid && <p className="text-4xl">⏳</p>}
      <h1 className="mt-3 text-2xl font-bold text-slate-900">{paid ? c.confirmedTitle : c.pendingTitle}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{paid ? `${c.confirmedBody} ${c.opening}` : c.pendingBody}</p>
      {orderId && (
        <p dir="ltr" className="mt-3 text-xs text-slate-400">
          {orderId.slice(0, 8).toUpperCase()}
        </p>
      )}
      {!paid && <SuccessRefresh showNote={false} />}
      <div className="mt-6 flex flex-col gap-2.5">
        {paid && (
          <Link
            href={nextPath}
            className="flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            {c.open}
          </Link>
        )}
        <Link
          href="/account"
          className={
            paid
              ? "flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              : "flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
          }
        >
          {c.account}
        </Link>
        <Link href="/" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          {c.home}
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "../components/Container";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { claimPurchaseAction } from "./actions";
import SuccessRefresh from "../checkout/success/SuccessRefresh";

export type ClaimViewState = "pending" | "signin" | "ready" | "done" | "invalid";

const SUPPORT_EMAIL = "travelsmarter501@gmail.com";

const copy = {
  ar: {
    pendingTitle: "جاري تأكيد الدفع",
    pendingBody: "لا تغلق هذه الصفحة. بنحدّثها تلقائيًا أول ما يوصلنا تأكيد الدفع من Allpay.",
    paidTitle: "تمت عملية الدفع بنجاح",
    signinBody: "سجّل الدخول أو أنشئ حسابًا للوصول إلى مشترياتك.",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب جديد",
    readyBody: "أضف مشترياتك إلى حسابك الآن.",
    signedInAs: "أنت مسجّل بحساب",
    claim: "أضف مشترياتي إلى حسابي",
    claiming: "جاري الإضافة...",
    doneTitle: "مشترياتك في حسابك",
    doneBody: "تمت إضافة مشترياتك إلى حسابك. تقدر تفتحها من صفحة حسابي.",
    account: "حسابي",
    invalidTitle: "الرابط غير صالح",
    invalidBody: "هذا الرابط غير صالح أو انتهت صلاحيته أو تم استخدامه من قبل. إذا دفعت ولا تقدر تصل لمشترياتك، تواصل معنا وبنساعدك.",
    contact: "تواصل معنا",
    notYet: "ما وصلنا تأكيد الدفع بعد. انتظر لحظات وحاول مرة ثانية.",
    failed: "تعذّرت إضافة المشتريات. جرّب مرة ثانية، وإذا استمرت المشكلة تواصل معنا.",
    save: "احتفظ بهذه الصفحة حتى تتم إضافة مشترياتك إلى حسابك.",
  },
  en: {
    pendingTitle: "Confirming your payment",
    pendingBody: "Please keep this page open. It updates automatically as soon as Allpay confirms the payment.",
    paidTitle: "Payment successful",
    signinBody: "Your payment was successful. Sign in or create an account to access your purchase.",
    signIn: "Sign in",
    signUp: "Create an account",
    readyBody: "Add your purchase to your account now.",
    signedInAs: "Signed in as",
    claim: "Add my purchase to my account",
    claiming: "Adding...",
    doneTitle: "Your purchase is in your account",
    doneBody: "Your purchase has been added to your account. You can open it from your account page.",
    account: "My account",
    invalidTitle: "This link isn't valid",
    invalidBody: "This link is invalid, has expired, or has already been used. If you paid and can't access your purchase, contact us and we'll help.",
    contact: "Contact us",
    notYet: "We haven't received the payment confirmation yet. Wait a moment and try again.",
    failed: "We couldn't add your purchase. Please try again, and contact us if it keeps failing.",
    save: "Save this page until your purchase is added to your account.",
  },
} as const;

/** Arabic is the site's primary language; the success sentence is also shown in English as the brief requires. */
const SUCCESS_SENTENCE_EN = "Your payment was successful. Sign in or create an account to access your purchase.";

export default function ClaimPurchaseClient({
  state,
  token,
  userEmail,
}: {
  state: ClaimViewState;
  token?: string;
  userEmail?: string | null;
}) {
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const router = useRouter();
  const c = copy[language === "en" ? "en" : "ar"];
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // The order is paid (or already claimed): the cart's contents were just bought, so empty it.
  const paidState = state === "signin" || state === "ready" || state === "done";
  useEffect(() => {
    if (paidState) clearCart();
    // clearCart is a stable action on the cart store; run once per paid state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidState]);

  const claimUrl = token ? `/claim-purchase?token=${token}` : "/claim-purchase";
  const next = encodeURIComponent(claimUrl);

  async function handleClaim() {
    if (!token) return;
    setClaiming(true);
    setMessage(null);
    try {
      const result = await claimPurchaseAction(token);
      if (result.status === "claimed" || result.status === "already_yours") {
        setClaimed(true);
      } else if (result.status === "not_paid_yet") {
        setMessage(c.notYet);
      } else if (result.status === "login_required") {
        router.push(`/login?next=${next}`);
        return;
      } else {
        setMessage(c.invalidBody);
      }
    } catch {
      setMessage(c.failed);
    }
    setClaiming(false);
  }

  const showSaveNotice = (state === "pending" || state === "signin" || state === "ready") && !claimed;

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          {claimed || state === "done" ? (
            <>
              <p className="text-4xl">✅</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.doneTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.doneBody}</p>
              <Link
                href="/account"
                className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
              >
                {c.account}
              </Link>
            </>
          ) : state === "invalid" ? (
            <>
              <p className="text-4xl">⚠️</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.invalidTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.invalidBody}</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Purchase access")}`}
                className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                {c.contact}
              </a>
            </>
          ) : state === "pending" ? (
            <>
              <p className="text-4xl">⏳</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.pendingTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.pendingBody}</p>
              <SuccessRefresh />
            </>
          ) : (
            <>
              <p className="text-4xl">✅</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.paidTitle}</h1>
              {state === "signin" ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{c.signinBody}</p>
                  {language !== "en" && (
                    <p dir="ltr" className="mt-1 text-xs leading-5 text-slate-400">
                      {SUCCESS_SENTENCE_EN}
                    </p>
                  )}
                  <div className="mt-6 flex flex-col gap-2.5">
                    <Link
                      href={`/login?next=${next}`}
                      className="flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
                    >
                      {c.signIn}
                    </Link>
                    <Link
                      href={`/signup?next=${next}`}
                      className="flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                    >
                      {c.signUp}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{c.readyBody}</p>
                  {userEmail && (
                    <p className="mt-1 text-xs text-slate-500">
                      {c.signedInAs} <span dir="ltr">{userEmail}</span>
                    </p>
                  )}
                  {message && (
                    <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">
                      {message}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={claiming}
                    className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
                  >
                    {claiming ? c.claiming : c.claim}
                  </button>
                </>
              )}
            </>
          )}

          {showSaveNotice && (
            <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
              <p>{copy.ar.save}</p>
              <p dir="ltr" className="mt-1">
                {copy.en.save}
              </p>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

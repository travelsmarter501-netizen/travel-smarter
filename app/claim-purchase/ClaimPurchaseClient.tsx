"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "../components/Container";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { createClient } from "../../utils/supabase/client";
import { claimPurchaseAction, syncPendingClaimAction } from "./actions";
import { loginHref, signupHref } from "../lib/authRedirect";
import { claimReturnPath } from "./returnPath";
import { clearPlannerDraft } from "../lib/planner/plannerDraft";
import SuccessRefresh from "../checkout/success/SuccessRefresh";

export type ClaimViewState = "pending" | "signin" | "ready" | "done" | "mismatch" | "unverified" | "invalid";

const SUPPORT_EMAIL = "travelsmarter501@gmail.com";
/** After this long on "confirming payment" the page stops promising "a few moments" and reassures instead. */
const PENDING_SLOW_AFTER_MS = 60_000;

const copy = {
  ar: {
    pendingTitle: "جاري تأكيد الدفع",
    pendingBody: "سيتم تأكيد دفعتك خلال لحظات.",
    pendingSlow: "التأكيد يستغرق أطول من المعتاد. دفعتك آمنة — ابقَ في هذه الصفحة وسنكمل تلقائيًا، وإذا استمر الأمر تواصل معنا.",
    confirmedTitle: "تم تأكيد الدفع بنجاح ✅",
    signinBody: "سجّل دخولك أو أنشئ حسابًا ليتم ربط مشترياتك بحسابك تلقائيًا.",
    signIn: "تسجيل الدخول بالبريد الإلكتروني",
    signUp: "إنشاء حساب جديد",
    addingBody: "جاري ربط مشترياتك بحسابك...",
    openingBody: "جاري فتح مشترياتك...",
    openNow: "افتح الآن",
    account: "حسابي",
    retry: "حاول مرة أخرى",
    invalidTitle: "الرابط غير صالح",
    invalidBody: "هذا الرابط غير صالح أو انتهت صلاحيته أو تم استخدامه من قبل. إذا دفعت ولا تقدر تصل لمشترياتك، تواصل معنا وبنساعدك.",
    contact: "تواصل معنا",
    notYet: "ما وصلنا تأكيد الدفع بعد. انتظر لحظات وحاول مرة ثانية.",
    failed: "تعذّرت إضافة المشتريات. جرّب مرة ثانية، وإذا استمرت المشكلة تواصل معنا.",
    mismatchTitle: "هذا الحساب لا يطابق بريد الشراء",
    mismatchBody: "لأمان مشترياتك، تُضاف المشتريات فقط إلى حساب بريده الإلكتروني المؤكَّد هو نفسه البريد الذي استخدمته عند الدفع. سجّل الدخول بالحساب الصحيح، أو تواصل معنا إذا احتجت مساعدة.",
    signedInAs: "أنت مسجّل بحساب",
    switchAccount: "تسجيل الخروج واستخدام حساب آخر",
    unverifiedTitle: "أكّد بريدك الإلكتروني أولًا",
    unverifiedBody: "افتح رسالة التأكيد التي وصلتك ثم عد إلى هذه الصفحة، وسنربط مشترياتك بحسابك تلقائيًا.",
  },
  en: {
    pendingTitle: "Confirming payment",
    pendingBody: "Your payment will be confirmed in a few moments.",
    pendingSlow: "Confirmation is taking longer than usual. Your payment is safe — stay on this page and we'll continue automatically, and contact us if it keeps going.",
    confirmedTitle: "Payment confirmed ✅",
    signinBody: "Sign in or create an account and your purchase will be added to it automatically.",
    signIn: "Sign in with email",
    signUp: "Create an account",
    addingBody: "Adding your purchase to your account...",
    openingBody: "Opening your purchase...",
    openNow: "Open now",
    account: "My account",
    retry: "Try again",
    invalidTitle: "This link isn't valid",
    invalidBody: "This link is invalid, has expired, or has already been used. If you paid and can't access your purchase, contact us and we'll help.",
    contact: "Contact us",
    notYet: "We haven't received the payment confirmation yet. Wait a moment and try again.",
    failed: "We couldn't add your purchase. Please try again, and contact us if it keeps failing.",
    mismatchTitle: "This account doesn't match the purchase email",
    mismatchBody: "To keep your purchase safe, it can only be added to an account whose confirmed email is the same one you used at checkout. Sign in with the right account, or contact us if you need help.",
    signedInAs: "You're signed in as",
    switchAccount: "Sign out and use another account",
    unverifiedTitle: "Confirm your email first",
    unverifiedBody: "Open the confirmation email we sent you, then come back to this page and your purchase will be added to your account automatically.",
  },
} as const;

export default function ClaimPurchaseClient({
  state,
  token,
  userEmail,
  nextPath,
}: {
  state: ClaimViewState;
  token?: string;
  userEmail?: string | null;
  /** For a purchase that is already in the viewer's account: where it opens (set by the server, a fixed in-app path). */
  nextPath?: string;
}) {
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const router = useRouter();
  const c = copy[language === "en" ? "en" : "ar"];
  const [message, setMessage] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<"email_mismatch" | "email_unverified" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);
  const started = useRef<number | null>(null);

  // The order is paid (or already claimed): the cart's contents were just bought, so empty it.
  const paidState = state === "signin" || state === "ready" || state === "done" || state === "mismatch" || state === "unverified";
  useEffect(() => {
    if (paidState) {
      clearCart();
      clearPlannerDraft(); // a confirmed Personalized Plan purchase no longer needs this tab's questionnaire draft
    }
    // clearCart is a stable action on the cart store; run once per paid state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidState]);

  // Ask the server to keep its HttpOnly resume cookie in step with this purchase (set while it is still
  // claimable, cleared once it is not). The token is never stored where JavaScript can read it.
  const [cookieReady, setCookieReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    syncPendingClaimAction(token)
      .then((result) => {
        if (!cancelled) setCookieReady(result.remembered && (state === "pending" || state === "signin" || state === "ready" || state === "mismatch" || state === "unverified"));
      })
      .catch(() => {
        // server hiccup: sign-in links simply keep the token-in-URL fallback below
      });
    return () => {
      cancelled = true;
    };
  }, [state, token]);

  // Where sign-in / sign-up send the buyer back to. Once the server holds the token in its HttpOnly cookie
  // (or the token never was in the URL), the return path is just "/claim-purchase"; until then it also
  // carries the token so a slow or failed cookie write can never lose the purchase.
  const claimNext = claimReturnPath(token, cookieReady);

  // The payment is still being confirmed: after a minute say so honestly instead of repeating "a few moments".
  useEffect(() => {
    if (state !== "pending") return;
    const timer = window.setTimeout(() => setSlow(true), PENDING_SLOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Signed in with a paid, claimable purchase: attach it automatically -- no button. The server action re-checks the session,
  // the claim token and that the account's confirmed email is the checkout email; this only triggers it and then follows
  // the destination it returns. Guarded so a double render cannot fire it twice (the claim itself is atomic and idempotent anyway).
  useEffect(() => {
    if (state !== "ready") return;
    if (started.current === attempt) return;
    started.current = attempt;
    let cancelled = false;
    setMessage(null);
    claimPurchaseAction(token)
      .then((result) => {
        if (cancelled) return;
        if (result.status === "claimed" || result.status === "already_yours") {
          router.replace(result.next);
          router.refresh();
          return;
        }
        if (result.status === "email_mismatch" || result.status === "email_unverified") {
          setMismatch(result.status);
        } else if (result.status === "not_paid_yet") {
          setMessage(c.notYet);
        } else if (result.status === "login_required") {
          router.push(loginHref(claimNext));
          return;
        } else {
          setMessage(c.invalidBody);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMessage(c.failed);
      });
    return () => {
      cancelled = true;
      // React strict mode re-runs effects; allow the second run to start the (idempotent) claim again.
      started.current = null;
    };
    // c and claimNext only affect messages / the login redirect, not whether to claim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, token, attempt]);

  // The purchase is already in this account (e.g. the link was opened again): go straight to it.
  useEffect(() => {
    if (state !== "done") return;
    router.replace(nextPath ?? "/account");
  }, [state, nextPath, router]);

  async function switchAccount() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(loginHref(claimNext));
    router.refresh();
  }

  const effectiveState: ClaimViewState = mismatch === "email_mismatch" ? "mismatch" : mismatch === "email_unverified" ? "unverified" : state;

  return (
    <main className="py-10">
      <Container className="max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          {effectiveState === "invalid" ? (
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
          ) : effectiveState === "pending" ? (
            <>
              <p className="text-4xl">⏳</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.pendingTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{slow ? c.pendingSlow : c.pendingBody}</p>
              <SuccessRefresh showNote={false} />
              {slow && (
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Payment confirmation")}`}
                  className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  {c.contact}
                </a>
              )}
            </>
          ) : effectiveState === "mismatch" ? (
            <>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.confirmedTitle}</h1>
              <p className="mt-4 text-base font-bold text-slate-900">{c.mismatchTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.mismatchBody}</p>
              {userEmail && (
                <p className="mt-2 text-xs text-slate-500">
                  {c.signedInAs} <span dir="ltr">{userEmail}</span>
                </p>
              )}
              <button
                type="button"
                onClick={switchAccount}
                className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
              >
                {c.switchAccount}
              </button>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Purchase access")}`}
                className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                {c.contact}
              </a>
            </>
          ) : effectiveState === "unverified" ? (
            <>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.confirmedTitle}</h1>
              <p className="mt-4 text-base font-bold text-slate-900">{c.unverifiedTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.unverifiedBody}</p>
            </>
          ) : effectiveState === "signin" ? (
            <>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.confirmedTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.signinBody}</p>
              <div className="mt-6 flex flex-col gap-2.5">
                <GoogleAuthButton label={language === "en" ? "Continue with Google" : "متابعة عبر Google"} next={claimNext} />
                <Link
                  href={loginHref(claimNext)}
                  className="flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
                >
                  {c.signIn}
                </Link>
                <Link
                  href={signupHref(claimNext)}
                  className="flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  {c.signUp}
                </Link>
              </div>
            </>
          ) : (
            // "ready" (being attached automatically) and "done" (already attached, redirecting)
            <>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.confirmedTitle}</h1>
              {message ? (
                <>
                  <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">
                    {message}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttempt((value) => value + 1)}
                    className="mt-5 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
                  >
                    {c.retry}
                  </button>
                  <Link href="/account" className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800">
                    {c.account}
                  </Link>
                </>
              ) : (
                <>
                  <p role="status" className="mt-2 text-sm leading-6 text-slate-600">
                    {effectiveState === "done" ? c.openingBody : c.addingBody}
                  </p>
                  {effectiveState === "done" && (
                    <Link
                      href={nextPath ?? "/account"}
                      className="mt-5 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
                    >
                      {c.openNow}
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}

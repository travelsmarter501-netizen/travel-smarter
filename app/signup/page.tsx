"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "../components/Container";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import ClaimBrowserNotice from "../components/auth/ClaimBrowserNotice";
import { createClient } from "../../utils/supabase/client";
import { authCallbackUrl, loginHref, safeNextPath } from "../lib/authRedirect";
import { authCopy } from "../lib/authCopy";
import { signupErrorKey, type SignupErrorKey } from "../lib/authErrors";
import { useLanguage } from "../lib/language";

const RESEND_COOLDOWN_SECONDS = 60;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const c = authCopy[language === "en" ? "en" : "ar"];
  const next = safeNextPath(searchParams.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<SignupErrorKey | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  // The callback honors `next`, so a claim-purchase link survives email confirmation.
  const emailRedirectTo = () => authCallbackUrl(window.location.origin, next);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrorKey(null);

    const cleanEmail = email.trim();
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: emailRedirectTo(),
      },
    });

    if (error) {
      // Only the stable error code is logged (never the address or password), so a failure is diagnosable from the browser console.
      console.warn("[auth] sign-up failed:", error.code ?? "no-code", error.status ?? "");
      setErrorKey(signupErrorKey(error));
      setLoading(false);
      return;
    }

    // Supabase answers a sign-up for an address that is already registered with a user that has no identities (and sends no email).
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setErrorKey("alreadyRegistered");
      setLoading(false);
      return;
    }

    // Email confirmation is required in the Supabase project: signUp succeeds but returns no session until the visitor
    // opens the link in the email -- show the "check your email" state instead of pretending they are signed in.
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }

    setConfirmationSent(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setLoading(false);
  }

  async function handleResend() {
    setResendState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: emailRedirectTo() } });
    if (error) {
      console.warn("[auth] resend confirmation failed:", error.code ?? "no-code", error.status ?? "");
      setResendState("failed");
      return;
    }
    setResendState("sent");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (confirmationSent) {
    const check = c.signup.checkEmail;
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
        <Container className="max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-4xl" aria-hidden="true">
              ✉️
            </p>
            <h1 className="mt-3 text-xl font-bold text-slate-900">{check.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {check.body} <span dir="ltr" className="break-all font-semibold text-slate-900">{email.trim()}</span>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{check.confirmThenReturn}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{check.spam}</p>
            <ClaimBrowserNotice next={next} />

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resendState === "sending"}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {resendState === "sending" ? check.resending : cooldown > 0 ? `${check.resend} (${cooldown})` : check.resend}
            </button>
            {resendState === "sent" && <p role="status" className="mt-2 text-xs font-semibold text-teal-700">{check.resent}</p>}
            {resendState === "failed" && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">{check.resendFailed}</p>}

            <Link href={loginHref(next)} className="mt-5 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800">
              {check.toLogin}
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{c.signup.title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{c.signup.subtitle}</p>
          <ClaimBrowserNotice next={next} />

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-800">
                {c.signup.name}
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder={c.signup.namePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                {c.common.email}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder={c.common.emailPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-800">
                {c.common.password}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                dir="ltr"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder={c.signup.passwordHint}
              />
            </div>

            {errorKey && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                {c.signup.errors[errorKey]}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 px-5 py-2.5 pointer-coarse:py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? c.signup.submitting : c.signup.submit}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">{c.common.or}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleAuthButton label={c.signup.google} next={next} />

          <p className="mt-6 text-center text-sm text-slate-600">
            {c.signup.haveAccount}{" "}
            <Link href={loginHref(next)} className="touch-target font-semibold text-teal-700 hover:text-teal-800">
              {c.signup.loginLink}
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

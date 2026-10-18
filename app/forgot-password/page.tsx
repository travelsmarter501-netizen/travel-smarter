"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Container from "../components/Container";
import { createClient } from "../../utils/supabase/client";
import { loginHref, resetPasswordCallbackUrl, safeNextPath } from "../lib/authRedirect";
import { authCopy } from "../lib/authCopy";
import { isEmailRateLimited } from "../lib/authErrors";
import { useLanguage } from "../lib/language";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const c = authCopy[language === "en" ? "en" : "ar"];
  const next = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<"rateLimited" | "generic" | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // The link goes through /auth/callback (session) to /reset-password, which carries `next` (e.g. a pending /claim-purchase).
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetPasswordCallbackUrl(window.location.origin, next),
    });

    if (resetError) {
      console.warn("[auth] password reset request failed:", resetError.code ?? "no-code", resetError.status ?? "");
      setError(isEmailRateLimited(resetError) ? "rateLimited" : "generic");
      setLoading(false);
      return;
    }

    // Same answer whether or not the address is registered, so this page cannot be used to find out who has an account.
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-4xl" aria-hidden="true">
                ✉️
              </p>
              <h1 className="mt-3 text-xl font-bold text-slate-900">{c.forgot.sentTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.forgot.sentBody}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{c.forgot.sameBrowserNote}</p>
              <Link href={loginHref(next)} className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800">
                {c.common.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">{c.forgot.title}</h1>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{c.forgot.subtitle}</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

                {error && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                    {error === "rateLimited" ? c.forgot.rateLimited : c.forgot.generic}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-teal-700 px-5 py-2.5 pointer-coarse:py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
                >
                  {loading ? c.forgot.submitting : c.forgot.submit}
                </button>
              </form>

              <p className="mt-6 text-center text-sm">
                <Link href={loginHref(next)} className="font-semibold text-teal-700 hover:text-teal-800">
                  {c.common.backToLogin}
                </Link>
              </p>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

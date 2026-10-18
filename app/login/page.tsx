"use client";

import { Suspense, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "../components/Container";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import ClaimBrowserNotice from "../components/auth/ClaimBrowserNotice";
import { createClient } from "../../utils/supabase/client";
import { forgotPasswordHref, safeNextPath, signupHref } from "../lib/authRedirect";
import { currentPlatformForWording } from "../lib/inAppBrowser";
import { recoverPurchasesAction } from "../claim-purchase/recoverAction";
import { authCopy } from "../lib/authCopy";
import { loginErrorKey } from "../lib/authErrors";
import { useLanguage } from "../lib/language";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const c = authCopy[language === "en" ? "en" : "ar"];
  const next = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // /auth/callback sends the user back here with ?error=auth when Google / email confirmation did not complete.
  const [errorKey, setErrorKey] = useState<"callbackFailed" | "browserMismatch" | "wrongCredentials" | "emailNotConfirmed" | "genericError" | null>(
    searchParams.get("error") === "auth" ? "callbackFailed" : searchParams.get("error") === "browser" ? "browserMismatch" : null
  );
  // Wording only: Safari on iPhone/iPad, Chrome on Android (the server render assumes iPhone, then the client corrects it).
  const otherBrowser = useSyncExternalStore(
    () => () => {},
    currentPlatformForWording,
    () => "ios" as const
  ) === "android" ? c.common.browserNames.chrome : c.common.browserNames.safari;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrorKey(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      console.warn("[auth] sign-in failed:", error.code ?? "no-code");
      setErrorKey(loginErrorKey(error));
      setLoading(false);
      return;
    }

    // Attach any guest purchase made with this verified email before landing anywhere. Server-side and best effort: a failure here never
    // blocks the sign-in (the next sign-in, or a visit to /account, tries again).
    try {
      await recoverPurchasesAction();
    } catch {
      // nothing to do
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{c.login.title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{c.login.subtitle}</p>
          <ClaimBrowserNotice next={next} />

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

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                  {c.common.password}
                </label>
                <Link href={forgotPasswordHref(next)} className="touch-target text-xs font-semibold text-teal-700 hover:text-teal-800">
                  {c.login.forgot}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder={c.common.passwordPlaceholder}
              />
            </div>

            {errorKey && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                {errorKey === "callbackFailed"
                  ? c.login.callbackFailed
                  : errorKey === "browserMismatch"
                    ? c.login.callbackBrowserMismatch.replace("{browser}", otherBrowser)
                    : c.login[errorKey]}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 px-5 py-2.5 pointer-coarse:py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? c.login.submitting : c.login.submit}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">{c.common.or}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleAuthButton label={c.login.google} next={next} />

          <p className="mt-6 text-center text-sm text-slate-600">
            {c.login.noAccount}{" "}
            <Link href={signupHref(next)} className="touch-target font-semibold text-teal-700 hover:text-teal-800">
              {c.login.signupLink}
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

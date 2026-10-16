"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "../components/Container";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { createClient } from "../../utils/supabase/client";
import { forgotPasswordHref, safeNextPath, signupHref } from "../lib/authRedirect";
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
  const [errorKey, setErrorKey] = useState<"callbackFailed" | "wrongCredentials" | "emailNotConfirmed" | "genericError" | null>(
    searchParams.get("error") === "auth" ? "callbackFailed" : null
  );

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

    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">{c.login.title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{c.login.subtitle}</p>

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
                <Link href={forgotPasswordHref(next)} className="text-xs font-semibold text-teal-700 hover:text-teal-800">
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
                {errorKey === "callbackFailed" ? c.login.callbackFailed : c.login[errorKey]}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
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
            <Link href={signupHref(next)} className="font-semibold text-teal-700 hover:text-teal-800">
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

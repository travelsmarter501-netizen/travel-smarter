"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "../components/Container";
import { createClient } from "../../utils/supabase/client";
import { forgotPasswordHref } from "../lib/authRedirect";
import { authCopy } from "../lib/authCopy";
import { useLanguage } from "../lib/language";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordClient({ hasSession, continueTo, next }: { hasSession: boolean; continueTo: string; next: string }) {
  const router = useRouter();
  const { language } = useLanguage();
  const c = authCopy[language === "en" ? "en" : "ar"];
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<"mismatch" | "tooShort" | "saveFailed" | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) return setError("tooShort");
    if (password !== confirm) return setError("mismatch");

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      console.warn("[auth] password update failed:", updateError.code ?? "no-code");
      setError("saveFailed");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    window.setTimeout(() => {
      router.replace(continueTo);
      router.refresh();
    }, 1200);
  }

  if (!hasSession) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
        <Container className="max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-4xl" aria-hidden="true">
              ⚠️
            </p>
            <h1 className="mt-3 text-xl font-bold text-slate-900">{c.reset.expiredTitle}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{c.reset.expiredBody}</p>
            <Link
              href={forgotPasswordHref(next)}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
            >
              {c.reset.requestNew}
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
          {done ? (
            <div className="text-center">
              <p className="text-4xl" aria-hidden="true">
                ✅
              </p>
              <h1 className="mt-3 text-xl font-bold text-slate-900">{c.reset.successTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{c.reset.successBody}</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">{c.reset.title}</h1>
              <p className="mt-1.5 text-sm text-slate-600">{c.reset.subtitle}</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-slate-800">
                    {c.reset.newPassword}
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    dir="ltr"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-800">
                    {c.reset.confirmPassword}
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    dir="ltr"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                    {c.reset[error]}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-teal-700 px-5 py-2.5 pointer-coarse:py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
                >
                  {loading ? c.reset.submitting : c.reset.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}

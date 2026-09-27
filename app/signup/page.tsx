"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "../components/Container";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { createClient } from "../../utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message.includes("already registered") ? "هذا البريد الإلكتروني مسجّل مسبقًا." : "تعذّر إنشاء الحساب. حاول مرة أخرى.");
      setLoading(false);
      return;
    }

    // If email confirmation is enabled in the Supabase project, signUp succeeds but
    // returns no session until the visitor confirms via email — show that state instead of redirecting.
    if (data.session) {
      router.push("/account");
      router.refresh();
      return;
    }

    setConfirmationSent(true);
    setLoading(false);
  }

  if (confirmationSent) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center py-12">
        <Container className="max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <h1 className="text-xl font-bold text-slate-900">تحقق من بريدك الإلكتروني</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              أرسلنا رابط تأكيد إلى <span dir="ltr">{email}</span>. افتح الرابط لتفعيل حسابك ثم سجّل دخولك.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800">
              الذهاب لتسجيل الدخول
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
          <h1 className="text-2xl font-bold text-slate-900">إنشاء حساب</h1>
          <p className="mt-1.5 text-sm text-slate-600">انضم إلى مسارك لتخطيط رحلاتك بسهولة.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-800">
                الاسم
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="اسمك الكامل"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-800">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                placeholder="6 أحرف على الأقل"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">أو</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleAuthButton label="التسجيل عبر Google" />

          <p className="mt-6 text-center text-sm text-slate-600">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

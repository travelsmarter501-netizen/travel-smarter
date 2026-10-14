"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { formatPrice, useCurrency } from "../lib/currency";
import { startCartCheckout } from "./actions";
import type { CheckoutErrorCode } from "../lib/commerce/checkoutErrors";

export default function CheckoutClient({
  extraProductSlug,
  testMode = false,
  signedIn = false,
}: {
  extraProductSlug?: string;
  testMode?: boolean;
  signedIn?: boolean;
}) {
  const { items, removeItem, getPriceILS, totalILS } = useCart();
  const { language, t } = useLanguage();
  const { currency } = useCurrency();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Kept as {code, message} (not a string) so the text follows the language if it is switched after an error.
  const [error, setError] = useState<{ code?: CheckoutErrorCode; message: string } | null>(null);

  const empty = items.length === 0 && !extraProductSlug;

  async function handlePay() {
    setLoading(true);
    setError(null);
    const result = await startCartCheckout({
      cartIds: items.map((item) => item.id),
      productSlugs: extraProductSlug ? [extraProductSlug] : undefined,
      // Only meaningful for guests; the server ignores it for a signed-in customer.
      email: signedIn ? undefined : email,
    });
    setLoading(false);

    if (!result.ok) {
      // The Personalized Plan is never bought from the cart: drop any stale cart line and point to the planner.
      if (result.code === "planner_answers_required") removeItem("personalized-trip-plan");
      setError({ code: result.code, message: result.error });
      return;
    }

    window.location.href = result.paymentUrl;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {testMode && (
        <p className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{t.checkout.testBadge}</p>
      )}
      <h1 className="mt-4 text-2xl font-bold text-slate-900">{t.checkout.title}</h1>

      {empty ? (
        <p className="mt-8 text-center text-sm text-slate-500">{t.cart.empty}</p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {extraProductSlug && items.length === 0 && (
              <li className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">{t.checkout.selectedProduct}</li>
            )}
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <p dir="auto" className="truncate text-sm font-semibold text-slate-900">
                    {language === "ar" ? item.titleAr : item.titleEn}
                  </p>
                  <p dir="ltr" className="mt-1 text-xs font-semibold text-teal-700">
                    {formatPrice(getPriceILS(item), currency)}
                  </p>
                </div>
                <button type="button" onClick={() => removeItem(item.id)} className="text-xs font-semibold text-slate-500 hover:text-red-600">
                  {t.cart.remove}
                </button>
              </li>
            ))}
          </ul>

          {items.length > 0 && (
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">{t.cart.subtotal}</span>
              <span dir="ltr" className="text-lg font-bold text-slate-900">
                {formatPrice(totalILS, currency)}
              </span>
            </div>
          )}

          {!signedIn && (
            <div className="mt-6">
              <label htmlFor="checkout-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                {language === "ar" ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                id="checkout-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {language === "ar" ? "سنستخدم بريدك لإرسال تفاصيل الطلب." : "We’ll use your email to send your order details."}
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">
              {error.code ? t.checkout.errors[error.code] : error.message}
              {error.code === "planner_answers_required" && (
                <>
                  {" "}
                  <Link href="/planner" className="underline">
                    {t.planner.page.title}
                  </Link>
                </>
              )}
            </p>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={loading || empty || (!signedIn && email.trim().length === 0)}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {loading ? t.checkout.redirecting : testMode ? t.checkout.payButtonTest : t.checkout.payButton}
          </button>
        </>
      )}
    </div>
  );
}

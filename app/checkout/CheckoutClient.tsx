"use client";

import { useState } from "react";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { formatPrice, useCurrency } from "../lib/currency";
import { startCartCheckout } from "./actions";

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
  const [error, setError] = useState<string | null>(null);

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
      setError(result.error);
      return;
    }

    window.location.href = result.paymentUrl;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {testMode && (
        <p className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">وضع اختبار Allpay — بدون دفع حقيقي</p>
      )}
      <h1 className="mt-4 text-2xl font-bold text-slate-900">إتمام الشراء</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        السعر النهائي يتأكد على الخادم من كتالوج المنتجات. بعد التأكيد رح نحولك لصفحة الدفع الآمنة لدى Allpay.
      </p>

      {empty ? (
        <p className="mt-8 text-center text-sm text-slate-500">{t.cart.empty}</p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {extraProductSlug && items.length === 0 && (
              <li className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">منتج محدد للدفع</li>
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
                {language === "ar"
                  ? "ما بدك حساب عشان تدفع. بعد الدفع بتسجّل دخولك أو بتنشئ حساب لتفعيل مشترياتك."
                  : "No account needed to pay. After payment you'll sign in or create an account to access your purchase."}
              </p>
            </div>
          )}

          {error && <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={handlePay}
            disabled={loading || empty || (!signedIn && email.trim().length === 0)}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {loading ? "جاري التحويل للدفع..." : testMode ? "الدفع عبر Allpay (تجريبي)" : "الدفع عبر Allpay"}
          </button>
        </>
      )}
    </div>
  );
}

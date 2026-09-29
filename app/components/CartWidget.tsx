"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { formatPrice, useCurrency } from "../lib/currency";
import { IconClose, IconShoppingBag } from "./icons";

/**
 * Cart icon + count badge (always visible in the header) plus the slide-over drawer it opens.
 * Kept as one client component so the open/close state and the button that triggers it stay
 * together -- Header only needs to render <CartWidget />.
 */
export default function CartWidget() {
  const { items, removeItem, clearCart, totalILS, getPriceILS } = useCart();
  const { language, t } = useLanguage();
  const { currency } = useCurrency();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.cartButton.ariaLabel}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
      >
        <IconShoppingBag className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label={t.cart.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.cart.title}
            className="absolute inset-y-0 end-0 flex w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">{t.cart.title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.cart.close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">{t.cart.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="min-w-0">
                        <p dir="auto" className="truncate text-sm font-semibold text-slate-900">
                          {language === "ar" ? item.titleAr : item.titleEn}
                        </p>
                        <p dir="ltr" className="mt-1 text-xs font-semibold text-teal-700">
                          {formatPrice(getPriceILS(item), currency)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-xs font-semibold text-slate-500 hover:text-red-600"
                      >
                        {t.cart.remove}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">{t.cart.subtotal}</span>
                  <span dir="ltr" className="text-lg font-bold text-slate-900">
                    {formatPrice(totalILS, currency)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="mt-4 flex w-full items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
                >
                  {t.cart.continueCta}
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-2 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  {t.cart.clear}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

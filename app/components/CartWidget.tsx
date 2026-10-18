"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCart } from "../lib/cart";
import { useLanguage } from "../lib/language";
import { formatPrice, useCurrency } from "../lib/currency";
import Price from "./Price";
import { referencePriceIfDiscounted } from "../lib/commerce/pricing";
import { IconClose, IconShoppingBag } from "./icons";

/**
 * Cart icon + count badge (always visible in the header) plus the drawer it opens.
 * Kept as one client component so the open/close state and the button that triggers it stay
 * together -- Header only needs to render <CartWidget />.
 *
 * The drawer is rendered through a portal on <body>, NOT inside the header. The header uses
 * `backdrop-filter`, and a CSS backdrop-filter makes its element the containing block for
 * `position: fixed` descendants -- which is what used to squash the "full-screen" cart into the
 * 64px header, letting its contents spill over the page. Outside the header, `fixed inset-0` really is
 * the viewport.
 *
 * Phones (< 640px): an opaque bottom sheet (max 85% of the viewport height, scrolls inside) over a dark
 * backdrop. >= 640px: the original right-hand side drawer.
 */
export default function CartWidget() {
  const { items, removeItem, clearCart, totalILS, getPriceILS, isIncludedInBundle, storageAvailable } = useCart();
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

  // Stop the page behind the cart from scrolling while it is open. On phones (iOS Safari ignores
  // overflow:hidden on <body> for touch scrolling) the body is pinned in place and the scroll position
  // is restored on close; on larger screens the original overflow lock is kept.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const pinBody = window.matchMedia("(max-width: 639px)").matches;
    const previous = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    if (pinBody) {
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
    }
    return () => {
      body.style.overflow = previous.bodyOverflow;
      html.style.overflow = previous.htmlOverflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      if (pinBody) window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.cartButton.ariaLabel}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 pointer-coarse:h-11 pointer-coarse:w-11"
      >
        <IconShoppingBag className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open &&
        createPortal(
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label={t.cart.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.cart.title}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:inset-y-0 sm:start-auto sm:end-0 sm:max-h-none sm:max-w-sm sm:rounded-none"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">{t.cart.title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.cart.close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 pointer-coarse:h-11 pointer-coarse:w-11"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {items.length > 0 && !storageAvailable && (
                <p role="status" className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  {t.cart.sessionOnly}
                </p>
              )}
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">{t.cart.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p dir="auto" className="truncate text-sm font-semibold text-slate-900">
                          {language === "ar" ? item.titleAr : item.titleEn}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-teal-700">
                          {isIncludedInBundle(item) ? (
                            t.pricing.includedInPlan
                          ) : (
                            <Price ils={getPriceILS(item)} referenceIls={referencePriceIfDiscounted(item.id, getPriceILS(item))} className="text-sm font-bold text-teal-700" />
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-xs font-semibold text-slate-500 hover:text-red-600 pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:items-center pointer-coarse:justify-center"
                      >
                        {t.cart.remove}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-slate-200 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                  className="mt-2 w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700 pointer-coarse:py-3.5"
                >
                  {t.cart.clear}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

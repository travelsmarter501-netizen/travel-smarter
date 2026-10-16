"use client";

import { useCurrency, formatPrice } from "../lib/currency";
import { useLanguage } from "../lib/language";

/**
 * A price. With a `referenceIls` (launch sale) it renders  ~~old~~  NEW  -- the old price small, muted and struck through,
 * and the new price prominent. The old price is DISPLAY ONLY: nothing that is charged, stored or verified ever
 * reads it (the charge comes from the database, see app/lib/commerce/pricing.ts). If the reference is not actually higher than the price,
 * nothing is struck.
 *
 * DOM order old -> new reads the same in Arabic (right to left) and English (left to right).
 */
export default function Price({
  ils,
  className = "",
  referenceIls,
}: {
  ils: number;
  className?: string;
  referenceIls?: number;
}) {
  const { currency } = useCurrency();
  const { t } = useLanguage();

  if (referenceIls === undefined || referenceIls <= ils) {
    return (
      <span dir="ltr" className={`inline-block ${className}`}>
        {formatPrice(ils, currency)}
      </span>
    );
  }

  const old = formatPrice(referenceIls, currency);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <s dir="ltr" aria-label={`${t.pricing.previousPrice} ${old}`} className="text-sm font-medium text-slate-400 decoration-slate-400">
        {old}
      </s>
      <span dir="ltr" className={`inline-block ${className}`}>
        {formatPrice(ils, currency)}
      </span>
    </span>
  );
}

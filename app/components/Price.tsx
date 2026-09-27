"use client";

import { useCurrency, formatPrice } from "../lib/currency";

export default function Price({ ils, className = "" }: { ils: number; className?: string }) {
  const { currency } = useCurrency();
  return (
    <span dir="ltr" className={`inline-block ${className}`}>
      {formatPrice(ils, currency)}
    </span>
  );
}

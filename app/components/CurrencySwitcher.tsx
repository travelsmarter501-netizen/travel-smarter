"use client";

import { useCurrency, type Currency } from "../lib/currency";

const options: { value: Currency; label: string }[] = [
  { value: "ILS", label: "₪ ILS" },
  { value: "USD", label: "$ USD" },
];

const FOCUS_CLASS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      dir="ltr"
      role="group"
      aria-label="اختيار العملة"
      className={`inline-flex items-center rounded-full border border-line bg-surface p-1 text-xs font-semibold ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setCurrency(option.value)}
          aria-pressed={currency === option.value}
          className={`rounded-full px-3 py-1.5 transition-colors ${FOCUS_CLASS} ${
            currency === option.value
              ? "bg-white text-brand shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

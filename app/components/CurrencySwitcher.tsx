"use client";

import { useCurrency, type Currency } from "../lib/currency";

const options: { value: Currency; label: string }[] = [
  { value: "ILS", label: "₪ ILS" },
  { value: "USD", label: "$ USD" },
];

export default function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      dir="ltr"
      role="group"
      aria-label="اختيار العملة"
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setCurrency(option.value)}
          aria-pressed={currency === option.value}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            currency === option.value
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

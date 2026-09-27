"use client";

import { useLanguage } from "../lib/language";
import type { Language } from "../lib/homepageTranslations";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  const options: { value: Language; label: string }[] = [
    { value: "ar", label: t.languageSwitcher.ar },
    { value: "en", label: t.languageSwitcher.en },
  ];

  return (
    <div
      dir="ltr"
      role="group"
      aria-label={t.languageSwitcher.ariaLabel}
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            language === option.value ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

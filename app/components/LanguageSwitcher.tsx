"use client";

import { useLanguage } from "../lib/language";
import type { Language } from "../lib/homepageTranslations";

const FOCUS_CLASS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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
      className={`inline-flex items-center rounded-full border border-line bg-surface p-1 text-xs font-semibold ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
          className={`touch-target rounded-full px-3 py-1.5 transition-colors ${FOCUS_CLASS} ${
            language === option.value ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

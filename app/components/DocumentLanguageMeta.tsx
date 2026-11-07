"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../lib/language";
import type { Language } from "../lib/homepageTranslations";

/**
 * Browser-tab title and page description in the visitor's language.
 *
 * The language is chosen in the browser (localStorage, see lib/language.tsx) and the site has no per-language URLs, so the server always
 * renders the Arabic metadata (that is what search engines and link previews see). After load, and whenever Next.js or the visitor changes
 * the page or the language, this swaps the title and the description for the chosen language. Only texts listed below are replaced (keyed by
 * the server's own text); any other page keeps its metadata as is. Legacy product pages and legal pages are not covered (separate scope).
 */
type Entry = Record<Language, string>;

const TITLES: Entry[] = [
  { ar: "Travel Smarter | خطة رحلة مخصصة، يوم بيوم", en: "Travel Smarter | A personalized trip plan, day by day", he: "Travel Smarter | תוכנית טיול אישית, יום אחר יום" },
  { ar: "خطة مخصصة إلك ✨ | Travel Smarter", en: "Your personalized plan ✨ | Travel Smarter", he: "תוכנית אישית בשבילכם ✨ | Travel Smarter" },
  { ar: "خطتك المحفوظة | Travel Smarter", en: "Your saved plan | Travel Smarter", he: "התוכנית השמורה שלכם | Travel Smarter" },
  { ar: "عملية الشراء | Travel Smarter", en: "Your purchase | Travel Smarter", he: "הרכישה שלכם | Travel Smarter" },
  { ar: "تعيين كلمة مرور جديدة | Travel Smarter", en: "Reset password | Travel Smarter", he: "איפוס סיסמה | Travel Smarter" },
];

const DESCRIPTIONS: Entry[] = [
  {
    ar: "جاوب على أسئلة قصيرة واحصل على خطة رحلة مخصصة حسب أيامك واهتماماتك ومكان سكنك، مع الأماكن والمطاعم وأوقات التنقل. متاح لبرشلونة وبراغ.",
    en: "Answer a few short questions and get a trip plan built around your days, your interests and where you're staying, with places, restaurants and travel times. Currently available for Barcelona and Prague.",
    he: "ענו על כמה שאלות קצרות וקבלו תוכנית טיול שמותאמת לימים, לתחומי העניין ולמקום הלינה שלכם, עם מקומות, מסעדות וזמני נסיעה. זמין כרגע לברצלונה.",
  },
  {
    ar: "جاوب على 4 أسئلة قصيرة وبنبني لك خطة مرتّبة يوم بيوم. برشلونة وبراغ متاحتين الآن.",
    en: "Answer 4 short questions and we'll build you a plan arranged day by day. Barcelona and Prague are available now.",
    he: "ענו על 4 שאלות קצרות ונבנה לכם תוכנית מסודרת יום אחר יום. ברצלונה זמינה עכשיו.",
  },
];

/** The text for `lang` when `current` is any language version of a listed text; otherwise null (leave it). */
function translated(entries: Entry[], current: string, lang: Language): string | null {
  const entry = entries.find((e) => e.ar === current || e.en === current || e.he === current);
  return entry ? entry[lang] : null;
}

function apply(lang: Language) {
  const title = translated(TITLES, document.title, lang);
  if (title && title !== document.title) document.title = title;
  document.querySelectorAll<HTMLMetaElement>('meta[name="description"]').forEach((meta) => {
    const description = translated(DESCRIPTIONS, meta.content, lang);
    if (description && description !== meta.content) meta.setAttribute("content", description);
  });
}

export default function DocumentLanguageMeta() {
  const { language } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    apply(language);
    // Next.js may (re)write the title and description after this effect (navigation, streamed metadata): follow those writes.
    const observer = new MutationObserver(() => apply(language));
    observer.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["content"] });
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, [language, pathname]);

  return null;
}

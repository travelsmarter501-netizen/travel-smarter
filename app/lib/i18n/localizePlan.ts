import { PLACE_TEXT, PLAN_PHRASES } from "./planCatalog";
import type { PlanLanguage } from "./planText";
import { hebrewPrefixed } from "./hebrew";
import type { V2Plan } from "../planner/barcelonaV2Resolve";

/**
 * Display-only translation of a saved / generated V2 plan (multi-language plan view).
 *
 * - Works on a COPY: the stored plan is never modified, migrated or re-generated, and switching language never calls the
 *   engine, an AI or a translation service.
 * - Only free-text fields are translated. Ids, place ids, times, durations, dates, prices-as-numbers, coordinates, URLs,
 *   enums and every number keep their stored values, so stops, order, times and prices are identical in every language.
 * - A text is translated only when it EXACTLY equals a reviewed catalog source (planCatalog.ts) or one of the known engine
 *   templates below. Anything else (e.g. an older plan whose Arabic differs from today's data) is shown as stored and
 *   recorded as a missing translation -- never guessed, never replaced with newer data.
 */

type Pair = { en: string; he: string };
const EXACT = new Map<string, Pair>();
for (const entry of [...PLACE_TEXT, ...PLAN_PHRASES]) EXACT.set(entry.ar, { en: entry.en, he: entry.he });

const ARABIC = /[؀-ۿ]/;
const missing = new Set<string>();

function recordMissing(text: string) {
  if (missing.has(text)) return;
  missing.add(text);
  if (typeof console !== "undefined") console.warn("[plan-i18n] missing translation:", text);
}

/** Every Arabic text that could not be translated during this page session (for checks and tests). */
export function getMissingPlanTranslations(): string[] {
  return [...missing];
}

function exact(text: string, lang: "en" | "he"): string | null {
  const hit = EXACT.get(text);
  return hit ? hit[lang] : null;
}

/** A short label inside a template: catalog translation, else unchanged when it has no Arabic (Latin place / area names). */
function label(text: string, lang: "en" | "he"): string | null {
  const hit = exact(text, lang);
  if (hit) return hit;
  return ARABIC.test(text) ? null : text;
}

/** Hebrew "and": the letter ו attaches to a Hebrew word, and takes a maqaf before a Latin word ("ו־Letná"). */
function heAnd(word: string): string {
  return /^[֐-׿]/.test(word) ? `ו${word}` : `ו־${word}`;
}

/** English needs an article before some area names ("near the Gothic Quarter"). */
const EN_AREA_ARTICLE: Record<string, string> = { "Gothic Quarter": "the Gothic Quarter", Born: "El Born", Raval: "El Raval" };
const enArea = (x: string) => EN_AREA_ARTICLE[x] ?? x;

const REASON_TEMPLATES: { prefix: string; en: (x: string) => string; he: (x: string) => string }[] = [
  { prefix: "قريب من مسار ", en: (x) => `Near the ${x} route`, he: (x) => `קרוב למסלול ${x}` },
  { prefix: "مناسب بعد جولة ", en: (x) => `Good after a walk around ${enArea(x)}`, he: (x) => `מתאים אחרי סיור ב־${x}` },
  { prefix: "تجربة قريبة من ", en: (x) => `An experience near ${enArea(x)}`, he: (x) => `חוויה ליד ${x}` },
  { prefix: "سهرة قريبة من ", en: (x) => `An evening out near ${enArea(x)}`, he: (x) => `בילוי ערב ליד ${x}` },
];

const CITY_NAMES: Record<string, Pair> = { برشلونة: { en: "Barcelona", he: "ברצלונה" }, براغ: { en: "Prague", he: "פראג" }, فيينا: { en: "Vienna", he: "וינה" } };

/** Engine texts that carry a parameter (area names, numbers, place names). Returns null when no template matches. */
function template(text: string, lang: "en" | "he"): string | null {
  for (const t of REASON_TEMPLATES) {
    if (text.startsWith(t.prefix)) {
      const area = label(text.slice(t.prefix.length), lang);
      return area === null ? null : t[lang](area);
    }
  }

  // "اليوم 3" (fallback day title)
  let m = /^اليوم (\d+)$/.exec(text);
  if (m) return lang === "en" ? `Day ${m[1]}` : `יום ${m[1]}`;

  // Capacity warning (Barcelona / Prague wording)
  m = /^قدرنا نبني خطة قوية لـ (\d+) أيام من البيانات المتاحة حاليًا ل(برشلونة|براغ|فيينا)\. عم نوسّع المحتوى للأيام الأطول\.$/.exec(text);
  if (m) {
    const city = CITY_NAMES[m[2]][lang];
    return lang === "en"
      ? `We could build a strong plan for ${m[1]} days from the data currently available for ${city}. We're expanding the content for longer trips.`
      : `הצלחנו לבנות תוכנית חזקה ל־${m[1]} ימים מהנתונים שזמינים כרגע ${hebrewPrefixed("ל", city)}. אנחנו מרחיבים את התוכן לטיולים ארוכים יותר.`;
  }

  // Prague day summaries: "محطات اليوم: A، B وC." / "محطة اليوم: A."
  m = /^محطة اليوم: (.+)\.$/.exec(text);
  if (m && !m[1].includes("، ")) {
    const name = label(m[1], lang);
    if (name === null) return null;
    return lang === "en" ? `Today's stop: ${name}.` : `התחנה של היום: ${name}.`;
  }
  m = /^محطات اليوم: (.+)\.$/.exec(text);
  if (m) {
    const body = m[1];
    const cut = body.lastIndexOf(" و");
    if (cut < 0) return null;
    const head = body.slice(0, cut).split("، ");
    const names = [...head, body.slice(cut + 2)].map((name) => label(name, lang));
    if (names.some((name) => name === null)) return null;
    const list = names as string[];
    const last = list[list.length - 1];
    const rest = list.slice(0, -1).join(", ");
    return lang === "en" ? `Today's stops: ${rest} and ${last}.` : `התחנות של היום: ${rest} ${heAnd(last)}.`;
  }

  // Prague day titles: "A وB", "يوم A", optionally followed by ": <first stop>"
  return pragueTitle(text, lang);
}

/** Area labels used in day titles by the cities with the simple presenter (Prague, Vienna). */
const PRAGUE_AREAS_AR = [
  "منطقة القلعة", "القلعة وHradčany", "Malá Strana", "تلة Petřín", "البلدة القديمة", "ساحة Republiky", "Josefov", "المدينة الجديدة", "ضفة النهر", "Vyšehrad", "Žižkov وVinohrady", "Letná", "Holešovice", "Troja",
  // Vienna
  "وسط المدينة", "قصر Hofburg", "حي المتاحف", "Karlsplatz", "Stadtpark", "Belvedere", "حي Hundertwasser", "Prater", "Augarten", "Mariahilf", "Schönbrunn", "الدانوب", "Alsergrund", "Kahlenberg",
];
/** Area labels without a leading article, for titles. */
const PRAGUE_AREA_TITLE: Record<string, Pair> = {
  "منطقة القلعة": { en: "Castle area", he: "אזור הטירה" },
  "القلعة وHradčany": { en: "Castle and Hradčany", he: "הטירה ו־Hradčany" },
  "تلة Petřín": { en: "Petřín hill", he: "גבעת Petřín" },
  "البلدة القديمة": { en: "Old Town", he: "העיר העתיקה" },
  "ساحة Republiky": { en: "Republic Square", he: "כיכר Republiky" },
  "المدينة الجديدة": { en: "New Town", he: "העיר החדשה" },
  "ضفة النهر": { en: "Riverside", he: "גדת הנהר" },
  "Žižkov وVinohrady": { en: "Žižkov and Vinohrady", he: "Žižkov ו־Vinohrady" },
  // Vienna
  "وسط المدينة": { en: "City centre", he: "מרכז העיר" },
  "قصر Hofburg": { en: "Hofburg Palace", he: "ארמון Hofburg" },
  "حي المتاحف": { en: "Museum Quarter", he: "רובע המוזיאונים" },
  "حي Hundertwasser": { en: "Hundertwasser quarter", he: "רובע Hundertwasser" },
  "الدانوب": { en: "The Danube", he: "הדנובה" },
};
function areaTitle(ar: string, lang: "en" | "he"): string {
  return PRAGUE_AREA_TITLE[ar]?.[lang] ?? ar;
}

function pragueTitle(text: string, lang: "en" | "he"): string | null {
  let core = text;
  let suffix = "";
  const colon = text.indexOf(": ");
  if (colon > 0) {
    const stop = label(text.slice(colon + 2), lang);
    if (stop === null) return null;
    core = text.slice(0, colon);
    suffix = `: ${stop}`;
  }
  if (core.startsWith("يوم ")) {
    const area = core.slice(4);
    if (PRAGUE_AREAS_AR.includes(area)) return areaTitle(area, lang) + suffix;
    return null;
  }
  for (const a of PRAGUE_AREAS_AR) {
    if (!core.startsWith(a + " و")) continue;
    const b = core.slice(a.length + 2);
    if (!PRAGUE_AREAS_AR.includes(b)) continue;
    const A = areaTitle(a, lang);
    const B = areaTitle(b, lang);
    return (lang === "en" ? `${A} & ${B}` : `${A} ${heAnd(B)}`) + suffix;
  }
  return null;
}

/** Translates one display text. Arabic returns the input unchanged. */
export function translatePlanText(text: string, lang: PlanLanguage): string {
  if (lang === "ar" || !text) return text;
  const hit = exact(text, lang) ?? template(text, lang);
  if (hit !== null) return hit;
  if (ARABIC.test(text)) recordMissing(text);
  return text;
}

/**
 * Keys whose string values are data, not display text: never translated. (Display texts that drive logic -- booking
 * status, location label -- are also kept as data and translated where they are shown.)
 */
const DATA_KEYS = new Set([
  "id", "placeId", "fromPlaceId", "toPlaceId", "destination", "type", "kind", "mealType", "categoryId", "areaId", "sourceStatus",
  "recommendedMode", "mode", "weekday", "actualDate", "image", "imagePosition", "mapsUrl", "appleMapsUrl", "officialUrl", "bookingUrl",
  "ticketsUrl", "ratingUrl", "ratingSource", "imageSource", "imageSourceUrl", "imageAuthor", "imageLicense", "imageLicenseUrl",
  "officialSocialUrl", "ticketUrl", "phone", "lastVerified", "ratingLastVerified", "source", "sourceUrl", "priceLevel", "address",
  "bookingStatus", "locationLabel", "crowdLevel", "musicStyle", "categoryIcon", "monthRange", "open", "close", "timeRange",
]);

function walk(value: unknown, lang: "en" | "he", key?: string): unknown {
  if (typeof value === "string") return key && DATA_KEYS.has(key) ? value : translatePlanText(value, lang);
  if (Array.isArray(value)) return value.map((item) => walk(item, lang, key));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, lang, k);
    return out;
  }
  return value;
}

/** A translated COPY of the plan for display. Arabic returns the same object (byte-identical to before). */
export function localizePlan(plan: V2Plan, lang: PlanLanguage): V2Plan {
  if (lang === "ar") return plan;
  return walk(plan, lang) as V2Plan;
}

import type { V2PlannerInterest } from "./v2PlannerTypes";

/**
 * Per-destination trip-length limits for the Personalized Plan questionnaire (browser) and its server check
 * (normalizePersonalizedAnswers). Plain module: the same function decides in both places.
 *
 * A destination with no entry here keeps the general limit (MAX_PERSONALIZED_PLAN_DAYS). Prague and Barcelona have none.
 *
 * Budapest (owner decision 2026-11-16, from the 108-plan launch table docs/budapest/data/quality-r5/launch/table-B1.csv; 5+ days were
 * never measured):
 *   - at most 4 days;
 *   - culture only, or popular only: at most 3 days (4 days missed the thresholds: thin days / weak interest match);
 *   - nature and relaxation only (the "nature" group): 1 day (2-4 days: thin days, few places).
 * An interest rule applies only when EVERY chosen interest is inside its list. "Surprise me" has no interest rule.
 */
export type TripLengthLimit =
  | { maxDays: number; reason: "destination" }
  /** `groupIds`: the questionnaire's interest groups the rule is about (V2_INTEREST_DISPLAY_GROUPS ids), for the message. */
  | { maxDays: number; reason: "interests"; groupIds: string[] };

type TripLengthRule = { maxDays: number; onlyInterests?: readonly V2PlannerInterest[]; groupIds?: string[] };

const TRIP_LENGTH_RULES: Record<string, TripLengthRule[]> = {
  budapest: [
    { maxDays: 4 },
    { maxDays: 3, onlyInterests: ["cultureHistory"], groupIds: ["cultureHistory"] },
    { maxDays: 3, onlyInterests: ["popular"], groupIds: ["popular"] },
    { maxDays: 1, onlyInterests: ["natureViews", "beachRelax"], groupIds: ["natureBeaches"] },
  ],
};

type Lang = "ar" | "en" | "he";

/**
 * Temporary launch scope by DATE (owner decision 2026-11-16): dated trips that touch these dates are not offered, because our plans do
 * not yet handle the opening-hour changes of these holidays well enough (a limit on our product's readiness, NOT a claim that the city or
 * every place is closed). Only these exact dates; not generalised to other years. Plans without dates get a short note instead.
 */
const UNAVAILABLE_DATES: Record<string, { dates: readonly string[]; unavailable: Record<Lang, string>; undatedNote: Record<Lang, string> }> = {
  budapest: {
    dates: ["2026-12-24", "2026-12-25", "2026-12-26", "2026-12-31", "2027-01-01"],
    // Arabic: the owner's wording. English / Hebrew: AI-written, not reviewed.
    unavailable: {
      ar: "خطط بودابست مش متاحة حاليًا لهالتواريخ بسبب تغيّر مواعيد الأماكن بالأعياد. اختار تواريخ ثانية أو مدينة ثانية.",
      en: "Budapest plans aren’t available for these dates right now, because places change their opening hours over the holidays. Choose other dates or another city.",
      he: "תוכניות לבודפשט לא זמינות כרגע לתאריכים האלה, כי שעות הפתיחה של המקומות משתנות בחגים. בחרו תאריכים אחרים או עיר אחרת.",
    },
    // Not reviewed.
    undatedNote: {
      ar: "الخطة بدون تواريخ ما بتفحص إغلاقات الأعياد. خطط بودابست حاليًا مش متاحة لـ24–26 ديسمبر 2026 و31 ديسمبر 2026 و1 يناير 2027.",
      en: "A plan without dates does not check holiday closures. Budapest plans are not available for 24–26 December 2026, 31 December 2026 or 1 January 2027 at the moment.",
      he: "תוכנית בלי תאריכים לא בודקת סגירות בחגים. כרגע אין תוכניות לבודפשט ל־24–26 בדצמבר 2026, ל־31 בדצמבר 2026 ול־1 בינואר 2027.",
    },
  },
};

/** The trip's dates (inclusive, "YYYY-MM-DD") touch a date this destination does not offer: the dates it touches, or null. */
export function unavailableTripDates(destinationId: string | null | undefined, arrivalDate: string, departureDate: string): string[] | null {
  const rule = destinationId ? UNAVAILABLE_DATES[destinationId] : undefined;
  if (!rule || !arrivalDate || !departureDate || departureDate < arrivalDate) return null;
  const hit = rule.dates.filter((date) => date >= arrivalDate && date <= departureDate);
  return hit.length > 0 ? hit : null;
}

/** The message for a dated request on those dates, and the note for a plan without dates (null for other destinations). */
export function tripDateMessages(destinationId: string | null | undefined, language: Lang): { unavailable: string; undatedNote: string } | null {
  const rule = destinationId ? UNAVAILABLE_DATES[destinationId] : undefined;
  return rule ? { unavailable: rule.unavailable[language], undatedNote: rule.undatedNote[language] } : null;
}

/** The tightest limit that applies to this destination and these interests, or null when only the general limit applies. */
export function tripLengthLimit(destinationId: string | null | undefined, interests: readonly V2PlannerInterest[], surpriseMe: boolean): TripLengthLimit | null {
  const rules = destinationId ? TRIP_LENGTH_RULES[destinationId] : undefined;
  if (!rules) return null;
  let best: TripLengthRule | null = null;
  for (const rule of rules) {
    if (rule.onlyInterests) {
      const only = rule.onlyInterests;
      if (surpriseMe || interests.length === 0 || !interests.every((interest) => only.includes(interest))) continue;
    }
    if (!best || rule.maxDays < best.maxDays) best = rule;
  }
  if (!best) return null;
  return best.onlyInterests ? { maxDays: best.maxDays, reason: "interests", groupIds: best.groupIds ?? [] } : { maxDays: best.maxDays, reason: "destination" };
}

import type { Weekday } from "../hours";

/** A single compact, presentation-only risk note for one place. */
export type PlannerOperationalWarning = {
  textAr: string;
  /**
   * Round 3A Exact-Date Hours Safety Fix -- optional: when set, this warning is only genuinely
   * relevant to a visit actually landing on this weekday (e.g. "check hours if your visit is
   * Sunday" only matters when the visit really IS Sunday). In flexible mode (weekday unknown),
   * this warning still shows -- the hedged "لو كانت زيارتك يوم أحد" phrasing already reads
   * correctly without a known date, per this file's own header note below. In exact-date mode,
   * once the real weekday is known, showing this warning on a day that provably ISN'T that
   * weekday is actively misleading (root cause of the "Cathedral warning shows on Thursday"
   * finding) -- so it's suppressed there instead. Warnings without this field are general facts
   * about the place (e.g. "closed every Monday") and always show, unconditional on any date.
   */
  onlyRelevantOnWeekday?: Weekday;
};

/**
 * Smart Planner Operational Warnings V1 -- a small, Barcelona-specific `placeId -> warning[]`
 * lookup, NOT a duplicate hours database. Covers only the handful of places with a known,
 * customer-impacting risk (a closure day, unusually narrow hours, or a booking/availability
 * requirement) that is worth surfacing right on the stop card. Wording is reused verbatim from
 * the equivalent Ready Plan `note` fields where an exact match already exists (Camp Nou, Museu
 * d'Història de Catalunya), so the two surfaces never say different things about the same risk.
 *
 * Presentation-only: looked up live by placeId (and, since Round 3A, an optional real weekday)
 * at render time, never persisted to Supabase and never fed back into itinerary generation,
 * scoring, Primary Interest, accommodation, or must-visit logic. A saved plan therefore always
 * shows today's warnings, even for a plan saved before a place's risk was known.
 */
// Fix Repetitive Montjuïc Day: reworded every day-specific warning below from an assertion
// about "this day" (e.g. "⚠️ يوم الأحد: ... مغلقة" -- misleading when this stop's day in the
// generated plan isn't actually a Sunday, which flexible/undated plans can never determine, and
// even a real dated plan's date-eligibility gate already prevents scheduling it on a real
// closed day -- see barcelonaV2DateEligibility.ts) into a general, always-true FACT about the
// place's own hours ("closed every Sunday"), which reads correctly regardless of which day this
// stop actually landed on. Same information, no longer implying a scheduling assertion this
// presentation-only lookup has no way to actually verify (see this file's own header comment:
// it has no date context at all).
//
// Round 3A Exact-Date Hours Safety Fix: the file DOES now optionally receive a real weekday (see
// getBarcelonaPlannerOperationalWarnings below) -- the two warnings below that are conditionally
// phrased ("... لو كانت زيارتك يوم أحد" -- "... if your visit happens to be Sunday") are tagged
// `onlyRelevantOnWeekday: "sunday"` so they're suppressed on a known non-Sunday exact-date visit
// (previously always shown, even on a verified Thursday). Warnings phrased as unconditional
// facts (Boqueria/MNAC's own Monday closure) are untouched -- they're true regardless of which
// day this specific visit lands on, so there's nothing to suppress.
const BARCELONA_PLANNER_OPERATIONAL_WARNINGS: Record<string, PlannerOperationalWarning[]> = {
  boqueria: [{ textAr: "⚠️ La Boqueria مغلقة كل يوم أحد — تأكد من التاريخ لو بتخطط تزورها يوم أحد." }],
  "barcelona-cathedral": [
    { textAr: "⚠️ أيام الأحد، ساعات الزيارة السياحية محدودة تقريبًا 14:00–16:30 — افحص الساعات قبل ما توصل لو كانت زيارتك يوم أحد.", onlyRelevantOnWeekday: "sunday" },
  ],
  mnac: [
    { textAr: "⚠️ MNAC مغلق كل يوم اثنين." },
    { textAr: "⚠️ أيام الأحد، MNAC يغلق حوالي 15:00 — انتبه لتوقيتك لو كانت زيارتك يوم أحد.", onlyRelevantOnWeekday: "sunday" },
  ],
  "camp-nou": [
    {
      textAr:
        "الحجز ضروري مسبقًا. ⚠️ Camp Nou ما زال ضمن أعمال Espai Barça، لذلك نوع الجولة والتجربة المتاحة ممكن يتغير. افحص التوفر والتفاصيل قبل الحجز.",
    },
  ],
  "museu-historia-catalunya": [{ textAr: "⚠️ Museu d'Història de Catalunya مغلق كل يوم اثنين." }],
  "cook-and-taste-paella-class": [
    { textAr: "⚠️ التجربة تحتاج حجز مسبق ومرتبطة بموعد/جلسة متاحة. افحص التوفر قبل تثبيت يومك." },
  ],
};

/**
 * Returns `undefined` (never an empty array) when a placeId has no known warning, so callers can
 * use a plain truthy check. `weekday`, added in Round 3A, is optional and defaults to
 * "unknown" (`undefined`/`null`) -- every existing caller that never passes it (V1's
 * `operationalWarningResolver` wiring) keeps its exact prior behavior, since a weekday-tagged
 * warning is only ever FILTERED OUT when the real weekday is known and doesn't match -- it is
 * never filtered out when the weekday is unknown.
 */
export function getBarcelonaPlannerOperationalWarnings(placeId: string, weekday?: Weekday | null): PlannerOperationalWarning[] | undefined {
  const all = BARCELONA_PLANNER_OPERATIONAL_WARNINGS[placeId];
  if (!all) return undefined;
  if (!weekday) return all;
  const relevant = all.filter((warning) => !warning.onlyRelevantOnWeekday || warning.onlyRelevantOnWeekday === weekday);
  return relevant.length > 0 ? relevant : undefined;
}

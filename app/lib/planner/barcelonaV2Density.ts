/**
 * Smart Planner V2 Phase 4.1 -- day-density classification. V2-only, additive: does not touch
 * the generic engine, `plannerDayBuilder.ts`, or the existing `capacityWarning` (which only
 * measures daysGenerated vs daysRequested and stays completely unchanged). This module answers
 * a different question: even when every requested day was generated, was any individual day
 * left honestly thin because the data didn't support more?
 *
 * Pure functions, no server-only dependency, so this stays testable directly via `npx tsx`
 * (unlike `barcelonaV2Resolve.ts`, which carries `import "server-only"`).
 *
 * FINAL RULE (documented per the task's own "document the final rule" instruction):
 *   healthy  if mainStopCount >= 3 OR totalVisitMinutes >= 240
 *   thin     if mainStopCount == 2 AND totalVisitMinutes < 240
 *   veryThin if mainStopCount <= 1 AND totalVisitMinutes < 240
 * `mainStopCount`/`totalVisitMinutes` only ever count main visit stops -- food/shopping/
 * nightlife supplementary suggestions never factor in, exactly as instructed. The 240-minute
 * escape hatch exists so a 2-stop day built around one or two genuinely long experiences (e.g.
 * gaudi-bike-tour at 210min, montjuic at 180min) isn't mislabeled thin just for having a low
 * stop count -- density is about whether the day is USEFUL, not about hitting a stop tally.
 */

export type PlannerDayDensity = "healthy" | "thin" | "veryThin";

const HEALTHY_MIN_STOPS = 3;
const HEALTHY_MIN_MINUTES = 240;
const THIN_STOP_COUNT = 2;

export function classifyDayDensity(mainStopCount: number, totalVisitMinutes: number): PlannerDayDensity {
  if (mainStopCount >= HEALTHY_MIN_STOPS || totalVisitMinutes >= HEALTHY_MIN_MINUTES) return "healthy";
  if (mainStopCount === THIN_STOP_COUNT) return "thin";
  return "veryThin";
}

export type V2DensitySummary = {
  /** Non-alarming Arabic message, shown only when at least one day is veryThin. */
  message: string;
  veryThinDayNumbers: number[];
  thinDayNumbers: number[];
};

const SINGLE_VERY_THIN_DAY_MESSAGE =
  "الخطة تغطي كل أيام الرحلة، لكن أحد الأيام أخف من باقي الأيام بسبب كمية الأماكن المناسبة المتاحة حاليًا.";
const MULTIPLE_VERY_THIN_DAYS_MESSAGE =
  "الخطة تغطي كل أيام الرحلة، لكن بعض الأيام أخف من باقي الأيام بسبب كمية الأماكن المناسبة المتاحة حاليًا.";

/**
 * Returns a density summary only when the plan needs one -- i.e. at least one day is
 * `veryThin` (per the task: "If any generated day is veryThin, show a warning"; a merely
 * `thin` day never triggers this on its own). Never claims an incomplete day count -- this is
 * completely independent from `capacityWarning`/`daysGenerated`/`daysRequested`, which stay
 * unchanged.
 */
export function buildDensitySummary(days: { dayNumber: number; density: PlannerDayDensity }[]): V2DensitySummary | null {
  const veryThinDayNumbers = days.filter((d) => d.density === "veryThin").map((d) => d.dayNumber);
  const thinDayNumbers = days.filter((d) => d.density === "thin").map((d) => d.dayNumber);

  if (veryThinDayNumbers.length === 0) return null;

  return {
    message: veryThinDayNumbers.length === 1 ? SINGLE_VERY_THIN_DAY_MESSAGE : MULTIPLE_VERY_THIN_DAYS_MESSAGE,
    veryThinDayNumbers,
    thinDayNumbers,
  };
}

import type { HoursInfo, Weekday } from "../hours";
import type { PreferredTime } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";

/**
 * Build Real Daily Timeline for Personalized Plans -- the Timeline Resolver.
 *
 * Pure, destination-agnostic-shaped, NO `server-only` dependency (mirrors barcelonaV2Density.ts's
 * own precedent: "stays testable directly via `npx tsx`") -- operates only on already-resolved
 * data the caller hands it (stop metadata, route legs, meal stops), never touches the Guide or
 * re-decides which places are selected. Called from barcelonaV2Resolve.ts, strictly AFTER Day
 * Builder -> Natural Cluster Reclaim -> Cross-Day Optimization -> Meal Stop resolution have all
 * already produced one day's FINAL stop list -- this file only decides WHEN, on the clock, each
 * already-decided stop happens. It never reorders stops, never changes which places are on the
 * day, never changes visitDurationMinutes, and never touches scoring.
 *
 * -- Honesty rules (the whole point of this task) ------------------------------------------------
 * - A `type: "fixed"` schedule + a known real weekday is the ONLY case ever treated as a hard
 *   constraint (matches barcelonaV2DateEligibility.ts's own reliability rules exactly -- this
 *   file re-derives nothing about weekday closure itself, it only reads the same HoursInfo shape
 *   for INTRA-day time-of-day fitting, which date-eligibility doesn't do).
 * - Every other case (`variable`/`event`/`always-open`/`temporarily-closed` is never reached here
 *   since date-eligibility already excludes it/missing hours/no known weekday) produces a window
 *   marked `approximate: true` -- never a fabricated precise claim.
 * - An unresolved transport leg NEVER receives an invented duration. A small internal-only
 *   buffer keeps the clock moving so the rest of the day doesn't collapse to the same instant,
 *   but it is never surfaced as a transport duration anywhere (see
 *   `UNRESOLVED_LEG_INTERNAL_BUFFER_MINUTES`'s own doc comment) -- the existing transport
 *   connector UI stays exactly as honest/unresolved as before this file existed.
 */

export type MealType = "breakfast" | "lunch" | "tapas" | "dinner";

export type TimelineWindow = {
  startMinutes: number;
  endMinutes: number;
  /** True whenever this window is NOT backed by a verified `type: "fixed"` schedule matched
   * against a known real weekday -- i.e. flexible/unknown hours, no arrival date, or (rare) a
   * visit that had to be truncated/best-effort-placed against a tight closing time. Never
   * exposed to the customer as verification jargon -- see barcelonaV2Resolve.ts's own
   * customer-facing wording ("الوقت تقريبي"). */
  approximate: boolean;
};

export type TimelineStopWindow = TimelineWindow & { placeId: string };
export type TimelineMealWindow = TimelineWindow & { placeId: string; mealType: MealType; afterStopIndex: number };

/**
 * Timeline Final Customer-Experience Polish -- a genuinely large, unscheduled gap between two
 * consecutive timeline entries (see FREE_TIME_GAP_THRESHOLD_MINUTES). Never a fabricated venue or
 * activity -- just the open window itself, rendered as a lightweight "free time" block so a big
 * silent jump on the clock reads as an intentional pause, not a broken schedule.
 */
export type FreeTimeBlock = { startMinutes: number; endMinutes: number };

export type DayTimeline = {
  dayStartMinutes: number;
  dayEndMinutes: number;
  stops: TimelineStopWindow[];
  meals: TimelineMealWindow[];
  /** True when ANY stop or meal in this day is approximate (see TimelineWindow) -- drives the
   * day-level "الوقت تقريبي" note so individual cards don't need repeated caveats. */
  approximate: boolean;
  /** Gaps of at least FREE_TIME_GAP_THRESHOLD_MINUTES between two consecutive scheduled entries
   * -- see this file's own header comment on FreeTimeBlock. */
  freeTimeBlocks: FreeTimeBlock[];
};

export type TimelineStopInput = {
  placeId: string;
  visitDurationMinutes: number;
  hours?: HoursInfo;
  preferredTime: PreferredTime;
};

export type TimelineMealInput = {
  placeId: string;
  mealType: MealType;
  /** -1 means "before the day's first stop" (breakfast) -- every other meal type sits after a
   * real stop index, same as before. */
  afterStopIndex: number;
  hours?: HoursInfo;
};

// ── Centralized policy (destination-level defaults, per this task's own "keep the policy
// centralized" instruction) -------------------------------------------------------------------

/** Normal sightseeing day default -- see this task's own suggested concept. */
export const DEFAULT_DAY_START_MINUTES = 9 * 60;

/**
 * A day whose FIRST stop's own `preferredTime` bucket is inherently a late-in-the-day thing
 * (a sunset viewpoint, an evening show) shouldn't pretend to start at 09:00 -- this table is the
 * ONLY place that decision is made. Every bucket not listed here keeps the 09:00 default. Real
 * opening hours (checked below, when verified) can still push the start even later than this
 * table suggests; they never pull it earlier than what the venue's own hours allow.
 */
const START_BUCKET_OVERRIDE_MINUTES: Partial<Record<PreferredTime, number>> = {
  afternoon: 12 * 60,
  "daytime/evening": 10 * 60,
  evening: 16 * 60,
  "daytime/sunset": 10 * 60,
  sunset: 16 * 60,
};

/**
 * Surprise Me Quality V2, Part C -- a "sunset"-bucketed stop's actual clock placement previously
 * depended only on ITS OWN bucket when it happened to be the day's first stop (via
 * `deriveDayStartMinutes` above); every other position just inherited whatever the day's
 * accumulated clock already was, which is not decided by time-of-day at all (Route Optimizer/
 * Cross-Day order stops for geography, per `deriveDayStartMinutes`'s own doc comment). Measured
 * live: sunset-catamaran-sail landing at 15:00 mid-trip, hours before any real Barcelona sunset.
 * This table/floor is the fix -- a per-stop MINIMUM start applied at placement time (below),
 * additive to the existing day-start derivation, which stays completely untouched (still governs
 * only whether the whole day itself starts late).
 *
 * Deliberately coarse, reviewed, non-astronomical monthly buckets (never a live sunset API, per
 * this task's explicit instruction) -- roughly Barcelona's typical sunset clock time each month,
 * used only to pick a conservative "not obviously wrong" floor, never claimed as precise.
 */
const SEASONAL_SUNSET_MINUTES_BY_MONTH: Record<number, number> = {
  1: 17 * 60 + 30,
  2: 18 * 60,
  3: 19 * 60,
  4: 20 * 60,
  5: 20 * 60 + 45,
  6: 21 * 60 + 15,
  7: 21 * 60 + 15,
  8: 20 * 60 + 30,
  9: 19 * 60 + 30,
  10: 18 * 60 + 30,
  11: 17 * 60 + 30,
  12: 17 * 60 + 15,
};

/** Minutes before the seasonal sunset estimate a "sunset" experience should realistically begin,
 * so its visit genuinely spans dusk rather than starting right as the sun is already down. */
const SUNSET_LEAD_MINUTES = 45;

/**
 * The earliest a "sunset"-bucketed stop should ever be placed, or `null` for every other bucket
 * (no floor -- their placement is unchanged). When the real calendar month is known, uses the
 * seasonal estimate above; otherwise falls back to the SAME generic value
 * `START_BUCKET_OVERRIDE_MINUTES.sunset` already uses for day-start derivation, so a flexible-mode
 * plan never gets a fabricated season-specific number, only the existing, already-reviewed
 * generic evening floor.
 */
function minimumStartForPreferredTime(preferredTime: PreferredTime, month: number | null): number | null {
  if (preferredTime !== "sunset") return null;
  if (month && SEASONAL_SUNSET_MINUTES_BY_MONTH[month]) {
    return SEASONAL_SUNSET_MINUTES_BY_MONTH[month] - SUNSET_LEAD_MINUTES;
  }
  return START_BUCKET_OVERRIDE_MINUTES.sunset ?? null;
}

/** Small, conservative transition buffer applied once per leg -- exiting an attraction, finding
 * the station, minor delays. Deliberately flat and small (never compounded per stop count) per
 * this task's own "keep it conservative, do NOT inflate every leg excessively" instruction. */
export const INTER_STOP_BUFFER_MINUTES = 15;

/**
 * Bounded, NEVER-displayed-as-verified internal scheduling buffer, used ONLY when a leg's
 * transport is genuinely unresolved (see PlannerRouteLeg.sourceStatus === "unresolved") -- exists
 * purely so an unresolved leg doesn't collapse the next stop's time onto the previous one's exact
 * end time. This number is NEVER read by any UI as a transport duration; the transport connector
 * keeps showing its existing honest "شوف التنقل على الخرائط" state regardless of this value. Its
 * only effect is advancing the internal clock, and it always marks the day `approximate`.
 */
export const UNRESOLVED_LEG_INTERNAL_BUFFER_MINUTES = 20;

/** All customer-facing times round UP to this boundary -- one consistent policy (this task's own
 * section 17), chosen over 5/10 min as the least falsely-precise while staying useful. */
export const TIME_ROUNDING_MINUTES = 15;

/**
 * Timeline Final Customer-Experience Polish -- a gap between two consecutive scheduled entries
 * at or above this size is genuinely large enough to call out as "free time" rather than a
 * normal transition. Matches the >180min bar this task's own audit was framed around -- smaller,
 * completely normal gaps (a short rest, a bit of slack before the next stop) stay silent so the
 * timeline doesn't clutter every day with a block for a routine 90-minute gap.
 */
export const FREE_TIME_GAP_THRESHOLD_MINUTES = 180;

/**
 * Meal durations are a scheduling ESTIMATE, not Guide data -- no `foodPlaces` record carries a
 * "how long does a meal take" field (real Guide `visitDurationMinutes` only exists for main-stop
 * attractions/experiences/shopping areas). Conservative, typical values, clearly isolated here
 * so they're never confused with verified data.
 */
const MEAL_ASSUMED_DURATION_MINUTES: Record<MealType, number> = { breakfast: 45, lunch: 75, tapas: 90, dinner: 90 };

/**
 * Preferred scheduling window per meal type -- `earliest`/`latest` are soft targets (the real
 * day's own pace always wins if it runs later; a meal is never scheduled BEFORE the previous
 * stop realistically ends), `representative` is the single point-in-time used to check a
 * candidate's real hours both at meal-stop SELECTION time (barcelonaV2MealStops.ts) and here at
 * placement time, so the same real-hours judgment is used consistently in both places.
 */
export const MEAL_TARGET_WINDOW: Record<MealType, { earliest: number; latest: number; representative: number }> = {
  breakfast: { earliest: 8 * 60, latest: 9 * 60 + 30, representative: 8 * 60 + 30 },
  lunch: { earliest: 12 * 60 + 30, latest: 14 * 60 + 30, representative: 13 * 60 },
  tapas: { earliest: 19 * 60, latest: 21 * 60, representative: 19 * 60 + 30 },
  dinner: { earliest: 20 * 60, latest: 22 * 60, representative: 20 * 60 + 30 },
};

// ── Hours-window helpers (shared by meal-stop selection AND timeline placement) ────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const ALL_WEEKDAYS: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function intervalsEqual(a: { open: string; close: string }[] = [], b: { open: string; close: string }[] = []): boolean {
  if (a.length !== b.length) return false;
  return a.every((iv, i) => iv.open === b[i].open && iv.close === b[i].close);
}

/**
 * When the real calendar weekday isn't known (flexible/undated plan) but the place's `type:
 * "fixed"` schedule happens to be IDENTICAL on every single weekday (a common case for a major
 * attraction with no weekly closure -- e.g. Sagrada Família's own 09:00 daily opening), using
 * that schedule isn't "pretending to know the weekday" -- the schedule doesn't depend on it. This
 * returns an arbitrary stand-in weekday in that one safe case, or `null` otherwise (including
 * every case where the schedule genuinely varies by weekday, which would be an unsafe guess).
 * `approximate` on the resulting window still stays `true` when the real weekday is unknown --
 * this only improves the STARTING TIME chosen, never the honesty label shown to the customer
 * (see this task's own section 14: a flexible plan's timing is always "قد تحتاج تعديل").
 */
function resolveEffectiveWeekday(hours: HoursInfo | undefined, weekday: Weekday | null): Weekday | null {
  if (weekday) return weekday;
  if (!hours || hours.type !== "fixed") return null;
  const [first, ...rest] = ALL_WEEKDAYS.map((day) => hours.schedule[day] ?? []);
  return rest.every((intervals) => intervalsEqual(first, intervals)) ? "monday" : null;
}

/**
 * Returns the real {open, close} interval (in minutes-since-midnight, `close` possibly >= 24*60
 * for an overnight interval) that COVERS `minutes` on `weekday`, or `null` when no interval
 * covers it (including every case where hours aren't a verified `type: "fixed"` schedule, or the
 * weekday itself isn't known AND the schedule varies by weekday -- callers treat `null` as "not
 * verifiable", never as "closed"). See `resolveEffectiveWeekday` for the one safe flexible-mode
 * exception (a day-invariant fixed schedule).
 */
export function findCoveringInterval(hours: HoursInfo | undefined, weekday: Weekday | null, minutes: number): { open: number; close: number } | null {
  const effectiveWeekday = resolveEffectiveWeekday(hours, weekday);
  if (!hours || hours.type !== "fixed" || !effectiveWeekday) return null;
  const intervals = hours.schedule[effectiveWeekday] ?? [];
  for (const interval of intervals) {
    const open = timeToMinutes(interval.open);
    let close = timeToMinutes(interval.close);
    if (close <= open) close += 24 * 60; // crosses midnight
    if (minutes >= open && minutes < close) return { open, close };
  }
  return null;
}

/**
 * Returns the opening time (minutes-since-midnight) of the earliest interval on `weekday` that
 * starts at or after `minutes`, or `null` when no such interval exists (hours not verified/fixed,
 * weekday unknown with a weekday-varying schedule, or every interval today already ended before
 * `minutes`).
 */
export function findNextOpeningOnOrAfter(hours: HoursInfo | undefined, weekday: Weekday | null, minutes: number): number | null {
  const effectiveWeekday = resolveEffectiveWeekday(hours, weekday);
  if (!hours || hours.type !== "fixed" || !effectiveWeekday) return null;
  const intervals = hours.schedule[effectiveWeekday] ?? [];
  const opens = intervals.map((interval) => timeToMinutes(interval.open)).filter((open) => open >= minutes);
  if (opens.length === 0) return null;
  return Math.min(...opens);
}

/**
 * Whether a real `type: "fixed"` schedule on `weekday` covers the meal type's own representative
 * check-time (see MEAL_TARGET_WINDOW) -- used by barcelonaV2MealStops.ts to skip a candidate
 * whose real hours plainly don't support this meal type (e.g. a lunch-only bar considered for a
 * dinner slot), so a genuinely closed-at-that-time venue is never selected in the first place.
 * Returns `true` (never excludes) when hours aren't verified/fixed or the weekday is unknown --
 * exactly the same "absence of proof is not proof of closure" rule used everywhere else in this
 * project.
 */
export function isLikelyOpenForMealType(hours: HoursInfo | undefined, weekday: Weekday | null, mealType: MealType): boolean {
  if (!hours || hours.type !== "fixed" || !weekday) return true;
  return findCoveringInterval(hours, weekday, MEAL_TARGET_WINDOW[mealType].representative) !== null;
}

/**
 * Round 3A Exact-Date Hours Safety Fix -- the LATEST real closing time (minutes-since-midnight,
 * possibly >= 24*60 for an overnight interval) across every interval on `weekday`, or `null`
 * when not verifiable (same "not verifiable, never treated as closed" rule as every other helper
 * in this file). Used only by `fitWindow`'s own no-usable-interval fallback (see its own comment)
 * to cap a displayed window at the real end of the day's schedule instead of floating an
 * arbitrary, valid-looking clock time past real closing.
 */
function findLastClosingMinutesForWeekday(hours: HoursInfo | undefined, weekday: Weekday | null): number | null {
  const effectiveWeekday = resolveEffectiveWeekday(hours, weekday);
  if (!hours || hours.type !== "fixed" || !effectiveWeekday) return null;
  const intervals = hours.schedule[effectiveWeekday] ?? [];
  if (intervals.length === 0) return null;
  const closes = intervals.map((interval) => {
    const open = timeToMinutes(interval.open);
    let close = timeToMinutes(interval.close);
    if (close <= open) close += 24 * 60;
    return close;
  });
  return Math.max(...closes);
}

function roundUpToBoundary(minutes: number, boundary: number = TIME_ROUNDING_MINUTES): number {
  return Math.ceil(minutes / boundary) * boundary;
}

/**
 * Schedule Quality Audit fix: derives the day's start from the EARLIEST-appropriate bucket
 * across ALL of the day's stops, never just `stops[0]`'s own bucket. Route Optimizer/Cross-Day
 * Optimization order stops for GEOGRAPHIC efficiency, not time-of-day semantics (out of this
 * file's scope to change -- see this task's own "do not rebuild Day Builder" instruction), so an
 * evening-flavored stop (e.g. a flamenco show) can legitimately land at position 0 of a day that
 * is otherwise a normal daytime day. Trusting only `stops[0]` pushed the WHOLE day to a 16:00
 * start in exactly that measured case, scheduling the day's real daytime/sunset stops at 21:00+
 * and a following meal well past midnight -- a genuine timeline bug, fixed here (not by touching
 * stop order). A day only starts late when EVERY stop on it is late-appropriate.
 */
function deriveDayStartMinutes(preferredTimes: PreferredTime[]): number {
  if (preferredTimes.length === 0) return DEFAULT_DAY_START_MINUTES;
  return Math.min(...preferredTimes.map((preferredTime) => START_BUCKET_OVERRIDE_MINUTES[preferredTime] ?? DEFAULT_DAY_START_MINUTES));
}

/**
 * Fits one stop/meal's placement against its real hours (if verifiable), returning the actual
 * {start, end, approximate} to use. `earliestStart` is the clock position the day has already
 * reached (never scheduled earlier than this). Shared by both main stops and meal placement.
 */
function fitWindow(earliestStart: number, durationMinutes: number, hours: HoursInfo | undefined, weekday: Weekday | null): TimelineWindow {
  let start = roundUpToBoundary(earliestStart);
  // Customer-facing honesty flag: true whenever the real calendar weekday isn't known, even if
  // the hours math below still manages to use a day-invariant fixed schedule internally (see
  // resolveEffectiveWeekday's own doc comment) -- flexible-mode timing is always "قد تحتاج
  // تعديل" per this task's own section 14, regardless of how good the underlying data is.
  let approximate = !weekday || !hours || hours.type !== "fixed";
  // Whether real hours math can be attempted at all -- unlike `approximate` above, this DOES
  // allow the day-invariant flexible-mode exception.
  const canUseHours = !!hours && hours.type === "fixed" && resolveEffectiveWeekday(hours, weekday) !== null;

  if (canUseHours) {
    let covering = findCoveringInterval(hours, weekday, start);
    if (!covering) {
      const nextOpen = findNextOpeningOnOrAfter(hours, weekday, start);
      if (nextOpen !== null) {
        start = roundUpToBoundary(nextOpen);
        // Round 3A Bug A fix: previously this branch returned `start + durationMinutes` as the
        // end time WITHOUT ever checking it against the interval it just bumped into -- a visit
        // longer than that interval could run past real closing while still being marked
        // `approximate: false` (false-confidence overrun). Re-resolving the covering interval at
        // the bumped `start` (guaranteed to find it, since `start` now sits exactly at that
        // interval's own opening boundary or later within it) lets the SAME truncation check
        // below run for this case too, instead of duplicating it.
        covering = findCoveringInterval(hours, weekday, start);
      }
    }
    if (covering) {
      let end = start + durationMinutes;
      if (end > covering.close) {
        // Real closing time can't accommodate the full visit from this arrival -- cap the
        // displayed end at the verified close time (never an impossible past-closing range) and
        // flag it so the day-level "الوقت تقريبي" note covers this instead of a false precise claim.
        end = covering.close;
        approximate = true;
      }
      return { startMinutes: start, endMinutes: end, approximate };
    }
    // Round 3A Bug B fix: verified fixed hours exist for this weekday, but nothing covers OR
    // follows `start` today (arriving after the last interval already closed, or rounding pushed
    // past a very short final interval). Previously this fell through to the final fallback below
    // and returned `start + durationMinutes` starting at whatever the accumulated clock already
    // was -- a plausible-looking full-duration visit that could sit hours past real closing,
    // weakly flagged only by the generic day-level "approximate" footnote. Never fabricate that:
    // cap the window at the day's own real last closing time instead, so it reads as "no real
    // time was actually available" rather than a normal slot.
    const lastClose = findLastClosingMinutesForWeekday(hours, weekday);
    if (lastClose !== null) {
      return { startMinutes: Math.min(start, lastClose), endMinutes: lastClose, approximate: true };
    }
    approximate = true;
  }

  return { startMinutes: start, endMinutes: start + durationMinutes, approximate: true };
}

function transportAdvance(leg: PlannerRouteLeg | undefined): { minutes: number; approximate: boolean } {
  if (leg && leg.sourceStatus !== "unresolved" && leg.recommendedMode) {
    const option = leg.options.find((o) => o.mode === leg.recommendedMode);
    if (option) {
      const travelMinutes = Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2);
      return { minutes: travelMinutes + INTER_STOP_BUFFER_MINUTES, approximate: false };
    }
  }
  // Unresolved/no real data -- internal-only buffer, never shown as a transport duration (see
  // UNRESOLVED_LEG_INTERNAL_BUFFER_MINUTES's own doc comment).
  return { minutes: UNRESOLVED_LEG_INTERNAL_BUFFER_MINUTES, approximate: true };
}

/**
 * Finds every gap of at least FREE_TIME_GAP_THRESHOLD_MINUTES between two consecutive scheduled
 * entries (stops + meals, in chronological order) -- see FreeTimeBlock's own doc comment. Purely
 * a read of the already-computed windows; never influences scheduling itself.
 */
function computeFreeTimeBlocks(stopWindows: TimelineStopWindow[], mealWindows: TimelineMealWindow[]): FreeTimeBlock[] {
  const all = [...stopWindows, ...mealWindows].sort((a, b) => a.startMinutes - b.startMinutes);
  const blocks: FreeTimeBlock[] = [];
  for (let i = 0; i < all.length - 1; i++) {
    const gap = all[i + 1].startMinutes - all[i].endMinutes;
    if (gap >= FREE_TIME_GAP_THRESHOLD_MINUTES) {
      blocks.push({ startMinutes: all[i].endMinutes, endMinutes: all[i + 1].startMinutes });
    }
  }
  return blocks;
}

/**
 * Builds one day's real clock timeline from its ALREADY-FINAL stop list, route legs, and meal
 * stops. Never reorders or drops anything -- `stops`/`meals` are placed in the exact order/
 * structure the caller already decided (see this file's own header comment).
 */
export function buildBarcelonaDayTimeline(stops: TimelineStopInput[], legs: PlannerRouteLeg[], meals: TimelineMealInput[], weekday: Weekday | null, month: number | null = null): DayTimeline {
  if (stops.length === 0) {
    return { dayStartMinutes: DEFAULT_DAY_START_MINUTES, dayEndMinutes: DEFAULT_DAY_START_MINUTES, stops: [], meals: [], approximate: true, freeTimeBlocks: [] };
  }

  let clock = deriveDayStartMinutes(stops.map((s) => s.preferredTime));
  let anyApproximate = false;
  let dayStartMinutes = clock;

  const stopWindows: TimelineStopWindow[] = [];
  const mealWindows: TimelineMealWindow[] = [];

  // Redesign Food Stops + Timeline UI: breakfast (afterStopIndex === -1) is scheduled BEFORE the
  // day's first stop, using its own real morning target window -- never the day-start bucket
  // used for sightseeing. When present, it genuinely becomes the day's earliest activity; the
  // first stop's own arrival time still respects its own opening hours via the normal fitWindow
  // call below (breakfast only ever pushes things later via the buffer, never earlier).
  const breakfast = meals.find((m) => m.afterStopIndex === -1);
  if (breakfast) {
    const target = MEAL_TARGET_WINDOW.breakfast;
    const breakfastWindow = fitWindow(target.earliest, MEAL_ASSUMED_DURATION_MINUTES.breakfast, breakfast.hours, weekday);
    mealWindows.push({ placeId: breakfast.placeId, mealType: "breakfast", afterStopIndex: -1, ...breakfastWindow });
    if (breakfastWindow.approximate) anyApproximate = true;
    dayStartMinutes = breakfastWindow.startMinutes;
    clock = Math.max(clock, breakfastWindow.endMinutes + INTER_STOP_BUFFER_MINUTES);
  }

  stops.forEach((stop, index) => {
    const sunsetFloor = minimumStartForPreferredTime(stop.preferredTime, month);
    const earliestStart = sunsetFloor !== null ? Math.max(clock, sunsetFloor) : clock;
    const window = fitWindow(earliestStart, stop.visitDurationMinutes, stop.hours, weekday);
    stopWindows.push({ placeId: stop.placeId, ...window });
    if (window.approximate) anyApproximate = true;
    // Round 3C.1 Day-Start Truth Rule: with no breakfast claiming the day-start slot, the
    // customer-facing "ابدأ يومك" banner must reflect THIS stop's own real resolved start --
    // never the generic preferredTime-bucket guess computed before hours/sunset-floor
    // resolution ran. Never overrides breakfast's own real window (set above, already correct).
    // Purely a reporting fix -- `clock` (the value that actually drives every later placement)
    // is untouched, so the rest of the schedule cannot change.
    if (index === 0 && !breakfast) dayStartMinutes = window.startMinutes;
    clock = window.endMinutes;

    for (const meal of meals.filter((m) => m.afterStopIndex === index)) {
      const target = MEAL_TARGET_WINDOW[meal.mealType];
      const earliestStart = Math.max(clock + INTER_STOP_BUFFER_MINUTES, target.earliest);
      const mealWindow = fitWindow(earliestStart, MEAL_ASSUMED_DURATION_MINUTES[meal.mealType], meal.hours, weekday);
      mealWindows.push({ placeId: meal.placeId, mealType: meal.mealType, afterStopIndex: meal.afterStopIndex, ...mealWindow });
      if (mealWindow.approximate) anyApproximate = true;
      clock = mealWindow.endMinutes;
    }

    if (index < stops.length - 1) {
      const leg = legs[index];
      const advance = transportAdvance(leg);
      if (advance.approximate) anyApproximate = true;
      clock += advance.minutes;
    }
  });

  return {
    dayStartMinutes,
    dayEndMinutes: clock,
    stops: stopWindows,
    meals: mealWindows,
    approximate: anyApproximate,
    freeTimeBlocks: computeFreeTimeBlocks(stopWindows, mealWindows),
  };
}

/** Formats minutes-since-midnight as "HH:MM", wrapping a value past 24:00 back into 00:00+. */
export function formatTimelineClock(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

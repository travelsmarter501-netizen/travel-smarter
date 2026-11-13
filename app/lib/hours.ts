/**
 * Structured opening-hours system, destination-agnostic (reused for Barcelona today,
 * Dubai/Miami/etc. later — pass a different IANA `timeZone` per destination).
 *
 * Design: only `type: "fixed"` carries a real per-weekday schedule and therefore gets
 * "today's hours" + a weekly dropdown + a live open/closed badge. The other types
 * ("variable", "event", "always-open") are honest fallbacks for places where a precise
 * weekly schedule can't be reliably verified — never guess a fake schedule into existence.
 */

export type Weekday = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export const ORDERED_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const WEEKDAY_LABELS_AR: Record<Weekday, string> = {
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
  sunday: "الأحد",
};

/** "HH:MM" 24h, Western digits. `close` earlier than or equal to `open` means the interval crosses midnight. */
export type TimeRange = { open: string; close: string };

/** Missing day or an empty array both mean closed that day. */
export type WeeklySchedule = Partial<Record<Weekday, TimeRange[]>>;

export type SeasonalPeriod = {
  /** Numeric month range, e.g. "11–2" or "3–10" — never month names. */
  monthRange: string;
  display: string;
};

/**
 * Structured planning data for a place whose hours change by season (multi-city planner; Barcelona entries do not use it).
 * `from` / `to` are "MM-DD", inclusive, and may wrap the year end (e.g. 11-01 .. 03-31). The periods of one place must cover
 * every day of the year without gaps.
 */
export type SeasonalSchedule = { from: string; to: string; schedule: WeeklySchedule; lastEntry?: string };

/** A dated exception from the official source (closure or special hours), "YYYY-MM-DD", inclusive. */
export type HoursDateException = { from: string; to: string; closed?: true; hours?: TimeRange[]; lastEntry?: string; note?: string };

type HoursMeta = {
  /** Internal maintenance metadata — never rendered to the customer. */
  source?: string;
  sourceUrl?: string;
  lastVerified?: string;
  /** Internal: where sources disagree, what each says and which value is stored. Never rendered. */
  conflict?: string;
  /** Planner: dated closures / special hours from the official source, applied only to trips that include those dates. */
  dateExceptions?: HoursDateException[];
};

export type HoursInfo =
  | ({
      type: "fixed";
      schedule: WeeklySchedule;
      /** Planner: latest start of a visit ("HH:MM"), when the source publishes one. */
      lastEntry?: string;
      /** Planner, set per trip only: the schedule to plan against when it differs from `schedule` (see tripHours.ts). */
      planningSchedule?: WeeklySchedule;
    } & HoursMeta)
  | ({
      type: "variable";
      display: string;
      seasons?: SeasonalPeriod[];
      /** Planner: the same hours as `display`, structured by season, so the engine can check opening and closing times. */
      seasonalSchedules?: SeasonalSchedule[];
      /**
       * Planner, set per trip only (never stored in place data): the schedule that applies to THIS trip's dates (the
       * narrowest window of the seasons the trip touches; every season for a plan without dates), with dated exceptions
       * applied. The customer still sees `display`; the engine plans against this.
       */
      planningSchedule?: WeeklySchedule;
      planningLastEntry?: string;
      /**
       * Planner, dated trips only: on these weekdays a visit is planned to start no earlier than this time ("HH:MM"), because
       * a part of the place opens later that day (Prague Castle: St. Vitus Cathedral opens to visitors at 12:00 on Sunday).
       * The customer still sees `display`; plans without dates are not affected.
       */
      planningOpenFrom?: Partial<Record<Weekday, string>>;
      /**
       * Operational Hours Integrity Audit: a narrow, OPTIONAL, purely additive escape hatch for
       * the specific case where a place's exact opening/closing TIMES genuinely vary (so it
       * can't honestly be modeled as `type: "fixed"`) but the project already has verified,
       * documented evidence that it is closed on one or more full weekdays every week,
       * regardless of season (e.g. a museum whose seasons both say "Tuesday-Saturday /
       * Sunday, closed Monday" -- only the closing TIME differs by season, never the
       * Monday closure itself). Omitted (the default, and every pre-existing `variable` entry's
       * behavior): date-eligibility treats the place as never weekday-closed, exactly as before
       * this field existed. Never inferred/guessed -- only ever set from a closure already
       * spelled out in this same entry's own `display`/`seasons` text. Rendering
       * (OpeningHours.tsx) intentionally does NOT read this field, so it never changes what a
       * customer sees on the Guide page -- it exists solely for `barcelonaV2DateEligibility.ts`'s
       * hard-exclusion check, which is the only real defect this field fixes.
       */
      closedWeekdays?: Weekday[];
    } & HoursMeta)
  | ({ type: "event"; display?: string } & HoursMeta)
  | ({ type: "always-open" } & HoursMeta)
  | ({ type: "temporarily-closed"; display?: string } & HoursMeta);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Formats one day's intervals compactly: "مغلق" / "09:00–20:00" / "13:00–16:00 · 19:30–23:30". */
export function formatIntervals(intervals: TimeRange[] | undefined): string {
  if (!intervals || intervals.length === 0) return "مغلق";
  return intervals.map((iv) => `${iv.open}–${iv.close}`).join(" · ");
}

function prevWeekday(day: Weekday): Weekday {
  const i = ORDERED_WEEKDAYS.indexOf(day);
  return ORDERED_WEEKDAYS[(i + 6) % 7];
}

/** Current weekday + minutes-since-midnight in the given IANA timezone (defaults to Barcelona). */
export function getNowInTimeZone(timeZone: string = "Europe/Madrid"): { weekday: Weekday; minutes: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const shortToWeekday: Record<string, Weekday> = {
    Sun: "sunday",
    Mon: "monday",
    Tue: "tuesday",
    Wed: "wednesday",
    Thu: "thursday",
    Fri: "friday",
    Sat: "saturday",
  };

  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  let hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  if (hour === 24) hour = 0; // some environments render midnight as "24" with hour12:false

  return { weekday: shortToWeekday[weekdayShort] ?? "monday", minutes: hour * 60 + minute };
}

function intervalCoversNow(interval: TimeRange, nowMinutes: number, belongsToToday: boolean): boolean {
  const open = timeToMinutes(interval.open);
  const close = timeToMinutes(interval.close);
  if (close > open) {
    // Same-day interval.
    return belongsToToday && nowMinutes >= open && nowMinutes < close;
  }
  // Crosses midnight: the interval "belongs" to the day it opens on.
  return belongsToToday ? nowMinutes >= open : nowMinutes < close;
}

/** True if `schedule` has an open interval covering right now, correctly handling overnight intervals. */
export function isOpenNow(schedule: WeeklySchedule, timeZone: string = "Europe/Madrid"): boolean {
  const now = getNowInTimeZone(timeZone);
  const today = schedule[now.weekday] ?? [];
  const yesterday = schedule[prevWeekday(now.weekday)] ?? [];
  return today.some((iv) => intervalCoversNow(iv, now.minutes, true)) || yesterday.some((iv) => intervalCoversNow(iv, now.minutes, false));
}

/**
 * Planner: the hours the engine should plan against. A seasonal ("variable") place that carries a per-trip `planningSchedule`
 * is planned as a fixed schedule (opening / closing / last entry checked); everything else is returned unchanged, so places
 * without structured seasons (every Barcelona entry) behave exactly as before.
 */
// The result depends only on the (never mutated) input object, and is only read: kept per input, so the same place is not re-resolved on
// every timeline check.
const PLANNING_HOURS_OF = new WeakMap<object, HoursInfo>();
export function planningHoursOf(hours: HoursInfo | undefined): HoursInfo | undefined {
  if (hours && (hours.type === "fixed" || hours.type === "variable") && hours.planningSchedule) {
    const cached = PLANNING_HOURS_OF.get(hours);
    if (cached) return cached;
    const resolved = resolvePlanningHours(hours);
    PLANNING_HOURS_OF.set(hours, resolved);
    return resolved;
  }
  return hours;
}

function resolvePlanningHours(hours: HoursInfo): HoursInfo {
  if (hours && hours.type === "fixed" && hours.planningSchedule) return { ...hours, schedule: hours.planningSchedule };
  if (hours && hours.type === "variable" && hours.planningSchedule) {
    return {
      type: "fixed",
      schedule: hours.planningSchedule,
      ...(hours.planningLastEntry ? { lastEntry: hours.planningLastEntry } : {}),
      source: hours.source,
      sourceUrl: hours.sourceUrl,
      lastVerified: hours.lastVerified,
    };
  }
  return hours;
}

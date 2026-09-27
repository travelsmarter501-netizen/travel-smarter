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

type HoursMeta = {
  /** Internal maintenance metadata — never rendered to the customer. */
  source?: string;
  sourceUrl?: string;
  lastVerified?: string;
};

export type HoursInfo =
  | ({ type: "fixed"; schedule: WeeklySchedule } & HoursMeta)
  | ({
      type: "variable";
      display: string;
      seasons?: SeasonalPeriod[];
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

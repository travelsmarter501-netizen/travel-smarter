import type { HoursDateException, HoursInfo, RecurringMonthlyClosure, SeasonalSchedule, TimeRange, Weekday, WeeklySchedule } from "../hours";
import { addDaysToIsoDate, inclusiveDayCount, weekdayOfIsoDate } from "./dateOnly";
import type { CityPlaceData } from "./cityPlannerModule";

/**
 * Multi-city planner: the hours that apply to ONE trip. A city whose places carry structured seasons
 * (`seasonalSchedules`) or dated exceptions (`dateExceptions`, e.g. a one-week closure, a holiday with short hours)
 * resolves them here before the engine runs, so opening / closing times and closures are checked like any fixed
 * schedule:
 *   - dated trip: for each weekday, the narrowest window of the seasons that the trip's days on that weekday fall in;
 *     then every dated exception that touches a trip day is applied to that weekday (closed, or the intersection with
 *     the special hours). Conservative: if a weekday occurs twice in a trip and only one of those dates is a closure,
 *     the weekday is treated as closed for the whole trip.
 *   - plan without dates: for each weekday, the narrowest window across the seasons in which the place is open that
 *     weekday (dated exceptions cannot apply; seasonal closures stay in the place's own note), then the window shared by
 *     every open day (see sameEveryDay), because the weekday is unknown. This applies to fixed schedules too.
 * The customer still sees each place's own text (`display`); only the planning copy changes. Places without seasons or
 * exceptions are returned as the very same objects.
 */

const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Interval in minutes; a close at or before the open crosses midnight. */
function span(range: TimeRange): [number, number] {
  const open = toMinutes(range.open);
  let close = toMinutes(range.close);
  if (close <= open) close += 1440;
  return [open, close];
}

export function intersectRanges(a: readonly TimeRange[] = [], b: readonly TimeRange[] = []): TimeRange[] {
  const out: TimeRange[] = [];
  for (const x of a) {
    const [ao, ac] = span(x);
    for (const y of b) {
      const [bo, bc] = span(y);
      const open = Math.max(ao, bo);
      const close = Math.min(ac, bc);
      if (close > open) out.push({ open: toTime(open), close: toTime(close) });
    }
  }
  return out.sort((p, q) => toMinutes(p.open) - toMinutes(q.open));
}

function intersectSchedules(schedules: readonly WeeklySchedule[], weekday: Weekday): TimeRange[] {
  if (schedules.length === 0) return [];
  return schedules.slice(1).reduce<TimeRange[]>((acc, schedule) => intersectRanges(acc, schedule[weekday] ?? []), [...(schedules[0][weekday] ?? [])]);
}

/**
 * Opt-in timetabled departures (hours.startsAtOpening): each interval is one departure, so periods are combined by keeping only the
 * departures that EVERY relevant period publishes (same start and end), never the overlap of two different departures.
 */
function commonDepartures(schedules: readonly WeeklySchedule[], weekday: Weekday): TimeRange[] {
  if (schedules.length === 0) return [];
  const [first, ...rest] = schedules.map((schedule) => schedule[weekday] ?? []);
  return first.filter((range) => rest.every((list) => list.some((other) => other.open === range.open && other.close === range.close)));
}

/**
 * Plans without dates cannot know the weekday, and the engine only checks a schedule that is the same every day. So the
 * planning copy becomes the narrowest window shared by all the days the place is open, on every day (customers still see
 * the real weekly table). Returns null when the schedule is already the same every day or never open.
 */
function sameEveryDay(schedule: WeeklySchedule): WeeklySchedule | null {
  const open = WEEKDAYS.filter((day) => (schedule[day] ?? []).length > 0);
  if (open.length === 0) return null;
  const keys = WEEKDAYS.map((day) => JSON.stringify(schedule[day] ?? []));
  if (keys.every((key) => key === keys[0])) return null;
  const shared = open.slice(1).reduce<TimeRange[]>((acc, day) => intersectRanges(acc, schedule[day] ?? []), [...(schedule[open[0]] ?? [])]);
  return Object.fromEntries(WEEKDAYS.map((day) => [day, shared])) as WeeklySchedule;
}

function earliest(times: (string | undefined)[]): string | undefined {
  const known = times.filter((t): t is string => !!t);
  if (known.length === 0) return undefined;
  return known.reduce((min, t) => (toMinutes(t) < toMinutes(min) ? t : min));
}

function monthDay(isoDate: string): string {
  return isoDate.slice(5, 10);
}

function inSeason(isoDate: string, season: SeasonalSchedule): boolean {
  const day = monthDay(isoDate);
  return season.from <= season.to ? day >= season.from && day <= season.to : day >= season.from || day <= season.to;
}

function exceptionCovers(isoDate: string, exception: HoursDateException): boolean {
  return isoDate >= exception.from && isoDate <= exception.to;
}

/** Every date of the trip, "YYYY-MM-DD"; null for a plan without dates. */
export function tripDates(arrivalDate: string | null, departureDate: string | null): string[] | null {
  if (!arrivalDate || !departureDate) return null;
  const count = inclusiveDayCount(arrivalDate, departureDate);
  if (count === null || count < 1) return null;
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const iso = addDaysToIsoDate(arrivalDate, i);
    if (iso) dates.push(iso);
  }
  return dates;
}

/** Whether a date is the n-th given weekday of its month (opt-in recurring closures). */
function isNthWeekdayOfMonth(isoDate: string, rule: RecurringMonthlyClosure): boolean {
  return weekdayOfIsoDate(isoDate) === rule.weekday && Math.floor((Number(isoDate.slice(8, 10)) - 1) / 7) + 1 === rule.nth;
}

/** Opt-in monthly closure rules, as dated closures for the trip's own dates only. */
function recurringAsExceptions(rules: readonly RecurringMonthlyClosure[] | undefined, dates: readonly string[]): HoursDateException[] {
  if (!rules?.length) return [];
  return dates.filter((date) => rules.some((rule) => isNthWeekdayOfMonth(date, rule))).map((date) => ({ from: date, to: date, closed: true as const }));
}

function applyExceptions(schedule: WeeklySchedule, lastEntry: string | undefined, exceptions: readonly HoursDateException[] | undefined, dates: readonly string[]) {
  let changed = false;
  let entry = lastEntry;
  const result: WeeklySchedule = { ...schedule };
  // Opt-in `override` (replaces the weekday's hours): only when EVERY trip date on that weekday is covered by an override exception, so a
  // normally closed weekday is never opened for a date the exception does not cover. Without `override` nothing below changes.
  const overridesOn = (weekday: Weekday) =>
    dates.filter((date) => weekdayOfIsoDate(date) === weekday).map((date) => (exceptions ?? []).find((e) => e.override && e.hours && exceptionCovers(date, e)));
  for (const date of dates) {
    const weekday = weekdayOfIsoDate(date);
    if (!weekday) continue;
    for (const exception of exceptions ?? []) {
      if (!exceptionCovers(date, exception)) continue;
      changed = true;
      if (exception.closed) result[weekday] = [];
      else if (exception.override && exception.hours) {
        const all = overridesOn(weekday);
        result[weekday] = all.every((e) => !!e)
          ? all.slice(1).reduce<TimeRange[]>((acc, e) => intersectRanges(acc, e!.hours), [...(all[0]!.hours ?? [])])
          : intersectRanges(result[weekday] ?? [], exception.hours);
      } else if (exception.hours) result[weekday] = intersectRanges(result[weekday] ?? [], exception.hours);
      if (exception.lastEntry) entry = earliest([entry, exception.lastEntry]);
    }
  }
  // With overrides present, a closure on the same weekday still wins whatever the order of the dates (conservative).
  if ((exceptions ?? []).some((e) => e.override)) {
    for (const date of dates) {
      const weekday = weekdayOfIsoDate(date);
      if (weekday && (exceptions ?? []).some((e) => e.closed && exceptionCovers(date, e))) result[weekday] = [];
    }
  }
  return { schedule: result, lastEntry: entry, changed };
}

export function resolveHoursForTrip(hours: HoursInfo | undefined, dates: readonly string[] | null): HoursInfo | undefined {
  if (!hours) return hours;

  if (hours.type === "fixed") {
    if (!dates) {
      // A narrower planning window stored with the place (e.g. a restaurant's last reservation) is kept.
      const planningSchedule = sameEveryDay(hours.planningSchedule ?? hours.schedule);
      return planningSchedule ? { ...hours, planningSchedule } : hours;
    }
    const exceptions = hours.recurringClosures?.length ? [...(hours.dateExceptions ?? []), ...recurringAsExceptions(hours.recurringClosures, dates)] : hours.dateExceptions;
    if (!exceptions?.length) return hours;
    const applied = applyExceptions(hours.schedule, hours.lastEntry, exceptions, dates);
    if (!applied.changed) return hours;
    return { ...hours, schedule: applied.schedule, ...(applied.lastEntry ? { lastEntry: applied.lastEntry } : {}) };
  }

  if (hours.type === "variable" && hours.seasonalSchedules?.length) {
    // Opt-in timetabled departures without a date: no departure is known (a time shared by every published period says nothing
    // about an unknown date or year), so nothing can be planned on the clock.
    if (!dates && hours.startsAtOpening) return { ...hours, planningSchedule: {} };
    const seasons = hours.seasonalSchedules;
    const schedule: WeeklySchedule = {};
    const used = new Set<SeasonalSchedule>();
    for (const weekday of WEEKDAYS) {
      let relevant: SeasonalSchedule[];
      if (dates) {
        const onWeekday = dates.filter((date) => weekdayOfIsoDate(date) === weekday);
        const pool = onWeekday.length > 0 ? onWeekday : dates;
        relevant = seasons.filter((season) => pool.some((date) => inSeason(date, season)));
        if (relevant.length === 0) relevant = [...seasons]; // a gap in the seasons: plan conservatively
      } else {
        // No dates: the narrowest window of the seasons in which the place is open that weekday. A season in which it is
        // closed (e.g. a river cruise in winter) is left to the place's own seasonal note, so the place is not treated as
        // closed all year.
        relevant = seasons.filter((season) => (season.schedule[weekday] ?? []).length > 0);
      }
      relevant.forEach((season) => used.add(season));
      schedule[weekday] = hours.startsAtOpening
        ? commonDepartures(relevant.map((season) => season.schedule), weekday)
        : intersectSchedules(relevant.map((season) => season.schedule), weekday);
    }
    let lastEntry = earliest([...used].map((season) => season.lastEntry));
    let planningSchedule = schedule;
    const exceptions = dates && hours.recurringClosures?.length ? [...(hours.dateExceptions ?? []), ...recurringAsExceptions(hours.recurringClosures, dates)] : hours.dateExceptions;
    if (dates && exceptions?.length) {
      const applied = applyExceptions(schedule, lastEntry, exceptions, dates);
      planningSchedule = applied.schedule;
      lastEntry = applied.lastEntry;
    }
    if (dates && hours.planningOpenFrom) {
      const narrowed: WeeklySchedule = { ...planningSchedule };
      for (const [weekday, from] of Object.entries(hours.planningOpenFrom) as [Weekday, string][]) {
        if (dates.some((date) => weekdayOfIsoDate(date) === weekday)) narrowed[weekday] = intersectRanges(narrowed[weekday] ?? [], [{ open: from, close: "23:59" }]);
      }
      planningSchedule = narrowed;
    }
    if (!dates) planningSchedule = sameEveryDay(planningSchedule) ?? planningSchedule;
    return { ...hours, planningSchedule, ...(lastEntry ? { planningLastEntry: lastEntry } : {}) };
  }

  return hours;
}

function mapHours<T extends { hours?: HoursInfo }>(items: readonly T[], dates: readonly string[] | null): T[] {
  return items.map((item) => {
    const resolved = resolveHoursForTrip(item.hours, dates);
    return resolved === item.hours ? item : { ...item, hours: resolved };
  });
}

/** The city's place data with every place's hours resolved for this trip (see the file comment). */
export function resolvePlacesForTrip(places: CityPlaceData, dates: readonly string[] | null): CityPlaceData {
  return {
    ...places,
    attractions: mapHours(places.attractions, dates),
    experiences: mapHours(places.experiences, dates),
    foodPlaces: mapHours(places.foodPlaces, dates),
    nightlifeVenues: mapHours(places.nightlifeVenues, dates),
    shoppingAreas: mapHours(places.shoppingAreas as (CityPlaceData["shoppingAreas"][number] & { hours?: HoursInfo })[], dates),
    ...(places.beaches ? { beaches: mapHours(places.beaches as (NonNullable<CityPlaceData["beaches"]>[number] & { hours?: HoursInfo })[], dates) } : {}),
  };
}

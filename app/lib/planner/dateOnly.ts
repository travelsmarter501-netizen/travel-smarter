import type { Weekday } from "../hours";

/**
 * Smart Planner V2 Phase 3A -- generic, destination-agnostic date-ONLY arithmetic. No
 * timezone-of-day concerns at all (never mixed with a destination's real IANA timezone, e.g.
 * hours.ts's "Europe/Madrid") -- these are pure CALENDAR-DATE questions ("what date is 3 days
 * after 2026-12-06", "what weekday is 2026-12-09"), answered by anchoring every calculation in
 * UTC only. This deliberately avoids `new Date(iso).getTime() + n * 86400000` style local-time
 * arithmetic, which can silently shift by an hour (or land on the wrong calendar day) across a
 * DST transition depending on the runtime's local timezone -- UTC has no DST, so anchoring here
 * makes that whole class of bug structurally impossible rather than just unlikely.
 *
 * Pure, side-effect-free, and safe to import from both client and server code (client-side use
 * is for instant UX preview only -- e.g. showing "5 أيام" as someone picks dates -- never as
 * the authoritative value sent to or trusted by the server; see the Server Action, which always
 * recomputes independently from the raw arrival/departure strings).
 */

export type IsoDateParts = { year: number; month: number; day: number };

/** Arabic month names, shared by any display code that needs a "14 سبتمبر"-style date --
 * kept here (not duplicated per-component) so Phase 5's plan-overview line and
 * SmartPlannerV2Day's per-day header always agree on the same names. */
export const ARABIC_MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAY_ORDER: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MS_PER_DAY = 86_400_000;

/**
 * Parses a strict "YYYY-MM-DD" string into real calendar-date parts. Rejects malformed
 * strings AND non-existent calendar dates (e.g. "2026-02-30", which JS's Date would otherwise
 * silently roll forward into March) via a round-trip check. Returns null for anything invalid
 * -- never a best-effort/lenient guess.
 */
export function parseIsoDate(iso: string): IsoDateParts | null {
  if (typeof iso !== "string" || !ISO_DATE_PATTERN.test(iso)) return null;

  const [yearStr, monthStr, dayStr] = iso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const utcMillis = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(utcMillis);
  if (roundTrip.getUTCFullYear() !== year || roundTrip.getUTCMonth() !== month - 1 || roundTrip.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
}

function toUtcMillis(parts: IsoDateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

function formatIsoDate(utcMillis: number): string {
  const d = new Date(utcMillis);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Adds `offsetDays` calendar days to a valid ISO date (UTC-anchored -- see file header).
 * Returns null if `iso` isn't a valid calendar date. */
export function addDaysToIsoDate(iso: string, offsetDays: number): string | null {
  const parts = parseIsoDate(iso);
  if (!parts) return null;
  return formatIsoDate(toUtcMillis(parts) + offsetDays * MS_PER_DAY);
}

/** The stable internal weekday key for a valid ISO date -- never localized display text.
 * Returns null if `iso` isn't a valid calendar date. */
export function weekdayOfIsoDate(iso: string): Weekday | null {
  const parts = parseIsoDate(iso);
  if (!parts) return null;
  const jsDay = new Date(toUtcMillis(parts)).getUTCDay(); // 0 = Sunday .. 6 = Saturday
  return WEEKDAY_ORDER[jsDay];
}

/**
 * Inclusive calendar-day count between two valid ISO dates -- same date counts as 1 day (see
 * the task's own worked examples: 2026-12-06 -> 2026-12-06 is 1 day; 2026-12-06 ->
 * 2026-12-10 is 5 days). Returns null if either date is invalid or departure precedes
 * arrival.
 */
export function inclusiveDayCount(arrivalIso: string, departureIso: string): number | null {
  const arrival = parseIsoDate(arrivalIso);
  const departure = parseIsoDate(departureIso);
  if (!arrival || !departure) return null;

  const diffDays = Math.round((toUtcMillis(departure) - toUtcMillis(arrival)) / MS_PER_DAY);
  if (diffDays < 0) return null;

  return diffDays + 1;
}

/** "14 سبتمبر" -- day + Arabic month name, no weekday/year. Returns null for an invalid date
 * rather than a partial/garbled string. */
export function formatArabicDayMonth(iso: string): string | null {
  const parts = parseIsoDate(iso);
  if (!parts) return null;
  const monthName = ARABIC_MONTH_NAMES[parts.month - 1] ?? "";
  return `${parts.day} ${monthName}`;
}

"use client";

import { useState } from "react";
import { IconChevronDown } from "../icons";
import { formatIntervals, getNowInTimeZone, isOpenNow, ORDERED_WEEKDAYS, WEEKDAY_LABELS_AR } from "../../lib/hours";
import type { HoursInfo, Weekday } from "../../lib/hours";

/**
 * Reusable opening-hours block for any real physical place, in any destination guide:
 * today's hours shown first (auto-detected, never hardcoded), an expandable weekly
 * schedule, and — only when the data is a real weekly schedule — a live "open/closed
 * now" badge. Reused across attractions, food, nightlife, and shopping cards.
 *
 * Planned-Date Hours Context Fix -- `plannedWeekday` (optional) is the itinerary day this card
 * is being viewed for (see PlaceDetailsSheet.tsx's own doc comment for the full call chain from
 * SmartPlannerV2Day.tsx). When set, this component shows that day's hours instead of today's,
 * and swaps the live "مفتوح الآن/مغلق الآن" badge (which has no honest meaning for a date that
 * isn't actually today) for a date-contextual "مفتوح/مغلق هذا اليوم" -- never a fabricated live
 * status. Omitted (Guide browsing outside a plan, V1's planner, a flexible/dateless plan, or an
 * old saved plan with no `weekday` field): behavior is 100% identical to before this prop
 * existed -- real "right now" hours/status, exactly as a Guide visitor browsing today expects.
 */
export default function OpeningHours({ hours, timeZone = "Europe/Madrid", plannedWeekday }: { hours?: HoursInfo; timeZone?: string; plannedWeekday?: Weekday }) {
  const [expanded, setExpanded] = useState(false);

  if (!hours) return null;

  if (hours.type === "always-open") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-700">
        <span>🕒</span>
        <span>مفتوح 24 ساعة</span>
      </p>
    );
  }

  if (hours.type === "event") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-700">
        <span>🕒</span>
        <span>{hours.display ?? "حسب الفعالية"}</span>
      </p>
    );
  }

  if (hours.type === "variable") {
    const hasSeasons = hours.seasons && hours.seasons.length > 0;
    if (!hasSeasons) {
      return (
        <p className="flex items-center gap-1.5 text-sm text-slate-700">
          <span>🕒</span>
          <span>{hours.display}</span>
        </p>
      );
    }
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label="عرض الساعات الموسمية"
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-start"
        >
          <span className="flex items-center gap-1.5 text-sm text-slate-700">
            <span>🕒</span>
            <span>{hours.display}</span>
          </span>
          <IconChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="mt-1 space-y-1 rounded-lg border border-slate-100 p-2 text-xs">
            {hours.seasons!.map((season) => (
              <div key={season.monthRange} className="flex items-center justify-between px-1 py-0.5">
                <span className="text-slate-500">{season.monthRange}</span>
                <span className="font-semibold text-slate-800">{season.display}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (hours.type === "temporarily-closed") {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-red-600">
        <span>🔴</span>
        <span>{hours.display ?? "مغلق مؤقتًا"}</span>
      </div>
    );
  }
  // type === "fixed"
  const isPlanned = plannedWeekday !== undefined;
  const displayDay = plannedWeekday ?? getNowInTimeZone(timeZone).weekday;
  const displayText = formatIntervals(hours.schedule[displayDay]);
  // For a planned itinerary day, "open/closed" is a fact about that day's own schedule (does it
  // have any interval at all) -- never a live "right now" status, which has no honest meaning
  // for a date that may not be today. `isOpenNow` (real-time) is only computed/used when there is
  // no planned day at all.
  const openOnPlannedDay = displayText !== "مغلق";
  const openNow = !isPlanned && isOpenNow(hours.schedule, timeZone);
  const isOpenForDisplay = isPlanned ? openOnPlannedDay : openNow;
  const statusLabel = isPlanned ? (openOnPlannedDay ? "مفتوح هذا اليوم" : "مغلق هذا اليوم") : openNow ? "مفتوح الآن" : "مغلق الآن";

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label="عرض ساعات العمل للأسبوع"
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-start"
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-slate-700">
            <span className="text-slate-500">{isPlanned ? `🕒 ساعات يوم ${WEEKDAY_LABELS_AR[displayDay]}: ` : "🕒 اليوم: "}</span>
            <span className="font-semibold text-slate-900">{displayText}</span>
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isOpenForDisplay ? "text-teal-700" : "text-slate-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isOpenForDisplay ? "bg-teal-500" : "bg-slate-400"}`} />
            {statusLabel}
          </span>
        </span>
        <IconChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5 rounded-lg border border-slate-100 p-2 text-xs">
          {ORDERED_WEEKDAYS.map((day) => (
            <div key={day} className={`flex items-center justify-between rounded px-1.5 py-1 ${day === displayDay ? "bg-teal-50" : ""}`}>
              <span className={`flex items-center gap-1.5 ${day === displayDay ? "font-semibold text-teal-800" : "text-slate-600"}`}>
                {WEEKDAY_LABELS_AR[day]}
                {day === displayDay && (
                  <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-700">{isPlanned ? "يوم رحلتك" : "اليوم"}</span>
                )}
              </span>
              <span className={day === displayDay ? "font-semibold text-teal-800" : "text-slate-700"}>{formatIntervals(hours.schedule[day])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

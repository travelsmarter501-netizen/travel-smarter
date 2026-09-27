import { buildBarcelonaDayTimeline } from "./barcelonaV2Timeline";
import type { TimelineStopInput } from "./barcelonaV2Timeline";
import { buildBarcelonaPlannerRouteLegs } from "./barcelona-planner-route-legs";
import type { GeneratedPlannerPlan, PlannerDay } from "./plannerDayBuilder";
import type { PlannerPlaceMetadata } from "./plannerTypes";
import type { PlannerRouteLeg } from "./plannerTransportTypes";
import type { HoursInfo, Weekday } from "../hours";

/**
 * Beach Timing Guard -- Surprise Me Quality V2, Part C (second half; see barcelonaV2Timeline.ts's
 * own new sunset-floor code for the first half, sunset-catamaran-sail).
 *
 * -- Root cause (measured live during the audit) --------------------------------------------------
 * A real exact-date 5-day plan spanning a Sunday put Barcelona Cathedral first in a day (its own
 * real Sunday hours: 14:00-16:30, a genuine `type: "fixed"` constraint) and Barceloneta Beach
 * (preferredTime "morning/afternoon") last -- the Timeline Resolver correctly refused to violate
 * Cathedral's hours, but that pushed the WHOLE day's clock later, landing the beach visit at
 * 19:15-21:15, after dark. Nothing here was a closure/date-safety violation (every stop's own real
 * hours were respected) -- it is a day-quality side effect of stop ORDER, which Route
 * Optimizer/Cross-Day Optimization never consider (they order for geography and travel time only,
 * never time-of-day) and which the Timeline Resolver itself is documented to never touch ("it
 * never reorders stops" -- barcelonaV2Timeline.ts's own header).
 *
 * -- What this pass does, precisely -----------------------------------------------------------------
 * Exact-date mode only (a real weekday is required -- flexible-mode plans have no real hours
 * pressure to guard against, so this is always a no-op there). For each day: if a
 * "morning/afternoon"-bucketed stop (the same signal barceloneta-beach/bogatell/nova-icaria
 * already carry, `plannerTypes.ts`) is not already the day's first stop, and a trial timeline
 * shows it would start at or after 18:00, this tries EXACTLY ONE safe reorder -- move that stop to
 * the front of the day, keeping every other stop's relative order unchanged -- and keeps it only
 * if: (a) the stop's own start time is genuinely earlier afterward, (b) no OTHER stop that
 * previously had a solid (non-approximate) verified window becomes approximate/forced because of
 * the reorder, and (c) the day's resolved-route-leg count never gets worse. If no such improvement
 * exists, the day is left exactly as it was -- this pass never violates opening-hours/date safety
 * to force a "nicer" time, and never moves a stop to a different day (that would re-open Day
 * Builder/Natural Reclaim/Cross-Day's own already-settled membership decisions, out of scope for
 * this small, explicit rule).
 *
 * Pure, no `server-only` dependency (same precedent as barcelonaV2Density.ts/
 * barcelonaV2Timeline.ts) -- real per-day weekday and real Guide hours are supplied by the caller
 * (`app/smart-planner/barcelona-v2/actions.ts`, a genuine server context) rather than resolved
 * here, so this file stays directly testable via `npx tsx`.
 */
export const ENABLE_BEACH_TIMING_GUARD = true;

const LATE_START_THRESHOLD_MINUTES = 18 * 60; // 18:00
const GUARDED_PREFERRED_TIME = "morning/afternoon";

function toTimelineInputs(stopIds: string[], metaById: Map<string, PlannerPlaceMetadata>, resolveHours: (placeId: string) => HoursInfo | undefined): TimelineStopInput[] {
  return stopIds.map((id) => {
    const meta = metaById.get(id)!;
    return { placeId: id, visitDurationMinutes: meta.visitDurationMinutes, hours: resolveHours(id), preferredTime: meta.preferredTime };
  });
}

export function applyBeachTimingGuard(
  plan: GeneratedPlannerPlan,
  legsByDay: PlannerRouteLeg[][],
  places: PlannerPlaceMetadata[],
  weekdayForDayNumber: (dayNumber: number) => Weekday | null,
  resolveHours: (placeId: string) => HoursInfo | undefined,
  buildPlanRouteLegs: (plan: GeneratedPlannerPlan) => PlannerRouteLeg[][]
): { plan: GeneratedPlannerPlan; legsByDay: PlannerRouteLeg[][] } {
  if (!ENABLE_BEACH_TIMING_GUARD) return { plan, legsByDay };
  const metaById = new Map(places.map((p) => [p.placeId, p]));

  let changedAny = false;
  const newDays: PlannerDay[] = plan.days.map((day, dayIndex) => {
    const weekday = weekdayForDayNumber(day.dayNumber);
    if (!weekday) return day; // flexible mode -- no real time-of-day pressure to guard against

    const stopIds = day.stops.map((s) => s.placeId);
    const guardedIndex = stopIds.findIndex((id) => metaById.get(id)?.preferredTime === GUARDED_PREFERRED_TIME);
    if (guardedIndex <= 0) return day; // none present, or already first -- nothing to guard

    const beforeTimeline = buildBarcelonaDayTimeline(toTimelineInputs(stopIds, metaById, resolveHours), legsByDay[dayIndex] ?? [], [], weekday);
    const beforeWindow = beforeTimeline.stops[guardedIndex];
    if (!beforeWindow || beforeWindow.startMinutes < LATE_START_THRESHOLD_MINUTES) return day; // already sensible

    // The one safe reorder this guard ever attempts: move the guarded stop to the front.
    const guardedId = stopIds[guardedIndex];
    const reorderedIds = [guardedId, ...stopIds.filter((_, i) => i !== guardedIndex)];
    const reorderedStops = reorderedIds.map((id) => day.stops.find((s) => s.placeId === id)!);
    const reorderedDay: PlannerDay = { ...day, stops: reorderedStops };
    const reorderedLegs = buildBarcelonaPlannerRouteLegs(reorderedDay);

    const afterTimeline = buildBarcelonaDayTimeline(toTimelineInputs(reorderedIds, metaById, resolveHours), reorderedLegs, [], weekday);
    const afterWindow = afterTimeline.stops[0];
    if (!afterWindow || afterWindow.startMinutes >= beforeWindow.startMinutes) return day; // no genuine improvement

    // Never let the reorder newly force/truncate another stop that was previously fine.
    const beforeByPlace = new Map(beforeTimeline.stops.map((w) => [w.placeId, w]));
    const anyNewlyApproximate = afterTimeline.stops.some((w) => {
      if (w.placeId === guardedId) return false;
      const prior = beforeByPlace.get(w.placeId);
      return !!prior && !prior.approximate && w.approximate;
    });
    if (anyNewlyApproximate) return day;

    const unresolvedBefore = (legsByDay[dayIndex] ?? []).filter((l) => l.sourceStatus === "unresolved").length;
    const unresolvedAfter = reorderedLegs.filter((l) => l.sourceStatus === "unresolved").length;
    if (unresolvedAfter > unresolvedBefore) return day;

    changedAny = true;
    return reorderedDay;
  });

  if (!changedAny) return { plan, legsByDay };
  const newPlan: GeneratedPlannerPlan = { days: newDays };
  return { plan: newPlan, legsByDay: buildPlanRouteLegs(newPlan) };
}

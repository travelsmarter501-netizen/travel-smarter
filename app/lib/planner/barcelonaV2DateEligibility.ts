import "server-only";
import { resolvePlannerPlace } from "../readyPlan";
import { barcelonaGuide } from "../barcelona-guide";
import { addDaysToIsoDate, weekdayOfIsoDate } from "./dateOnly";
import type { HoursInfo, Weekday } from "../hours";

/**
 * Smart Planner V2 -- Barcelona's specific-date closed-day eligibility resolver.
 * Server-only (Guide-dependent): builds a `DayBuilderConfig.isPlaceEligibleForDay` callback
 * (see plannerDayBuilder.ts) for one request's `arrivalDate`, so day 1/2/3/... map to their
 * REAL calendar weekday and the generic Day Builder can exclude a place from a day its real
 * Guide hours show it closed on -- as part of candidate selection itself, never as a
 * post-generation "delete it and hope" patch (see the Phase 3A task's own architecture note).
 *
 * Reliability rules (exactly as specified, none stricter or looser):
 * - `type: "fixed"` schedule + the scheduled weekday has no open interval -> HARD exclude.
 * - `type: "temporarily-closed"` -> HARD exclude (every day, regardless of weekday).
 * - `type: "always-open"` -> always eligible.
 * - `type: "variable"` / `type: "event"` -> NEVER hard-excluded here (no per-weekday
 *   structure to check) -- warning/presentation-only, exactly as today -- UNLESS the entry
 *   also sets `closedWeekdays` (Operational Hours Integrity Audit): a narrow, opt-in escape
 *   hatch for a `variable` place whose exact TIMES genuinely vary too much for `type: "fixed"`
 *   but whose weekly closure itself is already verified and documented (e.g. MNAC: closing
 *   time changes by season, but every season agrees Monday is closed). Every pre-existing
 *   `variable` entry omits this field and is completely unaffected.
 * - missing `hours` entirely -> NEVER assumed closed; absence of data is not evidence.
 *
 * Does not modify hours.ts's TYPES casually or any manually verified hours VALUE without
 * evidence -- `closedWeekdays` is the one narrow, additive exception, added only where the
 * project's own existing `display`/`seasons` text already states the same closure.
 *
 * Phase 3B: `isPlaceClosedOnWeekday` is now exported so barcelonaV2Supplementary.ts (food/
 * shopping/nightlife suggestions) can apply the exact same weekday-closure rule to
 * `FoodPlace`/`NightlifeVenue`/`ShoppingArea` hours -- those types aren't reachable via
 * `resolvePlannerPlace` (main-stop types only), so this file's own `getHoursForPlaceId` stays
 * private/main-stop-specific, while the pure boolean rule itself is shared.
 */

export function isPlaceClosedOnWeekday(hours: HoursInfo | undefined, weekday: Weekday): boolean {
  if (!hours) return false;
  if (hours.type === "temporarily-closed") return true;
  // Operational Hours Integrity Audit: a `variable`-type place can still carry a verified,
  // documented weekly closure (see hours.ts's own doc comment on `closedWeekdays`) even though
  // its exact open/close TIMES genuinely vary too much to be modeled as `type: "fixed"`. Checked
  // before the `type !== "fixed"` early-return below, which otherwise treats every non-fixed
  // type as never weekday-closed -- unaffected for the (overwhelming majority of) `variable`
  // entries that don't set this field.
  if (hours.type === "variable" && hours.closedWeekdays?.includes(weekday)) return true;
  if (hours.type !== "fixed") return false;
  const intervals = hours.schedule[weekday];
  return !intervals || intervals.length === 0;
}

function getHoursForPlaceId(placeId: string): HoursInfo | undefined {
  const resolved = resolvePlannerPlace(placeId, barcelonaGuide);
  if (!resolved) return undefined;
  return (resolved.place as { hours?: HoursInfo }).hours;
}

/**
 * Returns null (meaning: no eligibility restriction, every place eligible every day) when
 * `arrivalDateIso` isn't a valid calendar date -- callers should already have validated the
 * date before reaching here, but this stays defensive rather than throwing.
 */
export function buildBarcelonaDateEligibility(arrivalDateIso: string): ((placeId: string, dayNumber: number) => boolean) | null {
  if (!weekdayOfIsoDate(arrivalDateIso)) return null;

  return (placeId: string, dayNumber: number): boolean => {
    const dateForDay = addDaysToIsoDate(arrivalDateIso, dayNumber - 1);
    if (!dateForDay) return true; // defensive -- never block on an internal date-math failure
    const weekday = weekdayOfIsoDate(dateForDay);
    if (!weekday) return true;

    const hours = getHoursForPlaceId(placeId);
    return !isPlaceClosedOnWeekday(hours, weekday);
  };
}

export type DatedPlanClosureViolation = { placeId: string; dayNumber: number; date: string; weekday: Weekday };

/**
 * P0 Exact-Date Safety Fix -- final integrity check for a specific-dates plan, run AFTER every
 * day-changing pass (Day Builder, accommodation reorder, Natural Reclaim, Cross-Day) and BEFORE
 * Meal Stops/Timeline. Independent of and does not rely on any single pass having remembered to
 * call `isPlaceEligibleForDay` correctly -- it re-derives each stop's real calendar date from the
 * plan's FINAL `dayNumber` and re-checks its real Guide hours directly, so it catches a violation
 * regardless of which upstream step (existing or future) might have introduced it.
 *
 * Returns an empty array when the plan is fully date-safe -- the expected, common case (see
 * `datedPlanClosureIntegrityAudit.debug.ts` for the permanent regression matrix proving this holds
 * across every profile/weekday/day-count combination and every accommodation area tested).
 */
export function findDatedPlanClosureViolations(
  days: { dayNumber: number; stops: { placeId: string }[] }[],
  arrivalDateIso: string
): DatedPlanClosureViolation[] {
  const violations: DatedPlanClosureViolation[] = [];
  for (const day of days) {
    const date = addDaysToIsoDate(arrivalDateIso, day.dayNumber - 1);
    const weekday = date ? weekdayOfIsoDate(date) : null;
    if (!date || !weekday) continue;
    for (const stop of day.stops) {
      const hours = getHoursForPlaceId(stop.placeId);
      if (isPlaceClosedOnWeekday(hours, weekday)) {
        violations.push({ placeId: stop.placeId, dayNumber: day.dayNumber, date, weekday });
      }
    }
  }
  return violations;
}

/**
 * Best-effort, always-safe repair for a violation `findDatedPlanClosureViolations` should never
 * actually find post-fix (see that function's own doc comment) -- defense-in-depth only, never
 * the primary mechanism. Repairs by SWAPPING the ARRAY POSITION of the violating day with another
 * day's position wherever swapping makes both fully valid at their new dates -- never invents a
 * replacement place, never deletes a stop, and never applies a swap that isn't itself fully
 * verified safe. `days[i]` and `legsByDay[i]` are swapped together (position `i`'s legs describe
 * that position's own stops, not a specific dayNumber) so the two stay aligned exactly as every
 * other pass in this pipeline already assumes; `dayNumber` is renormalized to array position + 1
 * afterward, preserving the existing "array order == dayNumber order" invariant every caller
 * relies on. A violating day with no safe swap partner anywhere in the plan is left untouched and
 * reported via `unrepaired` rather than risk a worse, unproven change -- this should be
 * unreachable given the upstream fix in `orderDaysByAccommodation` (travelPlannerEngine.ts).
 */
export function repairDatedPlanClosureViolations<Day extends { dayNumber: number; stops: { placeId: string }[] }, Legs>(
  days: Day[],
  legsByDay: Legs[],
  arrivalDateIso: string
): { days: Day[]; legsByDay: Legs[]; unrepaired: DatedPlanClosureViolation[] } {
  const isValidAtDate = (day: Day, date: string): boolean => {
    const weekday = weekdayOfIsoDate(date);
    if (!weekday) return true;
    return day.stops.every((stop) => !isPlaceClosedOnWeekday(getHoursForPlaceId(stop.placeId), weekday));
  };
  const dateAtPosition = (index: number): string | null => addDaysToIsoDate(arrivalDateIso, index);

  const resultDays = [...days];
  const resultLegs = [...legsByDay];

  for (let i = 0; i < resultDays.length; i++) {
    const dateI = dateAtPosition(i);
    if (!dateI || isValidAtDate(resultDays[i], dateI)) continue;
    for (let j = 0; j < resultDays.length; j++) {
      if (j === i) continue;
      const dateJ = dateAtPosition(j);
      if (!dateJ) continue;
      if (isValidAtDate(resultDays[i], dateJ) && isValidAtDate(resultDays[j], dateI)) {
        [resultDays[i], resultDays[j]] = [resultDays[j], resultDays[i]];
        [resultLegs[i], resultLegs[j]] = [resultLegs[j], resultLegs[i]];
        break;
      }
      // No safe swap partner found for position i -- left untouched; reported via `unrepaired`
      // below rather than silently accepted.
    }
  }

  const renumbered = resultDays.map((day, index) => ({ ...day, dayNumber: index + 1 }));
  const unrepaired = findDatedPlanClosureViolations(
    renumbered.map((d) => ({ dayNumber: d.dayNumber, stops: d.stops })),
    arrivalDateIso
  );
  return { days: renumbered, legsByDay: resultLegs, unrepaired };
}

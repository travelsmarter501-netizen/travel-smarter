import { formatTimelineClock, type FreeTimeBlock } from "./barcelonaV2Timeline";
import type { V2Day, V2ResolvedStop } from "./barcelonaV2Resolve";
import type { V2MealStop } from "./barcelonaV2MealStops";

/**
 * Redesign Food Stops + Timeline UI -- builds ONE unified, customer-facing, sequentially
 * NUMBERED itinerary sequence from a day's separately-tracked `stops` (main attractions) and
 * `mealStops` (real scheduled food stops), interleaved with any Free Time blocks. Pure
 * presentation normalization, computed at RENDER TIME from already-frozen data -- never
 * changes which places are on the day, their Day Builder order, or `afterStopIndex`. No
 * `server-only` dependency (only type-only imports from barcelonaV2Resolve.ts/
 * barcelonaV2MealStops.ts, erased at compile time -- same safe pattern SmartPlannerV2Day.tsx
 * already used for `V2Day` before this file existed), so it's safe to import from a "use
 * client" component.
 *
 * Root cause this fixes: a scheduled restaurant previously rendered as a visually SEPARATE,
 * unnumbered, dashed-border "Meal Stop" card, floating outside the main 1/2/3/... sequence --
 * reading as an appended note rather than a real part of the trip. Here, a food stop gets the
 * exact same sequential number as an attraction would have in that same position -- the
 * customer sees ONE itinerary, not two parallel ones. Internally `day.stops`/`day.mealStops`
 * stay exactly as separate as before (nothing about Day Builder, Natural Reclaim, Cross-Day, or
 * density changes) -- this is purely how the ALREADY-DECIDED result is presented.
 */

export type UnifiedTimelineWindow = { timeRange?: string; approximate?: boolean };

export type UnifiedTimelineEntry =
  | ({ kind: "place"; number: number; place: V2ResolvedStop; stopIndex: number } & UnifiedTimelineWindow)
  | ({ kind: "meal"; number: number; meal: V2MealStop } & UnifiedTimelineWindow)
  | { kind: "freeTime"; block: FreeTimeBlock };

function timeRangeFor(startMinutes: number | undefined, endMinutes: number | undefined): string | undefined {
  if (startMinutes === undefined || endMinutes === undefined) return undefined;
  return `${formatTimelineClock(startMinutes)}–${formatTimelineClock(endMinutes)}`;
}

/** Finds which main stop index a Free Time block should render right after -- the stop (or
 * meal) whose own window ends exactly where the gap begins. -1 means "before the first stop"
 * (anchored to breakfast or the very start of the day) -- rare, but handled the same way. */
function freeTimeAnchorStopIndex(block: FreeTimeBlock, day: V2Day): number {
  const stopMatch = day.timeline?.stops.findIndex((s) => s.endMinutes === block.startMinutes) ?? -1;
  if (stopMatch !== -1) return stopMatch;
  const meal = day.timeline?.meals.find((m) => m.endMinutes === block.startMinutes);
  return meal ? meal.afterStopIndex : -2; // -2: no match found, never rendered (defensive, shouldn't happen)
}

function mealWindow(day: V2Day, meal: V2MealStop) {
  return day.timeline?.meals.find((m) => m.placeId === meal.id && m.afterStopIndex === meal.afterStopIndex);
}

/**
 * Builds the full unified sequence for one day, in chronological order, with `number` assigned
 * sequentially to every real stop (place or meal) -- Free Time blocks are never numbered, they
 * are not a "stop". Safe on an old saved plan: `day.mealStops`/`day.timeline` missing simply
 * means every meal-related step here is a no-op, producing the exact same numbered sequence the
 * plan always had (main stops only).
 */
export function buildUnifiedTimelineEntries(day: V2Day): UnifiedTimelineEntry[] {
  const meals = day.mealStops ?? [];
  const entries: UnifiedTimelineEntry[] = [];
  let number = 0;

  function pushMeal(meal: V2MealStop) {
    const w = mealWindow(day, meal);
    number++;
    entries.push({ kind: "meal", number, meal, timeRange: timeRangeFor(w?.startMinutes, w?.endMinutes), approximate: w?.approximate });
  }

  function pushFreeTime(block: FreeTimeBlock) {
    entries.push({ kind: "freeTime", block });
  }

  function itemsAnchoredAt(index: number): { start: number; render: () => void }[] {
    const mealsHere = meals
      .filter((m) => m.afterStopIndex === index)
      .map((meal) => ({ start: mealWindow(day, meal)?.startMinutes ?? 0, render: () => pushMeal(meal) }));
    const freeTimeHere = (day.timeline?.freeTimeBlocks ?? [])
      .filter((block) => freeTimeAnchorStopIndex(block, day) === index)
      .map((block) => ({ start: block.startMinutes, render: () => pushFreeTime(block) }));
    return [...mealsHere, ...freeTimeHere].sort((a, b) => a.start - b.start);
  }

  // Breakfast (and any free-time block anchored before the first stop -- rare) render first.
  for (const item of itemsAnchoredAt(-1)) item.render();

  day.stops.forEach((stop, index) => {
    const sw = day.timeline?.stops[index];
    number++;
    entries.push({ kind: "place", number, place: stop, stopIndex: index, timeRange: timeRangeFor(sw?.startMinutes, sw?.endMinutes), approximate: sw?.approximate });
    for (const item of itemsAnchoredAt(index)) item.render();
  });

  // Round 3C.1 Final Timeline UX Cleanup -- Free Time blocks are still computed and anchored
  // above (pushFreeTime/freeTimeAnchorStopIndex, and day.timeline.freeTimeBlocks itself in
  // barcelonaV2Timeline.ts) for any other internal consumer (e.g. timelineScheduleAudit.debug.ts's
  // own diagnostics), but are no longer shown to the customer: Travel Smarter tells the customer
  // where to go and when, not how to account for every unscheduled minute. Filtered here, at the
  // presentation boundary, so removing this line alone would restore the old customer-facing
  // behavior with no other change needed anywhere. A large real gap (e.g. Bogatell Beach ending
  // 14:15, Sunset Catamaran starting 16:00) now simply shows as two cards with their own clock
  // times and a normal transport connector between them -- the customer can read the gap
  // directly off the two times shown, exactly as this task's own examples describe.
  return entries.filter((entry) => entry.kind !== "freeTime");
}

/** Arabic count grammar for the day-summary meal line -- avoids the literal-but-awkward "X
 * وجبات" for every count (1 = "وجبة واحدة", 2 = "وجبتان", 3+ = "N وجبات"). */
export function formatMealCountAr(count: number): string {
  if (count === 1) return "وجبة واحدة مجدولة";
  if (count === 2) return "وجبتان مجدولتان";
  return `${count} وجبات مجدولة`;
}

/** Arabic count grammar for the day-summary place-count line (1 = "مكان واحد", 2 = "مكانان", 3+
 * = "N أماكن"). */
export function formatPlaceCountAr(count: number): string {
  if (count === 1) return "مكان رئيسي واحد";
  if (count === 2) return "مكانان رئيسيان";
  return `${count} أماكن رئيسية`;
}

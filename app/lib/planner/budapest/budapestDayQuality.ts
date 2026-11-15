import type { V2Day } from "../barcelonaV2Resolve";
import { BUDAPEST_DAYLIGHT, SUNSET_ESTIMATE_BY_MONTH } from "./budapestDaylight";
export { SUNSET_ESTIMATE_BY_MONTH };

/**
 * How a FINAL Budapest day reads on the clock (the resolved day: restaurants, meal lengths, every transfer). One definition, used to
 * accept a change (budapestCityModule.ts) and by the review tools (docs/budapest/tools), so "before" and "after" are measured alike.
 *
 * - morningGap: from 09:00 to the first visit. Idle moved into the morning is idle, never a saving.
 * - waits: between consecutive items (visits and lunch), beyond the shown transfer and the shared 15-minute margin; never before the
 *   optional dinner (evening rest).
 * - travel: every KNOWN transfer of the day, meal transfers included. Split: stopTravel (between visits; a lunch break has no point,
 *   so the route around it counts here) and mealTravel (to and from a named restaurant). A lunch break says nothing about how far the
 *   food is: foodAccessUnknown marks it, and that day's travel is a lower bound (no distance is invented).
 * - longestWait: the longest single wait (same definition as waits).
 * - lateLunchMinutes: how far lunch starts after 13:30.
 * - afterDarkEstimate: minutes that the daylight places (budapestDaylight.ts: "needs" and "prefers") run after an ESTIMATED sunset:
 *   a monthly table (mid-month local time, rounded), not a calculation for the date and coordinates. The project has no such calculation.
 * - visitsEnd / lunchEnd / dinnerStart: the end of the last visit, the end of lunch, and the optional dinner, kept apart.
 * - cost: morningGap + waits + 2 x lateLunchMinutes + afterDarkEstimate + travel / 2 (a comparison score, not shown).
 */
export const DAY_REFERENCE_START = 9 * 60;
/**
 * The places measured after the estimated sunset: every place classed "needs" or "prefers" daylight (budapestDaylight.ts). Since
 * 2026-11-15 this adds Citadella (best before sunset) to the earlier list (Margaret Island, Vajdahunyad, the Zoo); nothing was removed.
 */
export const DAYLIGHT_PLACES: ReadonlySet<string> = new Set(Object.entries(BUDAPEST_DAYLIGHT).filter(([, v]) => v.class !== "evening").map(([id]) => id));

export type FinalDayQuality = {
  morningGap: number;
  waits: number;
  idle: number;
  visits: number;
  travel: number;
  stopTravel: number;
  mealTravel: number;
  foodAccessUnknown: boolean;
  longestWait: number;
  lunch: string;
  lunchStart: number | null;
  lunchEnd: number | null;
  lateLunchMinutes: number;
  visitsEnd: number;
  dinnerStart: number | null;
  afterDarkEstimate: number;
  stops: number;
  order: string;
  cost: number;
};

export function finalDayQuality(day: V2Day): FinalDayQuality {
  const timeline = day.timeline;
  type Item = { kind: string; index: number; id: string; start: number; end: number };
  const items: Item[] = [
    ...(timeline?.stops ?? []).map((s, i) => ({ kind: "stop", index: i, id: s.placeId, start: s.startMinutes, end: s.endMinutes })),
    ...(timeline?.meals ?? []).map((m) => ({ kind: m.mealType, index: -1, id: m.placeId, start: m.startMinutes, end: m.endMinutes })),
  ].sort((a, b) => a.start - b.start);
  let waits = 0;
  let travel = 0;
  let stopTravel = 0;
  let longestWait = 0;
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1];
    const b = items[j];
    let minutes = 0;
    if (b.id !== "lunch-break") {
      const leg = a.kind === "stop" && b.kind === "stop" ? day.legs[a.index] : day.mealLegs?.[`${a.id}::${b.id}`];
      const option = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((o) => o.mode === leg.recommendedMode) : undefined;
      minutes = option ? Math.round((option.durationMinutesMin + option.durationMinutesMax) / 2) : 0;
    }
    travel += minutes;
    if ((a.kind === "stop" || a.id === "lunch-break") && (b.kind === "stop" || b.id === "lunch-break")) stopTravel += minutes;
    const wait = b.kind !== "dinner" ? Math.max(0, b.start - a.end - minutes - 15) : 0;
    waits += wait;
    longestWait = Math.max(longestWait, wait);
  }
  const first = timeline?.stops[0]?.startMinutes ?? DAY_REFERENCE_START;
  const morningGap = Math.max(0, first - DAY_REFERENCE_START);
  const lunch = timeline?.meals.find((m) => m.mealType === "lunch");
  const dinner = timeline?.meals.find((m) => m.mealType === "dinner");
  const lateLunchMinutes = lunch ? Math.max(0, lunch.startMinutes - (13 * 60 + 30)) : 0;
  const month = day.actualDate ? Number(day.actualDate.slice(5, 7)) : null;
  const sunset = month ? SUNSET_ESTIMATE_BY_MONTH[month] : null;
  const afterDarkEstimate = sunset === null ? 0 : (timeline?.stops ?? []).reduce((sum, w) => sum + (DAYLIGHT_PLACES.has(w.placeId) ? Math.max(0, w.endMinutes - sunset) : 0), 0);
  const visitsEnd = Math.max(0, ...(timeline?.stops ?? []).map((s) => s.endMinutes));
  return {
    morningGap,
    waits,
    idle: morningGap + waits,
    visits: day.stops.reduce((sum, s) => sum + s.visitDurationMinutes, 0),
    travel,
    stopTravel,
    mealTravel: travel - stopTravel,
    foodAccessUnknown: !!lunch && lunch.placeId === "lunch-break",
    longestWait,
    lunch: lunch ? (lunch.placeId === "lunch-break" ? "break" : lunch.placeId) : "none",
    lunchStart: lunch?.startMinutes ?? null,
    lunchEnd: lunch?.endMinutes ?? null,
    lateLunchMinutes,
    visitsEnd,
    dinnerStart: dinner?.startMinutes ?? null,
    afterDarkEstimate,
    stops: day.stops.length,
    order: day.stops.map((s) => s.id).join(">"),
    cost: morningGap + waits + 2 * lateLunchMinutes + afterDarkEstimate + travel / 2,
  };
}

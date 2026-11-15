import type { V2Day } from "../barcelonaV2Resolve";

/**
 * How a FINAL Budapest day reads on the clock (the resolved day: restaurants, meal lengths, every transfer). One definition, used to
 * accept a change (budapestCityModule.ts) and by the review tools (docs/budapest/tools), so "before" and "after" are measured alike.
 *
 * - morningGap: from 09:00 to the first visit. Idle moved into the morning is idle, never a saving.
 * - waits: between consecutive items (visits and lunch), beyond the shown transfer and the shared 15-minute margin; never before the
 *   optional dinner (evening rest).
 * - travel: every transfer of the day, meal transfers included (a lunch break taken where a visit ends has none).
 * - lateLunchMinutes: how far lunch starts after 13:30.
 * - afterDarkEstimate: minutes that the LISTED daylight places (an open park, a castle seen from outside) run after an ESTIMATED sunset:
 *   a monthly table (mid-month local time, rounded), not a calculation for the date and coordinates. The project has no such calculation.
 * - visitsEnd / lunchEnd / dinnerStart: the end of the last visit, the end of lunch, and the optional dinner, kept apart.
 * - cost: morningGap + waits + 2 x lateLunchMinutes + afterDarkEstimate + travel / 2 (a comparison score, not shown).
 */
export const DAY_REFERENCE_START = 9 * 60;
/** Estimated Budapest sunset by month (local time, mid-month, rounded; about ±20 min across a month). Index 1 = January. */
export const SUNSET_ESTIMATE_BY_MONTH = [0, 16 * 60 + 20, 17 * 60 + 5, 17 * 60 + 45, 19 * 60 + 50, 20 * 60 + 25, 20 * 60 + 45, 20 * 60 + 40, 20 * 60, 19 * 60, 18 * 60, 16 * 60 + 15, 15 * 60 + 55];
/** Places whose point is seen in daylight. Viewpoints, bridges and lit squares are fine after dark; museums follow their hours. */
export const DAYLIGHT_PLACES: ReadonlySet<string> = new Set(["margaret-island", "vajdahunyad-castle", "budapest-zoo"]);

export type FinalDayQuality = {
  morningGap: number;
  waits: number;
  idle: number;
  visits: number;
  travel: number;
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
    if (b.kind !== "dinner") waits += Math.max(0, b.start - a.end - minutes - 15);
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

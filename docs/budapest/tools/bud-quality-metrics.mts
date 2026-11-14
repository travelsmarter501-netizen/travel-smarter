/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Day metrics shared by bud-quality.mts and bud-launch-table.mts (no generation here).
// morningGap: 09:00 -> first visit; waits: between items, beyond the transfer + the 15-minute margin, not before dinner; idle = both;
// visits / travel minutes; end of the program (dinner excluded); lunch kind; late lunch (after 13:30); daylight visits after dark
// (approximate monthly sunset, the same planning approximation as budapestCityModule.ts).
const mid = (o: any) => Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2);
const SUNSET = [0, 980, 1025, 1065, 1190, 1225, 1245, 1240, 1200, 1140, 1080, 975, 955];
const DAYLIGHT = new Set(["margaret-island", "vajdahunyad-castle", "budapest-zoo"]);
export function dayMetrics(d: any) {
  const items = [...d.timeline.stops.map((s: any, i: number) => ({ k: "s", i, id: s.placeId, s: s.startMinutes, e: s.endMinutes })), ...(d.timeline.meals ?? []).map((m: any) => ({ k: m.mealType, id: m.placeId, s: m.startMinutes, e: m.endMinutes }))].sort((a: any, b: any) => a.s - b.s);
  let waits = 0, travel = 0;
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1], b = items[j];
    let t = 0;
    if (b.id !== "lunch-break") { const leg = a.k === "s" && b.k === "s" ? d.legs[a.i] : d.mealLegs?.[`${a.id}::${b.id}`]; const o = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((x: any) => x.mode === leg.recommendedMode) : null; t = o ? mid(o) : 0; }
    travel += t;
    if (b.k !== "dinner") waits += Math.max(0, b.s - a.e - t - 15);
  }
  const first = d.timeline.stops[0]?.startMinutes ?? 540;
  const lunch = (d.timeline.meals ?? []).find((m: any) => m.mealType === "lunch");
  const end = Math.max(...items.filter((x: any) => x.k !== "dinner").map((x: any) => x.e));
  const month = d.actualDate ? Number(d.actualDate.slice(5, 7)) : null;
  const afterDark = month ? d.timeline.stops.reduce((s: number, w: any) => s + (DAYLIGHT.has(w.placeId) ? Math.max(0, w.endMinutes - SUNSET[month]) : 0), 0) : 0;
  return {
    morningGap: Math.max(0, first - 540), waits, idle: Math.max(0, first - 540) + waits, visits: d.stops.reduce((s: number, x: any) => s + x.visitDurationMinutes, 0), travel, end, stops: d.stops.length,
    lunch: lunch ? (lunch.placeId === "lunch-break" ? "break" : lunch.placeId) : "none", lunchStart: lunch?.startMinutes ?? null, lateLunch: lunch && lunch.startMinutes > 810 ? 1 : 0, afterDark,
    order: d.stops.map((s: any) => s.id).join(">"),
  };
}

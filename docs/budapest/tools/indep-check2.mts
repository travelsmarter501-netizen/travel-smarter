/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Independent check of generated Barcelona schedules: full-length visits and meals, no overlap, nothing past midnight, every window inside an
// opening interval of its place (dated plans), last entry respected, and (v2) the time between two consecutive items at least the
// transfer time of the leg shown between them (recommended option, middle of its range). Written separately from the guard's own check.
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
const R = process.env.ROOT!;
const imp = (p: string) => import(pathToFileURL(R + p).href);
const { planningHoursOf } = await imp("/app/lib/hours.ts");
const { MEAL_ASSUMED_DURATION_MINUTES } = await imp("/app/lib/planner/barcelonaV2Timeline.ts");
const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const plans: any[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
let days = 0, windows = 0, checkedHours = 0, transfers = 0, transfersNoData = 0;
const mid = (o: any) => Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2);
const noData: Record<string, number> = {};
const bad: string[] = [];
for (const [pi, p] of plans.entries()) {
  const plan = p.r?.data ?? p.plan;
  if (!plan) continue;
  for (const d of plan.days) {
    days++;
    const tl = d.timeline;
    const seq: any[] = [];
    tl.meals.filter((m: any) => m.afterStopIndex === -1).forEach((m: any) => seq.push({ ...m, kind: "meal", need: MEAL_ASSUMED_DURATION_MINUTES[m.mealType], hours: (d.mealStops ?? []).find((x: any) => x.id === m.placeId)?.hours }));
    tl.stops.forEach((s: any, i: number) => {
      seq.push({ ...s, kind: "stop", idx: i, need: d.stops[i].visitDurationMinutes, hours: d.stops[i].hours });
      tl.meals.filter((m: any) => m.afterStopIndex === i).forEach((m: any) => seq.push({ ...m, kind: "meal", need: MEAL_ASSUMED_DURATION_MINUTES[m.mealType], hours: (d.mealStops ?? []).find((x: any) => x.id === m.placeId)?.hours }));
    });
    seq.forEach((w, i) => {
      windows++;
      const tag = `plan ${pi} day ${d.dayNumber} ${w.kind} ${w.placeId} ${w.startMinutes}-${w.endMinutes}`;
      if (w.endMinutes - w.startMinutes !== w.need) bad.push(`${tag}: length ${w.endMinutes - w.startMinutes} != ${w.need}`);
      if (i > 0 && w.startMinutes < seq[i - 1].endMinutes) bad.push(`${tag}: starts before the previous one ends`);
      if (i > 0) {
        const p = seq[i - 1];
        // Flexible meals (shown without a time) are not in the timeline, so pairs here are what the customer walks between.
        // place -> next place: the day's leg; any pair with a meal: the meal leg stored under "from::to" (a lunch break uses the stop's leg)
        let leg = p.kind === "stop" && w.kind === "stop" ? d.legs[p.idx] : d.mealLegs?.[`${p.placeId}::${w.placeId}`];
        if (w.placeId === "lunch-break") leg = { sourceStatus: "same-place", options: [{ mode: "none", durationMinutesMin: 0, durationMinutesMax: 0 }], recommendedMode: "none" };
        if (p.placeId === w.placeId) leg = { sourceStatus: "same-place", options: [{ mode: "none", durationMinutesMin: 0, durationMinutesMax: 0 }], recommendedMode: "none" };
        const o = leg && leg.sourceStatus !== "unresolved" && leg.recommendedMode ? leg.options.find((x: any) => x.mode === leg.recommendedMode) : null;
        transfers++;
        if (!o) { transfersNoData++; noData[`${p.placeId}>${w.placeId}`] = (noData[`${p.placeId}>${w.placeId}`] ?? 0) + 1; }
        else if (w.startMinutes - p.endMinutes < mid(o)) bad.push(`${tag}: ${w.startMinutes - p.endMinutes} min after ${p.placeId}, transfer is ${mid(o)} min (${leg.sourceStatus})`);
      }
      if (w.endMinutes > 24 * 60) bad.push(`${tag}: past midnight`);
      const hours = planningHoursOf(w.hours);
      if (hours && hours.type === "fixed" && d.weekday) {
        checkedHours++;
        const intervals = (hours.schedule[d.weekday] ?? []).map((x: any) => ({ open: mins(x.open), close: mins(x.close) <= mins(x.open) ? mins(x.close) + 24 * 60 : mins(x.close) }));
        const inside = intervals.some((x: any) => w.startMinutes >= x.open && w.endMinutes <= x.close);
        if (!inside) bad.push(`${tag}: outside opening hours ${JSON.stringify(intervals)}`);
        if (hours.lastEntry && w.startMinutes > mins(hours.lastEntry)) bad.push(`${tag}: after last entry ${hours.lastEntry}`);
      }
    });
  }
}
console.log(`${process.argv[2].split(/[\/]/).pop()}: ${days} days, ${windows} visits and meals, ${checkedHours} checked against opening hours, ${transfers} transfers checked (${transfersNoData} without data), ${bad.length} problems`);
console.log('without data:', JSON.stringify(Object.entries(noData).sort((a, b) => b[1] - a[1]).slice(0, 8)));
console.log(bad.slice(0, 8).join("\n"));

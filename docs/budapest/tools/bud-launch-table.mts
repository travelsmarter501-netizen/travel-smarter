/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Sample table: interest set x trip length (1-4 days), from a bud-quality.mts "launch" output (3 date cases per cell).
// Per cell: places per day, thin days (<= 2 places), share of visits that strongly match the interests (relevance >= 7), idle per day
// (09:00 -> first visit + waits, not before dinner), late first visits (>= 11:00), lunch breaks (no named restaurant) out of the days,
// average end of the visits / end of lunch / optional dinners (kept apart), daylight places after dark "by the monthly sunset ESTIMATE
// for the listed places" (not a calculation for the date and coordinates), and for the FOOD interest the meals themselves: restaurant
// lunches and dinners (a lunch break or no meal is not a food experience) and the Great Market Hall.
// The last column says whether a cell MEETS THE FIXED THRESHOLDS printed below the table. It is a measurement, not a sales or launch
// decision: the launch range stays open.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-launch-table.mts <launchDir>/all.json [out.csv]
import { readFileSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const Q = await imp("/docs/budapest/tools/bud-quality-metrics.mts");
const plans: any[] = JSON.parse(readFileSync(process.argv[2], "utf8"));
const THRESHOLDS = { minPlacesPerDay: 3, maxThinShare: 0.15, minStrongShare: 0.6, maxIdlePerDay: 90 };
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;
const rows: Record<string, any> = {};
for (const p of plans) {
  if (!p.plan) continue;
  const [set, len] = p.id.split("-");
  const key = `${set} ${len}`;
  const interests = p.c.surpriseMe ? [] : p.c.interests;
  const rel = M.BUDAPEST_CITY_MODULE.placeRelevance(interests, !!p.c.surpriseMe);
  const food = interests.includes("food");
  const r = (rows[key] ??= { set, len, plans: 0, days: 0, places: 0, thin: 0, strong: 0, visits: 0, idle: 0, late: 0, foodMeals: 0, foodSlots: 0, lunchBreaks: 0, visitsEnd: 0, lunchEnd: 0, lunches: 0, dinners: 0, afterDark: 0 });
  r.plans++;
  for (const d of p.plan.days) {
    const m = Q.dayMetrics(d);
    r.days++; r.places += d.stops.length; if (d.stops.length <= 2) r.thin++; r.idle += m.idle; if (m.morningGap >= 120) r.late++;
    if (m.lunch === "break") r.lunchBreaks++;
    r.visitsEnd += m.visitsEnd; if (m.lunchEnd !== null) { r.lunchEnd += m.lunchEnd; r.lunches++; } if (m.dinnerStart !== null) r.dinners++;
    r.afterDark += m.afterDarkEstimate;
    for (const s of d.stops) { r.visits++; if (rel(s.id) >= 7) r.strong++; }
    if (food) {
      const meals = (d.timeline.meals ?? []).filter((x: any) => x.mealType === "lunch" || x.mealType === "dinner");
      r.foodSlots += 2;
      r.foodMeals += meals.filter((x: any) => x.placeId !== "lunch-break").length + (d.stops.some((s: any) => s.id === "great-market-hall") ? 1 : 0);
    }
  }
}
const lines: string[] = ["set,days,plans,placesPerDay,thinDays,strongMatch%,idlePerDay,lateStarts,lunchBreaks,avgVisitsEnd,avgLunchEnd,dinners,afterDarkEstimateMin,foodMealsPerDay,meetsThresholds,reasons"];
console.log("set/len        plans  places/day  thin  strong%  idle/day  late  lunch-breaks  visits-end  lunch-end  dinners  after-dark*  food-meals/day  meets thresholds");
for (const r of Object.values(rows) as any[]) {
  const placesPerDay = r.places / r.days, thinShare = r.thin / r.days, strong = r.strong / Math.max(1, r.visits), idle = r.idle / r.days;
  const foodPerDay = r.foodSlots ? r.foodMeals / r.days : null;
  const strongForStatus = foodPerDay !== null ? Math.max(strong, Math.min(1, (r.strong + r.foodMeals) / (r.visits + r.foodSlots / 2))) : strong;
  const reasons: string[] = [];
  if (placesPerDay < THRESHOLDS.minPlacesPerDay) reasons.push("few places");
  if (thinShare > THRESHOLDS.maxThinShare) reasons.push("thin days");
  if (strongForStatus < THRESHOLDS.minStrongShare) reasons.push("weak interest match");
  if (idle > THRESHOLDS.maxIdlePerDay) reasons.push("long idle");
  const status = reasons.length === 0 ? "meets all" : `misses ${reasons.length}`;
  const breaks = `${r.lunchBreaks}/${r.days}`;
  console.log(`${(r.set + " " + r.len).padEnd(14)} ${String(r.plans).padStart(4)} ${placesPerDay.toFixed(1).padStart(10)} ${String(r.thin).padStart(5)} ${String(Math.round(100 * strong)).padStart(7)}% ${String(Math.round(idle)).padStart(8)} ${String(r.late).padStart(5)} ${breaks.padStart(13)} ${hm(r.visitsEnd / r.days).padStart(11)} ${(r.lunches ? hm(r.lunchEnd / r.lunches) : "-").padStart(10)} ${String(r.dinners).padStart(8)} ${String(r.afterDark).padStart(12)} ${foodPerDay === null ? "             -" : foodPerDay.toFixed(1).padStart(14)}  ${status}${reasons.length ? " (" + reasons.join(", ") + ")" : ""}`);
  lines.push([r.set, r.len, r.plans, placesPerDay.toFixed(1), r.thin, Math.round(100 * strong), Math.round(idle), r.late, breaks, hm(r.visitsEnd / r.days), r.lunches ? hm(r.lunchEnd / r.lunches) : "", r.dinners, r.afterDark, foodPerDay === null ? "" : foodPerDay.toFixed(1), status, reasons.join("; ")].join(","));
}
console.log(`\nthresholds (a measurement, not a launch or sales decision): places/day >= ${THRESHOLDS.minPlacesPerDay}; thin days <= ${100 * THRESHOLDS.maxThinShare}%; strong match >= ${100 * THRESHOLDS.minStrongShare}% (food: meals count as matching); idle/day <= ${THRESHOLDS.maxIdlePerDay} min. "late" = first visit 2 h or more after 09:00. lunch-breaks = days whose lunch is a lunch break, no named restaurant. visits-end / lunch-end = average end of the last visit / of lunch; dinners = days with the optional dinner. *after-dark = minutes of listed daylight places after dark, by the monthly sunset ESTIMATE for the listed places (not a date/coordinate calculation).`);
if (process.argv[3]) writeFileSync(process.argv[3], lines.join("\n") + "\n");

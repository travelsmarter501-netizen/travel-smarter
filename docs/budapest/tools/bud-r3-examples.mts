/* eslint-disable -- review script (not shipped): loose typing on generated plans is intended. */
// Round 3 examples: one request under several review variants (test-only module copies), every day in full, and the review decisions.
// Per day: each item with its time and length, the restaurants, KNOWN travel split into between-visits / to-and-from restaurants,
// whether the food access is unknown (lunch break: no point, so no distance is invented), the waits and the longest one, visits end,
// day end. Per day and trip: the change against variant A (8e8a309), absolute and cumulative. With --split, each day is also built
// with the SAME places in the same order but no lunch restaurant (lunch break), which separates the effect of the order from the
// effect of a named restaurant.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-r3-examples.mts '<request json>' A,B,C [--split] [out.json]
import { writeFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const Q = await imp("/app/lib/planner/budapest/budapestDayQuality.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const args = process.argv.slice(2);
const input = JSON.parse(args[0]);
const names = args[1].split(",");
const split = args.includes("--split");
const outFile = args.slice(2).find((a) => a.endsWith(".json"));
const D = M.BUDAPEST_QUALITY_DEFAULTS;
const VARIANTS: Record<string, any> = {
  A: { ...D, travelRule: "A", mealCheck: "tolerance" },
  Am: { ...D, travelRule: "A", mealCheck: "explicit" },
  B: { ...D, travelRule: "B", mealCheck: "explicit" },
  C: { ...D, travelRule: "C", mealCheck: "explicit" },
  Ba: { ...D, travelRule: "B", mealCheck: "explicit", datedAreas: true },
  Ca: { ...D, travelRule: "C", mealCheck: "explicit", datedAreas: true },
  B1: { ...D, travelRule: "B1", mealCheck: "explicit" },
  B1a: { ...D, travelRule: "B1", mealCheck: "explicit", datedAreas: true },
};
const hm = (m: number | null | undefined) => (m == null ? "-" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`);
function describeDay(d: any) {
  const q = Q.finalDayQuality(d);
  const items = [
    ...d.timeline.stops.map((s: any, i: number) => ({ s: s.startMinutes, text: `${hm(s.startMinutes)}-${hm(s.endMinutes)} ${s.placeId} (${d.stops[i].visitDurationMinutes} min)` })),
    ...d.timeline.meals.map((m: any) => ({ s: m.startMinutes, text: `${hm(m.startMinutes)}-${hm(m.endMinutes)} [${m.mealType}] ${m.placeId === "lunch-break" ? "lunch break (no set place)" : m.placeId}` })),
  ].sort((a, b) => a.s - b.s).map((x) => x.text);
  const dayEnd = Math.max(q.visitsEnd, ...d.timeline.meals.map((m: any) => m.endMinutes));
  return { day: d.dayNumber, date: d.actualDate ?? null, weekday: d.weekday ?? null, items, problems: [...G.scheduleProblems(d)], idle: q.idle, morning: q.morningGap, waits: q.waits, longestWait: q.longestWait, travelKnown: q.travel, stopTravel: q.stopTravel, mealTravel: q.mealTravel, foodAccessUnknown: q.foodAccessUnknown, lunch: q.lunch, visits: q.visits, visitsEnd: hm(q.visitsEnd), dayEnd: hm(dayEnd), cost: q.cost };
}
const result: any = { input, variants: {} };
const baseDays: any[] = [];
for (const name of names) {
  const log: any[] = [];
  const module = M.budapestModuleWith({ ...VARIANTS[name], report: (e: any) => log.push(e) });
  let reviewed: any = null;
  let build: any = null;
  const city = { ...module, reviewResolvedPlan: (inp: any) => { build = inp.build; reviewed = module.reviewResolvedPlan(inp); return reviewed; } };
  const r: any = await P.generateCityPlanV2(city, input);
  if (!r.ok) { console.log(name, "FAILED", r.error); continue; }
  const days = r.data.days.map(describeDay);
  if (name === names[0]) baseDays.push(...days);
  let splitDays: any[] | null = null;
  if (split && reviewed) {
    // Same places, same order, no lunch restaurant: the pipeline's own build for a copy of the city without lunch categories.
    let noLunchBuild: any = null;
    const noLunch = { ...module, mealStops: { ...module.mealStops, lunchCategories: [] }, undatedCandidates: false, reviewResolvedPlan: (inp: any) => { noLunchBuild = inp.build; return { plan: inp.plan, legsByDay: inp.legsByDay, data: inp.data }; } };
    await P.generateCityPlanV2(noLunch, input);
    splitDays = noLunchBuild(reviewed.plan, reviewed.legsByDay).days.map(describeDay);
  }
  const trip = (list: any[]) => ({ idle: list.reduce((s, d) => s + d.idle, 0), travelKnown: list.reduce((s, d) => s + d.travelKnown, 0), visits: list.reduce((s, d) => s + d.visits, 0), foodAccessUnknownDays: list.filter((d) => d.foodAccessUnknown).length, restaurantLunches: list.filter((d) => d.lunch !== "break" && d.lunch !== "none").length, places: r.data.days.reduce((s: number, d: any) => s + d.stops.length, 0) });
  const t = trip(days);
  const share = (x: any) => +((100 * x.travelKnown) / (x.travelKnown + x.visits)).toFixed(1);
  result.variants[name] = { days, splitDays, trip: { ...t, travelShare: share(t) }, log };
  console.log(`\n######## ${name}  ${JSON.stringify({ ...t, travelShare: share(t) })}`);
  for (const d of days) {
    const b = baseDays.find((x) => x.day === d.day);
    const delta = b && name !== names[0] ? `  vs ${names[0]}: idle ${d.idle - b.idle >= 0 ? "+" : ""}${d.idle - b.idle}, known travel ${d.travelKnown - b.travelKnown >= 0 ? "+" : ""}${d.travelKnown - b.travelKnown}` : "";
    console.log(`--- day ${d.day} ${d.date ?? ""} ${d.weekday ?? ""} | idle ${d.idle} (morning ${d.morning}, waits ${d.waits}, longest ${d.longestWait}) | known travel ${d.travelKnown} = between visits ${d.stopTravel} + restaurants ${d.mealTravel}${d.foodAccessUnknown ? " | food access UNKNOWN (lunch break)" : ""} | visits ${d.visits} min, end ${d.visitsEnd}, day end ${d.dayEnd}${d.problems.length ? " | PROBLEMS " + d.problems.join(",") : ""}${delta}`);
    console.log("    " + d.items.join(" | "));
    const s = splitDays?.find((x: any) => x.day === d.day);
    if (s) console.log(`    same order, lunch break instead: idle ${s.idle}, known travel ${s.travelKnown} (between visits ${s.stopTravel} + restaurants ${s.mealTravel}), visits end ${s.visitsEnd}, problems ${s.problems.length}`);
  }
  for (const e of log) console.log(`  [${e.stage} ${e.decision}${e.day ? " day " + e.day : ""}] ${e.reasons.join("; ") || "-"}${e.detail?.place ? ` (move ${e.detail.place} ${e.detail.from}->${e.detail.to}${e.detail.partner ? " swap " + e.detail.partner : ""})` : ""}${e.detail?.trial ? ` (trial ${e.detail.trial.order}: idle ${e.detail.trial.idle}, travel ${e.detail.trial.travel}, lunch ${e.detail.trial.lunch})` : ""}${e.detail?.assignment ? ` (${e.detail.assignment})` : ""}`);
}
if (outFile) writeFileSync(outFile, JSON.stringify(result, null, 1));

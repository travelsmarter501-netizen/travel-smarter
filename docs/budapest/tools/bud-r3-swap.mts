/* eslint-disable -- review script (not shipped): a limited, separate experiment; it does not change the planner. */
// Round 3, limited experiment: can the culture trip get its strong places back (areas by date) when ONE general swap between two days is
// allowed on top? For each area assignment of the undated plan to the trip's dates (the same construction as reviewDatedAreas: every
// current place kept, strong missing places added on an open date), every single swap of one place between two days (both open on their
// new date, evening places excluded) is built with the planner's own build + timing guard, each changed day in its best order (every
// order tried). Judged against the CURRENT final plan (8e8a309) with the same criteria as reviewDatedAreas: no schedule problem, every
// current place kept, on every date no restaurant lunch lost, travel within 90 or not above that date's current travel, no new wait of
// 60+ min, visits within 380 min, trip travel share at most +2 points, trip idle at most +30. Prints the best accepted plan, else the
// closest ones with their reasons.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-r3-swap.mts '<request json>' [out.json]
import { writeFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const Q = await imp("/app/lib/planner/budapest/budapestDayQuality.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const input = JSON.parse(process.argv[2]);
const city = M.BUDAPEST_CITY_MODULE;
let cap: any = null;
let final: any = null;
await P.generateCityPlanV2({ ...city, reviewResolvedPlan: (inp: any) => { cap = inp; final = city.reviewResolvedPlan(inp); return final; } }, input);
let undated: any = null;
await P.generateCityPlanV2({ ...city, reviewResolvedPlan: (inp: any) => { undated = inp.plan; return { plan: inp.plan, legsByDay: inp.legsByDay, data: inp.data }; } }, { ...input, dateMode: "flexible", durationDays: final.plan.days.length, arrivalDate: undefined, departureDate: undefined });
const relevance = city.placeRelevance(input.interests, !!input.surpriseMe);
const ctx = cap.context;
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const current = new Map<string, any>(final.plan.days.flatMap((d: any) => d.stops.map((s: any) => [s.placeId, s])));
const und = new Map<string, any>(undated.days.flatMap((d: any) => d.stops.map((s: any) => [s.placeId, s])));
const restored = [...und.keys()].filter((id) => !current.has(id) && relevance(id) >= 7);
const stopOf = (id: string) => current.get(id) ?? und.get(id);
const evening = (id: string) => M.BUDAPEST_CITY_MODULE.metadataById(id)?.preferredTime === "evening";
const open = (id: string, n: number) => (!ctx.isPlaceEligibleForDay || ctx.isPlaceEligibleForDay(id, n));
const legsFor = (stops: any[]) => stops.slice(0, -1).map((s: any, i: number) => city.routeLeg(s.placeId, stops[i + 1].placeId));
const perms = (a: any[]): any[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const dayNumbers = final.plan.days.map((d: any) => d.dayNumber);
const baseJ = final.data.days.map((d: any) => ({ q: Q.finalDayQuality(d) }));
const share = (js: any[]) => { const t = js.reduce((s, j) => s + j.q.travel, 0); const v = js.reduce((s, j) => s + j.q.visits, 0); return (100 * t) / (t + v); };
const baseIdle = baseJ.reduce((s: number, j: any) => s + j.q.idle, 0);
let builds = 0;
function buildDays(days: string[][]) {
  const plan = { ...final.plan, days: final.plan.days.map((d: any, i: number) => ({ ...d, stops: days[i].map(stopOf), totalVisitMinutes: days[i].reduce((s, id) => s + stopOf(id).visitDurationMinutes, 0) })) };
  builds++;
  return cap.build(plan, plan.days.map((d: any) => legsFor(d.stops)));
}
/** Best order for the changed days (every order of the non-evening places; evening places last), on the final schedule. */
function bestOrders(days: string[][], changed: number[]) {
  const out = days.map((d) => [...d]);
  for (const i of changed) {
    let best: any = null;
    for (const o of perms(out[i].filter((id) => !evening(id)))) {
      const trial = out.map((d, j) => (j === i ? [...o, ...out[i].filter((id) => evening(id))] : d));
      const data = buildDays(trial);
      if (data.days.some((d: any) => G.scheduleProblems(d).size)) continue;
      const cost = data.days.reduce((s: number, d: any) => s + Q.finalDayQuality(d).cost, 0);
      if (!best || cost < best.cost) best = { cost, order: trial[i] };
    }
    if (!best) return null;
    out[i] = best.order;
  }
  return out;
}
function judge(days: string[][]) {
  const data = buildDays(days);
  const js = data.days.map((d: any) => ({ q: Q.finalDayQuality(d), problems: G.scheduleProblems(d).size, d }));
  const reasons: string[] = [];
  js.forEach((j: any, i: number) => {
    const b = baseJ[i];
    if (j.problems) reasons.push(`day ${i + 1}: schedule problem`);
    if (b.q.lunch !== "break" && b.q.lunch !== "none" && (j.q.lunch === "break" || j.q.lunch === "none")) reasons.push(`day ${i + 1}: restaurant lunch lost (${b.q.lunch} -> lunch break)`);
    if (j.q.travel > 90 && j.q.travel > b.q.travel) reasons.push(`day ${i + 1}: travel ${j.q.travel}`);
    if (j.q.longestWait >= 60 && j.q.longestWait > b.q.longestWait) reasons.push(`day ${i + 1}: new wait ${j.q.longestWait}`);
    if (j.q.visits > 380 && j.q.visits > b.q.visits) reasons.push(`day ${i + 1}: visits ${j.q.visits}`);
  });
  const ids = new Set(days.flat());
  for (const id of current.keys()) if (!ids.has(id)) reasons.push(`current place lost: ${id}`);
  const s0 = share(baseJ), s1 = share(js);
  if (s1 - s0 > 2) reasons.push(`trip travel share ${s0.toFixed(1)}% -> ${s1.toFixed(1)}%`);
  const idle = js.reduce((s: number, j: any) => s + j.q.idle, 0);
  if (idle > baseIdle + 30) reasons.push(`trip idle ${baseIdle} -> ${idle}`);
  return { reasons, js, idle, share: s1, cost: js.reduce((s: number, j: any) => s + j.q.cost, 0) };
}
const wanted = new Set([...current.keys(), ...restored]);
const results: any[] = [];
for (const assignment of perms(undated.days.map((_: any, i: number) => i))) {
  let days: string[][] = dayNumbers.map((n: number, i: number) => undated.days[assignment[i]].stops.map((s: any) => s.placeId).filter((id: string) => wanted.has(id)));
  for (const id of current.keys()) if (!days.some((d) => d.includes(id))) { const i = dayNumbers.findIndex((n: number) => open(id, n)); if (i >= 0) days[i].push(id); }
  if (days.some((d, i) => d.some((id) => !open(id, dayNumbers[i])))) continue; // closed place on its date: this assignment needs a move, skipped here
  const base = bestOrders(days, days.map((_, i) => i));
  if (!base) continue;
  const label = (ds: string[][]) => ds.map((d, i) => `day ${i + 1}: ${d.join(", ")}`).join(" | ");
  const r0 = judge(base);
  results.push({ kind: "areas only", label: label(base), ...r0 });
  for (let i = 0; i < days.length; i++) for (let j = i + 1; j < days.length; j++) for (const a of base[i]) for (const b of base[j]) {
    if (evening(a) || evening(b) || !open(a, dayNumbers[j]) || !open(b, dayNumbers[i])) continue;
    const swapped = base.map((d) => [...d]);
    swapped[i] = swapped[i].map((x) => (x === a ? b : x));
    swapped[j] = swapped[j].map((x) => (x === b ? a : x));
    const ordered = bestOrders(swapped, [i, j]);
    if (!ordered) continue;
    results.push({ kind: `swap ${a} <-> ${b}`, label: label(ordered), ...judge(ordered) });
  }
}
results.sort((x, y) => x.reasons.length - y.reasons.length || x.cost - y.cost);
console.log(`current final: idle ${baseIdle}, share ${share(baseJ).toFixed(1)}%, restored candidates: ${restored.join(", ")}; candidates judged ${results.length}, builds ${builds}`);
const accepted = results.filter((r) => r.reasons.length === 0);
console.log(`accepted: ${accepted.length}`);
for (const r of [...accepted.slice(0, 3), ...results.filter((r) => r.reasons.length).slice(0, 6)]) {
  console.log(`\n${r.reasons.length ? "REJECTED" : "ACCEPTED"} ${r.kind}: idle ${r.idle}, share ${r.share.toFixed(1)}% ${r.reasons.length ? "| " + r.reasons.join("; ") : ""}`);
  r.js.forEach((j: any, i: number) => {
    const items = [...j.d.timeline.stops.map((s: any, k: number) => ({ s: s.startMinutes, t: `${hm(s.startMinutes)}-${hm(s.endMinutes)} ${s.placeId} (${j.d.stops[k].visitDurationMinutes} min)` })), ...j.d.timeline.meals.map((m: any) => ({ s: m.startMinutes, t: `${hm(m.startMinutes)}-${hm(m.endMinutes)} [${m.mealType}] ${m.placeId}` }))].sort((a, b) => a.s - b.s).map((x) => x.t);
    console.log(`  day ${i + 1} ${j.d.weekday}: idle ${j.q.idle}, known travel ${j.q.travel}${j.q.foodAccessUnknown ? " (food access unknown)" : ""}, lunch ${j.q.lunch}\n     ${items.join(" | ")}`);
  });
}
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify({ restored, builds, results: results.map(({ js, ...r }) => ({ ...r, days: js.map((j: any) => ({ weekday: j.d.weekday, order: j.q.order, idle: j.q.idle, travel: j.q.travel, lunch: j.q.lunch, foodAccessUnknown: j.q.foodAccessUnknown })) })) }, null, 1));

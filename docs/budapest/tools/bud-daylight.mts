/* eslint-disable -- review test (not shipped): loose typing on generated plans is intended. */
// Test (exit 1 on failure) of the Budapest daylight policy (budapestDaylight.ts), through the product paths only (generation, the edit
// decision, the plan as edited), so it runs on older code too and fails where the policy is missing:
//   1. "needs daylight" places: their official hours end by the monthly sunset ESTIMATE (+20 min, the estimate's spread) in every month.
//   2. Generation (both review samples, given as plan files): every "prefers daylight" stop (Citadella, Vajdahunyad, Margaret Island)
//      that ends after the estimate carries a note naming the estimate as an estimate; counts are printed per place.
//   3. Adding Vajdahunyad to food 22-24 Nov, day 3 (the case seen in the UI): it ends before the estimate when the day can hold it
//      there without a schedule problem and without making a visit already in the day start more than 30 min later; otherwise it
//      carries the note; never refused for daylight (the add is accepted).
//   4. A new start (10:00) on that edited day: any "prefers daylight" stop after the estimate carries the note (and only then).
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-daylight.mts <plans.json> [<plans.json> ...]
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const PL = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
// The policy under test (the same table as budapestDaylight.ts; kept here so the test also runs on code without that file).
const SUNSET = [0, 980, 1025, 1065, 1190, 1225, 1245, 1240, 1200, 1140, 1080, 975, 955];
const PREFERS = new Set(["citadella", "vajdahunyad-castle", "margaret-island"]);
const NEEDS = ["budapest-zoo"];
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const failures: string[] = [];
const isNote = (w: any, month: number) => typeof w?.textAr === "string" && w.textAr.includes("تقدير شهري") && w.textAr.includes(hm(SUNSET[month]));

// 1. "needs": official hours end by the estimate (+20) every month.
for (const id of NEEDS) {
  const place = PL.BUDAPEST_ATTRACTIONS.find((a: any) => a.id === id);
  for (let month = 1; month <= 12; month++) {
    const date = `2026-${String(month).padStart(2, "0")}-15`;
    const seasons = place?.hours?.seasonalSchedules ?? [];
    const season = seasons.find((s: any) => s.from <= date.slice(5) && date.slice(5) <= s.to);
    const closes = season ? Math.max(...Object.values<any>(season.schedule).flat().map((r: any) => Number(r.close.slice(0, 2)) * 60 + Number(r.close.slice(3, 5)))) : null;
    if (closes === null) { failures.push(`${id}: no season for ${date}`); continue; }
    if (closes > SUNSET[month] + 20) failures.push(`${id}: closes ${hm(closes)} in month ${month}, after the estimated sunset ${hm(SUNSET[month])} + 20`);
  }
}

// 2. Generated plans.
const counts: Record<string, { after: number; noted: number; total: number }> = {};
for (const file of process.argv.slice(2)) {
  for (const p of JSON.parse(readFileSync(file, "utf8"))) {
    for (const d of p.plan?.days ?? []) {
      const month = d.actualDate ? Number(d.actualDate.slice(5, 7)) : null;
      d.stops.forEach((s: any, i: number) => {
        if (!PREFERS.has(s.id)) return;
        const c = (counts[s.id] ??= { after: 0, noted: 0, total: 0 });
        c.total++;
        const w = d.timeline?.stops[i];
        if (!month || !w || w.endMinutes <= SUNSET[month]) return;
        c.after++;
        if (s.warnings.some((x: any) => isNote(x, month))) c.noted++;
        else failures.push(`${p.id} day ${d.dayNumber}: ${s.id} ends ${hm(w.endMinutes)} after the estimate ${hm(SUNSET[month])}, no note`);
      });
    }
  }
}
console.log("generated plans, prefers-daylight stops:", JSON.stringify(counts));

// 3 + 4. The edit path on food 22-24 Nov, day 3.
const input = { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-22", departureDate: "2026-11-24", interests: ["food"], accommodation: { booked: false } };
const city = M.BUDAPEST_CITY_MODULE;
const r: any = await P.generateCityPlanV2(city, input);
const base = r.data;
let edits: any = {};
const remove = C.decidePlanChange(city, base, edits, { kind: "remove", dayNumber: 3, placeId: "andrassy-avenue" });
edits = remove.ok ? remove.next : edits;
const add = C.decidePlanChange(city, base, edits, { kind: "add", dayNumber: 3, placeId: "vajdahunyad-castle" });
if (!add.ok) failures.push(`add vajdahunyad-castle refused (${add.code})`);
else {
  edits = add.next;
  const day = C.applyPlanCustomizations(city, base, edits).days[2];
  const i = day.stops.findIndex((s: any) => s.id === "vajdahunyad-castle");
  const w = day.timeline.stops[i];
  const month = 11;
  const noted = day.stops[i].warnings.some((x: any) => isNote(x, month));
  console.log(`add: day 3 order ${day.stops.map((s: any) => s.id).join(" > ")}; vajdahunyad ${hm(w.startMinutes)}-${hm(w.endMinutes)} (estimate ${hm(SUNSET[month])}), note ${noted}`);
  if (w.endMinutes > SUNSET[month] && !noted) failures.push(`add: vajdahunyad ends ${hm(w.endMinutes)} after the estimate, no note`);
  if (w.endMinutes <= SUNSET[month] && noted) failures.push(`add: note shown although vajdahunyad ends before the estimate`);
  // Could the day have held it before the estimate? (a position with no schedule problem, no visit already in the day starting more
  // than 30 min later than before the add, and an end before the estimate)
  const order = day.stops.map((s: any) => s.id).filter((id: string) => id !== "vajdahunyad-castle");
  const ref = C.applyPlanCustomizations(city, base, { ...edits, "3": { ...(edits["3"] ?? {}), order } }).days[2];
  const startBefore = new Map(ref.stops.map((s: any, k: number) => [s.id, ref.timeline.stops[k].startMinutes]));
  const positions: string[] = [];
  let possible = false;
  for (let k = 0; k <= order.length; k++) {
    const trial = { ...edits, "3": { ...(edits["3"] ?? {}), order: [...order.slice(0, k), "vajdahunyad-castle", ...order.slice(k)] } };
    const td = C.applyPlanCustomizations(city, base, trial).days[2];
    const tw = td.timeline.stops[td.stops.findIndex((s: any) => s.id === "vajdahunyad-castle")];
    const shift = Math.max(0, ...td.stops.map((s: any, q: number) => (s.id === "vajdahunyad-castle" ? 0 : td.timeline.stops[q].startMinutes - (startBefore.get(s.id) as number))));
    const problems = C.scheduleProblems(td).size;
    positions.push(`at ${k}: ${hm(tw.startMinutes)}-${hm(tw.endMinutes)}, problems ${problems}, latest shift of another visit +${shift}`);
    if (problems === 0 && shift <= 30 && tw.endMinutes <= SUNSET[month]) possible = true;
  }
  console.log("  positions tried: " + positions.join(" | "));
  if (possible && w.endMinutes > SUNSET[month]) failures.push(`add: a position before the estimate existed, but vajdahunyad was placed after it`);
  // 4. New start 10:00.
  const start = C.decidePlanChange(city, base, edits, { kind: "start", dayNumber: 3, minutes: 600 });
  if (start.ok) {
    const sd = C.applyPlanCustomizations(city, base, start.next).days[2];
    sd.stops.forEach((s: any, k: number) => {
      if (!PREFERS.has(s.id)) return;
      const sw = sd.timeline.stops[k];
      const n = s.warnings.some((x: any) => isNote(x, month));
      console.log(`start 10:00: ${s.id} ${hm(sw.startMinutes)}-${hm(sw.endMinutes)}, note ${n}`);
      if (sw.endMinutes > SUNSET[month] && !n) failures.push(`start 10:00: ${s.id} ends ${hm(sw.endMinutes)} after the estimate, no note`);
      if (sw.endMinutes <= SUNSET[month] && n) failures.push(`start 10:00: note shown although ${s.id} ends before the estimate`);
    });
  } else console.log(`start 10:00 not valid for this day (${start.code})`);
}
console.log(`failures ${failures.length}`);
for (const f of failures.slice(0, 30)) console.log("FAIL " + f);
process.exit(failures.length ? 1 : 0);

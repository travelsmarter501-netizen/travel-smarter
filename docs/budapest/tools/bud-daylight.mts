/* eslint-disable -- review test (not shipped): loose typing on generated plans is intended. */
// Test (exit 1 on failure) of the Budapest daylight policy (budapestDaylight.ts), through the product paths only (generation, the edit
// decision, the plan as edited), so it runs on older code too and fails where the policy is missing:
//   1. "needs daylight" places: they have official hours on every date (they are held by those hours); their closing time is printed
//      next to the monthly sunset ESTIMATE as a report (the estimate's error for a date is not known, so no margin is claimed).
//   2. Generation (both review samples, given as plan files): every "prefers daylight" stop (Citadella, Vajdahunyad, Margaret Island)
//      that ends after the estimate carries the approved note (with the month's estimated time); counts are printed per place.
//   3. Adding Vajdahunyad to food 22-24 Nov, day 3 (the case seen in the UI): it ends before the estimate when the day can hold it
//      there without a schedule problem and without making a visit already in the day start more than 30 min later; otherwise it
//      carries the note; never refused for daylight (the add is accepted).
//   4. A new start (10:00) on that edited day: any "prefers daylight" stop after the estimate carries the note (and only then).
//   5. Fixed sessions (2026-11-15, round 7): an add placed before the end never moves a visit held to a fixed session (a tour / admission
//      slot, metadata showWindow; a timetabled departure, hours startsAtOpening) to another session, even when the move is within the
//      general 30-min limit. Cases found by a search of 523 adds on 943b6df (House of Music 14:45 -> 15:15, the cruise 17:40 -> 18:00),
//      plus the Opera case of part 3, which must stay as it is (Vajdahunyad at the end, the Opera tour at 15:00).
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
const fixedSession = (s: any) => !!M.BUDAPEST_CITY_MODULE.metadataById(s.id)?.showWindow || !!s.hours?.startsAtOpening;
// The approved note (owner, 2026-11-15), with the month's estimate.
const isNote = (w: any, month: number) => w?.textAr === `الأفضل تزوره بضوّ النهار. الغروب حوالي ${hm(SUNSET[month])} حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك.`;

// 1. "needs": official hours on every date; closing time vs the estimate, reported.
for (const id of NEEDS) {
  const place = PL.BUDAPEST_ATTRACTIONS.find((a: any) => a.id === id);
  for (let month = 1; month <= 12; month++) {
    const date = `2026-${String(month).padStart(2, "0")}-15`;
    const seasons = place?.hours?.seasonalSchedules ?? [];
    const season = seasons.find((s: any) => s.from <= date.slice(5) && date.slice(5) <= s.to);
    const closes = season ? Math.max(...Object.values<any>(season.schedule).flat().map((r: any) => Number(r.close.slice(0, 2)) * 60 + Number(r.close.slice(3, 5)))) : null;
    if (closes === null) { failures.push(`${id}: no season for ${date}`); continue; }
    console.log(`${id} month ${month}: closes ${hm(closes)}, estimate ${hm(SUNSET[month])}${closes > SUNSET[month] ? ` (after the estimate by ${closes - SUNSET[month]} min)` : ""}`);
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
  // than 30 min later than before the add, every fixed session kept, and an end before the estimate)
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
    const sessionMoved = td.stops.some((s: any, q: number) => s.id !== "vajdahunyad-castle" && fixedSession(s) && td.timeline.stops[q].startMinutes !== startBefore.get(s.id));
    positions.push(`at ${k}: ${hm(tw.startMinutes)}-${hm(tw.endMinutes)}, problems ${problems}, latest shift of another visit +${shift}${sessionMoved ? ", fixed session moved" : ""}`);
    if (problems === 0 && shift <= 30 && !sessionMoved && tw.endMinutes <= SUNSET[month]) possible = true;
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
  // 5, the Opera case: unchanged (the tour keeps 15:00, Vajdahunyad stays at the end).
  const opera = day.stops.findIndex((s: any) => s.id === "opera-house-tour");
  if (opera < 0 || hm(day.timeline.stops[opera].startMinutes) !== "15:00") failures.push(`opera case: the Opera tour no longer at 15:00`);
  if (i !== day.stops.length - 1) failures.push(`opera case: vajdahunyad no longer at the end`);
}

// 5. Fixed sessions kept when the add goes before the end.
const sessionCases = [
  { interests: ["nightlife"], arrivalDate: "2026-11-22", departureDate: "2026-11-25", dayNumber: 3, placeId: "vajdahunyad-castle", session: "house-of-music" },
  { interests: ["nightlife"], arrivalDate: "2026-12-01", departureDate: "2026-12-04", dayNumber: 3, placeId: "vajdahunyad-castle", session: "house-of-music" },
  { interests: ["food"], arrivalDate: "2026-10-20", departureDate: "2026-10-21", dayNumber: 1, placeId: "margaret-island", session: "danube-legend-cruise" },
  { interests: ["nightlife"], arrivalDate: "2026-10-20", departureDate: "2026-10-23", dayNumber: 1, placeId: "vajdahunyad-castle", session: "danube-legend-cruise" },
];
for (const c of sessionCases) {
  const g: any = await P.generateCityPlanV2(city, { destinationId: "budapest", dateMode: "specific", arrivalDate: c.arrivalDate, departureDate: c.departureDate, interests: c.interests, accommodation: { booked: false } });
  const b = g.data;
  const before = b.days[c.dayNumber - 1];
  const startBefore = new Map(before.stops.map((s: any, k: number) => [s.id, before.timeline.stops[k].startMinutes]));
  const label = `${c.interests.join("+")} ${c.arrivalDate} day ${c.dayNumber} add ${c.placeId}`;
  if (!startBefore.has(c.session)) { failures.push(`${label}: case no longer has ${c.session} (regenerate the case list)`); continue; }
  const d = C.decidePlanChange(city, b, {}, { kind: "add", dayNumber: c.dayNumber, placeId: c.placeId });
  if (!d.ok) { failures.push(`${label}: add refused (${d.code})`); continue; }
  const after = C.applyPlanCustomizations(city, b, d.next).days[c.dayNumber - 1];
  const at = after.stops.findIndex((s: any) => s.id === c.placeId);
  const w = after.timeline.stops[at];
  const moved = after.stops.flatMap((s: any, k: number) => (s.id !== c.placeId && fixedSession(s) && after.timeline.stops[k].startMinutes !== startBefore.get(s.id) ? [`${s.id} ${hm(startBefore.get(s.id) as number)} -> ${hm(after.timeline.stops[k].startMinutes)}`] : []));
  const atEnd = at === after.stops.length - 1;
  console.log(`${label}: position ${at}${atEnd ? " (end)" : ""}, ${hm(w.startMinutes)}-${hm(w.endMinutes)}, ${c.session} ${hm(after.timeline.stops[after.stops.findIndex((s: any) => s.id === c.session)].startMinutes)} (before ${hm(startBefore.get(c.session) as number)})${moved.length ? ", moved: " + moved.join(", ") : ""}`);
  if (!atEnd && moved.length) failures.push(`${label}: placed before the end, moving a fixed session (${moved.join(", ")})`);
}
console.log(`failures ${failures.length}`);
for (const f of failures.slice(0, 30)) console.log("FAIL " + f);
process.exit(failures.length ? 1 : 0);

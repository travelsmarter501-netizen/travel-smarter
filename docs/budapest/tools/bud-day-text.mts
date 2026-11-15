/* eslint-disable -- review test (not shipped): loose typing on generated plans is intended. */
// Test (exit 1 on failure): Budapest day titles and summaries describe the places the day has NOW (round 7, 2026-11-15).
//   1. Generated plans (sample files): no Arabic "و" glued to a Latin name in a title or summary (it renders «Andrássyو» in RTL).
//   2. Edits through the product path (decidePlanChange + applyPlanCustomizations) on every day of the given plans:
//      - removing each stop (days of 2+ stops): the title and summary never name the removed place (its name in the summary; the
//        area words that name it in the title: Andrássy, الأوبرا, البرلمان, الكاتدرائية), and the summary lists exactly the day's stops;
//      - adding the first add candidate: the summary names it;
//      - the result is the same after a save and reopen (the stored edits go through JSON and are applied again to the stored base).
//   3. A day the customer did not change keeps its generated title and summary.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-day-text.mts <plans.json> [<plans.json> ...]
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const city = M.BUDAPEST_CITY_MODULE;
const failures: string[] = [];
const glued = /و[A-Za-zÀ-ž]/;
// The words of a title that name one place (area labels built from places).
const TITLE_WORDS: Record<string, string> = { "andrassy-avenue": "Andrássy", "opera-house-tour": "الأوبرا", "parliament-exterior": "البرلمان", "st-stephens-basilica": "الكاتدرائية" };
const nameOf = (base: any, id: string) => base.placeDetails?.[id]?.name ?? base.days.flatMap((d: any) => d.stops).find((s: any) => s.id === id)?.name ?? id;
let days = 0, removes = 0, adds = 0, titlesChanged = 0;

function check(label: string, base: any, edits: any, dayNumber: number, removed: string | null, added: string | null) {
  const plan = C.applyPlanCustomizations(city, base, edits);
  const reopened = C.applyPlanCustomizations(city, JSON.parse(JSON.stringify(base)), JSON.parse(JSON.stringify(edits)));
  const day = plan.days[dayNumber - 1];
  const again = reopened.days[dayNumber - 1];
  if (day.title !== again.title || day.summary !== again.summary) failures.push(`${label}: title / summary differ after save and reopen`);
  if (glued.test(day.title) || glued.test(day.summary)) failures.push(`${label}: «و» glued to a Latin name: ${day.title} | ${day.summary}`);
  const names = day.stops.map((s: any) => s.name);
  for (const n of names) if (!day.summary.includes(n)) failures.push(`${label}: summary misses ${n}: ${day.summary}`);
  if (removed) {
    const n = nameOf(base, removed);
    if (day.summary.includes(n) && !names.some((x: string) => x.includes(n))) failures.push(`${label}: summary still names removed ${n}`);
    const w = TITLE_WORDS[removed];
    const stillThere = w && day.stops.some((s: any) => TITLE_WORDS[s.id] === w);
    if (w && !stillThere && day.title.includes(w)) failures.push(`${label}: title still names removed ${removed}: ${day.title}`);
  }
  if (added && !day.summary.includes(day.stops.find((s: any) => s.id === added)?.name ?? added)) failures.push(`${label}: summary misses added ${added}`);
  plan.days.forEach((d: any, i: number) => {
    if (i === dayNumber - 1) return;
    if (d.title !== base.days[i].title || d.summary !== base.days[i].summary) failures.push(`${label}: unchanged day ${i + 1} got a new title / summary`);
  });
  return day;
}

for (const file of process.argv.slice(2)) {
  for (const p of JSON.parse(readFileSync(file, "utf8"))) {
    const base = p.plan;
    if (!base) continue;
    for (const d of base.days) {
      days++;
      if (glued.test(d.title) || glued.test(d.summary)) failures.push(`${p.id} day ${d.dayNumber}: generated «و» glued to a Latin name: ${d.title} | ${d.summary}`);
      if (d.stops.length >= 2) {
        for (const s of d.stops) {
          const r = C.decidePlanChange(city, base, {}, { kind: "remove", dayNumber: d.dayNumber, placeId: s.id });
          if (!r.ok) continue;
          removes++;
          const day = check(`${p.id} day ${d.dayNumber} remove ${s.id}`, base, r.next, d.dayNumber, s.id, null);
          if (day.title !== d.title) titlesChanged++;
        }
      }
      const cand = C.addCandidates(city, base, {}, d.dayNumber)[0];
      if (cand) {
        const a = C.decidePlanChange(city, base, {}, { kind: "add", dayNumber: d.dayNumber, placeId: cand });
        if (a.ok) { adds++; check(`${p.id} day ${d.dayNumber} add ${cand}`, base, a.next, d.dayNumber, null, cand); }
      }
    }
  }
}
console.log(`days ${days}, removes ${removes} (title changed in ${titlesChanged}), adds ${adds}, failures ${failures.length}`);
for (const f of failures.slice(0, 25)) console.log("FAIL " + f);
if (failures.length > 25) console.log(`... ${failures.length - 25} more`);
process.exit(failures.length ? 1 : 0);

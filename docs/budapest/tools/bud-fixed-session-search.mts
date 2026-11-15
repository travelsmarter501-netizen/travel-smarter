/* eslint-disable -- review tool (not shipped): loose typing on generated plans is intended. */
/* Search: adds of a "prefers daylight" place whose chosen position (not the end) moves a fixed-session visit to another session. */
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-fixed-session-search.mts
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const city = M.BUDAPEST_CITY_MODULE;
const PREFERS = ["citadella", "vajdahunyad-castle", "margaret-island"];
const fixed = (s: any) => !!city.metadataById(s.id)?.showWindow || !!s.hours?.startsAtOpening;
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const sets = [["cultureHistory"], ["food"], ["popular"], ["shopping"], ["natureViews"], ["nightlife"], ["cultureHistory", "food"], ["popular", "natureViews"], ["footballExperiences"], ["cultureHistory", "natureViews"]];
const starts = ["2026-11-19", "2026-11-22", "2026-11-25", "2026-12-01", "2026-12-06", "2027-01-10", "2027-01-14", "2027-02-03", "2026-10-20", "2027-03-02"];
let found = 0, adds = 0;
for (const interests of sets) for (const arrival of starts) for (const n of [2, 3, 4]) {
  const d = new Date(arrival + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n - 1);
  const input = { destinationId: "budapest", dateMode: "specific", arrivalDate: arrival, departureDate: d.toISOString().slice(0, 10), interests, accommodation: { booked: false } };
  const r: any = await P.generateCityPlanV2(city, input);
  if (!r?.ok && !r?.data) continue;
  const base = r.data;
  for (const day of base.days) {
    const cands = C.addCandidates(city, base, {}, day.dayNumber).filter((id: string) => PREFERS.includes(id));
    for (const placeId of cands) {
      const dec = C.decidePlanChange(city, base, {}, { kind: "add", dayNumber: day.dayNumber, placeId });
      if (!dec.ok) continue;
      adds++;
      const after = C.applyPlanCustomizations(city, base, dec.next).days[day.dayNumber - 1];
      const order = after.stops.map((s: any) => s.id);
      if (order[order.length - 1] === placeId) continue;
      const before = new Map(day.stops.map((s: any, i: number) => [s.id, day.timeline.stops[i].startMinutes]));
      after.stops.forEach((s: any, i: number) => {
        if (s.id === placeId || !fixed(s)) return;
        const a = after.timeline.stops[i].startMinutes, b = before.get(s.id) as number;
        if (a !== b) { found++; console.log(`${interests.join("+")} ${arrival} x${n} day ${day.dayNumber} add ${placeId} at ${order.indexOf(placeId)}: ${s.id} ${hm(b)} -> ${hm(a)} | ${order.join(" > ")}`); }
      });
    }
  }
}
console.log(`adds ${adds}, fixed sessions moved by an earlier position ${found}`);

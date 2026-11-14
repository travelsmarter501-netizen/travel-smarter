// Compares two Budapest sample files day by day (same case ids). Each changed day gets ONE class, the first that applies:
//   places   = the set of scheduled places changed (a place added, removed or moved to another day)
//   order    = same places, different order
//   meals    = same stops and order, different restaurants (or lunch break)
//   times    = same stops, order and meals, different clock times
//   notes    = only texts changed (transfer notes, suggestions, warnings)
// Usage: node docs/budapest/tools/bud-compare.mjs before.json after.json [--list]
import { readFileSync } from "fs";
const [, , beforePath, afterPath, flag] = process.argv;
const load = (p) => new Map(JSON.parse(readFileSync(p, "utf8")).map((x) => [x.id, x.plan]));
const A = load(beforePath), B = load(afterPath);
const c = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const stops = (d) => d.stops.map((s) => s.id);
const meals = (d) => (d.timeline?.meals ?? []).map((m) => `${m.mealType}:${m.placeId}`).join(",");
const times = (d) => JSON.stringify([d.timeline?.stops?.map((s) => [s.startMinutes, s.endMinutes]), d.timeline?.meals?.map((m) => [m.startMinutes, m.endMinutes])]);
const strip = (d) => JSON.stringify({ ...d, timeline: undefined });
const line = (d) => d.timeline.stops.map((s) => `${c(s.startMinutes)} ${s.placeId}`).join(" | ") + (meals(d) ? `  [${(d.timeline.meals ?? []).map((m) => `${m.mealType} ${c(m.startMinutes)} ${m.placeId}`).join(", ")}]` : "");
const counts = { days: 0, same: 0, places: 0, order: 0, meals: 0, times: 0, notes: 0, missing: 0 };
const lists = { places: [], order: [], meals: [], times: [], notes: [] };
for (const [id, pa] of A) {
  const pb = B.get(id);
  if (!pb) { counts.missing++; continue; }
  // Optional suggestions moved between days count as "places" only if scheduled stops change; compare trip-wide sets too.
  for (const da of pa.days) {
    counts.days++;
    const db = pb.days.find((d) => d.dayNumber === da.dayNumber);
    if (!db) { counts.missing++; continue; }
    const tag = `${id} d${da.dayNumber} ${da.weekday ?? "flex"}`;
    const sa = stops(da), sb = stops(db);
    let cls = null;
    if ([...sa].sort().join() !== [...sb].sort().join()) cls = "places";
    else if (sa.join() !== sb.join()) cls = "order";
    else if (meals(da) !== meals(db)) cls = "meals";
    else if (times(da) !== times(db)) cls = "times";
    else if (strip(da) !== strip(db)) cls = "notes";
    if (!cls) { counts.same++; continue; }
    counts[cls]++;
    lists[cls].push(`${tag}\n      before: ${line(da)}\n      after:  ${line(db)}`);
  }
}
console.log(JSON.stringify(counts));
if (flag === "--list") for (const k of ["places", "order", "meals", "times"]) { if (lists[k].length) { console.log(`\n== ${k} (${lists[k].length})`); lists[k].forEach((x) => console.log("  " + x)); } }

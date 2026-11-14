/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
import { readFileSync } from "fs";
const plans = JSON.parse(readFileSync(process.argv[2], "utf8"));
// Usage: node bud-recount.mjs <plans json> <path to budapestCheckedTransit.ts>
// Unified definition: consecutive displayed items; walking / transit checked in that direction / transit whose REVERSE was checked
// (counted separately) / transit estimate / arrival at a lunch break (no point, no leg).
const checkedSrc = readFileSync(process.argv[3], "utf8");
const checkedKeys = new Set([...checkedSrc.matchAll(/"([a-z0-9-]+>[a-z0-9-]+)": (?:rec\(|\d)/g)].map((m) => m[1]));
const c = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const mid = (o) => Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2);
// transitDirect = shown as a Google check of that direction; transitReverse = ESTIMATE shown, only the opposite direction was checked;
// transitEstimate = estimate, no check either way; other = a Google note on an unchecked direction (must stay 0).
const n = { walk: 0, transitDirect: 0, transitReverse: 0, transitEstimate: 0, toLunchBreakNoPoint: 0, fromLunchBreak: 0, other: 0 };
const estPairs = new Map(), reverse = [];
const transitDistinct = new Set();
let late = [], gerbeaudMeals = 0, outsideMfa = 0, footOnTransit = 0, lateStartIdle = [];
for (const p of plans) for (const d of p.plan.days) {
  const items = [...d.timeline.stops.map((s, i) => ({ k: "s", i, id: s.placeId, s: s.startMinutes, e: s.endMinutes })), ...(d.timeline.meals ?? []).map((m) => ({ k: m.mealType, id: m.placeId, s: m.startMinutes, e: m.endMinutes }))].sort((a, b) => a.s - b.s);
  for (const m of d.timeline.meals ?? []) if (m.placeId === "gerbeaud" && m.mealType !== "coffee") gerbeaudMeals++;
  for (const st of d.stops) if (st.id === "museum-of-fine-arts" && st.visitMode === "outside") outsideMfa++;
  const first = items[0];
  if (first && first.s > 9 * 60) late.push(`${p.id} d${d.dayNumber} ${d.weekday ?? "flex"}: first ${first.id} ${c(first.s)} (idle from 09:00: ${first.s - 540} min)`);
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1], b = items[j];
    const leg = a.k === "s" && b.k === "s" ? d.legs[a.i] : d.mealLegs?.[`${a.id}::${b.id}`];
    if (!leg) { if (b.id === "lunch-break") n.toLunchBreakNoPoint++; else if (a.id === "lunch-break") n.fromLunchBreak++; else n.other++; continue; }
    const o = leg.options.find((x) => x.mode === leg.recommendedMode);
    const key = `${leg.fromPlaceId}>${leg.toPlaceId}`;
    if (o.mode === "walking") { n.walk++; continue; }
    transitDistinct.add(key);
    if ((leg.routeUrl ?? "").includes("fossgis_osrm_foot")) footOnTransit++;
    // Classified by the note the plan actually carries (what the customer sees), then by why an estimate is an estimate.
    if ((o.note ?? "").includes("Google")) { n.transitDirect++; if (!checkedKeys.has(key)) n.other++; }
    else if (checkedKeys.has(`${leg.toPlaceId}>${leg.fromPlaceId}`)) { n.transitReverse++; reverse.push(`${p.id} d${d.dayNumber} ${key}`); }
    else { n.transitEstimate++; estPairs.set(key, (estPairs.get(key) ?? 0) + 1); }
  }
}
console.log(n, { estimatedDirectionalPairs: estPairs.size, transitDistinctDirectionalPairs: transitDistinct.size, footUrlOnTransit: footOnTransit, gerbeaudMeals, outsideMfa });
console.log("REVERSE:", reverse.join(" | "));
console.log("LATE FIRST VISITS:", late.length); late.forEach((x) => console.log("  " + x));

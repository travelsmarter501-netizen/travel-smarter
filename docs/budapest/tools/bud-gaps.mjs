/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
import { readFileSync } from "fs";
const plans = JSON.parse(readFileSync(process.argv[2], "utf8"));
const c = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const mid = (o) => Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2);
let days = 0, idle = [], lunchBreaks = [], transitEst = 0, transitChecked = 0, walks = 0, unresolved = 0;
for (const p of plans) for (const d of p.plan.days) {
  days++;
  const items = [...d.timeline.stops.map((s, i) => ({ k: "s", i, id: s.placeId, s: s.startMinutes, e: s.endMinutes })), ...(d.timeline.meals ?? []).map((m) => ({ k: m.mealType, id: m.placeId, s: m.startMinutes, e: m.endMinutes }))].sort((a, b) => a.s - b.s);
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1], b = items[j];
    const leg = a.k === "s" && b.k === "s" ? d.legs[a.i] : d.mealLegs?.[`${a.id}::${b.id}`];
    const o = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((x) => x.mode === leg.recommendedMode) : null;
    if (leg?.sourceStatus === "unresolved") unresolved++;
    if (o) { if (o.mode === "walking") walks++; else if (/Google/.test(o.note ?? "")) transitChecked++; else transitEst++; }
    const t = o ? mid(o) : 0;
    const extra = b.s - a.e - t - 15;
    if (extra >= 30) idle.push(`${p.id} d${d.dayNumber} ${d.weekday ?? ""}: ${c(a.e)} ${a.id} -> ${c(b.s)} ${b.id}: idle ~${extra} min (beyond travel ${t} + 15 margin)`);
  }
  for (const m of d.timeline.meals ?? []) if (m.placeId === "lunch-break") { const prev = items.filter((x) => x.e <= m.startMinutes && x.k === "s").pop(); lunchBreaks.push(`${p.id} d${d.dayNumber}: after ${prev?.id}`); }
}
console.log({ days, walks, transitChecked, transitEst, unresolved });
console.log("IDLE >= 30 min beyond travel+margin:"); idle.forEach((x) => console.log("  " + x));
console.log("LUNCH BREAKS (no restaurant):"); lunchBreaks.forEach((x) => console.log("  " + x));

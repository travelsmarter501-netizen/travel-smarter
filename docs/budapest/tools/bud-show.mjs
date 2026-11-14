/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
import { readFileSync } from "fs";
const [, , file, ...ids] = process.argv;
const plans = JSON.parse(readFileSync(file, "utf8"));
const c = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const mid = (o) => Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2);
const legTxt = (l) => { if (!l) return "leg ?"; if (l.sourceStatus === "unresolved") return "leg UNRESOLVED"; const o = l.options.find((x) => x.mode === l.recommendedMode) ?? l.options[0]; const src = /Google/.test(o.note ?? "") ? "checked-Google" : /OpenStreetMap/.test(o.note ?? "") ? "OSM-route" : "estimate"; return `${o.mode} ${o.durationMinutesMin}-${o.durationMinutesMax} min${o.distanceKm ? " " + o.distanceKm + " km" : ""} [${src}]`; };
for (const p of plans.filter((x) => !ids.length || ids.includes(x.id))) {
  console.log(`\n######## ${p.id}  (${p.c.dateMode === "specific" ? p.c.arrivalDate + ".." + p.c.departureDate : p.c.durationDays + " days flexible"})  days=${p.plan.daysGenerated}`);
  let total = 0, unknown = [];
  for (const d of p.plan.days) {
    console.log(`--- Day ${d.dayNumber} ${d.actualDate ?? ""} ${d.weekday ?? ""} | ${d.title}`);
    const items = [...d.timeline.stops.map((s, i) => ({ kind: "stop", i, id: s.placeId, s: s.startMinutes, e: s.endMinutes })), ...(d.timeline.meals ?? []).map((m) => ({ kind: m.mealType, id: m.placeId, s: m.startMinutes, e: m.endMinutes, after: m.afterStopIndex }))].sort((a, b) => a.s - b.s || (a.kind === "stop" ? -1 : 1));
    let prev = null;
    for (const it of items) {
      if (prev) {
        let leg = null;
        if (prev.kind === "stop" && it.kind === "stop") leg = d.legs[prev.i];
        else leg = d.mealLegs?.[`${prev.id}::${it.id}`] ?? null;
        const lm = leg && leg.sourceStatus !== "unresolved" ? mid(leg.options.find((x) => x.mode === leg.recommendedMode) ?? leg.options[0]) : null;
        const gap = it.s - prev.e;
        console.log(`        ↓ ${legTxt(leg)} | gap ${gap} min${lm !== null ? ` = travel ~${lm} + margin/rounding/wait ${gap - lm}` : ""}`);
      }
      const stop = it.kind === "stop" ? d.stops[it.i] : null;
      const meal = it.kind !== "stop" ? d.mealStops.find((m) => m.id === it.id || (it.id === "lunch-break" && m.kind === "meal" && m.mealType === it.kind)) : null;
      let extra = "";
      if (stop) { const t = stop.ticket; extra = ` | ${stop.visitMode === "outside" ? "OUTSIDE " : ""}${t ? (t.amount === null ? "price ?" : t.amount + " " + t.currency) : "-"}${(stop.warnings ?? []).length ? " | ⚠ " + stop.warnings.map((w) => w.textAr.slice(0, 60)).join(" / ") : ""}`; if (t?.amount) total += t.amount; if (t && t.amount === null) unknown.push(stop.id); }
      console.log(`  ${c(it.s)}-${c(it.e)} ${it.kind === "stop" ? "" : "[" + it.kind + "] "}${stop?.name ?? meal?.name ?? it.id}${extra}`);
      prev = it;
    }
    const opt = (d.optionalNearby ?? []).map((o) => `${o.id}: ${o.reason}`);
    if (opt.length) console.log(`  suggestions: ${opt.join(" | ")}`);
  }
  console.log(`  ENTRY KNOWN TOTAL ${total} HUF; unknown price: ${unknown.join(", ") || "none"}`);
}

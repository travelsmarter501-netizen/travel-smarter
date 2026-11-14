// Day quality, side by side for several sample files: first visit, waits (time beyond the shown transfer + the shared 15-minute margin),
// transfers (walk / transit minutes, estimates marked ≈), lunch, end of program. Same wait definition as bud-gaps.mjs.
// Usage: node docs/budapest/tools/bud-dayq.mjs "A-2026-11-19 d3,B-2026-11-22 d2" s5.json s6.json s7.json
//        (first argument "@before.json:after.json" = every day whose ORDER differs between the two files)
import { readFileSync } from "fs";
const [, , which, ...files] = process.argv;
const load = (p) => new Map(JSON.parse(readFileSync(p, "utf8")).map((x) => [x.id, x.plan]));
const plans = files.map(load);
const c = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const mid = (o) => Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2);
let targets;
if (which.startsWith("@")) {
  const [a, b] = which.slice(1).split(":").map(load);
  targets = [];
  for (const [id, pa] of a) for (const d of pa.days) {
    const db = b.get(id)?.days.find((x) => x.dayNumber === d.dayNumber);
    const sa = d.stops.map((s) => s.id), sb = db?.stops.map((s) => s.id) ?? [];
    if ([...sa].sort().join() === [...sb].sort().join() && sa.join() !== sb.join()) targets.push([id, d.dayNumber]);
  }
} else targets = which.split(",").map((t) => { const [id, d] = t.trim().split(" d"); return [id, Number(d)]; });

function quality(d) {
  const items = [...d.timeline.stops.map((s, i) => ({ k: "s", i, id: s.placeId, s: s.startMinutes, e: s.endMinutes })), ...(d.timeline.meals ?? []).map((m) => ({ k: m.mealType, id: m.placeId, s: m.startMinutes, e: m.endMinutes }))].sort((a, b) => a.s - b.s || (a.k === "s" ? -1 : 1));
  let waitTotal = 0, waitMax = 0, walkMin = 0, transitMin = 0, est = 0;
  const legsTxt = [];
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1], b = items[j];
    let o = null, label = "";
    if (b.id === "lunch-break") label = "→lunch here";
    else {
      const leg = a.k === "s" && b.k === "s" ? d.legs[a.i] : d.mealLegs?.[`${a.id}::${b.id}`];
      o = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((x) => x.mode === leg.recommendedMode) : null;
      if (o) { const m = mid(o); if (o.mode === "walking") walkMin += m; else transitMin += m; if (leg.sourceStatus === "estimated" && !/Google/.test(o.note ?? "")) est++; label = `${o.mode === "walking" ? "walk" : "transit"} ${m}${leg.sourceStatus === "estimated" && !/Google/.test(o.note ?? "") ? "≈" : ""}`; }
      else label = "NO LEG";
    }
    const wait = b.s - a.e - (o ? mid(o) : 0) - 15;
    if (wait > 0) { waitTotal += wait; waitMax = Math.max(waitMax, wait); }
    legsTxt.push(`${label}${wait >= 30 ? ` +wait ${wait}` : ""}`);
  }
  const lunch = (d.timeline.meals ?? []).find((m) => m.mealType === "lunch");
  const firstStop = d.timeline.stops[0];
  const lastStop = d.timeline.stops[d.timeline.stops.length - 1];
  return {
    line: items.map((x, j) => `${c(x.s)} ${x.k === "s" ? x.id : `[${x.k} ${x.id}]`}${j < legsTxt.length ? `  —${legsTxt[j]}→ ` : ""}`).join(""),
    first: firstStop ? c(firstStop.startMinutes) : "-",
    end: lastStop ? c(lastStop.endMinutes) : "-",
    waitTotal, waitMax, walkMin, transitMin, est,
    lunch: lunch ? `${lunch.placeId === "lunch-break" ? "break" : lunch.placeId} ${c(lunch.startMinutes)}` : "none",
  };
}
const totals = files.map(() => ({ wait: 0, wait30: 0, walk: 0, transit: 0, est: 0 }));
for (const [id, dn] of targets) {
  console.log(`\n### ${id} d${dn} ${plans[0].get(id)?.days.find((x) => x.dayNumber === dn)?.weekday ?? "flex"}`);
  files.forEach((f, k) => {
    const d = plans[k].get(id)?.days.find((x) => x.dayNumber === dn);
    if (!d) return console.log(`  ${f}: missing`);
    const q = quality(d);
    totals[k].wait += q.waitTotal; totals[k].wait30 += q.waitMax >= 30 ? 1 : 0; totals[k].walk += q.walkMin; totals[k].transit += q.transitMin; totals[k].est += q.est;
    console.log(`  ${f.replace(/.*[\\/]/, "")}: first ${q.first} · end ${q.end} · lunch ${q.lunch} · wait ${q.waitTotal} min (max ${q.waitMax}) · walk ${q.walkMin} · transit ${q.transitMin} (${q.est} estimated)`);
    console.log(`      ${q.line}`);
  });
}
console.log(`\nTOTALS over ${targets.length} days:`);
files.forEach((f, k) => console.log(`  ${f.replace(/.*[\\/]/, "")}: wait ${totals[k].wait} min, days with a wait >= 30: ${totals[k].wait30}, walk ${totals[k].walk} min, transit ${totals[k].transit} min, estimated transit legs ${totals[k].est}`));

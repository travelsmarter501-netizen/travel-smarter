// Shopping 22-24 Nov: before (B1 + fix 1, round 5 sample run 1 = 943b6df minus the daylight rule) vs after (943b6df). Same wait /
// travel definitions as finalDayQuality (budapestDayQuality.ts): a wait is the gap minus the known transfer minus 15.
import { readFileSync } from "fs";
const [beforeFile, afterFile] = process.argv.slice(2);
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const names = { "andrassy-avenue": "Andrássy", "parliament-exterior": "Parliament (outside)", "chain-bridge": "Chain Bridge", "shoes-on-the-danube": "Shoes on the Danube", "opera-house-tour": "Opera tour", "hungarikum-bisztro": "Hungarikum (lunch)", "menza": "Menza (lunch)", "st-stephens-basilica": "St Stephen's", "fishermans-bastion": "Fisherman's Bastion", "matthias-church-exterior": "Matthias (outside)", "hungarian-national-gallery": "National Gallery", "21-restaurant": "21 Restaurant (lunch)", "citadella": "Citadella", "great-market-hall": "Great Market Hall", "vaci-utca": "Váci utca", "gozsdu-udvar": "Gozsdu", "new-york-cafe": "New York Café (lunch)", "frici-papa": "Frici Papa (lunch)", "arena-mall": "Arena Mall", "danube-legend-cruise": "Legenda cruise" };
const nm = (id, kind) => (names[id] ?? id) + (kind === "dinner" ? " (dinner)" : kind === "lunch" && !names[id]?.includes("lunch") ? " (lunch)" : "");
function day(d) {
  const t = d.timeline;
  const items = [...t.stops.map((s, i) => ({ kind: "stop", index: i, id: s.placeId, start: s.startMinutes, end: s.endMinutes })), ...t.meals.map((m) => ({ kind: m.mealType, index: -1, id: m.placeId, start: m.startMinutes, end: m.endMinutes }))].sort((a, b) => a.start - b.start);
  let idle = Math.max(0, (t.stops[0]?.startMinutes ?? 540) - 540), travel = 0, longest = { wait: 0, where: "-" };
  const parts = [`${nm(items[0].id, items[0].kind)} ${hm(items[0].start)}–${hm(items[0].end)}`];
  for (let j = 1; j < items.length; j++) {
    const a = items[j - 1], b = items[j];
    let minutes = 0;
    if (b.id !== "lunch-break") {
      const leg = a.kind === "stop" && b.kind === "stop" ? d.legs[a.index] : d.mealLegs?.[`${a.id}::${b.id}`];
      const o = leg && leg.sourceStatus !== "unresolved" ? leg.options.find((x) => x.mode === leg.recommendedMode) : undefined;
      minutes = o ? Math.round((o.durationMinutesMin + o.durationMinutesMax) / 2) : 0;
    }
    travel += minutes;
    const wait = b.kind !== "dinner" ? Math.max(0, b.start - a.end - minutes - 15) : 0;
    idle += wait;
    if (wait > longest.wait) longest = { wait, where: `${nm(a.id, a.kind)} → ${nm(b.id, b.kind)}` };
    parts.push(`${nm(b.id, b.kind)} ${hm(b.start)}–${hm(b.end)}`);
  }
  return { date: `${d.weekday} ${d.actualDate}`, schedule: parts.join(" → "), idle, travel, longest };
}
const get = (f) => JSON.parse(readFileSync(f, "utf8")).find((p) => p.id === "shopping-2026-11-22").plan.days.map(day);
const B = get(beforeFile), A = get(afterFile);
let tb = { idle: 0, travel: 0 }, ta = { idle: 0, travel: 0 };
B.forEach((b, i) => {
  const a = A[i];
  tb.idle += b.idle; tb.travel += b.travel; ta.idle += a.idle; ta.travel += a.travel;
  console.log(`## ${b.date}\nBEFORE: ${b.schedule}\n  idle ${b.idle}, travel ${b.travel}, longest wait ${b.longest.wait} (${b.longest.where})\nAFTER:  ${a.schedule}\n  idle ${a.idle}, travel ${a.travel}, longest wait ${a.longest.wait} (${a.longest.where})\n`);
});
console.log(`TRIP: idle ${tb.idle} -> ${ta.idle}, travel ${tb.travel} -> ${ta.travel}`);

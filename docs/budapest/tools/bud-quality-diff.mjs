// Day-by-day difference between two bud-quality.mts "*-days.json" files (same requests), with the final-schedule metrics.
// Lists every day whose order or schedule changed, and flags each day that got WORSE on any of: idle (+), travel (+, and above +15),
// restaurant lunch lost (became a lunch break), late lunch (+), daylight places after the monthly sunset ESTIMATE (+), cost (+),
// end of the visits later by 60 min or more. Totals at the end. No generation here.
// Usage: node docs/budapest/tools/bud-quality-diff.mjs <before-days.json> <after-days.json> [out.json]
import { readFileSync, writeFileSync } from "fs";
const [, , a, b, out] = process.argv;
const A = new Map(JSON.parse(readFileSync(a, "utf8")).map((d) => [d.id + "#" + d.day, d]));
const B = JSON.parse(readFileSync(b, "utf8"));
const hm = (m) => (m === null || m === undefined ? "-" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`);
const changed = [], worse = [];
let travelOver15 = 0, maxTravel = 0;
for (const d of B) {
  const o = A.get(d.id + "#" + d.day);
  if (!o) continue;
  const same = o.order === d.order && o.idle === d.idle && o.travel === d.travel && o.lunch === d.lunch && o.lunchStart === d.lunchStart;
  if (same) continue;
  const why = [];
  if (d.idle > o.idle) why.push(`idle +${d.idle - o.idle}`);
  if (d.travel > o.travel) why.push(`travel +${d.travel - o.travel}`);
  if (o.lunch !== "break" && o.lunch !== "none" && d.lunch === "break") why.push(`restaurant lunch lost (${o.lunch})`);
  if (d.lateLunchMinutes > o.lateLunchMinutes) why.push(`late lunch +${d.lateLunchMinutes - o.lateLunchMinutes}`);
  if (d.afterDarkEstimate > o.afterDarkEstimate) why.push(`after dark (estimate) +${d.afterDarkEstimate - o.afterDarkEstimate}`);
  if (d.cost > o.cost) why.push(`cost +${Math.round(d.cost - o.cost)}`);
  if (d.visitsEnd - o.visitsEnd >= 60) why.push(`visits end ${hm(o.visitsEnd)} -> ${hm(d.visitsEnd)}`);
  if (d.travel - o.travel > 15) travelOver15++;
  maxTravel = Math.max(maxTravel, d.travel - o.travel);
  const row = {
    id: d.id, day: d.day, date: d.date, weekday: d.weekday,
    before: { order: o.order, idle: o.idle, travel: o.travel, lunch: o.lunch, lunchStart: hm(o.lunchStart), lunchEnd: hm(o.lunchEnd), visitsEnd: hm(o.visitsEnd), dinner: hm(o.dinnerStart), cost: Math.round(o.cost) },
    after: { order: d.order, idle: d.idle, travel: d.travel, lunch: d.lunch, lunchStart: hm(d.lunchStart), lunchEnd: hm(d.lunchEnd), visitsEnd: hm(d.visitsEnd), dinner: hm(d.dinnerStart), cost: Math.round(d.cost) },
    worse: why,
  };
  changed.push(row);
  if (why.length) worse.push(row);
}
for (const r of changed) console.log(`${r.worse.length ? "WORSE" : "     "} ${r.id} d${r.day} ${r.date ?? "flex"} ${r.weekday ?? ""}: idle ${r.before.idle}->${r.after.idle}, travel ${r.before.travel}->${r.after.travel}, lunch ${r.before.lunch} ${r.before.lunchStart}-${r.before.lunchEnd} -> ${r.after.lunch} ${r.after.lunchStart}-${r.after.lunchEnd}, visits end ${r.before.visitsEnd}->${r.after.visitsEnd}${r.worse.length ? "  [" + r.worse.join("; ") + "]" : ""}`);
const summary = { changedDays: changed.length, worseDays: worse.length, travelOver15, maxTravelIncrease: maxTravel };
console.log(JSON.stringify(summary));
if (out) writeFileSync(out, JSON.stringify({ summary, changed, worse }, null, 1));

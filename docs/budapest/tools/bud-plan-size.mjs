// Where the bytes of a generated plan go (hours objects), and what a trimmed stored copy would weigh. Read-only: changes nothing.
// "Trimmed" = what the plan and its edits read back (see budapest-research.md 14.5): the customer text (display / weekly table), the
// planning schedule for the trip's own weekdays, last entry, startsAtOpening, and the source fields; NOT the full season list, the dated
// exception list, the monthly rule or the internal maintenance notes (already applied when the plan was made).
// Usage: node docs/budapest/tools/bud-plan-size.mjs sample.json
import { readFileSync } from "fs";
const plans = JSON.parse(readFileSync(process.argv[2], "utf8"));
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const size = (x) => (x === undefined ? 0 : JSON.stringify(x).length);
const KEEP = ["type", "display", "closedWeekdays", "schedule", "lastEntry", "planningLastEntry", "startsAtOpening", "source", "sourceUrl", "lastVerified", "seasons"];
function trim(hours, weekdays) {
  if (!hours || typeof hours !== "object") return hours;
  const out = {};
  for (const k of KEEP) if (hours[k] !== undefined) out[k] = hours[k];
  if (hours.planningSchedule) out.planningSchedule = Object.fromEntries(Object.entries(hours.planningSchedule).filter(([d]) => !weekdays || weekdays.has(d)));
  return out;
}
function walk(node, visit, path = "") {
  if (Array.isArray(node)) node.forEach((x, i) => walk(x, visit, `${path}[${i}]`));
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) { if (k === "hours" && v && typeof v === "object") visit(v, `${path}.hours`); else walk(v, visit, `${path}.${k}`); }
}
let total = 0, totalTrim = 0;
const byField = {}, byPlace = {}, rows = [];
for (const p of plans) {
  const plan = p.plan;
  const weekdays = plan.days.every((d) => d.weekday) ? new Set(plan.days.map((d) => d.weekday)) : null;
  const all = size(plan);
  let hoursBytes = 0, trimmedBytes = 0;
  walk(plan, (h, path) => {
    const s = size(h); hoursBytes += s; trimmedBytes += size(trim(h, weekdays));
    for (const [k, v] of Object.entries(h)) byField[k] = (byField[k] ?? 0) + size(v);
    const id = (path.match(/placeDetails\.([^.]+)/) ?? [])[1] ?? "(stop / meal copies)";
    byPlace[id] = (byPlace[id] ?? 0) + s;
  });
  total += all; totalTrim += all - hoursBytes + trimmedBytes;
  rows.push({ id: p.id, all, hoursBytes, after: all - hoursBytes + trimmedBytes, cruise: !!plan.placeDetails?.["danube-legend-cruise"] });
}
const avg = (xs, f) => xs.reduce((s, x) => s + f(x), 0) / Math.max(1, xs.length);
for (const cruise of [true, false]) {
  const xs = rows.filter((r) => r.cruise === cruise);
  console.log(`${cruise ? "plans WITH the cruise" : "plans without it"} (${xs.length}): average ${kb(avg(xs, (r) => r.all))}, of which hours objects ${kb(avg(xs, (r) => r.hoursBytes))}; trimmed: ${kb(avg(xs, (r) => r.after))}`);
}
console.log(`whole sample: ${kb(total)} -> trimmed ${kb(totalTrim)}`);
console.log("bytes inside hours objects, by field:", Object.fromEntries(Object.entries(byField).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, kb(v)])));
console.log("hours bytes by placeDetails entry (top 6):", Object.fromEntries(Object.entries(byPlace).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => [k, kb(v)])));
const one = rows.find((r) => r.cruise);
if (one) {
  const plan = plans.find((p) => p.id === one.id).plan;
  const copies = [];
  walk(plan, (h, path) => { if (h.startsAtOpening) copies.push(`${path} (${kb(size(h))})`); });
  console.log(`\nexample ${one.id}: the cruise timetable is stored ${copies.length} times:`); copies.forEach((c) => console.log("  " + c));
}

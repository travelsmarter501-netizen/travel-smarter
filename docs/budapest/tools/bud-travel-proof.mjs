// Proof on FINAL results that the travel allowance is cumulative against the fixed baseline (rule B1, the Budapest default since
// 2026-11-15). Baseline = the "unreviewed" plans (bud-quality.mts variant lunchRules: the same request, lunch rules and timing guard,
// no review), i.e. the day as it entered the review. For every day of the variant:
//   increase = final known travel - baseline known travel (same request, same day number).
//   increase <= 15: always allowed (rule A).
//   increase > 15: allowed only if the baseline day had lost time (first visit 60+ min after 09:00, or one wait of 60+ min), the
//   increase <= min((baseline idle - final idle) / 4, 45), and the final day's known travel <= 90.
// Also counts days above 90 min of known travel that did NOT use the larger allowance: the 90 ceiling is a condition of the
// exceptional increase, not a description of every day.
// Usage: node docs/budapest/tools/bud-travel-proof.mjs <dir with lunchRules-days.json> <variant> [out.json]
import { readFileSync, writeFileSync } from "fs";
const [, , dir, variant, out] = process.argv;
const base = new Map(JSON.parse(readFileSync(`${dir}/lunchRules-days.json`, "utf8")).map((d) => [`${d.id}#${d.day}`, d]));
const days = JSON.parse(readFileSync(`${dir}/${variant}-days.json`, "utf8"));
const rows = [];
let over15 = 0, violations = 0, above90 = 0, above90WithoutAllowance = 0, maxIncrease = -Infinity;
const hist = { "<=15": 0, "16-30": 0, "31-45": 0, ">45": 0 };
for (const d of days) {
  const b = base.get(`${d.id}#${d.day}`);
  if (!b) continue;
  const inc = d.travel - b.travel;
  maxIncrease = Math.max(maxIncrease, inc);
  hist[inc <= 15 ? "<=15" : inc <= 30 ? "16-30" : inc <= 45 ? "31-45" : ">45"]++;
  if (d.travel > 90) { above90++; if (inc <= 15) above90WithoutAllowance++; }
  if (inc <= 15) continue;
  over15++;
  const lost = b.morningGap >= 60 || b.longestWait >= 60;
  const recovered = b.idle - d.idle;
  const allowed = Math.min(recovered / 4, 45);
  const reasons = [];
  if (!lost) reasons.push("no lost time in the baseline day");
  if (inc > allowed) reasons.push(`increase ${inc} > allowed ${Math.floor(allowed)}`);
  if (d.travel > 90) reasons.push(`day travel ${d.travel} > 90`);
  if (reasons.length) violations++;
  rows.push({ id: d.id, day: d.day, date: d.date, weekday: d.weekday, baseline: { travel: b.travel, idle: b.idle, morningGap: b.morningGap, longestWait: b.longestWait }, final: { travel: d.travel, idle: d.idle }, increase: inc, recovered, allowed: Math.floor(allowed), ok: reasons.length === 0, reasons });
}
const summary = { variant, days: days.length, increaseHistogram: hist, maxIncrease, daysAbove15: over15, violations, daysAbove90: above90, daysAbove90WithoutTheLargerAllowance: above90WithoutAllowance };
console.log(JSON.stringify(summary));
for (const r of rows) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.id} d${r.day} ${r.date ?? "flex"} ${r.weekday ?? ""}: travel ${r.baseline.travel} -> ${r.final.travel} (+${r.increase}), idle ${r.baseline.idle} -> ${r.final.idle} (recovered ${r.recovered}, allowed ${r.allowed}; baseline morning ${r.baseline.morningGap}, longest wait ${r.baseline.longestWait})${r.reasons.length ? "  [" + r.reasons.join("; ") + "]" : ""}`);
if (out) writeFileSync(out, JSON.stringify({ summary, rows }, null, 1));

// Generation time over repeated runs: <root>/run1 ... runN, each with <variant>-times.json (one process per variant and run).
// Per plan: the median over the runs; then median / p90 / slowest over the plans, and the spread of each run's own median.
// Usage: node docs/budapest/tools/bud-r3-times.mjs <root> A,Am,B,C,Ba,Ca [out.json]
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
const [, , root, list, out] = process.argv;
const runs = readdirSync(root).filter((d) => /^run\d+$/.test(d)).sort();
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const result = {};
for (const name of list.split(",")) {
  const perRun = runs.map((r) => `${root}/${r}/${name}-times.json`).filter(existsSync).map((f) => JSON.parse(readFileSync(f, "utf8")).filter((x) => typeof x.ms === "number"));
  if (!perRun.length) continue;
  const ids = perRun[0].map((x) => x.id);
  const perPlan = ids.map((id) => med(perRun.map((run) => run.find((x) => x.id === id)?.ms).filter((v) => typeof v === "number")));
  result[name] = { runs: perRun.length, plans: ids.length, median: med(perPlan), p90: pct(perPlan, 0.9), max: Math.max(...perPlan), runMedians: perRun.map((run) => med(run.map((x) => x.ms))), runMaxes: perRun.map((run) => Math.max(...run.map((x) => x.ms))) };
  console.log(name.padEnd(4), JSON.stringify(result[name]));
}
if (out) writeFileSync(out, JSON.stringify(result, null, 1));

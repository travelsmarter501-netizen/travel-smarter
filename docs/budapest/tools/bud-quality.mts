/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Day-quality measurement (round 1): generates the same requests with test-only copies of the Budapest module (budapestModuleWith), one
// per change, and reports per variant:
//   morning gap (09:00 -> first visit), waits between items (beyond travel + the 15-minute margin; not before dinner), their sum,
//   visit minutes, travel minutes (meal transfers included), end of the visits, end of lunch, dinners (optional, apart), lunches
//   (restaurant / lunch break / Gerbeaud, and lunch breaks per interest set), late lunches (after 13:30), daylight places after the
//   ESTIMATED monthly sunset, generation time per plan (median, p90, slowest).
// Variants: "old" (as ddb1b98: must equal it byte for byte), "lunchRules" (no cafe lunch + lunch after the last visit), "order" (the same
// lunch rules + each day's order accepted on the final schedule), "all" (+ moves between days). Optional 3rd argument: variants to run.
// Round 3 (test-only rules, 8e8a309 = "A"): "A" (= all), "Am" (A + explicit meal checks), "B" / "C" (travel rule B / C + explicit meals),
// "Ba" / "Ca" (+ areas by date). Each variant also writes <name>-times.json (ms per plan) and <name>-review-log.json (every review
// decision with its reasons). Repeat runs for timings: one process per variant and run.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-quality.mts <sample|launch> <outDir>
//   sample = the 53-plan review sample (bud-sample.mts inputs); launch = 9 interest sets x 1-4 days x 3 date cases (108 plans).
import { mkdirSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const { dayMetrics } = await imp("/docs/budapest/tools/bud-quality-metrics.mts");

const [, , which, outDir] = process.argv;
mkdirSync(outDir, { recursive: true });
const N = ["natureViews", "beachRelax"], E = ["footballExperiences", "nightlife"];
const SETS: Record<string, string[]> = { A: ["popular", "cultureHistory", ...N], B: ["cultureHistory"], C: ["food", "shopping", ...E], popular: ["popular"], nature: N, shopping: ["shopping"], experiences: E, food: ["food"] };
const plus = (iso: string, n: number) => new Date(Date.parse(iso + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const cases: { id: string; input: any }[] = [];
if (which === "sample") {
  const WIN: [string, string][] = [["2026-11-19", "2026-11-21"], ["2026-11-22", "2026-11-24"], ["2026-12-24", "2026-12-26"], ["2027-01-11", "2027-01-13"], ["2027-07-17", "2027-07-19"]];
  for (const s of Object.keys(SETS)) {
    for (const [a, b] of WIN) cases.push({ id: `${s}-${a}`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: a, departureDate: b, interests: SETS[s], accommodation: { booked: false } } });
    cases.push({ id: `${s}-flex3`, input: { destinationId: "budapest", dateMode: "flexible", durationDays: 3, interests: SETS[s], accommodation: { booked: false } } });
  }
  for (const d of [1, 2, 4]) cases.push({ id: `A-flex${d}`, input: { destinationId: "budapest", dateMode: "flexible", durationDays: d, interests: SETS.A, accommodation: { booked: false } } });
  cases.push({ id: `A-4d-2026-11-19`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-19", departureDate: "2026-11-22", interests: SETS.A, accommodation: { booked: false } } });
  cases.push({ id: `surprise-4d-2026-11-22`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-22", departureDate: "2026-11-25", interests: [], surpriseMe: true, accommodation: { booked: false } } });
} else {
  for (const [k, interests] of Object.entries({ ...SETS, surprise: [] as string[] })) for (const n of [1, 2, 3, 4]) for (const mode of ["flex", "2026-11-19", "2027-07-17"]) {
    const base: any = { destinationId: "budapest", interests, accommodation: { booked: false }, ...(k === "surprise" ? { surpriseMe: true } : {}) };
    cases.push({ id: `${k}-${n}d-${mode}`, input: mode === "flex" ? { ...base, dateMode: "flexible", durationDays: n } : { ...base, dateMode: "specific", arrivalDate: mode, departureDate: plus(mode, n - 1) } });
  }
}
writeFileSync(`${outDir}/inputs.json`, JSON.stringify(cases, null, 1));

const VARIANTS: Record<string, any> = {
  old: { cafeLunch: true, lunchAfterLastStop: false, clockOrder: false, crossDay: false },
  lunchRules: { cafeLunch: false, lunchAfterLastStop: true, clockOrder: false, crossDay: false },
  order: { cafeLunch: false, lunchAfterLastStop: true, clockOrder: true, crossDay: false },
  all: M.BUDAPEST_QUALITY_DEFAULTS,
  A: M.BUDAPEST_QUALITY_DEFAULTS,
  Am: { ...M.BUDAPEST_QUALITY_DEFAULTS, mealCheck: "explicit" },
  B: { ...M.BUDAPEST_QUALITY_DEFAULTS, travelRule: "B", mealCheck: "explicit" },
  C: { ...M.BUDAPEST_QUALITY_DEFAULTS, travelRule: "C", mealCheck: "explicit" },
  Ba: { ...M.BUDAPEST_QUALITY_DEFAULTS, travelRule: "B", mealCheck: "explicit", datedAreas: true },
  Ca: { ...M.BUDAPEST_QUALITY_DEFAULTS, travelRule: "C", mealCheck: "explicit", datedAreas: true },
};
const ROUND3 = new Set(["A", "Am", "B", "C", "Ba", "Ca"]);
const only = process.argv[4] ? new Set(process.argv[4].split(",")) : null;
const summary: any = {};
for (const [name, options] of Object.entries(VARIANTS)) {
  if (only ? !only.has(name) : ROUND3.has(name)) continue;
  let sink: any[] = [];
  const log: any[] = [];
  const city = M.budapestModuleWith(ROUND3.has(name) ? { ...options, report: (e: any) => sink.push(e) } : options);
  const out: any[] = [];
  const times: number[] = [];
  for (const c of cases) {
    const t0 = performance.now();
    sink = [];
    const r: any = await P.generateCityPlanV2(city, c.input);
    times.push(performance.now() - t0);
    if (sink.length) log.push({ id: c.id, entries: sink });
    out.push(r.ok ? { id: c.id, c: c.input, plan: r.data, ms: Math.round(times[times.length - 1]) } : { id: c.id, c: c.input, error: r.error });
  }
  writeFileSync(`${outDir}/${name}.json`, JSON.stringify(out.map(({ ms, ...rest }) => rest)));
  writeFileSync(`${outDir}/${name}-times.json`, JSON.stringify(out.map((x) => ({ id: x.id, ms: x.ms }))));
  if (ROUND3.has(name)) writeFileSync(`${outDir}/${name}-review-log.json`, JSON.stringify(log));
  const days = out.flatMap((x) => (x.plan ? x.plan.days.map((d: any) => ({ id: x.id, day: d.dayNumber, date: d.actualDate ?? null, weekday: d.weekday ?? null, ...dayMetrics(d) })) : []));
  const sum = (k: string) => days.reduce((s, d: any) => s + (typeof d[k] === "number" ? d[k] : 0), 0);
  const sorted = [...times].sort((a, b) => a - b);
  summary[name] = {
    plans: out.filter((x) => x.plan).length, failed: out.filter((x) => !x.plan).map((x) => x.id), days: days.length,
    morningGap: sum("morningGap"), waits: sum("waits"), idle: sum("idle"), visits: sum("visits"), travel: sum("travel"),
    avgVisitsEnd: Math.round(sum("visitsEnd") / days.length), avgLunchEnd: Math.round(days.reduce((s, d: any) => s + (d.lunchEnd ?? 0), 0) / Math.max(1, days.filter((d: any) => d.lunchEnd).length)), dinners: days.filter((d: any) => d.dinnerStart !== null).length, lunchRestaurant: days.filter((d: any) => d.lunch !== "break" && d.lunch !== "none").length, lunchBreak: days.filter((d: any) => d.lunch === "break").length,
    gerbeaudLunch: days.filter((d: any) => d.lunch === "gerbeaud").length, lateLunch: sum("lateLunch"), afterDarkEstimate: sum("afterDarkEstimate"),
    lunchBreaksBySet: Object.fromEntries([...new Set(days.map((d: any) => d.id.split("-")[0]))].map((set) => [set, days.filter((d: any) => d.id.split("-")[0] === set && d.lunch === "break").length + "/" + days.filter((d: any) => d.id.split("-")[0] === set).length])),
    msMedian: Math.round(sorted[Math.floor(sorted.length / 2)]), msP90: Math.round(sorted[Math.floor(sorted.length * 0.9)]), msMax: Math.round(sorted[sorted.length - 1]),
  };
  writeFileSync(`${outDir}/${name}-days.json`, JSON.stringify(days));
  console.log(name.padEnd(15), JSON.stringify(summary[name]));
}
writeFileSync(`${outDir}/summary${only ? "-" + [...only].join("-") : ""}.json`, JSON.stringify(summary, null, 1));

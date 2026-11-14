/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Day-quality measurement (round 1): generates the same requests with test-only copies of the Budapest module (budapestModuleWith), one
// per change, and reports per variant:
//   morning gap (09:00 -> first visit), waits between items (beyond travel + the 15-minute margin; not before dinner), their sum,
//   visit minutes, travel minutes, end of the day's program, lunches (restaurant / lunch break / Gerbeaud), late lunches (after 13:30),
//   daylight visits after dark, generation time per plan.
// Variants: "old" (all switches as in ddb1b98: must equal it byte for byte), "noCafeLunch", "lunchAfterLast", "clockOrder", "all".
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
  old: { cafeLunch: true, lunchAfterLastStop: false, clockOrder: false },
  noCafeLunch: { cafeLunch: false, lunchAfterLastStop: false, clockOrder: false },
  lunchAfterLast: { cafeLunch: true, lunchAfterLastStop: true, clockOrder: false },
  clockOrder: { cafeLunch: true, lunchAfterLastStop: false, clockOrder: true },
  all: M.BUDAPEST_QUALITY_DEFAULTS,
};
const summary: any = {};
for (const [name, options] of Object.entries(VARIANTS)) {
  const city = M.budapestModuleWith(options);
  const out: any[] = [];
  const times: number[] = [];
  for (const c of cases) {
    const t0 = performance.now();
    const r: any = await P.generateCityPlanV2(city, c.input);
    times.push(performance.now() - t0);
    out.push(r.ok ? { id: c.id, c: c.input, plan: r.data, ms: Math.round(times[times.length - 1]) } : { id: c.id, c: c.input, error: r.error });
  }
  writeFileSync(`${outDir}/${name}.json`, JSON.stringify(out.map(({ ms, ...rest }) => rest)));
  const days = out.flatMap((x) => (x.plan ? x.plan.days.map((d: any) => ({ id: x.id, ...dayMetrics(d) })) : []));
  const sum = (k: string) => days.reduce((s, d: any) => s + (typeof d[k] === "number" ? d[k] : 0), 0);
  const sorted = [...times].sort((a, b) => a - b);
  summary[name] = {
    plans: out.filter((x) => x.plan).length, failed: out.filter((x) => !x.plan).map((x) => x.id), days: days.length,
    morningGap: sum("morningGap"), waits: sum("waits"), idle: sum("idle"), visits: sum("visits"), travel: sum("travel"),
    avgEnd: Math.round(sum("end") / days.length), lunchRestaurant: days.filter((d: any) => d.lunch !== "break" && d.lunch !== "none").length, lunchBreak: days.filter((d: any) => d.lunch === "break").length,
    gerbeaudLunch: days.filter((d: any) => d.lunch === "gerbeaud").length, lateLunch: sum("lateLunch"), afterDark: sum("afterDark"),
    msMedian: Math.round(sorted[Math.floor(sorted.length / 2)]), msP90: Math.round(sorted[Math.floor(sorted.length * 0.9)]), msMax: Math.round(sorted[sorted.length - 1]),
  };
  writeFileSync(`${outDir}/${name}-days.json`, JSON.stringify(days));
  console.log(name.padEnd(15), JSON.stringify(summary[name]));
}
writeFileSync(`${outDir}/summary.json`, JSON.stringify(summary, null, 1));

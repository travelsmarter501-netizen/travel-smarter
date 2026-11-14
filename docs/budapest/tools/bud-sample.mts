/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Budapest check sample: 8 interest sets x (5 dated 3-day windows + flexible 3 days), plus the review prototypes' cases.
import { writeFileSync } from "fs"; import { pathToFileURL } from "url";
const { generateBarcelonaPlanV2 } = await import(pathToFileURL(process.env.ROOT + "/app/smart-planner/barcelona-v2/actions.ts").href);
const N = ["natureViews", "beachRelax"], E = ["footballExperiences", "nightlife"];
const SETS: Record<string, string[]> = { A: ["popular", "cultureHistory", ...N], B: ["cultureHistory"], C: ["food", "shopping", ...E], popular: ["popular"], nature: N, shopping: ["shopping"], experiences: E, food: ["food"] };
const WIN: [string, string][] = [["2026-11-19", "2026-11-21"], ["2026-11-22", "2026-11-24"], ["2026-12-24", "2026-12-26"], ["2027-01-11", "2027-01-13"], ["2027-07-17", "2027-07-19"]];
const cases: { id: string; input: any }[] = [];
for (const s of Object.keys(SETS)) {
  for (const [a, b] of WIN) cases.push({ id: `${s}-${a}`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: a, departureDate: b, interests: SETS[s], accommodation: { booked: false } } });
  cases.push({ id: `${s}-flex3`, input: { destinationId: "budapest", dateMode: "flexible", durationDays: 3, interests: SETS[s], accommodation: { booked: false } } });
}
for (const d of [1, 2, 4]) cases.push({ id: `A-flex${d}`, input: { destinationId: "budapest", dateMode: "flexible", durationDays: d, interests: SETS.A, accommodation: { booked: false } } });
cases.push({ id: `A-4d-2026-11-19`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-19", departureDate: "2026-11-22", interests: SETS.A, accommodation: { booked: false } } });
cases.push({ id: `surprise-4d-2026-11-22`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-22", departureDate: "2026-11-25", interests: [], surpriseMe: true, accommodation: { booked: false } } });
const out: any[] = []; const failed: any[] = []; const t0 = Date.now();
for (const c of cases) { const r: any = await generateBarcelonaPlanV2(c.input); if (!r.ok) { failed.push({ id: c.id, error: r.error }); continue; } out.push({ id: c.id, c: c.input, plan: r.data }); }
writeFileSync(process.argv[2], JSON.stringify(out));
console.log(JSON.stringify({ cases: cases.length, plans: out.length, failed, seconds: Math.round((Date.now() - t0) / 1000) }));

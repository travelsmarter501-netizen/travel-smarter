/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Budapest review prototypes: the three interest sets on real consecutive dates, a Sun-Tue case, a 4-day trip, and flexible versions.
import { writeFileSync } from "fs"; import { pathToFileURL } from "url";
const { generateBarcelonaPlanV2 } = await import(pathToFileURL(process.env.ROOT + "/app/smart-planner/barcelona-v2/actions.ts").href);
const NATURE = ["natureViews", "beachRelax"], EXPER = ["footballExperiences", "nightlife"];
const SETS: Record<string, string[]> = { A: ["popular", "cultureHistory", ...NATURE], B: ["cultureHistory"], C: ["food", "shopping", ...EXPER] };
const cases: { id: string; input: any }[] = [];
for (const s of Object.keys(SETS)) {
  cases.push({ id: `${s}-thu-sat`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-19", departureDate: "2026-11-21", interests: SETS[s], accommodation: { booked: false } } });
  cases.push({ id: `${s}-sun-tue`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-22", departureDate: "2026-11-24", interests: SETS[s], accommodation: { booked: false } } });
  cases.push({ id: `${s}-flex3`, input: { destinationId: "budapest", dateMode: "flexible", durationDays: 3, interests: SETS[s], accommodation: { booked: false } } });
}
cases.push({ id: `A-4d-thu-sun`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-19", departureDate: "2026-11-22", interests: SETS.A, accommodation: { booked: false } } });
cases.push({ id: `A-4d-flex`, input: { destinationId: "budapest", dateMode: "flexible", durationDays: 4, interests: SETS.A, accommodation: { booked: false } } });
cases.push({ id: `surprise-4d-sun-wed`, input: { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-22", departureDate: "2026-11-25", interests: [], surpriseMe: true, accommodation: { booked: false } } });
const out: any[] = []; const failed: any[] = [];
for (const c of cases) {
  const r: any = await generateBarcelonaPlanV2(c.input);
  if (!r.ok) { failed.push({ id: c.id, error: r.error }); continue; }
  out.push({ id: c.id, c: c.input, plan: r.data });
}
writeFileSync(process.argv[2], JSON.stringify(out));
console.log(JSON.stringify({ cases: cases.length, plans: out.length, failed }));

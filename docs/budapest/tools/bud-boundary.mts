/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Budapest boundary tests (stage 1): planning hours on single dates and checked-transit direction rules.
// Usage (from the repository root): ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-boundary.mts
// Exit code 1 if any expectation fails.
import { pathToFileURL } from "url";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
const T = await imp("/app/lib/planner/tripHours.ts");
const D = await imp("/app/lib/planner/dateOnly.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");

const place = (id: string) => P.BUDAPEST_PLACES.attractions.find((a: any) => a.id === id) ?? P.BUDAPEST_PLACES.experiences.find((a: any) => a.id === id);
/** The ranges the planner may use for this place on this single date ([] = not schedulable that day). */
function rangesOn(id: string, date: string): string {
  const hours = T.resolveHoursForTrip(place(id).hours, [date]);
  const weekday = D.weekdayOfIsoDate(date);
  const sched = hours?.planningSchedule ?? hours?.schedule;
  if (!sched) return hours?.type ?? "none";
  const r = sched[weekday] ?? [];
  return r.length ? r.map((x: any) => `${x.open}-${x.close}`).join(",") + (hours.lastEntry ? ` last ${hours.lastEntry}` : "") : "NOT SCHEDULABLE";
}
let failed = 0;
function expect(label: string, got: string, want: (g: string) => boolean, wantText: string) {
  const ok = want(got);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${got}${ok ? "" : `  (expected ${wantText})`}`);
}
const open = (g: string) => g !== "NOT SCHEDULABLE";
const closed = (g: string) => g === "NOT SCHEDULABLE";

// House of Music: first Tuesday of every month closed, the next day open; Monday closed (weekly).
for (const [closedDay, nextDay] of [["2026-12-01", "2026-12-02"], ["2027-01-05", "2027-01-06"], ["2027-07-06", "2027-07-07"], ["2027-08-03", "2027-08-04"], ["2033-03-01", "2033-03-02"], ["2040-12-04", "2040-12-05"]]) {
  expect(`House of Music ${closedDay} (first Tuesday)`, rangesOn("house-of-music", closedDay), closed, "not schedulable");
  expect(`House of Music ${nextDay} (Wednesday after)`, rangesOn("house-of-music", nextDay), open, "open");
}
expect("House of Music 2026-12-08 (second Tuesday)", rangesOn("house-of-music", "2026-12-08"), open, "open");
expect("House of Music 2026-11-23 (Monday)", rangesOn("house-of-music", "2026-11-23"), closed, "not schedulable");
expect("first-Tuesday list covers Nov 2026 - Dec 2040", String(P.firstTuesdays(2026, 11, 2040).length), (g) => g === "170", "170 dates");

// National Gallery: holiday hours unverified -> not scheduled 24 Dec 2026 - 1 Jan 2027; regular days around it open.
for (const d of ["2026-12-23", "2027-01-02"]) expect(`National Gallery ${d}`, rangesOn("hungarian-national-gallery", d), open, "open");
for (const d of ["2026-12-24", "2026-12-25", "2026-12-26", "2026-12-28", "2026-12-31", "2027-01-01"]) expect(`National Gallery ${d} (holiday hours unverified)`, rangesOn("hungarian-national-gallery", d), closed, "not schedulable");
expect("National Gallery 2026-11-23 (Monday)", rangesOn("hungarian-national-gallery", "2026-11-23"), closed, "not schedulable");

// Checked transit: exact direction only, with the checked departure in the note; the reverse direction is an estimate.
const note = (a: string, b: string) => { const l = M.budapestLeg(a, b); const o = l.options.find((x: any) => x.mode === "transit"); return o ? `${o.durationMinutesMin}-${o.durationMinutesMax} | ${o.note}` : `no transit option (${l.recommendedMode})`; };
expect("21 Restaurant -> Chain Bridge (checked)", note("21-restaurant", "chain-bridge"), (g) => g.includes("Google") && g.includes("20/11/2026"), "checked note with 20/11/2026 14:45");
expect("Chain Bridge -> 21 Restaurant (checked separately)", note("chain-bridge", "21-restaurant"), (g) => g.includes("22/11/2026"), "its own check (22/11/2026)");
expect("St Stephen -> Matthias (only the reverse was checked)", note("st-stephens-basilica", "matthias-church-exterior"), (g) => !g.includes("Google"), "estimate, not a check");
expect("Gerbeaud -> Citadella (only the reverse was checked)", note("gerbeaud", "citadella"), (g) => !g.includes("Google"), "estimate, not a check");

console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);

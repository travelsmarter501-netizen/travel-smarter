/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Budapest boundary tests: planning hours on single dates (National Gallery holidays, House of Music monthly rule, cruise timetable),
// the cruise departure rule in create / edit / add, and the checked-transit direction rules.
// Usage (from the repository root): ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-boundary.mts
// Exit code 1 if any expectation fails.
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest"; // local preview switch (Budapest stays disabled in the product)
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
const T = await imp("/app/lib/planner/tripHours.ts");
const D = await imp("/app/lib/planner/dateOnly.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const TL = await imp("/app/lib/planner/barcelonaV2Timeline.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const { generateBarcelonaPlanV2 } = await imp("/app/smart-planner/barcelona-v2/actions.ts");

const place = (id: string) => P.BUDAPEST_PLACES.attractions.find((a: any) => a.id === id) ?? P.BUDAPEST_PLACES.experiences.find((a: any) => a.id === id);
/** The ranges the planner may use for this place on these dates, for the weekday of `date` ([] = not schedulable that day). */
function rangesOn(id: string, date: string, tripDates: string[] = [date]): string {
  const hours = T.resolveHoursForTrip(place(id).hours, tripDates);
  const weekday = D.weekdayOfIsoDate(date);
  const sched = hours?.planningSchedule ?? hours?.schedule;
  if (!sched) return hours?.type ?? "none";
  const r = sched[weekday] ?? [];
  const last = hours.planningLastEntry ?? hours.lastEntry;
  return r.length ? r.map((x: any) => `${x.open}-${x.close}`).join(",") + (last ? ` last ${last}` : "") : "NOT SCHEDULABLE";
}
/** The cruise departures the planner may use on a date (start of each interval). */
const departuresOn = (date: string): string => {
  const g = rangesOn("danube-legend-cruise", date);
  return g === "NOT SCHEDULABLE" ? g : g.split(" last ")[0].split(",").map((r) => r.split("-")[0]).join(" ");
};
let failed = 0;
function expect(label: string, got: string, want: (g: string) => boolean, wantText: string) {
  const ok = want(got);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${got}${ok ? "" : `  (expected ${wantText})`}`);
}
const is = (w: string) => [(g: string) => g === w, w] as const;
const open = (g: string) => g !== "NOT SCHEDULABLE";
const closed = (g: string) => g === "NOT SCHEDULABLE";

// ── 1. National Gallery (owner, 2026-11-16): the reviewer's 2026/27 reading has no kept copy and the official page is unreadable, so the
// year-end dates (24-26 Dec, 31 Dec, 1 Jan) are unconfirmed: never on the clock (a conditional suggestion instead, bud-closeout.mts).
// Other days keep the regular hours (planning end 17:30, halls close); Mondays stay closed (no 28 Dec opening without evidence).
const MNG = "hungarian-national-gallery";
for (const d of ["2026-11-19", "2026-12-23", "2026-12-27", "2026-12-29", "2026-12-30", "2027-01-02"]) expect(`National Gallery ${d} (regular day)`, rangesOn(MNG, d), ...is("10:00-17:30 last 17:00"));
for (const d of ["2026-12-24", "2026-12-25", "2026-12-26", "2026-12-31", "2027-01-01", "2027-12-24", "2027-12-31", "2040-12-25"]) expect(`National Gallery ${d} (year-end, unconfirmed)`, rangesOn(MNG, d), closed, "not schedulable");
for (const d of ["2026-11-23", "2026-12-28", "2027-01-04"]) expect(`National Gallery ${d} (Monday)`, rangesOn(MNG, d), closed, "not schedulable");

// ── 2. House of Music: the RULE "closed the first Tuesday of the month", computed for each trip date (no end year).
const HOM = "house-of-music";
let ruleMiss: string[] = [];
for (let y = 2026; y <= 2075; y++) for (let m = 1; m <= 12; m++) {
  // Independent computation: walk days 1..7 until the weekday is Tuesday.
  let day = 1; while (new Date(Date.UTC(y, m - 1, day)).getUTCDay() !== 2) day++;
  const iso = (d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (!closed(rangesOn(HOM, iso(day)))) ruleMiss.push(`${iso(day)} open`);
  if (!open(rangesOn(HOM, iso(day + 7)))) ruleMiss.push(`${iso(day + 7)} closed`);
  if (!open(rangesOn(HOM, iso(day + 1)))) ruleMiss.push(`${iso(day + 1)} closed`);
}
expect("House of Music: first Tuesday closed, second Tuesday and the Wednesday after open, every month 2026-2075", ruleMiss.length ? ruleMiss.slice(0, 5).join(", ") : "all 600 months", (g) => g === "all 600 months", "no miss");
expect("House of Music 2026-11-23 (Monday)", rangesOn(HOM, "2026-11-23"), closed, "not schedulable");
// The first-Tuesday rule stays a rule (no stored list of Tuesdays). Since 2026-11-16 the only stored dates are the year-end planning
// exclusions (24-26 Dec, 31 Dec - 1 Jan, 2026 to 2040).
const homExceptions: any[] = place(HOM).hours.dateExceptions ?? [];
expect("House of Music: no stored first-Tuesday list (only year-end planning exclusions)", `${homExceptions.length} entries, ${homExceptions.filter((e) => !String(e.note).startsWith("PLANNING EXCLUSION")).length} other`, (g) => g === "30 entries, 0 other", "30 entries, 0 other");
expect("House of Music trip 30 Nov - 2 Dec 2026 (Tue 1 Dec = first Tuesday)", rangesOn(HOM, "2026-12-01", ["2026-11-30", "2026-12-01", "2026-12-02"]), closed, "not schedulable");

// ── 3. Cruise timetable 2026 (legenda.hu/en/timetable), typed here LITERALLY from the published table (not computed like the data).
const E20 = (s: string) => s; // readability only
const PUBLISHED: [string, string][] = [
  ["2026-01-02", E20("15:40 16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00")],
  ["2026-01-05", "16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-02-11", "16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-02-12", "16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-02-25", "17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-03-10", "17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-03-29", "19:00 19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-05-21", "19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-05-22", "19:30 20:15 20:20 20:30 20:45 21:30 21:40 21:45 22:00"],
  ["2026-07-23", "19:30 20:15 20:20 20:30 20:45 21:30 21:40 21:45 22:00"],
  ["2026-07-24", "19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-08-19", "19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-09-04", "19:00 19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-09-14", "18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-09-23", "18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-10-03", "17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00 21:20 21:40 22:00"],
  ["2026-10-25", "16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-11-22", "16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-11-23", "15:40 16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
  ["2026-12-31", "15:40 16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"],
];
for (const [d, want] of PUBLISHED) expect(`Cruise departures ${d}`, departuresOn(d), (g) => g === want, want);
expect("Cruise 2026-12-24 (published: daytime cruises only)", departuresOn("2026-12-24"), closed, "not schedulable");
expect("Cruise 2026-08-20 ('might change': planning exclusion)", departuresOn("2026-08-20"), closed, "not schedulable");
for (const d of ["2027-01-02", "2027-07-17", "2028-11-20"]) expect(`Cruise ${d} (no timetable published: planning exclusion)`, departuresOn(d), closed, "not schedulable");
const cruiseNotes = JSON.stringify(place("danube-legend-cruise").hours.dateExceptions);
expect("Cruise exclusions are labelled as planning exclusions, not closures", String((cruiseNotes.match(/PLANNING EXCLUSION \(not a closure\)/g) ?? []).length), (g) => g === "2", "2 labelled entries");
// A trip across two periods keeps, per weekday, only departures BOTH periods publish (never the overlap of two different departures);
// a weekday whose trip dates are all in one period keeps that period's list (Mon 23 Nov alone: with 15:40).
const tripDeps = (date: string, dates: string[] | null) => {
  const h = T.resolveHoursForTrip(place("danube-legend-cruise").hours, dates);
  return (h.planningSchedule[D.weekdayOfIsoDate(date) ?? "monday"] ?? []).map((r: any) => `${r.open}-${r.close}`).join(" ") || "NOT SCHEDULABLE";
};
expect("Cruise trip 21-24 Nov 2026, Monday = 23 Nov only", tripDeps("2026-11-23", ["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24"]).split(" ")[0], ...is("15:40-16:40"));
expect("Cruise trip 16-23 Nov 2026, Mondays 16 + 23 (two periods): common departures only", tripDeps("2026-11-23", ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23"]).split(" ").map((r: string) => r.split("-")[0]).join(" "), ...is("16:20 16:40 17:00 17:20 17:40 18:00 18:20 18:40 19:00 19:20 19:40 20:00 20:20 20:40 21:00"));
expect("Cruise trip 16-23 Nov 2026: every Monday interval is a full 60-minute departure", tripDeps("2026-11-23", ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23"]).split(" ").filter((r: string) => { const [a, b] = r.split("-"); return Number(b.slice(0, 2)) * 60 + Number(b.slice(3)) - (Number(a.slice(0, 2)) * 60 + Number(a.slice(3))) !== 60; }).join(" ") || "all 60 min", ...is("all 60 min"));
// No dates: no departure is known (a time shared by the 2026 periods says nothing about an unknown date or year): not schedulable.
expect("Cruise without dates: no departure", tripDeps("2026-11-23", null), ...is("NOT SCHEDULABLE"));

// ── 4. The departure rule on the clock: exact start, no quarter-hour rounding, rejection of a time that is not a departure.
const cruiseHours = T.resolveHoursForTrip(place("danube-legend-cruise").hours, ["2026-11-19"]);
const cruiseStop = { placeId: "danube-legend-cruise", visitDurationMinutes: 60, hours: cruiseHours, preferredTime: "evening" };
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
for (const [arrive, want] of [[16 * 60 + 5, "16:20"], [16 * 60 + 25, "16:40"], [16 * 60 + 40, "16:40"], [16 * 60 + 41, "17:00"], [20 * 60 + 45, "21:00"]] as [number, string][]) {
  // The customer-chosen day start is when the first (only) visit may start: the cruise waits for the next published departure.
  const tl = TL.buildBarcelonaDayTimeline([cruiseStop], [], [], "thursday", 11, arrive);
  expect(`Cruise start, day start ${hm(arrive)} (Thu 19 Nov 2026)`, hm(tl.stops[0].startMinutes), (g) => g === want, want);
}
const tlLate = TL.buildBarcelonaDayTimeline([cruiseStop], [], [], "thursday", 11, 21 * 60 + 5);
expect("Cruise after the last departure (21:00) is flagged", G.checkWindow(cruiseHours, "thursday", tlLate.stops[0].startMinutes, tlLate.stops[0].endMinutes, 60) ?? "accepted", (g) => g !== "accepted", "a violation");
for (const [start, want] of [["16:20", "accepted"], ["16:40", "accepted"], ["21:00", "accepted"], ["16:30", "closed"], ["16:45", "closed"], ["17:00", "accepted"], ["21:20", "closed"], ["15:40", "closed"]] as [string, string][]) {
  const s = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
  expect(`checkWindow cruise ${start} on Thu 19 Nov 2026`, G.checkWindow(cruiseHours, "thursday", s, s + 60, 60) ?? "accepted", (g) => g === want, want);
}
const cruiseDec = T.resolveHoursForTrip(place("danube-legend-cruise").hours, ["2026-11-26"]);
expect("checkWindow cruise 15:40 on Thu 26 Nov 2026 (period with 15:40)", G.checkWindow(cruiseDec, "thursday", 940, 1000, 60) ?? "accepted", ...is("accepted"));

// ── 5. Create / edit / add use the same rule (plans generated by the real entry point).
/** The published departures of THIS day's own date (the day's period of the 2026 timetable). */
const depsOf = (day: any) => new Set(departuresOn(day.actualDate).split(" "));
const cruiseDays: string[] = [];
for (const [a, b, interests] of [["2026-11-19", "2026-11-21", ["food", "shopping", "footballExperiences", "nightlife"]], ["2026-11-22", "2026-11-24", ["popular", "natureViews", "beachRelax"]], ["2026-11-19", "2026-11-22", ["popular", "cultureHistory", "natureViews", "beachRelax"]]] as [string, string, string[]][]) {
  const r: any = await generateBarcelonaPlanV2({ destinationId: "budapest", dateMode: "specific", arrivalDate: a, departureDate: b, interests, accommodation: { booked: false } });
  if (!r.ok) { expect(`generate ${a}`, r.error, () => false, "ok"); continue; }
  const plan = r.data;
  const city = M.BUDAPEST_CITY_MODULE;
  for (const day of plan.days) {
    const i = day.stops.findIndex((s: any) => s.id === "danube-legend-cruise");
    if (i >= 0) {
      const tag = `${a} day ${day.dayNumber}`;
      cruiseDays.push(tag);
      const start = hm(day.timeline.stops[i].startMinutes);
      expect(`create: cruise start ${tag}`, start, (g) => depsOf(day).has(g), "a published departure");
      // Edit: every start the day offers keeps the cruise on a published departure (and the day valid).
      const starts: number[] = C.dayValidStarts(city, plan, {}, day.dayNumber);
      const bad = starts.filter((m) => {
        const edited = C.applyPlanCustomizations(city, plan, { [String(day.dayNumber)]: { startMinutes: m } }).days.find((d: any) => d.dayNumber === day.dayNumber);
        const j = edited.stops.findIndex((s: any) => s.id === "danube-legend-cruise");
        return j >= 0 && !depsOf(day).has(hm(edited.timeline.stops[j].startMinutes));
      });
      expect(`edit: ${starts.length} offered starts keep a published departure (${tag})`, bad.length ? bad.map(hm).join(",") : "none off-timetable", ...is("none off-timetable"));
      // A forged non-departure start is a schedule problem (the check the edit and add paths use).
      const forged = { ...day, timeline: { ...day.timeline, stops: day.timeline.stops.map((w: any, k: number) => (k === i ? { ...w, startMinutes: 16 * 60 + 30, endMinutes: 17 * 60 + 30 } : w)) } };
      expect(`edit/add: forged 16:30 departure rejected (${tag})`, [...G.scheduleProblems(forged)].join(",") || "no problem", (g) => g.includes("stop:danube-legend-cruise"), "stop:danube-legend-cruise");
    } else {
      // Add: if the cruise is offered on this day, appending it keeps it on a published departure.
      const offered: string[] = C.addCandidates(M.BUDAPEST_CITY_MODULE, plan, {}, day.dayNumber);
      if (offered.includes("danube-legend-cruise")) {
        const order = [...day.stops.map((s: any) => s.id), "danube-legend-cruise"];
        const added = C.applyPlanCustomizations(city, plan, { [String(day.dayNumber)]: { order } }).days.find((d: any) => d.dayNumber === day.dayNumber);
        const j = added.stops.findIndex((s: any) => s.id === "danube-legend-cruise");
        expect(`add: cruise appended on ${a} day ${day.dayNumber}`, j >= 0 ? hm(added.timeline.stops[j].startMinutes) : "not added", (g) => depsOf(day).has(g), "a published departure");
      }
    }
  }
}
expect("plans with the cruise on the clock (create/edit tests ran)", String(cruiseDays.length), (g) => Number(g) > 0, "> 0");
// Add path on plans WITHOUT the cruise: appending it to each day either lands on a published departure, or the day flags it (timing
// warning), and the "add" list offers it only in the first case.
let addCases = 0;
for (const [a, b] of [["2026-11-19", "2026-11-21"], ["2026-12-26", "2026-12-28"]]) {
  const r: any = await generateBarcelonaPlanV2({ destinationId: "budapest", dateMode: "specific", arrivalDate: a, departureDate: b, interests: ["cultureHistory"], accommodation: { booked: false } });
  if (!r.ok) { expect(`generate culture ${a}`, r.error, () => false, "ok"); continue; }
  const plan = r.data;
  if (plan.days.some((d: any) => d.stops.some((s: any) => s.id === "danube-legend-cruise"))) continue;
  for (const day of plan.days) {
    addCases++;
    const order = [...day.stops.map((s: any) => s.id), "danube-legend-cruise"];
    const added = C.applyPlanCustomizations(M.BUDAPEST_CITY_MODULE, plan, { [String(day.dayNumber)]: { order } }).days.find((d: any) => d.dayNumber === day.dayNumber);
    const j = added.stops.findIndex((s: any) => s.id === "danube-legend-cruise");
    const start = hm(added.timeline.stops[j].startMinutes);
    const flagged = added.stops[j].warnings.some((w: any) => w.textAr === G.TIMING_WARNING_AR);
    const offered = C.addCandidates(M.BUDAPEST_CITY_MODULE, plan, {}, day.dayNumber).includes("danube-legend-cruise");
    const state = depsOf(day).has(start) && !flagged ? "on a departure" : flagged ? "flagged" : "OFF-TIMETABLE, NOT FLAGGED";
    expect(`add: cruise appended ${a} day ${day.dayNumber} (${day.weekday}) at ${start}: ${state}, offered=${offered}`, state + (offered ? "+offered" : ""), (g) => g === "on a departure" || g === "on a departure+offered" || g === "flagged", "on a departure, or flagged and not offered");
  }
}
expect("add-path cases ran", String(addCases), (g) => Number(g) > 0, "> 0");

// ── 6. Checked transit: exact direction only, with the checked departure in the note; the reverse direction is an estimate.
const note = (a: string, b: string) => { const l = M.budapestLeg(a, b); const o = l.options.find((x: any) => x.mode === "transit"); return o ? `${o.durationMinutesMin}-${o.durationMinutesMax} | ${o.note}` : `no transit option (${l.recommendedMode})`; };
expect("21 Restaurant -> Chain Bridge (checked)", note("21-restaurant", "chain-bridge"), (g) => g.includes("Google") && g.includes("20/11/2026"), "checked note with 20/11/2026 14:45");
expect("Chain Bridge -> 21 Restaurant (checked separately)", note("chain-bridge", "21-restaurant"), (g) => g.includes("22/11/2026"), "its own check (22/11/2026)");
expect("St Stephen -> Matthias (only the reverse was checked)", note("st-stephens-basilica", "matthias-church-exterior"), (g) => !g.includes("Google"), "estimate, not a check");
expect("Gerbeaud -> Citadella (only the reverse was checked)", note("gerbeaud", "citadella"), (g) => !g.includes("Google"), "estimate, not a check");

console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);

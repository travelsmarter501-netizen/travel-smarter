/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// The cruise where no departure is known: plans WITHOUT dates, and dated trips whose timetable is not published (2027+, 20 Aug).
// 1. Plans without dates: the scheduled days must be IDENTICAL to the same request on a TEST-ONLY copy of the module with the cruise removed
//    from the data (so no cruise time can have removed a place or changed a day). The cruise is never on the clock, appears only as a
//    suggestion when it matches the request, and the "add" path never offers or accepts it.
// 2. Dated trips with unpublished dates: the same checks, plus the owner-approved suggestion text.
// Optional: a previous sample file (argument 1) to measure how often the cruise USED to change plans without dates.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-cruise-suggest.mts [previous-sample.json]
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const T = await imp("/app/lib/planner/tripHours.ts");
const BP = await imp("/app/lib/planner/budapest/budapestPlaces.ts");

const CRUISE = "danube-legend-cruise";
const APPROVED = "رحلة مسائية على الدانوب — خيار إضافي. تأكّد من المواعيد والتوفّر لتاريخ سفرك قبل الحجز.";
const city = M.BUDAPEST_CITY_MODULE;
// TEST-ONLY copy: the same module with the cruise removed from every list (as if Budapest had no cruise).
const without = (list: any[]) => list.filter((m: any) => m.placeId !== CRUISE);
const noCruise = {
  ...city,
  metadataById: (id: string) => (id === CRUISE ? undefined : city.metadataById(id)),
  metadataForInterests: (i: any, s: any) => without(city.metadataForInterests(i, s)),
  destinationConfig: { ...city.destinationConfig, plannerMetadata: without(city.destinationConfig.plannerMetadata) },
  places: { ...city.places, experiences: city.places.experiences.filter((e: any) => e.id !== CRUISE) },
};

let failed = 0;
function expect(label: string, got: string, ok: boolean, want: string) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${got}${ok ? "" : `  (expected ${want})`}`);
}
const N = ["natureViews", "beachRelax"], E = ["footballExperiences", "nightlife"];
const SETS: Record<string, string[]> = { A: ["popular", "cultureHistory", ...N], B: ["cultureHistory"], C: ["food", "shopping", ...E], popular: ["popular"], nature: N, shopping: ["shopping"], experiences: E, food: ["food"], surprise: [] };
const stopsOf = (plan: any) => plan.days.map((d: any) => d.stops.map((s: any) => s.id).join(",")).join(" / ");

async function checkCase(id: string, input: any, datedUnpublished: boolean) {
  const a: any = await P.generateCityPlanV2(city, input);
  const b: any = await P.generateCityPlanV2(noCruise, input);
  if (!a.ok || !b.ok) return expect(`${id} generates`, `${a.error ?? ""} ${b.error ?? ""}`, false, "ok");
  const pa = a.data, pb = b.data;
  expect(`${id}: scheduled days identical to the same request without any cruise data`, stopsOf(pa) === stopsOf(pb) ? "identical" : `${stopsOf(pa)}  VS  ${stopsOf(pb)}`, stopsOf(pa) === stopsOf(pb), "identical");
  const onClock = pa.days.some((d: any) => d.stops.some((s: any) => s.id === CRUISE));
  const suggested = pa.days.flatMap((d: any) => d.optionalNearby.filter((o: any) => o.id === CRUISE).map((o: any) => ({ day: d.dayNumber, reason: o.reason })));
  expect(`${id}: cruise never on the clock`, onClock ? "ON THE CLOCK" : "not scheduled", !onClock, "not scheduled");
  const relevant = !!city.placeRelevance && city.placeRelevance(input.surpriseMe ? [] : input.interests, !!input.surpriseMe)(CRUISE) >= 5;
  if (datedUnpublished) {
    expect(`${id}: suggestion with the approved text (relevant=${relevant})`, suggested.map((s: any) => `d${s.day} ${s.reason}`).join(" | ") || "none", relevant ? suggested.length === 1 && suggested[0].reason === APPROVED : suggested.length === 0, relevant ? "one suggestion, approved text" : "none");
  } else {
    expect(`${id}: suggestion only when relevant (relevant=${relevant})`, suggested.map((s: any) => `d${s.day}`).join(",") || "none", relevant ? suggested.length === 1 : suggested.length === 0, relevant ? "one" : "none");
  }
  // The add REQUEST (the decision customizeSavedPlan makes before any write): never offered, rejected with "add_unavailable", and the
  // stored edits are untouched (same object content before and after, and the plan built from them is unchanged). Tried with no
  // edits and with an existing edit on the day.
  for (const day of pa.days) {
    const offered = C.addCandidates(city, pa, {}, day.dayNumber).includes(CRUISE);
    for (const stored of [{}, { [String(day.dayNumber)]: { order: [...day.stops.map((s: any) => s.id)].reverse() } }]) {
      const before = JSON.stringify(stored);
      const planBefore = JSON.stringify(C.applyPlanCustomizations(city, pa, stored));
      const decision = C.decidePlanChange(city, pa, stored, { kind: "add", dayNumber: day.dayNumber, placeId: CRUISE });
      const untouched = JSON.stringify(stored) === before && JSON.stringify(C.applyPlanCustomizations(city, pa, stored)) === planBefore;
      const got = `offered=${offered} decision=${decision.ok ? "ACCEPTED" : decision.code} stored=${untouched ? "unchanged" : "CHANGED"}`;
      expect(`${id} d${day.dayNumber}: add request rejected${Object.keys(stored).length ? " (day already edited)" : ""}`, got, got === "offered=false decision=add_unavailable stored=unchanged", "offered=false decision=add_unavailable stored=unchanged");
    }
  }
  // Separate question (display, not acceptance): an OLD saved plan whose stored edits already contain the cruise on such a day is still
  // shown, with the cruise flagged by the "time is tight" warning; nothing is dropped silently.
  const day1 = pa.days[0];
  const old = C.applyPlanCustomizations(city, pa, { [String(day1.dayNumber)]: { order: [...day1.stops.map((s: any) => s.id), CRUISE] } }).days[0];
  const oldStop = old.stops.find((s: any) => s.id === CRUISE);
  const oldState = oldStop ? (oldStop.warnings.some((w: any) => w.textAr === G.TIMING_WARNING_AR) ? "shown with warning" : "SHOWN WITHOUT WARNING") : "not shown";
  expect(`${id}: old stored plan with the cruise on day 1 (display only)`, oldState, oldState === "shown with warning" || oldState === "not shown", "shown with warning, or not shown");
  return pa;
}

// 1. Plans without dates.
const flexPlans: Record<string, any> = {};
for (const [k, interests] of Object.entries(SETS)) for (const days of k === "A" ? [1, 2, 3, 4] : [3]) {
  const id = `${k}-flex${days}`;
  flexPlans[id] = await checkCase(id, { destinationId: "budapest", dateMode: "flexible", durationDays: days, interests, ...(k === "surprise" ? { surpriseMe: true } : {}), accommodation: { booked: false } }, false);
}
const noDateHours = T.resolveHoursForTrip(BP.BUDAPEST_PLACES.experiences.find((e: any) => e.id === CRUISE).hours, null);
expect("cruise hours without dates: no departure", JSON.stringify(noDateHours.planningSchedule), JSON.stringify(noDateHours.planningSchedule) === "{}", "{}");

// 2. Dated trips with unpublished timetable dates.
for (const [k, a, b] of [["A", "2027-01-11", "2027-01-13"], ["C", "2027-07-17", "2027-07-19"], ["popular", "2027-05-03", "2027-05-05"], ["B", "2027-01-11", "2027-01-13"]] as [string, string, string][]) {
  await checkCase(`${k}-${a}`, { destinationId: "budapest", dateMode: "specific", arrivalDate: a, departureDate: b, interests: SETS[k], accommodation: { booked: false } }, true);
}

// Optional: how the previous version (cruise in the place list, 20:20 departure) changed plans without dates.
if (process.argv[2]) {
  const prev = new Map(JSON.parse(readFileSync(process.argv[2], "utf8")).map((x: any) => [x.id, x.plan]));
  let days = 0, changed = 0;
  const lines: string[] = [];
  for (const [id, plan] of Object.entries(flexPlans)) {
    const old: any = prev.get(id.replace("surprise-", "surprise-"));
    if (!old || !plan) continue;
    plan.days.forEach((d: any, i: number) => {
      days++;
      const now = d.stops.map((s: any) => s.id).join(","), before = old.days[i]?.stops.map((s: any) => s.id).join(",");
      if (now !== before) { changed++; lines.push(`  ${id} d${d.dayNumber}: before ${before}\n      now    ${now}`); }
    });
  }
  console.log(`\nPrevious version vs now (plans without dates): ${changed} of ${days} days had other scheduled places or order`);
  lines.forEach((l) => console.log(l));
}
console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);

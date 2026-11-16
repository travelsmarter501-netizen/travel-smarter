/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Close-out round (2026-11-16): trip-length limits (the shared rule and the server check), holiday hours of the National Museum and the
// National Gallery on the affected dates, and the changed texts (House of Music, English titles). Any failure exits 1.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-closeout.mts [out.json]
import { writeFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const R = process.env.ROOT + "/app/";
const { tripLengthLimit } = await import(pathToFileURL(R + "lib/planner/tripLengthLimits.ts").href);
const { normalizePersonalizedAnswers } = await import(pathToFileURL(R + "lib/planner/personalizedPlanAnswers.ts").href);
const { generateBarcelonaPlanV2 } = await import(pathToFileURL(R + "smart-planner/barcelona-v2/actions.ts").href);
const { budapestTemplate } = await import(pathToFileURL(R + "lib/i18n/budapestCatalog.ts").href);
const { localizePlan } = await import(pathToFileURL(R + "lib/i18n/localizePlan.ts").href).catch(() => ({ localizePlan: null }));

let failures = 0;
const log: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  log.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

// ── 1. The shared rule ───────────────────────────────────────────────────────────────────────────────
const N = ["natureViews", "beachRelax"];
const limitCases: [string, string[], boolean, number | null][] = [
  ["budapest", [], true, 4], // surprise me
  ["budapest", ["popular", "cultureHistory"], false, 4],
  ["budapest", ["cultureHistory"], false, 3],
  ["budapest", ["popular"], false, 3],
  ["budapest", N, false, 1],
  ["budapest", ["natureViews"], false, 1],
  ["budapest", ["beachRelax"], false, 1],
  ["budapest", [...N, "food"], false, 4],
  ["budapest", ["food"], false, 4],
  ["budapest", ["shopping"], false, 4],
  ["budapest", ["footballExperiences", "nightlife"], false, 4],
  ["prague", ["cultureHistory"], false, null],
  ["prague", N, false, null],
  ["barcelona", ["popular"], false, null],
  ["barcelona", [], true, null],
];
for (const [city, interests, surprise, max] of limitCases) {
  const got = tripLengthLimit(city, interests, surprise);
  check(`limit ${city} ${surprise ? "surprise" : interests.join("+")}`, (got?.maxDays ?? null) === max, `got ${got?.maxDays ?? "none"}, want ${max ?? "none"}`);
}

// ── 2. The server check (normalizePersonalizedAnswers): flexible and dated, accepted and refused ─────────────────
const answers = (o: any) => ({ accommodation: { booked: false }, surpriseMe: false, ...o });
const flex = (days: number, interests: string[], surpriseMe = false) => answers({ dateMode: "flexible", durationDays: days, interests, surpriseMe });
const dated = (from: string, to: string, interests: string[]) => answers({ dateMode: "specific", arrivalDate: from, departureDate: to, interests });
const serverCases: [string, string, any, boolean][] = [
  ["budapest flexible 4 days, mixed", "budapest", flex(4, ["popular", "cultureHistory"]), true],
  ["budapest flexible 5 days, mixed", "budapest", flex(5, ["popular", "cultureHistory"]), false],
  ["budapest flexible 10 days, food", "budapest", flex(10, ["food"]), false],
  ["budapest surprise 4", "budapest", flex(4, [], true), true],
  ["budapest surprise 5", "budapest", flex(5, [], true), false],
  ["budapest culture only 3", "budapest", flex(3, ["cultureHistory"]), true],
  ["budapest culture only 4", "budapest", flex(4, ["cultureHistory"]), false],
  ["budapest popular only 3", "budapest", flex(3, ["popular"]), true],
  ["budapest popular only 4", "budapest", flex(4, ["popular"]), false],
  ["budapest nature only 1", "budapest", flex(1, N), true],
  ["budapest nature only 2", "budapest", flex(2, N), false],
  ["budapest nature + food 4", "budapest", flex(4, [...N, "food"]), true],
  ["budapest dated 4 days (1-4 Dec)", "budapest", dated("2026-12-01", "2026-12-04", ["food"]), true],
  ["budapest dated 5 days (1-5 Dec)", "budapest", dated("2026-12-01", "2026-12-05", ["food"]), false],
  ["budapest dated culture only 3 days", "budapest", dated("2026-12-01", "2026-12-03", ["cultureHistory"]), true],
  ["budapest dated culture only 4 days", "budapest", dated("2026-12-01", "2026-12-04", ["cultureHistory"]), false],
  ["budapest dated nature only 1 day", "budapest", dated("2026-12-01", "2026-12-01", N), true],
  ["budapest dated nature only 2 days", "budapest", dated("2026-12-01", "2026-12-02", N), false],
  ["prague flexible 10, culture only", "prague", flex(10, ["cultureHistory"]), true],
  ["prague dated 10 days, nature only", "prague", dated("2026-12-01", "2026-12-10", N), true],
  ["barcelona flexible 10, popular only", "barcelona", flex(10, ["popular"]), true],
  ["barcelona flexible 11 (general limit)", "barcelona", flex(11, ["popular"]), false],
];
for (const [name, city, a, accept] of serverCases) {
  const r = normalizePersonalizedAnswers(a, city);
  check(`server ${name}`, r.ok === accept, `ok=${r.ok}, want ${accept}`);
}

// ── 3. Holiday hours on the affected dates (real generation entry point) ────────────────────────────────────
const MNM = "hungarian-national-museum", MNG = "hungarian-national-gallery", OPERA = "opera-house-tour", HOM = "house-of-music";
const RULE_PLACES = [MNM, MNG, OPERA, HOM];
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const plans: any[] = [];
async function gen(id: string, arrival: string, departure: string, interests: string[]) {
  const input = { destinationId: "budapest", dateMode: "specific", arrivalDate: arrival, departureDate: departure, interests, accommodation: { booked: false } };
  const r: any = await generateBarcelonaPlanV2(input);
  plans.push({ id, input, ok: r.ok, plan: r.ok ? r.data : null, error: r.ok ? undefined : r.error });
  return r.ok ? r.data : null;
}
const dateOf = (arrival: string, dayNumber: number) => { const d = new Date(arrival + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + dayNumber - 1); return d.toISOString().slice(0, 10); };
const scheduled = (plan: any, placeId: string) => (plan?.days ?? []).flatMap((d: any) => (d.timeline?.stops ?? []).filter((s: any) => s.placeId === placeId).map((s: any) => ({ day: d.dayNumber, start: s.startMinutes, end: s.endMinutes })));
const suggested = (plan: any, placeId: string) => (plan?.days ?? []).flatMap((d: any) => (d.optionalNearby ?? []).filter((o: any) => o.id === placeId).map((o: any) => ({ day: d.dayNumber, reason: o.reason })));
const REASON = "اختياري: مواعيد العطلة لهاليوم مش مؤكدة. تأكّد من الموقع الرسمي قبل ما تروح.";
// Year-end dates (24-26 Dec, 31 Dec, 1 Jan) whose hours are unconfirmed: from Dec 2026 for the gallery, the Opera tour and the House of
// Music (no kept official source); from Dec 2027 for the National Museum (its 2026 table is official).
const unconfirmedFrom = (placeId: string) => (placeId === MNM ? 2027 : 2026);
const unconfirmedOn = (placeId: string, iso: string) => {
  const y = Number(iso.slice(0, 4)), md = iso.slice(5);
  return (["12-24", "12-25", "12-26", "12-31"].includes(md) && y >= unconfirmedFrom(placeId)) || (md === "01-01" && y - 1 >= unconfirmedFrom(placeId));
};
const MNM_CLOSED_2026 = ["2026-12-24", "2026-12-25", "2026-12-26", "2027-01-01"];
const { BUDAPEST_CITY_MODULE } = await import(pathToFileURL(R + "lib/planner/budapest/budapestCityModule.ts").href);

/** The rule on one generated trip: never on the clock on an unconfirmed date; a conditional suggestion with the reason exactly when the
 *  place matches the request (the module's own relevance rule), the trip has such a date and the plan has the place nowhere else. */
async function holidayTrip(id: string, a: string, d: string, interests: string[]) {
  const plan = await gen(id, a, d, interests);
  check(`${id}: generated`, !!plan);
  if (!plan) return;
  const tripDates = plan.days.map((day: any) => dateOf(a, day.dayNumber));
  const relevance = BUDAPEST_CITY_MODULE.placeRelevance(interests, false);
  const threshold = BUDAPEST_CITY_MODULE.relevanceThresholdFor({ days: plan.days.length, relevance });
  for (const p of RULE_PLACES) {
    const onClock = scheduled(plan, p).map((v: any) => ({ ...v, iso: dateOf(a, v.day) }));
    check(`${id}: ${p} not on the clock on an unconfirmed date`, onClock.every((v: any) => !unconfirmedOn(p, v.iso)), JSON.stringify(onClock.map((v: any) => v.iso)));
    if (p === MNM) {
      check(`${id}: museum not on an official closed date`, onClock.every((v: any) => !MNM_CLOSED_2026.includes(v.iso)), JSON.stringify(onClock.map((v: any) => v.iso)));
      for (const v of onClock.filter((x: any) => x.iso === "2026-12-31")) check(`${id}: museum on 31 Dec 2026 within 10:00-14:00, start by 13:00`, v.start >= toMin("10:00") && v.end <= toMin("14:00") && v.start <= toMin("13:00"), `${v.start}-${v.end}`);
    }
    const all = suggested(plan, p);
    const withReason = all.filter((s: any) => s.reason === REASON);
    const otherOptional = all.length - withReason.length;
    const expected = relevance(p) >= threshold && onClock.length === 0 && otherOptional === 0 && tripDates.some((iso: string) => unconfirmedOn(p, iso)) ? 1 : 0;
    check(`${id}: ${p} conditional suggestion ${expected ? "offered" : "not offered"} (relevance ${relevance(p)}/${threshold}, on clock ${onClock.length}, other suggestion ${otherOptional})`, withReason.length === expected && withReason.every((s: any) => unconfirmedOn(p, dateOf(a, s.day))), JSON.stringify(withReason));
  }
}
for (const [id, a, d, interests] of [
  ["culture 24-26 Dec 2026", "2026-12-24", "2026-12-26", ["cultureHistory"]],
  ["culture 25-27 Dec 2026", "2026-12-25", "2026-12-27", ["cultureHistory"]],
  ["culture 30 Dec 2026-1 Jan 2027", "2026-12-30", "2027-01-01", ["cultureHistory"]],
  ["culture 31 Dec 2026", "2026-12-31", "2026-12-31", ["cultureHistory"]],
  ["mixed 23-26 Dec 2026", "2026-12-23", "2026-12-26", ["popular", "cultureHistory", "natureViews", "beachRelax"]],
  ["culture 27 Dec 2026 (ordinary)", "2026-12-27", "2026-12-27", ["cultureHistory"]],
  ["culture 24-26 Dec 2027", "2027-12-24", "2027-12-26", ["cultureHistory"]],
  ["culture 31 Dec 2027-1 Jan 2028", "2027-12-31", "2028-01-01", ["cultureHistory"]],
  ["culture 25 Dec 2029", "2029-12-25", "2029-12-25", ["cultureHistory"]],
  ["culture 21-23 Dec 2027 (ordinary)", "2027-12-21", "2027-12-23", ["cultureHistory"]],
  ["shopping 24-26 Dec 2027", "2027-12-24", "2027-12-26", ["shopping"]],
  ["nature 25 Dec 2027", "2027-12-25", "2027-12-25", N],
  ["food 31 Dec 2027-1 Jan 2028", "2027-12-31", "2028-01-01", ["food"]],
] as const) await holidayTrip(id, a, d, [...interests]);
{
  const ord = plans.find((x) => x.id === "culture 21-23 Dec 2027 (ordinary)")?.plan;
  check("21-23 Dec 2027 (ordinary): museums or tours scheduled as usual", RULE_PLACES.some((p) => scheduled(ord, p).length > 0));
}

// Planning hours per date: the official 2026 table for the museum; the other places keep their regular hours on ordinary days of the same
// weeks (the rest of a trip is not blocked) and are not schedulable on the unconfirmed dates.
{
  const { resolveHoursForTrip } = await import(pathToFileURL(R + "lib/planner/tripHours.ts").href);
  const { BUDAPEST_PLACES } = await import(pathToFileURL(R + "lib/planner/budapest/budapestPlaces.ts").href);
  const { resolvePlannerPlace } = await import(pathToFileURL(R + "lib/readyPlan.ts").href);
  const hoursOf = (id: string) => (resolvePlannerPlace(id, BUDAPEST_PLACES)?.place as any)?.hours;
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const on = (id: string, iso: string) => { const h = resolveHoursForTrip(hoursOf(id), [iso]); const wd = WD[new Date(iso + "T12:00:00Z").getUTCDay()]; const sch = h?.planningSchedule ?? h?.schedule; return { ranges: (sch?.[wd] ?? []).map((r: any) => `${r.open}-${r.close}`).join(","), last: h?.planningLastEntry ?? h?.lastEntry ?? "" }; };
  const expect: [string, string, string, string][] = [
    [MNM, "2026-12-23", "10:00-18:00", "17:00"], [MNM, "2026-12-24", "", ""], [MNM, "2026-12-25", "", ""], [MNM, "2026-12-26", "", ""], [MNM, "2026-12-27", "10:00-18:00", "17:00"],
    [MNM, "2026-12-28", "", ""], [MNM, "2026-12-29", "10:00-18:00", "17:00"], [MNM, "2026-12-30", "10:00-18:00", "17:00"], [MNM, "2026-12-31", "10:00-14:00", "13:00"], [MNM, "2027-01-01", "", ""],
    [MNM, "2027-01-02", "10:00-18:00", "17:00"], [MNM, "2027-12-24", "", ""], [MNM, "2027-12-27", "", ""], [MNM, "2027-12-28", "10:00-18:00", "17:00"], [MNM, "2027-12-31", "", ""],
    [OPERA, "2026-12-23", "13:30-17:30", "16:30"], [OPERA, "2026-12-27", "13:30-17:30", "16:30"], [OPERA, "2026-12-24", "", ""], [OPERA, "2026-12-31", "", ""], [OPERA, "2027-01-01", "", ""],
    [HOM, "2026-12-23", "10:15-17:50", "16:15"], [HOM, "2026-12-27", "10:15-17:50", "16:15"], [HOM, "2026-12-25", "10:15-19:50", ""], [HOM, "2026-12-26", "", ""], [HOM, "2027-01-01", "", ""],
    [MNG, "2026-12-23", "10:00-17:30", "17:00"], [MNG, "2026-12-30", "10:00-17:30", "17:00"], [MNG, "2026-12-24", "", ""], [MNG, "2026-12-28", "", ""], [MNG, "2027-01-01", "", ""],
  ];
  for (const [id, iso, ranges, last] of expect) {
    const got = on(id, iso);
    // 25 Dec 2026 is a Friday: the House of Music row checks it is NOT schedulable (an unconfirmed date), whatever Friday's hours are.
    const want = id === HOM && iso === "2026-12-25" ? "" : ranges;
    check(`planning hours ${id} ${iso}`, got.ranges === want && (want === "" || got.last === last), `${got.ranges || "none"} last ${got.last || "-"}`);
  }
  check("museum card shows its 2026 holiday text", hoursOf(MNM)?.type === "variable" && String(hoursOf(MNM).display).startsWith("مواعيد العطلة: 24–26 ديسمبر 2026 مسكّر"));
  check("gallery card says the year-end hours are not confirmed (no dates stated as fact)", hoursOf(MNG)?.type === "variable" && String(hoursOf(MNG).display).startsWith("مواعيد عطلة آخر السنة (24–26 و31 ديسمبر و1 يناير): ما قدرنا نتأكد منها"));
  check("House of Music card is a text (no weekly table that says open on a holiday)", hoursOf(HOM)?.type === "variable" && String(hoursOf(HOM).display).includes("مواعيد عطلة آخر السنة (24–26 و31 ديسمبر و1 يناير) مش مؤكدة"));
}


// ── 4. Texts ────────────────────────────────────────────────────────────────────────────────────────────
check("title: City Park + Andrássy and the Opera", budapestTemplate("حديقة المدينة و Andrássy والأوبرا", "en") === "City Park, Andrássy Avenue and the Opera", String(budapestTemplate("حديقة المدينة و Andrássy والأوبرا", "en")));
check("title: Parliament and St Stephen's + Margaret Island", budapestTemplate("البرلمان والكاتدرائية وجزيرة Margaret", "en") === "Parliament, St Stephen’s Basilica and Margaret Island", String(budapestTemplate("البرلمان والكاتدرائية وجزيرة Margaret", "en")));
check("title: two parts keep &", budapestTemplate("تلة القلعة وضفة الدانوب", "en") === "Castle Hill & Danube bank", String(budapestTemplate("تلة القلعة وضفة الدانوب", "en")));
check("title: Hebrew unchanged", budapestTemplate("حديقة المدينة و Andrássy والأوبرا", "he") === "פארק העיר ו־Andrássy והאופרה", String(budapestTemplate("حديقة المدينة و Andrássy والأوبرا", "he")));
// House of Music: the note a plan shows when its slot is missed, translated through the plan view's lookup.
if (localizePlan) {
  const probe = { destination: "budapest", days: [{ dayNumber: 1, title: "يوم تلة القلعة", summary: "", stops: [], legs: [], optionalNearby: [{ id: "x", name: "x", reason: "مواعيد الدخول كل نص ساعة، عند الدقيقة 15 و45. احجز الموعد اللي بناسب خطتك." }] }], placeDetails: {} };
  let en = "";
  try { en = JSON.stringify(localizePlan(probe as any, "en")); } catch (e: any) { en = "error " + e.message; }
  check("House of Music text translated (en)", en.includes("Timed entry every 30 minutes, at :15 and :45 past the hour. Book the entry time that fits your plan."), en.slice(0, 200));
}

// Point 1-2 of the owner's Preview approval (2026-11-16): one-day texts, Budapest's "nature" label, no booking condition.
{
  const { interestGroupLabelForDestination } = await import(pathToFileURL(R + "lib/planner/plannerDestinations.ts").href);
  const { plannerCopyAr, plannerCopyEn } = await import(pathToFileURL(R + "lib/plannerCopy.ts").href);
  const { PLACE_CARD_TEXT } = await import(pathToFileURL(R + "lib/i18n/planText.ts").href);
  const { BUDAPEST_CITY_MODULE } = await import(pathToFileURL(R + "lib/planner/budapest/budapestCityModule.ts").href);
  check("label: Budapest nature group (ar)", interestGroupLabelForDestination("budapest", "natureBeaches", "ar") === "طبيعة وإطلالات");
  check("label: Budapest nature group (en)", interestGroupLabelForDestination("budapest", "natureBeaches", "en") === "Nature & views");
  check("label: Barcelona keeps the default", interestGroupLabelForDestination("barcelona", "natureBeaches", "ar") === undefined);
  check("one day, flexible (ar)", plannerCopyAr.wizard.limitFixOneDayOrInterest === "اختار يوم واحد أو ضيف اهتمام تاني.");
  check("one day, dates (ar)", plannerCopyAr.wizard.limitFixOneDateOrInterest === "خلّي الوصول والمغادرة بنفس اليوم، أو ضيف اهتمام تاني.");
  check("one day, flexible (en)", plannerCopyEn.wizard.limitFixOneDayOrInterest === "Choose 1 day, or add another interest.");
  check("Opera card line (ar)", PLACE_CARD_TEXT.ar.hours.sessionsBooking === "الدخول بجولة فقط، حسب المواعيد وتوفّر التذاكر.", PLACE_CARD_TEXT.ar.hours.sessionsBooking);
  check("Opera card line (en)", PLACE_CARD_TEXT.en.hours.sessionsBooking === "Entry by guided tour only, subject to tour times and ticket availability.", PLACE_CARD_TEXT.en.hours.sessionsBooking);
  const warnings = ["opera-house-tour", "danube-legend-cruise", "house-of-music"].flatMap((id) => (BUDAPEST_CITY_MODULE.operationalWarnings(id, null) ?? []).map((w: any) => w.textAr));
  check("warnings: no booking condition (Opera, cruise, House of Music)", warnings.length === 3 && warnings.every((t: string) => !/مشروطة بالحجز|محجوز/.test(t)), warnings.join(" | "));
}

// Temporary launch scope by date (owner, 2026-11-16): Budapest dated trips touching 24-26 Dec 2026, 31 Dec 2026 or 1 Jan 2027 are refused,
// in the shared function and in the server check, before any order or plan; other years, other cities and undated plans are not.
{
  const { unavailableTripDates, tripDateMessages } = await import(pathToFileURL(R + "lib/planner/tripLengthLimits.ts").href);
  const dateCases: [string, string, string, string, boolean][] = [
    ["ends the day before", "budapest", "2026-12-20", "2026-12-23", false],
    ["starts before, runs into 24 Dec", "budapest", "2026-12-21", "2026-12-24", true],
    ["23-26 Dec", "budapest", "2026-12-23", "2026-12-26", true],
    ["24 Dec only", "budapest", "2026-12-24", "2026-12-24", true],
    ["26-27 Dec (first day blocked)", "budapest", "2026-12-26", "2026-12-27", true],
    ["27-30 Dec (between the two windows)", "budapest", "2026-12-27", "2026-12-30", false],
    ["28-31 Dec (runs into 31 Dec)", "budapest", "2026-12-28", "2026-12-31", true],
    ["30 Dec-1 Jan", "budapest", "2026-12-30", "2027-01-01", true],
    ["1-2 Jan 2027", "budapest", "2027-01-01", "2027-01-02", true],
    ["starts the day after", "budapest", "2027-01-02", "2027-01-05", false],
    ["24-26 Dec 2027 (other year, not generalised)", "budapest", "2027-12-24", "2027-12-26", false],
    ["24-26 Dec 2025 (other year)", "budapest", "2025-12-24", "2025-12-26", false],
    ["Prague 24-26 Dec 2026", "prague", "2026-12-24", "2026-12-26", false],
    ["Barcelona 30 Dec 2026-1 Jan 2027", "barcelona", "2026-12-30", "2027-01-01", false],
  ];
  for (const [name, city, a, d, blocked] of dateCases) {
    check(`date scope (function) ${name}`, !!unavailableTripDates(city, a, d) === blocked, JSON.stringify(unavailableTripDates(city, a, d)));
    const interests = city === "budapest" ? ["food"] : ["popular"];
    const r = normalizePersonalizedAnswers({ dateMode: "specific", arrivalDate: a, departureDate: d, interests, surpriseMe: false, accommodation: { booked: false } }, city);
    check(`date scope (server) ${name}`, r.ok === !blocked, `ok=${r.ok}`);
  }
  check("date scope (server) Budapest flexible 3 days accepted", normalizePersonalizedAnswers({ dateMode: "flexible", durationDays: 3, interests: ["food"], surpriseMe: false, accommodation: { booked: false } }, "budapest").ok === true);
  check("date scope message (ar) is the owner's wording", tripDateMessages("budapest", "ar")?.unavailable === "خطط بودابست مش متاحة حاليًا لهالتواريخ بسبب تغيّر مواعيد الأماكن بالأعياد. اختار تواريخ ثانية أو مدينة ثانية.");
  check("undated note exists for Budapest only", !!tripDateMessages("budapest", "en")?.undatedNote && tripDateMessages("prague", "ar") === null && tripDateMessages("barcelona", "ar") === null);
}

// The generated holiday plans, in the shape the other review tools read ([{ id, plan }]).
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(plans.filter((p) => p.plan).map((p) => ({ id: p.id, c: p.input, plan: p.plan }))));
console.log(log.join("\n"));
console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"} (${log.length} checks)`);
process.exit(failures === 0 ? 0 : 1);

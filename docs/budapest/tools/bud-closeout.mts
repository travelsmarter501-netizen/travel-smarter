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
const MNM = "hungarian-national-museum", MNG = "hungarian-national-gallery";
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
const REASON = "اختياري: مواعيد العطلة لهاليوم مش منشورة لسا. تأكّد من موقع المتحف قبل ما تروح.";

// 2026 (official table): closed 24-26 Dec and 1 Jan; 31 Dec 10:00-14:00 (last entry 13:00 assumed); 27, 29, 30 open.
for (const [id, a, d] of [["culture 24-26 Dec 2026", "2026-12-24", "2026-12-26"], ["culture 25-27 Dec 2026", "2026-12-25", "2026-12-27"], ["culture 30 Dec 2026-1 Jan 2027", "2026-12-30", "2027-01-01"], ["culture 31 Dec 2026", "2026-12-31", "2026-12-31"]] as const) {
  const plan = await gen(id, a, d, ["cultureHistory"]);
  check(`${id}: generated`, !!plan);
  for (const v of scheduled(plan, MNM)) {
    const iso = dateOf(a, v.day);
    check(`${id}: museum not scheduled on a closed date`, !["2026-12-24", "2026-12-25", "2026-12-26", "2027-01-01"].includes(iso), iso);
    if (iso === "2026-12-31") check(`${id}: museum on 31 Dec within 10:00-14:00, start by 13:00`, v.start >= toMin("10:00") && v.end <= toMin("14:00") && v.start <= toMin("13:00"), `${v.start}-${v.end}`);
  }
  check(`${id}: no "not published" suggestion in 2026/27 (official hours known)`, suggested(plan, MNM).every((s: any) => s.reason !== REASON) && suggested(plan, MNG).every((s: any) => s.reason !== REASON));
}
// The National Museum's planning hours on each date of the official 2026 table (the generated culture trips above do not pick it).
{
  const { resolveHoursForTrip } = await import(pathToFileURL(R + "lib/planner/tripHours.ts").href);
  const { BUDAPEST_PLACES } = await import(pathToFileURL(R + "lib/planner/budapest/budapestPlaces.ts").href);
  const { resolvePlannerPlace } = await import(pathToFileURL(R + "lib/readyPlan.ts").href);
  const hours = (resolvePlannerPlace(MNM, BUDAPEST_PLACES)?.place as any)?.hours;
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const on = (iso: string) => { const h = resolveHoursForTrip(hours, [iso]); const wd = WD[new Date(iso + "T12:00:00Z").getUTCDay()]; return { ranges: (h?.planningSchedule?.[wd] ?? []).map((r: any) => `${r.open}-${r.close}`).join(","), last: h?.planningLastEntry ?? "" }; };
  const expect: [string, string, string][] = [
    ["2026-12-23", "10:00-18:00", "17:00"], ["2026-12-24", "", ""], ["2026-12-25", "", ""], ["2026-12-26", "", ""], ["2026-12-27", "10:00-18:00", "17:00"],
    ["2026-12-28", "", ""], ["2026-12-29", "10:00-18:00", "17:00"], ["2026-12-30", "10:00-18:00", "17:00"], ["2026-12-31", "10:00-14:00", "13:00"], ["2027-01-01", "", ""],
    ["2027-01-02", "10:00-18:00", "17:00"], ["2027-12-24", "", ""], ["2027-12-27", "", ""], ["2027-12-28", "10:00-18:00", "17:00"], ["2027-12-31", "", ""],
  ];
  for (const [iso, ranges, last] of expect) {
    const got = on(iso);
    check(`museum planning hours ${iso}`, got.ranges === ranges && (ranges === "" || got.last === last), `${got.ranges || "none"} last ${got.last || "-"}`);
  }
  check("museum card shows the holiday text, not a weekly table", hours?.type === "variable" && String(hours.display).startsWith("مواعيد العطلة: 24–26 ديسمبر 2026 مسكّر"));
}
// The 2026 museum visit on 27 Dec (open) still possible: one-day trip on 27 Dec.
{
  const plan = await gen("culture 27 Dec 2026 (open)", "2026-12-27", "2026-12-27", ["cultureHistory"]);
  check("27 Dec 2026: generated", !!plan);
}
// 2027+ (not published): never on the clock on 24-26, 31 Dec, 1 Jan; a conditional suggestion with the reason when relevant.
for (const [id, a, d] of [["culture 24-26 Dec 2027", "2027-12-24", "2027-12-26"], ["culture 31 Dec 2027-1 Jan 2028", "2027-12-31", "2028-01-01"], ["culture 25 Dec 2029", "2029-12-25", "2029-12-25"]] as const) {
  const plan = await gen(id, a, d, ["cultureHistory"]);
  check(`${id}: generated`, !!plan);
  for (const p of [MNM, MNG]) {
    check(`${id}: ${p} not on the clock`, scheduled(plan, p).length === 0, JSON.stringify(scheduled(plan, p)));
    const s = suggested(plan, p);
    check(`${id}: ${p} offered as a conditional suggestion with the reason`, s.length === 1 && s[0].reason === REASON, JSON.stringify(s));
  }
}
// The day after (27 Dec 2027, Monday: both closed as every Monday) and an ordinary 2027 day keep regular behaviour.
{
  const plan = await gen("culture 21-23 Dec 2027 (ordinary)", "2027-12-21", "2027-12-23", ["cultureHistory"]);
  check("21-23 Dec 2027: generated", !!plan);
  check("21-23 Dec 2027: no holiday suggestion", [MNM, MNG].every((p) => suggested(plan, p).every((s: any) => s.reason !== REASON)));
  check("21-23 Dec 2027: the museum is scheduled as usual", scheduled(plan, MNM).length + scheduled(plan, MNG).length > 0);
}
// The suggestion follows the module's own relevance rule (the same as the cruise's): offered exactly when the museum matches the request
// at the request's threshold (it drops to 3 when the interests have few places, so a museum can match a shopping trip too).
{
  const { BUDAPEST_CITY_MODULE } = await import(pathToFileURL(R + "lib/planner/budapest/budapestCityModule.ts").href);
  for (const [id, a, d, interests] of [["shopping 24-26 Dec 2027", "2027-12-24", "2027-12-26", ["shopping"]], ["nature 25 Dec 2027", "2027-12-25", "2027-12-25", N], ["food 31 Dec 2027-1 Jan 2028", "2027-12-31", "2028-01-01", ["food"]]] as const) {
    const plan = await gen(id, a, d, [...interests]);
    const days = Math.round((Date.parse(d) - Date.parse(a)) / 86400000) + 1;
    const relevance = BUDAPEST_CITY_MODULE.placeRelevance([...interests], false);
    const threshold = BUDAPEST_CITY_MODULE.relevanceThresholdFor({ days, relevance });
    for (const p of [MNM, MNG]) {
      const relevant = relevance(p) >= threshold;
      const got = suggested(plan, p).filter((s: any) => s.reason === REASON).length;
      check(`${id}: ${p} suggested only if relevant (relevance ${relevance(p)}, threshold ${threshold})`, got === (relevant ? 1 : 0) && scheduled(plan, p).length === 0, `suggested ${got}`);
    }
  }
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

// The generated holiday plans, in the shape the other review tools read ([{ id, plan }]).
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(plans.filter((p) => p.plan).map((p) => ({ id: p.id, c: p.input, plan: p.plan }))));
console.log(log.join("\n"));
console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"} (${log.length} checks)`);
process.exit(failures === 0 ? 0 : 1);

/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Integration test of the REAL saved-plan action (customizeSavedPlan) with a controlled stand-in for Supabase: the two client modules
// are replaced by in-memory test doubles (fake-supabase/, via the resolution hook below); everything else is the product code. Test data only:
// a plan generated here, a made-up user and plan id. No customer or production data, nothing external.
//   1. An add the day cannot take returns add_unavailable, the save RPC is NEVER called, and the stored row is byte-identical.
//   2. A valid add calls the save RPC once; reading the row back gives the same day the action returned, with the place in it.
//   3. The same add again (a stale screen) is refused, with no second save.
// Not covered here: the page in a browser and a real Supabase (row-level security, the SQL function itself).
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-action-save.mts
import { pathToFileURL } from "url";
import * as nodeModule from "node:module";
// registerHooks exists in the Node runtime used here (24.x); the project's @types/node does not declare it yet.
const registerHooks = (nodeModule as any).registerHooks as (hooks: any) => void;
// Synchronous resolution hook (covers import AND require): ONLY the two Supabase client modules the action imports are swapped for the
// in-memory test doubles in fake-supabase/. Everything else, the action included, is the product code.
const FAKES: Record<string, string> = {
  "/utils/supabase/server": new URL("./fake-supabase/server.mjs", import.meta.url).href,
  "/utils/supabase/service-role": new URL("./fake-supabase/service-role.mjs", import.meta.url).href,
};
registerHooks({
  resolve(specifier: string, context: any, nextResolve: any) {
    for (const [suffix, url] of Object.entries(FAKES)) if (specifier.endsWith(suffix) || specifier.endsWith(suffix + ".ts")) return { url, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const db: any = { user: { id: "00000000-0000-4000-8000-0000000000aa" }, rows: [], calls: [] };
(globalThis as any).__fakeDb = db;
const A = await imp("/app/smart-planner/barcelona-v2/saved/[id]/actions.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const SC = await imp("/app/lib/planner/savedPlanCity.ts");
const SP = await imp("/app/lib/planner/smartPlannerV2SavedPlans.ts");
const G = await imp("/app/lib/planner/plannerTimingGuard.ts");
const FAKE = await import(new URL("./fake-supabase/server.mjs", import.meta.url).href);
const { generateBarcelonaPlanV2 } = await imp("/app/smart-planner/barcelona-v2/actions.ts");

let passed = 0, failed = 0;
function expect(label: string, got: string, want: string) {
  const ok = got === want;
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${got}${ok ? "" : `  (expected ${want})`}`);
}
const CRUISE = "danube-legend-cruise";
const PLAN_ID = "11111111-2222-4333-8444-555555555555";
const rpcCalls = () => db.calls.filter((c: string) => c.startsWith("rpc ")).length;

// Test plan: Budapest, 30 Dec 2026 - 2 Jan 2027 (2027 days have no cruise timetable), food / shopping / experiences.
const input = { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-12-30", departureDate: "2027-01-02", interests: ["food", "shopping", "footballExperiences", "nightlife"], accommodation: { booked: false } };
const r: any = await generateBarcelonaPlanV2(input);
if (!r.ok) throw new Error(r.error);
const plan = r.data;
db.rows.push({
  id: PLAN_ID, user_id: db.user.id, product_slug: SP.V2_SAVED_PLAN_PRODUCT_SLUG, destination_slug: "budapest", created_at: "2026-11-14T00:00:00Z",
  preferences_json: { plannerVersion: "v2", dateMode: "specific", arrivalDate: input.arrivalDate, departureDate: input.departureDate, interests: input.interests, accommodation: { booked: false } },
  generated_plan_json: { plan },
});
expect("seeded row is a valid saved plan", String(SP.isValidSmartPlannerV2SavedPlanRow(db.rows[0])), "true");
const snapshot = () => JSON.stringify(db.rows[0]);

// 1. Adds the day cannot take.
const day2027 = plan.days.find((d: any) => d.actualDate.startsWith("2027"));
const cruiseOnClock = plan.days.some((d: any) => d.stops.some((s: any) => s.id === CRUISE));
const usedElsewhere = plan.days[0].stops[0]?.id;
for (const [label, change] of [
  [`cruise on ${day2027.actualDate} (no published timetable)${cruiseOnClock ? " [cruise also on the clock elsewhere]" : ""}`, { kind: "add", dayNumber: day2027.dayNumber, placeId: CRUISE }],
  [`a place already in the trip (${usedElsewhere}, day 1) added to day 2`, { kind: "add", dayNumber: 2, placeId: usedElsewhere }],
  ["an unknown place id", { kind: "add", dayNumber: 1, placeId: "no-such-place" }],
] as [string, any][]) {
  const before = snapshot(), rpcBefore = rpcCalls();
  const res = await A.customizeSavedPlan(PLAN_ID, change);
  expect(`1 refuse: ${label}`, `${res.ok ? "SAVED" : res.code} / rpc calls +${rpcCalls() - rpcBefore} / row ${snapshot() === before ? "unchanged" : "CHANGED"}`, "add_unavailable / rpc calls +0 / row unchanged");
}

// 2. A valid add (the first place the page offers, through the same planAddOptions the page uses).
const city = SC.cityForSavedPlan(plan);
const options = C.planAddOptions(city, plan, {});
const dayKey = Object.keys(options.byDay).find((k) => options.byDay[k].length > 0);
if (!dayKey) expect("2 a place is offered on some day", "none", "one");
else {
  const placeId = options.byDay[dayKey][0].id;
  const rpcBefore = rpcCalls();
  const res = await A.customizeSavedPlan(PLAN_ID, { kind: "add", dayNumber: Number(dayKey), placeId });
  expect(`2 add ${placeId} to day ${dayKey}`, `${res.ok ? "ok" : res.code} / rpc calls +${rpcCalls() - rpcBefore}`, "ok / rpc calls +1");
  // Read the row back through the same client calls the page makes, and rebuild the edited plan as the page does.
  const client = await FAKE.createClient();
  const { data: row } = await client.from("smart_planner_saved_plans").select("*").eq("id", PLAN_ID).maybeSingle();
  const stored = C.sanitizeCustomizations(row.generated_plan_json.customizations);
  const reread = C.applyPlanCustomizations(SC.cityForSavedPlan(row.generated_plan_json.plan), row.generated_plan_json.plan, stored);
  const day = reread.days.find((d: any) => d.dayNumber === Number(dayKey));
  const stop = day.stops.find((s: any) => s.id === placeId);
  expect("2 re-read: the place is on that day, without a timing warning", stop ? (stop.warnings.some((w: any) => w.textAr === G.TIMING_WARNING_AR) ? "with warning" : "on the day") : "missing", "on the day");
  const sameDay = res.ok && JSON.stringify(res.day.stops.map((s: any) => s.id)) === JSON.stringify(day.stops.map((s: any) => s.id)) && JSON.stringify(res.day.timeline) === JSON.stringify(day.timeline);
  expect("2 re-read: same stops and times as the action returned", sameDay ? "same" : "different", "same");
  expect("2 the original plan is kept beside the edits", JSON.stringify(row.generated_plan_json.plan) === JSON.stringify(plan) ? "original kept" : "CHANGED", "original kept");
  // 3. The same add again (e.g. a stale screen): refused, no second save.
  const before = snapshot(), rpc2 = rpcCalls();
  const again = await A.customizeSavedPlan(PLAN_ID, { kind: "add", dayNumber: Number(dayKey) === 1 ? 2 : 1, placeId });
  expect(`3 add ${placeId} again on another day`, `${again.ok ? "SAVED" : again.code} / rpc calls +${rpcCalls() - rpc2} / row ${snapshot() === before ? "unchanged" : "CHANGED"}`, "add_unavailable / rpc calls +0 / row unchanged");
}
// 1b. A trip with no published cruise timetable at all (2027): the cruise is only a suggestion; adding it is refused for that reason.
const PLAN_ID_2027 = "11111111-2222-4333-8444-666666666666";
const input27 = { ...input, arrivalDate: "2027-01-01", departureDate: "2027-01-03" };
const r27: any = await generateBarcelonaPlanV2(input27);
const plan27 = r27.data;
db.rows.push({ ...JSON.parse(JSON.stringify(db.rows[0])), id: PLAN_ID_2027, preferences_json: { ...db.rows[0].preferences_json, arrivalDate: input27.arrivalDate, departureDate: input27.departureDate }, generated_plan_json: { plan: plan27 } });
const sugDay = plan27.days.find((d: any) => d.optionalNearby.some((o: any) => o.id === CRUISE));
const onClock27 = plan27.days.some((d: any) => d.stops.some((s: any) => s.id === CRUISE));
expect("1b 2027 trip: cruise only as a suggestion", onClock27 ? "on the clock" : sugDay ? `suggested on day ${sugDay.dayNumber}` : "absent", sugDay ? `suggested on day ${sugDay.dayNumber}` : "suggested");
for (const day of plan27.days) {
  const before = JSON.stringify(db.rows[1]), rpcBefore = rpcCalls();
  const res = await A.customizeSavedPlan(PLAN_ID_2027, { kind: "add", dayNumber: day.dayNumber, placeId: CRUISE });
  expect(`1b refuse: cruise on ${day.actualDate}`, `${res.ok ? "SAVED" : res.code} / rpc calls +${rpcCalls() - rpcBefore} / row ${JSON.stringify(db.rows[1]) === before ? "unchanged" : "CHANGED"}`, "add_unavailable / rpc calls +0 / row unchanged");
}

// Other users' plans and signed-out requests are unchanged behaviour (sanity).
db.user = { id: "00000000-0000-4000-8000-0000000000bb" };
const other = await A.customizeSavedPlan(PLAN_ID, { kind: "reset", dayNumber: 1 });
expect("another user's plan", other.ok ? "SAVED" : other.code, "not_found");
db.user = null;
const out = await A.customizeSavedPlan(PLAN_ID, { kind: "reset", dayNumber: 1 });
expect("signed out", out.ok ? "SAVED" : out.code, "not_signed_in");

console.log(`\n${passed} pass, ${failed} fail; calls: ${db.calls.join(", ")}`);
process.exit(failed ? 1 : 0);

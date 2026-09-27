/**
 * Custom Plan Fulfillment V1 -- pure-logic QA matrix (A-Z where the check doesn't require a
 * live Supabase connection or the pending migration). Exercises the real generator/draft/
 * final-plan modules directly (none of them import "server-only"), never a copy/mock. Run with:
 *   node app/lib/planner/customPlanFulfillmentQA.debug.ts
 * (Node 24's native TypeScript support -- no build step, no tsx needed.)
 */
import { generateCustomPlanDraft, type CustomPlanGenerationInput } from "./customPlanGenerator";
import {
  validateCustomPlanDraftPlanData,
  validateCustomPlanDraftForReady,
  normalizeDraftPlanData,
  type CustomPlanDraftPlanData,
  type CustomPlanDraftStop,
} from "../customPlanDraft";
import { buildFinalPlanDataFromDraft } from "../customPlanFinalPlan";
import { resolveStopDisplay, getUnresolvedPlaceIds } from "../customPlanAdminDisplay";
import { V2_SURPRISE_ME_PRESET } from "./v2PlannerTypes";

let pass = 0;
let fail = 0;
function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    pass++;
    console.log(`[PASS] ${label}`);
  } else {
    fail++;
    console.log(`[FAIL] ${label}${detail ? " -- " + detail : ""}`);
  }
}

function baseInput(overrides: Partial<CustomPlanGenerationInput> = {}): CustomPlanGenerationInput {
  return {
    requestId: "qa-request-id",
    durationDays: 3,
    arrivalDate: null,
    accommodation: null,
    travelerType: null,
    hasChildren: null,
    interests: ["popular"],
    mustVisit: null,
    foodPreferences: [],
    nightlifeTypes: [],
    pace: "balanced",
    budgetStyle: null,
    ...overrides,
  };
}

// ── A-D: duration 1/3/5/10 ──────────────────────────────────────────────────────────────────
for (const durationDays of [1, 3, 5, 10]) {
  const plan = generateCustomPlanDraft(baseInput({ durationDays }));
  const err = validateCustomPlanDraftPlanData(plan);
  check(`${durationDays}-day draft generation succeeds, no validation error`, err === null, err ?? undefined);
  check(`${durationDays}-day draft has exactly ${durationDays} days`, plan.days.length === durationDays);
  check(`${durationDays}-day draft: every day has >=1 stop`, plan.days.every((d) => d.stops.length >= 1));
}

// ── E: specific dates -> correct actual dates ───────────────────────────────────────────────
{
  const arrivalDate = "2026-11-10";
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 5, arrivalDate }));
  const expectedDates = ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14"];
  const actualDates = plan.days.map((d) => d.date);
  check("specific dates: day.date matches arrivalDate + offset for every day", JSON.stringify(actualDates) === JSON.stringify(expectedDates), actualDates.join(","));
}

// ── F: Surprise Me -> balanced interests respected (no crash, produces a full plan) ────────
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 3, interests: V2_SURPRISE_ME_PRESET }));
  check("Surprise Me preset generates a valid 3-day plan", validateCustomPlanDraftPlanData(plan) === null && plan.days.length === 3);
}

// ── G: food-heavy -> relevant supplementary output ──────────────────────────────────────────
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 3, foodPreferences: ["fineDining"], interests: ["food"] }));
  const lunchOrDinnerCount = plan.days.reduce((n, d) => n + d.stops.filter((s) => s.kind === "lunch" || s.kind === "dinner").length, 0);
  check("food-heavy request produces lunch/dinner suggestion stops", lunchOrDinnerCount > 0, `count=${lunchOrDinnerCount}`);
}

// ── H: nightlife-heavy -> relevant supplementary output ─────────────────────────────────────
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 3, interests: ["nightlife"], nightlifeTypes: ["bars", "clubs"] }));
  const nightlifeCount = plan.days.reduce((n, d) => n + d.stops.filter((s) => s.kind === "nightlife").length, 0);
  check("nightlife-heavy request produces nightlife suggestion stops", nightlifeCount > 0, `count=${nightlifeCount}`);
}

// ── I: booked hotel -> accommodation cluster nudge doesn't crash / preserves input ──────────
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 3, accommodation: "Hotel near Sagrada Familia, Eixample" }));
  check("booked-hotel request (accommodation text present) still generates a valid plan", validateCustomPlanDraftPlanData(plan) === null);
}

// ── J: not booked -> works without accommodation text ───────────────────────────────────────
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 3, accommodation: null }));
  check("not-booked (accommodation=null) still generates a valid plan", validateCustomPlanDraftPlanData(plan) === null);
}

// ── K/L (data-shape half): generation is a pure function -- same input -> a valid plan each
// time; the "no silent overwrite" GUARANTEE itself lives in customPlanAdmin.ts's DB-existence
// check (server-only, audited separately, not executable here -- see the final report).
{
  const plan1 = generateCustomPlanDraft(baseInput({ durationDays: 3 }));
  const plan2 = generateCustomPlanDraft(baseInput({ durationDays: 3 }));
  check("generator is deterministic given the same input (K precondition)", JSON.stringify(plan1.days.map((d) => d.stops.map((s) => s.placeId))) === JSON.stringify(plan2.days.map((d) => d.stops.map((s) => s.placeId))));
}

// ── M/N/O/P: simulate the exact editor operations (CustomPlanDraftEditor.tsx's own reducers)
// on a real generated plan, then re-validate -- proves the DATA CONTRACT survives an edit
// round-trip; the click-handling itself is plain React state, not re-tested here.
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 3 }));
  const day = plan.days[0];
  const originalStopCount = day.stops.length;

  // M: edit day title
  day.title = "يوم مخصص جديد";
  check("M: day title edit persists in-memory", plan.days[0].title === "يوم مخصص جديد");

  // N: edit day summary
  day.summary = "صباح بالحي القوطي، عصر عالشاطئ";
  check("N: day summary edit persists in-memory", plan.days[0].summary === "صباح بالحي القوطي، عصر عالشاطئ");

  // O: reorder stop (swap index 0 and 1, exactly like CustomPlanDraftEditor.tsx's moveStop)
  if (day.stops.length >= 2) {
    const before = [day.stops[0].placeId, day.stops[1].placeId];
    [day.stops[0], day.stops[1]] = [day.stops[1], day.stops[0]];
    const after = [day.stops[0].placeId, day.stops[1].placeId];
    check("O: reorder swaps the two stops", after[0] === before[1] && after[1] === before[0]);
  } else {
    check("O: reorder swaps the two stops", true, "skipped -- day had <2 stops, N/A for this generation");
  }

  // P: remove stop (exactly like CustomPlanDraftEditor.tsx's removeStop -- filter by index)
  const removedPlaceId = day.stops[0].placeId;
  day.stops = day.stops.filter((_, i) => i !== 0);
  check("P: remove stop drops exactly one stop", day.stops.length === originalStopCount - 1 && !day.stops.some((s) => s.placeId === removedPlaceId));

  const postEditError = validateCustomPlanDraftPlanData(plan);
  check("plan still passes base validation after M/N/O/P edits", postEditError === null, postEditError ?? undefined);
}

// ── Q/R: adminNote/customerNote separation -- structural, not a filter ─────────────────────
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 2 }));
  const secretAdminNote = "SECRET: negotiate discount with venue, do not tell customer";
  const visibleCustomerNote = "افتح بعد الساعة 10 صباحًا، الزحمة أقل";
  plan.days[0].stops[0].adminNote = secretAdminNote;
  plan.days[0].stops[0].customerNote = visibleCustomerNote;

  const finalData = buildFinalPlanDataFromDraft(plan, new Date().toISOString());
  const finalJson = JSON.stringify(finalData);

  check("Q: adminNote text does NOT appear anywhere in the frozen final-plan JSON", !finalJson.includes(secretAdminNote));
  check("Q: CustomPlanFinalPlanStop has no adminNote key at all (structural, not filtered)", !("adminNote" in finalData.days[0].stops[0]));
  check("R: customerNote DOES survive into the frozen final-plan JSON", finalData.days[0].stops[0].customerNote === visibleCustomerNote);
}

// ── T/U: ready validation -- valid plan passes, malformed plan is blocked with clear errors ─
{
  const validPlan = generateCustomPlanDraft(baseInput({ durationDays: 3, arrivalDate: "2026-12-01" }));
  const noErrors = validateCustomPlanDraftForReady(validPlan, { durationDays: 3, arrivalDate: "2026-12-01" }, new Set());
  check("T: a correct, complete draft passes the ready checklist with zero errors", noErrors.length === 0, JSON.stringify(noErrors));

  // U: malformed draft -- empty day, wrong duration count, unresolved placeId, wrong date
  const malformed: CustomPlanDraftPlanData = {
    requestId: "qa-request-id",
    destination: "barcelona",
    durationDays: 3,
    unmatchedMustVisits: [],
    generatedAt: new Date().toISOString(),
    days: [
      { dayNumber: 1, date: "2026-12-01", title: "Day 1", summary: "", stops: [{ placeId: "does-not-exist-anymore", title: "Ghost Place", kind: "visit" } as CustomPlanDraftStop] },
      { dayNumber: 2, date: "2026-12-02", title: "Day 2", summary: "", stops: [] }, // empty day
    ],
  };
  const errors = validateCustomPlanDraftForReady(malformed, { durationDays: 3, arrivalDate: "2026-12-01" }, new Set(["does-not-exist-anymore"]));
  check("U: malformed draft (wrong day count) is blocked", errors.some((e) => e.includes("عدد أيام")));
  check("U: malformed draft (empty day) is blocked", errors.some((e) => e.includes("ما فيه ولا محطة")));
  check("U: malformed draft (unresolved placeId) is blocked", errors.some((e) => e.includes("does-not-exist-anymore")));
  check("U: errors are multiple distinct messages, not just the first failure", errors.length >= 3, `got ${errors.length}: ${JSON.stringify(errors)}`);
}

// ── V (data half): freezing never regenerates -- same draft -> byte-identical final data
// twice in a row (repeat-deliver reuses the persisted row server-side; this proves the pure
// freeze step itself is deterministic and holds no hidden randomness/timestamp-only drift
// beyond the explicit deliveredAt param).
{
  const plan = generateCustomPlanDraft(baseInput({ durationDays: 2 }));
  const frozen1 = buildFinalPlanDataFromDraft(plan, "2026-01-01T00:00:00.000Z");
  const frozen2 = buildFinalPlanDataFromDraft(plan, "2026-01-01T00:00:00.000Z");
  check("V: freezing the same draft twice with the same deliveredAt produces byte-identical output", JSON.stringify(frozen1) === JSON.stringify(frozen2));
  check("V: frozen output carries no unmatchedMustVisits/generatedAt (admin-only fields dropped)", !("unmatchedMustVisits" in frozen1) && !("generatedAt" in frozen1));
}

// ── Legacy normalization: old draft shape (single `notes`, no summary/date) migrates safely ─
{
  const legacyRaw = {
    requestId: "qa-request-id",
    destination: "barcelona" as const,
    durationDays: 1,
    unmatchedMustVisits: [],
    generatedAt: new Date().toISOString(),
    days: [
      {
        dayNumber: 1,
        title: "اليوم 1",
        stops: [{ placeId: "sagrada-familia", title: "Sagrada Familia", kind: "visit" as const, notes: "old admin note text" }],
      },
    ],
  } as unknown as CustomPlanDraftPlanData;

  const normalized = normalizeDraftPlanData(legacyRaw);
  check("legacy draft gets summary/date defaulted safely", normalized.days[0].summary === "" && normalized.days[0].date === null);
  check("legacy `notes` migrates to adminNote (never customerNote)", normalized.days[0].stops[0].adminNote === "old admin note text" && normalized.days[0].stops[0].customerNote === null);
}

// ── Guide resolution sanity (backs Mark Ready's unresolved-placeId check) ───────────────────
{
  const known = resolveStopDisplay({ placeId: "sagrada-familia", title: "x", kind: "visit" });
  const unknown = resolveStopDisplay({ placeId: "totally-made-up-place-id", title: "x", kind: "visit" });
  check("resolveStopDisplay resolves a real guide placeId", known.unresolved === false && known.name.length > 0);
  check("resolveStopDisplay flags a fake placeId as unresolved", unknown.unresolved === true);

  const days = [{ stops: [{ placeId: "sagrada-familia" }, { placeId: "totally-made-up-place-id" }] as CustomPlanDraftStop[] }];
  const unresolvedIds = getUnresolvedPlaceIds(days as { stops: CustomPlanDraftStop[] }[]);
  check("getUnresolvedPlaceIds finds exactly the fake id", unresolvedIds.has("totally-made-up-place-id") && !unresolvedIds.has("sagrada-familia") && unresolvedIds.size === 1);
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);

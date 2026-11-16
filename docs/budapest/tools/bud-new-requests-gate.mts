/* eslint-disable -- review test (not shipped). */
// Test (exit 1 on failure), 2026-11-16: "closed to new requests" (plannerDestinations.ts `closedToNewRequests`).
//   - open (the committed state): Budapest offered and served, as before;
//   - closed (set IN THIS PROCESS ONLY on the exported list): not offered, new requests refused by the server check, but still SERVED
//     (paid requests built, existing plans regenerated), and `servingExisting` keeps every other rule (trip length, dates, general limit);
//   - Prague and Barcelona unchanged in both states; Vienna neither offered nor served.
// The end-to-end flows (checkout, paid request, owner regeneration, another user, day edits) were checked on the local dev server with
// the Supabase test double: docs/budapest/data/quality-close/new-requests-gate/.
// Usage: ROOT=$(pwd -W) NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS= npx tsx docs/budapest/tools/bud-new-requests-gate.mts
import { pathToFileURL } from "url";
const R = process.env.ROOT + "/app/";
const D: any = await import(pathToFileURL(R + "lib/planner/plannerDestinations.ts").href);
const { normalizePersonalizedAnswers }: any = await import(pathToFileURL(R + "lib/planner/personalizedPlanAnswers.ts").href);
let failures = 0;
const log: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { log.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`); if (!ok) failures++; };
const flex = (days: number, interests: string[]) => ({ dateMode: "flexible", durationDays: days, interests, surpriseMe: false, accommodation: { booked: false } });
const dated = (a: string, d: string, interests: string[]) => ({ dateMode: "specific", arrivalDate: a, departureDate: d, interests, surpriseMe: false, accommodation: { booked: false } });
const ok = (answers: any, city: string, servingExisting?: boolean) => normalizePersonalizedAnswers(answers, city, servingExisting ? { servingExisting } : undefined).ok;

function common(state: string) {
  for (const city of ["prague", "barcelona"]) {
    check(`${state}: ${city} offered and served`, D.isAvailablePlannerDestinationId(city) && D.isServedPlannerDestinationId(city));
    check(`${state}: ${city} new request accepted`, ok(flex(10, ["popular"]), city));
  }
  check(`${state}: vienna neither offered nor served`, !D.isAvailablePlannerDestinationId("vienna") && !D.isServedPlannerDestinationId("vienna"));
}

const budapest = D.PLANNER_DESTINATIONS.find((d: any) => d.id === "budapest");
check("committed state: Budapest is not closed", budapest && budapest.available === true && !budapest.closedToNewRequests);
check("open: Budapest offered and served", D.isAvailablePlannerDestinationId("budapest") && D.isServedPlannerDestinationId("budapest"));
check("open: Budapest new request accepted", ok(flex(3, ["food"]), "budapest"));
common("open");

budapest.closedToNewRequests = true;
try {
  check("closed: Budapest not offered", !D.isAvailablePlannerDestinationId("budapest"));
  check("closed: Budapest still served", D.isServedPlannerDestinationId("budapest"));
  check("closed: new request refused (server check)", !ok(flex(3, ["food"]), "budapest"));
  check("closed: serving an existing plan accepted", ok(flex(3, ["food"]), "budapest", true));
  check("closed + serving: over 4 days still refused", !ok(flex(5, ["food"]), "budapest", true));
  check("closed + serving: culture only 4 days still refused", !ok(flex(4, ["cultureHistory"]), "budapest", true));
  check("closed + serving: 21-24 Dec 2026 still refused", !ok(dated("2026-12-21", "2026-12-24", ["food"]), "budapest", true));
  check("closed + serving: 27-30 Dec 2026 accepted", ok(dated("2026-12-27", "2026-12-30", ["food"]), "budapest", true));
  check("closed + serving: an unknown city still refused", !ok(flex(3, ["food"]), "atlantis", true));
  check("closed + serving: vienna (not served) still refused", !ok(flex(3, ["popular"]), "vienna", true));
  common("closed");
} finally {
  delete budapest.closedToNewRequests;
}
console.log(log.join("\n"));
console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"} (${log.length} checks)`);
process.exit(failures === 0 ? 0 : 1);

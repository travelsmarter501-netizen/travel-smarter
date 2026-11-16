/* eslint-disable -- review test (not shipped). */
// Test (exit 1 on failure): the Preview-only switches stay closed on Vercel Production even when the Preview values are set there.
// Each case loads releaseScope.ts / plannerDestinations.ts fresh (a new module URL per case) with its own environment:
//   - Hebrew (NEXT_PUBLIC_PREVIEW_LANGUAGES=he): enabled only on a Preview build (NEXT_PUBLIC_VERCEL_ENV=preview) or `next dev`;
//   - Budapest (NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=budapest): accepted by the server only on a Preview (VERCEL_ENV=preview) or
//     off Vercel, and listed by the browser only when its build is not Production (NEXT_PUBLIC_VERCEL_ENV), since 2026-11-16.
//   - Published cities (Prague, Barcelona) are available in every case.
// Usage: ROOT=$(pwd -W) npx tsx docs/budapest/tools/bud-preview-gates.mts
import { pathToFileURL } from "url";
const ROOT = process.env.ROOT!;
let n = 0;
const fresh = async (p: string) => { const x: any = await import(pathToFileURL(ROOT + p).href + `?case=${++n}`); return x.default ?? x; };
const KEYS = ["NEXT_PUBLIC_PREVIEW_LANGUAGES", "NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS", "VERCEL", "VERCEL_ENV", "NODE_ENV"];
const failures: string[] = [];
const rows: string[] = [];
async function run(label: string, env: Record<string, string | undefined>, client: boolean, expect: { hebrew: boolean; budapest: boolean }) {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env, Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined)));
  const g = globalThis as any;
  if (client) g.window = {}; else delete g.window;
  try {
    const scope = await fresh("/app/lib/releaseScope.ts");
    const dest = await fresh("/app/lib/planner/plannerDestinations.ts");
    const hebrew = scope.isEnabledLanguage("he");
    const budapest = dest.isAvailablePlannerDestinationId("budapest");
    if (!dest.isAvailablePlannerDestinationId("prague") || !dest.isAvailablePlannerDestinationId("barcelona")) failures.push(`${label}: a published city is not available`);
    rows.push(`${label.padEnd(58)} hebrew ${hebrew}  budapest ${budapest}`);
    if (hebrew !== expect.hebrew) failures.push(`${label}: hebrew ${hebrew}, expected ${expect.hebrew}`);
    if (budapest !== expect.budapest) failures.push(`${label}: budapest ${budapest}, expected ${expect.budapest}`);
  } finally {
    delete g.window;
    for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  }
}
const PREVIEW_VALUES = { NEXT_PUBLIC_PREVIEW_LANGUAGES: "he", NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS: "budapest" };
// Production with the Preview values set by mistake: closed on the server.
await run("server, Vercel Production, Preview values set", { ...PREVIEW_VALUES, VERCEL: "1", VERCEL_ENV: "production", NEXT_PUBLIC_VERCEL_ENV: "production", NODE_ENV: "production" }, false, { hebrew: false, budapest: false });
// Production build, client side (what the browser bundle decides).
await run("client, Vercel Production build, Preview values set", { ...PREVIEW_VALUES, NEXT_PUBLIC_VERCEL_ENV: "production", NODE_ENV: "production" }, true, { hebrew: false, budapest: false });
// Production with system variables NOT exposed (unknown environment): Hebrew fails closed.
// Environment unknown in the browser (Vercel system variables NOT exposed, or a local production build): Hebrew fails closed; Budapest
// is listed (local preview builds need it), while a Vercel server still refuses it (first row). Reported, not a pass/fail claim.
await run("client, production build, environment unknown (reported)", { ...PREVIEW_VALUES, NODE_ENV: "production" }, true, { hebrew: false, budapest: true });
// Preview: both open.
await run("server, Vercel Preview", { ...PREVIEW_VALUES, VERCEL: "1", VERCEL_ENV: "preview", NEXT_PUBLIC_VERCEL_ENV: "preview", NODE_ENV: "production" }, false, { hebrew: true, budapest: true });
await run("client, Vercel Preview build", { ...PREVIEW_VALUES, NEXT_PUBLIC_VERCEL_ENV: "preview", NODE_ENV: "production" }, true, { hebrew: true, budapest: true });
// Production without the Preview values (the normal case): closed.
await run("server, Vercel Production, no Preview values", { VERCEL: "1", VERCEL_ENV: "production", NEXT_PUBLIC_VERCEL_ENV: "production", NODE_ENV: "production" }, false, { hebrew: false, budapest: false });
// Local development.
await run("local next dev", { ...PREVIEW_VALUES, NODE_ENV: "development" }, false, { hebrew: true, budapest: true });
for (const r of rows) console.log(r);
console.log("NOTE: the browser closes the switch only when Vercel exposes NEXT_PUBLIC_VERCEL_ENV (its default). With system variables");
console.log("      not exposed, a Production browser would list a city the server still refuses; keep the variable Preview-only.");
console.log(`failures ${failures.length}`);
for (const f of failures) console.log("FAIL " + f);
process.exit(failures.length ? 1 : 0);

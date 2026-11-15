/* eslint-disable -- review test (not shipped): loose typing on generated plans is intended. */
// Test (exit 1 on failure): every Budapest text a plan can show is translated to English and Hebrew by the plan view's own
// localizer (localizePlan), for generated plans AND the plans the edit paths produce (remove, add, new start, drag), and the
// translation changes no data (same structure, ids, times, numbers, links).
//   - missing: Arabic texts the localizer could not translate (getMissingPlanTranslations), with where they appear;
//   - leftover: any Arabic letter left anywhere in the localized plan (en / he); the two stored labels the interface translates
//     itself (bookingStatus, locationLabel: bookingStatusText / locationLabelText) are checked through those functions;
//   - structure: the localized copy has the same keys and the same non-text values as the stored plan.
// Writes the missing texts (unique) to <out>.missing.json when <out> is given.
// Usage: ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-i18n.mts <plans.json> [...] [--out <file>]
import { readFileSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const L = await imp("/app/lib/i18n/localizePlan.ts");
const T = await imp("/app/lib/i18n/planText.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const C = await imp("/app/lib/planner/planCustomizations.ts");
const city = M.BUDAPEST_CITY_MODULE;
const args = process.argv.slice(2);
const outAt = args.indexOf("--out");
const out = outAt >= 0 ? args[outAt + 1] : null;
const files = args.filter((a, i) => a !== "--out" && (outAt < 0 || i !== outAt + 1));
const ARABIC = /[؀-ۿ]/;
const where = new Map<string, string>();
const failures: string[] = [];
let plans = 0;

// Every string with its path (to say where a missing text appears).
function strings(value: unknown, path: string, acc: [string, string][]) {
  if (typeof value === "string") acc.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, acc));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) strings(v, path ? `${path}.${k}` : k, acc);
  return acc;
}
// Same shape and the same non-text values (numbers, booleans, null) in the same places.
function sameShape(a: unknown, b: unknown, path: string): string | null {
  if (typeof a !== typeof b) return `${path}: type`;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return `${path}: array length`;
    for (let i = 0; i < a.length; i++) { const r = sameShape(a[i], b[i], `${path}[${i}]`); if (r) return r; }
    return null;
  }
  if (a && typeof a === "object") {
    const ka = Object.keys(a as object), kb = Object.keys(b as object);
    if (ka.join() !== kb.join()) return `${path}: keys`;
    for (const k of ka) { const r = sameShape((a as any)[k], (b as any)[k], `${path}.${k}`); if (r) return r; }
    return null;
  }
  if (typeof a !== "string" && a !== b) return `${path}: value ${a} -> ${b}`;
  return null;
}
function checkPlan(label: string, plan: any) {
  plans++;
  const arabic = new Map(strings(plan, "", []).filter(([, s]) => ARABIC.test(s)).map(([p, s]) => [s, p]));
  for (const lang of ["en", "he"]) {
    const before = new Set(L.getMissingPlanTranslations());
    const localized = L.localizePlan(plan, lang);
    for (const m of L.getMissingPlanTranslations()) if (!before.has(m) && !where.has(m)) where.set(m, `${label} ${arabic.get(m) ?? ""}`);
    const shape = sameShape(plan, localized, "plan");
    if (shape) failures.push(`${label} ${lang}: localized copy differs in data (${shape})`);
    const left = strings(localized, "", []).filter(([, s]) => ARABIC.test(s));
    for (const [p, s] of left) {
      const shown = /.bookingStatus$/.test(p) ? T.bookingStatusText(s, lang) : /.locationLabel$/.test(p) ? T.locationLabelText(s, lang) : s;
      if (ARABIC.test(shown) && !where.has(s)) where.set(s, `${label} ${p}`);
    }
  }
}

// Every Arabic text of the Budapest data (all places, shown in a plan or not) has an English and a Hebrew text.
const PL = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
let dataTexts = 0;
const dataWalk = (v: any, key: string) => {
  if (typeof v === "string") {
    if (!ARABIC.test(v)) return;
    dataTexts++;
    for (const lang of ["en", "he"]) {
      const field = key.split(".").pop() ?? "";
      const t = field === "bookingStatus" ? T.bookingStatusText(v, lang) : field === "locationLabel" ? T.locationLabelText(v, lang) : L.translatePlanText(v, lang);
      if (ARABIC.test(t)) failures.push(`data ${key} (${lang}): no translation for «${v}»`);
    }
  } else if (Array.isArray(v)) v.forEach((x, i) => dataWalk(x, `${key}[${i}]`));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) dataWalk(x, `${key}.${k}`);
};
for (const [name, list] of Object.entries<any[]>({ areas: PL.BUDAPEST_AREAS, attractions: PL.BUDAPEST_ATTRACTIONS, experiences: PL.BUDAPEST_EXPERIENCES, foodCategories: PL.BUDAPEST_FOOD_CATEGORIES, foodPlaces: PL.BUDAPEST_FOOD_PLACES, shoppingAreas: PL.BUDAPEST_SHOPPING_AREAS }))
  for (const item of list) dataWalk(item, `budapest/${name}/${item.id}`);

for (const file of files) {
  for (const p of JSON.parse(readFileSync(file, "utf8"))) {
    const base = p.plan;
    if (!base) continue;
    checkPlan(p.id, base);
    for (const d of base.days) {
      const variants: [string, any][] = [];
      if (d.stops.length >= 2) {
        const r = C.decidePlanChange(city, base, {}, { kind: "remove", dayNumber: d.dayNumber, placeId: d.stops[0].id });
        if (r.ok) variants.push(["remove", r.next]);
        const g = C.decidePlanChange(city, base, {}, { kind: "reorder", dayNumber: d.dayNumber, placeId: d.stops[0].id, toIndex: d.stops.length - 1 });
        if (g.ok) variants.push(["drag", g.next]);
      }
      for (const cand of C.addCandidates(city, base, {}, d.dayNumber)) {
        const a = C.decidePlanChange(city, base, {}, { kind: "add", dayNumber: d.dayNumber, placeId: cand });
        if (a.ok) variants.push([`add ${cand}`, a.next]);
      }
      for (const minutes of [600, 660]) {
        const s = C.decidePlanChange(city, base, {}, { kind: "start", dayNumber: d.dayNumber, minutes });
        if (s.ok) { variants.push([`start ${minutes}`, s.next]); break; }
      }
      for (const [kind, edits] of variants) checkPlan(`${p.id} day ${d.dayNumber} ${kind}`, C.applyPlanCustomizations(city, base, edits));
    }
  }
}
const missing = [...where.entries()];
for (const [text, at] of missing) failures.push(`untranslated: «${text}» (${at})`);
console.log(`data texts ${dataTexts}; plans checked ${plans} (generated + edited), untranslated texts ${missing.length}, failures ${failures.length}`);
for (const f of failures.slice(0, 40)) console.log("FAIL " + f);
if (failures.length > 40) console.log(`... ${failures.length - 40} more`);
if (out) writeFileSync(out, JSON.stringify(missing.map(([text, at]) => ({ text, at })), null, 1));
process.exit(failures.length ? 1 : 0);

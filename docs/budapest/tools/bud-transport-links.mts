/* eslint-disable -- review test (not shipped): loose JSON typing on generated plan files is intended. */
// Test (exit 1 on failure): the transport sheet of every leg the plan view shows (stop -> stop and every meal-adjacent leg) is rendered
// with the REAL component (SmartPlannerTransportSheet, server-rendered, open) and its links are checked:
//   1. with the leg's recommended mode selected (what the schedule is computed with): a transit leg offers NO walking-route link
//      (the OpenStreetMap foot route is the walking distance's source), and its Google / Apple links ask for transit;
//   2. the walking route link is still offered when walking is selected;
//   3. the Google / Apple links go between the points the leg was computed with (BUDAPEST_PLACE_COORDINATES of the leg's own from / to;
//      for the leg after a lunch break that is the place before it), never a text address or a name-only fallback.
// Fails on 462ece4 (walking link offered with transit; links built from addresses). Usage:
//   ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-transport-links.mts <plans.json> [<plans.json> ...]
import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const SheetMod: any = await import(pathToFileURL(process.env.ROOT + "/app/components/smart-planner/SmartPlannerTransportSheet.tsx").href);
const Sheet = SheetMod.default?.default ?? SheetMod.default;
const PL = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
const POINTS: Record<string, { lat: number; lng: number }> = PL.BUDAPEST_PLACE_COORDINATES;
let checked = 0, transitLegs = 0;
const failures: string[] = [];
const hrefs = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
for (const file of process.argv.slice(2)) {
  for (const p of JSON.parse(readFileSync(file, "utf8"))) {
    if (!p.plan) continue;
    for (const d of p.plan.days) {
      const summaries = new Map<string, any>([...d.stops, ...(d.mealStops ?? [])].map((s: any) => [s.id, s]));
      const legs: { leg: any; from: any; to: any; key: string }[] = [];
      d.legs.forEach((leg: any, i: number) => legs.push({ leg, from: d.stops[i], to: d.stops[i + 1], key: `${leg.fromPlaceId}>${leg.toPlaceId}` }));
      for (const [key, leg] of Object.entries<any>(d.mealLegs ?? {})) {
        const [a, b] = key.split("::");
        legs.push({ leg, from: summaries.get(a) ?? { id: a, name: a }, to: summaries.get(b) ?? { id: b, name: b }, key });
      }
      for (const { leg, from, to, key } of legs) {
        if (!leg?.recommendedMode) continue;
        checked++;
        const render = (mode: string) => hrefs(renderToStaticMarkup(createElement(Sheet, { open: true, onClose: () => {}, leg, from, to, selectedMode: mode, onSelect: () => {}, lang: "ar" })));
        const where = `${p.id} day ${d.dayNumber} ${key}`;
        const links = render(leg.recommendedMode);
        if (leg.recommendedMode === "transit") {
          transitLegs++;
          if (links.some((h) => h.includes("osrm_foot"))) failures.push(`${where}: transit selected, walking route offered`);
          const google = links.find((h) => h.includes("google.com/maps/dir"));
          if (!google || !google.includes("travelmode=transit")) failures.push(`${where}: Google link not transit`);
          const apple = links.find((h) => h.includes("maps.apple.com"));
          if (!apple || !apple.includes("dirflg=r")) failures.push(`${where}: Apple link not transit`);
        }
        if (leg.routeUrl && leg.options.some((o: any) => o.mode === "walking") && !render("walking").some((h) => h === leg.routeUrl)) failures.push(`${where}: walking selected, walking route missing`);
        // The leg's own computed points (the leg after a lunch break is computed from the place before it).
        const a = POINTS[leg.fromPlaceId], b = POINTS[leg.toPlaceId];
        const google = links.find((h) => h.includes("google.com/maps/dir"));
        if (a && b && google) {
          const u = new URL(google);
          const [olat, olng] = (u.searchParams.get("origin") ?? "").split(",").map(Number);
          const [dlat, dlng] = (u.searchParams.get("destination") ?? "").split(",").map(Number);
          if (!(near(olat, a.lat) && near(olng, a.lng) && near(dlat, b.lat) && near(dlng, b.lng))) failures.push(`${where}: link points ${u.searchParams.get("origin")} -> ${u.searchParams.get("destination")} are not the leg's computed points (${leg.fromPlaceId} -> ${leg.toPlaceId})`);
        }
      }
    }
  }
}
console.log(`legs checked ${checked} (transit ${transitLegs}), failures ${failures.length}`);
for (const f of failures.slice(0, 25)) console.log("FAIL " + f);
if (failures.length > 25) console.log(`... ${failures.length - 25} more`);
process.exit(failures.length ? 1 : 0);

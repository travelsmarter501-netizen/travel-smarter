/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Export of the Budapest prototype data (commit 39c7ec3) for the independent review package.
// Usage (repo root): ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-export.mts <out dir> <sample plans json>
// <out dir> must contain data/ and transfers/ folders.
import { readFileSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const P = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
const MD = await imp("/app/lib/planner/budapest/budapestMetadata.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const city = M.BUDAPEST_CITY_MODULE;
const OUT = process.argv[2];
const src = readFileSync(process.env.ROOT + "/app/lib/planner/budapest/budapestPlaces.ts", "utf8");

// The coordinate comment of THIS place: inside its own attraction({ ... }) block (not an area or another entry with the same id), else
// the line of the coordinate table BUDAPEST_PLACE_COORDINATES. Fixed 2026-11-14: the old version matched the AREA "margaret-island" first
// and copied the basilica's comment; the cruise pier fell through to an unrelated line.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
function coordSource(id: string): string {
  // Line endings may be LF or CRLF; regexes keep the match independent of them.
  const block = new RegExp(`attraction\\(\\{\\s*id: "${escapeRe(id)}"`).exec(src);
  if (block) {
    const at = src.indexOf("coordinates:", block.index);
    const line = src.slice(at, src.indexOf("\n", at));
    const c = line.split("//")[1];
    return c ? c.trim() : "no source comment on the coordinates line";
  }
  const table = src.indexOf("BUDAPEST_PLACE_COORDINATES");
  const row = new RegExp(`^\\s*(?:"${escapeRe(id)}"|${escapeRe(id)}): \\{[^\\n]*$`, "m");
  const m = row.exec(src.slice(table));
  if (!m) return "?";
  return (m[0].split("//")[1] ?? "no source comment on the coordinates line").trim();
}

const ELIGIBILITY: Record<string, string> = {
  "szechenyi-bath": "under 14 not admitted since 1 Aug 2025 (medical exception with prior approval); mixed, swimwear only (szechenyibath.hu/faq)",
  "hospital-in-the-rock": "under 6 not admitted; under 12 not recommended; guided tour only (sziklakorhaz.eu/en/information)",
  "budapest-zoo": "under 14 only with an adult (zoobudapest.com prices page)",
  "house-of-music": "no age limit (zenehaza.hu)",
  "danube-legend-cruise": "children 0-9 free; the included drink can be a soft drink or water (legenda.hu)",
};
const WEIGHT_REASON: Record<string, string> = {
  "parliament-exterior": "city icon from outside; culture (seat of parliament); views from the square and river",
  "st-stephens-basilica": "landmark church (popular, culture) with the panorama terrace (views)",
  "shoes-on-the-danube": "Holocaust memorial (culture); short stop on the Parliament route",
  "chain-bridge": "landmark bridge (popular), river views; the walking link Pest - Castle Hill",
  "fishermans-bastion": "best-known viewpoint (popular, views)",
  "matthias-church-exterior": "landmark church, outside only (interior hours per date not verified)",
  "hungarian-national-gallery": "main Hungarian art collection (culture); dome view",
  "hungarian-national-museum": "national history museum (culture)",
  "museum-of-fine-arts": "major European art museum (culture)",
  "opera-house-tour": "guided interior visit with a short concert (culture, experience)",
  "andrassy-avenue": "avenue with brand stores (shopping)",
  "great-market-hall": "food market (food), market shopping (shopping), landmark hall (popular)",
  "vaci-utca": "main pedestrian shopping street",
  "danube-legend-cruise": "evening river cruise: views, experience, evening",
  "gozsdu-udvar": "passage of shops and bars (shopping, evening)",
  "arena-mall": "large mall (shopping only)",
  "heroes-square": "landmark square (popular, culture)",
  "vajdahunyad-castle": "castle by the City Park lake, outside (culture, park walk)",
  "budapest-zoo": "zoo and botanical garden (nature, family experience)",
  "house-of-music": "interactive music exhibition (culture, experience)",
  citadella: "panorama from Gellert Hill (views); free park (relax)",
  "margaret-island": "large green island park (nature, relax)",
};
const CONDITIONAL = new Set(["szechenyi-bath", "hospital-in-the-rock"]);

const rows: any[] = [];
function push(type: string, p: any) {
  const meta = city.metadataById(p.id);
  let status: string;
  if (meta) status = p.id === "danube-legend-cruise" ? "scheduled on dated plans; informational suggestion on flexible dates" : "schedulable; addable by the customer (has planner metadata)";
  else if (CONDITIONAL.has(p.id)) status = "informational optional (conditional): no planner metadata, never scheduled, not offered by add";
  else if (type === "food") status = p.categoryId === "cafes" ? "meal fallback / coffee-break candidate" : "meal candidate";
  else status = "not scheduled";
  rows.push({
    id: p.id,
    name: p.name,
    type,
    category: p.categoryId ?? null,
    visitType: p.id.endsWith("-exterior") ? "outside" : type === "food" ? "meal" : meta?.showWindow ? "timed slot / tour" : "visit",
    area: meta?.cluster ?? p.areaId ?? p.area ?? null,
    address: p.address ?? null,
    coordinates: P.BUDAPEST_PLACE_COORDINATES[p.id] ?? null,
    coordinateSource: coordSource(p.id),
    planningMinutes: meta?.visitDurationMinutes ?? null,
    durationText: p.duration ?? null,
    preferredTime: meta?.preferredTime ?? null,
    showWindow: meta?.showWindow ?? null,
    outsideStopMinutes: city.outsideVisit?.(p.id)?.visitDurationMinutes ?? null,
    hours: p.hours ?? null,
    priceText: p.priceText ?? null,
    ticketEstimateHUF: city.ticketEstimate.forPlace(p.id) ?? null,
    booking: p.bookingStatus ?? (p.bookingRequired ? "required" : null),
    tip: p.tip ?? p.why ?? null,
    officialUrl: p.officialUrl ?? null,
    eligibility: ELIGIBILITY[p.id] ?? null,
    interestWeights: meta?.weights ?? null,
    priority: meta?.priority ?? null,
    weightReason: WEIGHT_REASON[p.id] ?? null,
    dietaryTags: p.dietaryTags ?? null,
    status,
  });
}
P.BUDAPEST_PLACES.attractions.forEach((p: any) => push("attraction", p));
P.BUDAPEST_PLACES.experiences.forEach((p: any) => push("experience", p));
P.BUDAPEST_PLACES.shoppingAreas.forEach((p: any) => push("shopping", p));
P.BUDAPEST_PLACES.foodPlaces.forEach((p: any) => push("food", p));
writeFileSync(OUT + "/data/places.json", JSON.stringify(rows, null, 1));

// Legs used in the 53 sample plans (stop-to-stop and meal legs), with endpoints and classification.
const plans = JSON.parse(readFileSync(process.argv[3], "utf8"));
const seen = new Map<string, any>();
const C = P.BUDAPEST_PLACE_COORDINATES;
for (const p of plans) for (const d of p.plan.days) {
  const legs = [...d.legs, ...Object.values(d.mealLegs ?? {})] as any[];
  for (const l of legs) {
    if (!l) continue;
    const k = `${l.fromPlaceId}>${l.toPlaceId}`;
    if (seen.has(k)) { seen.get(k).usedTimes++; continue; }
    const o = l.options.find((x: any) => x.mode === l.recommendedMode) ?? l.options[0];
    const note = o?.note ?? "";
    const cls = l.sourceStatus === "unresolved" ? "unresolved"
      : note.includes("Google") ? "checked duration (Google transit)"
      : note.includes("OpenStreetMap") ? `computed walking route (OSRM); time estimated at 4.5 km/h${note.includes("20%") ? " +20% hill" : ""}`
      : "estimate (straight line, distance model x factor)";
    seen.set(k, { from: l.fromPlaceId, to: l.toPlaceId, fromCoords: C[l.fromPlaceId] ?? null, toCoords: C[l.toPlaceId] ?? null, mode: o?.mode, minutesMin: o?.durationMinutesMin, minutesMax: o?.durationMinutesMax, distanceKm: o?.distanceKm ?? null, classification: cls, otherOptions: l.options.filter((x: any) => x !== o).map((x: any) => `${x.mode} ${x.durationMinutesMin}-${x.durationMinutesMax} min`), routeUrl: l.routeUrl ?? null, usedTimes: 1 });
  }
}
const legRows = [...seen.values()];
writeFileSync(OUT + "/transfers/legs-used-in-53-plans.json", JSON.stringify(legRows, null, 1));
const header = "from,to,from_lat,from_lng,to_lat,to_lng,mode,min,max,km,classification,used_times";
const csv = [header].concat(legRows.map((r) => [r.from, r.to, r.fromCoords?.lat, r.fromCoords?.lng, r.toCoords?.lat, r.toCoords?.lng, r.mode, r.minutesMin, r.minutesMax, r.distanceKm ?? "", `"${r.classification}"`, r.usedTimes].join(",")));
writeFileSync(OUT + "/transfers/legs-used-in-53-plans.csv", csv.join("\n"));
console.log(rows.length, "places;", legRows.length, "distinct legs;", legRows.filter((r) => r.mode === "transit").length, "transit;", legRows.filter((r) => r.classification === "unresolved").length, "unresolved");

/* eslint-disable -- review test (not shipped). */
// Test (exit 1 on failure): every Budapest photo record has its file under public/, a Commons source URL, an author and a license from
// the accepted list (with a license link where the license asks for one); every place a plan can show either has a photo or is one of
// the documented missing places (docs/budapest/photo-rights.md); generated plans carry the photo and its credit in placeDetails.
// Usage: ROOT=$(pwd -W) npx tsx docs/budapest/tools/bud-photos.mts
import { existsSync, statSync } from "fs";
import { pathToFileURL } from "url";
process.env.NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS ??= "budapest";
const imp = async (p: string) => { const x: any = await import(pathToFileURL(process.env.ROOT + p).href); return x.default ?? x; };
const PH = await imp("/app/lib/planner/budapest/budapestPhotos.ts");
const PL = await imp("/app/lib/planner/budapest/budapestPlaces.ts");
const MISSING = new Set(["danube-legend-cruise", "hungarikum-bisztro", "menza", "frici-papa", "varosliget-cafe"]);
const ACCEPTED = /^(CC0|Public domain|Attribution|CC BY \d\.\d( [a-z]{2})?|CC BY-SA \d\.\d( [a-z]{2})?)$/;
const failures: string[] = [];
for (const [id, p] of Object.entries<any>(PH.BUDAPEST_PHOTOS)) {
  const file = `${process.env.ROOT}/public${p.image}`;
  if (!existsSync(file) || statSync(file).size < 20000) failures.push(`${id}: file missing or too small (${p.image})`);
  if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.imageSourceUrl ?? "")) failures.push(`${id}: no Commons file page`);
  if (!p.imageAuthor) failures.push(`${id}: no author`);
  if (!ACCEPTED.test(p.imageLicense ?? "")) failures.push(`${id}: license not in the accepted list (${p.imageLicense})`);
  if (/^(CC|Attribution)/.test(p.imageLicense ?? "") && !p.imageLicenseUrl) failures.push(`${id}: no license link`);
}
const places = [...PL.BUDAPEST_ATTRACTIONS, ...PL.BUDAPEST_EXPERIENCES, ...PL.BUDAPEST_FOOD_PLACES, ...PL.BUDAPEST_SHOPPING_AREAS, ...PL.BUDAPEST_NIGHTLIFE_VENUES];
let withPhoto = 0;
for (const p of places) {
  if (p.image) { withPhoto++; if (!p.imageAuthor || !p.imageLicense) failures.push(`${p.id}: photo without credit on the place`); }
  else if (!MISSING.has(p.id)) failures.push(`${p.id}: no photo and not in the documented missing list`);
  if (p.image && MISSING.has(p.id)) failures.push(`${p.id}: has a photo but is listed as missing`);
}
// A generated plan carries the photo and its credit.
const P = await imp("/app/lib/planner/v2CityPipeline.ts");
const M = await imp("/app/lib/planner/budapest/budapestCityModule.ts");
const r: any = await P.generateCityPlanV2(M.BUDAPEST_CITY_MODULE, { destinationId: "budapest", dateMode: "specific", arrivalDate: "2026-11-22", departureDate: "2026-11-24", interests: ["food"], accommodation: { booked: false } });
let shown = 0;
for (const [id, d] of Object.entries<any>(r.data.placeDetails ?? {})) {
  const place = d.place ?? d;
  if (!place.image) continue;
  shown++;
  if (!place.imageAuthor || !place.imageLicense || !place.imageSourceUrl) failures.push(`plan placeDetails ${id}: photo without its credit`);
}
console.log(`photos ${Object.keys(PH.BUDAPEST_PHOTOS).length}; places ${places.length}, with photo ${withPhoto}, documented missing ${MISSING.size}; in a food plan ${shown} place details with photo; failures ${failures.length}`);
for (const f of failures) console.log("FAIL " + f);
process.exit(failures.length ? 1 : 0);

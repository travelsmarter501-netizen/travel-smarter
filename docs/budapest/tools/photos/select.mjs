// Review tool (not shipped): photo search and licence check, read-only requests to Wikidata / Commons.
// The chosen photo per place (each looked at; see photo-review.md), the credit as the Commons file page gives it, and the download of
// Commons' own 960px thumbnail (unedited) into public/images-budapest/<id>.jpg. Writes selected.json.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
const meta = [...JSON.parse(readFileSync("meta.json", "utf8")), ...JSON.parse(readFileSync("meta2.json", "utf8"))];
const [outDir] = process.argv.slice(2);
// place id -> candidate id (meta), and the author line where the file page asks for a specific credit or the field is empty.
const CHOICE = {
  "st-stephens-basilica": "st-stephens-basilica", "parliament-exterior": "parliament-exterior", "shoes-on-the-danube": "shoes-on-the-danube", "chain-bridge": "chain-bridge",
  "fishermans-bastion": "fishermans-bastion", "matthias-church-exterior": "matthias-church-exterior", "hungarian-national-gallery": "hungarian-national-gallery",
  "hungarian-national-museum": "hungarian-national-museum", "museum-of-fine-arts": "museum-of-fine-arts", "opera-house-tour": "opera-house-tour", citadella: "citadella-alt",
  "heroes-square": "heroes-square", "vajdahunyad-castle": "vajdahunyad-castle", "budapest-zoo": "budapest-zoo", "house-of-music": "house-of-music", "margaret-island": "margaret-island",
  "szechenyi-bath": "szechenyi-bath", "hospital-in-the-rock": "hospital-in-the-rock", "21-restaurant": "21-restaurant", pierrot: "pierrot", "new-york-cafe": "new-york-cafe",
  gundel: "gundel", gerbeaud: "gerbeaud", "great-market-hall": "great-market-hall", "vaci-utca": "vaci-utca", "andrassy-avenue": "andrassy-avenue-alt", "gozsdu-udvar": "gozsdu-udvar",
  "arena-mall": "arena-mall-alt",
};
const AUTHOR = {
  "parliament-exterior": "Godot13 (derivative work: MathKnight)",
  "heroes-square": "Petr Šmerkl, Wikipedia", // the file page asks for this credit outside Wikimedia projects
  "vaci-utca": "Csörföly D", // the uploader's own work ({{GFDL-self|migration=relicense}}); the Artist field is empty
  "hungarian-national-museum": "Pasztilla (Hungarian Wikipedia user)",
};
const LICENSE_URL = { Attribution: "https://commons.wikimedia.org/wiki/Template:Attribution" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(outDir, { recursive: true });
const selected = [];
for (const [placeId, candId] of Object.entries(CHOICE)) {
  const m = meta.find((x) => x.id === candId);
  if (!m || !m.free) throw new Error(`no free candidate for ${placeId}`);
  const url = m.thumb960;
  let buf = null;
  for (let i = 0; i < 5 && !buf; i++) {
    await pause(2000 * (i + 1));
    const r = await fetch(url, { headers: { "User-Agent": "TravelPlannerPhotoCheck/1.0 (photo licence check)" } });
    if (r.status === 429) continue;
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    buf = Buffer.from(await r.arrayBuffer());
  }
  writeFileSync(`${outDir}/${placeId}.jpg`, buf);
  selected.push({
    placeId, file: m.file, pageUrl: m.pageUrl, downloaded: url, bytes: buf.length, originalSize: `${m.width}x${m.height}`,
    license: m.license, licenseUrl: m.licenseUrl || LICENSE_URL[m.license] || "", author: AUTHOR[placeId] ?? m.author, artistField: m.author, credit: m.credit, usageTerms: m.usageTerms,
  });
  console.log(`${placeId}: ${buf.length} bytes, ${m.license}, ${AUTHOR[placeId] ?? m.author}`);
}
writeFileSync("selected.json", JSON.stringify(selected, null, 1));

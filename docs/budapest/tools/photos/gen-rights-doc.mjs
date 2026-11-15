// Review tool (not shipped): photo search and licence check, read-only requests to Wikidata / Commons.
// Writes docs/budapest/photo-rights.md from selected.json: one row per photo, plus the places without a photo and why.
import { readFileSync, writeFileSync } from "fs";
const sel = JSON.parse(readFileSync("selected.json", "utf8"));
// How each photo was matched to its place (checked 2026-11-15).
const MATCH = {
  "st-stephens-basilica": "Wikidata Q338665 (43 m from the place point), its image",
  "parliament-exterior": "Wikidata Q11819 (143 m), its image",
  "shoes-on-the-danube": "Wikidata Q473811 (8 m), its image",
  "chain-bridge": "Wikidata Q465534 (name search), its image",
  "fishermans-bastion": "Wikidata Q493117 (10 m), its image",
  "matthias-church-exterior": "Wikidata Q493133 (8 m), its image",
  "hungarian-national-gallery": "Wikidata Q252071 (8 m), its image (wing B of Buda Castle, the gallery's building)",
  "hungarian-national-museum": "Wikidata Q914141 (35 m), its image (small original, 640×480)",
  "museum-of-fine-arts": "Wikidata Q840886 (17 m), its image",
  "opera-house-tour": "Wikidata Q36833 (44 m), its image (the building; the tour is inside)",
  citadella: "Wikidata Q206170 (40 m), its image: the redeveloped park and the Liberty Statue, 2026 (the older Liberty Statue photo was not used, it predates the redevelopment)",
  "heroes-square": "Wikidata Q299973 (name and point), its image",
  "vajdahunyad-castle": "Wikidata Q1092030 (10 m), its image",
  "budapest-zoo": "Wikidata Q922178 (name search), its image: the main entrance",
  "house-of-music": "Wikidata Q108325313 (127 m), its image",
  "margaret-island": "Wikidata Q1467191, the musical fountain on the island (10 m from the plan's point, which is the fountain)",
  "szechenyi-bath": "Wikidata Q194783 (130 m), its image",
  "hospital-in-the-rock": "Wikidata Q1298262 (16 m), its image: the museum entrance with its name",
  "21-restaurant": "Commons file named after the address (Fortuna utca 21); the umbrellas read «21 · Hungarian Kitchen · Magyar Vendéglő»",
  pierrot: "Wikidata Q65218797 Pierrot étterem (7 m), its image; the sign «Pierrot» is on the facade",
  "new-york-cafe": "Wikidata Q15857030 Café New York (39 m), its image: the café hall (small original, 548×772)",
  gundel: "Wikidata Q752482 Gundel (17 m), its image: the facade sign «Restaurant Gundel Étterem, Anno 1894»",
  gerbeaud: "Wikidata Q464845 Café Gerbeaud (38 m), its image: the Gerbeaud house on Vörösmarty tér",
  "great-market-hall": "Wikidata Q195344 (59 m), its image",
  "vaci-utca": "Wikidata Q950534 (name search), its image",
  "andrassy-avenue": "Commons file «Budapest, Andrássy út, 2» (the avenue toward Heroes' Square); the Wikidata image (Q367395) is from 1896 and was not used",
  "gozsdu-udvar": "Wikidata Q1027774 (100 m), its image",
  "arena-mall": "Commons file named after the mall (2019, the «Aréna» sign); the Wikidata image (Q579809) shows the old name «arena plaza» from far away and was not used",
};
const TERMS = (l) =>
  /^CC BY-SA/.test(l) ? "Attribution (author, link to the file, link to the license) and share-alike for adapted versions; commercial use allowed. Used unedited."
  : /^CC BY /.test(l) ? "Attribution (author, link to the file, link to the license); commercial use allowed."
  : l === "Attribution" ? "Any use, including commercial, if the author is credited."
  : /^Public domain/.test(l) ? "No conditions (public domain as stated on the file page); the author is still credited."
  : "see the file page";
const rows = sel.map((s) => `| ${s.placeId} | [${s.file.replace(/\|/g, "\\|")}](${s.pageUrl}) | ${s.author} | ${s.licenseUrl ? `[${s.license}](${s.licenseUrl})` : s.license} | ${TERMS(s.license)} | ${MATCH[s.placeId]} |`);
writeFileSync(process.argv[2], `# Budapest photos: rights record (2026-11-15)

**Rule (same as Prague):** only Wikimedia Commons files whose file page gives a free license that allows commercial use (CC0, public domain,
"Attribution", CC BY, CC BY-SA) and a named author. A photo on an official site is never taken as permission. No similar landmark, no
generated image. Each photo was matched to its place (Wikidata item near the place's own point, or a Commons file named after the place)
and then looked at.

**Files:** \`public/images-budapest/<place id>.jpg\` = Commons' own 960px thumbnail of the file, not edited. Credits in
\`app/lib/planner/budapest/budapestPhotos.ts\`; shown with the photo (PhotoCredit) and on \`/photo-credits\` (Budapest is listed there only
while the city can be chosen: public, or the local / Preview switch).

**Coverage:** 28 of the 33 places a plan can show (the 9 area entries have no photo in any city).

| Place | File (source) | Author (as credited) | License | Terms | Matched by |
|---|---|---|---|---|---|
${rows.join("\n")}

**Notes on credits:**
- Heroes' Square: the file page asks for «Petr Šmerkl, Wikipedia» outside Wikimedia projects; that is the credit used.
- Parliament: the file is a derivative (Godot13's photo, edited by MathKnight); both are named.
- Váci utca: the Artist field is empty; the file page says it is the uploader's own work ({{GFDL-self|migration=relicense}}, now CC BY-SA 3.0); the uploader «Csörföly D» is credited.
- St Stephen's Basilica: Commons license template "Attribution" (any use with credit); the license link is that template's page.

## Places without a photo (recorded as missing, no substitute)

| Place | Why |
|---|---|
| danube-legend-cruise | No Commons file of a Legenda boat or cruise was found (a generic Danube boat would not be this cruise). |
| hungarikum-bisztro | No Commons file found. |
| menza | The only file (Menza Restaurant, Budapest 02) shows a coffee cup on a table, not the restaurant. |
| frici-papa | The only file shows the menu cover, not the restaurant. |
| varosliget-cafe | No file of the café itself; the building it is in could not be confirmed, so a nearby building's photo was not used. |

These cards show no photo (every card handles \`image: ""\`). A photo can be added later only with the same checks.
`);
console.log("written");

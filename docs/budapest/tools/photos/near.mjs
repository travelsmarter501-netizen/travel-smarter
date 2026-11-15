/* eslint-disable -- review tool (not shipped): photo search and licence check, read-only requests to Wikidata / Commons. */
// Wikidata items WITH an image (P18) within a radius of each place's own point (SPARQL, one query per place, spaced out).
import { readFileSync, writeFileSync } from "fs";
const UA = { "User-Agent": "TravelPlannerPhotoCheck/1.0 (photo licence check)", Accept: "application/sparql-results+json" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const places = JSON.parse(readFileSync(process.argv[2], "utf8"));
const RADIUS_KM = { "margaret-island": 1.5, "vaci-utca": 0.8, "andrassy-avenue": 1.5, "budapest-zoo": 0.5, citadella: 0.4, "danube-legend-cruise": 0.3, "chain-bridge": 0.3 };
const out = [];
for (const p of places) {
  const r = RADIUS_KM[p.id] ?? 0.25;
  const q = `SELECT ?item ?itemLabel ?huLabel ?dist ?image WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(${p.point.lng} ${p.point.lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${r}" . bd:serviceParam wikibase:distance ?dist . }
  ?item wdt:P18 ?image .
  OPTIONAL { ?item rdfs:label ?huLabel FILTER(LANG(?huLabel) = "hu") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,hu". }
} ORDER BY ?dist LIMIT 15`;
  let j = null;
  for (let i = 0; i < 5 && !j; i++) {
    await pause(2500 * (i + 1));
    const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(q)}`, { headers: UA });
    if (res.status === 429) continue;
    if (!res.ok) throw new Error(`${res.status} for ${p.id}`);
    j = await res.json();
  }
  const rows = (j?.results?.bindings ?? []).map((b) => ({ qid: b.item.value.split("/").pop(), label: b.itemLabel?.value, hu: b.huLabel?.value ?? "", dist: Math.round(Number(b.dist.value) * 1000), file: decodeURIComponent(b.image.value.split("/").pop()) }));
  out.push({ id: p.id, name: p.name, rows });
  console.log(`\n${p.id} (${p.name})`);
  for (const x of rows.slice(0, 8)) console.log(`   ${x.qid} ${x.dist}m ${x.label} / ${x.hu} :: ${x.file}`);
}
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));

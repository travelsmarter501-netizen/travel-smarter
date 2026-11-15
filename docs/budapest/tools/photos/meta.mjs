/* eslint-disable -- review tool (not shipped): photo search and licence check, read-only requests to Wikidata / Commons. */
// Commons file page metadata for candidate files: license (short name + URL), author, the file page URL, and a 960px thumbnail URL
// (+ a 400px one to look at). Accepts only free licenses that allow commercial use: CC0, public domain, CC BY, CC BY-SA, FAL.
import { readFileSync, writeFileSync } from "fs";
const UA = { "User-Agent": "TravelPlannerPhotoCheck/1.0 (photo licence check)" };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => { for (let i = 0; i < 6; i++) { await pause(1200 * (i + 1)); const r = await fetch(url, { headers: UA }); if (r.status === 429) continue; if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); } throw new Error(`429 x6 ${url}`); };
const strip = (html) => (html ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const FREE = /^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?( [A-Za-z]+)?|FAL|Free Art License|Attribution|CC-BY-SA)/i;
// Input: [{ id, file }] (file = Commons file name without "File:").
const input = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = [];
// One request for every file (titles joined), then the records in the input order.
const byTitle = new Map();
for (let k = 0; k < input.length; k += 25) {
  const titles = input.slice(k, k + 25).map(({ file }) => `File:${file}`).join("|");
  const j = await get(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=960&format=json&formatversion=2`);
  const norm = new Map((j.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of j.query.pages) byTitle.set(norm.get(page.title) ?? page.title, page);
}
for (const { id, file } of input) {
  const title = `File:${file}`;
  const page = byTitle.get(title) ?? byTitle.get(title.replace(/_/g, " ")) ?? {};
  const ii = page.imageinfo?.[0];
  if (!ii) { out.push({ id, file, error: "no imageinfo" }); console.log(id, "NO IMAGEINFO", file); continue; }
  const m = ii.extmetadata ?? {};
  const license = strip(m.LicenseShortName?.value);
  const rec = {
    id, file, width: ii.width, height: ii.height,
    pageUrl: ii.descriptionurl, thumb960: ii.thumburl, thumb400: ii.thumburl?.replace(/\/960px-/, "/400px-"),
    license, licenseUrl: m.LicenseUrl?.value ?? "", author: strip(m.Artist?.value), credit: strip(m.Credit?.value),
    attributionRequired: m.AttributionRequired?.value, restrictions: strip(m.Restrictions?.value), usageTerms: strip(m.UsageTerms?.value),
    free: FREE.test(license) && !/NC|ND/.test(license),
  };
  out.push(rec);
  console.log(`${id}: ${license} | ${rec.author} | ${ii.width}x${ii.height} | free ${rec.free}${rec.restrictions ? " | restrictions: " + rec.restrictions : ""}`);
}
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));

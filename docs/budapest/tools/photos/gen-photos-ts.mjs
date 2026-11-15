/* eslint-disable -- review tool (not shipped): photo search and licence check, read-only requests to Wikidata / Commons. */
// Writes app/lib/planner/budapest/budapestPhotos.ts from selected.json (the same record shape as praguePhotos.ts).
import { readFileSync, writeFileSync } from "fs";
const sel = JSON.parse(readFileSync("selected.json", "utf8"));
const rows = sel.map((s) => {
  const rec = { image: `/images-budapest/${s.placeId}.jpg`, imageSource: "Wikimedia Commons", imageSourceUrl: s.pageUrl, imageAuthor: s.author, imageLicense: s.license, ...(s.licenseUrl ? { imageLicenseUrl: s.licenseUrl } : {}) };
  return `  ${JSON.stringify(s.placeId)}: ${JSON.stringify(rec)},`;
});
writeFileSync(process.argv[2], `import type { ImageCredit } from "../../guideTypes";

/**
 * Photos of Budapest places (2026-11-15). Each file is a Wikimedia Commons image (Commons' own 960px thumbnail, not edited). Every one
 * was checked on its Commons file page: a free license that allows commercial use (CC0 / public domain / "Attribution" / CC BY /
 * CC BY-SA) and its author. CC BY, CC BY-SA and "Attribution" require the author, a link to the file and a link to the license next to
 * the use; PhotoCredit and the photo-credits page render exactly these fields. Where the file page asks for a specific credit (Heroes'
 * Square) that credit is used.
 * Each photo was matched to its place through the place's Wikidata item near the place's own point (or a Commons file named after the
 * place and its address) and then looked at, so it shows that place. Full record: docs/budapest/photo-rights.md.
 * No photo (not found, or the only photos do not show the place): danube-legend-cruise, hungarikum-bisztro, menza, frici-papa,
 * varosliget-cafe. Those places keep \`image: ""\`.
 */
export type PlacePhoto = ImageCredit & { image: string };

export const BUDAPEST_PHOTOS: Record<string, PlacePhoto> = {
${rows.join("\n")}
};

/** Adds the photo and its credit to a place that has one. */
export function withBudapestPhoto<T extends { id: string; image?: string }>(place: T): T {
  const photo = BUDAPEST_PHOTOS[place.id];
  return photo ? { ...place, ...photo } : place;
}
`);
console.log(`wrote ${rows.length} photos`);

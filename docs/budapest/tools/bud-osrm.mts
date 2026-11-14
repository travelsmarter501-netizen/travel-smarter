/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Budapest: walking route distance between every pair of stored points, one FOSSGIS OSRM foot table request (routing.openstreetmap.de).
import { writeFileSync } from "fs"; import { pathToFileURL } from "url";
const P: any = await import(pathToFileURL(process.env.ROOT + "/app/lib/planner/budapest/budapestPlaces.ts").href);
const coords: Record<string, { lat: number; lng: number }> = (P.default ?? P).BUDAPEST_PLACE_COORDINATES;
const ids = Object.keys(coords).sort();
const url = "https://routing.openstreetmap.de/routed-foot/table/v1/foot/" + ids.map((id) => `${coords[id].lng},${coords[id].lat}`).join(";") + "?annotations=distance";
const j: any = await (await fetch(url)).json();
if (j.code !== "Ok") throw new Error(JSON.stringify(j).slice(0, 300));
const snap = j.sources.map((s: any, i: number) => ({ id: ids[i], snapM: Math.round(s.distance) }));
const out: Record<string, number> = {};
ids.forEach((a, i) => ids.forEach((b, k) => { if (i !== k && j.distances[i][k] != null) out[`${a}>${b}`] = Math.round(j.distances[i][k]); }));
writeFileSync(process.argv[2], JSON.stringify({ ids, snap, meters: out }, null, 0));
console.log(ids.length, "points,", Object.keys(out).length, "pairs; snap > 40 m:", snap.filter((s: any) => s.snapM > 40));

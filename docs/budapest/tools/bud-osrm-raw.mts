/* eslint-disable -- review script (not shipped): loose JSON typing on generated plan files is intended. */
// Raw FOSSGIS OSRM foot route responses (steps, no geometry) for every walking leg used in the 12 prototype plans.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { pathToFileURL } from "url";
const P: any = await import(pathToFileURL(process.env.ROOT + "/app/lib/planner/budapest/budapestPlaces.ts").href);
const C = (P.default ?? P).BUDAPEST_PLACE_COORDINATES;
// Usage: ROOT=... npx tsx bud-osrm-raw.mts <plans json> <out dir>
const plans = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = process.argv[3];
mkdirSync(out, { recursive: true });
const pairs = new Set<string>();
for (const p of plans) for (const d of p.plan.days) for (const l of [...d.legs, ...Object.values(d.mealLegs ?? {})] as any[]) if (l && C[l.fromPlaceId] && C[l.toPlaceId]) pairs.add(`${l.fromPlaceId}>${l.toPlaceId}`);
const index: any[] = [];
for (const k of [...pairs].sort()) {
  const [a, b] = k.split(">");
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${C[a].lng},${C[a].lat};${C[b].lng},${C[b].lat}?overview=false&steps=true`;
  const j: any = await (await fetch(url)).json();
  writeFileSync(`${out}/${a}__${b}.json`, JSON.stringify({ requestedAt: new Date().toISOString(), url, response: j }));
  const r = j.routes?.[0];
  const via: string[] = [];
  for (const st of r?.legs?.[0]?.steps ?? []) if (st.name && via[via.length - 1] !== st.name) via.push(st.name);
  index.push({ from: a, to: b, fromCoords: C[a], toCoords: C[b], meters: r ? Math.round(r.distance) : null, osrmMinutes: r ? +(r.duration / 60).toFixed(1) : null, via: via.join(" > ") });
  await new Promise((res) => setTimeout(res, 400));
}
writeFileSync(`${out}/_index.json`, JSON.stringify(index, null, 1));
console.log(index.length, "routes saved");

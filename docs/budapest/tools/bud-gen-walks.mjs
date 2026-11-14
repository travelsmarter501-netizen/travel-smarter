import { readFileSync, writeFileSync } from "fs";
// Usage: node bud-gen-walks.mjs <osrm table json from bud-osrm.mts> <output .ts>
const { meters } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const CL = { "parliament-exterior": "lipotvaros", "st-stephens-basilica": "lipotvaros", "shoes-on-the-danube": "lipotvaros", "chain-bridge": "lipotvaros", "hungarikum-bisztro": "lipotvaros",
  "fishermans-bastion": "castle-hill", "matthias-church-exterior": "castle-hill", "hungarian-national-gallery": "castle-hill", "21-restaurant": "castle-hill", pierrot: "castle-hill", "hospital-in-the-rock": "castle-hill",
  citadella: "gellert-hill" };
const HILL = new Set(["castle-hill", "gellert-hill"]);
const climb = (a, b) => { const ca = CL[a], cb = CL[b]; return (HILL.has(ca) || HILL.has(cb)) && ca !== cb ? 1 : 0; };
const lines = Object.keys(meters).sort().map((k) => { const [a, b] = k.split(">"); return `  "${k}": [${(meters[k] / 1000).toFixed(2).replace(/0$/, "").replace(/\.0?$/, "")}, ${climb(a, b)}],`; });
const ts = `/**
 * Budapest: the walking-route distance of EVERY pair of stored places, from one distance-matrix request to the FOSSGIS OSRM foot router
 * (routing.openstreetmap.de, the router behind openstreetmap.org directions), 2026-11-13, between the points in budapestPlaces.ts
 * (entrance nodes where pinned). Every point snapped to the walking network within 40 m.
 * Value: [route km, 1 = climb]. Climb = one end on Castle Hill or Gellért Hill and the other not in the same area (the route goes up or
 * down the hill). Times built from it are ESTIMATES with the same rule as Prague: 4.5 km/h, +20% on a climb. The route length is known;
 * the walking time is an estimate, labelled as one.
 */
export const BUDAPEST_ROUTED_WALKS: Record<string, [km: number, climb: 0 | 1]> = {
${lines.join("\n")}
};
`;
writeFileSync(process.argv[3], ts);
console.log(lines.length);

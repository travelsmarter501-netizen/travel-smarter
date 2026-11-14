# Budapest review tools (reproducible checks)

**Run from the repository root.** In Git Bash:

```bash
export ROOT="$(pwd -W)" NODE_OPTIONS="--conditions=react-server" NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=budapest
```

Budapest stays `available: false`. The preview variable works only locally (and on Vercel Preview), never on Production.

| Script | What it does | Example |
|---|---|---|
| `bud-boundary.mts` | Boundary tests (exit 1 on failure). Covers the House of Music first Tuesday and the next day through 2040, Monday closures, the National Gallery's unverified holiday window, and checked transit used in its own direction only. | `npx tsx docs/budapest/tools/bud-boundary.mts` |
| `bud-sample.mts` | The 53-plan check sample (8 interest sets × 5 dated windows + flexible; 1–4 days). | `npx tsx docs/budapest/tools/bud-sample.mts out/s.json` |
| `bud-proto.mts` | The 12 review prototypes. | `npx tsx docs/budapest/tools/bud-proto.mts out/p.json` |
| `indep-check2.mts` | Independent schedule check: full lengths, overlaps, midnight, hours, last entry, and the gap ≥ the shown transfer. | `npx tsx docs/budapest/tools/indep-check2.mts out/s.json` |
| `bud-recount.mjs` | Counts with one definition: walking / transit checked in that direction / estimate where only the reverse was checked / estimate / lunch break with no point. Also late first visits, café meals, transit legs carrying a walking link. | `node docs/budapest/tools/bud-recount.mjs out/s.json app/lib/planner/budapest/budapestCheckedTransit.ts` |
| `bud-gaps.mjs` | Waits ≥ 30 min beyond travel + 15 min margin, and lunch-break days. | `node docs/budapest/tools/bud-gaps.mjs out/s.json` |
| `bud-show.mjs` | Readable days: times, legs with source, gaps, tickets, warnings, suggestions. | `node docs/budapest/tools/bud-show.mjs out/p.json A-thu-sat` |
| `bud-variants.mts` | "With the optional activity" through the product edit path, on a TEST-ONLY copy of the module. | `npx tsx docs/budapest/tools/bud-variants.mts out/p.json B-thu-sat:3:szechenyi-bath` |
| `bud-export.mts` | Exports place data (`data/places.json`) and the legs used in a sample (`transfers/`). | `npx tsx docs/budapest/tools/bud-export.mts docs/budapest/data out/s.json` |
| `bud-osrm.mts` | One OSRM foot table request between all stored points. | `npx tsx docs/budapest/tools/bud-osrm.mts out/osrm.json` |
| `bud-gen-walks.mjs` | Writes `budapestRoutedWalks.ts` from that table. | `node docs/budapest/tools/bud-gen-walks.mjs out/osrm.json app/lib/planner/budapest/budapestRoutedWalks.ts` |
| `bud-osrm-raw.mts` | Raw OSRM route responses (steps) for every leg of a plans file. | `npx tsx docs/budapest/tools/bud-osrm-raw.mts out/p.json out/osrm-raw` |

**Notes:**
- OSRM requests go to the public FOSSGIS server (routing.openstreetmap.de). No key is needed.
- Google Routes checks were made by hand through the Maps MCP tool. Each one is recorded in `app/lib/planner/budapest/budapestCheckedTransit.ts` with its direction, departure, time zone and check date. No key appears anywhere in the repository.
- Prague and Barcelona regression scripts: `prg-focus.mts`, `prg-oneday.mts`, `prg-long.mts`, `bcn-sample.mts` and `bcn-big.mts`. They are in the review package and are not repeated here.

# Budapest review tools (reproducible checks)

**Run from the repository root.** In Git Bash:

```bash
export ROOT="$(pwd -W)" NODE_OPTIONS="--conditions=react-server" NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=budapest
```

Budapest stays `available: false`. The preview variable works only locally (and on Vercel Preview), never on Production.

| Script | What it does | Example |
|---|---|---|
| `bud-boundary.mts` | Boundary tests (exit 1 on failure): National Gallery holiday dates and 17:30 hall closing, the House of Music first-Tuesday rule for every month 2026–2075 (computed independently), the 2026 cruise timetable typed literally from the operator table, exact departures on the clock, rejection of a time that is not a departure, the same rule in create / edit / add, and checked transit used in its own direction only. | `npx tsx docs/budapest/tools/bud-boundary.mts` |
| `bud-sample.mts` | The 53-plan check sample (8 interest sets × 5 dated windows + flexible; 1–4 days). | `npx tsx docs/budapest/tools/bud-sample.mts out/s.json` |
| `bud-proto.mts` | The 12 review prototypes. | `npx tsx docs/budapest/tools/bud-proto.mts out/p.json` |
| `indep-check2.mts` | Independent schedule check: full lengths, overlaps, midnight, hours, last entry, timetabled departures started exactly, and the gap ≥ the shown transfer. | `npx tsx docs/budapest/tools/indep-check2.mts out/s.json` |
| `bud-recount.mjs` | Counts with one definition: walking / transit checked in that direction / estimate where only the reverse was checked / estimate / lunch break with no point. Also late first visits, café meals, transit legs carrying a walking link. | `node docs/budapest/tools/bud-recount.mjs out/s.json app/lib/planner/budapest/budapestCheckedTransit.ts` |
| `bud-gaps.mjs` | Waits ≥ 30 min beyond travel + 15 min margin, and lunch-break days. | `node docs/budapest/tools/bud-gaps.mjs out/s.json` |
| `bud-compare.mjs` | Day-by-day difference between two sample files: other places / order / meals / times only / notes only (`--list` prints the days). | `node docs/budapest/tools/bud-compare.mjs out/a.json out/b.json --list` |
| `bud-dayq.mjs` | Day quality side by side: first visit, waits beyond travel + 15-minute margin, walk / transit minutes, lunch, end. `@a.json:b.json` = the days whose order differs. | `node docs/budapest/tools/bud-dayq.mjs "@out/a.json:out/b.json" out/a.json out/b.json` |
| `bud-mixed-dates.mts` | Mixed trips (an exceptional day and an ordinary day): each day must use its own date's hours. Cases marked KNOWN fail until the per-day design (research 14.1) is built. | `npx tsx docs/budapest/tools/bud-mixed-dates.mts` |
| `bud-cruise-suggest.mts` | Plans without dates and 2027 trips: identical to the same request without any cruise data; the cruise only as a suggestion (approved text), never on the clock or addable. Optional: a previous sample to measure the old effect. | `npx tsx docs/budapest/tools/bud-cruise-suggest.mts [old.json]` |
| `bud-plan-size.mjs` | Where a plan's bytes go (hours objects) and the size of a compact stored copy. Read-only. | `node docs/budapest/tools/bud-plan-size.mjs out/s.json` |
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

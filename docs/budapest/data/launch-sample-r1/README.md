# Launch-range sample, round 1 (108 plans)

9 interest sets (A, B, C, popular, nature, shopping, experiences, food, surprise) x 1-4 days x 3 date cases (flexible, Thu 19 Nov 2026, Sat 17 Jul 2027).

- `inputs.json`: the 108 requests.
- `summary.json`: totals per variant (`old` = ddb1b98 behaviour, then each change alone, then `all`).
- `*-days.json`: per-day metrics per variant.
- `table-old.csv`, `table-all.csv`: launch-readiness table before / after.
- `worse-and-changes.txt`: days that got worse, travel +15, lunch changes.

The full plans (about 11 MB per variant) are not stored here. They are regenerated exactly by:

```bash
ROOT=$(pwd -W) NODE_OPTIONS=--conditions=react-server npx tsx docs/budapest/tools/bud-quality.mts launch out/launch
```

Then:

```bash
npx tsx docs/budapest/tools/bud-launch-table.mts out/launch/all.json
```

The `old` variant must equal the ddb1b98 output byte for byte (checked on the 53-plan sample).

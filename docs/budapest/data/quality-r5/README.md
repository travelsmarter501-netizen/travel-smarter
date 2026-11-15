# Budapest day quality, round 5 (B1 default; code e248511, 4ba9904, 19c33e0)

Research section 21 has the write-up.
- B1 with the explicit meal check is the Budapest default on the branch.
- Areas by date (B1a) is a switch, not the default.

| Path | Content |
|---|---|
| `<sample\|launch>/<variant>-days.json`, `summary-*.json` | Per-day metrics and totals. lunchRules = unreviewed (fixed baseline), A = 8e8a309 rules, all = B1 (default), B1a = default + areas. |
| `<sample\|launch>/times.json` | Generation time over 3 runs (one process per variant and run). |
| `<sample\|launch>/proof.*` | Proof that every day above +15 travel against its fixed baseline fits the B1 allowance (0 violations). |
| `<sample\|launch>/compare*.txt`, `compare.json` | B1 (and B1a) against A and against the unreviewed plans. |
| `<sample\|launch>/diff-rule.txt` | Every day B1 changed against A, WORSE days with reasons. |
| `<sample\|launch>/diff-vs-r4B1.txt` | Effect of the cumulative first pass (round-4 B1 → round-5 B1). |
| `<sample\|launch>/diff-areas.txt` | Effect of areas by date on top of B1. |
| `launch/table-B1.csv` | Interest × length table on the default (thresholds are a measurement). |
| `ui-check.md` | The UI check: steps, calls to the Supabase test double, the plans as shown. |
| `tests/` | Independent check (A, B1, B1a), Budapest tests, tsc / lint / build, Prague / Barcelona against 925512d. |

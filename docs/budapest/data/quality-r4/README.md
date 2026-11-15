# Budapest day quality, round 4 (code commit c73ae93)

Research section 20 has the write-up.
- Rule A stays the Budapest default.
- B1 is a test-only travel candidate.
- The two City Park restaurants (Gundel, Városliget Café) are branch data, so they change A's plans too.

| Path | Content |
|---|---|
| `<sample\|launch>/inputs.json` | The requests (53 / 108 plans). |
| `<sample\|launch>/<variant>-days.json`, `summary-<variant>.json` | Per-day final-schedule metrics and totals on the new data. lunchRules = unreviewed (the fixed baseline), A, B1. |
| `<sample\|launch>/times.json` | Generation time over 3 runs (one process per variant and run). |
| `<sample\|launch>/compare.json`, `compare.txt` | B1 against A and against the unreviewed plans: changed days, cumulative travel, acceptance failures, each rejection condition on its own. |
| `<sample\|launch>/diff-data.txt` | Effect of the new restaurants: A on 8e8a309's data vs A on the new data. Every WORSE day with its reason. |
| `<sample\|launch>/diff-rule.txt` | Effect of the rule: A vs B1 on the same new data. |
| `first-run/` | B1's first run, before the 10-min idle limit for days whose places did not change. It shows the shopping day 3 case (+21 idle) that led to it. |
| `examples/` | Food and culture 22–24 Nov and A 4 days from 19 Nov, under A / B1 (and Ba for culture); the limited swap experiment (`culture-swap.txt`). |
| `tests/` | Independent check (A, B1, both samples), Budapest tests, tsc / lint / build, Prague / Barcelona against 925512d. |

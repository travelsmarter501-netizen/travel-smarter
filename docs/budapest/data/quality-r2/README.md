# Budapest day quality, round 2 (code commit 8e8a309)

Generated with `docs/budapest/tools/bud-quality.mts <sample|launch> <dir> <variant>`, one process per variant. The variants are old (= ddb1b98), lunchRules, order (+ stage 1) and all (+ stage 2). `inputs.json` holds the requests.

| File | Content |
|---|---|
| `*-days.json` | Final-schedule metrics per day (`finalDayQuality`): morning gap, waits, travel, lunch kind / start / end, visits end, dinner, late lunch, daylight after the monthly sunset estimate, cost, order. |
| `summary-<variant>.json` | Totals, lunch breaks per interest, generation time (median / p90 / max). |
| `diff-lunch.txt` | Lunch rules vs ddb1b98. |
| `diff-stage1.txt` | Stage 1 (order) vs lunch rules, under the same lunch rules. |
| `diff-stage2.txt` | Stage 2 (moves) vs stage 1. |
| `diff-total.txt` | Final vs ddb1b98. |
| `launch/table-*.csv` | Interest × length table. Its thresholds are a measurement, not a launch decision. |

The diffs come from `bud-quality-diff.mjs`. Each "WORSE" line gives every reason, including a travel increase.

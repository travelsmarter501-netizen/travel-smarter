# Budapest day quality, round 3 (experiments, code commit dfe4453)

Research section 19 has the write-up. Every rule here is a test-only switch: the Budapest defaults are 8e8a309 (variant A, byte-identical).

| Path | Content |
|---|---|
| `<sample\|launch>/inputs.json` | The requests (53 / 108 plans). |
| `<sample\|launch>/<variant>-days.json` | Final-schedule metrics per day. Variants: lunchRules (unreviewed, the fixed baseline), A, Am, B, C, Ba, Ca. Fields include known travel split into between visits / restaurants, and unknown food access. |
| `<sample\|launch>/summary-<variant>.json` | Totals of one run. |
| `<sample\|launch>/times.json` | Generation time over 3 runs, one process per variant and run. |
| `<sample\|launch>/compare.json`, `compare.txt` | Each variant against A and against the unreviewed plans, acceptance failures, and each rejection condition on its own (`blockedByOneConditionOnly`). |
| `examples/` | Food and culture 22–24 Nov, A 4 days from 19 Nov (cruise day) under every variant, and the limited swap experiment (`culture-swap.txt`). |
| `tests/` | Independent check of every variant, Budapest tests, tsc / lint / build, and Prague / Barcelona against 925512d. |

The review package also has the full plans, the review logs (every decision with its reasons) and the swap candidates.

# Budapest: two fixes on top of B1 (df53b31 transport, 943b6df daylight)

Research section 22 has the write-up.

| Path | Content |
|---|---|
| `<sample\|launch>/all-days.json`, `lunchRules-days.json` | Per-day metrics on 943b6df (B1 default) and the unreviewed baseline. |
| `<sample\|launch>/diff-vs-r5.txt` | Every day that changed against round 5 (only fix 2 changes schedules: 3 days, shopping 22–24 Nov). |
| `<sample\|launch>/diff-daylight.txt` | Effect of the daylight policy alone (fix 1 only → fix 1 + 2). |
| `tests/` | Independent check, cumulative-allowance proof, transport link test, daylight test, Budapest tests, tsc / lint / build, Prague / Barcelona. |
| `ui-check.md` | Phone-viewport check of create / edit / save / reopen / start change, old vs new. |

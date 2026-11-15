# UI check, phone viewport 375×812 (emulated; not a real phone), 2026-11-15

- **Setup:**
  - Old = 4ba9904 on :3411, new = df53b31 / 943b6df on :3410.
  - Both use `next dev --webpack`, fake env values and `ALLPAY_MODE=disabled`.
  - The in-memory Supabase test double (`mock-bud.mjs`) and a test session. Nothing real was contacted.
- **Plan:** food, 22–24 Nov 2026, created through the questionnaire.
- **Old and new on the same plan:** the row was copied before the edit and restored between runs.

## Transport (fix 1)
| Step | Old | New |
|---|---|---|
| Edit day 3: remove Andrássy, add Vajdahunyad | connector after the Opera «🚶 ≈ 39 دقيقة · 2.8 كم»; sheet: walking selected, Google `travelmode=walking`, Apple `dirflg=w`, OSM foot route | «🚇 ≈ 28 دقيقة»; transit selected; Google `travelmode=transit` and Apple `dirflg=r` from 47.502466,19.05868 to 47.5153549,19.0818753; no OSM foot route |
| Schedule | Opera 15:00–16:00 → Vajdahunyad 16:45 (transit 28 + 15) | same |
| Saved, reopened | (old shows transit after a reopen) | identical to edit mode |
| Start 10:00 | — | tour to 16:30, Vajdahunyad 18:15; connectors and links still transit 28 |
| Day 2, after the lunch break | Google origin «استراحة غدا بالمنطقة, Barcelona, Spain» | origin 47.487212,19.058966 (Great Market Hall, where the leg is computed from) |

## Daylight (fix 2)
| Step | Result (new) |
|---|---|
| Reopening the plan saved earlier (Vajdahunyad at 18:15 after the 10:00 start) | the saved order is kept; note «⏳ الأفضل قبل الغروب. الغروب بهالشهر تقريبًا 16:15 (تقدير شهري، مش الوقت الدقيق لتاريخك).» |
| Fresh add of Vajdahunyad | placed at the end, 16:45–17:05, with the note; the Opera stays at 15:00 (every earlier position would push it to 16:30) |
| Reopened | same, with the note |

**Seen, not fixed:** after the edit the day title still says «حديقة المدينة وAndrássy والأوبرا», and it renders «Andrássyو».

**Screenshot limit:** a screenshot taken after scrolling looked shifted sideways. The page measured 375 px wide with no element outside the viewport, so it is a capture artifact, not page overflow.

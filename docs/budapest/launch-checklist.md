# Budapest launch list (2026-11-16, after the Preview run)

Code: `feature/budapest` at `ece9b36` (Preview). Budapest stays unavailable in Production. No new optimisation round was run for this
list: every number comes from results already in `docs/budapest/data/`.

## Status after the close-out round (2026-11-16, research section 25)
- **1. Day range: done.**
  - Budapest at most 4 days; culture only or popular only 3; nature only 1.
  - Same rule in the questionnaire and on the server; the reason and options are shown, never applied silently.
- **2. Holiday hours:**
  - **National Museum:** done, from its official 2026 table (`mnm.hu/nyitvatartas`). From Dec 2027 a conditional suggestion on 24–26 Dec, 31 Dec and 1 Jan, never on the clock.
  - **National Gallery:** official site still unreachable (520); 2026/27 stays the reviewer's reading; from Dec 2027 the same conditional rule.
  - **Other places' holiday hours:** not modelled (e.g. the Opera tour and the House of Music on 24–25 Dec).
- **3. Added places:** unchanged; not required before launch.
- **4. Texts:**
  - House of Music and the two English titles changed as asked (an AI language review, not a person's review);
  - "Depends on booking" kept: booking is not a documented requirement;
  - new texts to review: `texts-review.md` section 7.
- **5. Photos:** a card and details without a photo checked in the UI (Hungarikum): they display correctly. Deferred improvement.

## 1. Day range per interest
**Source:** `data/quality-r5/launch/table-B1.csv`.
- The 108-plan launch sample on the B1 default: 9 interest sets × 1–4 days × 3 date cases (flexible, Thu 19 Nov 2026, Sat 17 Jul 2027).
- **Still valid:**
  - round 6 changed no day of that sample (`quality-r6/launch/diff-vs-r5.txt`: 0 changed days);
  - round 7 changed adds and texts, not generation;
  - round 8 schedules are identical to round 7.

| Interests | Days that meet every threshold | Why not longer |
|---|---|---|
| Mixed (popular + culture + nature + relax) | 1–4 | — |
| Food + shopping + football + nightlife | 1–4 | — |
| Shopping only | 1–4 | — |
| Football / nightlife only | 1–4 | — |
| Food only | 1–4 | — |
| «فاجئني» (no interest) | 1–4 | — |
| Culture only | 1–3 | 4 days: 2 thin days, 1 late start, 79 min idle per day |
| Popular only | 1–3 | 4 days: 58% strong match |
| Nature (nature + relax) only | 1 | 2–4 days: thin days, few places, weak match |

**5–10 days were never measured for Budapest.**

**Today the questionnaire offers 1–10 days to every city.** It has no per-city or per-interest limit, so any range needs a code change: questionnaire and server check.

**Recommendation:**
- Cap Budapest at 4 days.
- For culture-only and popular-only, the 4th day is weaker; accept it or cap at 3.
- For nature-only, offer 1 day, or say that 2+ days add other interests.
- The owner decides.

## 2. Holiday hours (two different museums)
**Hungarian National Gallery** (Magyar Nemzeti Galéria, Buda Castle), id `hungarian-national-gallery`:
- **Source:**
  - holiday dates: `en.mng.hu/opening-hours-during-holidays/`, as read by the independent reviewer on 2026-11-14 and relayed by the owner;
  - our own access failed (HTTP 520 on 13 and 14 Nov), so we have not read the page ourselves;
  - regular hours: `en.mng.hu/opening-hours/`, read by us on 13 Nov.
- **Code** (`budapestPlaces.ts`, `PLANNING_HOURS`):
  - closed 24–25 Dec 2026;
  - 26–30 Dec 10:00–17:30 planned (Monday 28 opened by `override`), last entry 17:00;
  - 31 Dec 10:00–16:00, last entry 15:00;
  - 1 Jan 2027 12:00–17:30, last entry 17:00.
  - The card shows the approved holiday text.
- **After 1 Jan 2027:** regular rules only. The holidays of Dec 2027 are unknown and use the regular hours, while the card still shows the 2026/27 text, which is dated.
- **Issue:** the dates are second-hand.
- **Smallest fix:** one direct read of the official page, data only. It affects trips from 24 Dec 2026 to 1 Jan 2027.

**Hungarian National Museum** (Magyar Nemzeti Múzeum, Múzeum krt., Pest), id `hungarian-national-museum`, is a different place:
- **Source:** `mnm.hu` regular hours, Tuesday–Sunday 10:00–18:00, ticket office until 17:00. Its holiday page was not read (noted in the code).
- **Code:** no date exceptions. On 24–25 Dec 2026 (Thursday, Friday), 31 Dec and 1 Jan it uses the regular hours, so a plan can schedule it on those days with no note.
- **Issue:** an unknown is shown as known regular hours. It is not treated as closed, and should not be.
- **Smallest fix, either:**
  - read the museum's holiday hours (data only);
  - or add a note on those dates that holiday hours are not confirmed.

**Other places:** holiday hours are generally not modelled, for example the Zoo's public holidays (noted in its record).

**Before launch?** Needed only if Budapest is offered for trips over Christmas and New Year. The two fixes above are data or note changes, with no engine change.

## 3. Hours of places a customer adds
**Actual effect on a customer:**
- A place the customer adds is not stored with its hours. On every open it is rebuilt from the city data of the current deployment, for that day's date.
- **So the effect appears only after we deploy a change to that place's hours.** The edited day is recomputed on the next open: its times can shift, and a timing note can appear, with no action by the customer.
- Places the planner generated keep their stored data. Unedited days do not change.

**Same as Production today:** Prague and Barcelona resolve an added place from current data too (`resolveStop(city, …)` in `planCustomizations.ts` at `925512d`). Budapest only makes those hours date-aware.

**Before launch:** not required.
- The snapshot design (`added-place-snapshot-design.md`) is an improvement that could later apply to every city.
- Until then: avoid hour changes to places that customers may have added, or accept that edited days follow the corrected data.

## 4. Texts to review
Hebrew is off in Production (`releaseScope.ts`), so the Hebrew texts are not needed for a launch. English is offered in Production.

**A. Arabic, owner (before launch):**

| Text | Where |
|---|---|
| «البرلمان» · «الكاتدرائية» · «ضفة الدانوب» | day title, Lipótváros area, when the day has only one of Parliament / St Stephen's, or neither |
| «الأوبرا» · «شارع Andrássy» | day title, Terézváros area, when the day has only the Opera tour or only Andrássy |
| «و » with a space before a Latin name, e.g. «حديقة المدينة و Andrássy والأوبرا» | day titles and summaries |

**B. Shared texts, every city (round 8):**

| Arabic | English | Where |
|---|---|---|
| لا تفوّته | Must see | badge on must-see places; in Production it is «Must See» in every language |
| + سعر واحد غير متوفر / + سعرين غير متوفرين / + N أسعار غير متوفرة / + N سعر غير متوفر | + 1 price not available / + N prices not available | day ticket counter |
| 🕒 مواعيد الجولات: | 🕒 Tour times: | cards with listed sessions (today the Opera) |
| الدخول بجولة بس، بموعد محجوز مسبقًا | Entry by tour only, booked in advance | under the tour times |
| كل صورة نسخة مصغّرة (960 بكسل) من الملف الأصلي على Wikimedia Commons، بدون أي تعديل تاني. | Each photo is a resized copy (960 px) of the original file on Wikimedia Commons, with no other change. | `/photo-credits`, Budapest section |

**C. English for Budapest, a native reading (AI-written; facts identical to the Arabic, checked by `bud-i18n.mts`):**
- **Priority:** the 14 planner phrases (warnings, reasons, walking notes) and the templates, in `texts-review.md` sections 2–3.
- **Then:** the 102 place texts in section 4.

**Already done:**
- the sunset note (approved);
- the National Gallery hours text (Arabic approved);
- the Gundel and Városliget Café texts (approved 2026-11-15).

## 5. Photos (deferred improvement, not a blocker)
- **5 places have no photo:** the Legenda cruise, Hungarikum, Menza, Frici Papa and Városliget Café.
- **How the cards handle it:** they leave out the image block when there is no photo. These are the shared components Prague and Barcelona use (`FoodPlaceCard`, `SmartPlannerStopCardBody`).
- **Seen (2026-11-16, local UI check):** the Hungarikum stop card and its details: no empty image box, no broken image, no overflow.

## 6. Other open items
- **Payments:** the Allpay button click on the Preview (expected message, no move to Allpay).
- **Daylight:**
  - Vajdahunyad's class rests on caution, not a source;
  - the sunset is a monthly estimate;
  - the Zoo closes 5 min after the December estimate.
- **Transport:** most transit times are distance estimates.
- **At merge:** the shared changes in section 4B become visible in Prague and Barcelona.
- **Launch itself, the owner's approval:**
  - merge to `main`;
  - make Budapest available in Production;
  - Hebrew stays off in Production;
  - the `NEXT_PUBLIC_PREVIEW_*` variables stay Preview-only.

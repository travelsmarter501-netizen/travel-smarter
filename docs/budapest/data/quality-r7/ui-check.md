# UI check, round 7 (2026-11-15, code 512e19f)

## Setup
- `next dev --webpack` (port 3410) on the branch.
- Fake values, `ALLPAY_MODE=disabled`, preview switch `budapest`.
- The in-memory Supabase test double (`review/mock-bud.mjs`), a test session (fake user).
- Built-in browser, phone viewport 375×812 (emulated: not a real phone, not Safari).
- **Hebrew:** the site has Hebrew switched off (`releaseScope.ts`). For the Hebrew screenshots it was switched on in the working copy only, then reverted (never committed).

Screenshots: `screenshots/` in the package.

| Step | Result |
|---|---|
| **Create** (questionnaire: Budapest → 22–24 Nov → food → no booking) | Plan generated and saved; the double recorded `begin_owner_plan_generation`, the insert, `end_owner_plan_generation`. Day 1 «البرلمان والكاتدرائية وتلة القلعة» (the day has both). Photos on the stop cards. |
| **Day 3 before the edit** | «حديقة المدينة و Andrássy والأوبرا»: «و» stands apart from the Latin name (01, 05). |
| **Edit:** remove Andrássy | Title becomes «حديقة المدينة والأوبرا»; saved through `replace_owned_plan_content`. |
| **Edit:** add Vajdahunyad | Placed at the end, 16:45–17:05. The Opera tour stays at 15:00 (fixed session kept). Approved note «الأفضل تزوره بضوّ النهار. الغروب حوالي 16:15 حسب تقدير الشهر، وقد يختلف بتاريخ رحلتك.» Saved. |
| **Reopen** (new page load from storage) | Same title, Andrássy absent, Vajdahunyad 16:45–17:05 with the note, Opera 15:00 (06, 07). |
| **English** | No Arabic left on the page (day 1 and day 3), no horizontal overflow. Title «City Park & Opera House», English note, translated warnings and card texts (08–10). |
| **Hebrew** | `lang=he`, `dir=rtl`; no Arabic left, no overflow. Title «פארק העיר ובית האופרה», Hebrew note, card texts (11–13). |
| **Place cards** | Fisherman's Bastion in Arabic (photo; months «يونيو / سبتمبر / ديسمبر»; 02, 03); Vajdahunyad in English (10); the Opera in Hebrew (13). |
| **Photo credits page** | Lists Budapest with 28 photos (author, licence, Commons) while the preview switch is on (04). |

**Seen, not changed:**
- **Plan cards show no photo credit.** Credits are on `/photo-credits`, linked from the footer, as for Prague.
- **The «Must See» badge** on cards is English in the Arabic view (the shared guide card).
- **RTL display of «و» glued to a time or a ":15"** in Budapest warning texts: «الجولات بس 13:30 و15:00 و16:30» and «(:15 و:45)» render out of order. This is a data-text issue, listed in `texts-review.md`.
- **The Opera card's hours row** shows the tour planning window «13:30–17:30» as the day's hours (data from an earlier round).

# UI check, 2026-11-15 (local only)

- **Setup:**
  - `next dev --webpack -p 3410` on 19c33e0 (default B1), with fake env values and `ALLPAY_MODE=disabled`.
  - `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=budapest`.
  - The in-memory Supabase test double (`mock-bud.mjs`, owner mode), and a test session cookie.
  - Nothing real was contacted.
- **Limits:** built-in browser, emulated desktop viewport; not real Safari or a phone.

## Food, 22–24 Nov 2026 (questionnaire → generated → saved → edited → saved → reopened; Arabic and English)
- **Calls recorded by the double:** `begin_owner_plan_generation` 1, insert into `smart_planner_saved_plans` 1, `end_owner_plan_generation` 1, `replace_owned_plan_content` 2 (remove + add).

| Day | Plan as shown |
|---|---|
| 1, Sunday | Fisherman's Bastion 09:00–09:40 · Matthias 10:00–10:15 · Shoes 11:00–11:10 · Parliament 11:30–11:50 · Chain Bridge 12:15–12:30 · Hungarikum Bisztró 13:00–14:15 (lunch) · St Stephen's 14:45–16:00 · Menza 18:00–19:30 (dinner, optional) |
| 3, Tuesday (before the edit) | Heroes' Square 09:00 · House of Music 10:15–12:15 · Városliget Café 12:45–14:00 (lunch) · Opera tour 15:00–16:00 · Andrássy 16:30–17:15 · New York Café 18:00 |
| 3, after the edit, reopened | Andrássy removed, Vajdahunyad Castle added 16:45–17:05 (after the November sunset estimate: the add path does not check daylight) |

- **The leg after the added place:** Opera → Vajdahunyad showed "walk 39 min · 2.8 km" in edit mode and "transit ≈ 28 min" after reopening.
- **Városliget Café details:** the approved Arabic text, «ساعات يوم الثلاثاء: 12:00–22:00».
- **English:** the interface is in English. Budapest content (day titles, notes, the "مطبخ هنغاري" label, suggestion reasons) stays in Arabic.

## Culture, 22–24 Nov 2026 (generated from the UI; B1 default; the current plan)
| Day | Plan as shown |
|---|---|
| Sunday | Citadella 09:00–09:45 · Shoes 10:30 · Parliament 11:00 · Chain Bridge 11:45–12:00 · Hungarikum 12:30–13:45 |
| Monday | Heroes' Square 09:00 · St Stephen's 10:15–11:30 · Menza 12:30–13:45 · Opera tour 15:00–16:00 |
| Tuesday | Fisherman's 09:00 · Matthias 10:00 · National Gallery 10:45–12:45 · 21 Restaurant 13:30–14:45 |

## Shopping, 22–24 Nov 2026 (generated from the UI)
| Day | Plan as shown |
|---|---|
| Sunday | Andrássy 09:00–09:45 · Parliament 10:30 · Chain Bridge 11:15 · Shoes 12:00 · Hungarikum 12:45–14:00 · Opera tour 15:00–16:00 |
| Monday | Market Hall 09:00 · Váci 10:30 · Gozsdu 11:45 · New York Café 12:45 · Arena Mall 14:45–16:15 · cruise 17:20–18:20 |
| Tuesday | St Stephen's 09:00–10:15 · Fisherman's 11:00 · Matthias 12:00 · 21 Restaurant 12:45–14:00 · National Gallery 14:45–16:45 · **Citadella 17:30–18:15** (its data says "best before sunset") |

## Culture, 17–19 Jul 2027 (generated from the UI; Gundel)
- **Saturday:** Heroes' Square 09:00 · Museum of Fine Arts 10:00–12:00 · Gundel 12:30–13:45 · Opera tour 15:00–16:00.
- **Gundel details:** the approved text and «ساعات يوم السبت: 11:30–22:00» (every day 11:30–22:00). The 21:00 planning window is not shown.

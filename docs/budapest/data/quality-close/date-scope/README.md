# Temporary date scope checks (2026-11-16, research 25.6)

- bud-closeout.txt: 246 checks (date scope on the function and the server included).
- Refusal before any order (local dev server + Supabase test double, checkout action called directly as a visitor):
  - 21-24 Dec 2026 -> invalid_planner_answers, database calls recorded: none
  - control 27-30 Dec 2026 -> create_personalized_plan_order recorded, then payment_setup_failed (Allpay disabled); nothing external
- tsc / lint / build: pass.

-- Unified Personalized Plan: the customer-facing product catalog now reflects ONE automated
-- product ("خطة مخصصة إلك ✨", 59 ILS) instead of the old separate Smart Planner (59 ILS,
-- instant) and Custom Plan (99 ILS, human-reviewed) positioning. This is a customer-facing
-- product/catalog change only -- no code path for the new unified planner (/planner) currently
-- reads this table at all (payment/entitlements are not wired to it, matching the task's own
-- "do not enable payment/access gates yet" instruction), so this migration is not required for
-- the feature to function; it exists purely so the catalog is accurate for when commerce is
-- eventually wired up.
--
-- Additive + non-destructive only. Live audit before writing this (via a throwaway read-only
-- script, not committed) confirmed:
--   - public.order_items has ZERO rows referencing any product at all -- no historical order
--     ever purchased barcelona-custom-plan or barcelona-smart-planner, so deactivating both is
--     safe with no display/history impact.
--   - public.user_entitlements has exactly one row, referencing barcelona-guide (unrelated,
--     untouched).
--   - barcelona-custom-plan-3day/5day/7day are already inactive historical rows (from the
--     Sept 4 Custom Plan Simple Intake V2 migration) -- untouched here.
--
-- Does NOT delete any row. Does NOT touch order_items/user_entitlements/custom_plan_requests/
-- custom_plan_drafts/custom_plan_final_plans or any admin tooling.

insert into public.products (slug, name, price_ils, active)
values ('travel-smarter-personalized-plan', 'Travel Smarter — Personalized Plan', 59, true)
on conflict (slug) do nothing;

-- Deactivated for NEW purchases only -- historical rows/behavior for both are completely
-- preserved (see header comment: zero order_items ever referenced either slug, so there is
-- nothing to preserve the *display* of, but the rows themselves are kept, never deleted, exactly
-- like the existing barcelona-custom-plan-3day/5day/7day precedent).
update public.products set active = false where slug = 'barcelona-custom-plan';
update public.products set active = false where slug = 'barcelona-smart-planner';

notify pgrst, 'reload schema';

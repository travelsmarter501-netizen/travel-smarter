-- Completes the Barcelona products catalog: seeds the two remaining real, working products
-- that have never had a row in any migration -- "barcelona-ready-plan-1day" (19 ILS) and
-- "barcelona-ready-plan" (the 5-day plan, 39 ILS). "barcelona-guide" (29) and
-- "barcelona-smart-planner" (59) are already seeded by 20260818120000 and 20260825120000
-- respectively; "barcelona-ready-plan-3day" (39) already has its own prepared migration
-- (20260829120000) -- none of those three are touched here, avoiding any duplicate insert.
--
-- Additive only, idempotent: `on conflict (slug) do nothing` means re-running this migration
-- is always safe and never overwrites a row that already exists (whether seeded by an earlier
-- migration or created manually) -- no existing product, price, or user_entitlements row is
-- modified. No schema change. No other table is touched.

insert into public.products (slug, name, price_ils, active)
values
  ('barcelona-ready-plan-1day', 'Barcelona Ready Plan — 1 Day', 19, true),
  ('barcelona-ready-plan', 'Barcelona Ready Plan — 5 Days', 39, true)
on conflict (slug) do nothing;

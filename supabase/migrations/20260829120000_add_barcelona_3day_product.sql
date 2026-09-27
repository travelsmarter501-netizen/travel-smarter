-- Adds the "barcelona-ready-plan-3day" product row so the 3-Day Ready Plan (see
-- app/ready-plans/barcelona/3-days) can actually be owned/entitled, matching the product's
-- confirmed price (39 ILS -- same confirmed price point as the existing 5-day product).
--
-- Idempotent and additive only: `on conflict (slug) do nothing` means re-running this
-- migration is always safe, and it never touches any other row -- the existing
-- "barcelona-guide" product (and its price) is untouched. No other table is modified.

insert into public.products (slug, name, price_ils, active)
values ('barcelona-ready-plan-3day', 'Barcelona Ready Plan — 3 Days', 39, true)
on conflict (slug) do nothing;

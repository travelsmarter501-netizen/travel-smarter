-- Launch prices for the five sellable Barcelona products.
--
-- WHY A MIGRATION: the amount a customer is charged is read ONLY from public.products.price_ils. create_pending_order
-- (and therefore create_personalized_plan_order) sums it, order_items snapshots it as price_ils_at_purchase, Allpay is asked for
-- exactly that snapshot and the webhook verifies it. Changing the price in the website code alone would change what is DISPLAYED
-- but not what is CHARGED. (Same pattern as 20260830120000_update_barcelona_3day_price.sql.)
--
--   barcelona-ready-plan-1day          19 -> 12
--   barcelona-guide                    29 -> 17
--   barcelona-ready-plan-3day          34 -> 22   (still grants the 3-day plan + the Barcelona Guide, by code)
--   barcelona-ready-plan               39 -> 27   (still grants the 5-day plan + the Barcelona Guide, by code)
--   travel-smarter-personalized-plan   59 -> 39   (guide access unchanged)
--
-- The old prices (19 / 29 / 34 / 39 / 59) remain in the website ONLY as struck-through marketing references
-- (app/lib/commerce/pricing.ts); nothing that charges, stores or verifies money reads them.
--
-- DATA ONLY. No schema, function, policy, trigger or grant is touched; no slug, id or entitlement changes; products stay active.
-- Existing orders are NOT rewritten: order_items.price_ils_at_purchase and orders.total_ils keep the amount of the day they were created
-- (history and revenue figures stay correct). One consequence to know: an order created BEFORE this migration that is still
-- unpaid keeps its old total, so if it is paid afterwards it is charged -- and verified -- at that old amount. New orders use the new prices.
--
-- Safe to re-run (it sets absolute values). It fails, changing nothing, unless it matches exactly the five products.

do $$
declare
  v_updated integer;
begin
  update public.products p
  set price_ils = v.new_price
  from (
    values
      ('barcelona-ready-plan-1day', 12),
      ('barcelona-guide', 17),
      ('barcelona-ready-plan-3day', 22),
      ('barcelona-ready-plan', 27),
      ('travel-smarter-personalized-plan', 39)
  ) as v(slug, new_price)
  where p.slug = v.slug;

  get diagnostics v_updated = row_count;

  if v_updated <> 5 then
    raise exception 'launch prices: expected to update exactly 5 products, updated %', v_updated;
  end if;
end
$$;

notify pgrst, 'reload schema';

-- Verification (read-only), after applying:
--   select slug, price_ils, active from public.products
--   where slug in ('barcelona-ready-plan-1day','barcelona-guide','barcelona-ready-plan-3day','barcelona-ready-plan','travel-smarter-personalized-plan')
--   order by price_ils;

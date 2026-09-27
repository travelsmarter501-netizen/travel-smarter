-- Corrects the "barcelona-ready-plan-3day" product price: 39 ILS -> 34 ILS (confirmed final
-- price -- see the "Update Barcelona 3-Day Product Price" task's final report).
--
-- This is a price-only correction on an existing row -- it does not insert, delete, or rename
-- anything, and does not touch any other product (in particular, "barcelona-ready-plan", the
-- 5-day product, stays at 39 and is untouched). The original seeding migration
-- (20260829120000_add_barcelona_3day_product.sql) is left intact; this migration only
-- corrects the price on top of it.

update public.products
set price_ils = 34
where slug = 'barcelona-ready-plan-3day';

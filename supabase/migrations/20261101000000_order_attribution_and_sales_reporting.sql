-- Order attribution + private sales reporting.
--
-- WHAT THIS ADDS (and nothing else):
--   1. public.order_attribution : which marketing channel / campaign an order came from. One row per order, insert-once, written only by the
--      server (service_role) right after the order is created. Never readable or writable through the public API (anon / authenticated).
--   2. schema "reporting"       : private reporting views over the EXISTING orders / order_items / products, plus two admin-only exclusion
--      tables for future test orders. The schema is not exposed by the Supabase API and no API role has any privilege on it; the views are
--      also security_invoker, so even a mistaken grant would still be stopped by the row-level security of the underlying tables.
--
-- WHAT THIS DOES NOT TOUCH: orders, order_items, products, user_entitlements, any existing function (create_pending_order,
-- create_personalized_plan_order, claim_guest_order, ...), any existing policy or grant, and the Allpay verification / webhook (which live in
-- application code). Historical orders are neither modified nor deleted; the reports simply start at the cutoff below.
--
-- OFFICIAL REPORTING START: 2026-11-01 00:00 Israel time. Israel is on standard time (UTC+2) on that date, so the cutoff is
-- 2026-10-31 22:00:00 UTC. Every order created before it (all of them are the owner's own payment tests) is excluded from every report.
-- To change the cutoff later, redefine reporting.sales_start() below -- it is the only place the date appears.
--
-- Safe to run more than once: every statement is idempotent (create ... if not exists / create or replace / repeatable grants and revokes).
--
-- ADMIN-ONLY EXCLUSION OF FUTURE TEST ORDERS (run in the Supabase SQL Editor, which connects as the database owner -- there is no website
-- control, no API endpoint and no grant that lets anyone else do this):
--   insert into reporting.excluded_orders (order_id, reason) values ('<order uuid>', 'my payment test');
--   insert into reporting.excluded_users  (user_id,  reason) values ('<user uuid>',  'owner test account');   -- all that account's orders
--   delete from reporting.excluded_orders where order_id = '<order uuid>';                                      -- include it again
-- Excluding changes only what the reports show; the order itself is never modified.
--
-- READING THE REPORTS (SQL Editor):  select * from reporting.sales_overview;  select * from reporting.sales_summary_daily;  etc.
--
-- ROLLBACK -- attribution data is PRESERVED by default; orders and everything else are never affected:
--   Level 1 (normally enough): revert the application commit. Nothing writes to order_attribution any more; the table and its rows stay.
--   Level 2 (also hide the reports): drop only the views and the cutoff function -- the attribution rows and the exclusion lists stay:
--       drop view if exists reporting.sales_by_product_campaign, reporting.sales_by_product, reporting.sales_by_campaign,
--                           reporting.checkout_conversion_daily, reporting.sales_summary_daily, reporting.sales_overview, reporting.real_orders;
--       drop function if exists reporting.sales_start();
--   Level 3 (DESTRUCTIVE -- deletes attribution rows and exclusion lists; only if explicitly necessary and approved, after exporting
--   public.order_attribution, reporting.excluded_orders and reporting.excluded_users to CSV):
--       drop schema if exists reporting cascade;
--       drop table  if exists public.order_attribution;

-- ---------------------------------------------------------------------------------------------------------------------------------------
-- 1. Attribution
-- ---------------------------------------------------------------------------------------------------------------------------------------
create table if not exists public.order_attribution (
  order_id   uuid primary key references public.orders (id) on delete cascade,
  channel    text not null check (channel in ('tiktok', 'instagram', 'other')),
  campaign   text check (campaign is null or campaign ~ '^[a-z0-9_.-]{1,40}$'),
  created_at timestamptz not null default now()
);

comment on table public.order_attribution is
  'Marketing channel/campaign an order came from. Server-written (service_role), insert-once, no personal data. No API access.';

-- Row-level security on with NO policies: the API roles can neither read nor write it, whatever grants exist.
alter table public.order_attribution enable row level security;
revoke all on public.order_attribution from public, anon, authenticated, service_role;   -- also drops the project's default ALL for service_role
grant select, insert on public.order_attribution to service_role;                           -- insert-once: no update, no delete

-- ---------------------------------------------------------------------------------------------------------------------------------------
-- 2. Private reporting schema
-- ---------------------------------------------------------------------------------------------------------------------------------------
create schema if not exists reporting;
revoke all on schema reporting from public, anon, authenticated, service_role;
alter default privileges in schema reporting revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema reporting revoke all on functions from public, anon, authenticated, service_role;

-- Future test orders / accounts to leave out of the reports. Owner-only: no policies, no grants.
create table if not exists reporting.excluded_orders (
  order_id    uuid primary key references public.orders (id) on delete cascade,
  reason      text,
  excluded_at timestamptz not null default now()
);
create table if not exists reporting.excluded_users (
  user_id     uuid primary key,
  reason      text,
  excluded_at timestamptz not null default now()
);
alter table reporting.excluded_orders enable row level security;
alter table reporting.excluded_users  enable row level security;

-- Official reporting start = 2026-11-01 00:00 Israel time (UTC+2) = 2026-10-31 22:00:00 UTC.
create or replace function reporting.sales_start() returns timestamptz
language sql immutable
as $$ select timestamptz '2026-10-31 22:00:00+00' $$;

-- Every order that counts: created at/after the cutoff and not excluded. One row per order.
--   checkout_started : an Allpay payment page was successfully created for it (orders.provider is set only then).
--   is_paid          : marked paid by the verified Allpay webhook (status 'paid' + paid_at), in ILS.
create or replace view reporting.real_orders with (security_invoker = true) as
select
  o.id                                                   as order_id,
  o.created_at,
  (o.created_at at time zone 'Asia/Jerusalem')::date     as created_day_il,
  o.paid_at,
  (o.paid_at at time zone 'Asia/Jerusalem')::date        as paid_day_il,
  o.total_ils,
  (o.provider = 'allpay')                                as checkout_started,
  (o.status = 'paid' and o.paid_at is not null and o.currency = 'ILS') as is_paid,
  case when o.claim_token_hash is not null then 'guest' else 'member' end as buyer_type,
  coalesce(a.channel, 'direct_or_unknown')               as channel,
  a.campaign
from public.orders o
left join public.order_attribution a on a.order_id = o.id
where o.created_at >= reporting.sales_start()
  and not exists (select 1 from reporting.excluded_orders x where x.order_id = o.id)
  and (o.user_id is null or not exists (select 1 from reporting.excluded_users u where u.user_id = o.user_id));

-- One row: the whole picture since the cutoff.
create or replace view reporting.sales_overview with (security_invoker = true) as
select
  reporting.sales_start()                                                          as reporting_since_utc,
  count(*) filter (where checkout_started)                                         as checkouts_started,
  count(*) filter (where is_paid)                                                  as paid_orders,
  coalesce(sum(total_ils) filter (where is_paid), 0)                               as revenue_ils,
  round(avg(total_ils) filter (where is_paid), 2)                                  as avg_order_ils,
  round(100.0 * count(*) filter (where is_paid and checkout_started)
        / nullif(count(*) filter (where checkout_started), 0), 1)                  as checkout_to_paid_pct
from reporting.real_orders;

-- Paid orders and revenue per Israel calendar day of payment.
create or replace view reporting.sales_summary_daily with (security_invoker = true) as
select paid_day_il as day, count(*) as paid_orders, sum(total_ils) as revenue_ils, round(avg(total_ils), 2) as avg_order_ils
from reporting.real_orders
where is_paid
group by paid_day_il
order by paid_day_il desc;

-- Checkout-to-paid conversion per Israel calendar day the order was created (a cohort: of the checkouts started that day, how many paid).
create or replace view reporting.checkout_conversion_daily with (security_invoker = true) as
select created_day_il as day,
       count(*) filter (where checkout_started)                    as checkouts_started,
       count(*) filter (where is_paid and checkout_started)        as paid_orders,
       round(100.0 * count(*) filter (where is_paid and checkout_started)
             / nullif(count(*) filter (where checkout_started), 0), 1) as checkout_to_paid_pct
from reporting.real_orders
group by created_day_il
order by created_day_il desc;

-- Sales by marketing channel and campaign (channel 'direct_or_unknown' = no campaign tag reached the order).
create or replace view reporting.sales_by_campaign with (security_invoker = true) as
select channel, coalesce(campaign, '(none)') as campaign,
       count(*) filter (where checkout_started)                    as checkouts_started,
       count(*) filter (where is_paid)                             as paid_orders,
       coalesce(sum(total_ils) filter (where is_paid), 0)          as revenue_ils,
       round(100.0 * count(*) filter (where is_paid and checkout_started)
             / nullif(count(*) filter (where checkout_started), 0), 1) as checkout_to_paid_pct
from reporting.real_orders
group by channel, coalesce(campaign, '(none)')
order by revenue_ils desc, checkouts_started desc;

-- Sales by product. Revenue is the price snapshot on the order line, so product revenues add up to order revenue.
-- A multi-product order appears once in each of its products' rows.
create or replace view reporting.sales_by_product with (security_invoker = true) as
select p.slug as product, p.name,
       count(*) filter (where r.checkout_started)                  as checkouts_started,
       count(*) filter (where r.is_paid)                           as paid_orders,
       coalesce(sum(i.price_ils_at_purchase) filter (where r.is_paid), 0) as revenue_ils,
       round(100.0 * count(*) filter (where r.is_paid and r.checkout_started)
             / nullif(count(*) filter (where r.checkout_started), 0), 1) as checkout_to_paid_pct
from reporting.real_orders r
join public.order_items i on i.order_id = r.order_id
join public.products p on p.id = i.product_id
group by p.slug, p.name
order by revenue_ils desc, checkouts_started desc;

-- Sales by product AND campaign.
create or replace view reporting.sales_by_product_campaign with (security_invoker = true) as
select r.channel, coalesce(r.campaign, '(none)') as campaign, p.slug as product,
       count(*) filter (where r.checkout_started)                  as checkouts_started,
       count(*) filter (where r.is_paid)                           as paid_orders,
       coalesce(sum(i.price_ils_at_purchase) filter (where r.is_paid), 0) as revenue_ils
from reporting.real_orders r
join public.order_items i on i.order_id = r.order_id
join public.products p on p.id = i.product_id
group by r.channel, coalesce(r.campaign, '(none)'), p.slug
order by revenue_ils desc, checkouts_started desc;

-- Belt and braces: nothing in the reporting schema is reachable by any API role, however the objects above were created.
revoke all on all tables    in schema reporting from public, anon, authenticated, service_role;
revoke all on all functions in schema reporting from public, anon, authenticated, service_role;

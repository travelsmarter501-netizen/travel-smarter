-- Travel Smarter: database setup for the PREVIEW TEST Supabase project ONLY.
-- Generated 2026-11-07 from supabase/migrations/ (21 files, applied in filename order).
-- Skipped (never applied live, superseded by a later migration): 20260825120000_create_smart_planner_saved_plans.sql.
-- Paste the whole file into the SQL Editor of the NEW test project and press Run. It runs as one transaction: if any statement
-- fails, nothing is applied. The guard below stops it on any database that already has data (for example production).

begin;

do $guard$
begin
  if to_regclass('public.products') is not null or to_regclass('public.user_entitlements') is not null then
    raise exception 'STOP: this database already has Travel Smarter tables. This file is only for a NEW, EMPTY test project.';
  end if;
  if exists (select 1 from auth.users) then
    raise exception 'STOP: this database already has users. This file is only for a NEW, EMPTY test project.';
  end if;
end
$guard$;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260818120000_create_products_and_entitlements.sql
-- ════════════════════════════════════════════════════════════════════════
-- Products + user entitlements: the ownership foundation for paid guides.
-- Payment integration is out of scope here — entitlements are granted manually
-- (Dashboard/SQL Editor) until a payment provider is wired up in a later task.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_ils numeric,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  granted_at timestamptz not null default now(),
  source text not null default 'manual',
  payment_reference text,
  unique (user_id, product_id)
);

create index if not exists user_entitlements_user_id_idx on public.user_entitlements (user_id);

insert into public.products (slug, name, price_ils, active)
values ('barcelona-guide', 'Barcelona Travel Guide', 29, true)
on conflict (slug) do nothing;

-- ── Row Level Security ────────────────────────────────────────────────
-- With RLS enabled and no policy for a given command, that command is
-- denied by default for the `anon` and `authenticated` roles. Only the
-- policies below grant access; everything else (INSERT/UPDATE/DELETE from
-- the browser) stays blocked until a trusted server process (service_role,
-- which bypasses RLS) grants an entitlement.

alter table public.products enable row level security;

create policy "Authenticated users can view active products"
on public.products
for select
to authenticated
using (active = true);

alter table public.user_entitlements enable row level security;

create policy "Users can view their own entitlements"
on public.user_entitlements
for select
to authenticated
using (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260829120000_add_barcelona_3day_product.sql
-- ════════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260829130000_complete_barcelona_products_catalog.sql
-- ════════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260830120000_update_barcelona_3day_price.sql
-- ════════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260831120000_create_orders_and_order_items.sql
-- ════════════════════════════════════════════════════════════════════════
-- Commerce Foundation V1: orders + order_items, the authenticated-order layer that sits
-- between the existing products/user_entitlements tables (see
-- 20260818120000_create_products_and_entitlements.sql) and a future payment provider.
--
-- No payment provider is integrated here and no money moves as a result of this migration.
-- A "pending" order grants ZERO product access on its own -- entitlements are only ever
-- inserted later by a verified payment webhook (not built in this task), exactly like
-- user_entitlements is today (manual/trusted-server-only, never client-writable).
--
-- Additive only: does not alter products, user_entitlements, smart_planner_saved_plans, or
-- any Ready Plan/Guide/Smart Planner content. Does not touch auth.* or existing prices.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Never a client-supplied value in real usage -- the future order-creation path resolves
  -- this from the verified session (see app/lib/orders.ts), the same way every other
  -- user-scoped table in this project already does (smart_planner_saved_plans, etc.).
  user_id uuid not null references auth.users (id) on delete cascade,
  -- V1 status set: pending (just created, no payment yet) -> paid (webhook-confirmed) or
  -- failed/cancelled (payment did not complete) -> refunded (later, on top of paid). A plain
  -- CHECK is used instead of a Postgres enum, matching this project's existing convention of
  -- plain-text status/type columns (see products.active, user_entitlements.source,
  -- smart_planner_saved_plans -- none of which use enums) and keeping future status additions
  -- a simple constraint migration rather than an enum-alteration migration.
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  -- Server-computed authoritative total ONLY -- never trust a client-supplied amount here.
  -- See app/lib/orders.ts's createPendingOrder, which sums products.price_ils itself.
  total_ils numeric not null check (total_ils >= 0),
  currency text not null default 'ILS',
  -- Both nullable: an order starts with neither, before any provider checkout session exists.
  -- Deliberately provider-agnostic naming (not e.g. "stripe_session_id") since no provider has
  -- been chosen yet -- see the "Checkout & Entitlement Architecture Audit" task's report.
  provider text,
  -- Once a provider checkout/session exists, this is the provider's own reference for that
  -- attempt -- the natural idempotency key for a future webhook (redelivery of the same event
  -- either no-ops against the already-`paid` row or fails this uniqueness constraint; either
  -- way it can never create a second order for the same provider transaction). NULL is allowed
  -- and multiple NULLs are allowed under this constraint (Postgres treats NULL <> NULL for
  -- UNIQUE purposes) -- only ever enforced once a real value is set.
  provider_order_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Deliberately NOT on delete cascade from products -- a purchased line item is a historical
  -- record and must never silently disappear if a product row is ever removed. In practice
  -- products are deactivated (active = false), not deleted, so this is a theoretical guard.
  product_id uuid not null references public.products (id),
  -- The price actually charged for THIS order, snapshotted at creation time -- never
  -- re-derived from products.price_ils later, so a subsequent catalog price change never
  -- rewrites what a customer historically paid (see products' own price-change precedent:
  -- 20260830120000_update_barcelona_3day_price.sql already changed a live price once).
  price_ils_at_purchase numeric not null check (price_ils_at_purchase >= 0),
  created_at timestamptz not null default now(),
  -- No quantity column: every current product is a one-time digital purchase, so a product
  -- can appear at most once per order -- enforced below, not just assumed.
  unique (order_id, product_id)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ── updated_at trigger ──────────────────────────────────────────────────────────────────
-- Mirrors smart_planner_saved_plans_set_updated_at exactly (see
-- 20260825120000_create_smart_planner_saved_plans.sql) -- this project gives each table its
-- own identically-shaped trigger function rather than one shared/generic helper, so this
-- follows that same established convention instead of introducing a new pattern.

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- Read-only for customers, on both tables, matching every other user-scoped table in this
-- project (smart_planner_saved_plans, user_entitlements): with RLS enabled and no policy for
-- a given command, that command is denied by default for `anon`/`authenticated`. No
-- INSERT/UPDATE/DELETE policy is added here on purpose -- order creation and payment-status
-- mutation must only ever happen through trusted server code (the future create_pending_order
-- RPC below, and later a verified payment webhook), never directly from the browser. This is
-- the same "verified-server-only-write" posture user_entitlements already has today.

alter table public.orders enable row level security;

create policy "Users can view their own orders"
on public.orders
for select
to authenticated
using (user_id = auth.uid());

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);

-- ── create_pending_order RPC ────────────────────────────────────────────────────────────────
-- A minimal, generic, SAFE primitive: given an already-verified user id and a list of product
-- slugs, atomically creates one `pending` order plus its order_items in a single Postgres
-- transaction (a plain sequence of JS-client calls cannot do this atomically -- a crash
-- between the order insert and the order_items insert would leave an orphaned order row; this
-- function makes that impossible). It deliberately knows NOTHING about product bundling or
-- "already owned" rules -- see app/lib/orders.ts's createPendingOrder, which applies the
-- redundant-Guide and already-owned normalization BEFORE calling this function. Keeping this
-- function dumb/generic means a future new bundle product never requires touching this SQL.
--
-- SECURITY DEFINER so it can insert into orders/order_items despite the read-only RLS above
-- (it runs with the privileges of its owner, the migration role, which is not subject to its
-- own tables' RLS) -- this is the ONLY sanctioned way rows are ever written to these two
-- tables outside of a future webhook.
--
-- Trust model / why this does NOT derive auth.uid() internally: EXECUTE is revoked from
-- `anon`/`authenticated` and granted only to `service_role` below (see the "Preferred Trust
-- Model" in the Checkout & Entitlement Architecture Audit report: client -> authenticated
-- Next.js server code -> order creation, never a client-reachable path). Because service_role
-- calls carry no user JWT, auth.uid() would simply return NULL in that context -- so
-- p_user_id is accepted as an explicit parameter instead. This is safe specifically BECAUSE
-- the function is unreachable from the browser: the only code path that can ever call it is
-- app/lib/orders.ts's createPendingOrder, which independently resolves and verifies the
-- caller's identity via supabase.auth.getUser() on the normal session-bound server client
-- (the exact same verified-session pattern hasProductAccess and every account/route-gate
-- check in this project already use) BEFORE calling this function -- so p_user_id here is
-- never client-supplied, just relayed from a trust boundary that already checked it.
create or replace function public.create_pending_order(p_user_id uuid, p_product_slugs text[])
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slugs text[];
  v_slug_count int;
  v_active_count int;
  v_total numeric;
  v_order public.orders;
begin
  if p_user_id is null then
    raise exception 'create_pending_order: p_user_id is required';
  end if;

  -- Dedupe input (NULL/blank-safe) -- "Duplicate slug input -> only one item".
  select array_agg(distinct s) into v_slugs
  from unnest(coalesce(p_product_slugs, array[]::text[])) as s
  where s is not null and length(trim(s)) > 0;

  v_slug_count := coalesce(array_length(v_slugs, 1), 0);
  if v_slug_count = 0 then
    raise exception 'create_pending_order: at least one product slug is required';
  end if;

  -- Reject the WHOLE order if any requested slug is missing or inactive -- never silently
  -- drop an unrecognized product and charge for the rest.
  select count(*) into v_active_count
  from public.products
  where slug = any(v_slugs) and active = true;

  if v_active_count <> v_slug_count then
    raise exception 'create_pending_order: one or more requested products are invalid or inactive';
  end if;

  select coalesce(sum(price_ils), 0) into v_total
  from public.products
  where slug = any(v_slugs) and active = true;

  insert into public.orders (user_id, status, total_ils, currency)
  values (p_user_id, 'pending', v_total, 'ILS')
  returning * into v_order;

  insert into public.order_items (order_id, product_id, price_ils_at_purchase)
  select v_order.id, p.id, p.price_ils
  from public.products p
  where p.slug = any(v_slugs) and p.active = true;

  return v_order;
end;
$$;

revoke all on function public.create_pending_order(uuid, text[]) from public;
revoke all on function public.create_pending_order(uuid, text[]) from anon;
revoke all on function public.create_pending_order(uuid, text[]) from authenticated;
grant execute on function public.create_pending_order(uuid, text[]) to service_role;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260901120000_create_custom_plan_requests.sql
-- ════════════════════════════════════════════════════════════════════════
-- Custom Plan Requests V1: safe request persistence for the Custom Plan concierge product
-- (see app/custom-plan/barcelona and app/lib/customPlan.ts). This is a REQUEST, not an order
-- -- a row here never grants access, never implies payment, and is never linked to a real
-- order/entitlement in this task (order_id stays null throughout; see the "Custom Plan
-- Requests Supabase Foundation V1" task's own explicit scope). Payment linkage is a later task.
--
-- Additive only: does not alter products, orders, order_items, user_entitlements,
-- smart_planner_saved_plans, any existing RLS policy, or any existing commerce RPC.

create table if not exists public.custom_plan_requests (
  id uuid primary key default gen_random_uuid(),
  -- Nullable on purpose (unlike every other user-scoped table in this project, which uses
  -- `not null` here) -- this schema intentionally leaves room for a possible future guest-
  -- request flow without a schema change. The CURRENT server path (see
  -- app/lib/customPlanRequests.ts) always requires a real signed-in session before ever
  -- calling the RPC below, so in practice this is never null today -- that is a product/policy
  -- decision enforced in application code, not something baked into this table or its RPC.
  user_id uuid references auth.users (id) on delete set null,
  destination text not null,
  duration_days integer not null check (duration_days in (3, 5, 7)),
  -- Always server-computed from duration_days (see create_custom_plan_request below) --
  -- never accepted from the client. Mirrors app/lib/customPlan.ts's CUSTOM_PLAN_PRICING_ILS
  -- exactly (3->69, 5->89, 7->109); keep both in sync if prices ever change.
  price_ils numeric not null check (price_ils >= 0),
  status text not null default 'draft' check (
    status in ('draft', 'pending_payment', 'paid', 'in_progress', 'completed', 'cancelled')
  ),
  arrival_date date,
  departure_date date,
  accommodation text,
  traveler_type text not null check (traveler_type in ('solo', 'couple', 'friends', 'family')),
  travelers_count integer not null check (travelers_count >= 1),
  has_children boolean,
  children_count integer check (children_count is null or children_count >= 1),
  interests jsonb not null default '[]'::jsonb,
  must_visit text,
  food_preferences jsonb not null default '[]'::jsonb,
  nightlife_types jsonb not null default '[]'::jsonb,
  pace text not null check (pace in ('relaxed', 'balanced', 'active')),
  budget_style text not null check (budget_style in ('budget', 'midrange', 'premium', 'no_preference')),
  special_requests text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  -- Deliberately null throughout this task -- linking a request to a real paid order is
  -- explicitly the next task's scope (see the migration header comment above). `on delete set
  -- null` so a request's history survives even if its (future) order is ever removed.
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Same date-ordering rule as every other "arrival/departure" pair in this project's own
  -- validation (see customPlanRequest.ts's validateCustomPlanRequest) -- enforced again here
  -- at the database level since client-side validation can never be the real gate. Either date
  -- being unset always passes (both are optional).
  constraint custom_plan_requests_dates_check check (
    departure_date is null or arrival_date is null or departure_date >= arrival_date
  ),
  -- has_children is only ever meaningful for a "family" traveler_type -- every other traveler
  -- type must leave it null rather than storing a meaningless true/false.
  constraint custom_plan_requests_has_children_traveler_check check (
    traveler_type = 'family' or has_children is null
  ),
  -- children_count exists if and only if has_children = true (the two constraints below
  -- together enforce the exact correspondence in both directions -- see the task's own
  -- CHECK-by-CHECK breakdown, kept unmerged to match it exactly rather than one clever OR).
  constraint custom_plan_requests_children_count_requires_true_check check (
    has_children = true or children_count is null
  ),
  constraint custom_plan_requests_true_requires_children_count_check check (
    has_children is not true or children_count is not null
  )
);

create index if not exists custom_plan_requests_user_id_idx on public.custom_plan_requests (user_id);
create index if not exists custom_plan_requests_status_idx on public.custom_plan_requests (status);
create index if not exists custom_plan_requests_order_id_idx on public.custom_plan_requests (order_id);
create index if not exists custom_plan_requests_created_at_idx on public.custom_plan_requests (created_at);

-- ── updated_at trigger ──────────────────────────────────────────────────────────────────
-- Every prior migration in this project gave its own table an identically-shaped but
-- separately-named trigger function (set_orders_updated_at, set_smart_planner_saved_plans_
-- updated_at) -- literally the same three-line body each time. Rather than add a third
-- near-duplicate copy, this migration introduces the one genuinely generic version
-- (no table name baked into the function itself) and uses it here; the existing two functions
-- are untouched (this task is additive-only, not a refactor of prior migrations), but any
-- future table can reuse this one instead of yet another copy.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists custom_plan_requests_set_updated_at on public.custom_plan_requests;
create trigger custom_plan_requests_set_updated_at
before update on public.custom_plan_requests
for each row
execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- Read-only for customers, same posture as orders/order_items/user_entitlements: with RLS
-- enabled and no policy for a given command, that command is denied by default for
-- `anon`/`authenticated`. No INSERT/UPDATE/DELETE policy is added here on purpose -- request
-- creation must only ever happen through the trusted create_custom_plan_request RPC below
-- (service_role only), never directly from the browser. `anon` gets no policy at all, so it
-- has zero access (not even SELECT) -- matching every other table in this project, none of
-- which grant the anon role anything.

alter table public.custom_plan_requests enable row level security;

create policy "Users can view their own custom plan requests"
on public.custom_plan_requests
for select
to authenticated
using (user_id = auth.uid());

-- ── create_custom_plan_request RPC ──────────────────────────────────────────────────────────
-- A minimal, generic, SAFE primitive -- mirrors create_pending_order's own trust model exactly
-- (see 20260831120000_create_orders_and_order_items.sql for the full writeup): SECURITY
-- DEFINER so it can insert despite the read-only RLS above (runs with the privileges of its
-- owner, which is not subject to its own tables' RLS); EXECUTE revoked from
-- `anon`/`authenticated` and granted only to `service_role`, so it is unreachable from the
-- browser entirely. Because service_role calls carry no user JWT, auth.uid() would return
-- NULL in that context -- so p_user_id is accepted as an explicit parameter instead, exactly
-- like create_pending_order's p_user_id. This is safe specifically BECAUSE the function is
-- unreachable from the browser: the only code path that can ever call it is
-- app/lib/customPlanRequests.ts's createCustomPlanRequest, which independently resolves and
-- verifies the caller's identity via supabase.auth.getUser() on the normal session-bound
-- server client BEFORE calling this function.
--
-- Price authority: p_price_ils is deliberately NOT a parameter at all -- the price is computed
-- entirely from p_duration_days inside this function (3->69, 5->89, 7->109, matching
-- app/lib/customPlan.ts exactly), so there is no client-supplied price value to ignore in the
-- first place. An invalid duration raises an exception and inserts nothing.
create or replace function public.create_custom_plan_request(
  p_user_id uuid,
  p_destination text,
  p_duration_days integer,
  p_arrival_date date,
  p_departure_date date,
  p_accommodation text,
  p_traveler_type text,
  p_travelers_count integer,
  p_has_children boolean,
  p_children_count integer,
  p_interests jsonb,
  p_must_visit text,
  p_food_preferences jsonb,
  p_nightlife_types jsonb,
  p_pace text,
  p_budget_style text,
  p_special_requests text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text
)
returns public.custom_plan_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric;
  v_row public.custom_plan_requests;
begin
  v_price := case p_duration_days
    when 3 then 69
    when 5 then 89
    when 7 then 109
    else null
  end;

  if v_price is null then
    raise exception 'create_custom_plan_request: invalid duration_days (must be 3, 5, or 7)';
  end if;

  insert into public.custom_plan_requests (
    user_id, destination, duration_days, price_ils, status,
    arrival_date, departure_date, accommodation,
    traveler_type, travelers_count, has_children, children_count,
    interests, must_visit, food_preferences, nightlife_types,
    pace, budget_style, special_requests,
    customer_name, customer_email, customer_phone
  )
  values (
    p_user_id, p_destination, p_duration_days, v_price, 'draft',
    p_arrival_date, p_departure_date, p_accommodation,
    p_traveler_type, p_travelers_count, p_has_children, p_children_count,
    coalesce(p_interests, '[]'::jsonb), p_must_visit, coalesce(p_food_preferences, '[]'::jsonb), coalesce(p_nightlife_types, '[]'::jsonb),
    p_pace, p_budget_style, p_special_requests,
    p_customer_name, p_customer_email, p_customer_phone
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, integer, boolean, integer,
  jsonb, text, jsonb, jsonb, text, text, text, text, text, text
) from public;
revoke all on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, integer, boolean, integer,
  jsonb, text, jsonb, jsonb, text, text, text, text, text, text
) from anon;
revoke all on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, integer, boolean, integer,
  jsonb, text, jsonb, jsonb, text, text, text, text, text, text
) from authenticated;
grant execute on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, integer, boolean, integer,
  jsonb, text, jsonb, jsonb, text, text, text, text, text, text
) to service_role;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260901130000_add_custom_plan_products_and_order_bridge.sql
-- ════════════════════════════════════════════════════════════════════════
-- Custom Plan -> Commerce Bridge V1: seeds the 3 real Custom Plan products and adds the
-- atomic server-side bridge that turns a saved custom_plan_requests row into a real pending
-- order. No payment provider is integrated here and no money moves as a result of this
-- migration -- a bridged order is a plain `pending` order like any other (see
-- 20260831120000_create_orders_and_order_items.sql), it grants ZERO product access on its
-- own. This migration creates ZERO entitlements and flips ZERO access gates.
--
-- Additive only: does not alter any of the 5 existing product rows/prices, orders/order_items
-- schema, user_entitlements, custom_plan_requests columns/constraints, or any existing RLS
-- policy/RPC. Purely additive product rows + one new RPC.

-- ── 1. The 3 real Custom Plan products ──────────────────────────────────────────────────────
-- Prices mirror app/lib/customPlan.ts's CUSTOM_PLAN_PRICING_ILS exactly (3->69, 5->89,
-- 7->109) and the price already computed server-side by create_custom_plan_request. Idempotent
-- via `on conflict (slug) do nothing`, matching every prior product-seeding migration in this
-- project (20260829130000, 20260829120000) -- safe to re-run, never overwrites a row that
-- already exists, and does not touch any of the other 5 product rows or their prices.
insert into public.products (slug, name, price_ils, active)
values
  ('barcelona-custom-plan-3day', 'Barcelona Custom Plan — 3 Days', 69, true),
  ('barcelona-custom-plan-5day', 'Barcelona Custom Plan — 5 Days', 89, true),
  ('barcelona-custom-plan-7day', 'Barcelona Custom Plan — 7 Days', 109, true)
on conflict (slug) do nothing;

-- ── 2. create_custom_plan_order RPC ─────────────────────────────────────────────────────────
-- A trusted, atomic bridge from one custom_plan_requests row to a real pending order. Mirrors
-- create_pending_order's and create_custom_plan_request's own trust model exactly: SECURITY
-- DEFINER so it can write despite the read-only RLS on orders/order_items/custom_plan_requests
-- (runs with the privileges of its owner, not subject to its own tables' RLS); EXECUTE revoked
-- from `anon`/`authenticated` and granted only to `service_role`, so it is unreachable from the
-- browser entirely. Because service_role calls carry no user JWT, auth.uid() would return NULL
-- in that context -- so p_user_id is accepted as an explicit parameter instead, exactly like
-- the two existing commerce RPCs. This is safe specifically BECAUSE the function is
-- unreachable from the browser: the only code path that can ever call it is
-- app/lib/customPlanCommerce.ts's createCustomPlanPendingOrder, which independently resolves
-- and verifies the caller's identity via supabase.auth.getUser() on the normal session-bound
-- server client BEFORE calling this function.
--
-- Runs as a single PL/pgSQL function body, which Postgres already executes as part of the
-- calling statement's transaction -- an unhandled `raise exception` at any point aborts the
-- whole function and rolls back every write it made so far (the order insert, the order_item
-- insert, and the custom_plan_requests update), so "fetch request -> create order -> create
-- order_item -> update request" can never be observed half-done. No explicit BEGIN/COMMIT is
-- needed or possible inside a plpgsql function body for this reason.
--
-- Duration -> product mapping: this CASE statement is the ONE and ONLY place this mapping
-- exists in the whole codebase -- deliberately not duplicated in TypeScript (mirrors how
-- create_custom_plan_request is the one and only place duration -> price is computed). A
-- client can send only a request id, never a product slug, so there is nothing to trust or
-- distrust on that front.
--
-- Price authority: re-derives the expected product from duration_days, then requires
-- request.price_ils (set once, authoritatively, by create_custom_plan_request at save time) to
-- still match products.price_ils (the live catalog price) before creating anything. If a
-- product's price is ever changed after a request was saved, this deliberately fails safely
-- instead of either charging the old price silently or overwriting the request's historical
-- price_ils.
--
-- Idempotency: if the request already has an order_id, this never creates a second order.
-- - order still `pending` and already carries the expected Custom Plan product -> returned as-is
--   (reused = true), so double-clicking "متابعة للدفع" or calling this twice is always safe.
-- - order already `paid` -> returned as-is (reused = true); payment/fulfillment flow will pick
--   this up in a later task, this bridge does not need to do anything further with it.
-- - order `failed`/`cancelled`/`refunded` -> explicitly refuses to silently create a new order
--   in this task; raises a distinct, greppable exception so a future retry-handling task can
--   special-case it instead of this bridge guessing what "retry" should mean.
create or replace function public.create_custom_plan_order(
  p_user_id uuid,
  p_custom_plan_request_id uuid
)
returns table (
  order_id uuid,
  order_status text,
  total_ils numeric,
  request_id uuid,
  request_status text,
  product_slug text,
  reused boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.custom_plan_requests;
  v_existing_order public.orders;
  v_product_slug text;
  v_product public.products;
  v_order public.orders;
  v_has_expected_item boolean;
begin
  if p_user_id is null then
    raise exception 'create_custom_plan_order: p_user_id is required';
  end if;
  if p_custom_plan_request_id is null then
    raise exception 'create_custom_plan_order: p_custom_plan_request_id is required';
  end if;

  select * into v_request
  from public.custom_plan_requests
  where id = p_custom_plan_request_id;

  if not found then
    raise exception 'create_custom_plan_order: request not found';
  end if;

  if v_request.user_id is distinct from p_user_id then
    raise exception 'create_custom_plan_order: request does not belong to this user';
  end if;

  -- Duration -> product mapping (the one and only place it exists -- see header comment).
  v_product_slug := case v_request.duration_days
    when 3 then 'barcelona-custom-plan-3day'
    when 5 then 'barcelona-custom-plan-5day'
    when 7 then 'barcelona-custom-plan-7day'
    else null
  end;

  if v_product_slug is null then
    raise exception 'create_custom_plan_order: no product mapping for duration_days %', v_request.duration_days;
  end if;

  -- ── Idempotency: reuse an already-linked order instead of creating a second one ──────────
  if v_request.order_id is not null then
    select * into v_existing_order from public.orders where id = v_request.order_id;

    if not found then
      raise exception 'create_custom_plan_order: linked order % not found', v_request.order_id;
    end if;

    if v_existing_order.status = 'pending' then
      select exists (
        select 1
        from public.order_items oi
        join public.products p on p.id = oi.product_id
        where oi.order_id = v_existing_order.id and p.slug = v_product_slug
      ) into v_has_expected_item;

      if not v_has_expected_item then
        raise exception 'create_custom_plan_order: linked pending order % does not contain the expected product %', v_existing_order.id, v_product_slug;
      end if;

      return query select v_existing_order.id, v_existing_order.status, v_existing_order.total_ils,
        v_request.id, v_request.status, v_product_slug, true;
      return;
    elsif v_existing_order.status = 'paid' then
      return query select v_existing_order.id, v_existing_order.status, v_existing_order.total_ils,
        v_request.id, v_request.status, v_product_slug, true;
      return;
    else
      raise exception 'create_custom_plan_order: linked order % is % -- retry not supported in this task', v_existing_order.id, v_existing_order.status;
    end if;
  end if;

  -- ── No linked order yet: validate request state, then create one ────────────────────────
  if v_request.status not in ('draft', 'pending_payment') then
    raise exception 'create_custom_plan_order: request status % is not valid for checkout', v_request.status;
  end if;

  select * into v_product from public.products where slug = v_product_slug and active = true;

  if not found then
    raise exception 'create_custom_plan_order: product % not found or inactive', v_product_slug;
  end if;

  if v_product.price_ils is distinct from v_request.price_ils then
    raise exception 'create_custom_plan_order: request price (%) does not match current product price (%)', v_request.price_ils, v_product.price_ils;
  end if;

  insert into public.orders (user_id, status, total_ils, currency)
  values (p_user_id, 'pending', v_product.price_ils, 'ILS')
  returning * into v_order;

  insert into public.order_items (order_id, product_id, price_ils_at_purchase)
  values (v_order.id, v_product.id, v_product.price_ils);

  update public.custom_plan_requests
  set order_id = v_order.id, status = 'pending_payment'
  where id = v_request.id
  returning * into v_request;

  return query select v_order.id, v_order.status, v_order.total_ils,
    v_request.id, v_request.status, v_product_slug, false;
end;
$$;

revoke all on function public.create_custom_plan_order(uuid, uuid) from public;
revoke all on function public.create_custom_plan_order(uuid, uuid) from anon;
revoke all on function public.create_custom_plan_order(uuid, uuid) from authenticated;
grant execute on function public.create_custom_plan_order(uuid, uuid) to service_role;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260902120000_create_custom_plan_drafts.sql
-- ════════════════════════════════════════════════════════════════════════
-- Custom Plan Admin Builder V1: the itinerary-draft data model an internal admin uses to
-- review a customer's Custom Plan request and assemble/edit a deterministic day-by-day
-- itinerary for it. This is a REVIEW/AUTHORING tool only -- nothing here is ever shown to the
-- customer, emailed, exported, or linked to delivery/completion in this task. No AI, no
-- payment, no entitlement, no access-gate change.
--
-- Additive only: does not alter custom_plan_requests, orders, order_items, products,
-- user_entitlements, or any existing RLS policy/RPC/trigger function.

create table if not exists public.custom_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  -- One draft per request (a fresh "إنشاء مسودة" click on an already-drafted request reuses
  -- the existing row rather than creating a second one -- see app/lib/customPlanAdmin.ts).
  request_id uuid not null unique references public.custom_plan_requests (id) on delete cascade,
  -- Copied from custom_plan_requests.user_id at draft-creation time (the CUSTOMER who owns the
  -- underlying request, not the admin who authored the draft) -- kept as its own column so a
  -- future customer-facing read policy (not part of this task -- "Customers: NO direct access
  -- yet") can be added later without a backfill migration.
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  -- V1 status set: draft (admin still assembling/editing) -> approved (admin signed off on the
  -- itinerary content). Delivery/completion status lives on custom_plan_requests, not here, and
  -- is a later task -- approving a draft never touches custom_plan_requests.status.
  status text not null default 'draft' check (status in ('draft', 'approved')),
  -- CustomPlanDraft shape (see app/lib/customPlanDraft.ts): requestId, destination,
  -- durationDays, days[{ dayNumber, title, stops[{ placeId, title, startTime?,
  -- durationMinutes?, notes?, kind? }] }], unmatchedMustVisits[]. Stores place IDs and
  -- planning-specific fields only -- never full place metadata (name/hours/image/address),
  -- which is always re-resolved from the Barcelona Guide dataset at render time.
  plan_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_plan_drafts_request_id_idx on public.custom_plan_drafts (request_id);
create index if not exists custom_plan_drafts_user_id_idx on public.custom_plan_drafts (user_id);
create index if not exists custom_plan_drafts_status_idx on public.custom_plan_drafts (status);

-- Reuses the generic public.set_updated_at() trigger function introduced in
-- 20260901120000_create_custom_plan_requests.sql -- not redefined here.
drop trigger if exists custom_plan_drafts_set_updated_at on public.custom_plan_drafts;
create trigger custom_plan_drafts_set_updated_at
before update on public.custom_plan_drafts
for each row
execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- RLS enabled with ZERO policies -- stricter than every other table in this project (which at
-- least grants the owner SELECT). This is deliberate: admins are not modeled as a DB
-- role/policy concept in V1 (see the task's own "For V1, use a server-side admin allowlist
-- based on environment variable" instruction) -- there is no `auth.uid() = admin` condition
-- Postgres could express here. Every read AND write goes through server-only, service_role-
-- backed code (app/lib/customPlanAdmin.ts), gated by the ADMIN_EMAILS allowlist checked in
-- TypeScript (app/lib/admin.ts) BEFORE the service-role client is ever touched -- the same
-- verified-identity-then-privileged-operation trust model already used for
-- create_pending_order/create_custom_plan_request/create_custom_plan_order, just applied to
-- reads too since "admin can see other users' data" can never be expressed as a `user_id =
-- auth.uid()` policy anyway. Customers get zero access (no SELECT policy at all) -- "Customers:
-- NO direct access yet" -- and there are no INSERT/UPDATE/DELETE policies for anyone, so the
-- browser (admin or customer) can never write here directly, only through a Server Action that
-- re-checks admin authorization on every call.
alter table public.custom_plan_drafts enable row level security;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260904120000_custom_plan_fixed_price_simplified_intake.sql
-- ════════════════════════════════════════════════════════════════════════
-- Custom Plan Simple Intake V2: fixed price (99 ILS for any 1-10 day trip), simplified
-- 4-question intake (duration/dates, interests, accommodation, contact). Replaces the old
-- duration-tiered pricing model (3/5/7 days -> 69/89/109 ILS) with ONE product for all new
-- purchases, while preserving every historical row/order untouched.
--
-- Additive + backward-compatible only:
--   - inserts one new product row (idempotent)
--   - deactivates (never deletes) the 3 old duration-tiered products, safe because: (a)
--     order_items.price_ils_at_purchase already snapshots historical pricing independently of
--     products.price_ils/active, (b) Custom Plan has never granted entitlements (confirmed --
--     getUserEntitlements() filters on products.active, but no user_entitlements row has ever
--     referenced a Custom Plan product slug, so deactivating these three cannot hide anything
--     from a customer's "My Purchases" list), (c) the Custom Plan request list in /account reads
--     custom_plan_requests directly and never joins/filters on products.active at all.
--   - relaxes now-obsolete NOT NULL constraints (traveler_type, travelers_count, pace,
--     budget_style) to nullable -- existing historical values are completely untouched, only
--     future rows are allowed to omit them
--   - adds one new nullable column (accommodation_type) with its own CHECK
--   - replaces the duration_days CHECK constraint (was limited to 3/5/7) with a 1-10 range,
--     located dynamically by introspecting pg_constraint rather than assuming its
--     auto-generated name, so this migration cannot silently no-op if the name differs from
--     what a hand-written DROP CONSTRAINT would guess
--   - replaces create_custom_plan_request (old 20-parameter signature -> new 11-parameter
--     signature: duration 1-10, price always 99, accommodation_type/accommodation_text,
--     V2-model interests, contact only) -- the OLD signature is explicitly DROPPED first
--     (function identity = name + argument types in Postgres, so a same-named function with a
--     different parameter list would otherwise just become a second overload sitting alongside
--     the old one, not a true replacement)
--   - updates create_custom_plan_order's SIGNATURE-UNCHANGED (uuid, uuid) body only: the
--     duration -> product-slug CASE mapping now always resolves to the single
--     'barcelona-custom-plan' product for any duration_days between 1 and 10, instead of
--     switching on 3/5/7
--
-- Does NOT touch: the 5 original Travel Smarter products, orders/order_items schema,
-- user_entitlements, smart_planner_saved_plans, custom_plan_drafts, any Smart Planner file/
-- table/RPC, any existing RLS policy definition, or any historical custom_plan_requests row
-- data (only column NULLABILITY/CHECK constraints change; no UPDATE touches existing values).

-- ── 1. The one new fixed-price Custom Plan product ──────────────────────────────────────────
insert into public.products (slug, name, price_ils, active)
values ('barcelona-custom-plan', 'Barcelona Custom Plan', 99, true)
on conflict (slug) do nothing;

-- ── 2. Retire the old duration-tiered products for NEW purchases only ──────────────────────
-- Historical rows are untouched (still readable, still referenced correctly by any existing
-- order_items row via product_id) -- `active = false` only prevents create_custom_plan_order
-- (and any other future code) from selecting them for a NEW order. See header comment for why
-- this is safe (no entitlement/display dependency on these specific slugs anywhere).
update public.products
set active = false
where slug in ('barcelona-custom-plan-3day', 'barcelona-custom-plan-5day', 'barcelona-custom-plan-7day');

-- ── 3. Relax now-optional NOT NULL constraints ──────────────────────────────────────────────
-- The simplified 4-question intake no longer asks traveler type, traveler count, pace, or
-- budget style -- these become NULL on new rows rather than fabricated defaults. Existing
-- historical values are completely unaffected (ALTER COLUMN ... DROP NOT NULL never rewrites
-- data). Their CHECK constraints (traveler_type/pace/budget_style enums) are left exactly as
-- they were -- a CHECK constraint already treats NULL as satisfied (only FALSE fails it), so
-- no further change is needed there.
alter table public.custom_plan_requests
  alter column traveler_type drop not null,
  alter column travelers_count drop not null,
  alter column pace drop not null,
  alter column budget_style drop not null;

-- ── 4. New accommodation model ──────────────────────────────────────────────────────────────
-- Additive, nullable column -- historical rows keep using the free-text `accommodation` column
-- alone (accommodation_type stays NULL for them, which the app treats identically to
-- "not_booked" for display purposes). New rows populate both: accommodation_type is the
-- structured status, accommodation carries the free-text hotel/apartment name or address (NULL
-- when accommodation_type = 'not_booked').
alter table public.custom_plan_requests
  add column if not exists accommodation_type text check (accommodation_type in ('hotel', 'apartment', 'not_booked'));

-- ── 5. duration_days: 3/5/7 -> 1-10 ─────────────────────────────────────────────────────────
-- Located dynamically (never assumes the auto-generated constraint name) so this step cannot
-- silently no-op -- if nothing is found, the ADD CONSTRAINT below still runs and simply adds a
-- second (compatible) check; if the old constraint IS found, it's removed first so 1-10 is the
-- only duration_days rule left.
do $$
declare
  v_constraint_name text;
begin
  select con.conname into v_constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'custom_plan_requests'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%duration_days%'
  limit 1;

  if v_constraint_name is not null then
    execute format('alter table public.custom_plan_requests drop constraint %I', v_constraint_name);
  end if;
end $$;

alter table public.custom_plan_requests
  add constraint custom_plan_requests_duration_days_range_check check (duration_days between 1 and 10);

-- ── 6. create_custom_plan_request: new signature, fixed price ──────────────────────────────
-- The OLD 20-parameter function is a DIFFERENT function identity from the new 11-parameter one
-- (Postgres overloads by name + argument types) -- DROP it explicitly first so exactly one
-- `create_custom_plan_request` exists afterward, not two.
drop function if exists public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, integer, boolean, integer,
  jsonb, text, jsonb, jsonb, text, text, text, text, text, text
);

-- Price authority: p_price_ils is not a parameter at all -- 99 is hardcoded inside this
-- function for every valid (1-10) duration, mirroring the original function's own "the price
-- is computed entirely inside this function, never accepted from the caller" design.
create or replace function public.create_custom_plan_request(
  p_user_id uuid,
  p_destination text,
  p_duration_days integer,
  p_arrival_date date,
  p_departure_date date,
  p_accommodation_type text,
  p_accommodation_text text,
  p_interests jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text
)
returns public.custom_plan_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.custom_plan_requests;
begin
  if p_duration_days is null or p_duration_days < 1 or p_duration_days > 10 then
    raise exception 'create_custom_plan_request: invalid duration_days (must be between 1 and 10)';
  end if;

  if p_departure_date is not null and p_arrival_date is not null and p_departure_date < p_arrival_date then
    raise exception 'create_custom_plan_request: departure_date must be on or after arrival_date';
  end if;

  if p_accommodation_type is not null and p_accommodation_type not in ('hotel', 'apartment', 'not_booked') then
    raise exception 'create_custom_plan_request: invalid accommodation_type';
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'create_custom_plan_request: customer_name is required';
  end if;

  if p_customer_email is null or length(trim(p_customer_email)) = 0 then
    raise exception 'create_custom_plan_request: customer_email is required';
  end if;

  insert into public.custom_plan_requests (
    user_id, destination, duration_days, price_ils, status,
    arrival_date, departure_date,
    accommodation_type, accommodation,
    interests,
    customer_name, customer_email, customer_phone
  )
  values (
    p_user_id, p_destination, p_duration_days, 99, 'draft',
    p_arrival_date, p_departure_date,
    p_accommodation_type, p_accommodation_text,
    coalesce(p_interests, '[]'::jsonb),
    p_customer_name, p_customer_email, p_customer_phone
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, jsonb, text, text, text
) from public;
revoke all on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, jsonb, text, text, text
) from anon;
revoke all on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, jsonb, text, text, text
) from authenticated;
grant execute on function public.create_custom_plan_request(
  uuid, text, integer, date, date, text, text, jsonb, text, text, text
) to service_role;

-- ── 7. create_custom_plan_order: single product for every duration ─────────────────────────
-- Signature UNCHANGED (uuid, uuid) -- this is a true CREATE OR REPLACE, not a new overload.
-- Only the duration -> product-slug mapping changes: every valid (1-10) duration now maps to
-- the single 'barcelona-custom-plan' product instead of switching on 3/5/7. Everything else
-- (ownership check, idempotent order reuse, price-match authority against products.price_ils,
-- atomic order+order_item+request-status update) is byte-for-byte identical to the original.
create or replace function public.create_custom_plan_order(
  p_user_id uuid,
  p_custom_plan_request_id uuid
)
returns table (
  order_id uuid,
  order_status text,
  total_ils numeric,
  request_id uuid,
  request_status text,
  product_slug text,
  reused boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.custom_plan_requests;
  v_existing_order public.orders;
  v_product_slug text;
  v_product public.products;
  v_order public.orders;
  v_has_expected_item boolean;
begin
  if p_user_id is null then
    raise exception 'create_custom_plan_order: p_user_id is required';
  end if;
  if p_custom_plan_request_id is null then
    raise exception 'create_custom_plan_order: p_custom_plan_request_id is required';
  end if;

  select * into v_request
  from public.custom_plan_requests
  where id = p_custom_plan_request_id;

  if not found then
    raise exception 'create_custom_plan_order: request not found';
  end if;

  if v_request.user_id is distinct from p_user_id then
    raise exception 'create_custom_plan_order: request does not belong to this user';
  end if;

  -- Duration -> product mapping (the one and only place it exists -- see header comment). Any
  -- valid duration (1-10, already enforced by the table's own CHECK constraint) maps to the
  -- single fixed-price product; only a corrupt/impossible duration_days value falls through.
  if v_request.duration_days between 1 and 10 then
    v_product_slug := 'barcelona-custom-plan';
  else
    v_product_slug := null;
  end if;

  if v_product_slug is null then
    raise exception 'create_custom_plan_order: no product mapping for duration_days %', v_request.duration_days;
  end if;

  -- ── Idempotency: reuse an already-linked order instead of creating a second one ──────────
  if v_request.order_id is not null then
    select * into v_existing_order from public.orders where id = v_request.order_id;

    if not found then
      raise exception 'create_custom_plan_order: linked order % not found', v_request.order_id;
    end if;

    if v_existing_order.status = 'pending' then
      select exists (
        select 1
        from public.order_items oi
        join public.products p on p.id = oi.product_id
        where oi.order_id = v_existing_order.id and p.slug = v_product_slug
      ) into v_has_expected_item;

      if not v_has_expected_item then
        raise exception 'create_custom_plan_order: linked pending order % does not contain the expected product %', v_existing_order.id, v_product_slug;
      end if;

      return query select v_existing_order.id, v_existing_order.status, v_existing_order.total_ils,
        v_request.id, v_request.status, v_product_slug, true;
      return;
    elsif v_existing_order.status = 'paid' then
      return query select v_existing_order.id, v_existing_order.status, v_existing_order.total_ils,
        v_request.id, v_request.status, v_product_slug, true;
      return;
    else
      raise exception 'create_custom_plan_order: linked order % is % -- retry not supported in this task', v_existing_order.id, v_existing_order.status;
    end if;
  end if;

  -- ── No linked order yet: validate request state, then create one ────────────────────────
  if v_request.status not in ('draft', 'pending_payment') then
    raise exception 'create_custom_plan_order: request status % is not valid for checkout', v_request.status;
  end if;

  select * into v_product from public.products where slug = v_product_slug and active = true;

  if not found then
    raise exception 'create_custom_plan_order: product % not found or inactive', v_product_slug;
  end if;

  -- Price authority: a pre-migration draft/pending_payment request (still carrying an OLD
  -- price_ils of 69/89/109 from before this migration, with no order yet) will correctly FAIL
  -- here rather than silently checking out at a stale price -- exactly the same "fails safely
  -- instead of charging the old price silently" behavior this check has always had (see the
  -- original migration's own comment). Such a request simply can no longer be completed as-is;
  -- resubmitting a fresh request captures the new 99 ILS price. No historical ORDER is ever
  -- affected by this, since an order/order_item snapshot is only created below, after this
  -- check passes.
  if v_product.price_ils is distinct from v_request.price_ils then
    raise exception 'create_custom_plan_order: request price (%) does not match current product price (%)', v_request.price_ils, v_product.price_ils;
  end if;

  insert into public.orders (user_id, status, total_ils, currency)
  values (p_user_id, 'pending', v_product.price_ils, 'ILS')
  returning * into v_order;

  insert into public.order_items (order_id, product_id, price_ils_at_purchase)
  values (v_order.id, v_product.id, v_product.price_ils);

  update public.custom_plan_requests
  set order_id = v_order.id, status = 'pending_payment'
  where id = v_request.id
  returning * into v_request;

  return query select v_order.id, v_order.status, v_order.total_ils,
    v_request.id, v_request.status, v_product_slug, false;
end;
$$;

-- Grants unchanged (same function identity as before -- CREATE OR REPLACE preserves existing
-- grants/revokes automatically), but re-asserted explicitly for clarity and to be safe even if
-- this migration is ever the first to define this function in a fresh environment.
revoke all on function public.create_custom_plan_order(uuid, uuid) from public;
revoke all on function public.create_custom_plan_order(uuid, uuid) from anon;
revoke all on function public.create_custom_plan_order(uuid, uuid) from authenticated;
grant execute on function public.create_custom_plan_order(uuid, uuid) to service_role;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260904130000_create_smart_planner_saved_plans.sql
-- ════════════════════════════════════════════════════════════════════════
-- Create Missing Smart Planner Saved Plans Table: `public.smart_planner_saved_plans` was
-- referenced by application code (V1 and V2 Smart Planner save/reopen/account/delete flows)
-- but was NEVER actually created live -- confirmed via direct authenticated QA against the
-- real database (PGRST205 "Could not find the table ... in the schema cache" on every real
-- SELECT/INSERT, while a bare row-count HEAD request happened to succeed -- the table simply
-- does not exist; no earlier migration in this repository creates it). This migration creates
-- it, derived EXACTLY from the application code's own usage -- no invented columns.
--
-- Additive + idempotent: every statement is guarded (`if not exists` / `create or replace`)
-- so this is safe to run even if parts of it were somehow already applied. Does not touch
-- products, orders, order_items, user_entitlements, custom_plan_requests, custom_plan_drafts,
-- or any existing RLS policy/RPC/trigger on another table.
--
-- ── Schema derivation (audit) ────────────────────────────────────────────────────────────
-- Every column below is required by a real, current code path:
--   id                    -- .eq("id", id) in DeleteSavedPlanButton.tsx and both saved/[id]
--                             pages (V1 + V2); SmartPlannerSavedPlanRow.id /
--                             SmartPlannerV2SavedPlanRow.id
--   user_id               -- .eq("user_id", user.id) in app/account/page.tsx; RLS ownership
--                             for every policy below; never sent explicitly by the client
--                             INSERT (SmartPlannerApp.tsx / SmartPlannerV2App.tsx both insert
--                             without a user_id field), so it MUST default to auth.uid()
--   product_slug          -- inserted by both V1 ("barcelona-smart-planner") and V2
--                             ("barcelona-smart-planner-v2", see
--                             smartPlannerV2SavedPlans.ts's V2_SAVED_PLAN_PRODUCT_SLUG);
--                             read back in account/page.tsx's row rendering
--   destination_slug      -- inserted by both V1 and V2 as "barcelona"; read back in
--                             account/page.tsx (DESTINATION_LABELS lookup)
--   preferences_json       -- inserted by both (normalizeSmartPlannerPreferences /
--                             normalizeSmartPlannerV2Preferences); read back by both saved/[id]
--                             pages and account/page.tsx; SHAPE DIFFERS between V1
--                             (SmartPlannerSavedPreferences: tripLength/interests/mustVisit/
--                             accommodation?/primaryInterest?) and V2
--                             (SmartPlannerV2SavedPreferences: plannerVersion/destinationId/
--                             dateMode/durationDays?/arrivalDate?/departureDate?/interests/
--                             accommodation) -- jsonb, no shape-specific CHECK, exactly as the
--                             task requires
--   generated_plan_json    -- inserted by both (V1: { smartPlan, presentedPlan }; V2: { plan:
--                             V2Plan }); read back by both saved/[id] pages to render the
--                             FROZEN plan with no regeneration -- jsonb, no shape-specific CHECK
--   created_at             -- .order("created_at", { ascending: false }) in account/page.tsx;
--                             never sent by the client, must default to now()
--   updated_at             -- both SmartPlannerSavedPlanRow/SmartPlannerV2SavedPlanRow type
--                             this field; no code path currently calls .update() on this table,
--                             but the column itself is part of the already-established row
--                             shape both TS types expect, so it's kept (cheap, harmless) even
--                             though the UPDATE RLS policy/grant below is deliberately omitted
--                             (see the RLS section)
--
-- No other column is referenced anywhere in the codebase -- none invented.

create table if not exists public.smart_planner_saved_plans (
  id uuid primary key default gen_random_uuid(),
  -- Never sent explicitly by either client insert call (see audit above) -- must default to
  -- the requesting user's own id. RLS WITH CHECK below independently re-verifies this on every
  -- insert regardless, matching the same defense-in-depth pattern used by every other
  -- user-owned table in this project (custom_plan_requests, orders).
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_slug text not null,
  destination_slug text not null,
  -- V1 shape (SmartPlannerSavedPreferences) and V2 shape (SmartPlannerV2SavedPreferences) are
  -- genuinely different JSON shapes stored in the SAME column, by product design (see
  -- smartPlannerV2SavedPlans.ts's own header comment) -- deliberately NOT constrained by a
  -- database-level CHECK, so neither version's shape can ever be rejected by the other's rules.
  -- Version-specific validation stays in application code (preferences_json.plannerVersion for
  -- V2; its absence for V1).
  preferences_json jsonb not null,
  -- { smartPlan, presentedPlan } for V1, or { plan } for V2 -- the exact generated output at
  -- save time, so a saved plan always redisplays byte-for-byte with no regeneration, even if
  -- planner/transport/presentation logic changes later. Never duplicates guide place content
  -- for V1 (resolved live by placeId on reopen); V2's plan is already fully resolved at
  -- generation time by design (see barcelonaV2Resolve.ts), so this legitimately IS the final
  -- render-ready V2 shape -- both are correct for their own architecture.
  generated_plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Duplicate-save guard: re-saving the EXACT SAME (user, product, destination, normalized
  -- preferences) combination is a duplicate -- both SmartPlannerApp.tsx and
  -- SmartPlannerV2App.tsx catch Postgres error code 23505 from this exact constraint and show
  -- "duplicate" status (see normalizeSmartPlannerPreferences / normalizeSmartPlannerV2Preferences,
  -- whose entire purpose is making this constraint reliable: sorted arrays, trimmed text,
  -- omitted-not-null optional keys, so two logically-identical requests always normalize to
  -- byte-identical JSON and never miss each other). A genuinely different choice (different
  -- days, interests, dates, accommodation, or a different planner version's product_slug) always
  -- produces different preferences_json and is NEVER blocked -- this is not a "one saved plan
  -- per user" limit, only a "don't silently duplicate the identical request" guard.
  unique (user_id, product_slug, destination_slug, preferences_json)
);

-- Matches the account page's exact query pattern (WHERE user_id = ? ORDER BY created_at DESC)
-- as one composite index, rather than two separate single-column indexes -- avoids over-
-- indexing while still covering both real query needs (owner-scoped RLS lookups AND the
-- account page's own explicit .eq("user_id", ...).order("created_at", ...) call). No
-- product_slug index: nothing in the codebase filters by it alone (only ever read back on an
-- already-id-scoped or already-user_id-scoped row).
create index if not exists smart_planner_saved_plans_user_id_created_at_idx
  on public.smart_planner_saved_plans (user_id, created_at desc);

-- Reuses the existing generic trigger function (introduced in
-- 20260901120000_create_custom_plan_requests.sql, already live) rather than defining a
-- near-duplicate -- no code path currently UPDATEs this table, but the column/trigger stay
-- consistent with both TS row types and cost nothing to keep.
drop trigger if exists smart_planner_saved_plans_set_updated_at on public.smart_planner_saved_plans;
create trigger smart_planner_saved_plans_set_updated_at
before update on public.smart_planner_saved_plans
for each row
execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- With RLS enabled and no policy for a given command, that command is denied by default for
-- `anon`/`authenticated` -- anon gets ZERO policies below, so it has no access at all (not
-- even SELECT), matching every other user-owned table in this project. Every policy is scoped
-- to `user_id = auth.uid()`, read from the request's verified session JWT, never from
-- client-supplied input -- a user can only ever read/create/delete their own rows, and
-- guessing another user's row id returns nothing (not an error), never that user's plan.
--
-- No UPDATE policy: audited every real caller (SmartPlannerApp.tsx, SmartPlannerV2App.tsx,
-- account/page.tsx, DeleteSavedPlanButton.tsx, both saved/[id] pages) -- none ever calls
-- .update() on this table. Per this task's own "grant only what's genuinely used" / "do not
-- over-constrain" instructions, no UPDATE policy or grant is created; the updated_at column
-- and trigger still exist for future use and TS-type consistency, they're just never reachable
-- from the client today.

alter table public.smart_planner_saved_plans enable row level security;

create policy "Users can view their own saved plans"
on public.smart_planner_saved_plans
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their own saved plans"
on public.smart_planner_saved_plans
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete their own saved plans"
on public.smart_planner_saved_plans
for delete
to authenticated
using (user_id = auth.uid());

-- ── Grants ────────────────────────────────────────────────────────────────────────────────
-- No other table in this project has explicit table-level GRANTs (every other migration
-- relies on Supabase's own default-privilege bootstrapping for anon/authenticated/service_role
-- on tables in `public`, with RLS as the real gate) -- these are added here explicitly anyway,
-- defensively, per this task's own instruction, and because the exact failure that motivated
-- this migration (a table PostgREST could not see/use) makes an unambiguous, explicit grant
-- section worth the extra clarity even though it's likely redundant with the project's
-- existing defaults. Only the operations real code paths actually use are granted to
-- `authenticated` (select/insert/delete -- no update, see the RLS section above); anon gets
-- nothing at all.
grant select, insert, delete on public.smart_planner_saved_plans to authenticated;
grant select, insert, update, delete on public.smart_planner_saved_plans to service_role;

-- Forces PostgREST to pick up this new table immediately rather than waiting for its own
-- periodic/DDL-triggered refresh -- directly closes the exact gap ("table exists in Postgres,
-- but PostgREST's schema cache doesn't know about it yet") this whole task exists to fix.
notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260904140000_custom_plan_fulfillment_v1.sql
-- ════════════════════════════════════════════════════════════════════════
-- Custom Plan Fulfillment V1: ADMIN DRAFT -> REVIEW -> READY -> CUSTOMER DELIVERY.
--
-- Additive + backward-compatible only:
--   - widens custom_plan_requests.status's CHECK constraint to add 'ready' and 'delivered' --
--     located dynamically (never assumes the auto-generated constraint name), same pattern as
--     the duration_days fix in 20260904120000. Every existing value ('draft', 'pending_payment',
--     'paid', 'in_progress', 'completed', 'cancelled') stays valid -- 'completed' is kept for
--     historical rows even though no code path writes it anymore (new flows use
--     'ready' -> 'delivered' instead).
--   - creates ONE new table, public.custom_plan_final_plans: the FROZEN customer-facing
--     itinerary snapshot, written once at delivery time (see app/lib/customPlanAdmin.ts's
--     deliverCustomPlanForAdmin) and never rebuilt/regenerated after that. Separate from
--     custom_plan_drafts on purpose -- the draft stays live/editable by an admin indefinitely
--     (including after delivery, for a possible future correction flow), while this table is
--     the actual thing a customer is shown, which must never change just because the draft did.
--
-- Does NOT touch: custom_plan_drafts' own schema, any product/order/entitlement table, any
-- Smart Planner file/table/RPC, or any historical custom_plan_requests row data (only the
-- status CHECK constraint changes -- no UPDATE touches existing values).

-- ── 1. custom_plan_requests.status: add 'ready' / 'delivered' ──────────────────────────────
do $$
declare
  v_constraint_name text;
begin
  select con.conname into v_constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'custom_plan_requests'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%'
    and pg_get_constraintdef(con.oid) ilike '%draft%'
  limit 1;

  if v_constraint_name is not null then
    execute format('alter table public.custom_plan_requests drop constraint %I', v_constraint_name);
  end if;
end $$;

alter table public.custom_plan_requests
  add constraint custom_plan_requests_status_v2_check check (
    status in ('draft', 'pending_payment', 'paid', 'in_progress', 'completed', 'ready', 'delivered', 'cancelled')
  );

-- ── 2. custom_plan_final_plans: the frozen customer-delivery artifact ──────────────────────
create table if not exists public.custom_plan_final_plans (
  id uuid primary key default gen_random_uuid(),
  -- One final plan per request, ever -- deliverCustomPlanForAdmin checks for an existing row
  -- before inserting (idempotent repeat-deliver), and this UNIQUE constraint is the real,
  -- database-level backstop against ever accidentally inserting a second one.
  request_id uuid not null unique references public.custom_plan_requests (id) on delete cascade,
  -- The CUSTOMER who owns the underlying request (copied from custom_plan_requests.user_id at
  -- delivery time) -- this is what the RLS SELECT policy below scopes against.
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  -- Same range as custom_plan_requests.duration_days (see 20260904120000's
  -- custom_plan_requests_duration_days_range_check) -- defense-in-depth only, since the sole
  -- writer (deliverCustomPlanForAdmin) always copies this from an already-validated request row.
  duration_days integer not null check (duration_days between 1 and 10),
  -- CustomPlanFinalPlanData shape (see app/lib/customPlanFinalPlan.ts): requestId, destination,
  -- durationDays, deliveredAt, days[{ dayNumber, date, title, summary, stops[{ placeId, title,
  -- kind, startTime?, durationMinutes?, customerNote? }] }]. Structurally has no field for an
  -- admin-only note or any generation-internal artifact (unmatchedMustVisits/generatedAt) --
  -- those are dropped when this snapshot is built from the draft, not merely hidden by the UI.
  plan_data jsonb not null,
  delivered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists custom_plan_final_plans_user_id_idx on public.custom_plan_final_plans (user_id);

-- ── Row Level Security ──────────────────────────────────────────────────────────────────────
-- Same read-only-for-the-owner posture as custom_plan_requests/orders/smart_planner_saved_plans:
-- authenticated customers get SELECT on their own row only. No INSERT/UPDATE/DELETE policy for
-- anyone -- this table is written exclusively by the service-role-backed
-- deliverCustomPlanForAdmin (app/lib/customPlanAdmin.ts), gated by the ADMIN_EMAILS allowlist
-- check, never directly from the browser (admin or customer). `anon` gets no policy at all, so
-- it has zero access, matching every other table in this project.
alter table public.custom_plan_final_plans enable row level security;

create policy "Users can view their own delivered custom plan"
on public.custom_plan_final_plans
for select
to authenticated
using (user_id = auth.uid());

-- Explicit table-level grants (belt-and-suspenders alongside RLS) -- the same defensive pattern
-- used in 20260904130000_create_smart_planner_saved_plans.sql, added because a missing grant is
-- exactly the class of "PostgREST can't see this correctly" bug that migration exists to guard
-- against, even though most tables in this project rely on RLS alone.
grant select on public.custom_plan_final_plans to authenticated;
grant all on public.custom_plan_final_plans to service_role;
revoke all on public.custom_plan_final_plans from anon;

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260906120000_create_missing_custom_plan_drafts.sql
-- ════════════════════════════════════════════════════════════════════════
-- Recovery migration: public.custom_plan_drafts was DESIGNED and its creation SQL was written
-- in 20260902120000_create_custom_plan_drafts.sql, but live verification during Custom Plan
-- Fulfillment V1 QA proved via the Supabase SQL Editor itself that the table was never actually
-- applied to the live database (`ERROR 42P01: relation "public.custom_plan_drafts" does not
-- exist`) -- the earlier "PGRST205 / not found in schema cache" symptom was PostgREST correctly
-- reporting a table that genuinely never existed, not a stale-cache issue. This is the exact
-- same class of gap already hit once before with smart_planner_saved_plans
-- (20260904130000_create_smart_planner_saved_plans.sql).
--
-- This migration re-creates EXACTLY the table 20260902120000 already defined (verified against
-- the current app/lib/customPlanDraft.ts and app/lib/customPlanAdmin.ts -- both still expect
-- precisely this shape; nothing about Custom Plan Fulfillment V1 added a new top-level column,
-- only extended fields *inside* the existing `plan_data` jsonb blob, which needs no schema
-- change), plus adds explicit grants that the original migration omitted -- the same defensive
-- addition already made for smart_planner_saved_plans/custom_plan_final_plans, since relying on
-- RLS + service_role's RLS-bypass alone was exactly the kind of gap that produced this class of
-- bug before.
--
-- `create table if not exists` -- if this table somehow already exists by the time this runs
-- (e.g. applied out of band), this is a safe no-op for the table itself; the grants below are
-- unconditional and idempotent regardless.
--
-- Additive only. Does NOT touch: custom_plan_requests (no existing row read/written/altered --
-- there are zero historical draft rows to preserve, since the table never existed live to hold
-- any), custom_plan_final_plans, any Smart Planner table, orders/order_items/products/
-- user_entitlements, any price, or any access gate.

create table if not exists public.custom_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  -- One draft per request -- generateOrGetCustomPlanDraftForAdmin checks for an existing row
  -- before ever generating a new one (app/lib/customPlanAdmin.ts); this UNIQUE constraint is the
  -- real database-level backstop, exactly mirroring custom_plan_final_plans' own
  -- UNIQUE(request_id) idempotency guarantee.
  request_id uuid not null unique references public.custom_plan_requests (id) on delete cascade,
  -- The CUSTOMER who owns the underlying request (copied from custom_plan_requests.user_id at
  -- draft-creation time) -- not the admin who authored the draft.
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  -- draft (admin still assembling/editing) -> approved (admin signed off, required before
  -- markCustomPlanReadyForAdmin will accept it and before regenerateCustomPlanDraftForAdmin will
  -- refuse a regenerate). Delivery status lives on custom_plan_requests, not here.
  status text not null default 'draft' check (status in ('draft', 'approved')),
  -- CustomPlanDraftPlanData shape (app/lib/customPlanDraft.ts): requestId, destination,
  -- durationDays, days[{ dayNumber, date, title, summary, stops[{ placeId, title, kind,
  -- startTime?, durationMinutes?, adminNote?, customerNote? }] }], unmatchedMustVisits[],
  -- generatedAt. No JSON-shape CHECK constraint -- app-level normalizeDraftPlanData() already
  -- handles both this current shape and the original (pre-Fulfillment-V1) shape with a single
  -- `notes` field instead of adminNote/customerNote, exactly so this column never needs a rigid
  -- constraint that would have to be migrated every time the draft format is extended.
  plan_data jsonb not null,
  created_at timestamptz not null default now(),
  -- Updated by public.set_updated_at() below on every UPDATE -- saveCustomPlanDraftForAdmin/
  -- approveCustomPlanDraftForAdmin/regenerateCustomPlanDraftForAdmin all rely on this being kept
  -- current (the admin request page shows it as "آخر تحديث").
  updated_at timestamptz not null default now()
);

create index if not exists custom_plan_drafts_request_id_idx on public.custom_plan_drafts (request_id);
create index if not exists custom_plan_drafts_user_id_idx on public.custom_plan_drafts (user_id);
create index if not exists custom_plan_drafts_status_idx on public.custom_plan_drafts (status);

-- Reuses the generic public.set_updated_at() trigger function from
-- 20260901120000_create_custom_plan_requests.sql -- not redefined here.
drop trigger if exists custom_plan_drafts_set_updated_at on public.custom_plan_drafts;
create trigger custom_plan_drafts_set_updated_at
before update on public.custom_plan_drafts
for each row
execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- This is an admin-internal authoring table -- customers never read or write it directly (see
-- app/lib/customPlanDelivery.ts, which never queries this table at all; the customer only ever
-- sees the FROZEN snapshot in custom_plan_final_plans once delivered). RLS enabled with ZERO
-- policies for `authenticated`/`anon` -- there is no `auth.uid() = admin` condition Postgres
-- could express for a plain email-allowlist admin model (see app/lib/admin.ts), so every read
-- AND write goes through server-only, service_role-backed code (app/lib/customPlanAdmin.ts),
-- gated by the ADMIN_EMAILS allowlist checked in TypeScript BEFORE the service-role client is
-- ever touched. No INSERT/UPDATE/DELETE/SELECT policy for anyone means the browser (admin or
-- customer) can never read or write here directly, only through a Server Action that re-checks
-- admin authorization on every call.
alter table public.custom_plan_drafts enable row level security;

-- Explicit table-level grants -- the original 20260902120000 migration omitted these, relying
-- solely on RLS + service_role's own RLS-bypass; adding them now defensively (same pattern as
-- 20260904130000/20260904140000) since a missing grant is exactly the kind of "PostgREST can't
-- see this correctly" gap this whole recovery migration exists to close out for good.
grant select, insert, update, delete on public.custom_plan_drafts to service_role;
revoke all on public.custom_plan_drafts from authenticated;
revoke all on public.custom_plan_drafts from anon;

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260906130000_harden_custom_plan_final_plans_grants.sql
-- ════════════════════════════════════════════════════════════════════════
-- Defense-in-depth only -- NOT a security fix. Live QA of Custom Plan Fulfillment V1 proved
-- RLS already fully protects public.custom_plan_final_plans: an authenticated customer's
-- UPDATE/DELETE against their own delivered row affects exactly zero rows and returns no error
-- (Postgres's standard behavior for a DML command with no matching RLS policy -- the row is
-- simply filtered out, not "allowed then silently reverted") -- verified live, and the row's
-- content was confirmed byte-for-byte unchanged afterward.
--
-- The ONLY change here: explicit revokes on public.custom_plan_final_plans for `authenticated`,
-- matching the style already used on public.custom_plan_drafts (20260906120000) and
-- public.custom_plan_requests, so a blocked write raises a clear "permission denied for table"
-- error immediately instead of a silent 0-rows-affected result -- purely a clarity/consistency
-- improvement, changes no actual access outcome.
--
-- Additive only. Touches no data, no other table, no policy definition.

revoke insert, update, delete on public.custom_plan_final_plans from authenticated;

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260906140000_unified_personalized_plan_product.sql
-- ════════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20260910120000_guest_checkout_and_claim.sql
-- ════════════════════════════════════════════════════════════════════════
-- Guest checkout + secure claim: lets a visitor pay WITHOUT an account, then attach the paid
-- order to an account afterwards ("claim") using a single-use secret token.
--
-- Additive / relaxing only. Does not touch products, user_entitlements, order_items, any price,
-- any RLS policy, or the custom-plan tables/RPCs. Existing rows are unaffected (every existing
-- order keeps its user_id; the new columns are NULL for them).
--
-- Deploy order: apply this migration BEFORE the code that uses it. The currently deployed code
-- keeps working against it (it calls create_pending_order with two named args, which still
-- resolves to the new function via the defaulted trailing parameters).
--
-- Security model:
--   * The claim token is 32 random bytes generated by the server. ONLY its SHA-256 hash is stored
--     here (claim_token_hash); the plaintext exists only in the buyer's redirect URL.
--   * An unclaimed guest order (user_id IS NULL) is invisible to every client: the existing RLS
--     policies compare user_id = auth.uid(), which is never true for NULL. Only service_role
--     server code can read or claim it.
--   * claim_guest_order() is the ONLY way an order gets an owner after creation. It is service_role
--     only, runs as ONE statement-level transaction, requires status = 'paid', and flips user_id
--     in a single conditional UPDATE, so two concurrent/repeated claims can never both win.
--   * guest_email is stored for the payment receipt / support only. It is never used to authorize
--     anything.

-- ── orders: allow guest orders and track the claim ───────────────────────────────────────────
alter table public.orders
  alter column user_id drop not null;

alter table public.orders
  add column if not exists guest_email text,
  add column if not exists claim_token_hash text,
  add column if not exists claim_expires_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists claimed_at timestamptz;

-- One token hash identifies exactly one order. NULLs (all logged-in orders) are allowed many times.
create unique index if not exists orders_claim_token_hash_key
  on public.orders (claim_token_hash)
  where claim_token_hash is not null;

-- An order can never be ownerless AND unclaimable, and "claimed" always implies an owner.
alter table public.orders
  drop constraint if exists orders_owner_or_claim_chk;
alter table public.orders
  add constraint orders_owner_or_claim_chk check (user_id is not null or claim_token_hash is not null);

alter table public.orders
  drop constraint if exists orders_claim_state_chk;
alter table public.orders
  add constraint orders_claim_state_chk check (claimed_at is null or user_id is not null);

-- Defense in depth: once an order has an owner, that owner can never be changed or removed by an
-- UPDATE, whatever code (or future bug) tries it. This is what guarantees "never claimable by more
-- than one user" at the database level, independent of the application.
create or replace function public.orders_user_id_is_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.user_id is not null and new.user_id is distinct from old.user_id then
    raise exception 'orders.user_id cannot be changed once an order has an owner';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_user_id_immutable on public.orders;
create trigger orders_user_id_immutable
before update on public.orders
for each row
execute function public.orders_user_id_is_immutable();

-- ── create_pending_order: now also creates GUEST orders ──────────────────────────────────────
-- Same trust model as before (service_role only; the caller resolves identity first):
--   * logged-in order : p_user_id = verified user id, p_claim_token_hash = NULL
--   * guest order     : p_user_id = NULL, p_claim_token_hash = sha256 hex of the server-made token
-- Prices still come ONLY from public.products here -- never from the caller.
drop function if exists public.create_pending_order(uuid, text[]);

create or replace function public.create_pending_order(
  p_user_id uuid,
  p_product_slugs text[],
  p_claim_token_hash text default null,
  p_guest_email text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slugs text[];
  v_slug_count int;
  v_active_count int;
  v_total numeric;
  v_order public.orders;
  v_email text;
begin
  if p_user_id is null then
    -- Guest order: a well-formed token hash is mandatory (otherwise nobody could ever claim it).
    if p_claim_token_hash is null or p_claim_token_hash !~ '^[0-9a-f]{64}$' then
      raise exception 'create_pending_order: a guest order requires a valid claim token hash';
    end if;
    v_email := nullif(left(trim(coalesce(p_guest_email, '')), 254), '');
  else
    -- Logged-in order: never carries a claim token or guest email.
    if p_claim_token_hash is not null then
      raise exception 'create_pending_order: a logged-in order must not have a claim token';
    end if;
    v_email := null;
  end if;

  select array_agg(distinct s) into v_slugs
  from unnest(coalesce(p_product_slugs, array[]::text[])) as s
  where s is not null and length(trim(s)) > 0;

  v_slug_count := coalesce(array_length(v_slugs, 1), 0);
  if v_slug_count = 0 then
    raise exception 'create_pending_order: at least one product slug is required';
  end if;

  select count(*) into v_active_count
  from public.products
  where slug = any(v_slugs) and active = true;

  if v_active_count <> v_slug_count then
    raise exception 'create_pending_order: one or more requested products are invalid or inactive';
  end if;

  select coalesce(sum(price_ils), 0) into v_total
  from public.products
  where slug = any(v_slugs) and active = true;

  insert into public.orders (user_id, status, total_ils, currency, claim_token_hash, guest_email)
  values (p_user_id, 'pending', v_total, 'ILS', p_claim_token_hash, v_email)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, price_ils_at_purchase)
  select v_order.id, p.id, p.price_ils
  from public.products p
  where p.slug = any(v_slugs) and p.active = true;

  return v_order;
end;
$$;

revoke all on function public.create_pending_order(uuid, text[], text, text) from public;
revoke all on function public.create_pending_order(uuid, text[], text, text) from anon;
revoke all on function public.create_pending_order(uuid, text[], text, text) from authenticated;
grant execute on function public.create_pending_order(uuid, text[], text, text) to service_role;

-- ── claim_guest_order: atomically attach a PAID guest order to an authenticated user ──────────
-- p_user_id MUST be the verified auth user (resolved by the server via auth.getUser()); this
-- function is unreachable from the browser (service_role only), exactly like create_pending_order.
-- Returns one of: 'claimed' | 'already_yours' | 'not_paid_yet' | 'invalid'.
-- 'invalid' deliberately covers unknown, expired, already-claimed-by-someone-else and unpaid-and-dead
-- orders alike, so a caller learns nothing about other people's orders.
create or replace function public.claim_guest_order(p_token_hash text, p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_row public.orders;
begin
  if p_user_id is null then
    raise exception 'claim_guest_order: p_user_id is required';
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return 'invalid';
  end if;

  -- THE atomic step. One conditional UPDATE: the row lock makes a concurrent/second claim wait,
  -- then re-evaluate "user_id is null" against the committed result (now false) and update 0 rows.
  update public.orders
  set user_id = p_user_id,
      claimed_at = now()
  where claim_token_hash = p_token_hash
    and user_id is null
    and status = 'paid'
    and (claim_expires_at is null or claim_expires_at > now())
  returning id into v_order_id;

  if v_order_id is not null then
    -- Same transaction as the ownership change: if this insert fails, the UPDATE above rolls back.
    insert into public.user_entitlements (user_id, product_id, source, payment_reference)
    select p_user_id, oi.product_id, 'allpay', v_order_id::text
    from public.order_items oi
    where oi.order_id = v_order_id
    on conflict (user_id, product_id) do nothing;

    return 'claimed';
  end if;

  select * into v_row from public.orders where claim_token_hash = p_token_hash;
  if not found then
    return 'invalid';
  end if;

  if v_row.user_id = p_user_id then
    return 'already_yours';
  end if;

  if v_row.user_id is null and v_row.status = 'pending' then
    return 'not_paid_yet';
  end if;

  return 'invalid';
end;
$$;

revoke all on function public.claim_guest_order(text, uuid) from public;
revoke all on function public.claim_guest_order(text, uuid) from anon;
revoke all on function public.claim_guest_order(text, uuid) from authenticated;
grant execute on function public.claim_guest_order(text, uuid) to service_role;

-- ── claim_guest_order_status: read-only status for the claim page (no ownership change) ──────
-- Lets the claim page decide what to show ("confirming payment" vs "payment successful, sign in" vs
-- "ready to add to your account") without changing anything. Returns only a coarse state, never any
-- order data: 'pending' | 'paid' | 'mine' | 'invalid'. 'mine' is returned only when the optional
-- p_viewer_id (the server-verified signed-in user) already owns the order, so re-opening your own
-- claimed link is friendly while a stranger learns nothing.
create or replace function public.claim_guest_order_status(p_token_hash text, p_viewer_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.orders;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return 'invalid';
  end if;

  select * into v_row from public.orders where claim_token_hash = p_token_hash;
  if not found then
    return 'invalid';
  end if;

  if v_row.user_id is not null then
    if p_viewer_id is not null and v_row.user_id = p_viewer_id then
      return 'mine';
    end if;
    return 'invalid';
  end if;

  if v_row.status = 'pending' then
    return 'pending';
  end if;

  if v_row.status = 'paid' and (v_row.claim_expires_at is null or v_row.claim_expires_at > now()) then
    return 'paid';
  end if;

  return 'invalid';
end;
$$;

revoke all on function public.claim_guest_order_status(text, uuid) from public;
revoke all on function public.claim_guest_order_status(text, uuid) from anon;
revoke all on function public.claim_guest_order_status(text, uuid) from authenticated;
grant execute on function public.claim_guest_order_status(text, uuid) to service_role;

-- ── Support: re-issue a lost claim link (run manually in the SQL editor, never from the app) ──
-- 1. Find the paid, unclaimed order:
--      select id, guest_email, paid_at, claim_expires_at from public.orders
--      where user_id is null and status = 'paid' order by paid_at desc;
-- 2. Generate a new token OUTSIDE the database (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`),
--    hash it (`node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" <token>`),
--    then:
--      update public.orders set claim_token_hash = '<sha256 hex>', claim_expires_at = now() + interval '30 days'
--      where id = '<order id>' and user_id is null and status = 'paid';
--    and send the customer  https://travel-smarter-gamma.vercel.app/claim-purchase?token=<token>

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20261014120000_personalized_plan_requests.sql
-- ════════════════════════════════════════════════════════════════════════
-- Personalized Plan, "one purchase = one plan": the questionnaire is answered BEFORE payment, the
-- answers are stored server-side against the pending order, and after the verified payment the plan
-- is generated from those stored answers -- exactly once per paid request.
--
-- Additive only. Does not touch products, prices, order_items, user_entitlements, any existing RLS
-- policy, create_pending_order, claim_guest_order or any other existing function. Existing rows are
-- unaffected (the only change to an existing table is one new partial unique index on
-- smart_planner_saved_plans, which only applies to rows that carry the new request-id key).
--
-- Deploy order: apply this migration BEFORE the code that uses it.
--
-- Trust model (same as create_pending_order / claim_guest_order):
--   * Every function below is service_role only. The browser can never call them; the Next.js server
--     resolves the user from the verified session and passes it in.
--   * The browser cannot write this table at all (no INSERT/UPDATE/DELETE policy and the privileges
--     are revoked). A signed-in customer may only READ requests whose order they own.
--   * Ownership is never copied onto the request: it is always derived from orders.user_id, so the
--     existing guest-claim flow (claim_guest_order) hands the request to the claiming user with no
--     change, and an unclaimed guest request is invisible to every client.
--   * The submitted answers are immutable once the row exists (trigger below), so what was reviewed
--     and paid for is exactly what is generated -- even for service_role code.
--   * Questionnaire answers never authorize anything. Generation is authorized only by: a verified
--     user + a request linked to a PAID order that user owns + that request not already generated.

create table if not exists public.personalized_plan_requests (
  id uuid primary key default gen_random_uuid(),
  -- Exactly one request per order, and (create_personalized_plan_order) exactly one order per request.
  -- Deleting an order deletes its answers with it (e.g. when erasing a customer's data on request).
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Validated against the server's own allow-list before insert; the shape check here is only a guard.
  destination_id text not null check (destination_id ~ '^[a-z][a-z0-9-]{1,39}$'),
  -- Server-normalized questionnaire answers (never the raw browser payload). Capped at 4 KB.
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 4096),
  answers_version smallint not null default 1,
  -- Short lease so two simultaneous "generate" clicks cannot both run; expires so a crash self-heals.
  generating_started_at timestamptz,
  -- Set exactly once. It is deliberately NOT cleared when the saved plan is later deleted, so a
  -- request can never be re-used to generate a second plan.
  generated_at timestamptz,
  saved_plan_id uuid references public.smart_planner_saved_plans (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personalized_plan_requests_order_id_key unique (order_id),
  constraint personalized_plan_requests_saved_plan_requires_generated_chk check (saved_plan_id is null or generated_at is not null)
);

create index if not exists personalized_plan_requests_created_at_idx on public.personalized_plan_requests (created_at);

-- ── Immutability: the reviewed-and-paid answers can never change, and "generated" can never be undone ──
create or replace function public.personalized_plan_requests_guard()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.order_id is distinct from old.order_id
     or new.destination_id is distinct from old.destination_id
     or new.answers is distinct from old.answers
     or new.answers_version is distinct from old.answers_version
     or new.created_at is distinct from old.created_at then
    raise exception 'personalized_plan_requests: the submitted answers and the order link are immutable';
  end if;

  if old.generated_at is not null and new.generated_at is distinct from old.generated_at then
    raise exception 'personalized_plan_requests: generated_at cannot be changed once set';
  end if;

  -- saved_plan_id may go from a value to NULL (the customer deleted the saved plan -> FK ON DELETE SET
  -- NULL) but can never be re-pointed at a different plan.
  if old.saved_plan_id is not null and new.saved_plan_id is not null and new.saved_plan_id is distinct from old.saved_plan_id then
    raise exception 'personalized_plan_requests: saved_plan_id cannot be re-pointed';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists personalized_plan_requests_guard on public.personalized_plan_requests;
create trigger personalized_plan_requests_guard
before update on public.personalized_plan_requests
for each row
execute function public.personalized_plan_requests_guard();

-- ── Row Level Security + privileges ──────────────────────────────────────────────────────────────
alter table public.personalized_plan_requests enable row level security;

-- Supabase grants new public tables to anon/authenticated by default; remove that and add back READ only.
revoke all on table public.personalized_plan_requests from public;
revoke all on table public.personalized_plan_requests from anon;
revoke all on table public.personalized_plan_requests from authenticated;
grant select on table public.personalized_plan_requests to authenticated;

drop policy if exists "Users can view their own personalized plan requests" on public.personalized_plan_requests;
create policy "Users can view their own personalized plan requests"
on public.personalized_plan_requests
for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = personalized_plan_requests.order_id and o.user_id = auth.uid()
  )
);

-- ── One saved plan per request, enforced by the database ──────────────────────────────────────────
-- The generator stamps the request id into the saved plan's preferences_json. Two saved plans can then
-- never share one request, even if application code is buggy or two generations race.
create unique index if not exists smart_planner_saved_plans_personalized_request_key
  on public.smart_planner_saved_plans ((preferences_json ->> 'personalizedPlanRequestId'))
  where preferences_json ? 'personalizedPlanRequestId';

-- ── create_personalized_plan_order: order + request in ONE transaction ───────────────────────────
-- Same inputs as create_pending_order (logged-in: p_user_id; guest: p_user_id NULL + token hash). The
-- price still comes only from public.products via create_pending_order. There is deliberately NO
-- "already owned" check here: a customer may buy this product again for another trip. If anything
-- fails, the order insert rolls back with the request, so there is never an order without answers.
create or replace function public.create_personalized_plan_order(
  p_user_id uuid,
  p_destination_id text,
  p_answers jsonb,
  p_claim_token_hash text default null,
  p_guest_email text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if p_destination_id is null or p_destination_id !~ '^[a-z][a-z0-9-]{1,39}$' then
    raise exception 'create_personalized_plan_order: invalid destination';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'create_personalized_plan_order: answers must be a JSON object';
  end if;

  v_order := public.create_pending_order(
    p_user_id,
    array['travel-smarter-personalized-plan'],
    p_claim_token_hash,
    p_guest_email
  );

  insert into public.personalized_plan_requests (order_id, destination_id, answers)
  values (v_order.id, p_destination_id, p_answers);

  return v_order;
end;
$$;

revoke all on function public.create_personalized_plan_order(uuid, text, jsonb, text, text) from public;
revoke all on function public.create_personalized_plan_order(uuid, text, jsonb, text, text) from anon;
revoke all on function public.create_personalized_plan_order(uuid, text, jsonb, text, text) from authenticated;
grant execute on function public.create_personalized_plan_order(uuid, text, jsonb, text, text) to service_role;

-- ── begin_personalized_plan_generation: the ONLY gate in front of generation ──────────────────────
-- Returns one row. state is one of:
--   'granted'           the caller owns the request, its order is PAID, it has not generated yet, and
--                       it now holds the generation lease -- the stored destination/answers are returned
--   'already_generated' this request already produced its one plan
--   'in_progress'       another generation currently holds the lease (leases expire after 3 minutes)
--   'not_paid'          owned by the caller but the order is not paid (pending/failed/cancelled/refunded)
--   'invalid'           unknown request, or not owned by the caller (indistinguishable on purpose)
-- The row is locked FOR UPDATE, so two concurrent calls are serialized and only one can be 'granted'.
create or replace function public.begin_personalized_plan_generation(p_request_id uuid, p_user_id uuid)
returns table (state text, request_destination text, request_answers jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.personalized_plan_requests;
  v_status text;
begin
  if p_request_id is null or p_user_id is null then
    return query select 'invalid'::text, null::text, null::jsonb;
    return;
  end if;

  select r.*
    into v_req
  from public.personalized_plan_requests r
  join public.orders o on o.id = r.order_id
  where r.id = p_request_id and o.user_id = p_user_id
  for update of r;

  if not found then
    return query select 'invalid'::text, null::text, null::jsonb;
    return;
  end if;

  select o.status into v_status from public.orders o where o.id = v_req.order_id;

  if v_status <> 'paid' then
    return query select 'not_paid'::text, null::text, null::jsonb;
    return;
  end if;

  if v_req.generated_at is not null then
    return query select 'already_generated'::text, null::text, null::jsonb;
    return;
  end if;

  if v_req.generating_started_at is not null and v_req.generating_started_at > now() - interval '3 minutes' then
    return query select 'in_progress'::text, null::text, null::jsonb;
    return;
  end if;

  update public.personalized_plan_requests r set generating_started_at = now() where r.id = v_req.id;

  return query select 'granted'::text, v_req.destination_id, v_req.answers;
end;
$$;

revoke all on function public.begin_personalized_plan_generation(uuid, uuid) from public;
revoke all on function public.begin_personalized_plan_generation(uuid, uuid) from anon;
revoke all on function public.begin_personalized_plan_generation(uuid, uuid) from authenticated;
grant execute on function public.begin_personalized_plan_generation(uuid, uuid) to service_role;

-- ── complete_personalized_plan_generation: marks the request fulfilled, exactly once ──────────────
-- One conditional UPDATE: it only succeeds while generated_at is still NULL, the lease is held, the order
-- is paid and owned by p_user_id, and the saved plan really belongs to that same user. Returns true for
-- the one call that wins, false for any other.
create or replace function public.complete_personalized_plan_generation(p_request_id uuid, p_user_id uuid, p_saved_plan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.personalized_plan_requests r
  set generated_at = now(),
      saved_plan_id = p_saved_plan_id,
      generating_started_at = null
  from public.orders o
  where r.id = p_request_id
    and o.id = r.order_id
    and o.user_id = p_user_id
    and o.status = 'paid'
    and r.generated_at is null
    and r.generating_started_at is not null
    and exists (select 1 from public.smart_planner_saved_plans s where s.id = p_saved_plan_id and s.user_id = p_user_id);

  return found;
end;
$$;

revoke all on function public.complete_personalized_plan_generation(uuid, uuid, uuid) from public;
revoke all on function public.complete_personalized_plan_generation(uuid, uuid, uuid) from anon;
revoke all on function public.complete_personalized_plan_generation(uuid, uuid, uuid) from authenticated;
grant execute on function public.complete_personalized_plan_generation(uuid, uuid, uuid) to service_role;

-- ── A plan generated from a paid request can't be deleted (or edited) by the customer ───────────────
-- The saved plan IS the product of that purchase. Hiding the Delete button is not enough (the browser can call the
-- API directly), so the database refuses: the customer-facing DELETE policy now excludes any saved plan that is
-- stamped with a personalizedPlanRequestId, and UPDATE is revoked so the stamp can't be edited away first.
-- Legacy/manual saved plans (no stamp) keep their existing delete behaviour. Cascades (e.g. deleting an auth user)
-- are unaffected -- foreign-key actions don't go through row level security -- and support/service_role can still
-- remove a row deliberately. Deleting a plan never re-opens its request either way (generated_at is kept).
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'smart_planner_saved_plans' and cmd = 'DELETE'
  loop
    execute format('drop policy %I on public.smart_planner_saved_plans', p.policyname);
  end loop;
end
$$;

create policy "Users can delete their own saved plans"
on public.smart_planner_saved_plans
for delete
to authenticated
using (user_id = auth.uid() and not (preferences_json ? 'personalizedPlanRequestId'));

-- No code path ever updated this table (see its own migration), so closing UPDATE costs nothing.
revoke update on table public.smart_planner_saved_plans from anon;
revoke update on table public.smart_planner_saved_plans from authenticated;

notify pgrst, 'reload schema';

-- ── Support notes (run manually in the SQL editor, never from the app) ───────────────────────────────
-- Unpaid, abandoned requests older than 30 days can be removed (their pending orders stay as history):
--   delete from public.personalized_plan_requests r using public.orders o
--   where o.id = r.order_id and o.status = 'pending' and r.created_at < now() - interval '30 days';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20261016120000_complimentary_personalized_plan_requests.sql
-- ════════════════════════════════════════════════════════════════════════
-- Complimentary (demo) Personalized Plan requests.
--
-- WHY: the account owner needs to record product demos of the real questionnaire -> generated plan flow without paying
-- 59 ILS each time. A complimentary plan must go through the SAME request -> generate -> save machinery as a purchased
-- one, but it must never pretend a payment happened: no `orders` row, no `order_items`, no entitlement, nothing that any
-- revenue or payment report could count.
--
-- HOW (smallest change): a request may now belong either to a paid ORDER (source = 'purchase', exactly as before) or
-- directly to ONE USER (source = 'complimentary', no order at all). The allowlist of who may create complimentary
-- requests lives ONLY in a server-side environment variable (COMPLIMENTARY_USER_IDS) and is checked by the Next.js
-- server using the verified session user; this migration contains no user id, no email and no allowlist. Creating a
-- complimentary request is possible only through a service_role-only function, like every other write in this feature.
--
-- Additive / relaxing only:
--   * existing rows are untouched (they all become source = 'purchase', which is the default);
--   * order_id loses NOT NULL (a purchase row still requires it, enforced by a CHECK);
--   * two new columns; one CHECK; the immutability trigger now also protects the two new columns;
--   * the SELECT policy gains one OR branch (a customer may also read their own complimentary requests);
--   * begin/complete_personalized_plan_generation are replaced with the SAME signatures and return types so that the
--     purchase path behaves identically and the complimentary path is authorized by complimentary_user_id instead of
--     a paid order. All of their one-request-one-plan guarantees (lease, once-only completion, saved-plan unique
--     index) are unchanged and apply to both sources.
-- No existing function other than those two is touched (create_pending_order, claim_guest_order, create_personalized_
-- plan_order are NOT modified); RLS on every other table is unchanged; nothing is dropped or deleted.
--
-- Deploy order: apply this migration BEFORE the code that uses it (the currently deployed code keeps working
-- against it: it only ever creates purchase requests).

-- ── 1. schema ────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.personalized_plan_requests
  alter column order_id drop not null;

alter table public.personalized_plan_requests
  add column if not exists source text not null default 'purchase',
  add column if not exists complimentary_user_id uuid references auth.users (id) on delete cascade;

alter table public.personalized_plan_requests
  drop constraint if exists personalized_plan_requests_source_chk;
alter table public.personalized_plan_requests
  add constraint personalized_plan_requests_source_chk check (source in ('purchase', 'complimentary'));

-- A request belongs to exactly one thing: a paid order (purchase) XOR one user (complimentary).
alter table public.personalized_plan_requests
  drop constraint if exists personalized_plan_requests_origin_chk;
alter table public.personalized_plan_requests
  add constraint personalized_plan_requests_origin_chk check (
    (source = 'purchase' and order_id is not null and complimentary_user_id is null)
    or (source = 'complimentary' and order_id is null and complimentary_user_id is not null)
  );

create index if not exists personalized_plan_requests_complimentary_user_idx
  on public.personalized_plan_requests (complimentary_user_id)
  where complimentary_user_id is not null;

-- ── 2. immutability now also covers the origin of the request ───────────────────────────────────────────────
create or replace function public.personalized_plan_requests_guard()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.order_id is distinct from old.order_id
     or new.source is distinct from old.source
     or new.complimentary_user_id is distinct from old.complimentary_user_id
     or new.destination_id is distinct from old.destination_id
     or new.answers is distinct from old.answers
     or new.answers_version is distinct from old.answers_version
     or new.created_at is distinct from old.created_at then
    raise exception 'personalized_plan_requests: the submitted answers and the order link are immutable';
  end if;

  if old.generated_at is not null and new.generated_at is distinct from old.generated_at then
    raise exception 'personalized_plan_requests: generated_at cannot be changed once set';
  end if;

  if old.saved_plan_id is not null and new.saved_plan_id is not null and new.saved_plan_id is distinct from old.saved_plan_id then
    raise exception 'personalized_plan_requests: saved_plan_id cannot be re-pointed';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- ── 3. row level security: a customer may also read THEIR OWN complimentary requests ───────────────────────────
drop policy if exists "Users can view their own personalized plan requests" on public.personalized_plan_requests;
create policy "Users can view their own personalized plan requests"
on public.personalized_plan_requests
for select
to authenticated
using (
  complimentary_user_id = auth.uid()
  or exists (
    select 1 from public.orders o
    where o.id = personalized_plan_requests.order_id and o.user_id = auth.uid()
  )
);

-- ── 4. create_complimentary_personalized_plan_request: the ONLY way to make one ──────────────────────────────
-- service_role only. The caller (Next.js server) has ALREADY verified the session user and checked that user against
-- the server-side COMPLIMENTARY_USER_IDS allowlist; this function trusts neither a browser nor a role, and writes no
-- order / order_item / entitlement. It never grants anything: generation is still authorized per request below.
create or replace function public.create_complimentary_personalized_plan_request(
  p_user_id uuid,
  p_destination_id text,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    raise exception 'create_complimentary_personalized_plan_request: a user is required';
  end if;

  if p_destination_id is null or p_destination_id !~ '^[a-z][a-z0-9-]{1,39}$' then
    raise exception 'create_complimentary_personalized_plan_request: invalid destination';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'create_complimentary_personalized_plan_request: answers must be a JSON object';
  end if;

  insert into public.personalized_plan_requests (order_id, source, complimentary_user_id, destination_id, answers)
  values (null, 'complimentary', p_user_id, p_destination_id, p_answers)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_complimentary_personalized_plan_request(uuid, text, jsonb) from public;
revoke all on function public.create_complimentary_personalized_plan_request(uuid, text, jsonb) from anon;
revoke all on function public.create_complimentary_personalized_plan_request(uuid, text, jsonb) from authenticated;
grant execute on function public.create_complimentary_personalized_plan_request(uuid, text, jsonb) to service_role;

-- ── 5. begin_personalized_plan_generation: same contract, now for both sources ────────────────────────────────
-- Same signature and return columns as before. 'purchase': caller owns a PAID order (unchanged). 'complimentary': the
-- caller is the request's complimentary_user_id. For both: not already generated, and the 3-minute lease is free.
create or replace function public.begin_personalized_plan_generation(p_request_id uuid, p_user_id uuid)
returns table (state text, request_destination text, request_answers jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.personalized_plan_requests;
  v_status text;
begin
  if p_request_id is null or p_user_id is null then
    return query select 'invalid'::text, null::text, null::jsonb;
    return;
  end if;

  select r.*
    into v_req
  from public.personalized_plan_requests r
  left join public.orders o on o.id = r.order_id
  where r.id = p_request_id
    and (
      (r.source = 'purchase' and o.user_id = p_user_id)
      or (r.source = 'complimentary' and r.complimentary_user_id = p_user_id)
    )
  for update of r;

  if not found then
    return query select 'invalid'::text, null::text, null::jsonb;
    return;
  end if;

  if v_req.source = 'purchase' then
    select o.status into v_status from public.orders o where o.id = v_req.order_id;
    if v_status <> 'paid' then
      return query select 'not_paid'::text, null::text, null::jsonb;
      return;
    end if;
  end if;

  if v_req.generated_at is not null then
    return query select 'already_generated'::text, null::text, null::jsonb;
    return;
  end if;

  if v_req.generating_started_at is not null and v_req.generating_started_at > now() - interval '3 minutes' then
    return query select 'in_progress'::text, null::text, null::jsonb;
    return;
  end if;

  update public.personalized_plan_requests r set generating_started_at = now() where r.id = v_req.id;

  return query select 'granted'::text, v_req.destination_id, v_req.answers;
end;
$$;

-- ── 6. complete_personalized_plan_generation: same contract, now for both sources ─────────────────────────────
create or replace function public.complete_personalized_plan_generation(p_request_id uuid, p_user_id uuid, p_saved_plan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.personalized_plan_requests r
  set generated_at = now(),
      saved_plan_id = p_saved_plan_id,
      generating_started_at = null
  where r.id = p_request_id
    and r.generated_at is null
    and r.generating_started_at is not null
    and exists (select 1 from public.smart_planner_saved_plans s where s.id = p_saved_plan_id and s.user_id = p_user_id)
    and (
      (r.source = 'complimentary' and r.complimentary_user_id = p_user_id)
      or (
        r.source = 'purchase'
        and exists (select 1 from public.orders o where o.id = r.order_id and o.user_id = p_user_id and o.status = 'paid')
      )
    );

  return found;
end;
$$;

-- CREATE OR REPLACE keeps the existing owner and grants, but state them again so this file is self-describing.
revoke all on function public.begin_personalized_plan_generation(uuid, uuid) from public;
revoke all on function public.begin_personalized_plan_generation(uuid, uuid) from anon;
revoke all on function public.begin_personalized_plan_generation(uuid, uuid) from authenticated;
grant execute on function public.begin_personalized_plan_generation(uuid, uuid) to service_role;
revoke all on function public.complete_personalized_plan_generation(uuid, uuid, uuid) from public;
revoke all on function public.complete_personalized_plan_generation(uuid, uuid, uuid) from anon;
revoke all on function public.complete_personalized_plan_generation(uuid, uuid, uuid) from authenticated;
grant execute on function public.complete_personalized_plan_generation(uuid, uuid, uuid) to service_role;

notify pgrst, 'reload schema';

-- ── Reporting note ────────────────────────────────────────────────────────────────────────────────────────
-- Complimentary requests are the rows with source = 'complimentary'. They have NO order, so they can never appear in any
-- query over public.orders / order_items / user_entitlements (revenue, payments, receipts). To list them:
--   select id, complimentary_user_id, destination_id, created_at, generated_at from public.personalized_plan_requests
--   where source = 'complimentary' order by created_at desc;

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20261016130000_launch_prices.sql
-- ════════════════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20261017120000_saved_plan_archive.sql
-- ════════════════════════════════════════════════════════════════════════
-- Archive ("Remove") for My Plans: hides a saved plan from its owner's default list WITHOUT deleting anything.
--
-- A plan generated from a paid personalized request is the product of that purchase, so it must never be hard-deleted
-- by the customer (the DELETE policy already forbids it). "Remove" therefore only stamps archived_at:
--   * the saved plan row, its request, the order, the payment linkage and the entitlements are all left exactly as they are;
--   * one request still owns exactly one plan (the unique index is untouched, and a plan that is merely archived still exists);
--   * the owner can restore it (archived_at back to NULL).
--
-- Authorization is server-side only. Customers still have no UPDATE privilege on this table (revoked in
-- 20261014120000), so they cannot write archived_at directly. The only way to change it is this function, which is executable
-- by service_role alone and is called by a Server Action AFTER the user id was read from the verified session. The function
-- changes ONE column and only for a row owned by the given user, so it cannot touch another user's plan or any plan content.
--
-- Additive and idempotent: `if not exists` / `create or replace`. Nothing existing is altered or dropped.

alter table public.smart_planner_saved_plans
  add column if not exists archived_at timestamptz;

comment on column public.smart_planner_saved_plans.archived_at is
  'Set when the owner removed the plan from My Plans. NULL = visible. The plan, its request, order and entitlements are never deleted by this.';

create or replace function public.set_saved_plan_archived(p_plan_id uuid, p_user_id uuid, p_archived boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if p_plan_id is null or p_user_id is null or p_archived is null then
    return false;
  end if;

  update public.smart_planner_saved_plans
  set archived_at = case when p_archived then coalesce(archived_at, now()) else null end
  where id = p_plan_id
    and user_id = p_user_id;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

revoke all on function public.set_saved_plan_archived(uuid, uuid, boolean) from public;
revoke all on function public.set_saved_plan_archived(uuid, uuid, boolean) from anon;
revoke all on function public.set_saved_plan_archived(uuid, uuid, boolean) from authenticated;
grant execute on function public.set_saved_plan_archived(uuid, uuid, boolean) to service_role;

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20261018120000_personalized_planner_ownership.sql
-- ════════════════════════════════════════════════════════════════════════
-- Personalized Plan = an UNLOCK, not a single-use generation credit.
--
-- New model: a customer who owns the Personalized Plan product may create, change and delete their personalized plans as often as they
-- like, with no further payment. Ownership is the authorization -- no fake orders, no zero-value payments, no per-plan purchases.
--
-- WHAT THIS MIGRATION CHANGES -- and what it deliberately does not
--   * NOTHING existing is dropped, altered or rewritten: orders, order_items, user_entitlements, personalized_plan_requests, the
--     one-request-one-plan guard (lease / once-only completion / saved_plan unique index), RLS policies and grants all stay exactly as they are.
--     The one-request-one-plan rules keep protecting the PURCHASE-TIME request ("build the plan from the answers I typed before paying");
--     they simply stop being the gate for the product, because plans made by an owner are not tied to a request at all.
--   * It ADDS five service_role-only functions and one small lease table:
--       user_owns_personalized_plan(user)             -> the single ownership test
--       begin_owner_plan_generation(user, replace_id) -> authorizes ONE free generation (ownership + plan cap + one-at-a-time lease)
--       end_owner_plan_generation(user)               -> releases that lease
--       replace_owned_plan_content(plan, user, ...)   -> "Edit plan": rewrites an owner's plan IN PLACE (keeps its identity)
--       delete_saved_plan(plan, user)                 -> permanent delete of ONE of the caller's own saved plans
--   * It clears archived_at on every plan (the archive / "Removed plans" feature is retired, and a plan hidden by it would otherwise stay
--     invisible). The archived_at column and set_saved_plan_archived() are left in place, unused, so the version of the site that is live
--     while this runs keeps working; they can be dropped in a later migration.
--
-- HOW EXISTING CUSTOMERS QUALIFY (nobody buys again)
--   Ownership = an active user_entitlements row for 'travel-smarter-personalized-plan' (granted by the verified Allpay webhook or the guest
--   claim, under EVERY earlier model) OR a PAID order they own that contains the product. The second clause means even a historical purchase
--   whose entitlement row were somehow missing still qualifies. Unpaid / pending orders never do.
--
-- HOW OWNERSHIP AUTHORIZES FUTURE GENERATIONS (and how abuse is prevented)
--   * The user id comes ONLY from the verified session (Server Action); these functions are executable by service_role only -- anon and
--     authenticated (the browser) get "permission denied", and customers still have no INSERT/UPDATE/DELETE route around them for paid plans.
--   * A non-owner gets 'denied' from begin_owner_plan_generation: no plan is generated.
--   * One generation at a time per customer (a 3-minute lease that a crash cannot hold forever), and at most 30 saved plans per customer,
--     so a script cannot hammer the plan engine or fill the table.
--   * Editing or deleting touches only a row whose user_id equals the verified user; another customer's plan id simply reports false.
--
-- HOW DELETION WORKS
--   delete_saved_plan removes the saved plan row only. personalized_plan_requests.saved_plan_id is ON DELETE SET NULL, so the historical
--   request keeps generated_at (it can never be rebuilt, exactly as before), and the order, payment, entitlements and revenue are untouched.
--   Ownership therefore survives deleting every plan. Customers still cannot delete a purchase-linked plan through the public API (the
--   existing RLS policy is unchanged); only this ownership-checked function can.
--
-- Additive and idempotent: `if not exists` / `create or replace` / a data-only UPDATE that matches nothing the second time.

-- ── retire the archive: nothing may stay hidden ────────────────────────────────────────────────────────────────
update public.smart_planner_saved_plans set archived_at = null where archived_at is not null;

-- ── ownership ──────────────────────────────────────────────────────────────────────────────────────────────────
create or replace function public.user_owns_personalized_plan(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null
    and (
      exists (
        select 1
        from public.user_entitlements ue
        join public.products p on p.id = ue.product_id
        where ue.user_id = p_user_id
          and p.slug = 'travel-smarter-personalized-plan'
          and p.active
      )
      or exists (
        select 1
        from public.orders o
        join public.order_items oi on oi.order_id = o.id
        join public.products p on p.id = oi.product_id
        where o.user_id = p_user_id
          and o.status = 'paid'
          and p.slug = 'travel-smarter-personalized-plan'
      )
    );
$$;

-- ── one free generation at a time, only for owners ─────────────────────────────────────────────────────────────
create table if not exists public.personalized_plan_generation_leases (
  user_id uuid primary key references auth.users (id) on delete cascade,
  started_at timestamptz not null default now()
);

alter table public.personalized_plan_generation_leases enable row level security;
revoke all on table public.personalized_plan_generation_leases from public;
revoke all on table public.personalized_plan_generation_leases from anon;
revoke all on table public.personalized_plan_generation_leases from authenticated;

-- Returns: 'granted' | 'denied' (not an owner) | 'not_found' (replace target is not the caller's) | 'limit' | 'in_progress'
create or replace function public.begin_owner_plan_generation(p_user_id uuid, p_replace_plan_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_changed integer;
begin
  if p_user_id is null or not public.user_owns_personalized_plan(p_user_id) then
    return 'denied';
  end if;

  if p_replace_plan_id is not null then
    if not exists (
      select 1 from public.smart_planner_saved_plans
      where id = p_replace_plan_id and user_id = p_user_id and product_slug = 'barcelona-smart-planner-v2'
    ) then
      return 'not_found';
    end if;
  else
    select count(*) into v_count
    from public.smart_planner_saved_plans
    where user_id = p_user_id and product_slug = 'barcelona-smart-planner-v2';
    if v_count >= 30 then
      return 'limit';
    end if;
  end if;

  -- One at a time: take the lease unless a live one exists (older than 3 minutes counts as abandoned).
  insert into public.personalized_plan_generation_leases as l (user_id, started_at)
  values (p_user_id, now())
  on conflict (user_id) do update set started_at = excluded.started_at
  where l.started_at < now() - interval '3 minutes';
  get diagnostics v_changed = row_count;
  if v_changed = 0 then
    return 'in_progress';
  end if;

  return 'granted';
end;
$$;

create or replace function public.end_owner_plan_generation(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.personalized_plan_generation_leases where user_id = p_user_id;
$$;

-- ── "Edit plan": rewrite an owner's plan in place ──────────────────────────────────────────────────────────────
-- Replaces the plan's preferences and generated content for a row owned by p_user_id. The plan keeps its id, owner and created_at, and keeps
-- whichever identity marker it already has (personalizedPlanRequestId for a plan built from a paid request, planGeneration for one an owner
-- created); a plan with neither gets a planGeneration so the table's identical-preferences unique rule can never collide with another plan.
create or replace function public.replace_owned_plan_content(p_plan_id uuid, p_user_id uuid, p_preferences jsonb, p_generated jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_keep jsonb;
begin
  if p_plan_id is null or p_user_id is null or p_preferences is null or p_generated is null
     or jsonb_typeof(p_preferences) <> 'object' or jsonb_typeof(p_generated) <> 'object' then
    return false;
  end if;

  select preferences_json into v_old
  from public.smart_planner_saved_plans
  where id = p_plan_id and user_id = p_user_id and product_slug = 'barcelona-smart-planner-v2'
  for update;

  if not found then
    return false;
  end if;

  v_keep := jsonb_strip_nulls(jsonb_build_object(
    'personalizedPlanRequestId', v_old -> 'personalizedPlanRequestId',
    'planGeneration', v_old -> 'planGeneration'
  ));
  if v_keep = '{}'::jsonb then
    v_keep := jsonb_build_object('planGeneration', gen_random_uuid()::text);
  end if;

  update public.smart_planner_saved_plans
  set preferences_json = (p_preferences - 'personalizedPlanRequestId' - 'planGeneration') || v_keep,
      generated_plan_json = p_generated
  where id = p_plan_id and user_id = p_user_id;

  return true;
end;
$$;

-- ── permanent delete of ONE of the caller's own saved plans ────────────────────────────────────────────────────
create or replace function public.delete_saved_plan(p_plan_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_plan_id is null or p_user_id is null then
    return false;
  end if;

  delete from public.smart_planner_saved_plans
  where id = p_plan_id and user_id = p_user_id;

  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

-- ── privileges: the server only ────────────────────────────────────────────────────────────────────────────────
revoke all on function public.user_owns_personalized_plan(uuid) from public;
revoke all on function public.user_owns_personalized_plan(uuid) from anon;
revoke all on function public.user_owns_personalized_plan(uuid) from authenticated;
grant execute on function public.user_owns_personalized_plan(uuid) to service_role;

revoke all on function public.begin_owner_plan_generation(uuid, uuid) from public;
revoke all on function public.begin_owner_plan_generation(uuid, uuid) from anon;
revoke all on function public.begin_owner_plan_generation(uuid, uuid) from authenticated;
grant execute on function public.begin_owner_plan_generation(uuid, uuid) to service_role;

revoke all on function public.end_owner_plan_generation(uuid) from public;
revoke all on function public.end_owner_plan_generation(uuid) from anon;
revoke all on function public.end_owner_plan_generation(uuid) from authenticated;
grant execute on function public.end_owner_plan_generation(uuid) to service_role;

revoke all on function public.replace_owned_plan_content(uuid, uuid, jsonb, jsonb) from public;
revoke all on function public.replace_owned_plan_content(uuid, uuid, jsonb, jsonb) from anon;
revoke all on function public.replace_owned_plan_content(uuid, uuid, jsonb, jsonb) from authenticated;
grant execute on function public.replace_owned_plan_content(uuid, uuid, jsonb, jsonb) to service_role;

revoke all on function public.delete_saved_plan(uuid, uuid) from public;
revoke all on function public.delete_saved_plan(uuid, uuid) from anon;
revoke all on function public.delete_saved_plan(uuid, uuid) from authenticated;
grant execute on function public.delete_saved_plan(uuid, uuid) to service_role;

notify pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════
-- migration: 20261101000000_order_attribution_and_sales_reporting.sql
-- ════════════════════════════════════════════════════════════════════════
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

-- Sales by product. Revenue is the sum of the price snapshots on the order lines, so product revenues add up to order revenue.
-- A multi-product order appears once in each of its products' rows. Orders are counted DISTINCTLY: even if an order ever held several
-- lines for the same product (order_items is unique per (order, product) today), it still counts as one order, while every line's price is
-- still added to the revenue.
create or replace view reporting.sales_by_product with (security_invoker = true) as
select p.slug as product, p.name,
       count(distinct r.order_id) filter (where r.checkout_started)                  as checkouts_started,
       count(distinct r.order_id) filter (where r.is_paid)                           as paid_orders,
       coalesce(sum(i.price_ils_at_purchase) filter (where r.is_paid), 0) as revenue_ils,
       round(100.0 * count(distinct r.order_id) filter (where r.is_paid and r.checkout_started)
             / nullif(count(distinct r.order_id) filter (where r.checkout_started), 0), 1) as checkout_to_paid_pct
from reporting.real_orders r
join public.order_items i on i.order_id = r.order_id
join public.products p on p.id = i.product_id
group by p.slug, p.name
order by revenue_ils desc, checkouts_started desc;

-- Sales by product AND campaign.
create or replace view reporting.sales_by_product_campaign with (security_invoker = true) as
select r.channel, coalesce(r.campaign, '(none)') as campaign, p.slug as product,
       count(distinct r.order_id) filter (where r.checkout_started)                  as checkouts_started,
       count(distinct r.order_id) filter (where r.is_paid)                           as paid_orders,
       coalesce(sum(i.price_ils_at_purchase) filter (where r.is_paid), 0) as revenue_ils
from reporting.real_orders r
join public.order_items i on i.order_id = r.order_id
join public.products p on p.id = i.product_id
group by r.channel, coalesce(r.campaign, '(none)'), p.slug
order by revenue_ils desc, checkouts_started desc;

-- Belt and braces: nothing in the reporting schema is reachable by any API role, however the objects above were created.
revoke all on all tables    in schema reporting from public, anon, authenticated, service_role;
revoke all on all functions in schema reporting from public, anon, authenticated, service_role;

-- Check after the run (should list the products with their prices, the personalized plan at 39):
-- select slug, price_ils, active from public.products order by slug;

commit;

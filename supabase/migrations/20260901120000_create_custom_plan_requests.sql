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

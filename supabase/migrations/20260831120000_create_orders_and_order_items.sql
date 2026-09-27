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

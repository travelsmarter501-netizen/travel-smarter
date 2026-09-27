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

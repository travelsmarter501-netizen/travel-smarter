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

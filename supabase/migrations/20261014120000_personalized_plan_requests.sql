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

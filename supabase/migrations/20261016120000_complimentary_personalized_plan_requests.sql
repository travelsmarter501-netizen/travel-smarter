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

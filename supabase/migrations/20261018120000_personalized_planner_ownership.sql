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

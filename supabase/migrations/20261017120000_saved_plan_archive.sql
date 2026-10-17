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

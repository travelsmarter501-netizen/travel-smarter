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

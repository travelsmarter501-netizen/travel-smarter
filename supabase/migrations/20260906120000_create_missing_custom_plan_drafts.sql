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

-- Custom Plan Admin Builder V1: the itinerary-draft data model an internal admin uses to
-- review a customer's Custom Plan request and assemble/edit a deterministic day-by-day
-- itinerary for it. This is a REVIEW/AUTHORING tool only -- nothing here is ever shown to the
-- customer, emailed, exported, or linked to delivery/completion in this task. No AI, no
-- payment, no entitlement, no access-gate change.
--
-- Additive only: does not alter custom_plan_requests, orders, order_items, products,
-- user_entitlements, or any existing RLS policy/RPC/trigger function.

create table if not exists public.custom_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  -- One draft per request (a fresh "إنشاء مسودة" click on an already-drafted request reuses
  -- the existing row rather than creating a second one -- see app/lib/customPlanAdmin.ts).
  request_id uuid not null unique references public.custom_plan_requests (id) on delete cascade,
  -- Copied from custom_plan_requests.user_id at draft-creation time (the CUSTOMER who owns the
  -- underlying request, not the admin who authored the draft) -- kept as its own column so a
  -- future customer-facing read policy (not part of this task -- "Customers: NO direct access
  -- yet") can be added later without a backfill migration.
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  -- V1 status set: draft (admin still assembling/editing) -> approved (admin signed off on the
  -- itinerary content). Delivery/completion status lives on custom_plan_requests, not here, and
  -- is a later task -- approving a draft never touches custom_plan_requests.status.
  status text not null default 'draft' check (status in ('draft', 'approved')),
  -- CustomPlanDraft shape (see app/lib/customPlanDraft.ts): requestId, destination,
  -- durationDays, days[{ dayNumber, title, stops[{ placeId, title, startTime?,
  -- durationMinutes?, notes?, kind? }] }], unmatchedMustVisits[]. Stores place IDs and
  -- planning-specific fields only -- never full place metadata (name/hours/image/address),
  -- which is always re-resolved from the Barcelona Guide dataset at render time.
  plan_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_plan_drafts_request_id_idx on public.custom_plan_drafts (request_id);
create index if not exists custom_plan_drafts_user_id_idx on public.custom_plan_drafts (user_id);
create index if not exists custom_plan_drafts_status_idx on public.custom_plan_drafts (status);

-- Reuses the generic public.set_updated_at() trigger function introduced in
-- 20260901120000_create_custom_plan_requests.sql -- not redefined here.
drop trigger if exists custom_plan_drafts_set_updated_at on public.custom_plan_drafts;
create trigger custom_plan_drafts_set_updated_at
before update on public.custom_plan_drafts
for each row
execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- RLS enabled with ZERO policies -- stricter than every other table in this project (which at
-- least grants the owner SELECT). This is deliberate: admins are not modeled as a DB
-- role/policy concept in V1 (see the task's own "For V1, use a server-side admin allowlist
-- based on environment variable" instruction) -- there is no `auth.uid() = admin` condition
-- Postgres could express here. Every read AND write goes through server-only, service_role-
-- backed code (app/lib/customPlanAdmin.ts), gated by the ADMIN_EMAILS allowlist checked in
-- TypeScript (app/lib/admin.ts) BEFORE the service-role client is ever touched -- the same
-- verified-identity-then-privileged-operation trust model already used for
-- create_pending_order/create_custom_plan_request/create_custom_plan_order, just applied to
-- reads too since "admin can see other users' data" can never be expressed as a `user_id =
-- auth.uid()` policy anyway. Customers get zero access (no SELECT policy at all) -- "Customers:
-- NO direct access yet" -- and there are no INSERT/UPDATE/DELETE policies for anyone, so the
-- browser (admin or customer) can never write here directly, only through a Server Action that
-- re-checks admin authorization on every call.
alter table public.custom_plan_drafts enable row level security;

-- Create Missing Smart Planner Saved Plans Table: `public.smart_planner_saved_plans` was
-- referenced by application code (V1 and V2 Smart Planner save/reopen/account/delete flows)
-- but was NEVER actually created live -- confirmed via direct authenticated QA against the
-- real database (PGRST205 "Could not find the table ... in the schema cache" on every real
-- SELECT/INSERT, while a bare row-count HEAD request happened to succeed -- the table simply
-- does not exist; no earlier migration in this repository creates it). This migration creates
-- it, derived EXACTLY from the application code's own usage -- no invented columns.
--
-- Additive + idempotent: every statement is guarded (`if not exists` / `create or replace`)
-- so this is safe to run even if parts of it were somehow already applied. Does not touch
-- products, orders, order_items, user_entitlements, custom_plan_requests, custom_plan_drafts,
-- or any existing RLS policy/RPC/trigger on another table.
--
-- ── Schema derivation (audit) ────────────────────────────────────────────────────────────
-- Every column below is required by a real, current code path:
--   id                    -- .eq("id", id) in DeleteSavedPlanButton.tsx and both saved/[id]
--                             pages (V1 + V2); SmartPlannerSavedPlanRow.id /
--                             SmartPlannerV2SavedPlanRow.id
--   user_id               -- .eq("user_id", user.id) in app/account/page.tsx; RLS ownership
--                             for every policy below; never sent explicitly by the client
--                             INSERT (SmartPlannerApp.tsx / SmartPlannerV2App.tsx both insert
--                             without a user_id field), so it MUST default to auth.uid()
--   product_slug          -- inserted by both V1 ("barcelona-smart-planner") and V2
--                             ("barcelona-smart-planner-v2", see
--                             smartPlannerV2SavedPlans.ts's V2_SAVED_PLAN_PRODUCT_SLUG);
--                             read back in account/page.tsx's row rendering
--   destination_slug      -- inserted by both V1 and V2 as "barcelona"; read back in
--                             account/page.tsx (DESTINATION_LABELS lookup)
--   preferences_json       -- inserted by both (normalizeSmartPlannerPreferences /
--                             normalizeSmartPlannerV2Preferences); read back by both saved/[id]
--                             pages and account/page.tsx; SHAPE DIFFERS between V1
--                             (SmartPlannerSavedPreferences: tripLength/interests/mustVisit/
--                             accommodation?/primaryInterest?) and V2
--                             (SmartPlannerV2SavedPreferences: plannerVersion/destinationId/
--                             dateMode/durationDays?/arrivalDate?/departureDate?/interests/
--                             accommodation) -- jsonb, no shape-specific CHECK, exactly as the
--                             task requires
--   generated_plan_json    -- inserted by both (V1: { smartPlan, presentedPlan }; V2: { plan:
--                             V2Plan }); read back by both saved/[id] pages to render the
--                             FROZEN plan with no regeneration -- jsonb, no shape-specific CHECK
--   created_at             -- .order("created_at", { ascending: false }) in account/page.tsx;
--                             never sent by the client, must default to now()
--   updated_at             -- both SmartPlannerSavedPlanRow/SmartPlannerV2SavedPlanRow type
--                             this field; no code path currently calls .update() on this table,
--                             but the column itself is part of the already-established row
--                             shape both TS types expect, so it's kept (cheap, harmless) even
--                             though the UPDATE RLS policy/grant below is deliberately omitted
--                             (see the RLS section)
--
-- No other column is referenced anywhere in the codebase -- none invented.

create table if not exists public.smart_planner_saved_plans (
  id uuid primary key default gen_random_uuid(),
  -- Never sent explicitly by either client insert call (see audit above) -- must default to
  -- the requesting user's own id. RLS WITH CHECK below independently re-verifies this on every
  -- insert regardless, matching the same defense-in-depth pattern used by every other
  -- user-owned table in this project (custom_plan_requests, orders).
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_slug text not null,
  destination_slug text not null,
  -- V1 shape (SmartPlannerSavedPreferences) and V2 shape (SmartPlannerV2SavedPreferences) are
  -- genuinely different JSON shapes stored in the SAME column, by product design (see
  -- smartPlannerV2SavedPlans.ts's own header comment) -- deliberately NOT constrained by a
  -- database-level CHECK, so neither version's shape can ever be rejected by the other's rules.
  -- Version-specific validation stays in application code (preferences_json.plannerVersion for
  -- V2; its absence for V1).
  preferences_json jsonb not null,
  -- { smartPlan, presentedPlan } for V1, or { plan } for V2 -- the exact generated output at
  -- save time, so a saved plan always redisplays byte-for-byte with no regeneration, even if
  -- planner/transport/presentation logic changes later. Never duplicates guide place content
  -- for V1 (resolved live by placeId on reopen); V2's plan is already fully resolved at
  -- generation time by design (see barcelonaV2Resolve.ts), so this legitimately IS the final
  -- render-ready V2 shape -- both are correct for their own architecture.
  generated_plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Duplicate-save guard: re-saving the EXACT SAME (user, product, destination, normalized
  -- preferences) combination is a duplicate -- both SmartPlannerApp.tsx and
  -- SmartPlannerV2App.tsx catch Postgres error code 23505 from this exact constraint and show
  -- "duplicate" status (see normalizeSmartPlannerPreferences / normalizeSmartPlannerV2Preferences,
  -- whose entire purpose is making this constraint reliable: sorted arrays, trimmed text,
  -- omitted-not-null optional keys, so two logically-identical requests always normalize to
  -- byte-identical JSON and never miss each other). A genuinely different choice (different
  -- days, interests, dates, accommodation, or a different planner version's product_slug) always
  -- produces different preferences_json and is NEVER blocked -- this is not a "one saved plan
  -- per user" limit, only a "don't silently duplicate the identical request" guard.
  unique (user_id, product_slug, destination_slug, preferences_json)
);

-- Matches the account page's exact query pattern (WHERE user_id = ? ORDER BY created_at DESC)
-- as one composite index, rather than two separate single-column indexes -- avoids over-
-- indexing while still covering both real query needs (owner-scoped RLS lookups AND the
-- account page's own explicit .eq("user_id", ...).order("created_at", ...) call). No
-- product_slug index: nothing in the codebase filters by it alone (only ever read back on an
-- already-id-scoped or already-user_id-scoped row).
create index if not exists smart_planner_saved_plans_user_id_created_at_idx
  on public.smart_planner_saved_plans (user_id, created_at desc);

-- Reuses the existing generic trigger function (introduced in
-- 20260901120000_create_custom_plan_requests.sql, already live) rather than defining a
-- near-duplicate -- no code path currently UPDATEs this table, but the column/trigger stay
-- consistent with both TS row types and cost nothing to keep.
drop trigger if exists smart_planner_saved_plans_set_updated_at on public.smart_planner_saved_plans;
create trigger smart_planner_saved_plans_set_updated_at
before update on public.smart_planner_saved_plans
for each row
execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
-- With RLS enabled and no policy for a given command, that command is denied by default for
-- `anon`/`authenticated` -- anon gets ZERO policies below, so it has no access at all (not
-- even SELECT), matching every other user-owned table in this project. Every policy is scoped
-- to `user_id = auth.uid()`, read from the request's verified session JWT, never from
-- client-supplied input -- a user can only ever read/create/delete their own rows, and
-- guessing another user's row id returns nothing (not an error), never that user's plan.
--
-- No UPDATE policy: audited every real caller (SmartPlannerApp.tsx, SmartPlannerV2App.tsx,
-- account/page.tsx, DeleteSavedPlanButton.tsx, both saved/[id] pages) -- none ever calls
-- .update() on this table. Per this task's own "grant only what's genuinely used" / "do not
-- over-constrain" instructions, no UPDATE policy or grant is created; the updated_at column
-- and trigger still exist for future use and TS-type consistency, they're just never reachable
-- from the client today.

alter table public.smart_planner_saved_plans enable row level security;

create policy "Users can view their own saved plans"
on public.smart_planner_saved_plans
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their own saved plans"
on public.smart_planner_saved_plans
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete their own saved plans"
on public.smart_planner_saved_plans
for delete
to authenticated
using (user_id = auth.uid());

-- ── Grants ────────────────────────────────────────────────────────────────────────────────
-- No other table in this project has explicit table-level GRANTs (every other migration
-- relies on Supabase's own default-privilege bootstrapping for anon/authenticated/service_role
-- on tables in `public`, with RLS as the real gate) -- these are added here explicitly anyway,
-- defensively, per this task's own instruction, and because the exact failure that motivated
-- this migration (a table PostgREST could not see/use) makes an unambiguous, explicit grant
-- section worth the extra clarity even though it's likely redundant with the project's
-- existing defaults. Only the operations real code paths actually use are granted to
-- `authenticated` (select/insert/delete -- no update, see the RLS section above); anon gets
-- nothing at all.
grant select, insert, delete on public.smart_planner_saved_plans to authenticated;
grant select, insert, update, delete on public.smart_planner_saved_plans to service_role;

-- Forces PostgREST to pick up this new table immediately rather than waiting for its own
-- periodic/DDL-triggered refresh -- directly closes the exact gap ("table exists in Postgres,
-- but PostgREST's schema cache doesn't know about it yet") this whole task exists to fix.
notify pgrst, 'reload schema';

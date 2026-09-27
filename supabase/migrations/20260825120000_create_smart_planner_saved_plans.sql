-- Smart Planner Commercialization Phase 1: product row + saved-plan persistence.
-- Reuses the existing products/user_entitlements architecture (see
-- 20260818120000_create_products_and_entitlements.sql) unchanged -- no payment provider
-- is connected here. Once a future payment flow inserts a matching
-- user_entitlements(user_id, product_id) row for this product, hasProductAccess(
-- "barcelona-smart-planner", userId) starts returning true with no further schema changes.

insert into public.products (slug, name, price_ils, active)
values ('barcelona-smart-planner', 'Barcelona Smart Planner', 59, true)
on conflict (slug) do nothing;

create table if not exists public.smart_planner_saved_plans (
  id uuid primary key default gen_random_uuid(),
  -- Defaults to the requesting user's own id (never a client-supplied value) -- the RLS
  -- WITH CHECK clauses below independently re-verify this on every insert/update regardless.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_slug text not null default 'barcelona-smart-planner',
  destination_slug text not null default 'barcelona',
  -- SmartPlannerSavedPreferences: { tripLength, interests: PlannerInterest[], mustVisit: string[] }.
  -- Stable interest keys / guide placeIds only, sorted at save time (see
  -- normalizeSmartPlannerPreferences in app/lib/planner/smartPlannerSavedPlans.ts) so the
  -- unique constraint below reliably catches re-saving the same preference set.
  preferences_json jsonb not null,
  -- { smartPlan: SmartPlannerPlan, presentedPlan: PresentedPlannerPlan } -- the exact generated
  -- output (day stop ids/order, transport leg data, presentation copy) at save time, so a saved
  -- plan always redisplays byte-for-byte even if planner/transport/presentation logic changes
  -- later. Never duplicates guide place content (images/hours/ratings/addresses) -- those
  -- continue to resolve live from guide data by placeId when the saved plan is reopened.
  generated_plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Best-effort duplicate guard: generation is deterministic, so re-saving the exact same
  -- preference set for the same user/product/destination would just clutter the list with an
  -- identical row. Deleting the existing row frees this up to be saved again.
  unique (user_id, product_slug, destination_slug, preferences_json)
);

create index if not exists smart_planner_saved_plans_user_id_idx on public.smart_planner_saved_plans (user_id);

create or replace function public.set_smart_planner_saved_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists smart_planner_saved_plans_set_updated_at on public.smart_planner_saved_plans;
create trigger smart_planner_saved_plans_set_updated_at
before update on public.smart_planner_saved_plans
for each row
execute function public.set_smart_planner_saved_plans_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────
-- With RLS enabled and no policy for a given command, that command is denied by default for
-- the `anon` and `authenticated` roles -- there is no public/anon access at all here. Every
-- policy below is scoped to `user_id = auth.uid()`, read from the request's verified session
-- JWT, never from client-supplied input -- so a user can only ever read/create/update/delete
-- their own rows, and guessing another user's row id returns nothing (not an error, just an
-- empty result), not that user's plan.

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

create policy "Users can update their own saved plans"
on public.smart_planner_saved_plans
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own saved plans"
on public.smart_planner_saved_plans
for delete
to authenticated
using (user_id = auth.uid());

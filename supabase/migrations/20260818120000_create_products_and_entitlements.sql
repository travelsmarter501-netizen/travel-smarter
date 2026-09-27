-- Products + user entitlements: the ownership foundation for paid guides.
-- Payment integration is out of scope here — entitlements are granted manually
-- (Dashboard/SQL Editor) until a payment provider is wired up in a later task.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_ils numeric,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  granted_at timestamptz not null default now(),
  source text not null default 'manual',
  payment_reference text,
  unique (user_id, product_id)
);

create index if not exists user_entitlements_user_id_idx on public.user_entitlements (user_id);

insert into public.products (slug, name, price_ils, active)
values ('barcelona-guide', 'Barcelona Travel Guide', 29, true)
on conflict (slug) do nothing;

-- ── Row Level Security ────────────────────────────────────────────────
-- With RLS enabled and no policy for a given command, that command is
-- denied by default for the `anon` and `authenticated` roles. Only the
-- policies below grant access; everything else (INSERT/UPDATE/DELETE from
-- the browser) stays blocked until a trusted server process (service_role,
-- which bypasses RLS) grants an entitlement.

alter table public.products enable row level security;

create policy "Authenticated users can view active products"
on public.products
for select
to authenticated
using (active = true);

alter table public.user_entitlements enable row level security;

create policy "Users can view their own entitlements"
on public.user_entitlements
for select
to authenticated
using (user_id = auth.uid());

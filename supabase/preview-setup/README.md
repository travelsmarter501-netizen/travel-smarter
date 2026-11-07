# Preview test database (NOT production)

`travel-smarter-preview-setup.sql` builds the database of a **new, empty Supabase test project** for the Vercel Preview
deployment of `release/prague-preview`. It is every file in `supabase/migrations/` in filename order (21 files), in one transaction,
behind a guard that stops it on any database that already has this app's tables or any user. It is **not** a migration: it never
goes to production, and `supabase/migrations/` stays the only source of schema changes.

One file is left out on purpose: `20260825120000_create_smart_planner_saved_plans.sql`. A later migration
(`20260904130000_create_smart_planner_saved_plans.sql`) creates the same table and policies ("create missing"), production only
ever ran the later one, and running both on an empty database fails on duplicate policies.

Verified on PGlite (Postgres compiled to WASM) with stand-ins for Supabase's roles, `auth.users` and `auth.uid()`: the file runs
clean, creates 11 tables and 19 functions, the products and prices come out as in production (`travel-smarter-personalized-plan`
= 39), `user_owns_personalized_plan` is true for a user with the entitlement and false for anyone else, a second run is refused by
the guard, and a database that already has a user is refused with nothing created. Not verified: Supabase's own platform extras
(Auth service, Realtime, Storage), which this app's SQL does not use.

## Steps

1. Supabase dashboard: **New project** (a different project from production, any name, e.g. `travel-smarter-preview`).
2. **Authentication → Providers → Email**: turn **Confirm email** off (so a test sign-up is signed in at once, no email needed).
3. **SQL Editor → New query**: paste the whole content of `travel-smarter-preview-setup.sql` → **Run**. Expect "Success". Check:
   `select slug, price_ils, active from public.products order by slug;` lists 9 products, the personalized plan at 39.
4. **Authentication → URL Configuration**: Site URL = the preview address; add it to Redirect URLs with `/**`
   (`https://travel-smarter-git-release-prague-preview-travelsmarter501-4558.vercel.app/**`).
5. Vercel → project → **Settings → Environment Variables**: add each variable below for the **Preview** environment only (Git branch
   `release/prague-preview` if the dashboard offers the choice), then **Redeploy** the latest deployment of that branch
   (`NEXT_PUBLIC_*` values are baked in at build time).

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the TEST project's URL (Project Settings → API) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the TEST project's publishable (anon) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | the TEST project's service-role key |
   | `ALLPAY_MODE` | `disabled` |
   | `ALLPAY_API_LOGIN` | `disabled` |
   | `ALLPAY_API_KEY` | `disabled` |
   | `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS` | `prague` |

   Never put production keys or customer data here. Production keeps its own values.
6. Open the preview address, sign up with a test email, then run this once in the **test** project's SQL Editor to make that
   account a buyer like an existing customer (planner + Barcelona guide):

   ```sql
   insert into public.user_entitlements (user_id, product_id, source, payment_reference)
   select u.id, p.id, 'manual-test', 'preview-test'
   from auth.users u, public.products p
   where u.email = 'YOUR-TEST-EMAIL' and p.slug in ('travel-smarter-personalized-plan', 'barcelona-guide')
   on conflict (user_id, product_id) do nothing;
   ```

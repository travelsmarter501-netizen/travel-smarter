# Preview test database (NOT production)

`travel-smarter-preview-setup.sql` builds the database of a **new, empty Supabase test project** for a Vercel Preview deployment.
- First used for `release/prague-preview`; now for the Budapest Preview of `feature/budapest`.
- It is every file in `supabase/migrations/` in filename order (21 of the 22 files), in one transaction, behind a guard that stops it on any database that already has this app's tables or any user.
- It is **not** a migration: it never goes to production, and `supabase/migrations/` stays the only source of schema changes.
- **The guard is no substitute for checking WHICH project is open:** see step 0.

**One file is left out on purpose:** `20260825120000_create_smart_planner_saved_plans.sql`.
- A later migration (`20260904130000_create_smart_planner_saved_plans.sql`) creates the same table and policies ("create missing").
- Production only ever ran the later one, and running both on an empty database fails on duplicate policies.

**Checked again on 2026-11-16** (`feature/budapest` at `ece9b36`; the Budapest work adds no migration):
- **Migrations:** the 21 included migrations are in the file verbatim and in filename order; the left-out one is the duplicate above.
- **Data the file inserts:** only the product catalog (`public.products`). Every other `insert` is inside a function body (runs only when the app calls it) or in a comment. No user, order, entitlement or plan rows; no e-mail addresses.
- **No secrets and no production address:** no keys, tokens or connection strings, and no production project id or production site URL. The one URL in the file is in a comment of a migration (an example link to an older Vercel address), not executed.
- **Permissions:** 14 `enable row level security`, 12 `create policy` (as in the migrations).
- **Unchanged since `9426d2f`:** the file has not changed since it was verified on PGlite (Postgres compiled to WASM, with stand-ins for Supabase's roles, `auth.users` and `auth.uid()`). That run:
  - ran clean; created 11 tables and 19 functions; products and prices as in production (`travel-smarter-personalized-plan` = 39);
  - `user_owns_personalized_plan` true for a user with the entitlement and false for anyone else;
  - a second run refused by the guard; a database that already has a user refused with nothing created.
  - Not verified: Supabase's own platform extras (Auth service, Realtime, Storage), which this app's SQL does not use.

## Steps (Budapest Preview)

0. **Identity check before anything:**
   - The test project is `qcznrojhnshmwrtrrqux`. Production is `glxdwkcsngpvlmdkiklr` and is never touched.
   - Before running SQL or copying a key, confirm the open project's URL / Project Settings show `qcznrojhnshmwrtrrqux`.
1. **Authentication → Providers → Email** (test project): turn **Confirm email** off, so a test sign-up is signed in at once, with no email needed.
2. **SQL Editor → New query** (test project): paste the whole content of `travel-smarter-preview-setup.sql` → **Run**. Expect "Success". Check:
   `select slug, price_ils, active from public.products order by slug;` lists 9 products, the personalized plan at 39.
3. **Vercel → project `travel-smarter` → Settings → Environment Variables:** add the three Supabase variables of the TEST project, Environment **Preview**, Git branch **`feature/budapest`** only:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the TEST project's URL (Project Settings → API) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the TEST project's publishable (anon) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | the TEST project's service-role key |

   - Copied from the Supabase dashboard into the Vercel dashboard directly, never through a chat.
   - Never production keys. Never Production or "All environments".
   - **Already set for Preview + `feature/budapest` (2026-11-16):** `ALLPAY_MODE`, `ALLPAY_API_LOGIN` and `ALLPAY_API_KEY` = `disabled`; `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS` = `budapest`; `NEXT_PUBLIC_PREVIEW_LANGUAGES` = `he`.
   - Then **Redeploy** the latest deployment of `feature/budapest` (`NEXT_PUBLIC_*` values are baked in at build time).
4. **Authentication → URL Configuration** (test project): Site URL and Redirect URLs = the Preview address with `/**` (`https://travel-smarter-git-feature-budapest-travelsmarter501-4558.vercel.app/**`).
5. **Open the Preview address and sign up with a test email** (two accounts for the permission test). Then run this once per account in the **test** project's SQL Editor, to make it a buyer like an existing customer (planner + Barcelona guide):

   ```sql
   insert into public.user_entitlements (user_id, product_id, source, payment_reference)
   select u.id, p.id, 'manual-test', 'preview-test'
   from auth.users u, public.products p
   where u.email = 'YOUR-TEST-EMAIL' and p.slug in ('travel-smarter-personalized-plan', 'barcelona-guide')
   on conflict (user_id, product_id) do nothing;
   ```

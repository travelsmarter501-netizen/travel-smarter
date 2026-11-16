# Budapest on a Vercel Preview: setup order (revised 2026-11-16; nothing pushed, created or deployed)

**Goal:** the owner tries the product on a phone with real sign-in, saves and permissions, on a TEST database, with Budapest and Hebrew,
and with no real payment. Production stays untouched. Code under test: `4c39288` (docs after it: `76b9bcd`, no code).

**Rules for every step:**
- No push before steps 1–4 are done and the owner approves.
- No secret is ever pasted into the chat (keys are copied directly from the Supabase dashboard into the Vercel dashboard).
- No customer data is copied.
- Nothing is changed in Production or with the "All environments" scope.
- No paid service is created.

## 1. Identify the real Vercel project and its Production branch
- **From the repository:** GitHub `travelsmarter501-netizen/travel-smarter`. Production deploys from `main`; `feature/budapest` has no remote copy yet.
- **Vercel team scope:** `travelsmarter501-4558`. The connector has no access to it (403). The owner opens the single-use approval link the connector produces (team access for this connection; it grants nothing until approved).
- **Then read-only from here:** project name and id, Production branch, the Preview variables' NAMES and scopes (no values), and whether "Automatically expose System Environment Variables" is on.
- **Without the link,** the owner can instead send screenshots of:
  - Project → Settings → Git (Production Branch);
  - Settings → Environment Variables, list view with the environment column, values hidden;
  - the "Automatically expose System Environment Variables" checkbox.

## 2. Identify the TEST Supabase project (by name and project id)
- **Where to look:** in the Supabase dashboard's project list, the Prague release's test project (README in this folder) if it exists, by its name and project ID (the id is the part of its URL before `.supabase.co`; not a secret).
  - It must be a DIFFERENT project from production: compare the two ids in that list.
  - The SQL guard of the setup file is no substitute for checking the identity.
- **If it exists:** do NOT run the full setup file and delete nothing.
  - Run `check-existing-test-project.sql` (read-only: objects present / missing, RLS on, row COUNTS only) in THAT project and paste the result table.
  - Missing objects are compared with `supabase/migrations/` first; only the missing migrations would be applied, after review.
  - Non-zero counts of orders or plans must be test rows only. If the project ever held real customer data, it is not used.
- **If none exists:** a new project is needed. Say so before creating it.
  - Supabase's free plan allows a limited number of active free projects (2, as I know it; check the pricing page before creating). If production already uses one and another free project exists, a new one could need a paid plan or pausing another; decide before creating.
  - The owner creates it. Then steps 1–3 of `supabase/preview-setup/README.md` (Confirm email off, run the setup file on the EMPTY project, check products).

**Read on 2026-11-16 (Vercel API, names and scopes only, no value decrypted):**
- Project `travel-smarter` (`prj_Hsfwy0c58a9JdunG5rM3nQjBYckY`), team `travelsmarter501-4558`.
- Production deploys from `main` (latest production deployment: `925512d`, READY). Deployment protection (password / SSO) is off.
- Every Supabase / Postgres variable (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, `POSTGRES_*`) is scoped to **Production only**, through the Supabase integration.
- The only **Preview** variable is `ALLPAY_MODE` (all Preview branches; its value was not decrypted).
- **So today a Preview build has NO database at all** (it cannot reach production's), and no Allpay credentials.
- **Vercel accepts a branch-scoped variable only for a branch that exists in the connected repository:** adding them for `feature/budapest` was refused with 400, nothing created. The branch must be on GitHub first.

## 3. Vercel → Environment Variables: Preview only, Git branch `feature/budapest`
Add each with Environment = **Preview** and Branch = **`feature/budapest`**. Never Production, never "All environments". Names, scopes and reasons: `preview-env-vars.md`.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | from the TEST project of step 2 (copied dashboard to dashboard) |
| `ALLPAY_MODE` | `disabled` |
| `ALLPAY_API_LOGIN`, `ALLPAY_API_KEY` | `disabled` (no real credentials) |
| `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS` | `budapest` |
| `NEXT_PUBLIC_PREVIEW_LANGUAGES` | `he` |

- **Check:** "Automatically expose System Environment Variables" is ON. The Hebrew switch and the browser side of the Budapest switch read `NEXT_PUBLIC_VERCEL_ENV`.
- **If a variable already exists for Preview / All environments with PRODUCTION values,** a branch-specific Preview value overrides it for `feature/budapest`. Confirm that in the list view before the push.

## 4. Verification table (no secrets), filled before the push

| Item | Value |
|---|---|
| Vercel project (name / id) | |
| Production branch | `main` (to confirm) |
| Preview branch | `feature/budapest` |
| Test Supabase project (name / id) | |
| Test id differs from production id | yes / no |
| Supabase variables: scope | Preview, branch `feature/budapest` |
| Payments on Preview | `ALLPAY_MODE=disabled`, credentials `disabled` |
| Budapest switch | `budapest`, Preview branch only; Production: not set |
| Hebrew switch | `he`, Preview branch only; Production: not set |
| System env exposure | on / off |

## 5. Push (only after the owner approves)
- Push `feature/budapest` only. No merge into `main`.
- Vercel builds the Preview from it. The Preview URL comes from the deployment (the dashboard shows it).

## 6. After the URL exists
1. **Test Supabase → Authentication → URL Configuration:** add the exact Preview URL to Redirect URLs (`<preview-url>/**`); the Site URL as the owner decides. Confirm email off (step 2).
2. **Two test accounts** (sign up on the Preview); planner entitlement for both in the TEST project (step 6 of `supabase/preview-setup/README.md`).
3. **Checks:**
   - account A: create a Budapest plan, edit (remove / add), save, reopen, switch ar / en / he;
   - account B: A's plan is not in B's list, A's plan address shows not found, an edit sent with A's plan id is refused and A's stored plan is unchanged;
   - the checkout never reaches Allpay.
4. **The owner tries it on an iPhone.**

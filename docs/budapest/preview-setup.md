# Budapest on a Vercel Preview: setup order (revised 2026-11-16; results of the Preview run in section 7)

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

## 7. Results on the Preview (2026-11-16)
No secret, key value or customer data was read into the chat or written here. Nothing was changed in Production.

**What ran:**
- **Branch:** `feature/budapest` pushed at `ece9b36` (no force, no merge). Production still deploys `main` = `925512d`.
- **Deployment:** the Preview of `ece9b36`, READY, at `travel-smarter-git-feature-budapest-travelsmarter501-4558.vercel.app`.
- **After it:** one local docs commit (`5e8c737`, `supabase/preview-setup/README.md` only), not pushed; no code differs from what was tested.
- **Variables (Preview + `feature/budapest` only):**
  - Supabase: the TEST project `qcznrojhnshmwrtrrqux` (added by the owner). The Preview's public scripts contain only the test project's host.
  - `ALLPAY_MODE`, `ALLPAY_API_LOGIN`, `ALLPAY_API_KEY` = `disabled`.
  - `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS=budapest`, `NEXT_PUBLIC_PREVIEW_LANGUAGES=he`.
- **System environment exposure is on:** the menu offers العربية / EN / עברית, which needs `NEXT_PUBLIC_VERCEL_ENV=preview` in the browser.

**Two-account isolation (passed).** Account A owns two Budapest plans. Before the test, A's `updated_at` and a hash of each `generated_plan_json` were recorded. Then, signed in as B:

| B tried, on each of A's plans | Result |
|---|---|
| Open A's plan address | page «ما لقينا هاي الخطة، ممكن تكون انحذفت.» |
| REST read by id | 200, 0 rows. B's own list: 0 rows, none of A's |
| REST update (`destination_slug`) | 403 `42501` permission denied (the table has no update grant) |
| REST delete by id | 200, 0 rows deleted |
| REST insert with A's `user_id` | 403 `42501`, row-level security policy |
| RPC `replace_owned_plan_content`, `delete_saved_plan`, `set_saved_plan_archived` with A's user id | 403 `42501` permission denied, each |
| The site's server action `customizeSavedPlan` with A's plan id (a valid `reset` change) | `{ ok: false, code: "not_found" }`, nothing saved |

Signed in as A afterwards: both plans have the same `updated_at` and the same hash as before.

**Payments (by code and variables, not by a click):**
- `getAllpayMode()` accepts only `test` / `live` (`live` only on Production). With `disabled` it throws before any request to Allpay, and checkout returns «تعذّر تجهيز الدفع حاليًا…».
- B (no entitlement) reached the checkout page (₪39 from the test database).
- The click on «الدفع عبر Allpay» was refused by the session's permission check and was not tried another way. Not run: that click. Expected: the message above, no move to Allpay, one pending order in the test database.

**Prague and Barcelona on the Preview (account A, one 3-day «فاجئني» plan each):**
- **Budapest-only display absent:** no photo-credit link under photos, no time isolation in texts. The only `<bdi dir="ltr">` runs are the day start and the distance, as in Production.
- **Layout:** RTL, no horizontal overflow, no broken images, no new console error. Prague also checked in English.
- **Visible shared changes (round 8, intended):**
  - the badge reads «لا تفوّته» (Production: «Must See»);
  - the price-not-available counter wording;
  - anchors on `/photo-credits`.
- **`/photo-credits`:** RTL, no overflow, sections Prague, Barcelona, Budapest.

**The owner's test on a real phone:** the owner created a plan, edited it, saved it and reopened it on Safari on an iPhone, and it worked. One case only; the city, the edits, the iPhone model and the iOS version were not recorded.

**Not checked:**
- the Allpay button click (above);
- e-mails (confirmation is off in the test project);
- other phones, Android, other cases on Safari.

**Test data left in the test database:**
- A's two Budapest plans and the Prague and Barcelona plans made in this run.
- The two test accounts.

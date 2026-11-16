# Budapest on a Vercel Preview (prepared 2026-11-16; nothing pushed, created or deployed)

**Goal:** the owner tries the product on a phone with real sign-in, saves and permissions, on a test database, with Budapest and Hebrew,
and with no real payment. Production stays untouched.

**Reused:** the Preview recipe of the Prague release, `supabase/preview-setup/`.
- `travel-smarter-preview-setup.sql` builds an EMPTY test Supabase project from all 22 migrations (one duplicate left out on purpose, see its README).
- A guard refuses any database that already has this app's tables or any user, so it cannot touch production.
- Checked today: every current migration file is in it.

## What was checked before asking for anything
- **Vercel connector:** it has no access to the project's team (`travelsmarter501-4558`) in this session: 403. No Vercel CLI and no Supabase CLI are installed. So nothing can be read or set from here without the owner.
- **Payments:**
  - `getAllpayMode()` accepts only `test` or `live`; anything else (e.g. `disabled`) makes every payment attempt fail closed.
  - `live` throws unless `VERCEL_ENV === "production"`. A Preview can never charge.
- **Free access for test users:** the existing ways are a manual entitlement row in the TEST database (step 6 of the recipe) or `COMPLIMENTARY_USER_IDS`. Set either only in the test project / for the Preview environment; production's values are not touched.
- **Sign-in redirects** use the page's own origin (`window.location.origin`), so sign-up, Google and password reset return to the Preview address, not production.
- **Plan permissions (policies reviewed, NOT proven):** `smart_planner_saved_plans` has RLS with `user_id = auth.uid()` for select / insert / update / delete, and edits go through the owner-only `replace_owned_plan_content`. Reading the policies does not prove isolation. The two-account test on the test environment is still required: account B tries to read AND to edit account A's plan directly (its address, and an edit request with A's plan id).
- **Budapest:** `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS` is honoured on a Vercel Preview and ignored by the server on Production (`plannerDestinations.ts`).
- **Hebrew** (new in 709278c):
  - `NEXT_PUBLIC_PREVIEW_LANGUAGES=he` is honoured only when `NEXT_PUBLIC_VERCEL_ENV === "preview"` (or in `next dev`).
  - It is ignored on Production and when the environment is unknown (fails closed).
  - Requires Vercel's "Automatically expose System Environment Variables" (on by default).

## What is ready locally
- **Branch `feature/budapest`:** 37 commits on top of `main` (`git log main..feature/budapest`). Budapest stays `available: false`.
- **What a Preview build would take:** the whole branch: the Budapest work, plus the shared changes listed in research sections 22–24 (plan view, add rule for daylight cities, translations, display options, photo credits, Hebrew switch).
- **Production:** `main` is not changed by pushing this branch.

## Steps (owner)
0. **First, isolate the Preview** (`preview-env-vars.md`): pushing makes Vercel build the branch at once with whatever Preview values exist today. Those values are unknown here (403). Set or check the Preview-only values (test Supabase, payments disabled) BEFORE the push.
1. **Approve the push:** "push `feature/budapest`".
   - **Target:** GitHub `travelsmarter501-netizen/travel-smarter` (the remote of this repository; the branch has no remote copy yet).
   - **Vercel:** team scope `travelsmarter501-4558`; the project name `travel-smarter` is read from earlier Preview addresses and not confirmed from here.
   - The branch goes to GitHub and Vercel builds a Preview from it automatically.
   - Expected address: `travel-smarter-git-feature-budapest-travelsmarter501-4558.vercel.app` (Vercel's pattern; the dashboard shows the exact one).
   - Not merged, not Production.
   - *Or* approve the Vercel team-access link if you want me to check settings and deployments from here.
2. **Test Supabase project:**
   - Use the existing Preview test project from the Prague release if it still exists and holds no customer data; otherwise create a new free project.
   - Then steps 1–4 of `supabase/preview-setup/README.md`: Confirm email off, run the setup SQL, Site URL + Redirect URLs = the Preview address above with `/**`.
3. **Vercel → Settings → Environment Variables, Preview only** (Git branch `feature/budapest` where offered), then Redeploy:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the TEST project's URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the TEST project's publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | the TEST project's service-role key |
   | `ALLPAY_MODE` | `disabled` |
   | `ALLPAY_API_LOGIN` / `ALLPAY_API_KEY` | `disabled` |
   | `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS` | `budapest` (or `prague,budapest`) |
   | `NEXT_PUBLIC_PREVIEW_LANGUAGES` | `he` |

   - Never production keys or customer data. Production keeps its own values.
   - **Do not set any of these for Production.**
4. **Two test accounts** (sign up on the Preview), and in the TEST project's SQL Editor give both the planner entitlement (step 6 of the README, with each test email).

## Checks to run on the Preview (once it exists)
- **Sign-up and sign-in** with test account A; create a Budapest plan; edit (remove, add); reopen; switch Arabic / English / Hebrew.
- **Permissions (required):** account B signs in; A's plan is not in B's "My plans"; opening A's plan address as B shows not found; an edit sent as B with A's plan id is refused and A's stored plan is unchanged.
- **Payment:** the checkout never reaches Allpay (fails closed).
- **On a real phone** (iPhone Safari and Android Chrome): the plan, the place details, the photo credits.

**Not done here:** no push, no deployment, no Vercel or Supabase setting changed, no account or service created.

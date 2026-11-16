# Environment variables for the Budapest Preview (names and scope only; no values)

Every variable the code reads (`process.env.*` in `app/`, `utils/`, `proxy.ts`, read on 2026-11-16), and what the Budapest Preview needs.
**Scope** = where it must be set in Vercel. "Preview only" means the Preview environment (ideally limited to the Git branch
`feature/budapest`), **never** Production and never "All environments".

| Variable | Read by | Preview (Budapest test) | Production |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients (browser + server) | **Preview only: the TEST project** | production project (unchanged) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase clients | **Preview only: the TEST project's key** | production key (unchanged) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (saves through owner-only functions) | **Preview only: the TEST project's key** | production key (unchanged) |
| `ALLPAY_MODE` | `allpay/config.ts` | **Preview only: `disabled`** (anything but `test` / `live` fails closed: no payment session) | `live` (unchanged; `live` is refused off Production) |
| `ALLPAY_API_LOGIN`, `ALLPAY_API_KEY` | `allpay/config.ts` | **Preview only: `disabled`** (no real credentials on Preview) | real (unchanged) |
| `ALLPAY_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL` | Allpay redirect URLs only | not needed (payments disabled) | unchanged |
| `NEXT_PUBLIC_PLANNER_PREVIEW_DESTINATIONS` | `plannerDestinations.ts` | **Preview only: `budapest`** (or `prague,budapest`) | **must stay unset**. Since 4c39288 a Production build neither lists nor accepts a preview city even if it were set (browser: `NEXT_PUBLIC_VERCEL_ENV`; server: `VERCEL_ENV`). This holds only while Vercel exposes its system variables (the default) |
| `NEXT_PUBLIC_PREVIEW_LANGUAGES` | `releaseScope.ts` (new, 709278c) | **Preview only: `he`** | unset (ignored on Production anyway) |
| `NEXT_PUBLIC_VERCEL_ENV`, `VERCEL_ENV`, `VERCEL`, `VERCEL_URL` | Vercel system variables | set by Vercel; requires "Automatically expose System Environment Variables" (default on) | set by Vercel |
| `COMPLIMENTARY_USER_IDS` | `commerce/complimentary.ts` | optional, Preview only: TEST user ids; the recipe's manual entitlement row is the simpler way | unchanged |
| `ADMIN_EMAILS` | `admin.ts` | not needed | unchanged |
| `TEMP_ADMIN_ALLOW_UNPAID_DRAFT` | `customPlanAdmin.ts` (admin drafts; fails closed unless exactly `true`) | not needed: leave unset | unchanged |
| `GEOAPIFY_API_KEY` | accommodation address lookup (active provider) | optional: without it, a typed hotel address is not located; the rest works | unchanged |
| `GOOGLE_MAPS_API_KEY` | fallback address provider | not needed | unchanged |
| `NODE_ENV` | framework | set by Next.js | set by Next.js |

**Before any push:**
- The Preview environment's current values are UNKNOWN here (the Vercel connector has no access to the team: 403).
- If the Supabase variables are set for "All environments" or for Preview with production values, a Preview build of the branch would read and write the PRODUCTION database.
- So the Preview values above must be set (or checked) first. Otherwise the push must wait. Pushing a branch makes Vercel build it automatically with whatever Preview values exist.

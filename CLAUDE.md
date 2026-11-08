@AGENTS.md

# Travel Smarter — project instructions

Arabic-first (RTL, English supported) travel-planning website. Next.js 16 (App Router, `proxy.ts`), TypeScript, Tailwind, Supabase (auth + Postgres), Allpay payments, deployed on Vercel from `main` (https://travelsmarters.com). Read `AGENTS.md` first: this Next.js version differs from older ones, so check `node_modules/next/dist/docs/` before writing framework code.

## Where things are documented

- `docs/PRODUCT_SPEC.md` — confirmed product decisions, what is actually implemented today, known limitations, unresolved decisions. Treat it as the product source of truth.
- `docs/PROJECT_PLAN.md` — ordered phases, current progress, decision log. Update it after every completed phase.
- Facts about the code live in the code. If a document and the code disagree, the code wins: verify, then fix the document.

## Product in one paragraph

The public presentation sells ONE product: a personalized travel itinerary (₪39, one-time). Barcelona and Prague are the supported destinations (Prague since 2026-11-08); the Barcelona guide comes only with a purchase for a Barcelona plan. Do not promise other cities, PDF, sharing, trip-total cost, or lifetime/future-destination access: none of that is decided or built. Details and the open questions are in `docs/PRODUCT_SPEC.md`.

## Working rules

- Inspect the existing implementation before editing, and reuse working components instead of rebuilding.
- Keep each task inside the phase and scope the user asked for. Do not fix unrelated things on the way; report them instead.
- Preserve unrelated uncommitted work. Check `git status` first.
- Never print or store secrets, environment values, or customer data (emails, ids, claim tokens). Production checks are read-only unless the user explicitly says otherwise.
- **Protected areas.** Changes to payments (Allpay), the webhook, prices, authentication, entitlements, database schema/RLS, or existing purchase access need an explicit task that describes the intended change. Never alter them as incidental cleanup. Existing buyers must keep access to everything they bought.
- Database changes ship as migrations in `supabase/migrations/`. The user applies migrations themselves; never run them. `supabase/dry-run/` and `supabase/verify/` are untracked working files: never commit them.
- Commit or push only when asked. When asked, commit exact files only and end commit messages with the `Co-Authored-By` line given in the session context. Pushing to `main` deploys to production through Vercel.
- Verify with the checks that fit the change (`npx tsc --noEmit`, `npm run lint`, production build, targeted tests) and report only what was actually verified. For visual changes use the app preview to inspect mobile and desktop, Arabic RTL, and English where supported, and state the limits (an emulated viewport is not real Safari or a real iPhone).
- After each completed phase, update `docs/PROJECT_PLAN.md`: completed, remaining, unresolved decisions.
- Proceed on routine work inside the authorized scope; ask only when a missing decision materially affects the implementation.

## Environment notes

- The real project folder is `C:\Users\user\OneDrive\שולחן העבודה\travel-planner` (Hebrew "ש"). A look-alike folder whose name uses an Arabic letter exists; never edit anything there.
- There is no test suite in the repository, and `npm test` does not exist. Existing checks are `tsc`, `eslint`, and `next build`. Older ad-hoc test harnesses lived outside the repo and are gone.
- Standard commands: `npm run dev`, `npm run build`, `npm run lint`. The preview server is defined in `.claude/launch.json`.
- Allpay mode comes from `ALLPAY_MODE`; `live` is only permitted on the Vercel Production environment (`app/lib/allpay/config.ts`), and production appears to run live. Never create real orders or payments while testing.

# Round 8: where to resume (copy kept in the project; written 2026-11-16 while shell commands were blocked; no secrets)

**Status (later the same day): DONE.** The shell came back; 709278c was built; the browser availability fix is 4c39288; checks in `data/quality-r8/`. Kept as the record of the interruption.

Paths below are relative to the session scratchpad that holds the worktree `tp-bud` (branch `feature/budapest`) and the review folder
`review/r9/`. The worktree itself is this project checkout.

## Why it stopped
Every Bash call (and one PowerShell call, the same command) returned, verbatim:

> The server-side auto mode classifier gave no verdict (error), so auto mode cannot determine the safety of Bash. This is a transient
> failure of the check, not a judgment about the action: a later response may get a verdict. ...

The message itself says it is a failed check (no verdict), not a refusal of the action. Calls tried: the round-8 build re-run (4x), then
one read-only `git status` (same message). Retrying stopped.

## State
- **Branch:** `feature/budapest`. Last commit `709278c` (round-8 code).
- **Uncommitted, docs and a test only** (written with the file tools, not checked by any command):
  - `docs/budapest/budapest-research.md` (section 24 + corrections)
  - `docs/budapest/texts-review.md` (sections 5, 6)
  - `docs/PROJECT_PLAN.md` (round-8 sentence)
  - `docs/budapest/added-place-snapshot-design.md` (new)
  - `docs/budapest/preview-setup.md` (new)
  - `docs/budapest/preview-env-vars.md` (new)
  - `docs/budapest/tools/bud-preview-gates.mts` (new test, NOT yet run)
  - this file
- **Checked before the block** (outputs in `review/r9/final/tests/`):
  - Budapest schedules identical to round 7.
  - Prague / Barcelona plan data identical to 925512d.
  - tsc / lint pass on 709278c.
  - Build passed on the tree BEFORE the Hebrew switch was added: the build of 709278c itself is still owed.
- **Screenshots (8):** `review/r9/shots/`.
- **Found by reading the code:** the Budapest preview switch is not tied to the Vercel environment in the browser. If it were set on Production, the questionnaire would list Budapest while the server refuses it.

## To run when commands work again
1. `git status --short; git log --oneline -3`: expect only the files above.
2. Build 709278c exactly, in a separate worktree (never `git stash`, the stash is shared): `git worktree add --detach ../tp-r8 709278c`, junction `node_modules`, then `npx tsc --noEmit -p .`, `npm run lint`, `npx next build --webpack`.
3. Gating test (`docs/budapest/tools/bud-preview-gates.mts`).
4. Commit the docs + the test separately (code checked = 709278c; docs commit = documentation and a review test only).
5. Package: code diff since 944d286, all test outputs, the 8 screenshots, `photo-rights.md`, `added-place-snapshot-design.md`, `preview-setup.md`, `preview-env-vars.md`, `texts-review.md`.
6. Remove the `tp-r8` worktree.

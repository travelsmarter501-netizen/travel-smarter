# Budapest round 8: test outputs (research section 24)

| Folder | Code | What |
|---|---|---|
| `tests-before-709278c/` | the working tree that became 709278c (before the Hebrew switch was added to releaseScope.ts) | Budapest schedules vs round 7, independent check, translations, photos, daylight, save action, Prague / Barcelona (generation, edits, translation vs 925512d) |
| `tests-709278c/` | 709278c, clean worktree | `tsc` run first (8 errors, all the build-generated `PageProps` type, missing before a build), `tsc` after the build (pass), lint (pass), `next build --webpack` (pass), gating test (FAILS the browser case: the reason for 4c39288) |
| `tests-4c39288/` | 4c39288 (final code), clean worktree | build, tsc after the build, lint, gating test, save action, hours boundaries, mixed dates, photos, Prague / Barcelona vs 925512d: all pass |

The docs commit after 4c39288 changes documentation and adds no code.

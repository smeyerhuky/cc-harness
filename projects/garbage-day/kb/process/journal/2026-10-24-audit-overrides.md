---
type: "Journal"
title: "2026-10-24 — Garbage Day: the audit cleared again, so main deploys"
description: "Pull request #18 merged, but main's audit job had failed on its merge and on #20's, so neither had deployed. Zod and happy-dom moved to fixed releases, and two overrides stand in for the undici and zod that Cloudflare's test tooling pins. GD-TICKET-035 done."
resource: "Working session 2026-10-24 on branch gd-ticket-035-audit-overrides"
tags: ["journal", "dependencies"]
timestamp: "2026-10-24"
---

# 2026-10-24 — Garbage Day: the audit cleared again, so main deploys

**Epic:** [`GD-EPIC-001`](../backlog/GD-EPIC-001.md) · **Milestone:** M3 active · **Branch:** `gd-ticket-035-audit-overrides`

## What happened

1. The owner merged pull request #18 (`GD-TICKET-017`, `7dbe502`). The session checked the
   merge's pipeline. `audit` had failed, and the build and both deploys were skipped. The same
   had happened on #20's merge on 2026-10-22. Production was still on `54e2ff9`
   (2026-10-02). The site's health check said ok, because the old build was still serving.
2. The audit found five advisories:
   - zod 4.6.5, which the Worker uses to validate messages;
   - happy-dom 20.14.5, fixed only in the 21 line;
   - undici 7.29.1 under miniflare, where no Cloudflare release up to the Vite plugin 1.65.0 has
     the fix.
3. The owner had asked for `GD-TICKET-034`'s audit fix in a pull request of its own, so this
   one followed the same route: [`GD-TICKET-035`](../backlog/GD-TICKET-035.md), on a branch
   off `main` in a separate worktree. Zod went to 4.6.7 and happy-dom to 21.0.4. Two exact pins
   in Cloudflare's tooling had no fix to take: undici in miniflare, and zod 4.6.5 in
   `@cloudflare/vitest-plugin` (still so in its newest release, 1.4.7). Each got an override,
   commented in `pnpm-workspace.yaml` and listed in stack and CI's exceptions.
4. The audit came back clean, and the gates and both browser suites passed.

## Decisions with the owner

| Question | Answer |
|---|---|
| Fix the audit in a pull request of its own? | Following the owner's word for `GD-TICKET-034`: "fix them in a sibling commit/PR". |
| Overrides, which stack and CI had said there were none of | Not asked. No release fixes the pinned versions, and the deploy is blocked without them. Each is listed with when to delete it, for the owner to overrule. |

## What landed

| Commit | Work item | What |
|---|---|---|
| this session's commit | `GD-TICKET-035` | zod 4.6.7, happy-dom 21.0.4, the two overrides, the lockfile; the Resolution, stack and CI, index, roadmap, handoff, version and this entry |

## Surprises and what they changed

- **A green pull request can merge into a deploy that never runs.** `audit` checks the
  advisories of the day, not the change, so it can fail on `main` after the pull request
  passed. On `main` the failure skips the deploy, and nothing else shows it. The handoff now says
  to check the deploy after a merge.
- **#20's merge failed its audit two hours after #20 passed it.** The fix and the next
  advisories crossed. It went unseen until #18's merge, two days later.

## Verification

```
pnpm audit --audit-level moderate                    No known vulnerabilities found
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build   exit 0
pnpm test                 Test Files 56 passed (56) · Tests 674 passed (674)
pnpm test:worker          Test Files 6 passed (6)   · Tests 50 passed (50)
browser suites, in mcr.microsoft.com/playwright:v1.63.0-noble (pinned digest):
  engine                  3 files, 30 tests passed (Chromium, WebKit, Firefox)
  app a11y                1 file, 27 tests passed
```

The project's KB gates (`lint_okf`, `lint_authority`, `relationships`, `weeding`, `backlog`) all
pass on `projects/garbage-day/kb/`.

## Next

Merge this pull request and check that `main`'s deploy runs. Production then gets `GD-TICKET-034`,
`GD-TICKET-017` and this. Then the rest of M3: `GD-TICKET-029`, then `GD-TICKET-027`.

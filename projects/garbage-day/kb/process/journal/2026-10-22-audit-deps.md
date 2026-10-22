---
type: "Journal"
title: "2026-10-22 — Garbage Day: a clean dependency audit again"
description: "New advisories turned CI's audit job red on every pull request; at the owner's word the fix went in a pull request of its own: Vite 8.3.4, the Cloudflare tooling's next matched set (Wrangler 4.151.0), Vitest 4.1.12 and source-map-js 1.2.2. GD-TICKET-034 done, and pull request #18 rebased on it."
resource: "Working session 2026-10-22 on branch gd-ticket-034-audit-deps"
tags: ["journal", "dependencies"]
timestamp: "2026-10-22"
---

# 2026-10-22 — Garbage Day: a clean dependency audit again

**Epic:** [`GD-EPIC-001`](../backlog/GD-EPIC-001.md) · **Milestone:** M3 active · **Branch:** `gd-ticket-034-audit-deps`

## What happened

1. Pull request #18 (`GD-TICKET-017`) was red only on `audit`. Five advisories, in Vite,
   `source-map-js` and `sharp`, had been published after `main`'s last green run. The session
   said so on the pull request and asked the owner where the fix should go.
2. The owner asked why it was red, then said: "fix them in a sibling commit/PR and then rebase on
   top of it". [`GD-TICKET-034`](../backlog/GD-TICKET-034.md) was minted. The work went on a
   branch off `main` in a separate worktree, so #18's checkout stayed as it was.
3. The first try took the newest Wrangler (4.151.3) with the newest Vite plugin (1.64.0). The
   audit was clean, but the plugin pins Wrangler 4.151.0, so the lockfile carried two Wranglers
   and two miniflares. The pins moved to the matched set instead: Wrangler 4.151.0 and the test
   plugin 1.4.3. Its miniflare already has `sharp` 0.35.5.
4. By then the audit had found two more advisories, in Vitest's mocker. Vitest went to 4.1.12.
   The audit came back clean, the gates and browser suites passed, and a bot match played
   against `pnpm dev` on the new toolchain.

## Decisions with the owner

| Question | Answer |
|---|---|
| Where does the audit fix go? | "fix them in a sibling commit/PR and then rebase on top of it". |
| `sharp`: newer Wrangler, or an override? | Not asked again; the newest matched set fixed it with no override. |

## What landed

| Commit | Work item | What |
|---|---|---|
| this session's commit | `GD-TICKET-034` | the version bumps and lockfile; the Resolution, stack and CI, index, roadmap, handoff, version and this entry |

## Surprises and what they changed

- **The audit can go red without a commit.** Advisories published after `main`'s last run fail
  every pull request after them, whatever it changes. A red `audit` is checked against `main`
  before it is put down to the pull request.
- **The newest Wrangler wasn't the right one.** No Vite plugin pinned 4.151.3, so taking it
  would have split the toolchain in two.
- **The test plugin now accepts Vitest 5.** That was the recorded reason for holding Vitest
  back. The exception row now says the hold-back waits only on Renovate's pull request.

## Verification

```
pnpm audit --audit-level moderate                    No known vulnerabilities found
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build   exit 0
pnpm test                 Test Files 55 passed (55) · Tests 665 passed (665)
pnpm test:worker          Test Files 6 passed (6)   · Tests 50 passed (50)
browser suites, in mcr.microsoft.com/playwright:v1.63.0-noble (pinned digest):
  engine                  3 files, 30 tests passed (Chromium, WebKit, Firefox)
  app a11y                1 file, 27 tests passed
pnpm dev                  /api/health ok; a bot match played through the Match DO, no page errors
```

The project's KB gates (`lint_okf`, `lint_authority`, `relationships`, `weeding`, `backlog`) all
pass on `projects/garbage-day/kb/`.

## Next

Merge this pull request, then pull request #18 (rebased on it). Then the rest of M3: `GD-TICKET-029`,
then `GD-TICKET-027`.

---
type: "Reference"
title: "Garbage Day Handoff"
description: "Where Garbage Day stands right now and exactly what to do next — the cold-start brief a fresh session reads first."
resource: "roadmap.md"
tags: ["handoff", "roadmap", "backlog"]
timestamp: "2026-09-30"
---

# Garbage Day Handoff

Rewritten, not appended, in the same commit as any change to the state below
([the rule](../../../../kb/pdlc/journals.md#keeping-the-handoff-current)) — the session-by-session
history lives in the [running journal](journal/index.md).

## Snapshot

- **Active epic:** [`GD-EPIC-001`](backlog/GD-EPIC-001.md) — Garbage Day v1 (M1–M5).
- **Milestone:** M2 — Play solo — **active**, starting with
  [`GD-TICKET-021`](backlog/GD-TICKET-021.md) ([roadmap](roadmap.md)). M1 closed at its owner
  check-in on 2026-09-30: "let's go", every default approved
  ([the check-in](journal/2026-09-30-scaffold.md#next)). The shell is live in production at
  `https://garbage-day.smeyerhuky.workers.dev`. M1's coverage audit filed 2 gaps
  ([sweep](coverage-audit.md)), and M2 has 8 stories and 5 tickets. M0 closed at its owner
  check-in: "Continue", with every default kept (no kickoff ceremony, no XP or badges in v1, the
  new piece palette, TypeScript 6.0.3 and Vitest 4.1.11 held back).
- **Branch:** `ccr-a9d3b393-jvy3f5` (the session's designated branch).
- **Landed recently** ([journal entry](journal/2026-09-30-scaffold.md)):
  - the workspace scaffold, [`GD-TICKET-006`](backlog/GD-TICKET-006.md): a pnpm workspace in
    `src/` with the `engine`, `protocol`, `ui` and `app` packages, the pinned stack, lint,
    typecheck, tests, build, a clean audit, and `renovate.json` at the repo root;
  - CI, [`GD-TICKET-007`](backlog/GD-TICKET-007.md): `.github/workflows/garbage-day.yml` and
    `garbage-day-codeql.yml`, green on the branch and on pull request #10 (opened by the owner);
    `garbage-day-ok` is the one check to require;
  - the engine core, [`GD-TICKET-008`](backlog/GD-TICKET-008.md): `PlayerSim` and its modules
    in `src/engine/src/`, 174 tests, fixed-point gravity, checked against the proof of concept;
  - [`GD-TICKET-018`](backlog/GD-TICKET-018.md) filed for M2: the spec uses the Tetris name for a
    four-row clear; the owner picks the word (default "Quad");
  - the referee, bot and local match, [`GD-TICKET-009`](backlog/GD-TICKET-009.md): every pause
    and presence rule, snapshots, bots with skill and speed 1–10, and ten golden replays in
    `src/engine/test/golden/`; an ESLint guard for the determinism contract;
  - the golden replays in Chromium, Firefox and WebKit,
    [`GD-TICKET-019`](backlog/GD-TICKET-019.md): green in CI, the same hashes as Node; since
    [`GD-TICKET-020`](backlog/GD-TICKET-020.md) the job runs in Playwright's image, pinned by
    digest, after a slow Ubuntu mirror timed it out;
  - the protocol, [`GD-TICKET-010`](backlog/GD-TICKET-010.md): schemas for every message, the
    codec (engine shapes ↔ wire), a board encoding of at most 161 bytes, settings, and a
    typecheck test that keeps the protocol and the engine's types in agreement;
  - the app shell, [`GD-TICKET-011`](backlog/GD-TICKET-011.md) (**done**): the Worker with
    `LobbyDO` and `MatchDO`, the React page, Worker tests in workerd; a Worker Preview per pull
    request, production on `main` (live, "Server ready · production"), and preview cleanup.
    Getting there took the account's `workers.dev` subdomain, a fix to the job's JSON parsing,
    the Durable Object bindings declared again for previews, and deploy conditions that ignore
    skips upstream ([lessons](../../../../kb/lessons/index.md)). Pull requests #10 and #11 are
    merged.
  Before that, the design session ([journal entry](journal/2026-09-30-design.md)).
- **Waiting on the owner:** merging pull request #12 (the M1-exit records), and replacing the
  Cloudflare token before 2026-12-29 ([`GD-TICKET-022`](backlog/GD-TICKET-022.md)). Settled on
  2026-09-30:
  - the Cloudflare secrets (the token expires 2026-12-29: rotate it before then);
  - the Renovate GitHub app, reading `renovate.json` from `main`;
  - the `main-protect` ruleset, requiring `garbage-day-ok` from GitHub Actions with branches up
    to date, checked through the API ([the pipeline](../design/stack-and-ci.md#the-pipeline)).
- **Gates:** the KB gates and, from `projects/garbage-day/`, the
  [code gates](../design/stack-and-ci.md#code-gates) — all pass, locally and in CI.

## Immediate next step

[`GD-TICKET-021`](backlog/GD-TICKET-021.md) (**active**): Wrangler 4.143.1, the Vite plugin 1.62.1
and the test plugin 1.3.2 are in, and the `undici` override is deleted. The code gates pass.
Watch pull request #12's CI and preview, and after the owner merges it, the production deploy;
then close the item. After that, the [rule](../../../../kb/pdlc/work-items.md#which-item-is-next) picks
[`GD-TICKET-023`](backlog/GD-TICKET-023.md), the `ui` commons.

## Standing rules for M1

- Re-check every version against the npm registry on the day it is pinned; "latest" means the
  newest release at least a day old. Record any held-back version in
  [stack and CI](../design/stack-and-ci.md#exceptions-to-latest).
- Port from `spikes/proof-of-concept/live/live-engine.js`; do not rewrite rules from memory. The
  engine's deliberate differences from it are listed in `GD-TICKET-008`'s Resolution.
- Run pnpm as `npx -y pnpm@12.8.1 <script>` in a session container (or `corepack enable`).
- A change to the engine that changes any golden replay is regenerated on purpose
  (`pnpm --filter @garbage-day/engine golden:update`) in its own commit, saying why (definition
  of done, project item 1).

## Verify the baseline

The project [gates](../../../../kb/pdlc/definition-of-done.md#gates) on this bundle
(`B=projects/garbage-day/kb/`), from the repo root, and the
[code gates](../design/stack-and-ci.md#code-gates) from `projects/garbage-day/` — all must pass
before new work.

## Cold-start prompt

```
garbage-day — resume work.
1. Develop on the session's designated branch.
2. Read projects/garbage-day/kb/process/handoff.md (this file), then roadmap.md, then the
   next work item's "AI PDLC Prompt" in kb/process/backlog/ (which one: /kb/pdlc/work-items.md,
   "Which item is next"). The method is in /kb/pdlc/.
3. Run the project gates on this bundle (/kb/pdlc/definition-of-done.md, "Gates") and the code
   gates (kb/design/stack-and-ci.md, "Code gates"); everything must pass before new work.
4. Work only the current milestone. At its exit, apply the milestone tier of the definition of
   done (kb/process/definition-of-done.md), which ends with the owner check-in. Before ending any
   session, follow /kb/pdlc/journals.md, "Closing a session".
```

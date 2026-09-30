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
- **Milestone:** M1 — Foundations — **active** ([roadmap](roadmap.md)). M0 closed at its owner
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
  - [`GD-TICKET-019`](backlog/GD-TICKET-019.md) filed for M1: the golden replays in Chromium,
    Firefox and WebKit, the browser half of M1's exit check;
  - the protocol, [`GD-TICKET-010`](backlog/GD-TICKET-010.md): schemas for every message, the
    codec (engine shapes ↔ wire), a board encoding of at most 161 bytes, settings, and a
    typecheck test that keeps the protocol and the engine's types in agreement;
  - the app shell, [`GD-TICKET-011`](backlog/GD-TICKET-011.md) (**blocked on the owner**): the
    Worker with `LobbyDO` and `MatchDO`, the React page, Worker tests in workerd, verified locally
    with `vite dev` and `vite preview`; CI jobs for a Worker Preview per pull request, production
    on `main`, and preview cleanup, which skip until the secrets exist.
  Before that, the design session ([journal entry](journal/2026-09-30-design.md)).
- **Waiting on the owner:**
  - for `GD-TICKET-011`: the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository
    secrets, then opening the preview URL CI comments on the pull request and, after merging to
    `main`, the production URL;
  - installing the Renovate GitHub app (until then `renovate.json` is inert);
  - a ruleset or branch protection on `main` requiring the `garbage-day-ok` check
    ([the pipeline](../design/stack-and-ci.md#the-pipeline)).
- **Gates:** the KB gates and, from `projects/garbage-day/`, the
  [code gates](../design/stack-and-ci.md#code-gates) — all pass, locally and in CI.

## Immediate next step

[`GD-TICKET-019`](backlog/GD-TICKET-019.md) — run the golden replays in Chromium, Firefox and
WebKit: the only M1 item not done or blocked. `011` resumes when the owner has added the
Cloudflare secrets. M1's exit needs both.

## Standing rules for M1

- Re-check every version against the npm registry on the day it is pinned; "latest" means the
  newest release at least a day old. Record any held-back version in
  [stack and CI](../design/stack-and-ci.md#exceptions-to-latest).
- Port from `spikes/proof-of-concept/live/live-engine.js`; do not rewrite rules from memory. The
  engine's deliberate differences from it are listed in `GD-TICKET-008`'s Resolution.
- Run pnpm as `npx -y pnpm@12.8.1 <script>` in a session container (or `corepack enable`).
- Remove the `undici` override in `pnpm-workspace.yaml` once Wrangler 4.143.1 or later is in
  ([exceptions](../design/stack-and-ci.md#exceptions-to-latest)).
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

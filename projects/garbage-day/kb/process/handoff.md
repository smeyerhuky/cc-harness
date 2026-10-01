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
- **Milestone:** M3 — Play online — **active**, starting with [`GD-TICKET-028`](backlog/GD-TICKET-028.md).
  - **M2 closed at its owner check-in on 2026-10-01:** "Keep going". The four decisions weren't answered one by one, so each default holds ([the check-in](journal/2026-09-30-scaffold.md#next)). The defaults: bot-game settings come in M3 after private games; the design is rewritten to match the code for the three unused React APIs; M3 is built in the index's order.
  - **Every M2 item was done** except the owner's token rotation, [`GD-TICKET-022`](backlog/GD-TICKET-022.md), due by 2026-12-29 ([roadmap](roadmap.md)).
  - **M2's exit criterion is met:** a complete match against a local bot, on desktop and on a phone, by keyboard and by touch, with every screen passing the accessibility scan in both themes.
  - **The coverage audit** ([sweep of the M2 exit](coverage-audit.md)) filed 2 gaps, [`GD-TICKET-026`](backlog/GD-TICKET-026.md) and [`027`](backlog/GD-TICKET-027.md).
  - **M3 is minted:** 7 stories and 7 tickets, in a proposed build order in the [backlog index](backlog/index.md).
  - **Earlier check-ins:** M1 closed on 2026-09-30 ("let's go", every default approved). M0 closed with "Continue".
- **Branch:** `ccr-a9d3b393-jvy3f5` (the session's designated branch).
- **In production** (`https://garbage-day.smeyerhuky.workers.dev`), from pull request #13:
  - [`GD-TICKET-021`](backlog/GD-TICKET-021.md), [`GD-TICKET-023`](backlog/GD-TICKET-023.md) (the `ui` commons, with a gallery at `/gallery`) and [`GD-TICKET-014`](backlog/GD-TICKET-014.md);
  - [`GD-STORY-001`](backlog/GD-STORY-001.md), [`GD-STORY-007`](backlog/GD-STORY-007.md) and [`GD-STORY-003`](backlog/GD-STORY-003.md): a local match by keyboard, home and settings, and rebinding.
- **In pull request #14** (open; its Worker Preview is `https://pr-14-garbage-day.smeyerhuky.workers.dev`):
  - [`GD-TICKET-018`](backlog/GD-TICKET-018.md) (Quad) and [`GD-STORY-002`](backlog/GD-STORY-002.md) (the fight on screen);
  - [`GD-STORY-004`](backlog/GD-STORY-004.md) with [`GD-TICKET-015`](backlog/GD-TICKET-015.md) (touch play);
  - [`GD-STORY-005`](backlog/GD-STORY-005.md) (the layouts) and [`GD-STORY-006`](backlog/GD-STORY-006.md) (bot setup);
  - [`GD-STORY-008`](backlog/GD-STORY-008.md) (accessibility) and [`GD-TICKET-024`](backlog/GD-TICKET-024.md) (the developer overlay: `?dev` or `);
  - [`GD-TICKET-025`](backlog/GD-TICKET-025.md) (no literal colours).

  CI is green on its head. The history is in the [journal entry](journal/2026-09-30-scaffold.md).
- **Waiting on the owner:**
  - playing pull request #14's preview on a real phone, then merging it;
  - replacing the Cloudflare token before 2026-12-29 ([`GD-TICKET-022`](backlog/GD-TICKET-022.md)).

  Settled earlier: the Cloudflare secrets, the Renovate app, and the `main-protect` ruleset requiring `garbage-day-ok` ([the pipeline](../design/stack-and-ci.md#the-pipeline)).
- **Gates:** the KB gates and, from `projects/garbage-day/`, the [code gates](../design/stack-and-ci.md#code-gates) and `pnpm test:browser`. All pass, locally and in CI.

## Immediate next step

[`GD-TICKET-028`](backlog/GD-TICKET-028.md): route `/ws/lobby` and `/ws/match/<id>` to their
Durable Objects, check every message against its schema, limit the rate, and reject impossible
attacks. Then M3 in the [backlog index](backlog/index.md)'s order. Work pushed before pull
request #14 merges joins it.

## Standing rules

- Re-check every version against the npm registry on the day it is pinned; "latest" means the
  newest release at least a day old. Record any held-back version in
  [stack and CI](../design/stack-and-ci.md#exceptions-to-latest).
- Port from `spikes/proof-of-concept/live/live-engine.js`; do not rewrite rules from memory. The
  engine's deliberate differences from it are listed in `GD-TICKET-008`'s Resolution.
- Run pnpm as `npx -y pnpm@12.8.1 <script>` in a session container (or `corepack enable`).
- A change to the engine that changes any golden replay is regenerated on purpose
  (`pnpm --filter @garbage-day/engine golden:update`) in its own commit, saying why (definition
  of done, project item 1).
- **After every build, restart `vite preview`.** A server started before the build serves HTML
  for the new build's scripts. Find its PIDs with `ps`, kill them in their own command, and start
  the server in another: `pgrep -f` matches the shell that runs it.
- **The CSS takes every colour, shadow and tint from a token** (`GD-TICKET-025`). The search in
  that item's criteria must find nothing outside `tokens.css`.

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

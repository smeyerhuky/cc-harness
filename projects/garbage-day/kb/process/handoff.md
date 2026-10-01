---
type: "Reference"
title: "Garbage Day Handoff"
description: "Where Garbage Day stands right now and exactly what to do next — the cold-start brief a fresh session reads first."
resource: "roadmap.md"
tags: ["handoff", "roadmap", "backlog"]
timestamp: "2026-10-01"
---

# Garbage Day Handoff

Rewritten, not appended, in the same commit as any change to the state below
([the rule](../../../../kb/pdlc/journals.md#keeping-the-handoff-current)) — the session-by-session
history lives in the [running journal](journal/index.md).

## Snapshot

- **Active epic:** [`GD-EPIC-001`](backlog/GD-EPIC-001.md) — Garbage Day v1 (M1–M5).
- **Milestone:** M3 — Play online — **active**. Done so far:
  - [`GD-TICKET-028`](backlog/GD-TICKET-028.md): the socket routes, the upgrade limit and the message guard;
  - [`GD-STORY-011`](backlog/GD-STORY-011.md): the Match DO hosts the referee, deals and relays, and the client plays its side;
  - [`GD-STORY-009`](backlog/GD-STORY-009.md): quick match, with the bot offer;
  - [`GD-TICKET-030`](backlog/GD-TICKET-030.md): CodeQL's alert found (the SARIF is now a run artifact) and fixed; online matches deal from a 128-bit secret seed;
  - [`GD-TICKET-013`](backlog/GD-TICKET-013.md): a dropped connection freezes the player, reconnects with backoff and rejoins without losing garbage;
  - [`GD-STORY-012`](backlog/GD-STORY-012.md): garbage, power-ups and showdowns between two clients, each seen on both screens;
  - [`GD-STORY-013`](backlog/GD-STORY-013.md): both players' speed level and match clock follow the Match DO's clock;
  - [`GD-TICKET-016`](backlog/GD-TICKET-016.md): a bot reads as a bot on every screen, and the protocol marks a bot client;
  - [`GD-STORY-015`](backlog/GD-STORY-015.md): every bot match plays through the Match DO, with the bot as a second client in a Web Worker;
  - [`GD-STORY-010`](backlog/GD-STORY-010.md): private games: a game made on the host's settings, a link and code to send, a lobby with Ready from each, full and expired games.

  `GD-STORY-013`, `GD-TICKET-016`, `GD-STORY-015` and `GD-STORY-010` are on the branch, not yet
  in production.

  Two strangers can now play each other through Cloudflare, and survive a dropped connection.
  A bot plays under the same server rules, from its own worker, and two friends can meet by a
  link. A reload mid-match is [`GD-TICKET-033`](backlog/GD-TICKET-033.md), in M4.
  What a reconnect can still lose is [`GD-TICKET-031`](backlog/GD-TICKET-031.md), in M4.
  - **M2 closed at its owner check-in on 2026-10-01:** "Keep going". The four decisions weren't answered one by one, so each default holds ([the check-in](journal/2026-09-30-scaffold.md#next)). The defaults: bot-game settings come in M3 after private games; the design is rewritten to match the code for the three unused React APIs; M3 is built in the index's order.
  - **Every M2 item was done** except the owner's token rotation, [`GD-TICKET-022`](backlog/GD-TICKET-022.md), due by 2026-12-29 ([roadmap](roadmap.md)).
  - **M2's exit criterion is met:** a complete match against a local bot, on desktop and on a phone, by keyboard and by touch, with every screen passing the accessibility scan in both themes.
  - **The coverage audit** ([sweep of the M2 exit](coverage-audit.md)) filed 2 gaps, [`GD-TICKET-026`](backlog/GD-TICKET-026.md) and [`027`](backlog/GD-TICKET-027.md).
  - **M3 is minted:** 7 stories and 7 tickets, in a proposed build order in the [backlog index](backlog/index.md).
  - **Earlier check-ins:** M1 closed on 2026-09-30 ("let's go", every default approved). M0 closed with "Continue".
- **Branch:** `ccr-a9d3b393-jvy3f5` (the session's designated branch).
- **In production** (`https://garbage-day.smeyerhuky.workers.dev`): everything above. The owner
  merged pull request #14 on 2026-10-01 (`b2a2ff8`), after #13, and it is deployed. Production
  has all of M2 and M3 so far: quick match against a stranger, with reconnects and the fight on
  both screens.
  There is no open pull request. Work goes on the designated branch, restarted from `main` after
  the merge, and a new pull request is opened only when the owner asks.
- **Waiting on the owner:** replacing the Cloudflare token before 2026-12-29 ([`GD-TICKET-022`](backlog/GD-TICKET-022.md)).

  Settled earlier: the Cloudflare secrets, the Renovate app, and the `main-protect` ruleset requiring `garbage-day-ok` ([the pipeline](../design/stack-and-ci.md#the-pipeline)).
- **Gates:** the KB gates and, from `projects/garbage-day/`, the [code gates](../design/stack-and-ci.md#code-gates) and `pnpm test:browser`. All pass, locally and in CI.

## Immediate next step

[`GD-TICKET-026`](backlog/GD-TICKET-026.md): the match settings for a bot game. The form is
`features/match-settings` (`GD-STORY-010`); `POST /api/bot-matches` takes the defaults today.
Then the rest of M3 in the [backlog index](backlog/index.md)'s order.

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
- **CodeQL's findings are in the run's `codeql-sarif` artifact** (`GD-TICKET-030`). The Security
  tab is out of an agent's reach; download the artifact through the Actions tools.
- **To check online play with a real opponent,** play a bot: it plays through the Match DO from
  its own worker (`GD-STORY-015`). Two browser contexts that both choose Quick match are paired
  with each other. Space scripted key presses a frame apart: taps inside one frame count as one.
- **The app's tests play bot matches and private games against `src/app/test/fakeServer.ts`**, a
  stand-in for the Worker and a Match DO. A test that only checks the screen passes even when no
  match starts, so a test of play must check the match itself.
- **CI's browser jobs run in Playwright's image**, whose fonts and timing differ from this
  container's. To reproduce one, start Docker (`dockerd &`) and run `vitest --config
  vitest.browser.config.ts` in the pinned image with the repo mounted (see the journal's step 56).

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

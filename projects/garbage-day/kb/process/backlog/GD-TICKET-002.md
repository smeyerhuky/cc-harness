---
type: "Work Item"
title: "GD-TICKET-002: Write the architecture design from the proof of concept"
description: "Turn the proven proof-of-concept design into kb/design/architecture.md: components, the Lobby and Match Durable Objects, the message protocol, the state machines, determinism, the garbage ledger and presence handling."
resource: "../../product/prd.md"
tags: ["backlog", "design", "architecture"]
timestamp: "2026-09-30"
state: "done"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../../product/prd.md
  - type: DEPENDS_ON
    target: GD-TICKET-001.md
---

# GD-TICKET-002: Write the architecture design from the proof of concept

## Description

The spec (`kb/product/`) says what v1 must do. The proof of concept already proved how: each
browser runs its own deterministic engine at 60 ticks a second, and one Match Durable Object per
match deals bags, relays moves, routes garbage with acknowledged ids, schedules showdowns and
referees pauses, while a Lobby Durable Object pairs players and hosts private games. This item
writes that down as the architecture, pipeline stage 2a.

## Acceptance Criteria

- `kb/design/architecture.md` exists with OKF frontmatter and covers: the components (client,
  Worker, Lobby DO, Match DO), the full client ↔ DO message list with direction and purpose, the
  Match, Presence and Piece state machines, the determinism contract (what must be identical on
  every device, and how replays test it), the garbage ledger and reconnect resend, heartbeat and
  pause handling, private-game codes and expiry, bot matches, and Cloudflare cost per match.
- Every PRD story US-01 to US-20 maps to at least one component in a traceability table.
- `kb/design/index.md` is a pure table of contents, linked from `kb/index.md` and from the design
  row of the PDLC table in the project's `CLAUDE.md`.
- The project gates pass.

## Linked Artifacts

- [PRD](../../product/prd.md), [game rules](../../product/game-rules.md),
  [pause and presence rules](../../product/pause-and-presence.md)
- Proof of concept: [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja)
  (its engine is the `LV` module in the page source)

## AI PDLC Prompt

Goal: write Garbage Day's architecture design. Read `projects/garbage-day/CLAUDE.md`, all four
files in `projects/garbage-day/kb/product/`, and `/kb/pdlc/pipeline.md` (stage 2a). The proof
of concept's engine (match, Match DO, network model, bot) is in the Garbage Day Live artifact
linked above; read it with the Artifact tool if available, and treat it as the proven reference.
Write `projects/garbage-day/kb/design/index.md` (table of contents only) and
`kb/design/architecture.md` with OKF frontmatter covering everything in the acceptance criteria,
plus a traceability table from US-01..US-20 to components. Link the design folder from
`kb/index.md` and the PDLC table in `CLAUDE.md`. Do not choose libraries or CI here (that is
GD-TICKET-004). Done when the acceptance criteria hold, the project gates pass
(`/kb/pdlc/definition-of-done.md`, "Gates"), this item is `done` with a Resolution, the backlog
index and roadmap agree, and the session's running-journal entry records it.

## Resolution

Done in [the design session](../journal/2026-09-30-design.md): [`kb/design/architecture.md`](../../design/architecture.md) with components,
both message lists, state machines, the determinism contract, the match clock, the garbage ledger,
presence and pauses, bots, cost, what carries over from the proof of concept, and the US-01 to
US-20 traceability table; [`kb/design/index.md`](../../design/index.md) linked from `kb/index.md`
and the PDLC table.

Deviations and additions: the proof of concept's code was first committed to
`spikes/proof-of-concept/` and recorded as [`GD-SPIKE-001`](GD-SPIKE-001.md), so the design cites
code in the repo rather than an artifact link. Three changes from the proof of concept are design
decisions made here: fixed-point gravity instead of `Math.pow` (cross-engine determinism), SQLite
snapshots so a deploy restart does not lose a match, and the bot as a second client in a Web
Worker rather than server code. The React client's structure, which the owner asked for in this
session, went to its own file under [`GD-TICKET-005`](GD-TICKET-005.md).

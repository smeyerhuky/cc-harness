---
type: "Work Item"
title: "GD-TICKET-031: Lose nothing across a reconnect"
description: "Make a reconnect lose nothing the reconnect of GD-TICKET-013 can lose: game messages sent into a connection that died before the client noticed, broadcasts a player missed on a drop the referee never noticed, a bag whose reply was lost, and a drop before start."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "network"]
timestamp: "2026-10-01"
state: "open"
milestone: "M4"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
  - type: DEPENDS_ON
    target: GD-TICKET-013.md
---

# GD-TICKET-031: Lose nothing across a reconnect

## Description

Found while building [`GD-TICKET-013`](GD-TICKET-013.md). That item's reconnect gets back every
garbage row by the ledger, and keeps whatever the client makes while it knows it is offline.
Four things can still be lost.

1. **What the client sent before it noticed.** A connection can die without closing. The
   client takes up to 3 s of silence to give up on it, and what it sent meanwhile is gone: a
   lock, an attack, a power-up used, even a top-out. Client messages carry no number, so they
   can't be resent without risking doubles.
2. **What the referee broadcast during a short drop.** A drop under the referee's 5 s goes
   unnoticed. The rejoin gets back the garbage and is told when to resume. It doesn't get back
   a power-up the other player used, or a showdown announced, meanwhile.
3. **A bag whose reply was lost.** The client asks again, and the referee deals the next bag:
   that player skips a bag the other one plays.
4. **A drop before `start`.** A client that never heard `start` waits for it after the rejoin,
   and it doesn't come again.

## Acceptance Criteria

- The client numbers its game messages and the Match DO acknowledges them. On a rejoin the
  client resends what wasn't acknowledged, and the DO ignores a number it has seen.
- A rejoining player is caught up on what was broadcast while they were gone: the power-ups
  in effect and the showdown.
- A bag is asked for by its number, so a repeated ask gets the same bag. A number the DO hasn't
  dealt yet is refused, so no one can see bags ahead.
- A client dropped before `start` gets its bags and `start` on the rejoin.
- Tests cut the connection before the client notices, at each of these moments, against a
  local referee, and show nothing lost or doubled.

## Linked Artifacts

- [Architecture — garbage ledger and reconnects](../../design/architecture.md#garbage-ledger-and-reconnects)
- `src/engine/src/client-match.ts`, `src/engine/src/referee.ts`, `src/app/worker/match.ts`

## AI PDLC Prompt

Goal: a reconnect that loses nothing. Read `kb/design/architecture.md` ("Garbage ledger and
reconnects", "Messages") and `GD-TICKET-013`'s Resolution. Extend the protocol, the referee and
`ClientMatch`, with tests that cut the connection unnoticed. Done when the criteria hold, the
code and KB gates pass, this item is `done` with a Resolution, the backlog index and roadmap
agree, and the journal records it.

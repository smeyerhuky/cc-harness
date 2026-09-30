---
type: "Work Item"
title: "GD-TICKET-013: Client outbox and reconnect with backoff"
description: "Give the client socket an outbox that holds messages while offline and flushes them on reconnect, reconnect with jittered backoff, and self-freeze the board while disconnected."
resource: "../coverage-audit.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-013: Client outbox and reconnect with backoff

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the architecture commits the
client to an offline outbox and reconnects ("Garbage ledger and reconnects"), but nothing carried
it. The proof of concept's `Match.back` and `outbox` show the behaviour.

## Acceptance Criteria

- The client `Socket` queues outgoing game messages while disconnected (not `pos` or `ping`) and
  flushes them in order after `rejoin` succeeds.
- It reconnects with exponential backoff and jitter (0.5 s to 8 s), and shows "Reconnecting".
- The local board freezes itself as soon as the socket drops and resumes on the DO's `resume`.
- Tests drop and restore the connection mid-match against a local referee and show no lost or
  duplicated attacks.

## Linked Artifacts

- [Architecture — garbage ledger and reconnects](../../design/architecture.md#garbage-ledger-and-reconnects)
- Proof of concept: `spikes/proof-of-concept/live/live-engine.js` (`Match.back`, `outbox`)

## AI PDLC Prompt

Goal: build the client outbox and reconnect. Read `kb/design/architecture.md` ("Garbage ledger
and reconnects", "Messages") and `kb/design/client-architecture.md` ("Where state lives").
Implement `projects/garbage-day/src/app/client/net/Socket.ts` with tests. Done when the criteria
hold, the code and KB gates pass, this item is `done` with a Resolution, the backlog index and
roadmap agree, and the journal records it.

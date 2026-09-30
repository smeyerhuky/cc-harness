---
type: "Work Item"
title: "GD-TICKET-010: Build the protocol package"
description: "Create @garbage-day/protocol: every client-to-DO, DO-to-client and lobby message from architecture.md as a Zod schema with its TypeScript type and the protocol version, plus round-trip and rejection tests."
resource: "../../design/architecture.md"
tags: ["backlog", "protocol"]
timestamp: "2026-09-30"
state: "open"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../../design/architecture.md
  - type: DEPENDS_ON
    target: GD-TICKET-006.md
---

# GD-TICKET-010: Build the protocol package

## Description

One definition of every message, shared by the client, the Worker and both Durable Objects, and
validated on every message the server receives ([architecture — messages](../../design/architecture.md#messages)).

## Acceptance Criteria

- Every message in the three tables of `architecture.md` ("Messages") has a schema and an exported
  type; every message carries `v` and `t`.
- Tests: each type round-trips through encode and parse; malformed, oversized and wrong-version
  messages are rejected with a typed error.
- The run-length encoding for board snapshots is here with tests, and a snapshot of a full board
  stays under 200 bytes.
- Code gates pass.

## Linked Artifacts

- [Architecture — messages](../../design/architecture.md#messages)

## AI PDLC Prompt

Goal: build the protocol package. Read `kb/design/architecture.md` ("Messages", "Garbage ledger
and reconnects") and `kb/design/stack-and-ci.md` (Zod version). Write
`projects/garbage-day/src/protocol/src/` with schemas, types, the snapshot encoding and tests. Run
the code gates. Done when the criteria hold, the KB gates pass, this item is `done` with a
Resolution, the backlog index and roadmap agree, and the journal records it.

---
type: "Work Item"
title: "GD-TICKET-010: Build the protocol package"
description: "Create @garbage-day/protocol: every client-to-DO, DO-to-client and lobby message from architecture.md as a Zod schema with its TypeScript type and the protocol version, plus round-trip and rejection tests."
resource: "../../design/architecture.md"
tags: ["backlog", "protocol"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). `src/protocol/src/` now has:

- `schemas.ts`: a Zod schema for every message in the architecture's three tables (15 client →
  Match DO, 16 Match DO → client, 3 and 4 for the Lobby DO), each with `v` and `t`. It also has
  match settings with only the PRD's choices, handles in the generated form, tokens and match
  ids. `attack` is rejected unless its rows fit the declared clear and the clear's worth matches
  the engine's attack table, which is the first of the architecture's server-side limits.
- `codec.ts`: `encode…` and `parse…` for each direction, turning wire messages (`t`, `v`, an
  encoded board) into the engine's shapes (`type`, a snapshot) and back. The engine's `hb` is
  the exact `ping` string the WebSocket auto-response needs. Parsing never throws; it returns a
  `ProtocolError` with a code.
- `board-codec.ts`: the board encoding. It sends whichever is shorter of run-length (a typical
  stack takes a few dozen bytes) and 4-bit packing, so any board, full or not, is at most 161
  bytes. A test encodes 500 random full boards.
- `settings.ts`: the default settings and their mapping to engine rules (Classic turns gems and
  showdowns off).

49 tests. Every sample message round-trips, and a test checks the samples cover every type the
schemas accept. Malformed, oversized, wrong-version, unknown and invalid messages are rejected
with their codes. A typecheck test (`expectTypeOf`) fails if the protocol and the engine's
message types disagree in either direction; removing one `readonly` produced 2 errors. A whole
bot match played over the codec, with every message encoded and parsed, gives exactly the same
summary as the same match without it; `LocalMatch` gained a `wire` option for this.

Differences from the design, now in the architecture's message tables:

- The board encoding is not pure run-length. Run-length alone can't keep a varied full board
  under 200 bytes, because runs of one cell cost more than the cell.
- `rejoin` carries no token: every socket, a reconnect included, authenticates with `hello`
  first.
- `lock` and `attack` carry the clear as data, not a label (as the engine does since
  `GD-TICKET-008`).
- `result` carries a reason code and who it is about. Each side's stats arrive in its last
  `lock`, not in the result.
- `start` carries the go tick and the settings. The server start time for clock sync is left to
  M3, as an optional field.

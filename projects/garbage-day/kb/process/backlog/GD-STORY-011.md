---
type: "Work Item"
title: "GD-STORY-011: Same pieces, hidden next, and the opponent live"
description: "The Match DO deals both players the same bags with gems one bag at a time from a seed that never leaves it, and relays each board to the other at 15 Hz and on every lock (US-06, US-07)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-028.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-011: Same pieces, hidden next, and the opponent live

## Description

The roadmap's M3 todo "Match DO: dealing bags with gems, relay at 15 Hz and per lock, hidden next pieces", the first part of the Match DO. The client's `MatchSession` gains a socket in place of the local referee, keeping the same snapshot and effects, so the M2 screens don't change.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#playing), **US-06 Same pieces, hidden next**:

- Both players receive the same piece sequence, including the same gem blocks, dealt by the
  Match DO one bag of 7 at a time.
- I see my own next 5 pieces and my hold; I see my opponent's hold but never their next pieces.
- The seed never leaves the server, so reading network traffic cannot reveal future pieces.

**US-07 See my opponent live**:

- My opponent's board, falling piece, incoming meter and hold update at least 15 times a second
  when the network delay is 150 ms one way or less.
- Their board is shown with the same colours as mine, next to mine on desktop and as a smaller
  board on a phone in portrait.

## Linked Artifacts

- [PRD — US-06, US-07](../../product/prd.md#playing), [architecture](../../design/architecture.md), [client architecture](../../design/client-architecture.md)

## AI PDLC Prompt

Goal: a match between two browsers through the Match DO. Read the architecture's Match DO section and `src/engine/src/referee.ts`, which the DO hosts. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

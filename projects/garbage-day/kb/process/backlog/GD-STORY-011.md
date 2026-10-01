---
type: "Work Item"
title: "GD-STORY-011: Same pieces, hidden next, and the opponent live"
description: "The Match DO deals both players the same bags with gems one bag at a time from a seed that never leaves it, and relays each board to the other at 15 Hz and on every lock (US-06, US-07)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "active"
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

## Progress

- **The Match DO half is built** (`src/app/worker/match.ts`).
  - **Opening a match:** whoever creates it calls `open` with two join tokens and the settings. A second open returns false, so the caller can pick another id.
  - **Seats:** each socket's `hello` claims the seat its token names. A newer socket for a seat closes the older one, and a bad token or a message before `hello` gets `bad-token` and a close.
  - **The referee:** with both seats taken, the engine's referee starts on a seed made and kept in the DO. It deals two bags each, then `start`, which carries each player's own garbage-hole seed and never the match seed.
  - **Its clock:** on every message the DO catches the referee up to the wall-clock tick. It first passes on the heartbeats the auto-response answered without waking it, so silence detection works.
  - **The relay:** positions and locks go to the other player, and the queue never does.
  - **Tests:** 7 Worker tests cover dealing (the same bags for both), the seed, the relay, refusals, a replaced seat, and opening once.
- **The client half is built.**
  - **Engine:** `ClientMatch` (`src/engine/src/client-match.ts`) is one player's side. Its `PlayerSim` is stepped as `LocalMatch` steps each of its two, and sends positions every fourth tick. An `OpponentView` keeps the other player's board as of their last lock, and their piece, meter, hold and power-up as of their last position.
    - **Its seat:** it takes its seat and hole seed from `start` (the new `you` and `holes`). Power-ups name players by seat, so a player in seat 1 must simulate as seat 1, or their own Fog falls on them.
    - **Its clock:** it is set from `start`, not raised to it, so ticks counted while waiting don't put it ahead of the server.
  - **App:** `OnlineSession` has `MatchSession`'s surface (the new `Session` interface the screen draws). It says `hello` with its token and parses every message with the protocol. It maps the referee's seats to the screen's sides, where 0 is always this player. `net/link.ts` is the socket, pinging every second.
  - **Tests:**
    - 7 engine tests: two `ClientMatch`es and a referee play a whole match to the same result on both sides, deal the same queues, keep active ticks with the referee, show each other's last lock, never hear each other's next pieces, and send at most 15 positions a second.
    - 3 session tests over the real codec: hello and the countdown, the relayed opponent, and one ending seen from each side.
    - 3 link tests.
- **Still to do:** two browsers, which need a way into a match. The quick match of [`GD-STORY-009`](GD-STORY-009.md) is the first, so this story closes with it.


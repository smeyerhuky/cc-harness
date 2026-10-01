---
type: "Work Item"
title: "GD-STORY-012: Garbage, power-ups and showdowns over the network"
description: "The Match DO routes garbage by id with the ledger and resend, stamps power-ups for both players, and runs the showdowns and their garbage multiplier, so the fight M2 plays locally plays between two browsers (US-08, US-10, US-11)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-012: Garbage, power-ups and showdowns over the network

## Description

The roadmap's M3 todo "Match DO: … garbage routing with the ledger and resend, showdown multiplier, power-up stamping". The referee already has the rules ([`GD-TICKET-009`](GD-TICKET-009.md)). The M2 screens already show the fight ([`GD-STORY-002`](GD-STORY-002.md)).

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#playing), **US-08 Send and receive garbage**:

- Clears send rows by the attack table in the [game rules](../../product/game-rules.md), including T-spins,
  back-to-back, combos and perfect clears.
- Incoming rows wait in a meter beside my board; my clears cancel them before anything is sent.
- Rows land when I lock a piece without clearing, after a 0.5 s delay from arriving, at most 8
  rows per lock, with one hole column per attack.
- Every sent attack shows where it came from and where it went, and every landing is felt (a
  short shake and sound, and a vibration on phones that support it).

**US-10 Power-ups**:

- About 1 piece in 6 carries a gem. Clearing the row that holds it banks its power-up in my one
  slot; a gem cleared while the slot is full is lost.
- I fire a banked power-up with one key or gesture; it applies on both screens at the same moment,
  stamped by the Match DO.
- The four power-ups are Shield, Bomb, Fog and Rush, as defined in the
  [game rules](../../product/game-rules.md#power-ups).

**US-11 Showdowns**:

- A showdown is announced on both screens 5 s before it starts.
- At 1:00 of play, **Double garbage** doubles every routed attack for 15 s.
- At 2:30 of play, **Sudden death** adds 4 speed levels and doubles garbage until someone tops out.

## Linked Artifacts

- [PRD — US-08, US-10, US-11](../../product/prd.md#playing), [game rules](../../product/game-rules.md), [architecture](../../design/architecture.md)

## AI PDLC Prompt

Goal: the fight between two browsers. Read the architecture's garbage ledger and power-up stamping, and `referee.ts`. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The referee already routed
garbage through the ledger, doubled it in showdowns, and stamped power-ups ([`GD-TICKET-009`](GD-TICKET-009.md)).
[`GD-STORY-011`](GD-STORY-011.md) and [`GD-TICKET-013`](GD-TICKET-013.md) carried it over the
network. What was missing was the rival's side.

- **The rival's power-ups.** An online client simulates only its own player, so nothing reacted
  when the rival used a power-up, or when one landed on them. `OpponentView` now keeps the
  power-ups stamped to land on the rival, by the same rule `PlayerSim` uses: Shield and Bomb on
  whoever used them, Fog and Rush on the other player. It lands them on the referee's tick: the
  Bomb drops their bottom rows, and the Shield and Fog show on their board and meter.
  `ClientMatch` reports the rival's use when the stamp arrives, and the landing on its tick.
  `OnlineSession` maps both to the rival's side of the screen, so the M2 labels and shakes
  appear there.
- **The rival's landings.** A lock from the rival whose garbage count went up shakes their
  board, as it does in a local game.
- **Found on the way:** a resume re-sends both players' last locks so the views are current, and
  the client took each for a new lock, replaying the rival's clear label. A lock with the same
  piece count is now only a refresh.

Checks:

- 2 new tests:
  - ClientMatch lands the rival's Bomb, Shield and Fog on the referee's tick and not before,
    and leaves a Rush aimed at the player to the player's own simulation;
  - OnlineSession shows the rival's Shield used and landing, and each player sees it from their
    own side.
- The code gates pass: 632 unit tests, 30 Worker tests, the build.
- **The fight between two clients, on the production build** (`vite preview`). A browser played
  the engine's Bot, run as a second client from Node over a real socket, as
  [`GD-STORY-015`](GD-STORY-015.md)'s Web Worker will be. For the check, the bot fired every
  power-up it banked.
  - **Desktop:** the bot's garbage waited on the meter, then landed, each attack with its hole
    column. Each attack flew through the pulsing Referee badge. The rival's clears showed small
    on their board. Double garbage was announced at 0:55, counted down each second, and started
    at 1:00, when the bot heard `soon` and `start` too.
  - **Phone (Pixel 7, dark, reduced motion):** "Bottom 3 rows gone" on the rival's board at
    0:09 (their Bomb). "Shield up" there at 0:27, and their meter glowing for its 5 s (and
    again from 0:32, for their second).
    "Fogged for 6 s" and the fog over the player's own board at 0:34 (the bot's Fog). The
    announcement at 0:55. Each one came at the tick the bot's log shows the referee stamped it.
  - No page errors or console errors in either browser.
- **Not seen in a browser:** Sudden death at 2:30, which the browser didn't survive to. The
  referee's tests cover it, and its banner is the M2 one.

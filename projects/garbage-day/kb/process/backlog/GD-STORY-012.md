---
type: "Work Item"
title: "GD-STORY-012: Garbage, power-ups and showdowns over the network"
description: "The Match DO routes garbage by id with the ledger and resend, stamps power-ups for both players, and runs the showdowns and their garbage multiplier, so the fight M2 plays locally plays between two browsers (US-08, US-10, US-11)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
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

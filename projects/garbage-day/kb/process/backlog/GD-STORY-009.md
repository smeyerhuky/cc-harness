---
type: "Work Item"
title: "GD-STORY-009: Quick match with a stranger"
description: "One button into the Lobby DO's waiting pool with a live count, pairing into a countdown within 2 s, the bot offer after 20 s, and Cancel (US-01)."
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
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-009: Quick match with a stranger

## Description

The roadmap's M3 todo "Lobby DO quick match, waiting count, bot offer after 20 s (US-01)". Home's **Quick match** button, disabled in M2, comes alive; the app machine already has the searching and bot-offer states ([`GD-TICKET-014`](GD-TICKET-014.md)).

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-01 Quick match**:

- Given I open the game, when I press **Quick match**, then I join the waiting pool and see
  "Looking for an opponent" with a live count of players waiting.
- Given another player is waiting, when we are paired, then we both see each other's handle and
  a 3-second countdown starts within 2 s of pairing.
- Given nobody is paired within 20 s, when that time passes, then I am offered **Play a bot
  while you wait** and **Keep waiting**; choosing either keeps me in the pool unless I cancel.
- Given I am in the pool, when I press **Cancel**, then I leave the pool and return to the start.

## Linked Artifacts

- [PRD — US-01](../../product/prd.md#getting-into-a-match), [architecture — Lobby DO](../../design/architecture.md)

## AI PDLC Prompt

Goal: two strangers into one match. Read the architecture's Lobby DO section and `appMachine.ts`. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

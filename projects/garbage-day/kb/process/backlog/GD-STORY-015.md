---
type: "Work Item"
title: "GD-STORY-015: The bot as a second client in a Web Worker"
description: "A bot match runs through the Match DO like a human one, with the bot as a second client in a Web Worker, so the bot plays by the same server rules (US-03 online)."
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

# GD-STORY-015: The bot as a second client in a Web Worker

## Description

The roadmap's M3 todo "The bot as a second client in a Web Worker (US-03 online)". In M2 the bot plays inside the local referee on the main thread ([`GD-STORY-006`](GD-STORY-006.md)). Online, the bot offer in quick match ([`GD-STORY-009`](GD-STORY-009.md)) needs a bot that joins the Match DO like a person.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-03 Play a bot**:

- Given I choose **Play a bot**, then I can pick a preset (Rookie, Regular, Pro) or set **skill**
  and **speed** separately from 1 to 10, and my last choice is remembered on this device.
- Skill changes how well the bot places pieces; speed changes how fast it thinks and moves. At
  skill 10 and speed 10 the bot must beat skill 1 and speed 1 in at least 9 of 10 seeded test
  matches.
- A bot match runs through the same Match DO rules as a human match, including garbage, the
  speed-up, power-ups and showdowns.

Also: the bot's work never runs on the main thread, and the bot is labelled as a bot ([`GD-TICKET-016`](GD-TICKET-016.md)).

## Linked Artifacts

- [PRD — US-03](../../product/prd.md#getting-into-a-match), [client architecture](../../design/client-architecture.md)

## AI PDLC Prompt

Goal: the bot joins the Match DO from a Web Worker. Read `src/engine/src/bot.ts`. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

---
type: "Work Item"
title: "GD-STORY-006: Set up a bot: presets or skill and speed"
description: "Bot setup with the Rookie, Regular and Pro presets or separate skill and speed from 1 to 10, the last choice remembered on the device, and the bot playing by the same rules as a person (US-03, locally)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "active"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-001.md
  - type: DEPENDS_ON
    target: GD-STORY-007.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-006: Set up a bot: presets or skill and speed

## Description

The roadmap's M2 todo "Bot setup with presets and separate skill and speed, the skill test (US-03 locally)". The skill test already passes in the engine ([`GD-TICKET-009`](GD-TICKET-009.md), `bot.test.ts`); running the bot in a Web Worker as a second client is M3.

## Acceptance Criteria

M2 plays **locally**: `MatchSession` drives the engine's `LocalMatch` and referee in the browser, against a bot, so where the spec says "the Match DO" this story means the local referee. The same criteria hold over the network in M3.

From the [PRD](../../product/prd.md#getting-into-a-match), **US-03 Play a bot**:

- Given I choose **Play a bot**, then I can pick a preset (Rookie, Regular, Pro) or set **skill**
  and **speed** separately from 1 to 10, and my last choice is remembered on this device.
- Skill changes how well the bot places pieces; speed changes how fast it thinks and moves. At
  skill 10 and speed 10 the bot must beat skill 1 and speed 1 in at least 9 of 10 seeded test
  matches.
- A bot match runs through the same Match DO rules as a human match, including garbage, the
  speed-up, power-ups and showdowns.

## Linked Artifacts

- [PRD — US-03](../../product/prd.md#getting-into-a-match), [architecture](../../design/architecture.md) (bots)

## AI PDLC Prompt

Goal: bot setup. Read the PRD's US-03, the architecture's bot section and `src/engine/src/bot.ts` (the skill and speed mapping). Build the bot feature's `BotSetup` (presets and two sliders) on the `/bot` route, saving the choice in the preferences store, and start a local match with that bot. Test that presets map to the documented skill and speed, and that the choice survives a reload. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

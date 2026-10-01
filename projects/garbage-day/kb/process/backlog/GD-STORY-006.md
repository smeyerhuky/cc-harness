---
type: "Work Item"
title: "GD-STORY-006: Set up a bot: presets or skill and speed"
description: "Bot setup with the Rookie, Regular and Pro presets or separate skill and speed from 1 to 10, the last choice remembered on the device, and the bot playing by the same rules as a person (US-03, locally)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). **Play a bot** offers the three
presets, which start at once, and **Your own**: skill and speed sliders from 1 to 10 with their
own Play button. Whatever is played is remembered on this device and offered again: the sliders
open at it, and its preset is highlighted.

- **Presets** set skill only, as the PRD's settings table has them: Rookie 2, Regular 5, Pro 8.
  Speed is independent, and a preset plays at the speed last chosen (5 at first). The screen says
  so: "Rookie is skill 2, Regular 5, Pro 8, each at speed 5." The skill slider names a preset
  value ("5 · Regular"); the bot is named the same way in the match ("Bot · Pro",
  "Bot · skill 9").
- **Remembered:** the preferences store gains `bot` (skill and speed, default 5 and 5), checked
  on load like every other field.
- **Strength:** the engine's own test
  ([`GD-TICKET-009`](GD-TICKET-009.md)) already shows skill 10 at speed 10 beating skill 1 at
  speed 1 in at least 9 of 10 seeded matches. The bot plays through the same local referee as
  the player: garbage, the speed-up, power-ups and showdowns.

Checks: 4 new tests (a preset starting at the remembered speed and being remembered; your own
skill and speed starting a match; the store's default, range and reload), and the code gates
pass (549 unit tests, 4 Worker tests, build). In Chromium, on the production build:

- **Desktop, keyboard only:** skill raised to 9 and speed lowered to 2 with the arrow keys, then
  played: "Bot · skill 9". After a reload the sliders opened at 9 and 2, and the presets note said
  "each at speed 2".
- **Phone, Pixel 7 profile, dark, reduced motion:** the screen fits with no sideways scroll; a
  tap on Rookie started "Bot · Rookie".

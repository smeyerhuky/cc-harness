---
type: "Work Item"
title: "GD-TICKET-026: Let a bot game change the match settings"
description: "The PRD lets a player who plays a bot change the match settings (Mode and the speed-up interval), but bot setup offers only skill and speed; reuse the private game's settings form there."
resource: "../coverage-audit.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-010.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-026: Let a bot game change the match settings

## Description

Found by the [coverage audit of the M2 exit](../coverage-audit.md). The [PRD's match settings](../../product/prd.md#match-settings) say: "A player who creates a game or plays a bot can change them." US-03, which `GD-STORY-006` quoted, names only skill and speed, so bot setup offers only those. Nothing carried Mode or the speed-up interval for a bot game. The engine already takes them (`LocalMatch`'s `rules`, and the classic-rules golden replay). The settings form arrives with private games ([`GD-STORY-010`](GD-STORY-010.md)), so this item reuses it.

## Acceptance Criteria

- Bot setup offers the match settings that apply to a bot game, with the PRD's defaults and
  ranges: Mode (Standard · Classic) and Speed-up every (10 · 15 · 20 · 30 s). The pause settings
  join once pauses exist (M4).
- The bot match plays by them: Classic has no gems, power-ups or showdowns, and the speed rises
  at the chosen interval.
- The choice is remembered with the bot's skill and speed.

## Linked Artifacts

- [PRD — match settings](../../product/prd.md#match-settings), [`GD-STORY-006`](GD-STORY-006.md)

## AI PDLC Prompt

Goal: a bot game with the player's own settings. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

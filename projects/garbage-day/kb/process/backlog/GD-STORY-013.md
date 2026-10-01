---
type: "Work Item"
title: "GD-STORY-013: The speed-up on the Match DO's clock"
description: "Clock sync between each client and the Match DO, and speed levels that rise on the DO's active-play clock for both players at once (US-09)."
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

# GD-STORY-013: The speed-up on the Match DO's clock

## Description

The roadmap's M3 todo "Clock sync and active-time speed levels across two clients (US-09)". Locally the referee's clock is the browser's. Online both clients must agree with the DO's clock.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#playing), **US-09 The game speeds up**:

- Speed rises one level every 15 s of active play (the setting), for both players at once, on
  the Match DO's clock; time spent paused does not count.
- My current speed level and the progress to the next are always visible.

## Linked Artifacts

- [PRD — US-09](../../product/prd.md#playing), [architecture — clock sync](../../design/architecture.md)

## AI PDLC Prompt

Goal: one clock for both players. Read the architecture's clock-sync section. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

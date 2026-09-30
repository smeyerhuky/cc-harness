---
type: "Work Item"
title: "GD-STORY-004: Play with swipes and taps on a phone"
description: "Touch play by the gesture table: swipes move column by column, tap rotates, slow drag soft-drops, flick hard-drops, swipe up holds, a power-up button in thumb reach, a sensitivity setting, the optional button pad and haptics (US-17)."
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

# GD-STORY-004: Play with swipes and taps on a phone

## Description

The roadmap's M2 todo "Touch gestures per the gesture table, the optional button pad, haptics (US-17)". The visual feedback for gestures is [`GD-TICKET-015`](GD-TICKET-015.md).

## Acceptance Criteria

Quoted verbatim. Tap on the left third of the board rotates counter-clockwise (PRD open question 1, confirmed).

From the [PRD](../../product/prd.md#controls-and-layout), **US-17 Gestures on a phone**:

- Swipe left or right moves the piece, following my finger one column per step.
- Tap rotates.
- Dragging down slowly soft-drops the piece row by row with my finger; a quick downward flick
  hard-drops it.
- Swipe up holds. A power-up button stays within thumb reach.
- The full map, thresholds and sensitivity setting are in
  [controls and layout](../../product/controls-and-layout.md#touch-gestures).
- An on-screen button pad is available as a setting for players who prefer it.

## Linked Artifacts

- [PRD — US-17](../../product/prd.md#controls-and-layout), [controls and layout — touch gestures](../../product/controls-and-layout.md#touch-gestures)
- [Client architecture — input](../../design/client-architecture.md#input), [`GD-TICKET-015`](GD-TICKET-015.md)

## AI PDLC Prompt

Goal: touch play. Read `kb/product/controls-and-layout.md` ("Touch gestures") and `kb/design/client-architecture.md` ("Input": axis lock after 12 px, a column per cell of travel). Build `useGestures` in `ui` and the match feature's `TouchSurface` and `ButtonPad`, with `useHaptics`. Drive each gesture in component tests with synthetic pointer events. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

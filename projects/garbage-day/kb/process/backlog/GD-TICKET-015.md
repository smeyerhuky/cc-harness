---
type: "Work Item"
title: "GD-TICKET-015: Touch visual feedback"
description: "Show the UI language's touch feedback: a direction arrow once a drag locks to an axis, a streak on a flick, and an arc on the tapped side for a rotate, all off with reduced motion."
resource: "../coverage-audit.md"
tags: ["backlog", "UI"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-015: Touch visual feedback

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the UI language's "Touch
feedback" section was carried by no todo (the M2 gesture todo names haptics only).

## Acceptance Criteria

- A faint arrow shows the direction once a drag locks to an axis; a flick leaves a short streak
  above the landing spot; a tap-rotate shows a small arc on the tapped side.
- All three are off with reduced motion, leaving the piece's own movement as the feedback.
- Component tests drive each gesture and assert the feedback element appears and clears.

## Linked Artifacts

- [UI language — touch feedback](../../design/ui-language.md#touch-feedback),
  [controls and layout — touch gestures](../../product/controls-and-layout.md#touch-gestures)

## AI PDLC Prompt

Goal: add touch visual feedback. Read `kb/design/ui-language.md` ("Touch feedback", "Motion") and
`kb/product/controls-and-layout.md` ("Touch gestures"). Implement in the `ui` package beside
`useGestures` and in the match feature's `TouchSurface`, with tests. Done when the criteria hold,
the code and KB gates pass, this item is `done` with a Resolution, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done with [`GD-STORY-004`](GD-STORY-004.md) in [the scaffold session](../journal/2026-09-30-scaffold.md).
`TouchSurface` shows what `GestureRecognizer` reports as feedback: a faint arrow (← → ↓ ↑) where
a drag locks to an axis, a short streak in the flicked column above where the piece lands, and a
small arc (↺ or ↻) beside a tap, on the side that was tapped. Each fades in under half a second
and is removed when its animation ends. Under reduced motion none is drawn; the piece's own
movement is the feedback. Component tests drive the gestures with pointer events and check that
each mark appears and clears, and that none appears under reduced motion; the Chromium touch run
in `GD-STORY-004`'s Resolution saw all four marks. The streak is drawn in the finger's column
from above the board's middle, not measured from the landing piece.

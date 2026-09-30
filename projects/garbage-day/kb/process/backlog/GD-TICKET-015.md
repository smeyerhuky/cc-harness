---
type: "Work Item"
title: "GD-TICKET-015: Touch visual feedback"
description: "Show the UI language's touch feedback: a direction arrow once a drag locks to an axis, a streak on a flick, and an arc on the tapped side for a rotate, all off with reduced motion."
resource: "../coverage-audit.md"
tags: ["backlog", "UI"]
timestamp: "2026-09-30"
state: "open"
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

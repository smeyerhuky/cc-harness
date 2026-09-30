---
type: "Work Item"
title: "GD-STORY-005: Screens that fit: desktop space and phone boards"
description: "The match layouts: on wide screens both boards fill the window's height with side panels and the live feed at 1600 px and up; on phones my board fills the screen in portrait and sits beside the opponent's in landscape; no scroll, zoom or pull-to-refresh, and the screen stays awake (US-18, US-19)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "open"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-002.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-005: Screens that fit: desktop space and phone boards

## Description

The roadmap's M2 todo "Desktop layout including the match feed at ≥ 1600 px, phone portrait and landscape, no scrolling during a match, wake lock (US-18, US-19)".

## Acceptance Criteria

Quoted verbatim.

From the [PRD](../../product/prd.md#controls-and-layout), **US-18 Desktop uses the space**:

- On wide screens both boards grow to fill the height of the window without scrolling, with
  side panels for hold, next pieces, power-up, stats and a live match feed, as described in
  [controls and layout](../../product/controls-and-layout.md#layout).

**US-19 Phone layout**:

- In portrait my board fills most of the screen and my opponent's is a smaller board beside it;
  in landscape they sit side by side. The page never scrolls, zooms or pulls to refresh during a
  match, and the screen stays awake.

## Linked Artifacts

- [PRD — US-18, US-19](../../product/prd.md#controls-and-layout), [controls and layout — layout](../../product/controls-and-layout.md#layout)
- [UI language — layouts](../../design/ui-language.md#layouts)

## AI PDLC Prompt

Goal: the match layouts. Read `kb/product/controls-and-layout.md` ("Layout") and `kb/design/ui-language.md` ("Layouts"). Build `StageLayout`'s breakpoints, the `MatchFeed`, and `useWakeLock`; stop scrolling, zooming and pull-to-refresh during a match. Check with Playwright screenshots at phone portrait, phone landscape, 1280 px and 1920 px, light and dark. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

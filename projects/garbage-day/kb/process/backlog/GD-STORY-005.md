---
type: "Work Item"
title: "GD-STORY-005: Screens that fit: desktop space and phone boards"
description: "The match layouts: on wide screens both boards fill the window's height with side panels and the live feed at 1600 px and up; on phones my board fills the screen in portrait and sits beside the opponent's in landscape; no scroll, zoom or pull-to-refresh, and the screen stays awake (US-18, US-19)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The match screen takes one of
three arrangements, picked by `useMatchLayout` from the window's shape. CSS sizes within each,
and none ever scrolls.

- **Desktop** (anything that isn't a phone): both boards grow with the window up to 36 px cells
  (`BoardCanvas` gains `maxCell`), and each board's side panel and meter hug it. A board's box
  takes the board's own 1:2 shape, and at the cap the row stops at the board's height, centred,
  with the live stats right under it. At 1600 px and wider, **the match feed** (`MatchFeed`)
  lists attacks, cancels, shield blocks, power-ups, showdowns and top-outs with the match clock,
  newest first. It isn't announced to screen readers, which already hear the player's own labels.
- **Phone upright** (`(orientation: portrait) and (max-width: 767px)`): there's no centre column.
  The clock and speed move into the header on a small dark stage pill, so they keep their
  contrast on a light page. Hold, power-up and next pieces sit in a 44 px column, my board takes
  the rest, and the rival's board and meter take 27% of the width. The countdown shows over my
  board, and there are no live stats.
- **Phone on its side** (`(orientation: landscape) and (max-height: 540px)`): the desktop
  arrangement without stats or feed, the boards at equal size. The power-up button floats in the
  bottom corner rather than taking a row of height.
- **Held still:** a locked `ScreenFrame` marks the page root `data-locked`, which the generated
  `tokens.css` turns into `overflow: hidden; overscroll-behavior: none` (pull-to-refresh belongs
  to the root scroller). The board's touch surface already stops pinch and scroll.
  **`useWakeLock`** keeps the screen awake while a match runs and lets it go when it ends.
- `StageLayout` takes the arrangement as `layout` (`data-layout`). Without it, it still follows
  the window's shape, as the gallery uses it.

Checks: 7 new tests (the layout choice, the feed's wording for every moment and its order and
cap, the stage's arrangement, the locked page root, the cell cap, and a match taking and
releasing the wake lock), and the code gates pass (545 unit tests, 4 Worker tests, build).
Playwright screenshots of a match against Regular, 9 s in, on the production build:

| Window | My board | Rival's board | Scroll | Feed |
|---|---|---|---|---|
| Pixel 7 upright (412 × 915), light and dark | 210 × 420 | 90 × 180 | none | — |
| Pixel 7 on its side (915 × 412), light and dark | 160 × 320 | 160 × 320 | none | — |
| 1280 × 800, light and dark | 330 × 660 | 330 × 660 | none | — |
| 1920 × 1080, light and dark | 360 × 720 (36 px cap) | 360 × 720 | none | shown |

The screenshots found and fixed four problems on the way:

- At the 36 px cap the meters floated 60 px from their boards.
- The upright side column was too narrow for its captions.
- The header's speed chip was nearly invisible on the light page.
- The header wrapped onto two lines.

Upright, my board fills about half the width and height. The rival's board beside it at about a
third of the width (the spec's own arrangement) is what limits it, since a board is twice as tall
as it is wide. The touch runs of [`GD-STORY-004`](GD-STORY-004.md) used the same profile with
reduced motion.

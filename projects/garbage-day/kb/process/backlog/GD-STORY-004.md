---
type: "Work Item"
title: "GD-STORY-004: Play with swipes and taps on a phone"
description: "Touch play by the gesture table: swipes move column by column, tap rotates, slow drag soft-drops, flick hard-drops, swipe up holds, a power-up button in thumb reach, a sensitivity setting, the optional button pad and haptics (US-17)."
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md), with
[`GD-TICKET-015`](GD-TICKET-015.md) (the gestures' feedback). On a phone the player's board is
the touch surface: drag sideways to move a column per cell, tap to rotate (the left third turns
the other way), drag down to soft-drop row by row, flick down to hard-drop, swipe up to hold.

- **The gesture table as code:** `GestureRecognizer` in `ui` (`hooks/useGestures.ts`) is the
  table, fed positions and times: axis lock after 12 px, a tap within 200 ms and 10 px, a flick
  above 1.2 px per ms over the last 80 ms, a swipe up of 1.5 cells, all scaled by sensitivity.
  `useGestures` feeds it pointer events, one finger at a time. Tests drive every row of the table.
- **Into the same input as the keyboard:** `InputController` gains `nudge` (a column per tick, so
  a fast swipe across three columns moves three), `drop` (rows down), and `press` (rotate, hold,
  hard drop, power-up).
- **A new engine input, `drop`**: rows to move down this tick, stopping where the piece lands,
  with gravity's rules for the lowest row. The engine's soft drop is a held speed-up, which can't
  follow a finger row by row. The client runs each player's simulation and the wire carries
  messages, not inputs, so the protocol and the golden replays are unchanged (they still pass).
- **`TouchSurface`** covers the board with `touch-action: none`, so nothing scrolls, zooms or
  pulls to refresh under a finger. The **power-up button** is round, in the thumb zone below the
  stage, on touch screens only, and only while a power-up is banked. The **button pad** (Hold, ↺,
  ↻, Power, ←, ↓, →, Drop) acts while a key is held, so moves and soft drop repeat as on a
  keyboard.
- **Settings → Touch:** gestures on or off, sensitivity from 50% to 200% in quarter steps, and
  the pad. Turning gestures off turns the pad on, as the controls page says; the player can turn
  it off again.
- **Haptics:** 10 ms on a lock, 20 ms on a hard drop, and 30 ms when garbage lands, where the
  device supports vibration.

Checks: 23 new tests, shared with `GD-TICKET-015` (the gesture table 8, the touch surface,
feedback, pad and power button 6, touch preferences 4, the settings section 2, the engine's
`drop` 2, touch input 1), and the code gates pass (538 unit tests, 4 Worker tests, build). In
Chromium with the Pixel 7 profile, on the production build, with real touch events through the
DevTools protocol:

- A tap rotated the I piece upright, a drag moved it three columns right, a slow drag brought it
  down with the finger, a flick hard-dropped it, and a swipe up put the next piece in Hold, all
  confirmed on screenshots. Each left its mark (↻, →, ↓, the streak, ↑). The page stayed at scroll
  0 and zoom 1, with no errors.
- A scripted flick first failed, because this sandbox delivers each touch about 65 ms after the
  last and the lift 50 ms after the final move: a finger that stopped before lifting, which the
  table rightly calls a drag. Sent back to back, as a real flick's events arrive, it hard-dropped.
- Gestures off in Settings turned the pad on. In a match, with reduced motion, the pad's
  ↻, ←, ← and Drop moved and dropped the piece, the board had no touch surface, and nothing
  scrolled.
- Not checked on a physical phone, where timing and vibration are real; the owner's try on the
  Worker Preview is the check.
- The phone layout itself (a small board, stats wrapping) is [`GD-STORY-005`](GD-STORY-005.md).

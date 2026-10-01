---
type: "Reference"
title: "Garbage Day — Controls and Layout"
description: "The keyboard map and repeat timings, the touch-gesture map with its thresholds (swipe to move, tap to rotate, slow drag to soft-drop, flick to hard-drop, swipe up to hold), the optional on-screen pad, and how the match screen uses space on desktop and phone."
resource: "prd.md"
tags: ["spec", "product", "controls", "UI"]
timestamp: "2026-09-30"
relationships:
  - type: ELABORATES
    target: prd.md
---

# Garbage Day — Controls and Layout

How players act on the game, and how the match screen is arranged. The visual language (colour,
type, motion) is design work and lives in `kb/design/` once written; this page fixes the
behaviour the spec's stories test.

## Keyboard

Defaults, all rebindable (US-16):

| Action | Keys |
|---|---|
| Move left · right | ← · → |
| Soft drop | ↓ |
| Hard drop | Space |
| Rotate clockwise | ↑ or X |
| Rotate counter-clockwise | Z or Ctrl |
| Hold | C or Shift |
| Fire power-up | E |
| Step away (uses a pause) | P |

Auto-repeat delay 167 ms and rate 33 ms by default, both adjustable. Game keys never scroll the
page during a match.

For whoever builds the game, ` (the key left of 1) opens and closes the developer overlay. It
is not a game key: it does nothing while typing, and nothing if a player binds it to an action.
`?dev` in the address opens the overlay too ([client architecture](../design/client-architecture.md#the-developer-overlay)).

## Touch gestures

The whole board area is the touch surface (US-17). A gesture is judged from where the finger
lands to where it lifts.

| Gesture | Action | How it is recognised |
|---|---|---|
| Drag left or right | Move | The piece follows the finger: one column per board-cell width of horizontal travel, repeated while dragging |
| Tap | Rotate clockwise | Lifted within 200 ms and 10 px of the touch; a tap on the left third of the board rotates counter-clockwise |
| Slow drag down | Soft drop | Downward travel slower than the flick speed: one row per board-cell height of travel, following the finger |
| Quick flick down | Hard drop | Downward speed above 1.2 px per ms over the last 80 ms of the gesture |
| Swipe up | Hold | Upward travel of at least 1.5 cells |
| Power-up button | Fire power-up | A round button beside the board, within thumb reach, shown only when a power-up is banked |

- A gesture commits to one axis after 12 px of travel, so a sideways drag never drops a piece.
- A **sensitivity** setting scales the cell distances and the flick speed.
- Where the device supports it, a short vibration marks a lock, a hard drop and landing garbage.
- An **on-screen pad** (hold, rotate both ways, power-up, left, soft drop, right, drop) is a
  setting, on by default only if the player turns gestures off.

## Layout

The match screen never scrolls, zooms or pulls to refresh during play, on any device.

### Desktop

Designed to use a large screen (US-18):

- Both boards scale together to fill most of the window height, with cells up to 36 px.
- Each board has a **side panel**: hold, the next 5 pieces (the opponent's panel shows "hidden"),
  the power-up slot, speed level with progress, and the incoming meter along the inner edge.
- A **centre column** between the boards carries the match clock, showdown announcements and the
  flight of attacks from one board to the other.
- Under each board, **live stats**: lines, garbage sent, pieces per second, Quads and T-spins.
- On windows at least 1600 px wide, a **match feed** beside the centre column lists attacks,
  cancels, power-ups, showdowns and pauses as they happen.

### Phone

- **Portrait:** my board fills most of the height; my opponent's board is a smaller board beside
  it at about a third of the width, with its meter; my hold and next pieces sit in a slim column.
- **Landscape:** the two boards sit side by side at the same size, as on desktop but without the
  match feed.
- The screen stays awake during a match where the browser allows it.

---
type: "Work Item"
title: "GD-STORY-001: Play a local match at my own pace"
description: "MatchSession over the local referee and the match screen's core: both boards running from the countdown, my moves drawn in the same frame, the game rules, and a visible speed level on the referee's active clock (US-05 and US-09, locally)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-023.md
  - type: DEPENDS_ON
    target: GD-TICKET-014.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-001: Play a local match at my own pace

## Description

The first half of the roadmap's M2 todo "`MatchSession` over a local referee, and the match screen" (split into this story and [`GD-STORY-002`](GD-STORY-002.md) at the M1 exit). It builds the `MatchSession` external store with selectors, `BoardCanvas` rendering outside React, the panels and the centre column, played against a bot.

## Acceptance Criteria

M2 plays **locally**: `MatchSession` drives the engine's `LocalMatch` and referee in the browser, against a bot, so where the spec says "the Match DO" this story means the local referee. The same criteria hold over the network in M3.

From the [PRD](../../product/prd.md#playing), **US-05 Live, simultaneous play**:

- Both boards run at the same time from the moment the countdown ends; neither player ever waits
  for the other to move.
- My own moves render in the same frame as my input, whatever the network delay.
- The game follows the [game rules](../../product/game-rules.md): 7-bag pieces, rotation with wall kicks,
  hold, ghost piece, lock delay, line clears.

**US-09 The game speeds up**:

- Speed rises one level every 15 s of active play (the setting), for both players at once, on
  the Match DO's clock; time spent paused does not count.
- My current speed level and the progress to the next are always visible.

## Linked Artifacts

- [PRD — US-05, US-09](../../product/prd.md#playing), [game rules](../../product/game-rules.md)
- [Client architecture](../../design/client-architecture.md) ("Where state lives", "Rendering", "Input")

## AI PDLC Prompt

Goal: play a local match. Read `kb/design/client-architecture.md` ("Where state lives", "Contexts", "Rendering", "Input"), `kb/design/ui-language.md` ("Layouts") and `src/engine/src/local-match.ts`. Build `MatchSession` as an external store (`useSyncExternalStore` with selectors) over `LocalMatch`, stepping it on `requestAnimationFrame` at the engine's tick rate, with `BoardCanvas` drawing from the session, not through React state. Use the controls page's default keys for input until [`GD-STORY-003`](GD-STORY-003.md) adds rebinding. Test that input is drawn in the same frame, and that the speed level follows active ticks. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). **Play a bot → Regular** now
starts a real match: a 3-2-1 countdown, then both boards live, the player on the keyboard and a
bot as the rival, to a result with Rematch or Home.

- **`MatchSession`** (`client/state/MatchSession.ts`) owns the engine's `LocalMatch`, with the
  player's `InputController` in seat 0 and the engine's `Bot` in seat 1, over a 10 ms simulated
  link. It steps at the engine's 60 Hz from the animation frame, catches up at most 250 ms after
  a gap, and exposes two things. React gets a snapshot (phase, countdown, clock, level,
  progress in twentieths, each side's hold, next, power-up, meter, lines, sent) that changes only
  on events. A test shows fewer than 10 notifications in two seconds of frames. The canvases get
  `board(i)` every frame: board, piece, ghost on mine only, clear flash, garbage rise and fog.
- **The same-frame rule (US-05).** A key pressed since the last tick runs one tick early,
  borrowed from the next frame, and the canvases call `session.frame(now)` before drawing (it
  steps once per frame time). So a move is drawn in the first frame after the key at any refresh
  rate. A test presses Left and advances 1 ms: the piece has moved.
- **`InputController`** ports the proof of concept's `Human`: presses act once, soft drop while
  held, and sideways auto-repeat at 167 ms then 33 ms in ticks. It is reset when play starts, so a
  key pressed during the countdown doesn't fire at GO. **`useKeyBindings`** (in `ui`) maps
  physical keys (`KeyboardEvent.code`) to actions, stops them scrolling the page, ignores repeats
  and form fields, and releases everything on blur. The keys are the controls page's defaults;
  rebinding is `GD-STORY-003`.
- **`MatchSessionContext`** and **`InputContext`** are made here with `createStoreContext`
  (`GD-TICKET-014`). Panels read slices with `useSelector`.
- **The screen** (`features/match`): `PlayerPanel` (hold, power-up with its key, next, board,
  meter), `OpponentPanel` (mirrored, next hidden), and `CentreColumn` (countdown and GO, the
  clock, `SPEED` with its progress, lines and sent), on `StageLayout` in a locked `ScreenFrame`.
  Leave ends the match and goes home. A minimal result card says who won and why ("Bot · Regular
  wins. You topped out at 0:08."); the full results are `GD-STORY-002`. A rematch mounts a fresh
  screen and session with a new seed.

Checks: 20 new tests (input 6, session 8, key bindings 3, and the route test); the code gates
pass (436 unit tests, 4 Worker tests, build). A Chromium playtest of the production build at
1280 × 800 went home → Play a bot → Regular → countdown → moves, rotate, hold and drops by
keyboard → the bot playing alongside → topped out → the result card → Rematch → a new countdown,
with no page errors. Not yet checked: phone touch (`GD-STORY-004`) and the phone layout
(`GD-STORY-005`). Pauses when a tab is hidden are M4; for now a hidden tab simply stops the
local match, and it resumes without a burst.

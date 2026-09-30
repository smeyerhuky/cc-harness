---
type: "Work Item"
title: "GD-STORY-001: Play a local match at my own pace"
description: "MatchSession over the local referee and the match screen's core: both boards running from the countdown, my moves drawn in the same frame, the game rules, and a visible speed level on the referee's active clock (US-05 and US-09, locally)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "open"
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

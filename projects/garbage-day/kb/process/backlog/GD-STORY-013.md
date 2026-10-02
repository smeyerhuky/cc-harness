---
type: "Work Item"
title: "GD-STORY-013: The speed-up on the Match DO's clock"
description: "Clock sync between each client and the Match DO, and speed levels that rise on the DO's active-play clock for both players at once (US-09)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md).

- **The gap.** Each client counted its own active ticks, which set the speed level and the match
  clock. A player frozen by a drop the referee never noticed lost that time, up to 5 s, and
  levelled up that much later than the other player. So did a browser that stalled: its ticks
  fell behind the referee's, and stamped power-ups and resumes landed late there too.
- **The clock.** While a match runs, the Match DO's 1-second clock now also sends both players
  `clock` (new in the protocol and the engine's messages): the referee's tick and active time.
  `ClientMatch` takes its active time from it, counted on to its own tick while the player
  plays; a difference of 3 ticks or less is left alone, so the level can't flicker at a
  boundary. A client half a second or more behind the referee's tick jumps there without
  simulating the gap.
- **A design change.** The architecture planned for clients to measure their clock offset with
  pings. That can't work: the auto-response answers a ping with a fixed `pong`, without waking
  the DO, so it carries no server time. The built design is simpler. A client sets its tick at
  `start` and runs one trip behind the referee, for every stamped tick alike, and `clock`
  corrects any drift. The [architecture](../../design/architecture.md#time-the-match-clock)
  says so now.
- The level and its progress were already always visible (the speed chip). Local matches and the
  golden replays don't use `clock`.

Checks:

- **Engine:** 4 new tests, with the test harness sending `clock` each second as the DO does.
  - Active time agrees with the referee's after a drop it never noticed, and after one that
    paused both. The two players' levels agree.
  - A stalled client, whose messages wait as a busy browser's do, jumps to the referee's tick
    on the next clock, and placed no pieces in the gap.
  - A client that keeps time is left alone.
  - With the sync disabled, the first three fail.
- **Protocol and Worker:** `clock` round-trips the codec, and a Worker test hears it on both
  sockets once play starts, a second apart.
- The code gates pass: 636 unit tests, 31 Worker tests, the build.
- **Two browsers on the production build** (a desktop and a Pixel 7 profile), paired by quick
  match. The phone went offline for 3 s, too short for the referee to notice. Its match clock
  stood at 0:03 while the desktop's read 0:06. Once it was back, both read 0:10, then the same
  each second, and both turned to speed 2 between 0:14 and 0:16.

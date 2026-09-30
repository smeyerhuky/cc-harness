---
type: "Work Item"
title: "GD-TICKET-009: Port the referee, bot and local match, with golden replays"
description: "Port the proof of concept's MatchDO rules as the engine Referee, its Bot with skill and speed settings, and its Match harness as LocalMatch; add golden replay tests (bot vs bot and scripted interruptions) that check board hashes, results, tick counts and messages per minute."
resource: "../../design/architecture.md"
tags: ["backlog", "engine"]
timestamp: "2026-09-30"
state: "open"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../../design/architecture.md
  - type: DEPENDS_ON
    target: GD-TICKET-008.md
---

# GD-TICKET-009: Port the referee, bot and local match, with golden replays

## Description

The rest of the engine: the match and presence rules the Match DO will wrap, the bot, and a local
harness with the latency model, so solo play (M2) and online play (M3) share one tested rulebook.

## Acceptance Criteria

- `Referee` implements every rule in `kb/product/pause-and-presence.md` and the showdown, dealing
  and routing rules in `game-rules.md`, with the Match, Presence and Showdown machines from
  `architecture.md`, and is serializable to and from a snapshot.
- `Bot` takes skill and speed from 1 to 10 mapped as in `architecture.md` ("Bots"); a test shows
  skill 10 / speed 10 beating skill 1 / speed 1 in at least 9 of 10 seeded matches (US-03).
- `LocalMatch` runs two clients and a referee over the latency model, headless.
- Golden replays: at least 8 seeded bot matches and one scripted with every interruption (as in
  `spikes/proof-of-concept/live/test-live.js`) are stored as golden files; the test replays each
  twice and compares final board hashes, result, tick count and messages per minute.
- Code gates pass.

## Linked Artifacts

- Source to port: `spikes/proof-of-concept/live/live-engine.js` (`MatchDO`, `Bot`, `Match`),
  `test-live.js`, `pick.js`
- [Pause and presence rules](../../product/pause-and-presence.md), [architecture](../../design/architecture.md)

## AI PDLC Prompt

Goal: port the referee, bot and local match with golden replays. Read
`kb/product/pause-and-presence.md`, `kb/product/game-rules.md` ("Garbage", "Showdowns",
"Power-ups"), `kb/design/architecture.md` ("State machines", "Garbage ledger and reconnects",
"Presence and pauses", "Bots", "Cost per match") and the proof of concept's `MatchDO`, `Bot`,
`Match`, `test-live.js`. Put the code in `projects/garbage-day/src/engine/src/`; golden files in
`src/engine/test/golden/` with a script to regenerate them on purpose. Run the code gates. Done
when the criteria hold, the KB gates pass, this item is `done` with a Resolution, the backlog
index and roadmap agree, and the journal records it.

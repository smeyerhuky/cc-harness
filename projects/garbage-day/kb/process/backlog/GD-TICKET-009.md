---
type: "Work Item"
title: "GD-TICKET-009: Port the referee, bot and local match, with golden replays"
description: "Port the proof of concept's MatchDO rules as the engine Referee, its Bot with skill and speed settings, and its Match harness as LocalMatch; add golden replay tests (bot vs bot and scripted interruptions) that check board hashes, results, tick counts and messages per minute."
resource: "../../design/architecture.md"
tags: ["backlog", "engine"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). New in `src/engine/src/`:

- **`referee.ts`**: `Referee`, ported from the proof of concept's `MatchDO`. It deals, relays,
  routes garbage through the acknowledgement ledger, stamps power-ups and runs showdowns. It
  also applies every pause and presence rule: the budget, free reconnects on 5 s of silence,
  extend, timeout forfeit, 15 s grace with no pauses left, the both-away session timer, leaving,
  and rejoin with garbage resent. It keeps the Match, Presence and Showdown states. It
  serializes to a JSON snapshot (`snapshot()` / `Referee.restore()`), and the dealer is rebuilt
  from the seed. 24 tests, one or more per rule. One of them restores a snapshot taken
  mid-pause, runs on, and checks the result is identical to the original.
- **`bot.ts`**: `Bot` and `botConfig(skill, speed)`, with the 1–10 settings as literal tables
  (no `Math.pow`). Skill 10 / speed 10 beat skill 1 / speed 1 in 10 of 10 seeded matches; the
  test requires at least 9 (US-03).
- **`local-match.ts`**: `LocalMatch`, the proof of concept's `Match`: two `PlayerSim`s and a
  referee over the latency model, headless, with `away`, `back`, `send`, `later` and scripts.
- **Golden replays** (`golden.test.ts`, files in `src/engine/test/golden/`): 8 seeded bot
  matches across skill and speed settings, one classic-rules match, and one with every
  interruption. The last covers a hidden tab with an extension, a dropped connection, a closed
  and rejoined tab, both players away, and a grace return. Each runs twice and must equal
  its file: result, tick counts, board hashes, stats, message counts, messages per minute
  (990–1,720 a minute in bot matches) and the referee's timeline.
  `pnpm --filter @garbage-day/engine golden:update` regenerates them.

Also: an ESLint rule set enforces the determinism contract in `src/engine/src/`. It forbids the
clock, `Math.random`, `Math.pow` and the other engine-dependent `Math` functions, and `**`. It is
proven to fire on a sample file.

Differences from the proof of concept:

- Results carry a reason code (`topout`, `timeout`, `grace`, `left`, `left-while-paused`,
  `abandoned`) and the player it is about, not a sentence, and the match feed's sentences became
  typed events. The UI will word them.
- While paused the referee relays nothing about either board, as the architecture's "hidden
  boards" says (the proof of concept kept relaying), and on resume it re-sends each player's last
  lock.
- The bot's "Tetris-seeking" style is called `fourLine`.

The browser half of M1's exit check (replays identical "in Node and the browser") was carried by
no item; it is [`GD-TICKET-019`](GD-TICKET-019.md).

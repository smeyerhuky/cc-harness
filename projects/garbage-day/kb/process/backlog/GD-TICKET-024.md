---
type: "Work Item"
title: "GD-TICKET-024: Add the developer overlay, off by default"
description: "A developer overlay, off by default, that shows the wire log and the app and match machines' states, replacing the proof of concept's explainer sections; the only place Durable Object and WebSocket may be named."
resource: "../../design/client-architecture.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-001.md
  - type: DERIVED_FROM
    target: ../../design/client-architecture.md
---

# GD-TICKET-024: Add the developer overlay, off by default

## Description

The last M2 todo on the [roadmap](../roadmap.md) names it beside US-20. The
[client architecture](../../design/client-architecture.md#what-carries-over-from-the-proof-of-concept),
the [UI language](../../design/ui-language.md#what-changes-from-the-demos) and the
[architecture](../../design/architecture.md) replace the demo's explainer sections (engine room,
wire log, quizzes) with a developer overlay, off by default. The UI language keeps "Durable
Object" and "WebSocket" out of every other screen.

## Acceptance Criteria

- The overlay is off by default. It opens with a documented key and a query parameter, and the
  choice persists only for the session.
- It shows the wire log (each message in and out, with its type and tick) and the current states
  of `appMachine` and the match session. In M2 the local referee's messages stand in for the
  network.
- It loads lazily, so the home screen's bundle doesn't include it, and it has no effect on
  gameplay timing.
- A test opens and closes it and checks the log records messages. The code gates pass.

## Linked Artifacts

- [Client architecture](../../design/client-architecture.md),
  [UI language — what changes from the demos](../../design/ui-language.md#what-changes-from-the-demos),
  [architecture](../../design/architecture.md)

## AI PDLC Prompt

Goal: add the developer overlay. Read the linked sections, then `LocalMatch`'s `wire` option in
`src/engine/src/local-match.ts`, which already passes every message through a hook. Build the
overlay as a lazily loaded feature in `src/app/client/`, fed by `MatchSession` and the app
actor. Run the code gates. Done when the criteria hold, the KB gates pass, this item is `done`
with a Resolution, the backlog index and roadmap agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The overlay opens over any
screen with ` (the key left of 1) or `?dev` in the address. It lasts for the tab's session.
It shows `appMachine`'s state, the match session's, and the wire log
([client architecture](../../design/client-architecture.md#the-developer-overlay)).

- **The switch:** `useDev` (`state/dev.ts`), a small Zustand store, kept in `sessionStorage`.
  - `?dev` opens it, and `?dev=0` closes it. The address wins over the session's last choice.
  - The key does nothing while typing in a field, with Ctrl, Alt or Meta held, or when the player has bound it to a game action.
  - It is in the [controls](../../product/controls-and-layout.md#keyboard) beside the keyboard map.
- **The wire log:**
  - The engine's `LocalMatch` `wire` hook now also says which player's connection a message is on (an added argument; the protocol's round-trip test is unchanged).
  - `MatchSession` always passes its messages through the hook unchanged. Only while something listens does it hand each one on as a `WireEntry`: direction, seat, tick and message.
  - The overlay's `WireLog` listens only while shown, and keeps the newest 200 messages. It keeps them in two buffers, so positions and heartbeats (several a second) don't push out the rest.
  - The view refreshes at most every 250 ms. Each row shows its tick, its route ("You → Referee", "Referee → Rival"), its type, and a one-line summary of its fields. The whole message is in the row's tooltip.
- **States:**
  - `appMachine`: its state, mode, bot, and match counter.
  - The match session: phase, tick, clock, level, the referee's state, a showdown, and the result.
  - With no match on screen, it says so.
- **No effect on play:**
  - Messages pass through unchanged.
  - A test plays two sessions with the same seed, one listened to and one not. Their boards and ticks match.
  - The session steps by the clock.
  - When the log stops listening, the session stops telling it.
- **Lazy:** the overlay is its own chunk (`dev-*.js`, 2.9 KB gzipped), fetched only when switched on. The first page grew by about 1 KB for the switch and the screen-name shell. It doesn't contain the overlay or its words: "Durable Object" and "WebSocket" appear only in the overlay's chunk, in its one note on where the referee runs online.
- **Found while working:** the panel's first shadow copied the result card's literal
  `rgb(0 0 0 / 0.4)`, against the definition of done's rule that colours come from tokens. A
  search found 17 such rules already in the `ui` commons and the match screen. The overlay's
  shadow was dropped (its border is enough), and the rest became
  [`GD-TICKET-025`](GD-TICKET-025.md), since they lie outside this item's files.
- **Accessible:**
  - It is a labelled `complementary` region with a captioned table.
  - It joins the axe scan over a match with positions shown, in both themes, with no violations.

Checks:

- 14 new unit tests:
  - the address and session rules;
  - the key, and when it does nothing;
  - attaching and detaching a match;
  - the wire hook's seats and ticks, and play matching with and without a listener;
  - the log's refresh, buffers and stopping;
  - the summaries;
  - the overlay opening, logging a match, showing positions on request, and closing;
  - the key opening it over home and following the match.
- 2 new browser scans.
- The code gates pass: 570 unit tests, 4 Worker tests, and the build. The browser tests pass: 10 golden replays and 21 scans.

The device check, in Chromium on the production build:

- **Desktop:**
  - Home loaded no overlay chunk. The key fetched it and opened the overlay.
  - Over a match against Rookie it showed `playing`, the bot's settings, the tick, and the wire log, while Space still dropped pieces.
  - A reload kept it open; the key closed it. A new tab started with it off, and `?dev` opened it there.
- **Pixel 7 profile, dark:**
  - The first screenshot showed the panel overflowing the left edge. Its padding was added to its width; the fix is `box-sizing: border-box`.
  - Long rows wrapped to five lines. Each summary is now capped at 72 characters.
  - After both fixes it fits with no sideways scroll.

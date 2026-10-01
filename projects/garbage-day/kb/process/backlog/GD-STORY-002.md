---
type: "Work Item"
title: "GD-STORY-002: See the fight: garbage, power-ups, showdowns and the result"
description: "The match screen's fight layer against the local referee: the garbage meter and attack flight, landing feedback, power-ups with their slot and effects, showdown banners, clear labels, and the result card with stats and rematch (US-08, US-10, US-11, US-15, locally)."
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
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-002: See the fight: garbage, power-ups, showdowns and the result

## Description

The second half of the roadmap's M2 todo "`MatchSession` over a local referee, and the match screen", naming "meter, speed chip, showdown banner, clear labels, attack flight, results". The engine already computes all of it ([`GD-TICKET-008`](GD-TICKET-008.md), [`GD-TICKET-009`](GD-TICKET-009.md)); this story shows it.

## Acceptance Criteria

M2 plays **locally**: `MatchSession` drives the engine's `LocalMatch` and referee in the browser, against a bot, so where the spec says "the Match DO" this story means the local referee. The same criteria hold over the network in M3. Against a local bot, the bot accepts a rematch at once; rematch between two people is M3.

From the [PRD](../../product/prd.md#playing), **US-08 Send and receive garbage**:

- Clears send rows by the attack table in the [game rules](../../product/game-rules.md), including T-spins,
  back-to-back, combos and perfect clears.
- Incoming rows wait in a meter beside my board; my clears cancel them before anything is sent.
- Rows land when I lock a piece without clearing, after a 0.5 s delay from arriving, at most 8
  rows per lock, with one hole column per attack.
- Every sent attack shows where it came from and where it went, and every landing is felt (a
  short shake and sound, and a vibration on phones that support it).

**US-10 Power-ups**:

- About 1 piece in 6 carries a gem. Clearing the row that holds it banks its power-up in my one
  slot; a gem cleared while the slot is full is lost.
- I fire a banked power-up with one key or gesture; it applies on both screens at the same moment,
  stamped by the Match DO.
- The four power-ups are Shield, Bomb, Fog and Rush, as defined in the
  [game rules](../../product/game-rules.md#power-ups).

**US-11 Showdowns**:

- A showdown is announced on both screens 5 s before it starts.
- At 1:00 of play, **Double garbage** doubles every routed attack for 15 s.
- At 2:30 of play, **Sudden death** adds 4 speed levels and doubles garbage until someone tops out.

**US-15 Result and rematch** (a four-row clear is a Quad since [`GD-TICKET-018`](GD-TICKET-018.md)):

- Both players see the same result and reason (topped out, forfeit, no contest, session ended),
  and a stats table: lines, garbage sent, Quads, T-spins, power-ups used, pieces per second.
- **Rematch** starts a new match with a new seed when both press it within 30 s; otherwise each
  player returns to the start.

## Linked Artifacts

- [PRD — US-08, US-10, US-11, US-15](../../product/prd.md#playing), [game rules](../../product/game-rules.md)
- [UI language](../../design/ui-language.md) ("The board and its widgets", "Motion", "Sound")

## AI PDLC Prompt

Goal: show the fight. Read `kb/design/ui-language.md` ("The board and its widgets", "Motion", "Sound") and the engine's player and referee events in `src/engine/src/messages.ts`. Wire the `ui` widgets (`Meter`, `AttackFlight`, `PowerSlot`, `ShowdownBanner`, `Popup`) to `MatchSession` events, add the results feature (`ResultCard`, `StatsTable`, `RematchButton`), and gate shake, flight and sound on reduced motion and the sound setting. Test each event's visible effect. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). A match against a bot now
shows the fight the engine was already running: every clear named over its board, attacks
flying through the referee to the other meter, garbage landing with a shake, power-ups banked
and applied, showdowns announced, and a result card with both players' stats.

- **Effects from the session.** `MatchSession.onEffect` reports each moment once: a clear (its
  words from `clearLabel`, [`GD-TICKET-018`](GD-TICKET-018.md)), a cancel, a gem banked, garbage
  landing, an attack routed (from the referee's `route` event), a shield block, a power-up used
  and applied, a showdown's announce, start and end, a top-out, and the player's moves and locks.
  The snapshot gains the showdown (`startsIn` counting down, then under way) and each player's
  totals. [Client architecture](../../design/client-architecture.md#rendering) records the split:
  what lasts is state, what happens once is an effect.
- **On screen.** `BoardFx` puts labels over a board ("Quad" in hazard yellow, "−2 cancelled",
  "+ Fog", "Fogged for 6 s", "Blocked by shield", "Topped out"; the rival's smaller and not read
  aloud) and shakes it when garbage lands or its own Bomb goes off. `AttackLayer` flies a token
  from the sender's board to the receiver's meter and pulses the centre column's **Referee** badge.
  `MatchBanner` shows "Double garbage in 3", then "Double garbage", and "Sudden death". Live stats
  sit under each board: lines, sent, pieces per second, Quads, T-spins.
- **The result** (`ResultCard`): who won and why, for every ending the referee can reach
  (topped out, timed out, grace, left, left while paused, abandoned), a stats table (lines,
  garbage sent, Quads, T-spins, power-ups used, pieces per second), Rematch and Home. A win plays
  the fanfare and throws confetti from the player's board.
- **Sound and haptics.** `Sfx` in `ui` ports the proof of concept's Web Audio tones; the match
  plays them only while sound is on. Garbage landing on the player's board vibrates for 30 ms
  where the device can.
- **Reduced motion:** no shake, flights finish at once, no confetti, labels show for 1 s without
  moving, the Sudden death banner doesn't pulse.
- **The UI language corrected:** its centre-column badge was "Match DO", which its own copy rules
  forbid outside the developer overlay; it is now the **Referee** badge.
- **Found on the way, fixed here:**
  - **A quick tap didn't move the piece.** A direction pressed and released within one 16 ms
    tick was forgotten before the engine read it. Found when a scripted playtest's arrow taps
    left every piece in the middle. `InputController` now keeps a tap for the next tick, and
    taps and held keys move in the order they came.
  - **Space at the end started a rematch.** The result card focused Rematch, and a player still
    pressing Space to drop would start the next match without seeing the result. Focus now goes
    to the card; Rematch is the first Tab stop.
  - **A cancelled flight rejected its promise.** `AttackFlight` now handles the `finished`
    rejection when a flight is cut short.

Checks: 33 new tests (the session's effects: a clear, an attack and its landing, moves, a
showdown's three phases; labels for every effect; the result wording for every ending; the result
card's stats, sound and focus; the banner; the referee pulse; the synth, confetti, popups, shake;
taps), and the code gates pass (515 unit tests, 4 Worker tests, build). The first page stays at
114 KB gzipped; the match chunk is 18 KB. In Chromium, on the production build:

- **Desktop, 1280 × 800, against Rookie for 40 s:** 16 labels (Singles, Doubles, combos up to ×4,
  "+ Shield", "Topped out"), 7 attack flights, garbage landing under my pieces, the result card
  with both players' stats. Mashing Space through the end left the result up, focused, with
  Rematch the first Tab stop. No page errors.
- **Phone, Pixel 7 profile, dark, reduced motion:** a match runs with no page scroll; the meter
  shows incoming rows, the rival's labels show over their board.
- **Not seen live:** a showdown. Both bot matches ended before 1:00, so the banner is covered by
  the session and render tests rather than a playtest.
- **Handed to [`GD-STORY-005`](GD-STORY-005.md):** the phone portrait layout (my board is small,
  the rival's labels spill past their board, the live stats wrap to four lines).

---
type: "Work Item"
title: "GD-STORY-002: See the fight: garbage, power-ups, showdowns and the result"
description: "The match screen's fight layer against the local referee: the garbage meter and attack flight, landing feedback, power-ups with their slot and effects, showdown banners, clear labels, and the result card with stats and rematch (US-08, US-10, US-11, US-15, locally)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "open"
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

**US-15 Result and rematch** ("Tetrises" becomes "Quads" with [`GD-TICKET-018`](GD-TICKET-018.md)):

- Both players see the same result and reason (topped out, forfeit, no contest, session ended),
  and a stats table: lines, garbage sent, Tetrises, T-spins, power-ups used, pieces per second.
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

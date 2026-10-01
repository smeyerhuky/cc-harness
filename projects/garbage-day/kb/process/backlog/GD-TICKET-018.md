---
type: "Work Item"
title: "GD-TICKET-018: Name the four-row clear without the Tetris name"
description: "The PRD says the game never uses the Tetris name, yet the game rules, UI language, controls page and PRD stats call a four-row clear a Tetris; choose a name with the owner and use it in every document and in the UI's clear labels and stats."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "UI", "spec"]
timestamp: "2026-09-30"
state: "done"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
---

# GD-TICKET-018: Name the four-row clear without the Tetris name

## Description

Found while porting the engine ([`GD-TICKET-008`](GD-TICKET-008.md)): the proof of concept's
engine produced display labels such as "Tetris" and "B2B T-spin Double", and the spec carries the
same word. The [PRD](../../product/prd.md) says Garbage Day "never uses the Tetris name or trade
dress" and lists the name among things out of scope, but these still use it:

- [game rules](../../product/game-rules.md): the attack table's "Tetris (4 rows)" and the
  back-to-back rule;
- [UI language](../../design/ui-language.md): the clear label "TETRIS" and the stats row's
  "Tetrises";
- [controls and layout](../../product/controls-and-layout.md) and the PRD: "Tetrises" in the live
  stats and the results table.

(The architecture's "Tetris-seeking" bot style became "four-line-seeking" with `GD-TICKET-009`.)

The engine now reports clears as data (lines, T-spin, back-to-back, combo, perfect clear) and
counts `fourLineClears`, so only the words change. Which word is the owner's call; the default,
if the owner doesn't choose, is **"Quad"** (clear label "QUAD", stat "Quads").

**Decided 2026-09-30:** the owner chose "Quad" at the M1 exit ("default to 'Quad' yes"),
recorded in [the scaffold session's journal](../journal/2026-09-30-scaffold.md). The first
criterion holds; the renaming is M2 work.

## Acceptance Criteria

- The owner has chosen the name, recorded in the running journal (or the default holds).
- No project document outside the PRD's out-of-scope line and the UI language's "avoid" list uses
  "Tetris" for a clear; the spec change lands in `game-rules.md` first.
- The UI's clear labels (M2 match screen) and stats use the chosen word, from one function in
  the `ui` package that turns the engine's clear data into words.

## Linked Artifacts

- [PRD](../../product/prd.md), [game rules](../../product/game-rules.md),
  [UI language — motion](../../design/ui-language.md#motion)

## AI PDLC Prompt

Goal: remove the Tetris name from clear labels and stats. Read this item, `kb/product/prd.md`
("Out of scope"), `kb/product/game-rules.md` ("Attack table"), `kb/design/ui-language.md`
("Motion", "Layouts") and `kb/product/controls-and-layout.md`. Take the owner's chosen word (or
the default), change the spec first, then the other documents, then write the `ui` package's
clear-label function with tests over the engine's `Clear` data. Done when the criteria hold, the
code and KB gates pass, this item is `done` with a Resolution, the backlog index and roadmap
agree, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md) with the owner's word,
**Quad** (chosen at the M1 exit).

- **The spec first:** the attack table in [game rules](../../product/game-rules.md) reads
  "Quad (4 rows)", and back-to-back is "a Quad or T-spin right after another". Then the
  [UI language](../../design/ui-language.md) (the clear label, the stats row), the
  [PRD](../../product/prd.md) and [controls and layout](../../product/controls-and-layout.md)
  (the stats), and [`GD-STORY-002`](GD-STORY-002.md)'s quote of the PRD.
- **One function for the words:** `clearLabel` in `ui` (`src/game/clearLabel.ts`) turns the
  engine's `Clear` into a label ("Quad", "T-spin Double", "B2B Quad · Combo ×3", "Perfect
  clear") and marks the difficult ones strong. `QUAD` gives the stat its plural, "Quads". Six
  tests score clears with the engine's own `scoreClear` and check that no label uses the avoided
  name. The match screen uses them from [`GD-STORY-002`](GD-STORY-002.md).
- **What still says "Tetris", on purpose:** the PRD's out-of-scope line, the UI language's
  "avoid" list, the overview's description of the genre ("a Tetris-style clone under its own
  name"), and the proof of concept's code in `spikes/`, kept as it was.

---
type: "Work Item"
title: "GD-TICKET-003: Write the UI language design notes"
description: "Write kb/design/ui-language.md: the visual identity (municipal hazard-stripe look), colour and type tokens for both themes, board and piece rendering, motion and sound, feedback for gestures, and the voice of the copy."
resource: "../../product/prd.md"
tags: ["backlog", "design", "UI"]
timestamp: "2026-09-30"
state: "done"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../../product/prd.md
  - type: DEPENDS_ON
    target: GD-TICKET-001.md
---

# GD-TICKET-003: Write the UI language design notes

## Description

The owner accepted "Garbage Day" as the name and the municipal look from the proof-of-concept
pages (hazard stripes, safety orange, bin blue, concrete greys, condensed signage type) as the
start of the UI language, and asked for design notes that define it. The spec fixes behaviour and
layout (`kb/product/controls-and-layout.md`); this item defines how it looks, moves and sounds.

## Acceptance Criteria

- `kb/design/ui-language.md` exists with OKF frontmatter and defines: the identity and what to
  avoid (no Tetris trade dress); colour tokens for light and dark themes including piece,
  garbage, gem and power-up colours and their contrast; the type scale and faces; board and cell
  rendering; the incoming meter; motion (clears, garbage rise, attacks in flight, countdowns) with
  reduced-motion equivalents; sound; touch-gesture feedback; the desktop and phone layouts from
  the spec as annotated wireframes; and a voice-and-copy guide with examples for pauses,
  forfeits and results.
- Pieces, garbage and gems are distinguishable without colour (US-20).
- It is linked from `kb/design/index.md` (created by GD-TICKET-002 or by this item, whichever
  runs first).
- The project gates pass.

## Linked Artifacts

- [Controls and layout](../../product/controls-and-layout.md), [PRD US-17 to US-20](../../product/prd.md#controls-and-layout)
- Proof of concept: [Garbage Day](https://claude.ai/artifact/L5SGMhy2aj8qozrDVNSrkT) and
  [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja) (their `:root` tokens
  are the starting palette)

## AI PDLC Prompt

Goal: write Garbage Day's UI language. Read `projects/garbage-day/CLAUDE.md`,
`kb/product/prd.md` and `kb/product/controls-and-layout.md`. Read the two proof-of-concept
artifacts linked above (Artifact tool, `read`) for their token blocks, fonts and motion. Write
`projects/garbage-day/kb/design/ui-language.md` with OKF frontmatter covering every point in the
acceptance criteria; create `kb/design/index.md` (table of contents only) if it does not exist,
and link it from `kb/index.md` and the design row of the PDLC table in `CLAUDE.md` if not already
linked. Keep behaviour out of it: behaviour is the spec's. Done when the acceptance criteria
hold, the project gates pass (`/kb/pdlc/definition-of-done.md`, "Gates"), this item is `done`
with a Resolution, the backlog index and roadmap agree, and the session's running-journal entry
records it.

## Resolution

Done in [the design session](../journal/2026-09-30-design.md): [`kb/design/ui-language.md`](../../design/ui-language.md) with identity, tokens for
both themes (from the proof of concept's `:root` blocks), type, board and widget looks, motion
with reduced-motion equivalents, sound, touch feedback, annotated desktop and phone layouts, and
the copy guide.

Deviation from the proof of concept, deliberately: the demo's piece colours matched the Tetris
guideline colour per shape, which is trade dress the PRD rules out, so v1 uses a new
"collection streams" palette with a pattern mark per piece (which also serves US-20). The demo's
XP and badges are recorded as not in v1; it is a check-in question for the owner.

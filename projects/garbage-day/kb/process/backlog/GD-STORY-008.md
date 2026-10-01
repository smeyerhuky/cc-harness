---
type: "Work Item"
title: "GD-STORY-008: Accessible by default"
description: "Keyboard operability with visible focus everywhere, pieces, gems and garbage told apart by pattern and shape, reduced motion turning off shakes, flights and confetti, sound off until turned on, and an axe scan of every M2 screen (US-20)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "active"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-002.md
  - type: DEPENDS_ON
    target: GD-STORY-007.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-008: Accessible by default

## Description

The roadmap's M2 todo "Reduced motion, sound toggle, keyboard operability, axe scan (US-20); the developer overlay". The overlay is [`GD-TICKET-024`](GD-TICKET-024.md).

## Acceptance Criteria

Quoted verbatim. Also: an axe scan of every M2 screen reports no violations (roadmap M2; [stack and CI — tests](../../design/stack-and-ci.md#tests)).

From the [PRD](../../product/prd.md#across-the-whole-game), **US-20 Accessible by default**:

- Everything is operable by keyboard; focus is always visible.
- Garbage, gems and pieces are told apart by pattern and shape as well as colour.
- Reduced-motion settings turn off shakes, flying attacks and confetti; sound is off until the
  player turns it on.

## Linked Artifacts

- [PRD — US-20](../../product/prd.md#across-the-whole-game), [UI language](../../design/ui-language.md) (pattern marks, motion, sound)

## AI PDLC Prompt

Goal: accessibility across M2. Read the PRD's US-20 and `kb/design/ui-language.md` ("Colour tokens", "Motion", "Sound"). Audit every M2 screen for keyboard paths and focus styles, honour `prefers-reduced-motion` plus the in-app override, and keep sound off by default. Add a Playwright job step with `@axe-core/playwright` over each screen. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

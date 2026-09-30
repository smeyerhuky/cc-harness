---
type: "Work Item"
title: "GD-STORY-003: Play with the keyboard, my way"
description: "Keyboard play on desktop with the default keys and timings from the controls page, every action rebindable, and the auto-repeat delay and rate adjustable, remembered on the device (US-16)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "active"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-001.md
  - type: DEPENDS_ON
    target: GD-STORY-007.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-003: Play with the keyboard, my way

## Description

The roadmap's M2 todo "Keyboard controls with rebinding and DAS/ARR settings (US-16)". [`GD-STORY-001`](GD-STORY-001.md) plays with the default keys; this story makes them configurable.

## Acceptance Criteria

Quoted verbatim; the defaults are the controls page's keyboard table.

From the [PRD](../../product/prd.md#controls-and-layout), **US-16 Keyboard play on desktop**:

- The default keys and timings are in [controls and layout](../../product/controls-and-layout.md#keyboard).
- I can rebind every action and change the auto-repeat delay and rate; my choices are remembered
  on this device.

## Linked Artifacts

- [PRD — US-16](../../product/prd.md#controls-and-layout), [controls and layout — keyboard](../../product/controls-and-layout.md#keyboard)
- [Client architecture — input](../../design/client-architecture.md#input)

## AI PDLC Prompt

Goal: configurable keyboard controls. Read `kb/product/controls-and-layout.md` ("Keyboard") and `kb/design/client-architecture.md` ("Input", "Where state lives"). Build `useKeyBindings` with DAS and ARR in engine ticks, a bindings editor in the settings sheet (conflicts refused, reset to defaults), and store them in the preferences store. Test repeat timing with fake timers. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

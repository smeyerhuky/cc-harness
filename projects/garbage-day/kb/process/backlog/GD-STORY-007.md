---
type: "Work Item"
title: "GD-STORY-007: Start from home with a handle and my settings"
description: "The home screen with Quick match, Create game and Play a bot; a generated handle (adjective, bird, number) that can be regenerated but not typed; the preferences store on the device; and the settings sheet (US-04)."
resource: "../../product/prd.md"
tags: ["backlog", "UI", "react"]
timestamp: "2026-09-30"
state: "open"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-023.md
  - type: DEPENDS_ON
    target: GD-TICKET-014.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-007: Start from home with a handle and my settings

## Description

The roadmap's M2 todo "Home screen, generated handles, preferences store, settings sheet (US-04)". In M2 only **Play a bot** leads to a match; Quick match and Create game arrive in M3.

## Acceptance Criteria

Quoted verbatim. Handles must also pass the protocol's `handle` schema (`src/protocol/src/schemas.ts`).

From the [PRD](../../product/prd.md#getting-into-a-match), **US-04 A handle without an account**:

- Given I open the game for the first time, then I get a generated handle (an adjective, a bird
  and a number, for example `Brisk Heron 42`) that I can regenerate but not type freely in v1.
- My handle and settings are stored only on my device.

## Linked Artifacts

- [PRD — US-04](../../product/prd.md#getting-into-a-match), [client architecture](../../design/client-architecture.md) ("Where state lives": the Zustand preferences store)
- [UI language — voice and copy](../../design/ui-language.md#voice-and-copy)

## AI PDLC Prompt

Goal: the home screen and preferences. Read `kb/design/client-architecture.md` ("Where state lives") and `kb/design/ui-language.md` ("Voice and copy"). Build the handle generator (word lists, a test that every output passes the protocol's `handle` schema), the persisted Zustand preferences store, the home feature, and the settings sheet's shell, which the control stories fill. Run the code gates, and check the result on a phone and a desktop, with reduced motion
on (definition of done, project item 3). Done when the quoted criteria hold, the KB gates pass,
this item is `done` with a Resolution recording the device check, the backlog index and roadmap
agree, and the journal records it.

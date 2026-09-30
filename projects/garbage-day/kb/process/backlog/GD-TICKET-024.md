---
type: "Work Item"
title: "GD-TICKET-024: Add the developer overlay, off by default"
description: "A developer overlay, off by default, that shows the wire log and the app and match machines' states, replacing the proof of concept's explainer sections; the only place Durable Object and WebSocket may be named."
resource: "../../design/client-architecture.md"
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

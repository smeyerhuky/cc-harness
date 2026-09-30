---
type: "Work Item"
title: "GD-TICKET-014: App flow machine, routes and contexts"
description: "Build the client's skeleton from client-architecture.md: the XState appMachine with its states and guards, the routes with lazy loading, the three narrow contexts, and an error boundary per route."
resource: "../coverage-audit.md"
tags: ["backlog", "react"]
timestamp: "2026-09-30"
state: "open"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-014: App flow machine, routes and contexts

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the client architecture
designs the screen flow as an XState actor with routes, narrow contexts and error boundaries,
but no roadmap todo named it.

## Acceptance Criteria

- `appMachine` has the states home, searching, bot offer, lobby, countdown, playing, paused,
  result and rematch, with guards that forbid impossible jumps; actor tests cover every transition.
- Routes `/`, `/play`, `/new`, `/g/:code`, `/bot` and `/settings` exist, lazily loaded, each with an
  error boundary that offers the next sensible action.
- `AppActorContext`, `MatchSessionContext` and `InputContext` provide stable objects; a test shows
  a match-state change does not re-render the home screen.

## Linked Artifacts

- [Client architecture](../../design/client-architecture.md)

## AI PDLC Prompt

Goal: build the app flow machine, routes and contexts. Read `kb/design/client-architecture.md` in
full. Implement under `projects/garbage-day/src/app/client/` (`state/appMachine.ts`, `routes.tsx`,
`App.tsx`) with tests. Done when the criteria hold, the code and KB gates pass, this item is
`done` with a Resolution, the backlog index and roadmap agree, and the journal records it.

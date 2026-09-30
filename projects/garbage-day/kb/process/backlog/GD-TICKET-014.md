---
type: "Work Item"
title: "GD-TICKET-014: App flow machine, routes and contexts"
description: "Build the client's skeleton from client-architecture.md: the XState appMachine with its states and guards, the routes with lazy loading, the three narrow contexts, and an error boundary per route."
resource: "../coverage-audit.md"
tags: ["backlog", "react"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). XState 5.33.2, `@xstate/react`
6.1.0 and React Router 8.4.0 are in, the versions the design pinned and still the newest a day
old.

- **`client/state/appMachine.ts`** has the states home, searching, bot offer, lobby, countdown,
  playing, paused, result and rematch. Each state lists only the events that may move it. Guards
  refuse a bot outside 1 to 10, a code that isn't `GD-` and four characters, and a rematch with
  no result. Context carries the mode, the bot, the opponent's name, the code, the result, whether
  the countdown starts or resumes, and a match counter for new seeds. Ten actor tests cover every
  transition. One of them sends all 19 events in each of the 9 states and checks that only the
  listed ones move it. Bot names follow the PRD's presets (Rookie 2, Regular 5, Pro 8, by skill).
- **Routes** (`client/routes.tsx`): `/`, `/play`, `/bot`, `/new`, `/g/:code`, `/settings`, plus
  `/gallery` and a 404. Every screen loads lazily, and every route has an error boundary: "Try
  again" then "Home", or "Back to the match" then "Home" on `/play`. `/g/:code` answers 404 for
  anything that isn't a game code. `/play` with no match under way redirects home. The home loader
  starts the health check without waiting, and the status line suspends on it. The shell's content
  moved into `features/home`.
- **Contexts.** `AppActorContext` (`createActorContext`) wraps the router in `App`.
  `createStoreContext` builds a narrow context around an external store, with a
  `useSyncExternalStore` selector hook. Its test renders a home-like component beside a
  subscriber under a Profiler: store changes re-render only the subscriber, and only when its
  selected value changes.
- **Placeholders** until their stories: bot setup offers the three presets at speed 5
  (`GD-STORY-006`), `/play` shows the machine's state (`GD-STORY-001`), settings points to
  `GD-STORY-007`, and private games say they arrive with online play (M3).

Deviations: **`MatchSessionContext` and `InputContext` are made by `GD-STORY-001`** with
`createStoreContext`, because their types are its `MatchSession` and input controller. The
re-render property the criterion asks for is tested here on the helper they will use. **The main
bundle** is 352 KB (111 KB gzipped), up from 223 KB (70 KB), because the router and XState load
with the app; every screen is its own chunk.

Checks: the code gates pass (419 unit tests, 4 Worker tests, build). In Chromium, against the
`vite preview` build: home → Play a bot → Regular reaches `/play` in the countdown state; a fresh
`/play` goes home; `/g/nope` shows "Nothing here"; `/gallery` loads; no page errors.

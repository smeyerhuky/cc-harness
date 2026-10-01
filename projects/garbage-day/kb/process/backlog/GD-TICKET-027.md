---
type: "Work Item"
title: "GD-TICKET-027: Bring the client architecture in line with what M2 built"
description: "The client architecture's React API table names useActionState, useTransition and Activity where M2 built none of them, and its folder tree and hook names differ from the code; implement each where it earns its place or rewrite the design to match."
resource: "../coverage-audit.md"
tags: ["backlog", "design", "react"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-027: Bring the client architecture in line with what M2 built

## Description

Found by the [coverage audit of the M2 exit](../coverage-audit.md). The [client architecture](../../design/client-architecture.md) says what M2's code uses, and three of its lines are carried by nothing:

- **`useActionState` for the handle regenerate action.** "New name" is a plain click: regenerating is synchronous, with nothing to wait on.
- **`useTransition` for route changes into and out of a match.** Navigation is plain.
- **`<Activity>` to keep the match mounted under a full-screen settings sheet on a phone.** Settings is a route, and nothing opens it during a match. No spec asks for settings mid-match.

The folder tree also names what M2 didn't build. It lists `results/` and `SettingsSheet`, where the code has the result card in `match/` and a `SettingsScreen` route. It also says `useMatch`, where the code has `MatchSessionContext.useSelector`.

## Acceptance Criteria

- For each of the three APIs: either the code uses it where the table says, with the reason it earns its place, or the table says where it is used instead (or that it isn't), and why.
- The folder tree and hook names match `src/app/client/`; whatever M3 will add is marked as such.
- The KB gates pass.

## Linked Artifacts

- [Client architecture](../../design/client-architecture.md#modern-react-used-on-purpose)

## AI PDLC Prompt

Goal: the design says what the code does. Read the client architecture and `src/app/client/`. Prefer the design change unless the API makes a real difference to a player. Done when the criteria hold, this item is `done` with a Resolution, the backlog index and roadmap agree, and the journal records it.

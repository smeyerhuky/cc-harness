---
type: "Work Item"
title: "GD-TICKET-033: Come back into a running match from a fresh page"
description: "A private game keeps its seat in the browser, so a reload mid-match reconnects with the right token, but the new page has no match to rejoin and waits in the lobby for a start that never comes again."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "network"]
timestamp: "2026-10-01"
state: "open"
milestone: "M4"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-TICKET-031.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
---

# GD-TICKET-033: Come back into a running match from a fresh page

## Description

Found while building [`GD-STORY-010`](GD-STORY-010.md). A private game's browser keeps its join
token by code, so a reload, or the link opened again after closing the tab, takes the same seat.
In the lobby that works. Once the match has started it doesn't: the new page's socket says
`hello`, the Match DO seats it, and nothing more comes. The referee sent `start` and the bags to
the old page, and a rejoin needs a match the new page doesn't have. The screen waits in the lobby.

[`GD-TICKET-031`](GD-TICKET-031.md) covers a drop before `start` on the same page. This is a page
with nothing at all. Quick and bot matches don't keep their seat, so their reload goes home.

## Acceptance Criteria

- A page that takes a seat in a running match is sent what it needs to play on: `start`, the
  bags dealt so far, both boards as of their last lock, and when to resume.
- The pause and presence rules treat the gap as the [pause and presence
  rules](../../product/pause-and-presence.md) treat a closed tab.
- A test reloads a private game's page mid-match and plays on.

## Linked Artifacts

- [Architecture — private games](../../design/architecture.md#private-games), [`GD-TICKET-031`](GD-TICKET-031.md)

## AI PDLC Prompt

Goal: a reloaded page plays on. Read the referee's rejoin and snapshot code. Run the code gates and `pnpm test:worker`. Check the result in two browsers. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

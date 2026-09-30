---
type: "Work Item"
title: "GD-TICKET-017: Show connection quality and degrade visibly above 150 ms"
description: "Measure round-trip time continuously and show a connection indicator; above 150 ms one way, say so on screen instead of letting the opponent view lag silently."
resource: "../coverage-audit.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-017: Show connection quality and degrade visibly above 150 ms

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the PRD's requirement that play
"degrades visibly, not silently" above 150 ms one way was carried by nothing.

## Acceptance Criteria

- The client measures round-trip time from its pings and shows a small indicator (good, fair,
  poor) beside the clock.
- Above 150 ms one way for more than 3 s, the opponent panel shows "Slow connection" and the
  indicator turns poor; it clears when the delay recovers.
- A test with the latency model at 50, 150 and 250 ms asserts the three states.

## Linked Artifacts

- [PRD non-functional requirements](../../product/prd.md#non-functional-requirements),
  [architecture — the match clock](../../design/architecture.md#time-the-match-clock)

## AI PDLC Prompt

Goal: show connection quality. Read `kb/product/prd.md` ("Non-functional requirements") and
`kb/design/architecture.md` ("Time: the match clock"). Implement in `src/app/client/net/clockSync.ts`
and the match feature's centre column, with tests using the engine's latency model. Done when the
criteria hold, the code and KB gates pass, this item is `done` with a Resolution, the backlog
index and roadmap agree, and the journal records it.

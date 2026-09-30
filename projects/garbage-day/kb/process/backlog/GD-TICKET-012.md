---
type: "Work Item"
title: "GD-TICKET-012: Delete a match's stored state when its session ends"
description: "Make the Match DO delete its SQLite snapshot, ledger and alarms when a match ends or its session times out, and make the Lobby DO keep no data about finished matches."
resource: "../coverage-audit.md"
tags: ["backlog", "privacy"]
timestamp: "2026-09-30"
state: "open"
milestone: "M4"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-012: Delete a match's stored state when its session ends

## Description

Found by the [coverage audit of 2026-09-30](../coverage-audit.md): the PRD's privacy requirement,
"a match's server state is deleted when its session ends", was carried by no milestone or item.

## Acceptance Criteria

- When a Match DO reaches `over` (any reason) and both sockets have closed, or when its session
  ends by timeout, it deletes all its storage and alarms (`deleteAll`), after sending `result`.
- A private game that expires unused is deleted the same way.
- A Durable Object test shows storage is empty after each of these endings.

## Linked Artifacts

- [PRD non-functional requirements](../../product/prd.md#non-functional-requirements),
  [architecture — presence and pauses](../../design/architecture.md#presence-and-pauses)

## AI PDLC Prompt

Goal: delete match state at session end. Read `kb/product/prd.md` ("Non-functional
requirements", privacy) and `kb/design/architecture.md` ("Components", "Presence and pauses").
Implement in `projects/garbage-day/src/app/worker/MatchDO.ts` with a Workers-pool test. Done when
the criteria hold, the code and KB gates pass, this item is `done` with a Resolution, the backlog
index and roadmap agree, and the journal records it.

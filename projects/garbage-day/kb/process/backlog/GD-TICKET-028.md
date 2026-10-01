---
type: "Work Item"
title: "GD-TICKET-028: Route the sockets, and limit and check every message"
description: "The Worker routes for the lobby and match sockets, per-connection rate limits, and the Match DO checking every message against its schema and rejecting impossible attacks (the fair-play NFR)."
resource: "../../design/architecture.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../roadmap.md
---

# GD-TICKET-028: Route the sockets, and limit and check every message

## Description

The roadmap's M3 todo "Worker routes, rate limits, static assets with SPA fallback". The static assets and the SPA fallback are done ([`GD-TICKET-011`](GD-TICKET-011.md)). This ticket adds the socket routes, and with them the Match DO's half of the todo "server-side message validation and attack limits". The protocol's schemas already reject an impossible attack value ([`GD-TICKET-010`](GD-TICKET-010.md)).

## Acceptance Criteria

- `/ws/lobby` upgrades to a WebSocket on the Lobby DO, and `/ws/match/<id>` to one on that match's Match DO. Any other `/ws` path, and a request that isn't an upgrade, gets a 4xx.
- Every message in is parsed by its protocol schema. A message that fails is dropped and counted, and a connection that keeps failing is closed.
- From the [PRD](../../product/prd.md#non-functional-requirements), Fair play: "The DO rejects impossible attack values and rate-limits messages; full server-side replay checks come later." The limit is recorded in [architecture](../../design/architecture.md) with the reason for its number.
- Worker tests cover each route, a bad message, an impossible attack and a flood.

## Linked Artifacts

- [Architecture](../../design/architecture.md), [stack and CI — tests](../../design/stack-and-ci.md#tests), `src/app/worker/`

## AI PDLC Prompt

Goal: the socket routes and the message checks. Read the architecture's Worker and DO sections, `src/app/worker/index.ts`, and `src/protocol/src/schemas.ts`. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

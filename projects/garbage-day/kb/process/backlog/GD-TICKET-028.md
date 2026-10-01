---
type: "Work Item"
title: "GD-TICKET-028: Route the sockets, and limit and check every message"
description: "The Worker routes for the lobby and match sockets, per-connection rate limits, and the Match DO checking every message against its schema and rejecting impossible attacks (the fair-play NFR)."
resource: "../../design/architecture.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The numbers and their reasons
are in [architecture — limits](../../design/architecture.md#limits).

- **Routes.**
  - `/ws/lobby` goes to the Lobby DO named `quick`.
  - `/ws/match/<id>` goes to the Match DO of that name. The id must pass the protocol's `matchId` rule.
  - Other `/ws` paths, and a bad id, get 404. A socket path without an upgrade gets 426.
- **Per address.** At most 60 socket upgrades a minute from one address, then 429. The Worker
  counts with Cloudflare's rate-limiting binding, `UPGRADES`. Previews declare it again under
  their own namespace, and the config test checks both.
- **Per socket.** Both DOs extend one `SocketDO` base (`worker/sockets.ts`), which accepts
  sockets through the Hibernation API and answers `ping` by the auto-response. Every other message
  goes through a `MessageGuard` (`worker/guard.ts`), in this order:
  - **the rate:** 40 a second in bursts of 60 on a match socket; 2 a second in bursts of 5 on
    the lobby;
  - **the protocol's schema:** this already refuses an attack worth more than its clear;
  - **the lock rate:** 20 a second.
- **Refusals.** Each one is dropped and counted (`wireCounts()` over RPC), and reported with an
  `error` at most once a second. After 20 pending refusals (10 on the lobby), the socket is
  closed with 1008.
- **What the tests found:** messages a client had already sent kept arriving after the DO closed
  its socket, and were refused and counted again. The DO now ignores a socket it has closed.
- **Not yet here:** valid messages are counted but not acted on. The referee arrives with
  [`GD-STORY-011`](GD-STORY-011.md), and pairing with [`GD-STORY-009`](GD-STORY-009.md).

Checks:

- 14 new Worker tests, 18 in all.
  - Each route, including a missing upgrade.
  - A ping answered without the DO.
  - A valid message taken and counted.
  - A bad message, another version and an inflated attack, each refused with its code.
  - A match flood closed after its burst, and a lobby flood closed.
  - The upgrade limit refusing one address and not another.
  - `MessageGuard`'s rules in isolation.
- A new config test for the previews' rate limiter.
- The code gates pass: 578 unit tests, the Worker tests three runs in a row, and the build. The
  Worker bundle, now with Zod, is 200 KB.

Two Worker assertions were first written too exactly.

- Refusals drain in real time, so the close comes at the 20th refusal or just after it.
- The simulated limiter counts in fixed minutes, so a run crossing one starts again.

Both now allow for it.

The device check, against the built Worker in workerd (`vite preview`), with Node's WebSocket client:

- The lobby and match sockets answered `ping` with `pong`.
- A message with an unknown key got `invalid`.
- 300 messages at once closed the socket with 1008, "Too many refused messages".
- A plain GET got 426, and a bad id 404.

The same check against the pull request's Worker Preview on Cloudflare (`wss://pr-14-…`) gave
the same results. That run also confirmed the account takes the rate-limiting binding: the
preview deployed with it.

No browser yet: no client opens these sockets until `GD-STORY-011`.

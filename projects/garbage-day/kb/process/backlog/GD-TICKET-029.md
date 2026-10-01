---
type: "Work Item"
title: "GD-TICKET-029: Test the Durable Objects, and two browsers end to end"
description: "Durable Object tests in the Workers pool for pairing, the private lobby, dealing and the ledger, and a Playwright end-to-end suite where two browsers play a quick match and a private-link match to a result."
resource: "../../design/stack-and-ci.md"
tags: ["backlog", "ci"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-009.md
  - type: DEPENDS_ON
    target: GD-STORY-010.md
  - type: DERIVED_FROM
    target: ../roadmap.md
---

# GD-TICKET-029: Test the Durable Objects, and two browsers end to end

## Description

The roadmap's M3 todo "Durable Object tests in the Workers pool; end-to-end quick match and private link with two browsers". [Stack and CI](../../design/stack-and-ci.md#tests) plans the end-to-end layer; M2's accessibility scan runs in Vitest's browser mode instead ([`GD-STORY-008`](GD-STORY-008.md)).

## Acceptance Criteria

- Worker and Durable Object tests (`pnpm test:worker`) cover pairing, the waiting count and the bot offer, the private lobby and its codes, dealing, and the garbage ledger with resend.
- A Playwright suite (`pnpm e2e`, against `vite preview`) has two browser contexts play a quick match to a result, and join by a private link. It runs in CI, in the existing Playwright image.
- `@axe-core/playwright` scans the screens that need a real server: searching, the bot offer, the lobby, and a full game.
- Stack and CI's tests table matches what runs.

## Linked Artifacts

- [Stack and CI — tests](../../design/stack-and-ci.md#tests), `.github/workflows/garbage-day.yml`

## AI PDLC Prompt

Goal: the online game tested as players use it. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

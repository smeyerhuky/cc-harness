---
type: "Work Item"
title: "GD-STORY-014: Result and rematch over the network"
description: "Both players see the same result, reason and stats, and Rematch starts a new match with a new seed when both press it within 30 s (US-15 online)."
resource: "../../product/prd.md"
tags: ["backlog", "network"]
timestamp: "2026-09-30"
state: "open"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DEPENDS_ON
    target: GD-STORY-011.md
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-STORY-014: Result and rematch over the network

## Description

The roadmap's M3 todo "Results and rematch over the network (US-15)". The result card and stats exist ([`GD-STORY-002`](GD-STORY-002.md)); locally a rematch starts at once.

## Acceptance Criteria

M3 plays **online**: two browsers, the Worker, the Lobby DO and the Match DO. The engine and its referee rules are the ones M1 ported and M2 played locally ([`GD-STORY-001`](GD-STORY-001.md), [`GD-STORY-002`](GD-STORY-002.md)); this item puts them behind the network.

From the [PRD](../../product/prd.md#playing), **US-15 Result and rematch**:

- Both players see the same result and reason (topped out, forfeit, no contest, session ended),
  and a stats table: lines, garbage sent, Quads, T-spins, power-ups used, pieces per second.
- **Rematch** starts a new match with a new seed when both press it within 30 s; otherwise each
  player returns to the start.

## Linked Artifacts

- [PRD — US-15](../../product/prd.md#playing), [client architecture — `useOptimistic`](../../design/client-architecture.md#modern-react-used-on-purpose)

## AI PDLC Prompt

Goal: the same ending on both screens, and a rematch both agree to. Run the code gates and `pnpm test:worker`. Check the result in two browsers, one a phone profile. Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution recording the check, the backlog index and roadmap agree, and the journal records it.

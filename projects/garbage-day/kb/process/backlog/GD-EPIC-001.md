---
type: "Work Item"
title: "GD-EPIC-001: Garbage Day v1"
description: "Build and launch v1 as specified in kb/product/ and designed in kb/design/: foundations, solo play, online play, pauses and presence, launch."
resource: "../../product/prd.md"
tags: ["backlog", "epic"]
timestamp: "2026-09-30"
state: "open"
milestone: "M1-M5"
relationships:
  - type: DERIVED_FROM
    target: ../../product/prd.md
---

# GD-EPIC-001: Garbage Day v1

## Description

Everything from the first line of code to the production launch of v1. Its parts are minted one
milestone at a time, just before that milestone starts; the roadmap lists the later milestones'
todos until then.

## Acceptance Criteria

- Every part is `done` or `declined`.
- Every PRD story US-01 to US-20 passes its acceptance criteria, shown by the end-to-end suite or a
  recorded manual check on a real device.
- The PRD's non-functional requirements hold, measured in M5.

## Linked Artifacts

- [PRD](../../product/prd.md), [design](../../design/index.md), [roadmap M1–M5](../roadmap.md)

## Proposed Resolution

The sum of its parts, in roadmap order.

## AI PDLC Prompt

Not directly executable. Work its parts in roadmap order: the current milestone's items in the
backlog index, chosen by the next-item rule (`/kb/pdlc/work-items.md`, "Which item is next").
At each milestone exit apply the milestone tier of the definition of done, which mints the next
milestone's parts under this epic.

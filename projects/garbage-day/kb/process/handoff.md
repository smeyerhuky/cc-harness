---
type: "Reference"
title: "Garbage Day Handoff"
description: "Where Garbage Day stands right now and exactly what to do next — the cold-start brief a fresh session reads first."
resource: "roadmap.md"
tags: ["handoff", "roadmap", "backlog"]
timestamp: "2026-09-30"
---

# Garbage Day Handoff

Rewritten, not appended, in the same commit as any change to the state below
([the rule](../../../../kb/pdlc/journals.md#keeping-the-handoff-current)) — the session-by-session
history lives in the [running journal](journal/index.md).

## Snapshot

- **Active epic:** [`GD-EPIC-001`](backlog/GD-EPIC-001.md) — Garbage Day v1 (M1–M5).
- **Milestone:** M0 — Stand the project up — exit reached, **at the owner check-in**; M1 —
  Foundations — minted and waiting for the owner's go-ahead ([roadmap](roadmap.md)).
- **Branch:** `ccr-a9d3b393-jvy3f5` (the session's designated branch).
- **Landed recently:** the design session ([journal entry](journal/2026-09-30-design.md)):
  - the proof of concept committed as [`GD-SPIKE-001`](backlog/GD-SPIKE-001.md), in
    [`spikes/proof-of-concept/`](../../spikes/proof-of-concept/JOURNAL.md);
  - [`kb/design/`](../design/index.md): system architecture, React client architecture, UI
    language, stack and CI (`GD-TICKET-002` to `005` done);
  - the roadmap's M1–M5, the M1 items `GD-TICKET-006` to `011`, and the first
    [coverage audit](coverage-audit.md), whose six gaps are `GD-TICKET-012` to `017`.
  Before that, the spec ([journal entry](journal/2026-09-30-spec.md)).
- **Waiting on the owner:** the M0 check-in decisions in the design session's journal entry
  ("Next"); unanswered, their defaults hold.
- **Gates:** see *Verify the baseline*. No `src/` code yet, so only the KB gates apply.

## Immediate next step

After the owner's go-ahead on M1: [`GD-TICKET-006`](backlog/GD-TICKET-006.md) — scaffold the
pnpm workspace with the pinned stack. It is the only M1 item with no open dependency; then
`GD-TICKET-007`, `008` and `010` (each needs only `006`), then `009` and `011`.

## Standing rules for M1

- Re-check every version against the npm registry on the day it is pinned; record any change in
  [stack and CI](../design/stack-and-ci.md#exceptions-to-latest).
- Port from `spikes/proof-of-concept/live/live-engine.js`; do not rewrite rules from memory.

## Verify the baseline

The project [gates](../../../../kb/pdlc/definition-of-done.md#gates) on this bundle
(`B=projects/garbage-day/kb/`), from the repo root — all must pass before new work.

## Cold-start prompt

```
garbage-day — resume work.
1. Develop on the session's designated branch.
2. Read projects/garbage-day/kb/process/handoff.md (this file), then roadmap.md, then the
   next work item's "AI PDLC Prompt" in kb/process/backlog/ (which one: /kb/pdlc/work-items.md,
   "Which item is next"). The method is in /kb/pdlc/.
3. Run the project gates on this bundle (/kb/pdlc/definition-of-done.md, "Gates"); everything
   must pass before new work.
4. Work only the current milestone. At its exit, apply the milestone tier of the definition of
   done (kb/process/definition-of-done.md), which ends with the owner check-in. Before ending any
   session, follow /kb/pdlc/journals.md, "Closing a session".
```

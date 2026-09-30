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

- **Active epic:** none yet.
- **Milestone:** M0 — Stand the project up — active ([roadmap](roadmap.md)).
- **Branch:** `ccr-a9d3b393-jvy3f5` (the session's designated branch).
- **Proof of concept, not yet in the repo:** two interactive pages built before the project
  existed: [Garbage Day](https://claude.ai/artifact/L5SGMhy2aj8qozrDVNSrkT) (step-through replay)
  and [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja) (live play vs a bot,
  simulated Match DO, two bot-vs-bot matches). They are the source material for the spec.
- **Landed recently:** the spec, `GD-TICKET-001` done: [PRD](../product/prd.md) and the rules
  files in [`kb/product/`](../product/index.md) ([journal entry](journal/2026-09-30-spec.md)).
  Before that, the project was created ([journal entry](journal/2026-09-30-project-created.md)).
- **Waiting on the owner:** a read of the PRD's stories and its five open questions (each has an
  assumed answer that holds until they say otherwise).
- **Gates:** see *Verify the baseline*.

## Immediate next step

[`GD-TICKET-002`](backlog/GD-TICKET-002.md) — write the architecture design from the proof of
concept. Then `GD-TICKET-003` (UI language, which needs only the spec) and `GD-TICKET-004` (stack
and CI, which waits for the architecture).

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

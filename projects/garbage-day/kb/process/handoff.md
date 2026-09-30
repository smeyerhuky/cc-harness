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
- **Landed recently:** the project was created
  ([journal entry](journal/2026-09-30-project-created.md)).
- **Gates:** see *Verify the baseline*.

## Immediate next step

[`GD-TICKET-001`](backlog/GD-TICKET-001.md) — write the spec with the owner: what this is, for
whom, what is out of scope, and user stories with acceptance criteria.

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

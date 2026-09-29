---
type: "Reference"
title: "Hello Worker Handoff"
description: "Where Hello Worker stands right now and exactly what to do next — the cold-start brief a fresh session reads first."
resource: "roadmap.md"
tags: ["handoff", "roadmap", "backlog"]
timestamp: "2026-09-29"
---

# Hello Worker Handoff

Rewritten, not appended, in the same commit as any change to the state below
([the rule](../../../../kb/pdlc/journals.md#keeping-the-handoff-current)) — the session-by-session
history lives in the [running journal](journal/index.md).

## Snapshot

- **Active epic:** none yet.
- **Milestone:** none active. M0 (the minimal Worker) and M1 (the greeting names the harness)
  are done ([roadmap](roadmap.md)); the project is a finished demo.
- **Branch:** none of its own — developed on each session's designated branch, like the rest of
  the repo.
- **Landed recently:** the greeting now reads `hello world from cc-harness`
  ([journal entry](journal/2026-09-29-greeting.md)). A deployed copy keeps the old greeting until
  it is redeployed — the owner's call.
- **Gates:** see *Verify the baseline*.

## Immediate next step

None — no work is open. To change the project, start a new milestone in the
[roadmap](roadmap.md) and mint its first work item. To use it as a deploy check, follow the
[README](../../README.md).

## Verify the baseline

The project [gates](../../../../kb/pdlc/definition-of-done.md#gates) on this bundle
(`B=projects/hello-worker/kb/`), from the repo root — all must pass before new work.

## Cold-start prompt

```
hello-worker — resume work.
1. Develop on the session's designated branch.
2. Read projects/hello-worker/kb/process/handoff.md (this file), then roadmap.md, then the
   next work item's "AI PDLC Prompt" in kb/process/backlog/ (which one: /kb/pdlc/work-items.md,
   "Which item is next"). The method is in /kb/pdlc/.
3. Run the project gates on this bundle (/kb/pdlc/definition-of-done.md, "Gates"); everything
   must pass before new work.
4. Work only the current milestone. At its exit, apply the milestone tier of the definition of
   done (kb/process/definition-of-done.md), which ends with the owner check-in. Before ending any
   session, follow /kb/pdlc/journals.md, "Closing a session".
```

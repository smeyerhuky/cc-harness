---
type: "Reference"
title: "Harness Handoff"
description: "Where harness-level work stands right now and exactly what to do next — the cold-start brief a fresh session reads before anything else in kb/process/."
resource: "roadmap.md"
tags: ["handoff", "roadmap", "backlog"]
timestamp: "2026-09-29"
---

# Harness Handoff

The current-state brief for work on the harness itself. **Rewritten, not appended** — in the same
commit as any change to the state below
([keeping the handoff current](../pdlc/journals.md#keeping-the-handoff-current)). The
session-by-session history lives in the [running journal](journal/index.md).

Working on a project instead? Read that project's own handoff,
`projects/<name>/kb/process/handoff.md`; to start a new project, follow
[`projects/CLAUDE.md`](../../projects/CLAUDE.md), "Adding a new project".

## Snapshot

- **No harness work in progress.** The [roadmap](roadmap.md) has no milestones, the
  [backlog](backlog/index.md) no items, and the [running journal](journal/index.md) no entries.
- **Gates:** see *Verify the baseline*.

## Immediate next step

None until the owner asks for a change to the harness. When they do:

1. Add a milestone to the [roadmap](roadmap.md) with its todos and exit criterion.
2. Mint its work items in the [backlog](backlog/index.md) — `CCH-TICKET-001` onward, with the
   next-free-ID table updated.
3. Work them by [the next-item rule](../pdlc/work-items.md#which-item-is-next), and close each
   session by [the checklist](../pdlc/journals.md#closing-a-session) — a journal entry, and this
   handoff rewritten.

The [worked example](../pdlc/worked-example.md) walks through one harness change end to end.

## Verify the baseline

Run the [gates](../pdlc/definition-of-done.md#gates): the harness gates on `kb/`, then the
every-project loop. Both must exit 0 before new work.

## Cold-start prompt

```
cc-harness — resume harness work.
1. Develop on the session's designated branch.
2. Read kb/process/handoff.md (this file), then roadmap.md, then the next work item's
   "AI PDLC Prompt" in kb/process/backlog/ (which one: kb/pdlc/work-items.md, "Which item is
   next"). The method is in kb/pdlc/.
3. Run the gates (kb/pdlc/definition-of-done.md, "Gates"); everything must pass before new work.
4. Work only the current milestone; at its exit, apply the milestone tier of the definition of
   done, which ends with the owner check-in. Before ending any session, follow
   kb/pdlc/journals.md, "Closing a session".
```

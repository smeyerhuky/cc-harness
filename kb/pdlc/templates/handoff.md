---
type: "Reference"
title: "Handoff Template"
description: "The fill-in skeleton for kb/process/handoff.md — snapshot, immediate next step, standing rules, baseline check, and a paste-ready cold-start prompt — rewritten in the same commit as any change to the state it describes."
resource: "../journals.md"
tags: ["handoff", "reference"]
timestamp: "2026-09-29"
---

# Handoff Template

One per project at `kb/process/handoff.md` (and one for the harness). **Rewritten, not
appended** — in the same commit as any change to the state it describes
([keeping the handoff current](../journals.md#keeping-the-handoff-current)); the history belongs in
the running journal. Keep exactly one "where are we now" document; two drift apart.
Why: [journals.md](../journals.md). A filled-in example: the
[worked example](../worked-example.md#7-close-the-session); a finished project's:
[Hello Worker's handoff](../../../projects/hello-worker/kb/process/handoff.md).

````markdown
---
type: "Reference"
title: "<Project> Handoff"
description: "Where <project> stands right now and exactly what to do next — the cold-start brief a fresh session reads first."
resource: "roadmap.md"
tags: ["handoff", "roadmap", "backlog"]
timestamp: "YYYY-MM-DD"
---

# <Project> Handoff

<One line: rewritten whenever the state below changes; history lives in the running journal (link).>

## Snapshot

- **Active epic:** <ID — title, linked>
- **Milestone:** <current milestone and its state; what's next>
- **Branch:** `<branch>` <and PR state, if any>
- **Landed recently:** <the last session's items, by ID>
- **Gates:** <each gate and its state; point to the latest journal entry for exact output>

## Immediate next step

<Exactly one next action, naming the work item the next-item rule picks (work-items.md, "Which
item is next"). If waiting on the owner, say so and say what happens on a go-ahead.>

## Standing rules

<Only rules specific to the current work that a fresh session would otherwise break. Omit the
section if none.>

## Verify the baseline

<Which gates must pass before any new work — a link to the definition of done's Gates section
and the bundle to run them on, rather than a copy of the commands.>

## Cold-start prompt

```
<A paste-ready prompt: which branch, read this file then the roadmap then the next item's
AI PDLC Prompt, run the gates, work only the current milestone; point to the definition of
done's milestone tier for its exit and to journals.md for closing a session — don't list
their steps.>
```
````

## Related

- [Journals](../journals.md) — the two-altitude rule this document is half of.
- [Running-journal entry template](running-journal-entry.md) — the history half.

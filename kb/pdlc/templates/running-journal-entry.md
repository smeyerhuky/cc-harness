---
type: "Reference"
title: "Running-Journal Entry Template"
description: "The fill-in skeleton for one running-journal entry — one per working session that changed anything — with its frontmatter and six sections: what happened, decisions with the owner, what landed, surprises, verification, and next."
resource: "../journals.md"
tags: ["journal", "reference"]
timestamp: "2026-09-29"
---

# Running-Journal Entry Template

Copy into `kb/process/journal/YYYY-MM-DD-<slug>.md`, fill it in, and add a one-line entry at
the **top** of `kb/process/journal/index.md`. Why and when: [journals.md](../journals.md). A
filled-in example: the [worked example](../worked-example.md#7-close-the-session).

````markdown
---
type: "Journal"
title: "YYYY-MM-DD — <what this session was about>"
description: "<one sentence: what the session set out to do and where it ended>"
resource: "Working session YYYY-MM-DD on branch <branch>"
tags: ["journal", "<descriptor>"]
timestamp: "YYYY-MM-DD"
---

# YYYY-MM-DD — <what this session was about>

**Epic:** <ID or none> · **Milestone:** <M# and its state> · **Branch:** `<branch>`

## What happened

<A short numbered narrative, in order. Link work items and files; don't restate their content.>

## Decisions with the owner

<A table of question → answer, or "None this session." A decision the owner left unanswered is
recorded as "not answered — default holds: …" (pipeline.md, "Owner check-ins").>

## What landed

| Commit | Work item | What |
|---|---|---|
| `<sha>` | <ID> | <one line> |

## Surprises and what they changed

<Anything that went differently than expected — a failed gate, a wrong assumption, a tool
misbehaving — with the measurement and what it changed (a new work item, a rule, a fix). Write
"None." if truly none; an empty section is suspicious.>

## Verification

```
<the gate output, pasted — not paraphrased>
```

## Next

<The immediate next step, and anything the next session must know that the handoff doesn't
already say.>
````

## Related

- [Journals](../journals.md) — the three journals and the two-altitude rule.
- [Handoff template](handoff.md) — the current-state document this entry pairs with.

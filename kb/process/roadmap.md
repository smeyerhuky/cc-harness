---
type: "Playbook"
title: "Harness Roadmap — Milestones and Todos"
description: "The plan for work on the harness itself: milestones in order, each with its todos, an exit criterion, and an owner check-in at its end. Blank until the first harness change is planned."
resource: "../pdlc/pipeline.md"
tags: ["roadmap", "milestone", "backlog"]
timestamp: "2026-09-29"
---

# Harness Roadmap — Milestones and Todos

The plan for work on **the harness itself** — its method, validators, knowledge base, and
scaffold — as opposed to any one project, which keeps its own roadmap under
`projects/<name>/kb/process/`.

## How this roadmap works

- **A milestone ends with an owner check-in.** Work stops at each milestone's exit criterion, the
  owner reviews what landed, and the next milestone starts only on a go-ahead
  ([owner check-ins](../pdlc/pipeline.md#owner-check-ins)).
- **Todos become work items just in time.** The current milestone is decomposed into `CCH-*`
  work items in the [backlog](backlog/index.md) before its work starts; the next one is minted at
  the current one's exit, so the check-in reviews it. Later milestones stay as todo checklists
  here ([the rule](../pdlc/pipeline.md#milestones-check-ins-and-just-in-time-decomposition)).
- **Order is in the edges.** Which item comes next is decided by `DEPENDS_ON`
  ([which item is next](../pdlc/work-items.md#which-item-is-next)), never by prose on this page.
- **The work item is the truth; this page is a view.** A work item's own `state:` wins if it ever
  disagrees with a checkbox below.
- **No story points.** Milestones are sized in slices and closed by their exit criterion.

## Milestones at a glance

No milestones yet. Add the first when the first harness change is planned — the
[worked example](../pdlc/worked-example.md) shows what a milestone, its todos, and its exit look
like.

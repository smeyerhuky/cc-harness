---
type: "Playbook"
title: "Garbage Day Roadmap"
description: "The project's milestones — each with its todos, an exit criterion, and an owner check-in — starting with M0, standing the project up."
resource: "../../../../kb/pdlc/pipeline.md"
tags: ["roadmap", "milestone"]
timestamp: "2026-09-30"
---

# Garbage Day Roadmap

Low-level planning (pipeline stage 2b) for this project: milestones in order, each closed by its
exit criterion and followed by an owner check-in. The current milestone is decomposed into work
items in the [backlog](backlog/index.md) before its work starts, and the next one is minted at its
exit; later ones stay as todos here until their turn.
The rules: [pipeline — milestones](../../../../kb/pdlc/pipeline.md#milestones-check-ins-and-just-in-time-decomposition).

## Milestones at a glance

| Milestone | Goal | State |
|---|---|---|
| **M0** — Stand the project up | The spec says what we're building; the plan says how, in which milestones | active |

## M0 — Stand the project up

- [x] Write the spec in `kb/product/` — what this is, for whom, out of scope, user stories with
  acceptance criteria (pipeline stage 1) — [`GD-TICKET-001`](backlog/GD-TICKET-001.md)
- [ ] Sketch the high-level design in `kb/design/` (pipeline stage 2a), in three parts:
  - [ ] Architecture from the proof of concept — [`GD-TICKET-002`](backlog/GD-TICKET-002.md)
  - [ ] UI language design notes — [`GD-TICKET-003`](backlog/GD-TICKET-003.md)
  - [ ] Tech stack, build and CI pipeline — [`GD-TICKET-004`](backlog/GD-TICKET-004.md)
- [ ] Add the next milestones to this roadmap, and mint the first build milestone's work items
  (the remaining M0 todos are minted as the spec settles them)
- [ ] Decide whether the project warrants a kickoff ceremony
  ([ceremonies](../../../../kb/pdlc/ceremonies.md))

**Exit:** a fresh session could read the spec, the design sketch, and this roadmap and know what
to build first. → **Owner check-in.**

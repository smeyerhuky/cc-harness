---
type: "Process"
title: "PDLC Pipeline — Spec to Done"
description: "The four stages every piece of work in this repo moves through — spec, plan, decomposition, checklists — where each stage's artifacts live at repo and project level, why work loops back, and the one rule that nothing skips a stage silently."
resource: "../ai-sdlc/the-five-phases.md"
tags: ["ai-sdlc", "workflow", "backlog", "milestone"]
timestamp: "2026-09-29"
relationships:
  - type: IMPLEMENTS
    target: /ai-sdlc/the-five-phases.md
---

# PDLC Pipeline — Spec to Done

Four stages, each producing a real file in the repo, each allowed to send work back to an
earlier stage when it finds a gap. It is how this repo puts the
[five AI-DLC phases](../ai-sdlc/the-five-phases.md) into practice: the phases say *what kind of
thinking* happens in what order; this pipeline says *which file holds the result* and *what
happens when a later stage proves an earlier one wrong*.

## The four stages

| Stage | Question it answers | In a project (`projects/<name>/`) | For the harness (repo level) |
|---|---|---|---|
| **1. Spec** | What are we building, for whom, what is out of scope, and what does "done" mean? | The project's spec files — wherever its `CLAUDE.md` says they live (typically a PRD with user stories and acceptance criteria, plus a decisions log) | The root `CLAUDE.md` chain and the relevant `kb/` section |
| **2a. Plan — high level** | How is the system shaped: components, contracts, dependencies? | `kb/design/` (architecture, contracts, tech choices) | `kb/architecture/` |
| **2b. Plan — low level** | In what order, in what slices, with what exit bar? | `kb/process/roadmap.md` — milestones, each with todos and an exit criterion | `kb/process/roadmap.md` |
| **3. Decomposition** | What are the actual units of work, in what order, and can a fresh session pick one up cold? | `kb/process/backlog/` — epics, stories, spikes, tickets | `kb/process/backlog/` (`CCH-*`) |
| **4. Checklists** | What does "actually done" mean, mechanically, for one item or one milestone? | `kb/process/definition-of-done.md` (specializing the repo's [definition of done](definition-of-done.md)), plus the project's own test/lint gates | The [definition of done](definition-of-done.md) itself, its [KB gates](definition-of-done.md#gates), and the [git protocol](../process/index.md) |

Running alongside all four, not a stage of its own: the **running journal** (what happened,
session by session) and the **handoff** (where things stand now) under `kb/process/`. Stage 1-4
artifacts say what *should* be true; the journal and handoff say what *did* happen and what
*is* true today. The rules for work items are in [work-items.md](work-items.md); the journals and
the handoff are in [journals.md](journals.md).

## How the stages map onto the AI-DLC phases

| AI-DLC phase | Pipeline stage | Note |
|---|---|---|
| 1. Specify | 1. Spec | Ambiguity is answered *in the spec file*, never left in chat history ([spec-driven development](../ai-sdlc/spec-driven-development.md)). |
| 2. Plan | 2a/2b. Plan | High-level shape, then milestones with exit criteria. |
| — | 3. Decomposition | The step the five phases leave implicit: turning a plan into work items a session can execute without re-reading the whole history. |
| 3. Build | work items executed one at a time | "Phases beat marathons" — here, one milestone at a time, with an owner check-in at each exit. |
| 4. Validate | 4. Checklists | Applied per item at close, and per milestone at its exit — not re-derived each time. |
| 5. Ship | outside the pipeline | Governed by the [deploy lifecycle](../concepts/deploy-lifecycle.md) and the [git protocol](../process/index.md). |

## Milestones, check-ins, and just-in-time decomposition

Low-level planning (stage 2b) is done in **milestones**:

- **Every milestone has an exit criterion and ends with an owner check-in.** Work stops at the
  exit; the next milestone starts on a go-ahead, not automatically. Delivery is milestone by
  milestone, never all at once.
- **Decompose just in time.** The current milestone is broken into work items before its work
  starts; the next milestone's todos are minted into work items **at the current one's exit**
  (a [definition-of-done](definition-of-done.md) item), so the check-in reviews them before any
  is worked. Later milestones stay as todo checklists in the roadmap. An item found early that
  belongs to a later milestone may be minted early, carrying that milestone. A check-in that
  changes direction then costs a few checkboxes, not a pile of stale items.
- **A milestone's state** in a roadmap's at-a-glance table is one of `planned`, `active`, or
  `done`, optionally followed by a short note ("active — its decisions await the owner").
- **Size in slices, not points.** A milestone is a count of slices closed by its exit criterion,
  not a sum of point estimates.
- **The work item is the truth; the roadmap is a view.** If a checkbox and an item's own
  `state:` disagree, the item wins and the roadmap gets fixed. Which item comes next is decided
  by `DEPENDS_ON` edges ([which item is next](work-items.md#which-item-is-next)), not by roadmap
  prose.

### Owner check-ins

A check-in is an exchange, not only a stop — built so the owner can answer it in one line:

1. **Decisions needed first**, numbered. Each states the question, the **default** the session
   will take, and **what saying no would cost** or change. Only real decisions — not "does this
   look good?".
2. **Then what landed** — items closed, by ID, with anything that went differently than planned.
3. **Then the audit** — the coverage audit's result at a milestone exit.
4. **Say so if there are no decisions**, so a go-ahead is visibly all that is needed.

"Approve the defaults" is a complete answer. **An unanswered decision means its default holds**,
and the running-journal entry records it that way ("not answered — default holds"), so the next
session knows it was never actually decided. When the same question goes unanswered twice, ask it
on its own the next time: a question bundled with a progress report is easy to answer with "keep
going", and can stay open for several milestones.

## Refinement loops back — expected, not a failure

Nothing here is one-directional. A later stage exposing a defect in an earlier one is the
pipeline working, not a process violation:

- **A spike's resolution (stage 3) edits the plan (stage 2).** The spike answers an unknown; the
  answer lands in the design file it was blocking, and the spike's own record says which edit.
- **An apparent plan gap turns out to be a spec gap (stage 1).** Something that can't be designed
  is often missing acceptance criteria, not a design — then the fix lands in the spec, not the
  architecture.
- **A gate failure at stage 4 opens new work at stage 3.** New KB files that tip the retrieval
  gate, for example: the fix becomes its own work item, not a silent patch.
- **Any work item can be re-scoped, split, or declined at any time.** Its `state:` is the only
  state that matters; there is no separate review gate blocking an edit.

## The one hard rule: nothing skips a stage silently

Every change says which stage it belongs to and what it traces to:

- An edit that resolves a finding names the finding (a work-item ID, a decision, a journal
  entry).
- A work item that changes a contract or plan says so and links the file it changed.
- A gap discovered mid-work is **recorded before it is fixed** — as a new work item, or, when the
  fix stays inside the open item's own files, in that item's Resolution and the journal
  ([found while working](work-items.md#found-while-working)). Never a silent in-place workaround.

## The blind spot this rule does not cover

The rule only catches a gap that someone *trips over*. A design that was fully resolved in
stage 2 and never contested can still never reach stage 3: no work item is ever minted for it,
so "trace every item to something real" has nothing to check
([an example](coverage-audit.md#why-this-exists)).

The countermeasure is a periodic **[coverage audit](coverage-audit.md)** — extract every design
commitment, find the milestone, work item, or code that carries it, and file a work item for each
one that has none — on a schedule ([when to run it](coverage-audit.md#when-to-run-it)), not only
when something breaks in front of a user.

## Related

- [The Five Phases of AI-DLC](../ai-sdlc/the-five-phases.md) — the theory this pipeline implements.
- [Spec-Driven Development](../ai-sdlc/spec-driven-development.md) — why stage 1 answers
  ambiguity in files, not chat.
- [Repository as Memory](../ai-sdlc/repository-as-memory.md) — why every stage leaves a file.
- [Harness roadmap](../process/roadmap.md) and [backlog](../process/backlog/index.md) — where
  this pipeline's stage-2b and stage-3 files live for the harness itself.
- [Worked example](worked-example.md) — one change taken through every stage.

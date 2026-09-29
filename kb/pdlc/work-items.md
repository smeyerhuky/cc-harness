---
type: "Policy"
title: "Work Items — Epics, Stories, Spikes, and Tickets"
description: "The rules every backlog in this repo follows: the four kinds, the <PREFIX>-<KIND>-<NNN> ID notation, the frontmatter contract (state, milestone, typed edges), traceability, the five backlog rules, which item is next, what to do with a gap found while working, and how an item is opened, worked, and closed."
resource: "index.md"
tags: ["backlog", "governance", "ai-sdlc"]
timestamp: "2026-09-29"
---

# Work Items — Epics, Stories, Spikes, and Tickets

Stage 3 of the [pipeline](pipeline.md): the units of work a session actually picks up. Every
project keeps its backlog in `projects/<name>/kb/process/backlog/`; the harness keeps its own in
[`kb/process/backlog/`](../process/backlog/index.md). One markdown file per item, following the
[work-item template](templates/work-item.md).

## The four kinds

| Kind | What it is | Done means |
|---|---|---|
| **EPIC** | A goal too large for one item — a multi-milestone deliverable or a cross-cutting concern. Groups other items with `PART_OF`. Not directly executable. | Every part is `done` or `declined`, and the epic's own acceptance criteria hold. |
| **STORY** | One user-facing capability from the spec, ready to build. Its acceptance criteria are quoted from the spec, not paraphrased. | The quoted acceptance criteria demonstrably pass. |
| **SPIKE** | A time-boxed investigation of an unknown that blocks estimating or building something else. Runs real code or measurements where it can, recorded in a spike journal (`spikes/<slug>/JOURNAL.md`). | The unknown is resolved and documented — **never** "the feature works". |
| **TICKET** | A concrete, already-understood unit not tied to a single story: a bug, a chore, a doc fix, a gate failure. | Its acceptance criteria pass. |

## IDs

`<PREFIX>-<KIND>-<NNN>` — e.g. `CCH-TICKET-001`, `SMP-SPIKE-001`.

- **Prefix:** two to four uppercase letters, unique per project, declared in the project's
  `CLAUDE.md`. The harness uses `CCH`.
- **Number:** zero-padded to three digits, sequential **per kind**, never reused — not even for
  a `declined` item.
- **File name:** the ID plus `.md`, in the backlog folder.
- **Reserving a number:** read the "Next free ID per kind" table in the backlog's `index.md`,
  use that number, and bump the table **in the same change**. The table is the only place numbers
  are reserved from; an out-of-date table means the next session mints a colliding ID.

## The frontmatter contract

```yaml
---
type: "Work Item"                       # registered type; lint_authority rejects anything else
title: "<ID>: <short title>"
description: "<one sentence>"
resource: "<what this traces to — a path, or a plain description of the source>"
tags: ["backlog", ...]                  # always `backlog`; add `spike` for spikes; descriptors only
timestamp: "<YYYY-MM-DD created>"
state: "open"                           # a work_item_states value in authority/vocabulary.yaml
milestone: "M1"                         # a roadmap milestone, a range for an epic ("M0-M5"), or "unscheduled"
relationships:
  - type: PART_OF                       # the epic this belongs to — omit if none
    target: <PREFIX>-EPIC-001.md
  - type: DEPENDS_ON                    # an item that must be done first — omit if none; repeat as needed
    target: <PREFIX>-TICKET-003.md
  - type: DERIVED_FROM                  # the source — required unless PART_OF an epic that has one
    target: ../journal/2026-09-29-some-session.md
---
```

- **`state` is the work's lifecycle; `status` is the record's.** A `done` ticket is still a
  current, finalized record. Never put `open`/`done` in `status:` — the relationship validator
  rejects it. The two vocabularies live side by side in
  [`authority/vocabulary.yaml`](../authority/vocabulary.yaml) (`work_item_states`, `statuses`).
- **Dependencies are typed edges, not prose.** `DEPENDS_ON` (inverse `BLOCKS`) lets the order be
  generated with `relationships.py --deps` instead of kept in a hand-drawn diagram that drifts.
- **Edges resolve to files.** Targets are relative paths to real files; the validator fails on a
  target that doesn't exist, and on a `DEPENDS_ON` self-loop or cycle (`BLOCKS` counted as a
  reversed `DEPENDS_ON`) — a backlog with a cycle has no valid work order.

## Traceability

**Every work item traces to something real.** Mechanically — `backlog.py` checks it: an item
carries a `DERIVED_FROM` edge to its source, **or** it is `PART_OF` an epic that does. Acceptable
sources:

- a user story or acceptance criterion in the spec;
- a decision recorded in a decisions log or a ceremony's decisions record;
- a finding in a spike journal or a coverage-audit row;
- a gate failure or discovery recorded in the running journal.

An item with no traceable source is not created. If the source is a conversation with the
owner, the running-journal entry for that session is the file to trace to. An item found while
working on something else always carries its own `DERIVED_FROM` to the journal entry that records
the discovery ([found while working](#found-while-working)).

## The five rules

1. **Trace to something real** — as above.
2. **Never estimate a spike like a story.** Its acceptance criteria are "the unknown is resolved
   and documented", and its output is a decision, not a feature.
3. **Update the backlog index in the same change** that creates, closes, or re-scopes an item —
   both the next-free-ID table and the item listing.
4. **A spike's Proposed Resolution is a real answer.** "TBD" or "needs discussion" is not a
   Proposed Resolution. If there is no candidate answer yet, keep investigating before filing —
   approving a spike should be a fast yes/revise, not a redo of the analysis.
5. **The AI PDLC Prompt stands alone.** A session reading only that section, with no other
   history, must be able to act correctly: it names the goal, the exact files to read and
   touch, where the source material is, and the done-condition — never "as discussed" or "per
   the ceremony".

## An item's life

| Transition | When | What else changes in the same commit |
|---|---|---|
| → `open` | Minted from a traceable source | Backlog index (listing + next-free-ID) |
| `open` → `active` | Work starts on it | — (optional for items finished in one session) |
| → `blocked` | Waiting on something outside the backlog | A note in Description naming the blocker; `DEPENDS_ON` if the blocker is itself an item |
| → `done` | Its acceptance criteria hold | A **Resolution** section (what landed, commits, any deviation from the criteria and why); backlog index; roadmap checkbox; the session's running-journal entry mentions it |
| → `declined` | Deliberately not doing it | A Resolution section saying why; backlog index. The number is never reused. |

**The item is the truth.** The backlog index and the roadmap are views of it. When they
disagree, fix the view.

## Which item is next

The next item is:

1. any item in the current milestone that is **`active`** — finish what is started (if more than
   one is, the handoff names which);
2. otherwise, the **first `open` item in the current milestone**, in backlog-index order, whose
   `DEPENDS_ON` targets are all `done`.

`blocked` items are skipped. **Express order with `DEPENDS_ON`, never with prose** — "do this
first" written in the roadmap is invisible to the rule, and a session following the rule will
skip it. The handoff's immediate next step names the item the rule picks; if the handoff and the
rule disagree, one of them is stale ([keeping the handoff current](journals.md#keeping-the-handoff-current)).

## Found while working

A gap discovered while working on something else is **always recorded** — never a silent fix
([pipeline: nothing skips a stage silently](pipeline.md#the-one-hard-rule-nothing-skips-a-stage-silently)).
Whether it gets its own work item depends on where the fix lands:

- **Fix it inside the open item — no new item** — when all three hold: it is fixed in the same
  session; it touches only files the open item already changes (or makes false by its own
  change); and it changes no contract other work relies on. Record it in the open item's
  Resolution and in the running-journal entry's *Surprises*.
- **Mint a new item** — before fixing it — when any of these holds: the fix is deferred; it
  touches files outside the open item; or it changes a contract (a template, a validator, a rule
  other documents cite). Never fold such a gap into whatever item happens to be open.
- **A minted found item traces to its discovery by a typed edge**: `DERIVED_FROM` the
  running-journal entry (or spike journal) that records how it was found — not only `PART_OF` an
  epic, and not only free text in `resource:`.

The threshold keeps small same-file corrections from producing a work item each, which costs a
one-owner repo more than it returns; the typed edge keeps every minted item findable from the
session that found it.

## Validating a backlog

A backlog is part of its `kb/` bundle, so the bundle's [gates](definition-of-done.md#gates)
validate it — the commands for the harness and for a project are listed there, once. Two of them
check the rules on this page: `relationships.py` (edge types and targets, `state` values, no
dependency cycles) and `backlog.py` (required fields; ID, filename, title, and registered prefix
agree; traceability; `PART_OF` targets an epic and `DEPENDS_ON`/`BLOCKS` a work item; `done` and
`declined` items have a Resolution and spikes a Proposed Resolution; the index lists every item
once with its real state; the next-free-ID table is ahead of every minted number; roadmap
checkboxes agree with the items they link; every journal entry is indexed). Rules not in that
list — a self-contained AI PDLC Prompt, a spike estimated as a spike — are checked by whoever
closes the item.

**A project bundle is validated the same way.** A project's `kb/` has no
`authority/vocabulary.yaml` of its own; `lint_authority.py` and `relationships.py` find the
repo-wide one by walking up to the nearest ancestor `kb/authority/vocabulary.yaml`, and say which
file they used. If they find none — a bundle outside the repo — they say plainly that vocabulary
checks were **not** performed; pass `--vocab <path>` then.

To read the dependency order rather than check it:
`python3 .claude/skills/okf-wikify/scripts/relationships.py <bundle> --deps` — every work item
grouped by level (level 0 waits for nothing), with its `state` and what it waits for, then the
open items that are ready now; it refuses a cycle. `--graph` prints the raw edges and validates
nothing, so neither is the check.

## Why markdown, not GitHub Issues or Projects

The backlog lives in the repo because the repo is the memory a fresh session can always read
([repository as memory](../ai-sdlc/repository-as-memory.md)). GitHub Projects v2 is also a
hard wall here: it is GraphQL-only, and GraphQL is blocked for Claude Code sessions in this
environment. Markdown items need no API, diff cleanly in a PR, and are validated by the same
linters as the rest of the KB.

## Related

- [Work-item template](templates/work-item.md) — the section order every item follows.
- [Pipeline](pipeline.md) — where decomposition sits among the four stages.
- [Harness backlog](../process/backlog/index.md) — where the harness's own `CCH-*` items live.
- [Worked example](worked-example.md) — items minted, ordered, picked, found, and closed in one
  change.

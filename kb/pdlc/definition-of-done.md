---
type: "Policy"
title: "Definition of Done"
description: "The three-tier checklist every project starts from — what every work item must satisfy, what dependency changes add, and what closing a milestone adds — and how a project specializes it without copying it."
resource: "index.md"
tags: ["verification", "governance", "milestone"]
timestamp: "2026-09-29"
---

# Definition of Done

Stage 4 of the [pipeline](pipeline.md): what "actually done" means, mechanically. A work item is
not done because it works; it is done when every applicable line below is true. Each project
adds its own items in `projects/<name>/kb/process/definition-of-done.md` (see *Specializing it*
below); the harness applies this file directly. The validators every change runs are listed once,
in [Gates](#gates) below.

## Every work item

1. **Its acceptance criteria demonstrably pass** — shown by a test, a command's output, or a gate,
   not by "it looks right".
2. **The gates are green.** The project's own gates (build, lint, typecheck, tests — whatever it
   defines) and, if a `kb/` changed, that bundle's KB [gates](#gates).
3. **Tests arrive with the behavior.** Behavior-changing work adds or updates its tests in the
   same change. A feature that composes with another — reads its output, shares its state, or can
   happen right after it — gets at least one test of the real **sequence**, not only tests of each
   in isolation. Bugs between features are exactly the ones a one-feature-per-test-file habit
   cannot see.
4. **Documented in the same change** — everything [an item's life](work-items.md#an-items-life)
   lists for its transition, and the handoff if the state it describes changed
   ([keeping the handoff current](journals.md#keeping-the-handoff-current)).
5. **No silent scope change.** Anything found along the way is recorded — a new work item, or,
   below the threshold, this item's Resolution ([found while working](work-items.md#found-while-working)).
   Any deviation from the acceptance criteria is stated, with the reason, in the Resolution.
6. **Traceable.** The item traces to its source ([work items](work-items.md#traceability)), and
   its commits name its ID.

## Additionally, for dependency changes

7. **The version is chosen deliberately** and the choice recorded where the project keeps its
   technology decisions — current release, maintenance activity, and why this one.
8. **A known-vulnerability check has run** (the ecosystem's audit tool) and is clean, or the
   exception is documented with its reason.
9. **The lockfile is committed.**

## Additionally, for a milestone

10. **Its exit criterion is met in full** — not "mostly".
11. **The coverage audit has run** and every gap it found is a work item
    ([coverage audit](coverage-audit.md)).
12. **Metadata is current** — for a project: `version.json`, its card under
    `projects/kb/projects/`, the handoff, and a running-journal entry for the closing session; for
    the harness: the handoff, a running-journal entry, and the roadmap's milestone table.
13. **The next milestone is minted** — its roadmap todos are work items in the backlog, so the
    check-in reviews them ([decompose just in time](pipeline.md#milestones-check-ins-and-just-in-time-decomposition)).
14. **The owner check-in has happened**, in the [check-in shape](pipeline.md#owner-check-ins) —
    decisions first, each with its default. The next milestone starts on a go-ahead, not
    automatically ([pipeline — milestones](pipeline.md#milestones-check-ins-and-just-in-time-decomposition)).

## Specializing it for a project

A project's `kb/process/definition-of-done.md` **links here and adds only what is specific to
it** — for example, a design-token rule for a UI project, round-trip tests for a file-format
serializer, a recorded visual story for anything user-facing, or a print-test log for a physical
part. Never copy the generic tiers into it: two copies of the same checklist drift apart, and the
project copy is the one that goes stale.

## Gates

The validators a change runs before it is committed, per bundle — **listed here and nowhere
else**; every other document links to this section. They live in
`.claude/skills/okf-wikify/scripts/`.

| Bundle | Gates | Why |
|---|---|---|
| The harness — `kb/` | `lint_okf`, `lint_authority`, `relationships`, `weeding`, `backlog`, `retrieval_eval --gate-recall 0.75` | the KB gates plus the backlog check |
| A project — `projects/<name>/kb/` — and the projects index, `projects/kb/` | `lint_okf`, `lint_authority`, `relationships`, `weeding`, `backlog` | the same checks; only `kb/` has a retrieval eval set, so there is no retrieval gate (`backlog` passes a bundle with no backlog, such as `projects/kb/`) |

`backlog.py` checks the [work-item rules](work-items.md) no other gate does: required fields, ID ↔
filename ↔ title ↔ registered prefix, traceability, edge targets, Resolutions, the backlog index
and its next-free-ID table, roadmap checkboxes, and the journal index.

A project adds its own code gates (build, tests, …) in its `CLAUDE.md`. The vocabulary validators
find the repo-wide vocabulary from any project bundle on their own
([validating a backlog](work-items.md#validating-a-backlog)).

```
S=.claude/skills/okf-wikify/scripts

# The harness
python3 $S/lint_okf.py kb/ && python3 $S/lint_authority.py kb/ && python3 $S/relationships.py kb/ \
  && python3 $S/weeding.py kb/ && python3 $S/backlog.py kb/ \
  && python3 $S/retrieval_eval.py kb/ --gate-recall 0.75

# One project bundle (or projects/kb/)
B=projects/<name>/kb/
python3 $S/lint_okf.py $B && python3 $S/lint_authority.py $B && python3 $S/relationships.py $B \
  && python3 $S/weeding.py $B && python3 $S/backlog.py $B

# Every project bundle — stops at, and exits non-zero on, the first failing one
( for B in projects/kb/ projects/*/kb/; do
    python3 $S/lint_okf.py $B && python3 $S/lint_authority.py $B && python3 $S/relationships.py $B \
      && python3 $S/weeding.py $B && python3 $S/backlog.py $B || { echo "FAILED: $B"; exit 1; }
  done )
```

**Read a gate's exit status directly.** Piping its output (`| tail`, `| grep`) replaces the exit
status with the pipe's, and truncating it can hide the line that matters. A loop needs the subshell-and-`exit 1` form above: `break` alone stops the loop
but leaves its status 0.

## Enforcement, honestly

Most of this list is a **manual discipline**, checked by whoever closes the item — a person or a
session. What is enforced mechanically is only what the [gates](#gates) check: KB structure,
types and tags, relationships, `state`, and dependency cycles, weeding invariants, the backlog
rules `backlog.py` covers (fields, IDs, traceability, edge targets, Resolutions, the index, the
next-free-ID table, roadmap checkboxes, the journal index), and retrieval recall. Wiring more of
this list into CI is a legitimate future milestone for any project; until then, nothing here should
be assumed to be checked unless someone ran it.

## Related

- [Pipeline](pipeline.md) — the checklist stage this file is.
- [Work items](work-items.md) — the closing transitions this checklist gates.
- [Coverage audit](coverage-audit.md) — the milestone tier's sweep.

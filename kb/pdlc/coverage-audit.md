---
type: "Playbook"
title: "Coverage Audit — Design Commitments vs. the Backlog"
description: "The periodic sweep that catches designed features that never became work items — the pipeline's blind spot: list every commitment the spec and design make, find the milestone, work item, or code that carries each one, and file a work item for every commitment nothing carries."
resource: "index.md"
tags: ["verification", "backlog", "workflow"]
timestamp: "2026-09-29"
---

# Coverage Audit — Design Commitments vs. the Backlog

## Why this exists

The [pipeline](pipeline.md)'s rule — nothing skips a stage silently — only catches a gap that
someone *trips over*. A design that was settled and never argued about can go the whole way
through without ever becoming a work item: no one files a ticket for it, so "every item traces to
something real" has nothing to check.

Picture an editor whose architecture document fully designs undo/redo, whose tech stack names
the library for it, and whose `CLAUDE.md` mentions it — yet no milestone, slice, or ticket
carries it. Nobody notices until a tester gets stuck with no way to undo. The usual root cause is
a **delegation**: the first milestone's acceptance criteria say "per the slice plan", the
hand-written slice plan quietly narrows the architecture's scope, and nothing ever compares the
two.

## When to run it

- **At every milestone exit**, before the owner check-in — cheap, and it catches narrowing while
  the milestone is still fresh.
- **After any change to a design document**, including one made by a ceremony's approved
  decisions.
- **Before an MVP checkpoint or a ship** — real usage is what exposes a silent gap; the audit is
  what stops it staying silent afterwards.

## The method

1. **Extract every commitment.** Read the spec, the design documents, the decisions log, and the
   project's `CLAUDE.md`. A commitment is a statement of what the system *will* do or *must*
   have ("the store keeps an undo history", "import reports every unsupported element"). Skip
   rationale, naming choices, and history.
2. **Locate each one.** For every commitment, find the evidence that something carries it:
   - a roadmap milestone that names it explicitly (not one that merely "covers the area");
   - a work item, open or done, whose acceptance criteria include it;
   - code or tests that implement it — with the evidence (a file path, a grep hit, a test name),
     not a recollection.
3. **Give a verdict.** *Covered* · *deferred* (assigned to a later milestone, and says so) ·
   *deliberately partial* (the partial scope is written down) · **gap** (nothing carries it).
4. **File a work item for every gap** before fixing anything, tracing to this sweep
   (`DERIVED_FROM` the coverage-audit file). Never fold a gap silently into whatever milestone is
   in progress ([work items](work-items.md)).
5. **Record the sweep** — the findings table below, dated, in the same change as the new work
   items.

## Where a sweep is recorded

Each project keeps its audit history in `kb/process/coverage-audit.md`, created on the first run
(`type: "Reference"`), one dated section per sweep, newest first. The harness keeps its own at
`kb/process/coverage-audit.md`, created the same way at its first sweep.

```markdown
## Sweep — YYYY-MM-DD (trigger: <milestone exit / design change / pre-ship>)

| Commitment | Source | Milestone? | Work item? | In code? | Verdict |
|---|---|---|---|---|---|
| <what the system will do> | <file and section> | <M# or no> | <ID or no> | <path/test or no> | <covered / deferred / partial / gap → new work-item ID> |
```

## Traps

- **"The plan covers it" is not evidence.** A milestone whose acceptance criteria defer to a
  hand-written plan hides any narrowing that plan made. Check commitments against the design
  document, not against the plan derived from it.
- **Designed is not scheduled.** A commitment described in full detail, with a chosen library
  and a data structure, can still be carried by nothing. Detail makes a gap *less* visible, not
  more.
- **A mention is not coverage.** A line in `CLAUDE.md` or a README restating the design is
  another source of the commitment, not a place that carries it.
- **Evidence, not memory.** "I think that landed in M2" is not a verdict; the milestone text,
  the work-item ID, or the grep hit is.

## Related

- [Pipeline](pipeline.md) — the blind spot this audit closes.
- [Work items](work-items.md) — how a gap becomes a traceable item.
- [Definition of done](definition-of-done.md) — the milestone tier includes running this audit.

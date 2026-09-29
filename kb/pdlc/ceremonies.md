---
type: "Reference"
title: "Ceremonies — Catalog and Triggers"
description: "The four review ceremonies a project can run — kickoff, alignment, triage, investigation — what triggers each, the question each answers, its rounds and outputs, where those outputs live, and how to avoid running ceremony for its own sake."
resource: "index.md"
tags: ["ceremony", "facilitation", "workflow"]
timestamp: "2026-09-29"
---

# Ceremonies — Catalog and Triggers

A ceremony is a deliberate stop to check the plan against reality, run by the
[facilitator](facilitator.md). In every type the default output is the facilitator's journal, the
raw reviewer outputs, and a decisions record; transcripts are optional
([facilitator — synthesize](facilitator.md#4-synthesize--transcripts-and-the-decisions-record)).
There are four shapes, from heaviest to lightest — pick the lightest one that answers the
question in front of you.

## The four types

| | Kickoff | Routine alignment | Triage | Investigation |
|---|---|---|---|---|
| **Question** | Are the spec and plan sound enough to start building? | Is the plan still right, given what we've learned? | Which of these reported problems do we fix, in what order, and which do we decline? | What is actually wrong with this one thing, and what is the right fix? |
| **When** | Once, before a project's (or a large epic's) first build milestone | On a trigger (below) | When real feedback arrives in bulk — a bug bash, a beta round | When a single report turns out to touch design, not just code |
| **Rounds** | Templates first; one long parallel round across every lens (plus real spikes); owner review | Two: parallel research, then synthesis or cross-read | One parallel round; a scoped follow-up if one lens routes questions to another | Usually none — the facilitator investigates directly against primary sources |
| **Outputs** | Journal, per-story design artifacts as needed, contracts, raw `tasks/`, decisions record; spikes under `spikes/` | Journal, raw `tasks/`, decisions record; optionally a transcript per phase (retro, alignment, planning) | Journal, raw `tasks/`, decisions record (`01-decisions-and-backlog.md`) | One decisions document |
| **Size** | largest | medium | small | smallest |

### Kickoff

Run once, before any build milestone, to stress-test the spec and the high-level plan together.
Three phases:

1. **Templates first.** Any artifact the kickoff will produce many of — a design diagram per
   story, a contract per data shape — gets a template before the first one is written, so every
   reviewer produces the same shape. Project-specific templates go in the project's
   `kb/process/templates/`; the PDLC templates are already in [`templates/`](templates/index.md).
2. **One long run.** Every lens dispatched against a single master list covering the whole spec;
   feasibility unknowns become real spikes with runnable code, not literature reviews. Commit
   each artifact as it lands.
3. **Owner review before anything canonical changes.** Everything stays under
   `kb/alignment/kickoff/` until the owner has reviewed it and approved specific changes. Expect
   the kickoff to surface spec gaps, not only design gaps — that is the pipeline's loop-back
   working ([pipeline](pipeline.md)).

### Routine alignment

The workhorse: **retro** (what landed, what went well, what was risky) → **alignment** (the
remaining scope checked against the spec) → **planning** (a sequenced backlog for the next
batch). Scope it to the next batch of work, not the whole remaining project. A pattern that
works: Round 1 dispatches every lens in parallel with a combined retro-plus-alignment brief;
Round 2 is a single synthesis dispatch that turns the agreed decisions into a sequenced plan.

### Triage

For an action-oriented ask — "here are twenty findings, what do we fix?" — build the decisions
record straight from the reviewers' raw outputs (the default for every type; a triage has no
reason to add a transcript). Declined items are listed with their reasons in the decisions
record, so they are not re-raised next round.

### Investigation

One concrete report (a bug, a surprising behavior) that turns out to reach into the design. The
facilitator reads the primary sources itself — the spec, the code — and writes one decisions
document: **the trigger**, **the root cause**, the classification or options considered, any
**constraint discovered** along the way, **what shipped**, a **preserved dissenting view** if
there is one, and the items **deliberately left out**, each with a home (a work item). The
running-journal entry covers the process, so a separate ceremony journal is optional.

## Triggers

Run a ceremony when one of these happens — not on a calendar:

- **The MVP checkpoint** — the roadmap's own built-in "stop and check" point.
- **A milestone's estimate proved wrong** — reality has diverged from the roadmap; don't wait for
  a scheduled checkpoint.
- **A spike result changes the plan** — digest it into the roadmap before committing to a
  timeline that depends on it.
- **Ship** — a retro on the whole build, not just a planning step.
- **Real user or beta feedback** — usually a triage.
- **The owner asks** — "pull the team together and discuss it" is a trigger in its own right.

**Not triggers:** "it's been a while", or a milestone closing on plan with nothing surprising in
its running-journal entries.

## Where the outputs live

```
kb/alignment/
  index.md                      pure TOC — one line per ceremony, newest first
  <slug>/                       e.g. kickoff/, m3-mvp-alignment/, beta-1-triage/, y-editor-overflow/
    index.md                    pure TOC for this ceremony, headline outcome in one paragraph
    facilitators-journal.md     the process (optional for an investigation)
    NN-<phase>-transcript.md    optional transcripts, numbered in order (01-retro-transcript.md, …)
    NN-decisions-and-backlog.md the decisions record, numbered last — the one page meant to be read alone
    tasks/                      raw reviewer output, one file per dispatch, committed on arrival
```

- **Project ceremonies:** `projects/<name>/kb/alignment/`. **Harness ceremonies:**
  `/kb/alignment/`.
- **Templates:** [facilitator's journal](templates/facilitators-journal.md),
  [transcript](templates/transcript.md), [decisions record](templates/decisions-record.md). The
  file names in the tree above are the ones to use; the templates follow them.
- **One folder per ceremony**, even a small one — a flat folder of every ceremony's files becomes
  unreadable by the third.

## Scale the ceremony to the question

- **Pick the lightest type that answers the question.** A triage is not a failed alignment; an
  investigation is not a skipped ceremony.
- **One owner, one project, one assistant** is the common case here — run a ceremony on a
  trigger, never on a cadence; a ritual held because the calendar says so is ceremony for its own
  sake.
- **The value is in the cross-checking**, not the headcount: two lenses that read each other's
  findings beat four that don't ([facilitator](facilitator.md#3-fan-in)).

## After any ceremony

1. Owner approves specific decisions ([output boundary](facilitator.md#5-the-output-boundary)).
2. Approved findings become work items that trace to the decisions record
   ([work items](work-items.md)); canonical edits name the decision they implement.
3. If a design document changed, run a [coverage audit](coverage-audit.md).
4. Close the ceremony journal with *for next time*; the ceremony's outcome changed the next
   action, so the handoff is rewritten with it
   ([keeping the handoff current](journals.md#keeping-the-handoff-current)).

## Related

- [Facilitator](facilitator.md) — how to run any of these.
- [Journals](journals.md) — the ceremony journal and its two-altitude pair, the decisions record.
- [Pipeline](pipeline.md) — ceremonies catch stage-1 and stage-2 gaps on purpose rather than by
  accident.

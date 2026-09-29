---
type: "Playbook"
title: "Facilitator Playbook"
description: "The role the primary session plays when it orchestrates work: picking and dispatching ordinary work items from their AI PDLC Prompts and verifying what comes back, and running review ceremonies — lenses, briefs, fan-in, a decisions record without fabricating anything, and nothing canonical changing until the owner approves."
resource: "index.md"
tags: ["facilitation", "ceremony", "agent", "governance"]
timestamp: "2026-09-29"
---

# Facilitator Playbook

The **facilitator** is the role the primary session plays whenever work is split across more
than one worker: it decides what to do itself and what to hand out, briefs each worker from real
context, collects and **verifies** what comes back, and records the outcome in the repo. It has
two uses:

- **Orchestrating ordinary work** — working the backlog, dispatching work items to subagents where
  that helps ([below](#orchestrating-ordinary-work)). This is the everyday use.
- **Running a review ceremony** — several independent reviews of the work turned into decisions
  and work items, so the owner gets one page of decisions instead of a pile of memos
  ([sections 1–5](#1-set-up)). Which kind of ceremony to run, and when, is in the
  [ceremonies catalog](ceremonies.md).

The role is a practice, not machinery: no persona roster, no agent definition files, no
registry, hooks, or message bus.

## The role

- **The primary session is the facilitator — never a dispatched subagent.** A subagent cannot
  itself dispatch subagents, so a facilitator running as one breaks the chain one level in. The
  primary session also holds the first-hand context of the work being reviewed.
- **It manages; it does not substitute.** The facilitator does not write a reviewer's position,
  does not decide in a reviewer's place, and does not edit canonical files during a ceremony.
- **It may play one lens itself** when it holds first-hand context no fresh reviewer would have
  — for example, covering delivery in a retrospective on milestones it built itself. Say so in
  the ceremony journal.
- **Nothing is fabricated, in either use.** What a reviewer said or a worker did is recorded from
  what it returned and what the facilitator re-ran — never from what it probably did.

## Orchestrating ordinary work

Most of the time there is no ceremony, only a backlog. The facilitator works it:

- **Pick by the rule.** The next item comes from
  [which item is next](work-items.md#which-item-is-next). Items with no `DEPENDS_ON` path between
  them are candidates to run side by side.
- **Inline or dispatch.** Do an item inline when it is small, when it needs the primary session's
  first-hand context, or when it edits files that another item in flight also edits. Dispatch it
  when it is independent, touches its own files, and is large enough that parallel work saves real
  time — or when a fresh context is the point (a cold-start test, an independent check).
- **The AI PDLC Prompt is the brief.** Dispatch the item's prompt as written. If a fresh worker
  could not act on it alone, the item is defective ([rule 5](work-items.md#the-five-rules)) — fix the
  prompt in the item first, don't patch the gap in the brief.
- **Parallel only across disjoint files.** Two workers editing one file produce a conflict one of
  them loses without noticing. Items that share files run one after another, in `DEPENDS_ON` order.
- **A worker's "done" is a claim.** It returns its change and its evidence (the commands it ran and
  their output). The facilitator checks the result against the acceptance criteria, runs the gates
  itself, and only then writes the Resolution and sets `done` — the same *verify the verifiers*
  habit as in a ceremony.
- **Workers stay inside their item.** A worker that finds a gap elsewhere reports it; the
  facilitator applies the found-item rule ([work items](work-items.md)). No worker widens its own
  scope.
- **When dispatch needs the owner.** Dispatching work items is part of the role and needs no
  per-item approval, unless the project's `CLAUDE.md` or the owner says otherwise. It does need the
  owner when the dispatch would act outside the repository, change what the owner asked for, or is
  otherwise a judgment call ([below](#2-brief-and-dispatch)).
- **Record it.** The running-journal entry says which items were dispatched and which done inline,
  and why.

## Running a review ceremony

Five steps, in order — set up, brief and dispatch, fan in, synthesize, and hold the output
boundary. Everything above about the role applies; the ceremony adds lenses, rounds, and the
boundary.

## 1. Set up

1. Confirm the trigger and pick the ceremony type ([ceremonies](ceremonies.md)).
2. Scaffold `kb/alignment/<slug>/`: a pure-TOC `index.md`, `facilitators-journal.md` opened with
   *why this is running*, and a `tasks/` folder for raw reviewer output. A ceremony about the
   harness itself uses `/kb/alignment/<slug>/` the same way.
3. **Choose the lenses.** A lens is one standing concern of the project, not a character:
   typically *scope* (does this still match the spec?), *architecture* (does the design hold?),
   *delivery* (is the plan still accurate?), and *quality* (is verification keeping pace?). Add a
   lens only when a genuinely new concern appears. Record the chosen lenses and why in the
   journal.
4. Commit the scaffold.

## 2. Brief and dispatch

A brief is filled from **real, resolved context** — never a placeholder the reviewer must guess:

- the files to read: the spec sections, design files, and **source code** in scope, not only
  the docs about it;
- what is already known to be open, so reviewers don't spend the round rediscovering it;
- the specific questions for this lens;
- the ask: **structured findings, not dialogue** (the facilitator writes the dialogue), and
  **disagree with the current plan where the evidence warrants** — a review that rubber-stamps
  is wasted;
- where the raw output goes: `kb/alignment/<slug>/tasks/<lens>-<topic>.md`.

**Don't dispatch an ambiguous task.** If a slot in the brief has no real value yet, resolve it
or ask the owner first.

**Rounds:**

- **Round 1 — parallel.** All lenses at once, in one message, in the background. Research plus a
  position.
- **Round 2 — optional.** Either one synthesis dispatch (e.g. turning agreed decisions into a
  sequenced plan), or a **cross-read**: each reviewer reads the others' raw Round 1 output before
  a final pass. The cross-read makes corroboration systematic instead of lucky.
- **Three or more rounds:** continue the same reviewer rather than spawning a fresh one, so its
  own earlier words are available verbatim instead of reconstructed.
- A reviewer whose deliverable *is* a planning document may write that file directly — then the
  facilitator verifies it (lint clean, linked from its index) rather than trusting it.
- **A dispatch that is a judgment call goes to the owner** — for example, whether to dispatch
  another reviewer pre-emptively or wait for one verdict first. Waiting can make the extra
  dispatch unnecessary.

## 3. Fan in

- **Save each raw output to `tasks/` and commit it as it arrives.** A ceremony cut off by a
  session limit keeps everything committed; anything else has to be re-derived.
- **Verbatim, inside a thin wrapper.** `lint_okf` rejects a content file without frontmatter, so
  each raw output gets one: `type: "Reference"`, a title such as `"Raw Output — <lens> Lens"`, a
  one-sentence description of what the lens was asked, `resource: "../facilitators-journal.md"`,
  tags `["ceremony", "facilitation"]`, and the date. Then one quoted line — *Raw reviewer output,
  saved verbatim by the facilitator on arrival. Not edited; not yet cross-checked.* — and below it
  the output exactly as returned. Nothing under that line is edited, not even typos; corrections
  go in the ceremony journal. The [worked example](worked-example.md#when-a-change-needs-a-spike-or-a-review)
  shows the wrapper.
- **Log each arrival** in the ceremony journal with its headline finding.
- **Cross-check every new claim against every prior position** — not only the ones on the same
  topic. It is the highest-leverage habit here: it is how one finding is seen to be confirmed by
  three reviewers from three kinds of evidence, and how two "separate" risks raised a session
  apart are recognized as one root cause.
- **Independent convergence is signal; name it.** Two reviewers reaching the same conclusion
  from different evidence is worth more than either alone.
- **A failed or incoherent dispatch is a finding** — record and report it; don't retry silently
  or paper over it.
- **Route out-of-scope findings; don't fix them.** A reviewer who notices something outside its
  lens is doing its job by reporting it; hand it to the lens (or next round) that owns it.

## 4. Synthesize — transcripts and the decisions record

**The default output is the decisions record, built straight from the raw outputs.** Its
"raised by" and "traces to" columns and its dissent section already carry the attribution. A
**transcript** — the findings turned into attributed dialogue — is **optional**: write one when
the round had real back-and-forth worth reading in order (a multi-phase alignment where one phase
reacts to another), and say why in the ceremony journal. A transcript runs much longer than the
decisions record it accompanies, which is why it is optional.

**The transcript rule: never fabricate a reviewer's substance.** It applies to the decisions
record's attributions and to any transcript. Every position, number, or citation attributed to a
lens traces to that lens's raw output in `tasks/`. In a transcript the facilitator adds
presentation only — ordering, connective narration, and `DECISION N:` callouts — and opens with an
editorial note saying so. In a later phase, a lens's reaction may be drawn from its
already-recorded position; it may never be given new substance.

**Preserve dissent explicitly**, whether or not it changes the outcome. Majority agreement can
bury a correct minority finding unless something deliberately keeps it visible.

**Verify the verifiers.** Before calling the most consequential claims settled — especially a
claim resting on a single reviewer — re-check them against the primary source (the spec, the
code, the manual).

**Two altitudes.** The raw outputs (and any transcripts) are the record; the **decisions
record** is what the owner reads: every decision in order, the resulting work items with their
dependencies, the actions that are the owner's own (not work items), and what was declined and
why. The owner should never have to read the record beneath it to learn what was decided.
Templates: [decisions record](templates/decisions-record.md),
[facilitator's journal](templates/facilitators-journal.md), and — when one is written —
[transcript](templates/transcript.md).

## 5. The output boundary

Everything a ceremony produces lands under `kb/alignment/<slug>/` — **nothing canonical** (spec,
design, roadmap, backlog) changes until the owner has read the decisions record and approved
specific decisions. Then, and only then:

- each approved finding that implies work becomes a work item that traces to the decisions
  record ([work items](work-items.md));
- each canonical edit names the decision it implements;
- the ceremony journal is closed with a *for next time* section.

## Commit cadence

Scaffold → each raw output as it lands → each transcript, if any → the decisions record → the
journal's close. One artifact, one commit; push at the end of the ceremony at the latest.

## Concurrent sessions

A commit or file change you didn't make may come from another session sharing the same checkout,
not from a reviewer acting on its own. Before concluding that a reviewer, hook, or tool
misbehaved, check what else was running at the time.

## What stays out

- **No persona roster and no agent files.** A lens is a brief, not an identity. Which lenses a
  ceremony used lives in its journal.
- **No coordination infrastructure.** Committed files under `kb/alignment/<slug>/` are the state;
  a session-scoped task list is fine for the facilitator's own scratch tracking but is not the
  record.
- **Renderings are views.** A published page or visual timeline of a ceremony is generated from
  the committed files; if they disagree, the files win.

## Related

- [Journals](journals.md) — the ceremony journal and the two-altitude rule.
- [Work items](work-items.md) — where approved findings go.
- [Pipeline](pipeline.md) — ceremonies are how stage-2 and stage-3 gaps get caught deliberately.

---
type: "Concept"
title: "Journals — Running, Spike, and Ceremony"
description: "The three journals every project keeps — a running journal per working session, a spike journal per investigation, a ceremony journal per review — each paired with a short current-state document, so a fresh session can rebuild the reasoning from files instead of agent memory."
resource: "index.md"
tags: ["journal", "handoff", "spike", "memory"]
timestamp: "2026-09-29"
---

# Journals — Running, Spike, and Ceremony

A journal is written **while the work happens**, not reconstructed afterwards, and committed as
ordinary files. That is what lets a session that was interrupted — or a completely fresh one —
pick up the reasoning, not just the code. A session cut off mid-run by a session limit loses
only what was never committed: whatever its journal already holds as a file, the next session
can recover ([repository as memory](../ai-sdlc/repository-as-memory.md)).

## The three journals

| | Running journal | Spike journal | Ceremony journal |
|---|---|---|---|
| **Scope** | one working session | one investigation of an unknown | one review ceremony |
| **Every project has one?** | **yes — always** | when a spike runs | when a ceremony runs |
| **Lives in** | `kb/process/journal/YYYY-MM-DD-<slug>.md` | `spikes/<slug>/JOURNAL.md` | `kb/alignment/<slug>/facilitators-journal.md` |
| **Shape** | what happened · decisions · what landed · surprises · verification · next | Purpose → Method → Findings → Discrepancies → Open Questions → Artifacts, then dated addenda | why · lenses · dispatch log · for next time |
| **Paired with** (current state) | `kb/process/handoff.md` | its SPIKE item's Resolution | the ceremony's decisions record |
| **Template** | [running-journal-entry](templates/running-journal-entry.md) | [spike-journal](templates/spike-journal.md) | [facilitators-journal](templates/facilitators-journal.md) |

The paths are relative to the project (`projects/<name>/…`) or, for the harness itself, to the
repo root — the same paths either way.

## Running journal

**Every project keeps one, and so does the harness** ([`kb/process/journal/`](../process/journal/index.md)).
It is the project's continuous memory: the thread that ties work items, commits, and owner
decisions together in the order they actually happened.

- **One entry per working session that changed anything**, named `YYYY-MM-DD-<slug>.md`. Two
  sessions on one day get two slugs. A **working session** is the work up to an owner check-in or
  the end of the Claude session, whichever comes first: a long Claude session that passes two
  check-ins writes three entries, and the work after a check-in always starts a fresh one.
- **An index, newest first**, with a one-line summary per entry — reading the index alone gives
  the project's recent history at a glance.
- **Append, don't rewrite.** Fix a typo freely; correct a wrong claim in a *later* entry that
  says what was wrong. The history is only trustworthy if it isn't edited after the fact.
- **Cite, don't restate.** Name the commits and work-item IDs; link the design file or decision
  rather than copying its content. The journal records *that* and *why* something happened —
  substance lives in the spec, design, and backlog.
- **Record surprises honestly.** A gate that failed, a guess that was wrong, a tool that
  misbehaved — with the measurement, and with what it changed. These are what the next session
  most needs and is least able to rediscover.

**One file per session, not one growing file.** A single running log defeats progressive
disclosure: it grows to thousands of lines that a session must load whole to find last week.
Per-session files let a session load the index plus the two or three entries it needs.

## Spike journal

Opened when a SPIKE item runs real code, measurements, or a wide reading of sources. It is the
evidence behind the spike's Proposed Resolution.

- **Lives outside `kb/`**, at `spikes/<slug>/JOURNAL.md`, because a spike's folder also holds
  throwaway code, fixtures, and logs that are not knowledge-base records. The SPIKE item links to
  it; the journal links back to the item.
- **Purpose → Method → Findings → Discrepancies → Open Questions → Artifacts.** *Method* says what
  was actually run or read, so the result can be reproduced. *Discrepancies* records where a
  prior belief, a document, or a secondhand report turned out wrong — often the most valuable
  section: a secondhand description of an API that is wrong can make code built on it silently
  do nothing.
- **Dated addenda, never rewrites.** A follow-up check appends `## Addendum — YYYY-MM-DD` with
  its own method and findings. The original findings stay as written.

The [worked example](worked-example.md#when-a-change-needs-a-spike-or-a-review) shows where a
spike fits into ordinary work.

## Ceremony journal

Kept by the facilitator during a review ceremony (kickoff, alignment, triage, investigation). It
records the **process** — why the ceremony ran, who was dispatched and with what brief, what
came back in what order, what to change next time — while the ceremony's raw outputs and
decisions record (and any optional transcripts) hold the **content**. How to run the ceremony it
records is in the [facilitator playbook](facilitator.md); its shape is the
[facilitator's-journal template](templates/facilitators-journal.md), with companion templates
for the [decisions record](templates/decisions-record.md) and the optional
[transcripts](templates/transcript.md).

## Two altitudes, always

Every journal is history, and history is the wrong thing to hand someone who asks "where are
we?". Each journal therefore pairs with a short document at a higher altitude:

| History (appended) | Now (rewritten) | Rule |
|---|---|---|
| running journal | `kb/process/handoff.md` | the handoff is rewritten in the same commit as any change to what it describes ([keeping it current](#keeping-the-handoff-current)) |
| spike journal | the SPIKE item's Proposed Resolution, then its Resolution once closed | the item states the answer; the journal holds the evidence |
| ceremony journal + raw outputs (+ any transcripts) | the decisions record | the one page meant to be read alone |

**Never make the owner read the history to find out the state.**

## The handoff

`kb/process/handoff.md` — one per project, one for the harness
([`kb/process/handoff.md`](../process/handoff.md)). A fresh session reads it first. It holds:
a **snapshot** (active epic, milestone, branch, what landed, gate status), the **immediate next
step**, any **standing rules** for the current work, how to **verify the baseline**, and a
**paste-ready cold-start prompt**. See the [handoff template](templates/handoff.md).

Keep exactly one. A handoff *and* a separate next-sprint prompt soon disagree — on test counts,
on the next step — because two documents describing "now" drift apart.

### Keeping the handoff current

**Rewrite the handoff's snapshot and immediate next step in the same commit as any change to what
they describe** — a milestone changing state, an owner decision, or a change to the next action
(an item minted ahead of the current one, activated, closed, or blocked). Not only at session end:
a session cut off mid-run leaves whatever the handoff last said, and a fresh session follows it.
Minting an item that changes the next action, for example, and leaving the handoff naming the old
one, sends the next cold start to the wrong item.

**When the views disagree**, trust them in this order: the work item's own `state:`, then the
handoff, then the roadmap — and fix the one that lost. The next action itself is chosen by the
[next-item rule](work-items.md#which-item-is-next).

## Closing a session

Before a session that changed anything ends:

1. Close or update the work items it touched (`state`, Resolution).
2. Tick the roadmap and update the backlog index — both are views of the items.
3. Write the running-journal entry and add it to the index.
4. Check the handoff is current — it should already be, since it is rewritten with every change
   to what it describes ([above](#keeping-the-handoff-current)); fix it if not.
5. Run the [gates](definition-of-done.md#gates); commit; push. Commit after every artifact while
   working; **push at session close at the latest** — the one push-timing rule (a milestone
   boundary or a ceremony's end falls inside a session, so it is covered).

## Related

- [Pipeline](pipeline.md) — journals run alongside all four stages.
- [Work items](work-items.md) — a SPIKE item and its spike journal link to each other.
- [Templates](templates/index.md) — running-journal entry, spike journal, handoff.

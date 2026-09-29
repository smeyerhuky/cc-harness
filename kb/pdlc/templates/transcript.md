---
type: "Reference"
title: "Transcript Template"
description: "The fill-in skeleton for a numbered ceremony transcript — attendees, the editorial note that nothing is fabricated, attributed positions traced to raw output, DECISION and DISSENT callouts, and a findings summary."
resource: "../facilitator.md"
tags: ["ceremony", "facilitation", "reference"]
timestamp: "2026-09-29"
---

# Transcript Template

Copy into `kb/alignment/<slug>/NN-<phase>-transcript.md` (e.g. `01-retro-transcript.md`). A
transcript turns the reviewers' structured findings into readable, attributed dialogue — and
**adds nothing of substance**: every position, number, or citation traces to a raw output in
`tasks/`. **Optional in every ceremony type**: the default output is the journal, the raw outputs,
and the decisions record; write a transcript only when the round had back-and-forth worth reading
in order, and say why in the ceremony journal. The rules:
[facilitator.md — synthesize](../facilitator.md#4-synthesize--transcripts-and-the-decisions-record).

````markdown
---
type: "Reference"
title: "<Phase> Transcript — <ceremony name>"
description: "<one sentence: what this phase examined and its headline outcome>"
resource: "facilitators-journal.md"
tags: ["ceremony", "facilitation"]
timestamp: "<YYYY-MM-DD>"
---

# <Phase> Transcript — <ceremony name>

**Attendees:** Facilitator (chair) · <lens name> · <another lens name>
**Subject:** <what is under review in this phase>

> Editorial note (Facilitator): reconstructed from the reviewers' raw outputs in `tasks/`, not
> live speech. Every position, number, or citation attributed to a lens traces to its raw
> output; the facilitator added only ordering, narration, and decision callouts. Nothing here is
> invented for color.

---

**FACILITATOR:** <Framing: the trigger, and the question this phase must answer.>

**<LENS NAME>:** <A position and its evidence, drawn from that lens's raw output.>

**<ANOTHER LENS NAME>:** <Corroboration from different evidence, or a disagreement — name which.>

> **DECISION <decision number>:** <What was decided, which lens raised it, and what it traces to.
> Numbers run continuously across all of this ceremony's transcripts.>

> **DISSENT (<lens name>):** <A position that was not adopted, kept on the record, and why it was
> not adopted.>

---

## Findings summary

- <A finding — the lens(es) that raised it — converged or contested — the decision it fed, if
  any.>
````

## Related

- [Decisions-record template](decisions-record.md) — the one page that consolidates every
  transcript's decisions.
- [Facilitator's-journal template](facilitators-journal.md) — the process behind the transcript.

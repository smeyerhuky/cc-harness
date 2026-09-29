---
type: "Reference"
title: "Decisions-Record Template"
description: "The fill-in skeleton for a ceremony's decisions record — the one page meant to be read alone: questions answered, every decision, new work items, the owner's own actions, what was declined, and dissent on record — with variants for triage and investigation."
resource: "../facilitator.md"
tags: ["ceremony", "backlog", "reference"]
timestamp: "2026-09-29"
---

# Decisions-Record Template

Copy into `kb/alignment/<slug>/NN-decisions-and-backlog.md` as the last numbered file of the
ceremony. It is **the page the owner reads** — they should never need the raw outputs or a
transcript to learn what was decided. Work items are listed as *proposed* until the owner approves; they are minted only
after approval ([output boundary](../facilitator.md#5-the-output-boundary)).

````markdown
---
type: "Reference"
title: "Decisions & Backlog — <ceremony name>"
description: "<one sentence: the outcome of this ceremony>"
resource: "facilitators-journal.md"
tags: ["ceremony", "backlog"]
timestamp: "<YYYY-MM-DD>"
---

# Decisions & Backlog — <ceremony name>

The one page meant to be read alone. The process is in `facilitators-journal.md`; raw reviewer
output is in `tasks/`; any transcripts are the numbered files beside this one.

**Approval:** <approval status — either "awaiting the owner" or "approved YYYY-MM-DD: decisions 1, 3, 4">

## The questions asked, answered

1. **<A question the ceremony was asked.>** <The answer, in one short paragraph.>

## Decisions

| # | Decision | Raised by | Traces to |
|---|---|---|---|
| <decision number> | <the decision> | <lens name(s)> | <transcript section or raw-output file> |

## Proposed work items

| Proposed item | Covers | Depends on | Minted as |
|---|---|---|---|
| <kind and short title> | <what it covers> | <other proposed items, or none> | <the work-item ID once minted after approval> |

## The owner's own actions

<Things no session can do — testing with a real user, a purchase, a judgment call reserved for
the owner. Logged here, not ticketed. "None." if none.>

## Declined

| Proposal | Why declined |
|---|---|
| <what was proposed> | <the reason — so it is not re-raised next time> |

## Dissent on record

<Positions not adopted, who held them, and why they were not adopted. "None." if the ceremony
reached genuine agreement.>
````

## Variants by ceremony type

| Type | Change to the skeleton |
|---|---|
| Kickoff, alignment | Use as is. "Traces to" cites a transcript section if one was written, otherwise the raw-output file and finding. |
| **Triage** | "Traces to" cites raw-output files directly. Every reported item appears exactly once: under *Proposed work items* or under *Declined*. |
| **Investigation** | Replace *The questions asked, answered* with: **Trigger** · **Root cause** · **Options considered** · **Constraint discovered** (if any) · **What shipped** · **Left out, each with a home** (a work item). Keep *Dissent on record*. |

## Related

- [Transcript template](transcript.md) — where decisions are first called out.
- [Ceremonies](../ceremonies.md) — which type you are running.
- [Work items](../work-items.md) — how an approved proposal becomes a minted item.

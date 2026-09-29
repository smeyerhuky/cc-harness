---
type: "Reference"
title: "Work-Item Template"
description: "The fill-in skeleton for an epic, story, spike, or ticket — frontmatter plus the six body sections in order — with per-kind notes on what each section must contain."
resource: "../work-items.md"
tags: ["backlog", "reference"]
timestamp: "2026-09-29"
---

# Work-Item Template

Copy the block below into `kb/process/backlog/<ID>.md`, fill every slot, and delete the notes in
angle brackets. The rules behind each field are in [work-items.md](../work-items.md); a
filled-in ticket is in the [worked example](../worked-example.md#3-decompose-stage-3).

````markdown
---
type: "Work Item"
title: "<PREFIX>-<KIND>-<NNN>: <short title>"
description: "<one sentence: what this item delivers or resolves>"
resource: "<the source it traces to: a path, or a plain description>"
tags: ["backlog", "<descriptor>", "<descriptor>"]
timestamp: "<YYYY-MM-DD>"
state: "open"
milestone: "<M#, a range for an epic, or unscheduled>"
relationships:                  # keep only the edges that apply; delete the others
  - type: PART_OF               # omit if the item belongs to no epic
    target: <ID of the epic this belongs to>.md
  - type: DEPENDS_ON            # omit if nothing must be done first; repeat for each dependency
    target: <ID of an item that must be done first>.md
  - type: DERIVED_FROM          # required, unless PART_OF an epic that carries one; a found item always has one, to its journal entry
    target: <relative path to the file this traces to>
---

# <PREFIX>-<KIND>-<NNN>: <short title>

## Description

<What this is and why it exists, in plain language. Name the source finding or story and what
it said. For a found-while-working item: what was being done, what was observed, how it was
reproduced.>

## Acceptance Criteria

<Bulleted, checkable statements.
 STORY — quote the spec's criteria verbatim (Given/When/Then if the spec uses it).
 SPIKE — "The unknown is resolved and documented: …" — never "the feature works".
 EPIC  — which parts must be done, and what must hold across them.
 TICKET — the concrete conditions, including which gates must pass.>

## Linked Artifacts

<Links to the spec section, design file, spike journal, decisions record, or journal entry this
traces to or touches.>

## Proposed Resolution

<SPIKE: required — the concrete candidate answer, so approval is a fast yes/revise.
 Others: optional — include when the approach is not obvious. Delete this section otherwise.>

## AI PDLC Prompt

<Self-contained: the goal; the exact files to read and to change; where the source material
is; any trap to avoid; and the done-condition, including the gates and the index/roadmap/journal
updates. Must be actionable with no other context. EPIC: say it is not directly executable and
which parts to dispatch.>

## Resolution

<Added when the item closes. What landed and in which commit(s); any deviation from the
acceptance criteria and why; for `declined`, why it was declined.>
````

## Per-kind notes

| Kind | `milestone` | Proposed Resolution | AI PDLC Prompt |
|---|---|---|---|
| EPIC | a range, e.g. `M0-M5` | optional ("the sum of its parts" is fine) | "Not directly executable — work the parts in roadmap order" |
| STORY | the milestone that builds it | optional | build steps + the quoted acceptance criteria as the done-condition |
| SPIKE | the milestone it unblocks | **required, a real answer** | how to run the investigation and where to record it (`spikes/<slug>/JOURNAL.md`) |
| TICKET | the milestone it lands in | optional | the exact change + reproduction for bugs + the gates |

## Related

- [Work items](../work-items.md) — the rules.
- [Pipeline](../pipeline.md) — where work items sit in the four stages.

---
type: "Reference"
title: "Spike-Journal Template"
description: "The fill-in skeleton for a spike journal at spikes/<slug>/JOURNAL.md — Purpose, Method, Findings, Discrepancies, Open Questions, Artifacts, then dated addenda."
resource: "../journals.md"
tags: ["spike", "journal", "reference"]
timestamp: "2026-09-29"
---

# Spike-Journal Template

Copy into `spikes/<slug>/JOURNAL.md` (inside the project for project work, at the repo root for
harness work). The spike folder may also hold throwaway code, fixtures, and logs; the journal is
the record of what they showed. It lives outside `kb/`, so it carries no OKF frontmatter. Why
and when: [journals.md](../journals.md). Where a spike fits into ordinary work: the
[worked example](../worked-example.md#when-a-change-needs-a-spike-or-a-review).

````markdown
# Spike Journal — <the question, in a few words>

**Work item:** [<PREFIX>-SPIKE-<NNN>](<relative path to the item>) · **Opened:** YYYY-MM-DD
· **Source pinned at:** <repo@commit, dataset version, or tool version — whatever makes it reproducible; delete this field if nothing needs pinning>

---

## Purpose

<The one question this spike answers, why it blocks something, and any scope limits set before
starting.>

## Method

<What was actually run or read, step by step, so someone else can reproduce it. Commands, files,
fixtures, versions. "Read X" beats "reviewed the docs".>

## Findings

<What was observed, with the evidence: output, measurements, file citations. Tables welcome.
Separate what was measured from what is inferred.>

## Discrepancies

<Where a prior belief, a document, an estimate, or a secondhand report turned out wrong, and
what the ground truth is. Often the most valuable section — say "None found" explicitly if so.>

## Open Questions

<What this spike could not settle, and who or what can. When the owner answers, record the
answer here with the date.>

## Artifacts

<Links to scripts, fixtures, logs in this folder, and to the files this spike changed or fed
(the design edit, the work items it produced).>

---

## Addendum — YYYY-MM-DD

<A later follow-up check: its own short method and findings. Append; never rewrite the findings
above.>
````

## Related

- [Journals](../journals.md) — where spike journals fit.
- [Work items](../work-items.md) — the SPIKE item whose Proposed Resolution this journal backs.

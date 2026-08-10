---
type: "Playbook"
title: "Weeding Policy: Retiring Stale KB Records"
description: "The operational procedure for deprecating and superseding KB records on a defined, reversible path — supersede, don't delete — enforced by weeding.py."
resource: "DPC Digital Preservation Handbook; SAA (deaccession); library-science/collection-development.md"
tags: [collection-development, provenance, governance, library-science]
timestamp: "2026-08-09"
relationships:
  - type: ELABORATES
    target: /library-science/collection-development.md
---

# Weeding Policy: Retiring Stale KB Records

This is the operational form of [collection-development](collection-development.md):
the exact steps for retiring a record so the KB stays trustworthy as it grows,
without ever destroying the memory. Enforced by
[`weeding.py`](../../.claude/skills/okf-wikify/scripts/weeding.py).

## Principle: supersede, don't delete

Deleting a stale record destroys provenance and breaks any link to it. Instead we
*retire* it in place: mark it deprecated and point forward to what replaces it.
The content stays as a tombstone a reader can still find — but is told not to act
on. Retirement is **reversible**: un-weeding is just removing the two fields.

## When to weed — triggers, not the calendar

Weed on a **trigger**, never on age alone:

- the platform/tool a lesson is about is no longer used (e.g. we stop deploying to it);
- a tool update fixed the gotcha the lesson warned about;
- a newer record supersedes the claim;
- the claim was found to be wrong.

`weeding.py --candidates --older-than N` lists old records as a **shelf-read** —
a prompt to check whether a trigger applies — but old is not itself a trigger.

## Procedure

### A. Retire a record that a newer one replaces

1. Confirm the replacement record exists and is correct.
2. In the record being retired, add to its frontmatter:
   ```yaml
   status: "deprecated"
   relationships:
     - type: SUPERSEDED_BY
       target: /path/to/replacement.md
   ```
3. Leave the body intact. Optionally add a one-line note at the top pointing to
   the replacement.
4. Run `python3 .claude/skills/okf-wikify/scripts/weeding.py kb/` — it must pass.

### B. Retire a record with no replacement (deliberate removal)

1. Add `status: "deprecated"` and a `weeded_reason:` documenting why nothing
   replaces it (e.g. `"Fly.io platform dropped 2026-09; recipe no longer relevant."`).
2. Run the audit — `weeded_reason` satisfies invariant I1 in place of a
   `SUPERSEDED_BY` edge.

### C. Un-weed (reverse a retirement)

Delete the `status` and the `SUPERSEDED_BY` edge (or `weeded_reason`). The record
is current again. No content was lost.

## What the audit enforces

`weeding.py` checks two hard invariants and one readiness warning:

| Check | Rule |
|---|---|
| **I1** | `status: deprecated` ⇒ has a `SUPERSEDED_BY` edge **or** a `weeded_reason` — no silent tombstones |
| **I2** | has `SUPERSEDED_BY` ⇒ `status: deprecated` — supersession and status stay consistent |
| **P** (warning) | a record with no `resource` cannot be re-verified before weeding — provenance is weeding-readiness |

Hard-invariant violations fail the run (exit 1); provenance gaps warn (fail only
with `--strict`).

## How this closes the loop

The `status` + `SUPERSEDED_BY` fields this policy writes are the same ones
[Phase 3](metadata-and-application-profiles.md)'s
[`relationships.py --current`](../../.claude/skills/okf-wikify/scripts/relationships.py)
reads to answer *"is this record still current?"*. Weeding is where those edges
come from: the [retrieval eval](retrieval-and-progressive-disclosure.md) rewards
a corpus whose stale records are marked rather than left to dilute results, and
`--current` gives an agent a one-command answer instead of a guess. Tending the
collection and querying it are two ends of one mechanism.

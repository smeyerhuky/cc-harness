---
type: "Concept"
title: "Collection Development, Weeding, and Provenance for the KB"
description: "Applies the library practices of selection, deaccession (weeding), and provenance to a knowledge base (KB) that accretes every session, so it stays trustworthy instead of just large."
resource: "SAA Dictionary of Archives Terminology; DPC Digital Preservation Handbook; Open Courseware in LIS"
tags: [collection-development, provenance, memory, library-science]
timestamp: "2026-08-09"
---

# Collection Development, Weeding, and Provenance for the KB

## A KB is a collection, and collections need tending

[Repository-as-memory](../ai-sdlc/repository-as-memory.md) says every phase
leaves a permanent record. True, and load-bearing — but a library learned long
ago that *"keep everything forever"* is not a collection policy, it is how a
collection stops being trustworthy. LIS calls the tending discipline **collection
development**: deliberate *selection* of what to add, *weeding* of what to
retire, and *provenance* so every item can be trusted. The harness's `lessons/`
directory is the clearest case — it grows every time something bites us, and
without tending it drifts from "hard-won lessons" toward "archive of things that
used to be true."

## Selection: what earns a place

Not every session artifact belongs in the durable KB. The existing rule of thumb
in the root `CLAUDE.md` — *prefer a new file over expanding an existing one; keep
each file to a single concept* — is a selection policy already. LIS sharpens the
question: a KB file earns its place when a **future session with a specific need**
would retrieve it. A note only its author would ever want is a session artifact,
not a collection item; it belongs in the commit message or the PR, not `kb/`.

## Weeding (deaccession): what to retire, and how

Libraries *weed* — deliberately remove material that is superseded, inaccurate,
or no longer used — and archives call the formal version **deaccession**. The
harness has no such practice yet, so stale lessons accumulate silently. The LIS
move is not to delete-and-forget (that destroys the memory) but to mark status
and preserve the trail:

- **Supersede, don't silently delete.** When a lesson is overtaken, mark it and
  point forward. OKF's optional `status: deprecated` field and a `SUPERSEDED_BY`
  [relationship edge](metadata-and-application-profiles.md) are the mechanism —
  the record stays for provenance, but a reader is told not to act on it.
- **Weed on a trigger, not a calendar.** A lesson about a platform we no longer
  deploy to, or a gotcha a tool update fixed, is the trigger. The `timestamp`
  field makes staleness visible; the `resource` field lets a reviewer re-check
  the source before retiring the claim.

This is [Phase 5 of the roadmap](roadmap.md), now shipped as the operational
[weeding policy](weeding-policy.md): status marking and supersession rather than
deletion, enforced by
[`weeding.py`](../../.claude/skills/okf-wikify/scripts/weeding.py).

## Provenance: the trait that makes memory trustworthy

The **`resource`** frontmatter field is provenance in the digital-preservation
sense the DPC Handbook (the field's standard free reference, per the research
doc) describes: it records *where a claim came from* so a later reader can trace
and re-verify it. The harness already couples this with a behavioral rule — *cite
file paths when you answer* — which is nothing but bibliographic citation applied
to KB retrieval. Together they give the property a durable memory actually needs:
not just that a claim is *recorded*, but that it is *traceable*. A lesson whose
`resource` points at a real session, error code, or commit can be re-checked and
confidently weeded when it goes stale; a lesson with no provenance can only be
guessed about. Provenance is what separates [repository-as-memory](../ai-sdlc/repository-as-memory.md)
from a repository of unfalsifiable folklore.

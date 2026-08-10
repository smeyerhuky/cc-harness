---
type: "Concept"
title: "Progressive Disclosure as an Information-Retrieval System"
description: "Frames the harness's load-two-or-three-files pattern as a classic IR problem and imports precision/recall, indexing, and cross-references to make it measurable."
resource: "Core IR (indexing, ranking, precision/recall); Open Courseware in LIS, Module 4"
tags: [information-retrieval, progressive-disclosure, context-management, library-science]
timestamp: "2026-08-09"
relationships:
  - type: ELABORATES
    target: /concepts/progressive-disclosure.md
---

# Progressive Disclosure as an Information-Retrieval System

## The reframe

The harness's [progressive-disclosure](../concepts/progressive-disclosure.md)
rule — *load the two or three files that answer the question, never the whole
tree* — is not a bespoke trick. It is the goal statement of **information
retrieval**, the IR discipline the research doc puts in Module 4: return the
*right few* documents for an information need, ranked, without dumping the
corpus. Naming it that way lets us borrow IR's evaluation vocabulary, which the
current rule lacks.

## Precision and recall for agent file-selection

Two IR measures describe every retrieval an agent does when it picks KB files:

- **Precision** — of the files it loaded, how many were actually relevant?
  Low precision = wasted context window, the exact cost progressive disclosure
  exists to avoid.
- **Recall** — of the files that *were* relevant, how many did it load?
  Low recall = a right answer sitting one un-followed link away, unread.

The tension is the classic one. "Load the whole KB" is perfect recall, ruinous
precision (and the failure mode progressive disclosure names). "Load exactly one
file" risks low recall. The section-index → content-file navigation the KB
already prescribes is a precision/recall *balance point*, and framing it this way
tells us where each LIS technique pushes the dial:

| Technique | Pushes | How |
|---|---|---|
| [Authority control](authority-control.md) | **recall** ↑ | consolidated tags stop splitting one concept across spellings, so a tag query finds all of it |
| Scope notes in the vocabulary | **precision** ↑ | a descriptor with a clear scope note is applied to fewer wrong files |
| `related` / "see also" cross-refs (RT) | **recall** ↑ | the one relevant file a link away gets followed instead of missed |
| Section `index.md` files | **precision** ↑ | the index is a hand-built ranking that routes past irrelevant siblings |

## Concrete moves this justifies

1. **Cross-references are a retrieval feature, not decoration.** The KB already
   says "link liberally"; IR explains *why* — every `related` edge is a recall
   improvement. The [controlled vocabulary](../authority/vocabulary.yaml) records
   `related:` (RT) edges between descriptors for exactly this.
2. **The index files are the ranking function.** They are hand-curated "best
   next reads," which is what a ranking model approximates. Keeping them accurate
   is keeping precision high — a reason to update an `index.md` in the same commit
   that adds a file, not later.
3. **Retrieval is measurable — and now measured.** When an agent answers from
   the KB, the files it cited are its result set; whether the right files were
   loaded is a precision/recall judgment an eval can score.
   [`retrieval_eval.py`](../../.claude/skills/okf-wikify/scripts/retrieval_eval.py)
   ([Phase 4](roadmap.md), shipped) does exactly this: it runs the
   [eval set](eval/retrieval-evalset.yaml) — realistic questions with gold
   relevant files — against a transparent TF-IDF retriever over `kb/` and reports
   precision/recall/F1 at k. Crucially it is *sensitive to the edits this overlay
   makes*: turning on controlled-vocabulary query expansion (the `related`/`use_for`
   edges) lifts mean recall@3 from **0.78 to 0.90** on the current corpus — the
   "see also improves recall" claim above, as a measured number rather than an
   assertion. (Precision@3 reads low because gold sets are deliberately tight —
   often one file — so P@3 caps near 0.33; recall@3 is the headline metric here.)
   That makes "did this KB change help retrieval?" a number a human can watch,
   and gives CI a `--gate-recall` regression check.

The point is not to bolt a search engine onto the repo. It is that the harness is
*already running an IR system by hand*, and IR's century of theory tells us which
cheap edits (consolidate tags, add the "see also", fix the index) most improve
the answers a fresh session can retrieve.

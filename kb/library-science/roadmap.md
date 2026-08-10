---
type: "Playbook"
title: "Roadmap: Adopting Library Science in the Harness"
description: "Six phases for bringing LIS techniques into the agentic harness, ordered by leverage-over-cost, from shipped authority control to a retrieval eval and a weeding policy."
resource: "Open Courseware in Library & Information Science (uploaded 2026-08-09)"
tags: [roadmap, library-science, knowledge-organization, governance]
timestamp: "2026-08-09"
---

# Roadmap: Adopting Library Science in the Harness

Ordered by leverage over cost. Each phase names the LIS discipline it draws
from (see the [discipline map](discipline-map.md)), the harness mechanism it
touches, and a concrete "done" test. Phase 0 and Phase 1 ship in this change;
2–5 are staged so each is independently valuable and non-breaking.

---

## Phase 0 — Frame the lens *(shipped here)*

**Discipline:** all of them, mapped. **Delivers:** this `kb/library-science/`
bundle — the [discipline map](discipline-map.md) plus a concept file per
high-leverage technique. **Why first:** [repository-as-memory](../ai-sdlc/repository-as-memory.md)
says the reasoning belongs in the repo, not in a chat. The analysis itself has
to be a durable, retrievable artifact or the next session re-derives it.
**Done when:** the bundle lints clean and is reachable from [`kb/index.md`](../index.md).

## Phase 1 — Authority control for tags *(shipped here)*

**Discipline:** authority control (NACO). **Mechanism:** the uncontrolled
`tags:` folksonomy — measured at 289 spellings with real collisions
(`nurbs`/`NURBS`, `boolean`/`booleans`, `3d-printing`/`additive`).
**Delivers:** [`kb/authority/vocabulary.yaml`](../authority/vocabulary.yaml) (a
faceted controlled vocabulary) and [`lint_authority.py`](../../.claude/skills/okf-wikify/scripts/lint_authority.py)
(advisory linter). See [authority-control](authority-control.md). **Done when:**
the linter runs in CI advisory; **graduation:** VARIANT + COLLISION findings
reach zero and `--strict` is turned on.

## Phase 2 — Formalize the metadata application profile *(shipped)*

**Discipline:** metadata standards / Dublin Core. **Mechanism:** OKF frontmatter.
**Delivered:** a **closed** `type` registry in
[`authority/vocabulary.yaml`](../authority/vocabulary.yaml) (`types.registered`
+ `types.use_for` aliases), taken from the genres actually in use (Concept,
Reference, Playbook, Lesson, Policy, Process, Mechanism, Algorithm, Model,
Architecture, …); a `TYPE` check in `lint_authority.py` that — because the
vocabulary is closed — flags any unregistered or aliased `type` **by default**,
not just under `--report`; and the [crosswalk](metadata-and-application-profiles.md)
kept current. The one variant in the corpus (`Example` → `Code Example`) was
normalized. **Done:** every file's `type` draws from the registered set; the
linter passes `--strict`.

## Phase 3 — FRBR-style relationship edges *(shipped)*

**Discipline:** FRBR/LRM. **Mechanism:** OKF's optional `relationships` field.
**Delivered:** a registered edge vocabulary in
[`authority/vocabulary.yaml`](../authority/vocabulary.yaml)
(`relationship_types` — `SUPERSEDED_BY`/`SUPERSEDES`, `GOVERNED_BY`/`GOVERNS`,
`IMPLEMENTS`/`IMPLEMENTED_BY`, `ELABORATES`, `DERIVED_FROM`, `PART_OF`, each with
an inverse and scope note) plus registered `statuses`; and
[`relationships.py`](../../.claude/skills/okf-wikify/scripts/relationships.py),
which **validates** every edge (type registered, target resolves, status valid)
and **answers** the queries the edges enable — `--current` (what is
deprecated/superseded), `--governed-by FILE`, `--graph`.

Edges are seeded only where genuinely true and queryable, per the OKF spec's
"use sparingly" rule — ordinary "see also" stays a plain markdown link. The
young corpus has no supersession yet, so `--current` truthfully reports "all
current"; the mechanism is proven on two real edges (this bundle's IR file
`ELABORATES` the [progressive-disclosure concept](../concepts/progressive-disclosure.md);
[authority-control](authority-control.md) is `IMPLEMENTED_BY` the vocabulary
file). **Done:** the "is this still current?" question is now answerable from an
edge and a `status`, not from prose — ready for [Phase 5](#phase-5--collection-development--weeding-policy)
weeding to populate as records age.

## Phase 4 — A retrieval eval *(shipped)*

**Discipline:** information retrieval (precision/recall). **Mechanism:**
[progressive disclosure](retrieval-and-progressive-disclosure.md). **Delivered:**
an [eval set](eval/retrieval-evalset.yaml) of 12 realistic questions with tight
gold relevant-file sets, and
[`retrieval_eval.py`](../../.claude/skills/okf-wikify/scripts/retrieval_eval.py),
which scores a transparent, deterministic TF-IDF retriever over `kb/` by
precision/recall/F1 at k. The retriever is a reproducible *structural* signal
(not a stand-in for the LLM), sensitive to exactly what this overlay improves:
enabling controlled-vocabulary query expansion lifts mean recall@3 from **0.82 to
0.94**. A `--gate-recall` flag turns it into a CI regression check. **Done:**
adding the vocabulary's cross-references moves a measured number, on real data.

## Phase 5 — Collection-development & weeding policy

**Discipline:** collection development, digital preservation. **Mechanism:**
`lessons/` and the durable KB generally. **Delivers:** a lightweight
[weeding policy](collection-development.md) — supersede-don't-delete via
`status: deprecated` + `SUPERSEDED_BY`, weeding on a trigger (dead platform,
fixed gotcha), provenance enforced through `resource`. **Done when:** a stale
lesson has a defined, reversible retirement path instead of accumulating
silently.

---

## Sequencing logic

Phases 1→5 run **structure before semantics before curation**: first make terms
consistent (1) and records well-described (2); then wire the relationships those
clean records support (3); then measure whether it all improves retrieval (4);
then use the measurements and the edges to tend the collection over time (5).
Each phase is non-breaking on its own, and every one lands as a durable repo
artifact — the harness improving its own memory by the same discipline it uses to
build software: [shared context stays in the repo](../ai-sdlc/seven-principles.md).

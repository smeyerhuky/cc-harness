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

## Phase 3 — FRBR-style relationship edges

**Discipline:** FRBR/LRM. **Mechanism:** OKF's optional `relationships` field.
**Delivers:** use typed edges (`SUPERSEDED_BY`, `GOVERNED_BY`) for the handful of
relationships an agent needs to *query*, starting with governance (which
`CLAUDE.md` governs a file) and supersession in `lessons/`. Ordinary "see also"
stays a plain link. **Done when:** an agent can answer "is this lesson still
current?" from an edge, not prose.

## Phase 4 — A retrieval eval

**Discipline:** information retrieval (precision/recall). **Mechanism:**
[progressive disclosure](retrieval-and-progressive-disclosure.md). **Delivers:** a
small eval set of realistic questions with the KB files that *should* be
retrieved, scoring an agent's file-selection by precision/recall so KB edits can
be shown to *improve retrieval*, not just add words. **Done when:** adding a
`related:` cross-ref or fixing an `index.md` moves a measured number.

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

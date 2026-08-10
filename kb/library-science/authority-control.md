---
type: "Concept"
title: "Authority Control for KB Tags"
description: "One authorized term per concept, with variants resolving to it — the highest-leverage LIS technique for the harness, shipped as a controlled vocabulary plus an advisory linter."
resource: "LC Catalogers Learning Workshop (NACO authority training); Open Courseware in LIS research doc"
tags: [authority-control, controlled-vocabulary, library-science, governance]
timestamp: "2026-08-09"
relationships:
  - type: IMPLEMENTED_BY
    target: /authority/vocabulary.yaml
---

# Authority Control for KB Tags

## The problem, measured on our own data

A scan of every `tags:` field in `kb/` found **289 distinct tag spellings**,
and among them the classic *vocabulary problem*: one concept wearing many
spellings.

- `nurbs` and `NURBS`
- `boolean` and `booleans`; `fillet` and `fillets`; `sweep` and `sweeps`
- `brep` and `b-rep`
- `for-loop` and `loops`
- `3d-printing`, `additive`, and `layered-manufacturing` for one idea
- `policy` used where five process files mean `governance`

Every split spelling is lost recall: an agent retrieving files tagged `boolean`
silently misses the ones tagged `booleans`. Furnas et al. (1987) measured this —
two people pick the same term for a concept under ~20% of the time. Uncontrolled
tags don't degrade gracefully; they degrade *invisibly*, because nothing errors.

## The LIS fix: an authority file

Authority control is the cataloging practice of choosing **one authorized form**
(the *descriptor*) for each concept and recording every other form as a
*non-preferred entry term* (a `USE`/`UF` cross-reference) that resolves to it.
The Library of Congress runs the NACO program on exactly this principle; it is
the deepest free training in the research doc for a reason — it is the load-
bearing skill of a searchable catalog.

We implement it as **[`kb/authority/vocabulary.yaml`](../authority/vocabulary.yaml)**,
a faceted thesaurus:

- **Facets** (`domain`, `agent`, `process`, `artifact`, `technique`, `material`,
  `math`) — Ranganathan-style independent dimensions, not one rigid tree. A file
  can carry a tag from each facet.
- **Descriptors** with **scope notes** (`scope_note`) that say how a term is
  meant to be used, and **`use_for`** lists that collapse the variants above.
- **Form of headings** — a house rule that tags are lowercase kebab-case, with
  an explicit `form_exceptions` allow-list for genuine proper nouns (`WebGPU`,
  `OpenSCAD`, `C++`).

## The linter

**[`.claude/skills/okf-wikify/scripts/lint_authority.py`](../../.claude/skills/okf-wikify/scripts/lint_authority.py)**
enforces the profile in **advisory mode** (warnings only; `--strict` to fail a
build). It sits *beside* the OKF linter, not inside it: OKF is deliberately
minimal and tolerant of unknown tags, so authority control is an opt-in
**[application profile](metadata-and-application-profiles.md)** layered on top.
Run it:

```
python3 .claude/skills/okf-wikify/scripts/lint_authority.py kb/            # variants + collisions
python3 .claude/skills/okf-wikify/scripts/lint_authority.py kb/ --report   # + coverage + unaccessioned
```

Three tiers, tuned so the default run is all-signal:

| Tier | Needs vocab? | Meaning |
|---|---|---|
| **VARIANT** | yes | tag is a known non-preferred form → rewrite to the descriptor |
| **COLLISION** | no | two spellings differ only by case-fold or plural — auto-detected, so *new* candidates surface without being enumerated first |
| **FORM / UNACCESSIONED** | partial | review candidates (bad form; term not yet in the vocabulary) — `--report` only |

The COLLISION tier is the point: authority control that required enumerating all
289 tags before it helped would never get adopted. Instead the linter *finds the
candidates for you* and the vocabulary grows by accession — the same way a real
catalog department works.

## Adoption path

This is [Phase 1 of the roadmap](roadmap.md), and it is intentionally
non-breaking. The vocabulary starts seeded (~17% coverage) with the cross-cutting
terms and every known collision. Over subsequent sessions: fix VARIANT findings
in the files they name, promote recurring UNACCESSIONED terms into descriptors,
and only flip `--strict` on in CI once findings reach zero. Nothing has to be
perfect on day one — that is the difference between authority control and a
one-time tag cleanup that rots the moment the next file is written.

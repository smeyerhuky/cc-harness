---
type: "Concept"
title: "OKF Frontmatter as a Metadata Application Profile"
description: "Reads the OKF frontmatter block as a Dublin-Core-style descriptive metadata record, with a crosswalk and a plan to use FRBR-style relationship edges."
resource: "Getty Introduction to Metadata (Baca, 3rd ed.); Dublin Core; FRBR/LRM"
tags: [metadata, application-profile, crosswalk, frbr, library-science]
timestamp: "2026-08-09"
---

# OKF Frontmatter as a Metadata Application Profile

## Frontmatter *is* a catalog record

Every OKF file opens with a YAML block — `type`, `title`, `description`,
`resource`, `tags`, `timestamp`. LIS has a precise name for this: **descriptive
metadata**, a surrogate record that lets a reader (here, an agent) judge and
route a resource *without opening it*. The Getty *Introduction to Metadata* (the
best free primer named in the research doc) is the reference for doing it well.

Mapping the OKF fields onto **Dublin Core**, the lingua-franca metadata standard,
shows the frontmatter is already a competent — if informal — application profile:

| OKF field | Dublin Core element | Note |
|---|---|---|
| `title` | `dc:title` | direct |
| `description` | `dc:description` | direct |
| `type` | `dc:type` | drawn from a **closed registered vocabulary** (see below) |
| `resource` | `dc:source` | provenance — traces the claim back |
| `tags` | `dc:subject` | the field [authority control](authority-control.md) governs |
| `timestamp` | `dc:date` | ISO 8601 |
| *(implicit: the file itself)* | `dc:identifier` | the bundle-relative path |

## What "application profile" buys us

In LIS an **application profile** is a base standard (Dublin Core) *tightened*
for one setting: which elements are required, and which draw from controlled
vocabularies. That is exactly the relationship between OKF and this repo's
usage:

- **OKF** = the minimal base standard: one required element (`type`), tolerant
  of anything else.
- **This profile** = the tightening: `tags` MUST resolve to the
  [controlled vocabulary](authority-control.md); `type` MUST be one of the
  **closed registered set** in the vocabulary's `types:` block (`Concept`,
  `Reference`, `Playbook`, `Lesson`, `Policy`, `Process`, `Mechanism`,
  `Algorithm`, `Model`, `Architecture`, and a few more — the genres actually in
  use); `resource` SHOULD be present so every claim is
  [traceable](collection-development.md).

The two fields are controlled differently, and the difference is the point.
`tags` is an **open** vocabulary — a subject term not yet listed is a *candidate*
(the linter only surfaces it under `--report`), so the subject vocabulary can
grow by accession without noise. `type` is a **closed** vocabulary — it names a
record's *genre*, and genres are a small deliberate set, so an unregistered
`type` is a real finding shown *by default*. Adding a genre is an intentional
edit to `types.registered`, not silent drift.

Keeping the profile separate from OKF itself is likewise deliberate: the OKF
linter checks the base standard, `lint_authority.py` checks the profile. A bundle
can be OKF-valid and profile-improvable at the same time, and adopting the
profile never breaks base conformance.

## The next step: FRBR-style relationship edges

The research doc's **FRBR/LRM** model is about relationships *between* records —
a Work realized through Expressions, one record superseding another. OKF already
has the hook: the optional **`relationships`** field with typed edges, documented
in the [okf-spec](../../.claude/skills/okf-wikify/references/okf-spec.md). As of
[Phase 3](roadmap.md) these edges are **live and machine-queryable**, not just
prose: the edge types are a registered vocabulary in
[`authority/vocabulary.yaml`](../authority/vocabulary.yaml), and
[`relationships.py`](../../.claude/skills/okf-wikify/scripts/relationships.py)
validates and traverses them. That lets an agent ask questions a flat link graph
cannot answer:

- *"Is this lesson still current, or has something superseded it?"* →
  `relationships.py kb/ --current` (reads `SUPERSEDED_BY` + `status: deprecated`)
- *"Which policy governs this file?"* → `--governed-by FILE` (reads `GOVERNED_BY`)
- *"Show the whole edge graph."* → `--graph`

The discipline the okf-spec prescribes still holds: typed edges are reserved for
the handful of relationships an agent needs to *query*; ordinary "see also"
cross-references stay plain markdown links. Seeding is therefore deliberately
sparse — an edge is added only when something will actually query it.

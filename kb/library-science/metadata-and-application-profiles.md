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
| `type` | `dc:type` | but drawn from a local, *uncontrolled* type list |
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
  [controlled vocabulary](authority-control.md); `type` SHOULD draw from a small
  registered set (`Concept`, `Reference`, `Playbook`, `Lesson`, `Policy`,
  `Workflow` — the values already in use); `resource` SHOULD be present so every
  claim is [traceable](collection-development.md).

Keeping the two layers separate is deliberate: the OKF linter checks the base
standard, `lint_authority.py` checks the profile. A bundle can be OKF-valid and
profile-improvable at the same time, and adoption of the profile never breaks
base conformance.

## The next step: FRBR-style relationship edges

The research doc's **FRBR/LRM** model is about relationships *between* records —
a Work realized through Expressions, one record superseding another. OKF already
has the hook: the optional **`relationships`** field with typed edges
(`SUPERSEDED_BY`, `GOVERNED_BY`) documented in the
[okf-spec](../../.claude/skills/okf-wikify/references/okf-spec.md). Today those
edges live only as prose links. Using them mechanically would let an agent ask
questions a flat link graph cannot answer:

- *"Is this lesson still current, or has an ADR superseded it?"* → `SUPERSEDED_BY`
- *"Which policy governs this file?"* → `GOVERNED_BY`
- *"Show every expression of this concept across bundles."* → a Work grouping

That is [Phase 3 of the roadmap](roadmap.md): reserve the typed edges for the
handful of relationships an agent needs to *query*, and leave ordinary "see also"
as plain markdown links — the same discipline the okf-spec already prescribes.

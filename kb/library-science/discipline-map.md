---
type: "Reference"
title: "LIS Discipline → Harness Mechanism Map"
description: "Each core Library & Information Science discipline mapped to the agentic-harness mechanism it improves, with the concrete artifact in this repo."
resource: "Open Courseware in Library & Information Science (uploaded 2026-08-09)"
tags: [library-science, knowledge-organization, metadata, information-retrieval]
timestamp: "2026-08-09"
---

# LIS Discipline → Harness Mechanism Map

The research document surveys the *core sequence* every accredited LIS program
teaches. Read as engineering, each module names a technique for keeping a
large, growing, multi-author knowledge store findable and trustworthy — the
exact failure surface of an agentic harness whose KB grows every session. This
table is the whole thesis on one screen; the linked files go deep on the
high-leverage rows.

| LIS discipline (from the research) | The problem it solves | Harness mechanism it upgrades | Artifact in this repo |
|---|---|---|---|
| **Authority control** (NACO, LC authorities) | One concept acquires many names → split retrieval | The uncontrolled `tags:` folksonomy across every bundle | [`authority-control.md`](authority-control.md), `kb/authority/vocabulary.yaml`, `lint_authority.py` |
| **Cataloging & classification** (RDA, LCSH, faceted classification) | Where does a thing *go*, and how is it described consistently? | The three-tier KB and each bundle's directory scheme | [`discipline-map.md`](discipline-map.md), `kb/CLAUDE.md` |
| **Metadata standards** (Dublin Core, MODS, METS) | Describe resources so a machine can filter and route them | OKF frontmatter fields (`type`, `resource`, `tags`, …) | [`metadata-and-application-profiles.md`](metadata-and-application-profiles.md) |
| **FRBR / LRM** (Work→Expression→Manifestation→Item) | Model relationships *between* records, not just records | OKF `relationships` edges (`SUPERSEDED_BY`, `GOVERNED_BY`) | [`metadata-and-application-profiles.md`](metadata-and-application-profiles.md), [okf-spec](../../.claude/skills/okf-wikify/references/okf-spec.md) |
| **Information retrieval** (indexing, precision/recall, ranking) | Return the *right* few items for a need | [Progressive disclosure](../concepts/progressive-disclosure.md) — load two or three files, not the tree | [`retrieval-and-progressive-disclosure.md`](retrieval-and-progressive-disclosure.md) |
| **Reference interview** | Clarify a vague need *before* answering | Forcing ambiguity into the spec before code is written | [seven-principles](../ai-sdlc/seven-principles.md) #3 |
| **Bibliographic citation** | Every claim is traceable to a source | "Cite file paths when you answer"; the `resource` field | [progressive-disclosure](../concepts/progressive-disclosure.md), [`collection-development.md`](collection-development.md) |
| **Collection development & weeding** | Add what earns its place; retire what has gone stale | How `lessons/` accretes and when an entry is deaccessioned | [`collection-development.md`](collection-development.md) |
| **Digital preservation** (provenance, fixity) | A record you can trust years later | [Repository-as-memory](../ai-sdlc/repository-as-memory.md) | [`collection-development.md`](collection-development.md) |

## Why this fit is not a stretch

An agentic harness and a library share one governing constraint: **the reader
is not the author, and arrives later with a specific need.** A fresh AI session
is a patron at the reference desk — it did not write the KB, cannot read all of
it, and must locate the two or three relevant records fast and cite them. Every
LIS technique above is a centuries-refined answer to *that* constraint, not a
metaphor borrowed for flavor. The harness already re-invented the easy ones
(progressive disclosure ≈ retrieval; repository-as-memory ≈ preservation). The
roadmap adopts the ones it has *not* yet re-invented — authority control first,
because the [tag data proves the need](authority-control.md).

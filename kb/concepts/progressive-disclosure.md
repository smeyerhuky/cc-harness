---
type: "Concept"
title: "Progressive Disclosure of Knowledge"
description: "This KB is structured so an agent loads two or three files, not the whole tree — this file explains how to navigate it that way."
resource: "https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf"
tags: ["okf", "navigation", "meta"]
timestamp: "2026-07-15"
---

# Progressive Disclosure of Knowledge

## Why this KB is structured the way it is

If a deploy question could be answered by loading a single monolithic `DEPLOY.md`, that would be simpler. It can't, for two reasons:

1. **Context cost is real.** A monolithic file trades cheap-to-write for expensive-to-load — every turn re-reads content that isn't relevant to the current question. An OKF bundle lets a session load only the two or three files that actually answer what's in front of it.
2. **Knowledge accretes at different rates.** The git protocol changes rarely. Cloudflare gotchas accrue every time we deploy something new. Splitting by concern lets the volatile parts (`lessons/`, `platforms/`) evolve without churning the stable parts (`concepts/`, `process/`).

## The load pattern

Enter the KB from [`kb/index.md`](../index.md). It has one paragraph of orientation and a TOC pointing at four section indexes. Load the section index that fits your question:

- **"How do I deploy X?"** → [platforms/index](../platforms/index.md), then the specific platform file.
- **"How does git work in this repo?"** → [process/index](../process/index.md).
- **"Why is my deploy behaving weirdly in the sandbox?"** → [lessons/index](../lessons/index.md).
- **"What are the general rules?"** → [concepts/index](index.md) (you're reading it).

From the section index, follow one or two links to the actual content files. Each content file stands alone well enough to answer the question its filename implies, and cross-links to related files when a full answer needs more.

## Rules for staying inside the pattern

- **Don't load the whole KB in one shot.** If you find yourself reading everything, you're using it as a monolith and paying the cost you were trying to avoid.
- **Cite file paths when you answer.** `kb/lessons/wrangler-cache-pollution.md` tells the user where the claim came from and lets them (or a future session) verify or update it.
- **When adding new material, prefer a new file over expanding an existing one** if the new material is a distinct concept. Expanding pushes the file toward monolith territory. See the [sibling `CLAUDE.md`](../../CLAUDE.md) for the schema new files should follow.
- **Link liberally.** An OKF bundle earns its keep through the link graph, not through any single file. If a concept file references a git rule, link to the process file for it instead of restating.

## When this pattern is the wrong tool

Progressive disclosure assumes the reader has a specific question. For a first-time overview of the KB itself, reading the root [`index.md`](../index.md) plus each section's `index.md` is the right way in — that's ~5 short files and you're oriented. Don't force the "load two files" pattern when you're deliberately orienting.

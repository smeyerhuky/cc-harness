---
name: okf-wikify
description: Turns a PDF, website, existing docs folder, or any other body of source material into an OKF (Open Knowledge Format) "deep wiki" — a directory of small, cross-linked markdown files with YAML frontmatter, organized for an LLM agent to navigate section-by-section instead of re-reading one giant document every time. Use this whenever the user asks to "build a deep wiki", "wikify" something, "break down" or "decompose" a paper/spec/doc/site into a knowledge base, turn a PDF or long doc into browsable notes, create an Obsidian-style vault of a source, or set up a reference folder + CLAUDE.md that a future Claude session can consult about a specific paper, product, codebase's docs, or research area. Also trigger for requests to make research/reading material "agent-friendly", "chunked", or "atomic", even if the user doesn't say "OKF" by name.
argument-hint: "[path/URL to source material] [optional: output directory name]"
allowed-tools: Read, Write, Edit, Bash, WebFetch, Glob, Grep
---

# OKF Wikify

## What this produces

A directory (default name `kb/`) of markdown files following the [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) (OKF) spec: plain markdown with YAML frontmatter, readable with `cat`, portable with `git clone`, no special tooling required to consume. The point of OKF over a single flattened text dump is that an agent (or human) can load only the 2-3 files relevant to the question at hand, follow cross-links to build up context incrementally, and avoid re-reading the entire source on every turn.

Full spec details are in `references/okf-spec.md` — read it before writing frontmatter if this is your first time using this skill in a session, since getting the schema exactly right (especially the `okf_version` placement rule) matters for the linter to pass.

## Workflow

This is the same five-step process regardless of source type — only step 1 (ingestion) differs. Read the reference file for your source type before starting step 1.

| Source type | Reference file |
|---|---|
| PDF | `references/pdf-sources.md` |
| Website / URL(s) | `references/web-sources.md` |
| Existing docs folder / codebase docs | `references/doc-folder-sources.md` |
| Anything else (pasted text, transcripts, a collection of files) | Skip straight to step 2 — you already have the raw material |

If the source is large enough that reading and hand-decomposing everything in one session isn't practical (roughly 50+ files, e.g. converting an entire existing docs tree or a multi-repo governance corpus), read `references/large-corpus-mode.md` before proceeding — it describes a scaffold-then-parallelize approach that trades some per-file nuance for throughput. That's the exception; the default path below is a single hand-authored pass and produces better results when it's feasible.

### Step 1: Ingest the full source

Extract or read the complete source material into your context before doing any decomposition. Don't decompose from a summary or a partial read — the whole point of this exercise is capturing what's actually in the source, and skipping ahead produces a wiki with confident-sounding gaps. If the source is long (many pages / a large site), it's fine to read it in chunks across multiple tool calls, but read all of it before moving to step 2.

### Step 2: Plan the decomposition by hand, not mechanically

Do not split by page, by paragraph count, or by any other mechanical rule. Read through the material and identify the actual *ideas* a reader would want to look up independently — one mechanism, one result, one API, one concept per file. A good test: could someone who already knows the source material predict roughly what's in a file just from its filename? If a file is doing double duty covering two unrelated things, split it. If two files are both mostly about the same idea, merge them.

Group files into topic directories (e.g. `concepts/`, `results/`, `api-reference/`, `related-work/` — name them for what's actually in the source, don't force this exact taxonomy). Each directory gets its own `index.md`.

For a full paper or report, this typically produces 20-40 files across 4-6 directories. For a smaller doc, it might be 6-10 files in 2-3 directories. For a big website or docs site, mirror the site's own information architecture where reasonable rather than inventing a new one.

### Step 3: Write the files

For every content file, use this frontmatter (see `references/okf-spec.md` for the full field spec and the linter's exact requirements):

```yaml
---
type: "Concept"          # required — free text, no fixed vocabulary (e.g. "Concept", "Result", "Reference", "API")
title: "..."
description: "..."       # one sentence
resource: "..."          # URI back to the source: arxiv id + anchor, URL, file path, etc.
tags: ["...", "..."]
timestamp: "YYYY-MM-DD"
---
```

For docs-folder sources with governance/process/policy content (rules, ADRs, playbooks) rather than purely descriptive content, consider whether the optional domain extension fields in `references/okf-spec.md` (`status`, `enforcement`, `audience`, `disclosure_level`, `scope`, `relationships`) add real value — they're overkill for a paper or a single API's docs, but they let a consumer mechanically distinguish "this is a MUST-follow rule" from "this is background context" in a way plain prose can't.

Write the body as real prose with the actual content — numbers, code, claims — preserved verbatim from the source rather than paraphrased into vagueness. Every file should stand alone well enough to answer the question its filename implies, while linking (`[text](../other-dir/other-file.md)`) to the files it depends on or that depend on it. Link liberally; an OKF bundle earns its keep through the link graph, not through any single file.

Each `index.md` (no frontmatter — reserved filename) lists its directory's files with a one-line description each, e.g.:

```markdown
# Results

* [Kernel Speedup](kernel-speedup.md) - benchmark of X vs Y across N range
* [Copy Ceiling](copy-ceiling.md) - fraction of tokens reachable under the primitive
```

Write the root `index.md` last, once you know the final directory structure — it needs `okf_version: "0.1"` in its frontmatter (the *only* file allowed to declare this) plus a one-paragraph summary of the whole source and a table of contents linking each subdirectory's `index.md`.

### Step 4: Record the bundle in the governing CLAUDE.md

CLAUDE.md is agent operating instructions, not OKF content, and it needs to be picked up
automatically for any session working in the surrounding directory — not just one that cds into
the bundle folder. So the bundle's usage notes belong in the **governing CLAUDE.md** for the
directory that owns the bundle.

**Never create a `<Name>-KB-CLAUDE.md` (or any other renamed companion CLAUDE file).** A `kb/`
bundle does not get its own separate CLAUDE file — it is governed by the nearest `CLAUDE.md` above
it.

- **If a governing `CLAUDE.md` already exists** (a repo with a CLAUDE.md hierarchy — e.g.
  `project/CLAUDE.md` above `project/kb/`), **update it**: add or refresh a short section that
  describes the bundle and how to navigate it. Do not add a second CLAUDE file.
- **If none exists** (a standalone wikify with no surrounding governance), create a plain
  `CLAUDE.md` as a *sibling* of the bundle directory (e.g. `project/CLAUDE.md` next to
  `project/kb/`), not inside it.

Either way, keep it current **as the work evolves** — update the governing CLAUDE.md and the
bundle in the same change that produces new material, rather than regenerating everything at the
end. Explain, for a future Claude session that lands in this directory cold:

- What OKF is and the specific conventions this bundle follows (frontmatter schema, reserved filenames, `okf_version` placement).
- The directory map and what's in each section.
- How the bundle was built (what tool extracted the source, how content was decomposed) — this matters if someone needs to regenerate or extend it later.
- How to *use* it: start from `index.md`, follow links into the specific files needed, cite file paths when answering questions so claims stay verifiable against the source.
- Where the original source material lives, for anything not captured in the decomposition (figures, exact formatting, material judged not worth atomizing).

See `references/claude-md-template.md` for a section/template to adapt rather than writing this from scratch (adapt it into the existing governing CLAUDE.md when one exists).

### Step 5: Lint

Run the bundled conformance checker before calling the job done:

```bash
python3 ~/.claude/skills/okf-wikify/scripts/lint_okf.py <bundle-dir>
```

It checks: every content file has valid frontmatter with a non-empty `type`; `okf_version` appears only in the root `index.md`; relative links resolve to files that exist; every file is reachable from some `index.md` (no orphans). Fix everything it reports as an error; warnings (missing recommended fields, orphaned files) are worth a second look but aren't blocking — an intentionally-unlinked file, for instance, might be fine.

## When decomposition is genuinely hard

Some sources don't cleanly decompose into standalone concepts — a tightly sequential tutorial, a legal contract where clause order matters, a single short doc that's already atomic. In those cases, don't force artificial splits just to hit a file count. A 3-file bundle that respects the material's actual structure beats a 15-file bundle where every file cross-references the other 14 to make sense. Use your judgment; the goal is agent-navigable knowledge, not maximal fragmentation.

## Updating an existing bundle

If a `kb/`-style OKF bundle already exists and the user wants to add new material to it (e.g. "add a section on X" to a bundle you or a prior session built), don't rebuild it — read the existing `index.md` files and the **governing `CLAUDE.md`** (the nearest one above the bundle directory) to understand established conventions (frontmatter fields used, directory naming, tone), then add new files that match those conventions and cross-link into the existing graph from at least one existing file. Update that governing `CLAUDE.md` if the bundle's shape changed; never add a `<Name>-KB-CLAUDE.md`. Re-run the linter afterward.

# Source Type: Existing Docs Folder / Codebase Documentation

This covers wikifying something that's already a pile of files on disk: a `docs/` folder, a README-heavy repo, a collection of design docs, meeting notes, or an existing (non-OKF) wiki export.

## Ingestion

Use `Glob`/`Grep` to inventory what exists before reading anything — get a sense of scale (10 files? 200 files?) and existing organization (is there already a rough taxonomy in the folder names?) before deciding on a decomposition plan. For a large folder, read representative files fully rather than skimming everything shallowly — better to deeply wikify the 20 files that matter than shallowly touch 200.

## Key judgment call: re-organize or preserve structure?

Existing docs folders often have organic, inconsistent structure (a mix of outdated and current docs, duplicated content across files, docs that don't reflect the current codebase). Two approaches:

1. **Faithful mirror** — one OKF file per existing doc, same relative structure, frontmatter added. Fast, low-risk, but perpetuates any existing disorganization or duplication.
2. **Re-decomposition** — read everything, then re-derive the concept boundaries from scratch as if authoring fresh (this is the default approach described in SKILL.md step 2). Slower, but produces a genuinely better-organized bundle, and is the right call when the existing docs are stale, duplicative, or organized around "who wrote it and when" rather than "what it's about."

Ask the user which they want if the folder is large and disorganized enough that this is a real tradeoff — for a small, already-clean docs folder, just do the re-decomposition, since it's cheap.

## Handling code alongside docs

If the source folder mixes prose docs with source code (e.g. a codebase's `docs/` next to its `src/`), the wiki should describe the code's architecture and behavior, not reproduce the code itself. Link back to the actual source file (`resource: "file:///path/to/src/foo.py"`) rather than pasting large code blocks into the wiki — the wiki should be the map, not a copy of the territory. Small illustrative snippets are fine; whole files are not.

## Typical directory shape

Mirror what the codebase/domain actually has, e.g.:

```
kb/
├── index.md
├── architecture/      how the pieces fit together
├── components/        one file per major module/service/class family
├── operations/        deployment, runbooks, on-call knowledge
└── decisions/         ADRs / why things are the way they are, if this exists in source
```

# Large-Corpus Mode: Scaffold + Parallel Fill + Deterministic Regen

The default workflow in SKILL.md — read everything, hand-decompose, write files one at a time — works well up to maybe 30-40 files in a single session. Beyond that (converting an entire existing docs tree with 50-100+ files, or a large multi-repo governance/process corpus), reading and hand-writing every file in one linear pass burns a huge amount of context and time on mechanical work that doesn't need a full model's judgment applied to each file individually.

A real large-scale conversion (~100 files, an internal governance/process bundle) used a three-phase pattern instead. Reach for this when the source is large enough that the default workflow would take an impractically long single session — not as the default, since it trades some quality/nuance for throughput.

## Phase 1: Deterministic scaffold (plain Python, no model judgment needed)

Write a small script that walks the source, and for every file that should become a bundle concept:
- Creates the target directory structure.
- Copies the file's body content verbatim into the target path.
- Prepends a stub frontmatter block: `---\nTODO_OKF_FRONTMATTER: true\n---\n\n`
- Records `(source_path, target_path, category, verbatim_flag)` into a manifest CSV.

The `verbatim_flag` distinguishes prose docs (body preserved as-is) from files that already carry their own native frontmatter (e.g. wikifying agent/skill/config definitions that have their own YAML header) — those need their native frontmatter fenced under a `# Definition` heading rather than stripped, so it isn't confused with the new OKF frontmatter.

This step requires no model calls at all — it's pure file-system mechanics, so do it with a script, not by reading and rewriting each file yourself.

## Phase 2: Narrow, parallel frontmatter-fill (subagents)

Spawn subagents (batched, several files per agent — e.g. one agent per category/directory from the manifest) with a **narrow, explicit contract**, not the general "wikify this" instruction:

> You are filling in OKF frontmatter for pre-scaffolded concept files. The file body already exists (copied verbatim). Your job: (1) replace the `TODO_OKF_FRONTMATTER: true` stub with a real OKF frontmatter block, (2) rewrite internal markdown links so they point to sibling OKF concept paths, (3) for verbatim-flagged files, wrap the native frontmatter in a fenced yaml block. Do NOT rewrite, summarize, or restructure the body prose — preserve it exactly.

This narrow scope matters: a subagent told simply "wikify these files" will drift into rewriting prose, changing tone, or re-organizing content — exactly what you don't want when the goal is high-volume, low-risk frontmatter annotation of already-acceptable content. Give each subagent the manifest rows for its batch and the frontmatter field vocabulary (see `okf-spec.md`, including any domain extension fields this corpus needs).

## Phase 3: Deterministic index/link regeneration

Once every file has real frontmatter, run a script (not a model) to:
- Generate every `index.md` from the manifest, grouping by directory and pulling each file's `title`/`description` straight from its now-filled frontmatter.
- Validate no `TODO_OKF_FRONTMATTER` stubs remain.
- Run the standard lint (`scripts/lint_okf.py`) plus any corpus-specific checks (e.g. a closed vocabulary of allowed `type` values, if this corpus defined one).

Keeping index generation deterministic (rather than having an agent write 100+ `index.md` files by hand) guarantees every listing accurately reflects the frontmatter that's actually on disk, with zero risk of an agent's index.md drifting from reality as later phases touch files.

## When NOT to use this mode

If the source material genuinely needs re-thinking about where concept boundaries should be — the existing docs are disorganized, duplicative, or the "one file per existing file" mapping doesn't correspond to good concept boundaries — this mode is the wrong tool, because phase 1's file-to-file mapping bakes in the existing (possibly bad) structure before any judgment gets applied. Use the default hand-decomposition workflow instead, or a hybrid: hand-plan the target structure first, then use scaffold+parallel-fill only for the mechanical "get frontmatter onto every file" step once the structure itself is decided.

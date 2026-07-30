# CLAUDE.md Template for an OKF Bundle

Adapt this — don't copy it verbatim with placeholders left in. Fill in the specifics of the actual bundle you built.

CLAUDE.md is agent operating instructions, not OKF content, and needs to be picked up automatically for any session working in the surrounding directory. So this content belongs in the **governing CLAUDE.md** for the directory that owns the bundle:

- **If a governing `CLAUDE.md` already exists** (a repo with a CLAUDE.md hierarchy — e.g. `project/CLAUDE.md` above `project/kb/`), **fold the relevant sections below into it**; do not create a second file.
- **If none exists**, create a plain `CLAUDE.md` as a **sibling** of the bundle directory (e.g. `project/CLAUDE.md` next to `project/kb/`), not inside it.

**Never name the file `<Name>-KB-CLAUDE.md` or any other renamed companion** — a `kb/` bundle does not get its own separate CLAUDE file.

```markdown
# <bundle-dir-name> — Working Notes for Claude Sessions

This directory is an **OKF (Open Knowledge Format) kb**: a decomposition of <source description — e.g. "the FooBar paper (arXiv:XXXX.XXXXX)" or "the FooCorp API docs at https://..."> into small, cross-linked markdown files instead of one flat text dump. It exists so an LLM session can pull in only the concepts relevant to the current question, rather than re-reading the whole <source> every time.

## What OKF is (spec summary)

OKF ([spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)) is a minimally-opinionated convention for representing knowledge as a directory of markdown files with YAML frontmatter:

- **Required frontmatter field**: `type` (free text, e.g. `"Concept"`, `"Result"` — list the actual types used in this bundle).
- **Recommended fields**: `title`, `description`, `resource`, `tags`, `timestamp`.
- **File organization**: `index.md` at each level (no frontmatter, lists children); `log.md` (optional changelog); `okf_version` only in the root `index.md`.
- **Cross-linking**: relative markdown links; no formal link semantics beyond surrounding prose.

## Directory map

<Fill in the actual tree with one-line descriptions per directory, e.g.:>

\`\`\`
CLAUDE.md              this file (sibling of the bundle, not inside it)
<bundle-dir>/
  index.md              root bundle summary (okf_version lives here)
  log.md                creation/update history
  <dir-1>/              <what's in it>
  <dir-2>/              <what's in it>
  ...
\`\`\`

Each subdirectory has its own `index.md` acting as a table of contents.

## How this bundle was built

<Describe the actual provenance:>
1. <Extraction method — e.g. "pdftotext -layout extracted the paper text" or "WebFetch pulled each docs page listed in the site's nav">.
2. The material was decomposed **by hand into one concept per file** — not a mechanical per-page/per-paragraph split. Each file corresponds to one idea a reader would want to look up independently.
3. Files link forward/backward to related concepts so an agent can reconstruct the source's argument/structure without reading linearly.
4. <Note anything preserved verbatim — numbers, code, exact config syntax — and why>.

## Working in this bundle

- **Adding a new file**: give it `type`, `title`, `description`, `resource`, `tags`, `timestamp` frontmatter matching the conventions above. Link it from the relevant `index.md` and cross-link it to/from related files.
- **Don't put `okf_version` anywhere but the root `index.md`.**
- **Prefer small, single-idea files.** If a file starts covering two independent claims, split it.
- **Run the linter after changes**: `python3 ~/.claude/skills/okf-wikify/scripts/lint_okf.py <this-directory>`
- **When answering questions using this bundle**, start from the relevant `index.md`, follow links into the specific files needed, and cite the file path alongside the answer so it's verifiable against the source.
- The original source (<path/URL>) remains available for anything not captured here.
```

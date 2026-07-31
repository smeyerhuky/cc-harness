# Playground

A playground environment for experimentation and development.

## Directory Structure

- **CLAUDE.md** - Root-level Claude configuration (this file)
- **kb/CLAUDE.md** - Governs the repo-wide knowledge base
- **projects/CLAUDE.md** - Governs the `projects/` directory (all projects)
- **projects/kb/CLAUDE.md** - Governs the projects index/governance KB
- **projects/<name>/CLAUDE.md** - Governs a specific project
- **README.md** - Repository overview
- **LICENSE** - Project license

- **.claude/** - Claude skill definitions
  - `skills/okf-wikify/` - OKF deep-wiki skill
  - `skills/scad-design-to-print/` - SCAD Design to Print skill



- **config/** - Root-level configuration files

- **kb/** - Repository-wide knowledge base (OKF bundle)
  - `architecture/` - Directory structure and KB organization docs
  - `additive-engineering/` - Additive Engineering concepts, and rulebooks
  - `concepts/` - Abstract concepts (deploy lifecycle, progressive disclosure, etc.)
  - `development/` - Workflow and shared-code guidance
  - `getting-started/` - Orientation and quick-start docs
  - `lessons/` - Lessons learned from real deploys
  - `platforms/` - Per-platform deploy recipes (Cloudflare Workers, etc.)
  - `process/` - Git/PR/commit discipline
  - `index.md` - KB entry point

- **projects/** - All project containers
  - `common/` - Shared utilities and code used across projects
  - `hello-worker/` - Cloudflare Worker project (`src/`, `wrangler.jsonc`)
  - `sample-project/` - Template project (`src/`, `kb/`, `CLAUDE.md`, `README.md`, `version.json`)
  - `chain-mail/` - Parametric print-in-place folding European 4-in-1 chainmail for the Bambu P1S (OpenSCAD; `src/`, `spec/`, `tools/`, `kb/`)
  - `kb/` - Projects directory KB index

## Getting Started

This is a playground branch initialized with a minimal structure. Add your project content to the respective directories.

## Documentation & CLAUDE.md governance

The repo works by **building out projects and updating their documentation as it goes** — docs are
maintained incrementally alongside the work, never as a single end-of-project dump.

**CLAUDE.md files** live at exactly these levels, each governing its directory and everything below:

| File | Governs |
|---|---|
| `/CLAUDE.md` | the whole repo |
| `/kb/CLAUDE.md` | the repo-wide knowledge base |
| `/projects/CLAUDE.md` | the `projects/` directory (all projects) |
| `/projects/<project-name>/CLAUDE.md` | one specific project |

A directory is governed by the nearest `CLAUDE.md` above it. **Never create
`<Name>-KB-CLAUDE.md` or any other renamed companion CLAUDE file** — a `kb/` bundle does not get
its own separate CLAUDE file; its guidance belongs in the governing `CLAUDE.md`.

**Knowledge-base layers** (three, distinct scopes):

| Location | Scope |
|---|---|
| `/kb/` | repo-wide knowledge (architecture, process, engineering references, lessons) |
| `/projects/kb/` | high-level index/governance of all projects (one card per project) |
| `/projects/<project-name>/kb/` | project-specific detail (design, findings, decisions, plan) |

See [`/projects/CLAUDE.md`](projects/CLAUDE.md) for the full project workflow.

## Development

Work on features and experiments within the project directories, following the structure outlined above.

## Knowledge base — deploy protocol

Before deploying anything from this repo — Cloudflare Worker, Vercel site, Fly app, whatever — consult the deploy KB in `kb/`. It's an [OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) bundle organized for progressive disclosure: load only the two or three files that answer your current question.

- **Start here**: [`kb/index.md`](kb/index.md) — one-paragraph orientation plus TOC.
- **Abstract lifecycle**: [`kb/concepts/deploy-lifecycle.md`](kb/concepts/deploy-lifecycle.md) — the six-stage flow every deploy follows.
- **Git protocol for this repo**: [`kb/process/`](kb/process/index.md) — designated branches, commit format, push/retry, PR discipline, merged-PR follow-ups.
- **Per-platform recipes**: [`kb/platforms/`](kb/platforms/index.md) — start with the file that matches your target (Cloudflare Workers so far).
- **Gotchas from real deploys**: [`kb/lessons/`](kb/lessons/index.md) — read the relevant one *before* you hit the wall.

### Conventions for the deploy KB

- Frontmatter fields: `type`, `title`, `description`, `resource`, `tags`, `timestamp`. Types in use: `Concept`, `Policy`, `Playbook`, `Reference`, `Lesson`.
- `okf_version: "0.1"` appears **only** in `kb/index.md` — nowhere else.
- Subdirectory `index.md` files have no frontmatter — they're pure tables of contents.
- Cross-link liberally with relative markdown links; cite file paths (`kb/lessons/wrangler-cache-pollution.md`) when answering deploy questions so claims stay verifiable.
- After changes, run `python3 .claude/skills/okf-wikify/scripts/lint_okf.py kb/`. One warning is expected: `concepts/progressive-disclosure.md` links to `../../CLAUDE.md` (this file) — the sibling CLAUDE.md pattern the OKF skill documents.

### When adding new material

- **New platform** (e.g. adding Vercel): create `kb/platforms/vercel-*.md` files following the "minimal / credentials / local-verify" shape used by the Cloudflare set, and link them from `kb/platforms/index.md`.
- **New lesson** (something bit you): add a `kb/lessons/<slug>.md` with the concrete session context (dates, error codes, exact commands), then link from `kb/lessons/index.md` and cross-link to any relevant concept file.
- **New abstract concept**: add to `kb/concepts/` and cross-link from `deploy-lifecycle.md`.

Don't expand existing files past their single-concept scope; prefer a new file plus a cross-link.

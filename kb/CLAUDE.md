# Repository Knowledge Base (OKF Format)

This is an Open Knowledge Format (OKF) bundle documenting the cc harness repository structure, architecture, and development practices.

## About This Bundle

This knowledge base is organized following the [OKF spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf). Each content file contains YAML frontmatter describing its type, title, tags, and source, followed by markdown content.

## Structure

Each section has its own `index.md`; [`index.md`](index.md) lists them all. The ones that govern
how work is done here:

- **[`pdlc/`](pdlc/index.md)** — the PDLC method: how every project and the harness plan and
  record work (pipeline, work items, journals, facilitator, ceremonies, coverage audit,
  definition of done, templates, a worked example).
- **[`process/`](process/index.md)** — git discipline (branches, commits, PRs, push/retry), plus
  the harness's own PDLC instance: its roadmap, backlog, running journal, and handoff.
- **`alignment/`** — the harness's review ceremonies, one folder each (created at the first
  ceremony).
- **[`library-science/`](library-science/index.md)** and **[`authority/`](authority/vocabulary.yaml)**
  — the overlay that keeps the KB consistent and findable: controlled vocabulary, typed
  relationships, the retrieval eval, weeding (below).
- **[`architecture/`](architecture/index.md)**, **[`getting-started/`](getting-started/index.md)**,
  **[`development/`](development/index.md)** — the repo's layout, orientation, and shared-code
  guidance.

The rest — `ai-sdlc/`, `concepts/`, `platforms/`, `lessons/`, `additive-engineering/` — are
reference sections; `index.md` describes each.

## Using This Knowledge Base

**Start here:** Read `kb/index.md` to understand the repository structure.

**Navigate by topic:** Each section has an `index.md` listing its files.

**Follow cross-links:** Markdown files link to related content using relative paths. Follow these to build up understanding incrementally.

**Verify claims:** Each file includes a `resource` field in its frontmatter pointing back to the source (README.md, main CLAUDE.md, etc.).

## Building and Updating This Bundle

This KB was built using the `/okf-wikify` skill. The workflow involved:

1. **Ingestion:** Read the complete README.md and existing documentation files
2. **Decomposition:** Identified logical ideas (setup, architecture, workflows, shared code)
3. **Writing:** Created files with OKF frontmatter and markdown content
4. **Organization:** Grouped related files into directories with index files
5. **Linting:** Validated with `python3 ~/.claude/skills/okf-wikify/scripts/lint_okf.py kb/`

To add content to this bundle:

1. Create new markdown file in appropriate directory
2. Add OKF frontmatter (type, title, description, resource, tags, timestamp)
3. Write content that links to related files using relative paths
4. Update directory `index.md` to list the new file
5. Run the KB [gates](pdlc/definition-of-done.md#gates) — they must all pass

## Conventions

- **Frontmatter:** Every file has type, title, description, resource, tags, timestamp
- **okf_version:** Declared only in root `index.md`
- **File types:** `type` draws from a **closed, registered vocabulary** — see
  the `types:` block in [`authority/vocabulary.yaml`](authority/vocabulary.yaml)
  (Concept, Reference, Playbook, Lesson, Policy, Process, Mechanism, Algorithm,
  Model, `Work Item` and `Journal` for PDLC records, and a few more). Use a registered genre;
  adding a new one is a deliberate edit to the registry, checked by the authority linter.
- **`state:` vs. `status:`:** a work item's `state:` is the *work's* lifecycle (values:
  `work_item_states` in the vocabulary; meanings: [an item's life](pdlc/work-items.md#an-items-life));
  `status:` stays the *record's* lifecycle (weeding, below). Never put a work state in `status:` —
  the relationship validator rejects it.
- **Linking:** Use relative markdown links (e.g., `[text](../other-dir/file)`).
- **Markdown:** Plain markdown with OKF frontmatter; no special tooling required
- **Tags are authority-controlled:** the `tags:` field is governed by a controlled
  vocabulary — use the authorized descriptor for a concept, not a synonym or
  spelling variant. See below.

## Authority control for tags (library-science overlay)

`tags:` across all bundles is a single controlled vocabulary, not a free-form
folksonomy. The authority file is [`authority/vocabulary.yaml`](authority/vocabulary.yaml):
a faceted thesaurus recording the preferred term (descriptor) for each concept
and the non-preferred variants (`use_for`) that resolve to it. This keeps
retrieval-by-tag from losing recall when one concept acquires many spellings.

This is an opt-in **application profile** layered on top of OKF — OKF itself
tolerates any tag; the profile tightens it. It is enforced separately from the
OKF structural linter, in **advisory mode** for tags (warnings, not build failures). A `type`
outside the registered list is the exception: types are a closed vocabulary, so it fails the run:

```
python3 .claude/skills/okf-wikify/scripts/lint_authority.py kb/            # variants + auto-detected collisions
python3 .claude/skills/okf-wikify/scripts/lint_authority.py kb/ --report   # + form + unaccessioned-term coverage
```

Typed relationships between records (the `relationships:` frontmatter field —
`SUPERSEDED_BY`, `GOVERNED_BY`, `IMPLEMENTED_BY`, …) are governed and queried by
a companion tool. Add an edge only when something will actually query it;
ordinary "see also" stays a plain markdown link. Work items use three of them —
`PART_OF` (an epic), `DEPENDS_ON`/`BLOCKS` (order), `DERIVED_FROM` (the source) — and the
validator also checks `state:` and rejects dependency self-loops and cycles
([work items](pdlc/work-items.md)).

```
python3 .claude/skills/okf-wikify/scripts/relationships.py kb/                 # validate edges + statuses
python3 .claude/skills/okf-wikify/scripts/relationships.py kb/ --current       # what's deprecated/superseded
python3 .claude/skills/okf-wikify/scripts/relationships.py kb/ --graph         # print the edge graph
python3 .claude/skills/okf-wikify/scripts/relationships.py kb/ --deps          # work items in dependency order; what's ready
```

Retrieval quality is measurable: an eval set of questions with gold relevant
files ([`library-science/eval/retrieval-evalset.yaml`](library-science/eval/retrieval-evalset.yaml))
is scored by precision/recall so a KB edit can be shown to improve retrieval.
Extend the eval set when you add a topic area. Its `exclude:` list keeps records of work — the
harness's roadmap, backlog, journal, handoff, audit sweeps, and ceremonies, and the PDLC worked
example built from records like them — out of the corpus the eval searches: they discuss
questions rather than answer them.

```
python3 .claude/skills/okf-wikify/scripts/retrieval_eval.py kb/ --expand --per-query   # score retrieval, show vocab lift
python3 .claude/skills/okf-wikify/scripts/retrieval_eval.py kb/ --gate-recall 0.75      # CI regression gate (baseline R@3≈0.82, 18 questions)
```

Stale records are retired on a defined, reversible path — **supersede, don't
delete** (`status: deprecated` + a `SUPERSEDED_BY` edge, or a `weeded_reason`).
See the [weeding policy](library-science/weeding-policy.md); the auditor enforces
it.

```
python3 .claude/skills/okf-wikify/scripts/weeding.py kb/                       # audit deprecate/supersede invariants
python3 .claude/skills/okf-wikify/scripts/weeding.py kb/ --candidates          # shelf-read: old records to review
```

**Which commands must pass, per bundle** — this KB, a project's `projects/<name>/kb/`, and
`projects/kb/` — is listed once, in the definition of done's [gates](pdlc/definition-of-done.md#gates)
(the commands above plus the backlog check, `backlog.py`). A project bundle has no vocabulary of
its own: `lint_authority.py` and `relationships.py` find this one by walking up the tree, and say
so ([validating a backlog](pdlc/work-items.md#validating-a-backlog)).

**How the overlay and the PDLC layer fit.** A work item is a record like any other: typed, tagged
from the vocabulary, linked by typed edges, and checked by the same linters. The journals'
"append, don't rewrite" and the weeding policy's "supersede, don't delete" are the same stance —
the record keeps its history. When the method replaces a page, the old one is superseded, not
deleted.

When adding a file: prefer an existing descriptor; if the right term isn't in
the vocabulary yet, use a sensible lowercase-kebab-case tag and (when it
recurs) accession it into `authority/vocabulary.yaml`. The rationale, the
roadmap, and the LIS mapping live in the [`library-science/`](library-science/index.md)
bundle.

## Related Knowledge Bases

- **Projects KB:** `/projects/kb/` - Navigate to individual project KBs; the prefix registry
- **Sample Project KB:** `/projects/sample-project/kb/` - The scaffold every new project's KB is copied from
- **Individual Project KBs:** `/projects/[project-name]/kb/` - Project-specific documentation

## Source Material

The following files informed this KB's creation:
- `/README.md` - Repository overview and structure
- `/CLAUDE.md` - Root-level configuration
- `/projects/sample-project/README.md` - Sample project overview
- `/projects/sample-project/CLAUDE.md` - Sample project configuration

For content not captured in this atomized KB (e.g., exact formatting, figures), refer to these source files directly.

# Open Knowledge Format (OKF) Spec Summary

Source: [GoogleCloudPlatform/knowledge-catalog/okf](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf), v0.1. This is a condensed, practical reference for writing conformant bundles — for the authoritative text, fetch `SPEC.md` from that repo.

## Core idea

A directory of markdown files with YAML frontmatter. No central registry, no required tooling — readable via `cat`, distributable via `git clone`. "Minimally opinionated": producers may add arbitrary extra frontmatter keys, and consumers must tolerate unknown keys, unknown `type` values, missing optional fields, and broken links.

## Frontmatter fields

**Required:**
- `type` — a descriptive string identifying the concept kind (e.g. `"Concept"`, `"Result"`, `"API Endpoint"`, `"Playbook"`). Not centrally registered — pick something that fits your source, but stay consistent within one bundle. Must be non-empty.

**Recommended (the linter warns, doesn't error, if these are missing):**
- `title` — human-readable display name.
- `description` — one-sentence summary.
- `resource` — a URI identifying the underlying source (arXiv id + section anchor, a URL, a local file path — whatever lets a reader trace the claim back to its origin).
- `tags` — a YAML list for cross-cutting categorization.
- `timestamp` — ISO 8601 date of last meaningful change.

Producers may add anything else (e.g. `author`, `version`, `severity`) — just don't expect every consumer to use it.

### Domain extension fields (optional, use when they earn their keep)

A real large-scale OKF conversion (an internal governance/process bundle, ~30 files) established a useful "core + overlay" pattern worth reusing when a bundle's content has structure the base five fields don't capture — most relevant for docs-folder/codebase sources with governance or process content (rules, ADRs, playbooks), less relevant for a single paper or API doc:

- `status` — `draft` | `review` | `finalized` | `deprecated`
- `enforcement` — `prescriptive` (carries MUST/MUST NOT rules) | `advisory` (SHOULD/recommend) | `informational` (purely descriptive)
- `audience` — `agent` | `human` | `both`
- `disclosure_level` — `always` (load in every context) | `on-demand` (load when entering a relevant task area) | `deep-reference` (load only when explicitly followed)
- `scope` — `project` | `team` | `organization` | `universal`
- `relationships` — a typed-edge list for load-bearing semantic relationships beyond a plain markdown link, e.g.:
  ```yaml
  relationships:
    - type: GOVERNED_BY
      target: /authority/constitution.md
    - type: SUPERSEDED_BY
      target: /decisions/adr-005.md
  ```
  Use sparingly — most cross-references should just be a markdown link in the body prose; reach for `relationships` only when the edge itself (not just "these are related") is something a consumer needs to query mechanically (e.g. "what does this supersede").

Don't add these by default — they're real signal for governance/policy/process bundles and dead weight for a paper or a single API's docs. If you do add them, define the vocabulary you're using (e.g. what counts as `prescriptive` vs `advisory` in this bundle) somewhere discoverable, typically the bundle's `CLAUDE.md`.

## Body structure

Standard markdown. Optional conventional section headings, useful mainly for structured/reference-style content:

| Heading | Purpose |
|---|---|
| `# Schema` | Structured column/field descriptions |
| `# Examples` | Usage examples in code blocks |
| `# Citations` | External sources supporting claims |

Not every file needs these — they're a convenience for reference-style docs (API specs, data schemas), not a requirement for narrative/concept files.

## File organization

```
bundle/
├── index.md              (reserved filename, no frontmatter except okf_version at root)
├── log.md                (reserved filename, optional, no frontmatter)
├── <concept>.md
└── <subdirectory>/
    ├── index.md
    └── <concept>.md
```

**Reserved filenames**: `index.md`, `log.md` — never used for concept documents (this skill also treats `CLAUDE.md` as reserved/non-content, since it's agent instructions rather than knowledge content, though that's a project convention rather than an OKF spec requirement).

## Cross-linking

Two supported forms:
1. **Bundle-relative absolute** — starts with `/`, e.g. `[customers table](/tables/customers.md)`. Resolved from the bundle root.
2. **Relative** — standard markdown relative paths, e.g. `[concept](./other.md)` or `[concept](../results/x.md)`.

Links assert a relationship; the specific semantics live in the surrounding prose (there's no formal link-typing in OKF v0.1). The spec explicitly tolerates broken links, but this skill's linter flags them anyway — a hand-authored bundle shouldn't have any, and catching them early is cheap.

## Index files

May appear at any directory level, with **no frontmatter at all** (except the root `index.md`, see below). Body is a grouped listing:

```markdown
# Section Heading

* [Title](relative-url) - description from linked concept
```

## Log files (optional)

Reverse-chronological changelog, ISO 8601 dates, newest first:

```markdown
## 2026-05-22
* **Update**: Description here
* **Creation**: Description here
```

Useful for bundles that get revisited and extended over time (see "Updating an existing bundle" in SKILL.md) — record what was added and when.

## Versioning

- Current version: `0.1`.
- `okf_version: "0.1"` may be declared **only** in the root `index.md` frontmatter — nowhere else in the bundle. This is the single most common mistake; the linter treats it as an error anywhere else.
- Future minor bumps add backward-compatible features; major bumps may break things.

## Conformance checklist (what `scripts/lint_okf.py` enforces)

1. Every non-reserved `.md` file has parseable YAML frontmatter.
2. Every such frontmatter block has a non-empty `type` field.
3. `okf_version` appears only in the root `index.md`.
4. Relative markdown links resolve to files that exist within the bundle.
5. (Warning only) Every file is reachable from some `index.md` — no silently orphaned files.
6. (Warning only) Recommended fields (`title`, `description`, `resource`, `tags`, `timestamp`) are present.

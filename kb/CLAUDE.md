# Repository Knowledge Base (OKF Format)

This is an Open Knowledge Format (OKF) bundle documenting the cc harness repository structure, architecture, and development practices.

## About This Bundle

This knowledge base is organized following the [OKF spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf). Each content file contains YAML frontmatter describing its type, title, tags, and source, followed by markdown content.

## Structure

The KB is organized into three main sections:

### Getting Started (`getting-started/`)
- **Repository Overview** - Introduction to the playground and its purpose
- **Quick Start Guide** - Get started in minutes with key entry points

### Architecture (`architecture/`)
- **Directory Structure** - Complete directory layout and organization
- **Knowledge Base Organization** - Three-tier KB system and navigation patterns
- **Project Template** - Standard structure for creating new projects

### Development (`development/`)
- **Development Workflow** - Standard workflow for working in the playground
- **Shared Code Management** - Managing code shared across projects

## Using This Knowledge Base

**Start here:** Read `kb/index.md` to understand the repository structure.

**Navigate by topic:** Each section (`getting-started/`, `architecture/`, `development/`) has an `index.md` listing its files.

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
5. Re-run linter to verify

## Conventions

- **Frontmatter:** Every file has type, title, description, resource, tags, timestamp
- **okf_version:** Declared only in root `index.md`
- **File types:** Common types include "Concept", "Reference", "Workflow", "Guide"
- **Linking:** Use relative markdown links (e.g., `[text](../other-dir/file.md)`)
- **Markdown:** Plain markdown with OKF frontmatter; no special tooling required

## Related Knowledge Bases

- **Projects KB:** `/projects/kb/` - Navigate to individual project KBs
- **Sample Project KB:** `/projects/sample-project/kb/` - Example project documentation
- **Individual Project KBs:** `/projects/[project-name]/kb/` - Project-specific documentation

## Source Material

The following files informed this KB's creation:
- `/README.md` - Repository overview and structure
- `/CLAUDE.md` - Root-level configuration
- `/projects/sample-project/README.md` - Sample project overview
- `/projects/sample-project/CLAUDE.md` - Sample project configuration

For content not captured in this atomized KB (e.g., exact formatting, figures), refer to these source files directly.

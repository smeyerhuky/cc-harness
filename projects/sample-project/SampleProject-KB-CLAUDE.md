# Sample Project Knowledge Base (OKF Format)

This is an Open Knowledge Format (OKF) bundle documenting the Sample Project — a template project demonstrating the standard structure and conventions for all projects in the playground.

## About This Bundle

This knowledge base is organized following the [OKF spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf). Each content file contains YAML frontmatter describing its type, title, tags, and source, followed by markdown content.

## Structure

The KB is organized into two main sections:

### Overview (`overview/`)
- **About Sample Project** - Project overview, purpose, and use cases

### Structure (`structure/`)
- **Project Directory Structure** - Detailed explanation of directories and organization

## Using This Knowledge Base

**Start here:** Read `kb/index.md` to understand this project's documentation.

**Learn the structure:** Review [Project Directory Structure](./kb/structure/directories.md) to understand how to organize a new project.

**Use as template:** Copy this project's directory structure when creating new projects, adapting CLAUDE.md, README.md, and version.json to your needs.

**Link to repository KB:** This project KB links to the repository KB for general playground guidance. Follow those links for broader context.

## Building and Updating This Bundle

This KB was built using the `/okf-wikify` skill. The workflow involved:

1. **Ingestion:** Read the project README.md and CLAUDE.md files
2. **Decomposition:** Identified logical ideas (project overview, structure/organization)
3. **Writing:** Created files with OKF frontmatter and markdown content
4. **Organization:** Grouped files into overview/ and structure/ sections
5. **Linting:** Validated with `python3 ~/.claude/skills/okf-wikify/scripts/lint_okf.py kb/`

To add content to this bundle:

1. Create new markdown file in appropriate directory
2. Add OKF frontmatter (type, title, description, resource, tags, timestamp)
3. Write content that links to related files using relative paths
4. Update directory `index.md` to list the new file
5. Re-run linter to verify

## Conventions

- **Frontmatter:** Every file has type, title, description, resource, tags, timestamp
- **okf_version:** Declared only in `kb/index.md`
- **File types:** Common types include "Concept", "Reference", "Workflow", "Guide"
- **Linking:** Use relative markdown links (e.g., `[text](../other-dir/file.md)`)
- **Markdown:** Plain markdown with OKF frontmatter; no special tooling required

## Related Knowledge Bases

- **Repository KB:** `/kb/` - Repository-wide guidance and architecture
- **Projects KB:** `/projects/kb/` - Navigation to all project KBs
- **Other Project KBs:** `/projects/[project-name]/kb/` - Documentation for other projects

## Source Material

The following files informed this KB's creation:
- `projects/sample-project/README.md` - Project overview
- `projects/sample-project/CLAUDE.md` - Project configuration
- `projects/sample-project/version.json` - Project metadata

For content not captured in this atomized KB (e.g., exact formatting), refer to these source files directly.

## Next Steps

1. Use this project as a template when creating new projects
2. Refer to the [Repository Project Template](../../kb/architecture/project-template.md) for detailed guidelines
3. Check the [Repository KB](../../kb/index.md) for repository-wide knowledge

# Chain Mail Knowledge Base (OKF Format)

This is an Open Knowledge Format (OKF) bundle documenting the Chain Mail project — a new
playground project currently existing as a scaffold created from the standard template.

## About This Bundle

This knowledge base is organized following the [OKF spec](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf).
Each content file contains YAML frontmatter describing its type, title, tags, and source,
followed by markdown content.

## Structure

The KB is organized into two main sections:

### Overview (`overview/`)
- **About Chain Mail** - Project overview, purpose, and current status

### Structure (`structure/`)
- **Project Directory Structure** - Detailed explanation of directories and organization

## Using This Knowledge Base

**Start here:** Read `kb/index.md` to understand this project's documentation.

**Learn the structure:** Review [Project Directory Structure](./kb/structure/directories.md).

## Conventions

- **Frontmatter:** Every content file has type, title, description, resource, tags, timestamp
- **okf_version:** Declared only in `kb/index.md`
- **File types:** Common types include "Concept", "Reference", "Workflow", "Guide"
- **Linking:** Use relative markdown links (e.g., `[text](../other-dir/file.md)`)

## Related Knowledge Bases

- **Repository KB:** `/kb/` - Repository-wide guidance and architecture
- **Projects KB:** `/projects/kb/` - Navigation to all project KBs

## Next Steps

1. Define the project's scope and update the overview
2. Add feature/decision sections to the KB as implementation lands

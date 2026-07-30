# Projects Knowledge Base (OKF Format)

This is an Open Knowledge Format (OKF) bundle for navigating and discovering project-specific knowledge bases in the playground.

## About This Bundle

This KB provides a central index and navigation hub for all projects. Each project maintains its own OKF-formatted knowledge base in `projects/[project-name]/kb/`.

## Structure

### Projects (`projects/`)
- **Sample Project** - Template project demonstrating the playground structure

## Using This Knowledge Base

**Start here:** Read `projects/kb/index.md` to access the projects index.

**Navigate to project:** Find the project you're interested in under [Projects](./projects/index.md), then navigate to that project's KB.

**Project-specific KB:** Each project's KB is located at `projects/[project-name]/kb/index.md`.

## Repository KB Navigation

For repository-wide knowledge and guidelines, see `/kb/index.md`:
- Getting started with the playground
- Repository architecture and structure
- Development workflows and standards

## Adding a New Project

When creating a new project:

1. Create project directory: `mkdir -p projects/[project-name]/{src,kb}`
2. Follow [Project Template](../../kb/architecture/project-template.md) structure
3. Document project in `projects/[project-name]/kb/` using OKF format
4. Add entry to `projects/kb/projects/index.md`
5. Create companion `[project-name]-KB-CLAUDE.md` documenting the project KB

## Conventions

- Each project KB uses OKF format with YAML frontmatter
- `okf_version: "0.1"` declared only in project `kb/index.md`
- Project KBs use relative links to reference each other and the repository KB
- This navigation KB does NOT contain `okf_version` — only individual project KBs do

## Related Knowledge Bases

- **Repository KB:** `/kb/` - Repository-wide guidance
- **Individual Project KBs:** `/projects/[project-name]/kb/` - Project-specific documentation

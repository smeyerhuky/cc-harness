---
type: "Concept"
title: "Development Workflow"
description: "Standard development workflow for working in the playground."
resource: "README.md"
tags: ["workflow", "development", "process"]
timestamp: "2026-07-15"
---

# Development Workflow

Follow this workflow when developing projects in the playground.

## Phase 1: Setup

1. Create project directory: `mkdir -p projects/[project-name]/{src,kb}`
2. Create required files:
   - `README.md` - Project overview
   - `CLAUDE.md` - Project configuration
   - `version.json` - Project metadata
   - `kb/index.md` - KB entry point
3. Update `projects/kb/index.md` to link your new project
4. Document project-specific instructions in `CLAUDE.md`

## Phase 2: Development

1. **Code:** Implement features in `src/` directory
2. **Document:** Add documentation to `kb/` as you work
3. **Reference:** Update KBs when adding new concepts or decisions
4. **Version:** Update `version.json` for each milestone
5. **Share:** Add utilities to `/projects/common/` if reusable elsewhere

## Phase 3: Knowledge Management

### Creating KB Entries

When adding significant features or changes:
1. Identify the concept/feature
2. Create new markdown file in appropriate KB subdirectory
3. Add OKF frontmatter with type, title, description, tags
4. Write content linking to related files
5. Update `index.md` to include new file
6. Run OKF linter: `python3 ~/.claude/skills/okf-wikify/scripts/lint_okf.py [kb-dir]`

### KB Organization

Structure your `kb/` directory logically:
- `overview/` - Project overview and architecture
- `features/` - Feature documentation
- `api/` - API references
- `troubleshooting/` - Common issues and solutions
- `decisions/` - Technical decisions and rationale

## Phase 4: Milestones

1. Update `version.json` when reaching milestones
2. Document progress in project KB
3. Update `projects/kb/index.md` with project status
4. Maintain `README.md` with current state

## Reusing Code

### Import from Shared Code
Place utilities in `/projects/common/` and import in your project:
```
Import from ../common/[module]
```

### Create Shared Utilities
When code is useful across projects:
1. Extract to `/projects/common/`
2. Document in common directory
3. Add reference to project KBs that use it
4. Update all importing projects to reference shared version

## Documentation Standards

- Use markdown for all documentation
- Follow OKF format for KB files (frontmatter + content)
- Use relative links between KB files
- Keep README.md simple; use KB for detailed docs
- Link from project KB back to repository KB for context

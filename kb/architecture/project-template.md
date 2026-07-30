---
type: "Reference"
title: "Project Template"
description: "Standard directory structure and configuration for creating new projects."
resource: "README.md"
tags: ["projects", "template", "structure"]
timestamp: "2026-07-15"
---

# Project Template

Every project in `/projects/[project-name]/` follows this consistent structure.

## Directory Structure

```
projects/[project-name]/
├── src/                 # Source code directory
│   └── (your code here)
│
├── kb/                  # Project knowledge base
│   └── index.md        # Project KB entry point
│
├── CLAUDE.md            # Project-specific Claude configuration
├── README.md            # Project overview and setup
└── version.json         # Project metadata and version info
```

## File Responsibilities

### `src/`
Stores all project source code. Organize subdirectories as appropriate for your project type (e.g., `src/components/`, `src/utils/`, `src/lib/`).

### `kb/`
Project-specific knowledge base using OKF format. Include:
- Project overview and goals
- Technical architecture
- Setup and development instructions
- API references
- Troubleshooting guides
- Decision logs

Start with `kb/index.md` as the entry point.

### `CLAUDE.md`
Project-specific Claude configuration and guidelines. Include:
- Project-specific coding standards
- Development practices for this project
- How to use the project KB
- Project-specific conventions
- Links to related documentation

### `README.md`
Quick project overview and setup instructions. Should include:
- What the project does
- Quick start instructions
- Directory overview
- Key features
- Links to deeper documentation in `kb/`

### `version.json`
Project metadata in JSON format. Include:
- Project name
- Current version
- Description
- Project status
- Last updated timestamp

Example:
```json
{
  "name": "my-project",
  "version": "0.1.0",
  "description": "My project description",
  "status": "in-progress",
  "updated": "2026-07-15"
}
```

## Creating a New Project

1. Run:
   ```bash
   mkdir -p projects/[project-name]/{src,kb}
   ```

2. Create `CLAUDE.md` with project-specific instructions

3. Create `README.md` with overview and quick start

4. Create `version.json` with project metadata

5. Create `kb/index.md` as project KB entry point

6. Update `projects/kb/index.md` to reference your new project

7. Document your project in `kb/` using OKF format

## Shared Code

Use `/projects/common/` for utilities shared across multiple projects. Reference from your project's `src/` directory.

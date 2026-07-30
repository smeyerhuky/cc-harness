---
type: "Concept"
title: "Quick Start Guide"
description: "Get started with the playground in minutes."
resource: "README.md"
tags: ["setup", "getting-started", "quick-start"]
timestamp: "2026-07-15"
---

# Quick Start Guide

## Accessing Knowledge Bases

Start with the entry points:
- **Repository KB:** Read `kb/index.md` for general repository instructions and environment details
- **Projects KB:** Review `projects/kb/index.md` for available projects
- **Project-specific KB:** Check individual project `kb/` directories for project documentation

## Creating Your First Project

1. Create a new directory under `/projects/[your-project-name]`
2. Add the required structure:
   ```
   projects/[project-name]/
   ├── src/           # Your source code goes here
   ├── kb/            # Project documentation
   ├── CLAUDE.md      # Project configuration
   ├── README.md      # Project overview
   └── version.json   # Project metadata
   ```
3. Document project-specific instructions in `CLAUDE.md`
4. Add project documentation to `kb/`
5. Update `projects/kb/index.md` to reference your new project

## Using Shared Code

Place utilities and code shared across multiple projects in `/projects/common/`. Import from here in your project code.

## Development Workflow

1. **Start:** Create project directory with required structure
2. **Document:** Add instructions to `kb/` and guidelines to `CLAUDE.md`
3. **Code:** Implement in `src/`
4. **Iterate:** Update KBs as you work
5. **Version:** Update `version.json` as milestones complete

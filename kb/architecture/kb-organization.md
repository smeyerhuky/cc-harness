---
type: "Concept"
title: "Knowledge Base Organization"
description: "How knowledge bases are organized across the harness."
resource: "README.md"
tags: ["knowledge-base", "organization"]
timestamp: "2026-07-15"
---

# Knowledge Base Organization

The harness uses a three-tier knowledge base system for clear information separation and navigation.

## Tier 1: Repository KB (`/kb/`)

**Purpose:** General instructions, environment setup, tools, and shared documentation

**Content:**
- Repository overview and philosophy
- Getting started guides
- Architecture and design documentation
- Common development patterns
- Environment setup details
- General coding guidelines
- How work is planned and recorded — the PDLC method, [`kb/pdlc/`](../pdlc/index.md) — and the
  harness's own instance of it in `kb/process/`

**Access:** Use `kb/index.md` as entry point for repository-wide knowledge

**When to use:** Reference these when you need general harness information or cross-project guidance

## Tier 2: Projects Navigation KB (`/projects/kb/`)

**Purpose:** Navigation and index for all project-specific knowledge bases

**Content:**
- List of all active projects
- One card per project: what it is, its work-item prefix, and links to its handoff and backlog
  (static fields — where a project stands is read from its handoff)
- The prefix registry, so every project's work-item IDs stay unique
- Quick links to jump between projects

**Access:** Use `projects/kb/index.md` to navigate to individual projects

**When to use:** Navigate here to find which projects exist and discover project-specific documentation

## Tier 3: Project-Specific KB (`/projects/[project-name]/kb/`)

**Purpose:** Project-specific instructions, architecture notes, and domain knowledge

**Content:**
- Project requirements and specifications
- Technical decisions and rationale
- Architecture and design notes
- API references and interfaces
- Troubleshooting guides
- The project's PDLC instance: `kb/process/` (handoff, roadmap, backlog, running journal,
  definition of done) and `kb/alignment/` (review ceremonies)

**Access:** Each project maintains its own KB directory with `index.md` as entry point

**When to use:** Consult here for everything specific to a particular project

## Knowledge Flow

```
User enters the harness
         ↓
Read /kb/index.md (understand repo purpose)
         ↓
Check /projects/kb/index.md (find your project)
         ↓
Enter /projects/[project]/kb/index.md (project details)
         ↓
Read /projects/[project]/kb/process/handoff.md (where it stands, the next work item)
         ↓
Follow project-specific docs as needed
```

## Cross-Linking Strategy

- **Repository KB** links to `/projects/kb/index.md` for project navigation
- **Projects KB** links to individual project `kb/index.md` files
- **Project KB** links back to repository KB for shared information
- All files use relative markdown links for portability

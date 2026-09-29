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
│   ├── index.md        # Project KB entry point
│   ├── process/        # PDLC instances: handoff, roadmap, backlog/, journal/, definition of done
│   └── alignment/      # Review ceremonies, one folder each (created at the first ceremony)
│
├── spikes/              # Spike journals + throwaway code (created on the first spike)
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

### `kb/process/` — the project's PDLC instances
How work on the project is planned and recorded. The method is written once, in the repo's
[PDLC layer](../pdlc/index.md); each project keeps its own instances:
- `handoff.md` — where the project stands now; read first by a fresh session
  ([journals](../pdlc/journals.md))
- `roadmap.md` — milestones with todos, exit criteria, and owner check-ins
  ([pipeline](../pdlc/pipeline.md))
- `backlog/` — `<PREFIX>-EPIC/STORY/SPIKE/TICKET-NNN` work items ([work items](../pdlc/work-items.md))
- `journal/` — the running journal, one entry per working session ([journals](../pdlc/journals.md))
- `definition-of-done.md` — this project's additions to the repo-wide
  [definition of done](../pdlc/definition-of-done.md)
- `coverage-audit.md` — dated [coverage-audit](../pdlc/coverage-audit.md) sweeps, created on the
  first sweep

### `kb/alignment/`
Review ceremonies, one folder per ceremony — see [ceremonies](../pdlc/ceremonies.md). Created at
the first ceremony, not by the scaffold.

### `spikes/`
One folder per spike — a `JOURNAL.md` plus any throwaway code and fixtures. Outside `kb/` because
it holds code, not knowledge-base records. Created on the first spike.

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
Project metadata in JSON format, updated at every milestone exit. Include:
- Project name
- Current version
- Description
- Project status — one of `planning` (until the first build milestone), `active`, `paused`,
  `done`, `archived`; only the scaffold itself uses `scaffold`
- Current milestone
- Last updated timestamp

Example:
```json
{
  "name": "my-project",
  "version": "0.1.0",
  "description": "My project description",
  "status": "active",
  "milestone": "M1",
  "updated": "2026-07-15"
}
```

## Creating a New Project

Copy `projects/sample-project/`, the scaffold that already carries every file above, PDLC
instances included, with each line a new project must write marked `SCAFFOLD:`. The steps live in
one place: [`projects/CLAUDE.md`](../../projects/CLAUDE.md), "Adding a new project" — and "The
first session in a new project" beside it.

## Shared Code

Use `/projects/common/` for utilities shared across multiple projects. Reference from your project's `src/` directory.

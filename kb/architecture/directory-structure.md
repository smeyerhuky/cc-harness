---
type: "Reference"
title: "Directory Structure"
description: "Complete directory layout of the cc harness."
resource: "README.md"
tags: ["architecture", "structure", "directories"]
timestamp: "2026-07-15"
---

# Directory Structure

## Repository Root

```
cc-harness/
├── kb/                          # Repository-wide knowledge base
│   ├── index.md                 # KB entry point
│   ├── pdlc/                    # The PDLC method: how work is planned and recorded
│   ├── process/                 # Git discipline + the harness's roadmap, backlog, journal, handoff
│   ├── alignment/               # The harness's review ceremonies (created at the first one)
│   ├── library-science/         # Authority control, typed relationships, retrieval eval, weeding
│   ├── authority/               # The controlled vocabulary the linters enforce
│   ├── getting-started/         # Getting started guides
│   ├── architecture/            # Design and structure docs
│   └── …                        # Reference sections: ai-sdlc, concepts, platforms, lessons, …
│
├── spikes/                      # Spike journals for harness investigations (created at the first)
│
├── projects/                    # All project containers
│   ├── common/                  # Shared utilities and common code
│   │   └── .keep               # Git tracking
│   │
│   ├── kb/                      # Projects directory KB index
│   │   └── index.md            # Navigation for all projects
│   │
│   ├── sample-project/          # The scaffold every new project is copied from
│   │   ├── src/                # Project source code
│   │   ├── kb/                 # Project-specific KB
│   │   │   └── process/        # Handoff, roadmap, backlog, running journal, definition of done
│   │   ├── CLAUDE.md           # Project configuration, incl. its work-item prefix
│   │   ├── README.md           # Project overview
│   │   └── version.json        # Project metadata
│   │
│   └── [other-projects]/        # Additional projects follow same pattern
│
├── config/                      # Root-level configuration
│   └── .keep
│
├── README.md                    # Repository overview
├── CLAUDE.md                    # Root-level Claude configuration
└── LICENSE                      # Project license
```

## Directory Purposes

### `/kb/` - Repository KB
Contains repository-wide documentation, environment setup, tools, shared development guidelines, and common patterns. Access via `kb/index.md`.

### `/kb/pdlc/` - How Work Is Planned and Recorded
The PDLC method every project and the harness follow — pipeline, work items, journals,
facilitator, ceremonies, coverage audit, definition of done, templates, a worked example. Written once; the
instances live where the work happens. Start at [`kb/pdlc/index.md`](../pdlc/index.md).

### `/kb/process/` - Git Discipline and the Harness's Own Work
Branch, commit, PR, and push rules, plus the harness's own PDLC instance: its roadmap, backlog
(`CCH-*`), running journal, and handoff.

### `/spikes/` - Spike Journals
One folder per time-boxed investigation of harness work (`spikes/<slug>/JOURNAL.md`), with any
throwaway code. Created at the first spike; a project keeps its own `spikes/`.

### `/projects/` - Projects Container
All project directories live here. Keeps repository root clean and provides clear project isolation.

### `/projects/common/` - Shared Code
Utilities and code shared across multiple projects. Import these in your project code to avoid duplication.

### `/projects/kb/` - Projects Navigation
Index and navigation for all project-specific knowledge bases. Links to each project's KB.

### `/projects/[project-name]/` - Individual Project
Each project is self-contained with:
- `src/` - Project source code
- `kb/` - Project-specific documentation, including `kb/process/` (its handoff, roadmap, backlog,
  running journal, and definition of done) and, once it runs a ceremony, `kb/alignment/`
- `CLAUDE.md` - Project configuration, including its work-item prefix
- `README.md` - Project overview
- `version.json` - Project metadata

### `/config/` - Root Configuration
Root-level configuration files (currently reserved for future use).

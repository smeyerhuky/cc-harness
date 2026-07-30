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
│   ├── getting-started/         # Getting started guides
│   └── architecture/            # Design and structure docs
│
├── projects/                    # All project containers
│   ├── common/                  # Shared utilities and common code
│   │   └── .keep               # Git tracking
│   │
│   ├── kb/                      # Projects directory KB index
│   │   └── index.md            # Navigation for all projects
│   │
│   ├── sample-project/          # Individual project (template)
│   │   ├── src/                # Project source code
│   │   ├── kb/                 # Project-specific KB
│   │   ├── CLAUDE.md           # Project configuration
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

### `/projects/` - Projects Container
All project directories live here. Keeps repository root clean and provides clear project isolation.

### `/projects/common/` - Shared Code
Utilities and code shared across multiple projects. Import these in your project code to avoid duplication.

### `/projects/kb/` - Projects Navigation
Index and navigation for all project-specific knowledge bases. Links to each project's KB.

### `/projects/[project-name]/` - Individual Project
Each project is self-contained with:
- `src/` - Project source code
- `kb/` - Project-specific documentation
- `CLAUDE.md` - Project configuration
- `README.md` - Project overview
- `version.json` - Project metadata

### `/config/` - Root Configuration
Root-level configuration files (currently reserved for future use).

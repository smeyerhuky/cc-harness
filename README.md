# CC Harness

A structured coding playground for experimentation and multi-project development with integrated knowledge management.

## Purpose

This repository serves as a development environment where you can work on various projects simultaneously, with each project maintaining its own knowledge base and configuration. The playground uses a centralized knowledge base system for sharing general instructions, environment details, and documentation.

## Directory Structure

```
cc-harness/
├── .claude/                       # Claude skill definitions
│   └── skills/
│       └── okf-wikify/            # OKF deep-wiki skill
│       └── scad-design-to-print/  # SCAD Design to Print skill
│
├── kb/                            # Repository-wide knowledge base (OKF bundle)
│   ├── CLAUDE.md                  # Governs the repo-wide KB
│   ├── architecture/              # Directory structure and KB organization docs
│   ├── additive-engineering/      # Additive Engineering concepts, and rulebooks
│   ├── concepts/                  # Abstract concepts (deploy lifecycle, etc.)
│   ├── development/               # Workflow and shared-code guidance
│   ├── getting-started/           # Orientation and quick-start docs
│   ├── lessons/                   # Lessons learned from real deploys
│   ├── platforms/                 # Per-platform deploy recipes (Cloudflare Workers, etc.)
│   ├── process/                   # Git/PR/commit discipline
│   └── index.md                   # KB entry point
│
├── projects/                      # All project containers
│   ├── CLAUDE.md                  # Governs the projects/ directory
│   ├── common/                    # Shared utilities and common code
│   ├── hello-worker/              # Cloudflare Worker project (src/, wrangler.jsonc)
│   ├── sample-project/            # Template project (src/, kb/, CLAUDE.md, README.md, version.json)
│   └── kb/                        # Projects index/governance KB (CLAUDE.md, index.md, projects/)
│
├── config/                        # Root-level configuration
│   └── .keep
│
├── README.md                      # This file
├── CLAUDE.md                      # Root-level Claude configuration
└── LICENSE                        # Project license
```

> **CLAUDE.md governance:** CLAUDE.md files live at four levels — `/CLAUDE.md`, `/kb/CLAUDE.md`,
> `/projects/CLAUDE.md`, and `/projects/<name>/CLAUDE.md` — each governing its directory and below.
> There are **no** `<Name>-KB-CLAUDE.md` companion files; a `kb/` bundle is governed by the nearest
> CLAUDE.md above it. See [`/CLAUDE.md`](CLAUDE.md) → "Documentation & CLAUDE.md governance".

## Knowledge Base Organization

### Repository KB (`/kb/`)
- **Purpose:** General instructions, environment setup, tools, and shared documentation
- **Content:** Claude instructions, environment variables, development guidelines, common patterns
- **Access:** Use `kb/index.md` as entry point

#### KB Subdirectories

| Directory | Contents |
|-----------|----------|
| `kb/architecture/` | Directory structure and KB organization docs |
| `kb/additive-engineering/` | Additive Engineering concepts, and rulebooks |
| `kb/concepts/` | Abstract concepts: deploy lifecycle, progressive disclosure, verification vs. deployment |
| `kb/development/` | Workflow guides and shared-code patterns |
| `kb/getting-started/` | Orientation overview and quick-start guide |
| `kb/lessons/` | Lessons learned from real deploys (read before hitting the wall) |
| `kb/platforms/` | Per-platform deploy recipes (Cloudflare Workers; add others here) |
| `kb/process/` | Branch discipline, commit etiquette, PR creation, push/retry, merged-PR follow-ups |

### Projects KB (`/projects/kb/`)
- **Purpose:** Navigation and index for all project-specific KBs
- **Content:** Links to ongoing projects, work in progress documentation
- **Access:** Use `projects/kb/index.md` to navigate to individual projects

### Project-Specific KB (`/projects/[project-name]/kb/`)
- **Purpose:** Project-specific instructions, architecture notes, and domain knowledge
- **Content:** Project requirements, technical decisions, troubleshooting, API references
- **Access:** Each project maintains its own KB directory

## Project Structure

Each project under `/projects/` follows this template:

```
projects/[project-name]/
├── src/                 # Source code
├── kb/                  # Project-specific knowledge base
├── CLAUDE.md            # Project configuration and guidelines
├── README.md            # Project overview and setup instructions
└── version.json         # Project metadata
```

### Creating a New Project

1. Create a new directory under `/projects/[your-project-name]`
2. Add the required structure: `src/`, `kb/`, `CLAUDE.md`, `README.md`, `version.json`
3. Write `CLAUDE.md` to govern the project (rules, conventions, kb navigation)
4. Start the project `kb/` as an OKF bundle (`kb/index.md` holds the only `okf_version`)
5. Register the project: add a card at `projects/kb/projects/<name>.md` and link it from
   `projects/kb/projects/index.md`; add the project to the trees in `/CLAUDE.md` and this README

See [`/projects/CLAUDE.md`](projects/CLAUDE.md) for the full workflow and the CLAUDE.md hierarchy.

## Shared Code

Use `/projects/common/` for utilities and code shared across multiple projects.

## Development Workflow

1. **Start a project:** Create a new directory under `/projects/[project-name]`
2. **Document:** Add instructions to `kb/` and project guidelines to `CLAUDE.md`
3. **Code:** Implement in `src/`
4. **Reference:** Update KBs as you work
5. **Version:** Update `version.json` as project milestones complete

## Getting Started

- Read `kb/index.md` for general repository instructions and environment details
- Review `projects/kb/index.md` for available projects
- Check individual project `README.md` for project-specific setup
- Consult individual project `kb/` for project documentation

# CC Harness

A template repository for multi-project development with integrated knowledge management: clone it, then build your projects in it.

## Purpose

This repository serves as a development environment where you can work on various projects simultaneously, with each project maintaining its own knowledge base and configuration. The harness uses a centralized knowledge base system for sharing general instructions, environment details, and documentation.

## Directory Structure

```
cc-harness/
├── .claude/                       # Claude skill definitions
│   └── skills/
│       └── okf-wikify/            # OKF deep-wiki skill
│       └── scad-design-to-print/  # SCAD Design to Print skill
│
├── .github/                       # CI: one workflow set per project with code (Garbage Day so far)
│
├── kb/                            # Repository-wide knowledge base (OKF bundle)
│   ├── CLAUDE.md                  # Governs the repo-wide KB
│   ├── pdlc/                      # The PDLC method: how work is planned and recorded
│   ├── process/                   # Git/PR discipline + the harness's roadmap, backlog, journal, handoff
│   ├── alignment/                 # The harness's review ceremonies (created at the first one)
│   ├── ai-sdlc/                   # AI-native development principles
│   ├── library-science/           # Authority control, typed relationships, retrieval eval, weeding
│   ├── authority/                 # The controlled vocabulary (vocabulary.yaml)
│   ├── architecture/              # Directory structure and KB organization docs
│   ├── additive-engineering/      # Additive Engineering concepts, and rulebooks
│   ├── concepts/                  # Abstract concepts (deploy lifecycle, etc.)
│   ├── development/               # Shared-code guidance (old workflow superseded by pdlc/)
│   ├── getting-started/           # Orientation and quick-start docs
│   ├── lessons/                   # Lessons learned from real deploys
│   ├── platforms/                 # Per-platform deploy recipes (Cloudflare Workers, etc.)
│   └── index.md                   # KB entry point
│
├── spikes/                        # Spike journals for harness investigations (created at the first)
│
├── projects/                      # All project containers
│   ├── CLAUDE.md                  # Governs the projects/ directory
│   ├── common/                    # Shared utilities and common code
│   ├── garbage-day/               # A two-player, real-time falling-block versus game (React + Durable Objects)
│   ├── hello-worker/              # A minimal Cloudflare Worker — the deploy recipes' worked example
│   ├── sample-project/            # The scaffold every new project is copied from
│   └── kb/                        # Projects index/governance KB (CLAUDE.md, index.md, projects/)
│
├── config/                        # Root-level configuration
│   └── .keep
│
├── README.md                      # This file
├── CLAUDE.md                      # Root-level Claude configuration
├── renovate.json                  # Dependency updates (Renovate reads it only here), scoped per project
└── LICENSE                        # Project license
```

> **CLAUDE.md governance:** CLAUDE.md files live at five levels — `/CLAUDE.md`, `/kb/CLAUDE.md`,
> `/projects/CLAUDE.md`, `/projects/kb/CLAUDE.md`, and `/projects/<name>/CLAUDE.md` — each governing
> its directory and below.
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
| `kb/pdlc/` | The PDLC method — pipeline, work items, journals, facilitator, ceremonies, coverage audit, definition of done, templates, a worked example |
| `kb/process/` | Git discipline (branches, commits, PRs, push/retry, merged-PR follow-ups), plus the harness's own roadmap, backlog, running journal, and handoff |
| `kb/alignment/` | The harness's review ceremonies, one folder each (created at the first ceremony) |
| `kb/ai-sdlc/` | AI-native development principles and phases |
| `kb/library-science/` | The KB's library-science overlay: authority control, typed relationships, the retrieval eval, weeding |
| `kb/authority/` | The controlled vocabulary the KB's linters enforce |
| `kb/architecture/` | Directory structure and KB organization docs |
| `kb/additive-engineering/` | Additive Engineering concepts, and rulebooks |
| `kb/concepts/` | Abstract concepts: deploy lifecycle, progressive disclosure, verification vs. deployment |
| `kb/development/` | Shared-code patterns (the old workflow page is superseded by `kb/pdlc/pipeline.md`) |
| `kb/getting-started/` | Orientation overview and quick-start guide |
| `kb/lessons/` | Lessons learned from real deploys (read before hitting the wall) |
| `kb/platforms/` | Per-platform deploy recipes (Cloudflare Workers; add others here) |

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
│   └── process/         # Handoff, roadmap, backlog, running journal, definition of done
├── CLAUDE.md            # Project configuration and guidelines, incl. its work-item prefix
├── README.md            # Project overview and setup instructions
└── version.json         # Project metadata
```

### Creating a New Project

Copy the scaffold, `projects/sample-project/` — the steps (prefix, rename, the lines marked
`SCAFFOLD:`, registration, validation) are in [`/projects/CLAUDE.md`](projects/CLAUDE.md),
"Adding a new project", along with the CLAUDE.md hierarchy.

## Shared Code

Use `/projects/common/` for utilities and code shared across multiple projects.

## Development Workflow

Work is planned and recorded the same way in every project — a spec, a roadmap of milestones, a
backlog of work items, a running journal, and a handoff — by the method in
[`kb/pdlc/`](kb/pdlc/index.md). The short version, with links to each rule, is the "PDLC protocol"
section of [`/CLAUDE.md`](CLAUDE.md).

## Getting Started

- Read `kb/index.md` for general repository instructions and environment details
- Review `projects/kb/index.md` for available projects
- Check individual project `README.md` for project-specific setup
- Consult individual project `kb/` for project documentation

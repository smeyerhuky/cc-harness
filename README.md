# CC Harness

A structured coding playground for experimentation and multi-project development with integrated knowledge management.

## Purpose

This repository serves as a development environment where you can work on various projects simultaneously, with each project maintaining its own knowledge base and configuration. The playground uses a centralized knowledge base system for sharing general instructions, environment details, and documentation.

## Directory Structure

```
cc-harness/
├── .claude/                     # Claude skill definitions
│   └── skills/
│       └── okf-wikify/          # OKF deep-wiki skill
│
├── kb/                          # Repository-wide knowledge base (OKF bundle)
│   ├── architecture/            # Directory structure and KB organization docs
│   ├── concepts/                # Abstract concepts (deploy lifecycle, etc.)
│   ├── development/             # Workflow and shared-code guidance
│   ├── getting-started/         # Orientation and quick-start docs
│   ├── lessons/                 # Lessons learned from real deploys
│   ├── platforms/               # Per-platform deploy recipes (Cloudflare Workers, etc.)
│   ├── process/                 # Git/PR/commit discipline
│   └── index.md                 # KB entry point
│
├── projects/                    # All project containers
│   ├── common/                  # Shared utilities and common code
│   │   └── .keep
│   ├── hello-worker/            # Cloudflare Worker project
│   │   ├── src/                 # Worker source code
│   │   └── wrangler.jsonc       # Wrangler configuration
│   ├── kb/                      # Projects directory KB index
│   │   └── index.md             # Navigation for project KBs
│   └── sample-project/          # Template project
│       ├── src/                 # Project source code
│       ├── kb/                  # Project-specific KB
│       ├── CLAUDE.md            # Project-specific Claude configuration
│       ├── README.md            # Project overview and setup
│       └── version.json         # Project metadata and version
│
├── config/                      # Root-level configuration
│   └── .keep
│
├── README.md                    # This file
├── CLAUDE.md                    # Root-level Claude configuration
├── KB-CLAUDE.md                 # Knowledge base Claude configuration
├── Projects-KB-CLAUDE.md        # Projects KB Claude configuration
└── LICENSE                      # Project license
```

## Knowledge Base Organization

### Repository KB (`/kb/`)
- **Purpose:** General instructions, environment setup, tools, and shared documentation
- **Content:** Claude instructions, environment variables, development guidelines, common patterns
- **Access:** Use `kb/index.md` as entry point

#### KB Subdirectories

| Directory | Contents |
|-----------|----------|
| `kb/architecture/` | Directory structure and KB organization docs |
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
3. Document project-specific instructions in `CLAUDE.md`
4. Add project documentation to `kb/`
5. Update `projects/kb/index.md` to reference your new project

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
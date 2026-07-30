---
type: "Reference"
title: "Project Directory Structure"
description: "Detailed explanation of the chain-mail project's directory organization."
resource: "../README.md"
tags: ["structure", "directories", "project"]
timestamp: "2026-07-30"
---

# Project Directory Structure

Chain Mail follows the standard playground structure for all projects.

## Complete Directory Layout

```
projects/chain-mail/
│
├── src/                             # Project source code
│   └── (your source code here)      # Organize as needed for your project
│
├── kb/                              # Project knowledge base
│   ├── index.md                     # KB entry point with okf_version
│   ├── overview/                    # Project overview section
│   │   └── about.md                 # About this project
│   └── structure/                   # Structure and organization
│       └── directories.md           # This file
│
├── CLAUDE.md                        # Project-specific configuration
├── README.md                        # Project overview and setup
└── version.json                     # Project metadata and version
```

## Directory Purposes

### `src/`
Contains all project source code. Organize subdirectories as appropriate for the project
type (web, library, CLI, etc.). Currently empty apart from a `.keep` placeholder.

### `kb/`
Project-specific knowledge base using Open Knowledge Format (OKF). Includes:
- **index.md** - KB entry point with `okf_version: "0.1"`
- Subdirectories organized by topic
- Each content file has OKF frontmatter (type, title, description, resource, tags, timestamp)
- Files link to related content using relative markdown links

### `CLAUDE.md`
Project-specific configuration and guidelines for Claude working in this project.

### `README.md`
Quick project overview and setup instructions.

### `version.json`
Project metadata: `name`, `version`, `description`, `status`, and `updated`.

## Related Documentation

- [About Chain Mail](../overview/about.md) - Project overview
- [Repository Architecture](../../../../kb/architecture/directory-structure.md) - Overall repo structure

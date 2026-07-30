---
type: "Reference"
title: "Project Directory Structure"
description: "Detailed explanation of the sample project's directory organization."
resource: "../README.md"
tags: ["structure", "directories", "project"]
timestamp: "2026-07-15"
---

# Project Directory Structure

Sample Project follows the standard playground structure for all projects.

## Complete Directory Layout

```
projects/sample-project/
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
Contains all project source code. Organize subdirectories as appropriate for your project type:
- Web projects: `src/components/`, `src/pages/`, `src/utils/`
- Libraries: `src/lib/`, `src/index.js`
- CLI tools: `src/commands/`, `src/utils/`
- Other: Organize by features, layers, or domain

### `kb/`
Project-specific knowledge base using Open Knowledge Format (OKF). Includes:
- **index.md** - KB entry point with `okf_version: "0.1"`
- Subdirectories organized by topic
- Each file has OKF frontmatter (type, title, description, resource, tags, timestamp)
- Files link to related content using relative markdown links

Suggested subdirectories:
- `overview/` - Project overview and purpose
- `structure/` - Architecture and organization
- `features/` - Feature documentation
- `api/` - API references
- `troubleshooting/` - Common issues and solutions
- `decisions/` - Technical decisions and rationale

### `CLAUDE.md`
Project-specific configuration and guidelines for Claude. Include:
- Project-specific coding standards and conventions
- Development practices for this project
- How to navigate and use the project KB
- Project-specific tool configurations
- Links to related documentation

### `README.md`
Quick project overview and setup instructions. Include:
- What the project does
- Quick start instructions
- Key features
- Directory overview
- Links to deeper documentation in `kb/`
- Any special setup requirements

### `version.json`
Project metadata in JSON format. Example:
```json
{
  "name": "sample-project",
  "version": "0.1.0",
  "description": "Template project demonstrating playground structure",
  "status": "template",
  "updated": "2026-07-15"
}
```

Include:
- `name` - Project name
- `version` - Current version
- `description` - Short description
- `status` - Current status (active, template, archived, in-progress, etc.)
- `updated` - Last update timestamp

## Organizing Source Code

For `src/` organization, common patterns include:

### Feature-based Organization
```
src/
├── auth/
├── database/
├── api/
└── utils/
```

### Layer-based Organization (for libraries)
```
src/
├── components/
├── hooks/
├── services/
├── utils/
└── types/
```

### Page-based Organization (for web apps)
```
src/
├── pages/
├── components/
├── api/
└── utils/
```

Choose the organization that makes sense for your project and document it in your project's kb/.

## Related Documentation

- [About Sample Project](../overview/about.md) - Project overview
- [Repository Project Template](../../../../kb/architecture/project-template.md) - Template guidelines
- [Repository Architecture](../../../../kb/architecture/directory-structure.md) - Overall repo structure

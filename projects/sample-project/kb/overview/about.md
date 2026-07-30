---
type: "Concept"
title: "About Sample Project"
description: "Template project demonstrating the playground structure and conventions."
resource: "../README.md"
tags: ["sample", "project", "overview", "template"]
timestamp: "2026-07-15"
---

# About Sample Project

Sample Project is a template project that demonstrates the standard structure and conventions for all projects in the cc harness.

## Purpose

This project serves as:
- **Reference implementation:** Shows recommended directory structure and organization
- **Learning tool:** Demonstrates best practices for playground projects
- **Template:** Can be copied and adapted to create new projects
- **Convention guide:** Shows how to structure code, docs, and configuration

## Features

- Standard directory structure with `src/`, `kb/`, configuration files
- Project-specific knowledge base using OKF format
- Configuration via CLAUDE.md for project-specific guidelines
- Metadata tracking in version.json
- Comprehensive README for project overview

## Project Structure

```
projects/sample-project/
├── src/                 # Project source code
├── kb/                  # Project-specific knowledge base
│   ├── index.md        # KB entry point
│   ├── overview/       # Project overview section
│   └── structure/      # Structure and organization section
├── CLAUDE.md            # Project configuration
├── README.md            # Project overview
└── version.json         # Project metadata
```

## Key Files

- **README.md** - Quick project overview and getting started guide
- **CLAUDE.md** - Project-specific Claude configuration and guidelines
- **version.json** - Project metadata, version, and status
- **kb/index.md** - Entry point for project documentation

## Using This Project

### For Learning
1. Read this project's README.md for quick overview
2. Review CLAUDE.md to understand project configuration
3. Explore kb/ to see how project documentation is structured
4. Check src/ to see project source code organization

### For Creating New Projects
1. Copy entire `projects/sample-project/` directory
2. Rename to `projects/[your-project-name]/`
3. Update CLAUDE.md with your project instructions
4. Update README.md with your project overview
5. Modify version.json with your metadata
6. Replace src/ with your actual code
7. Create your kb/ documentation using this project's KB as reference
8. Update `projects/kb/index.md` to reference your new project

## Next Steps

- Review [Project Structure](../structure/directories.md) for detailed explanation
- Read the [Repository Project Template Guide](../../../../kb/architecture/project-template.md)
- Check [Repository Getting Started Guide](../../../../kb/getting-started/quick-start.md)

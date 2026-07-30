---
type: "Reference"
title: "Sample Project"
description: "Template project demonstrating the playground structure and conventions."
resource: "../sample-project/README.md"
tags: ["sample", "template", "project"]
timestamp: "2026-07-15"
---

# Sample Project

The sample project is a template demonstrating the standard structure for all projects in the playground.

## Purpose

This project serves as a reference implementation showing:
- Recommended directory structure for new projects
- How to organize project source code
- How to structure project-specific knowledge bases
- Project configuration in CLAUDE.md
- Metadata in version.json

## Structure

```
projects/sample-project/
├── src/              # Project source code
├── kb/               # Project-specific knowledge base
├── CLAUDE.md         # Project configuration
├── README.md         # Project overview
└── version.json      # Project metadata
```

## Getting Started with the Sample Project

1. **Read the overview:** Start with `projects/sample-project/README.md`
2. **Check the configuration:** Review `projects/sample-project/CLAUDE.md` for project guidelines
3. **Explore the KB:** Browse `projects/sample-project/kb/` for project documentation
4. **Review metadata:** Check `projects/sample-project/version.json` for project status

## Using as Template

To create a new project based on this template:

1. Copy the directory structure
2. Update CLAUDE.md with your project-specific instructions
3. Update README.md with your project overview
4. Modify version.json with your project metadata
5. Create your knowledge base in kb/ using OKF format
6. Add your source code to src/
7. Update `projects/kb/index.md` to reference your new project

See [Repository KB - Project Template](../../../kb/architecture/project-template.md) for detailed instructions.

---
type: "Concept"
title: "Shared Code Management"
description: "How to manage and use shared code across projects."
resource: "README.md"
tags: ["shared-code", "utilities", "common"]
timestamp: "2026-07-15"
---

# Shared Code Management

The `/projects/common/` directory provides a central location for utilities and code shared across multiple projects.

## Purpose

Avoid code duplication by placing reusable utilities, helpers, and common functionality in `/projects/common/`. Projects can import and reuse this code.

## Directory Structure

```
projects/common/
├── utilities/          # Utility functions and helpers
├── types/              # Shared type definitions
├── config/             # Shared configuration
├── lib/                # Shared libraries
└── (project-specific subdirectories)
```

## Adding Shared Code

1. Identify code that's reused across multiple projects
2. Extract to `/projects/common/` with clear naming
3. Document the shared code in the common directory
4. Update all project KBs that use this code
5. Add reference to the shared code location

## Importing Shared Code

From your project source code:
```
Import from ../common/[path-to-module]
```

## Versioning

When shared code changes:
1. Review all projects that depend on it
2. Update those projects to use the new version
3. Document breaking changes in the shared code KB
4. Update project `version.json` if the change affects them

## Documentation

Document shared code:
- Create README in each shared subdirectory
- Include usage examples
- Link from project KBs to shared code documentation
- Keep shared code documentation up-to-date

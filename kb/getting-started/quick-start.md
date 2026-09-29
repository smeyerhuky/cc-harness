---
type: "Concept"
title: "Quick Start Guide"
description: "Get started with the harness in minutes."
resource: "README.md"
tags: ["setup", "getting-started", "quick-start"]
timestamp: "2026-07-15"
---

# Quick Start Guide

## Accessing Knowledge Bases

Start with the entry points:
- **Repository KB:** Read `kb/index.md` for general repository instructions and environment details
- **Projects KB:** Review `projects/kb/index.md` for available projects
- **Project-specific KB:** Check individual project `kb/` directories for project documentation

## Creating Your First Project

Copy the scaffold, `projects/sample-project/`, and follow the steps in
[`projects/CLAUDE.md`](../../projects/CLAUDE.md), "Adding a new project" — choose a work-item
prefix, rename, fill in the lines marked `SCAFFOLD:`, register the project, validate. The same
file's "The first session in a new project" says what to do next: the first work item is writing
the spec.

## Using Shared Code

Place utilities and code shared across multiple projects in `/projects/common/`. Import from here in your project code.

## Development Workflow

Work moves from spec to plan to work items to done by the [PDLC pipeline](../pdlc/pipeline.md);
a project's handoff (`kb/process/handoff.md`) always says where it stands and what is next. The
short version, with a link to each rule, is the "PDLC protocol" section of the root `CLAUDE.md`.

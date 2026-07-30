---
type: "Concept"
title: "Repository Overview"
description: "Introduction to the cc harness and its purpose."
resource: "README.md"
tags: ["playground", "repository", "overview"]
timestamp: "2026-07-15"
---

# Repository Overview

The CC Harness is a structured development environment designed for experimentation and multi-project development with integrated knowledge management.

## Purpose

This repository serves as a development environment where you can work on various projects simultaneously, with each project maintaining its own knowledge base and configuration. The playground uses a centralized knowledge base system for sharing general instructions, environment details, and documentation across all projects.

## Key Features

- **Multi-project support:** Run multiple projects in isolation while sharing common utilities
- **Integrated knowledge management:** Each project and the repository maintains its own OKF-formatted knowledge base
- **Standardized structure:** All projects follow a consistent directory template for easy navigation
- **Shared code location:** Central `/projects/common/` directory for shared utilities
- **Configuration flexibility:** Project-specific and repository-level Claude configurations

## Design Philosophy

The playground emphasizes:
- **Clarity:** Every file and directory serves a clear purpose
- **Modularity:** Projects are self-contained but can share utilities
- **Discoverability:** Knowledge bases guide users to relevant documentation
- **Consistency:** All projects follow the same structural template

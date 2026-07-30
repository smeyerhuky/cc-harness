---




type: "Concept"
title: "Command Line Interface (CLI)"
description: "Core concept from Mastering OpenSCAD"
resource: "Mastering OpenSCAD"
tags: ['automation', 'cli', 'ci-cd']
timestamp: "2026-07-24"
---

# Command Line Interface (CLI)

OpenSCAD can run entirely headless without the GUI, enabling automated workflows.

## Automation and CLI Options
* **Rendering**: You can export STLs directly via CLI: `openscad -o output.stl input.scad`.
* **Parameter Overrides**: Variables can be injected at compile time using the `-D` flag (e.g., `openscad -D "radius=10" -o output.stl input.scad`). This is heavily utilized in CI/CD pipelines to automatically generate part families from a single script.
* **Dependency Tracking**: The CLI can output Makefile dependency lists (`-d`), allowing build systems like `make` to only re-render parts whose underlying libraries have changed.

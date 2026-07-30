---




type: "Concept"
title: "Modules and Large Projects"
description: "Core concept from CodeSolutions / Mastering OpenSCAD"
resource: "CodeSolutions / Mastering OpenSCAD"
tags: ['architecture', 'modules', 'libraries']
timestamp: "2026-07-24"
---

# Modules and Large Projects

As OpenSCAD designs scale from single parts to complex assemblies, architectural organization becomes critical.

## Best Practices
* **Modules**: The `module` keyword encapsulates a block of [geometry](../mathematics/geometry.md). Modules should have clean interfaces, accepting parameters with sensible defaults.
* **Include vs Use**: 
  * `include <file.scad>` imports everything, executing top-level [geometry](../mathematics/geometry.md).
  * `use <file.scad>` imports only module and function definitions, preventing unintended [geometry](../mathematics/geometry.md) instantiation.
* **Designing Big Projects**: Large assemblies should be broken into logical sub-assemblies. Each component should be developed in its own file and aggregated in a master assembly file using `use`.

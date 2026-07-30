---




type: "Concept"
title: "Variables, Loops, and Logic"
description: "Core concept from CodeSolutions / Mastering OpenSCAD"
resource: "CodeSolutions / Mastering OpenSCAD"
tags: ['programming', 'loops', 'logic', 'dynamic']
timestamp: "2026-07-24"
---

# Variables, Loops, and Logic

OpenSCAD acts as a functional programming language. Controlling flow allows for the creation of complex, dynamic structures.

## Core Concepts
* **Variables and Scope**: Variables are evaluated at compile time and are immutable within their scope. Standard practice is to declare all configurable parameters at the top of a file.
* **Loops (`for` and `intersection_for`)**: A `for` loop is typically used to instantiate multiple copies of a [geometry](../mathematics/geometry.md) across a pattern (e.g., circular arrays of holes). 
* **Dynamic Designs with `if`**: Conditional logic (`if` / `else`) allows [geometry](../mathematics/geometry.md) to change based on input parameters. This is essential for configuring different versions of a part (e.g., generating a flange only if `has_flange == true`).
* **List Comprehensions**: Used to dynamically construct arrays of points or vectors, especially useful for generating polygons or polyhedrons computationally.

---





type: "Concept"
title: "Textual 3D Modeling"
description: "Core concept from Programming with OpenSCAD"
resource: "Programming with OpenSCAD"
tags: ['coding', 'csg', 'compilation']
timestamp: "2026-07-24"
---

# Textual 3D Modeling

Unlike traditional interactive CAD systems, textual 3D modeling relies on a functional programming paradigm where [geometry](../mathematics/geometry.md) is defined by code.

## Paradigm and Syntax
* **Declarative Approach**: The designer describes *what* the object is via geometric transformations and booleans (see [constructive geometry](../mathematics/geometry.md)), rather than *how* to draw it step-by-step.
* **Immutability**: Variables are typically evaluated at compile time and remain constant during a given execution scope, reinforcing a functional style.
* **Compilation Pipeline**: The textual code is parsed, a CSG ([Constructive Solid Geometry](../solid-modeling/csg.md)) tree is built, and the tree is evaluated to generate a [boundary representation](../solid-modeling/brep.md) (B-Rep) mesh (often STL) for manufacturing.
* **Version Control**: Because the design is pure text, it inherently benefits from standard software engineering tools like Git for tracking changes and collaborating.

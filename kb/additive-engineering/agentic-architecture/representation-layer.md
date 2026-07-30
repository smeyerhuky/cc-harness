---

type: "Architecture"
title: "The Representation Layer (DSL)"
description: "How agents write procedural code instead of raw geometry data."
resource: "agentic_cad_software_architecture.md"
tags: ["DSL", "python", "abstraction"]
timestamp: "2026-07-24"
---

# The Representation Layer (The Agent's Hands)

LLMs cannot reliably output millions of STL vertices or raw [NURBS](../surface-modeling/nurbs.md) control points. They need an abstraction layer to generate [geometry](../mathematics/geometry.md).

*   **Procedural Code over Raw Data**: The agent must write CAD as code. You need a **Domain Specific Language (DSL)**.
*   **Modern Python Wrappers**: Instead of raw OpenSCAD, agents should output code using modern Python libraries like **CadQuery** or **Build123d**. These allow fluid, human-readable syntax (e.g., `box.faces(">Z").hole(radius=2)`) which the LLM can easily reason about.
*   **AST Manipulation**: When modifying a parameter, the agent should parse the Abstract Syntax Tree (AST) of the script to surgically alter values rather than rewriting the entire file.

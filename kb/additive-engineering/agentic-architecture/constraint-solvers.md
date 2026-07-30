---

type: "Architecture"
title: "Geometric Constraint Solvers"
description: "Algorithms that resolve 2D/3D constraints automatically."
resource: "agentic_cad_software_architecture.md"
tags: ["solvers", "math", "constraints"]
timestamp: "2026-07-24"
---

# Geometric Constraint Solvers (The Logic)

If a user says, *"Draw a circle that is tangent to these two lines and has a radius of 5,"* the agent shouldn't mathematically calculate the coordinates itself. 

*   The agent outputs the *constraints* (Line A, Line B, Circle C, Constraint: Tangent, Tangent, Radius).
*   The solver (such as the open-source solver from **SolveSpace** or **PlanarGC**) calculates the exact mathematical coordinates and returns them to the kernel.

---

type: "Architecture"
title: "Multi-Agent Feedback Loops"
description: "How the agent verifies and fixes its own generated CAD."
resource: "agentic_cad_software_architecture.md"
tags: ["agents", "validation", "FEA"]
timestamp: "2026-07-24"
---

# Multi-Agent Feedback Loops (The Agent's Eyes)

An agent writing a script is working blind. It needs deterministic feedback loops to iteratively self-correct before presenting the CAD to the user.

*   **The Compiler Loop**: If the script fails (e.g., trying to fillet a destroyed edge), the kernel throws an error. A **Debugging Agent** ingests the stack trace and rewrites the code.
*   **The Physics / FEA Loop**: An **Engineering Agent** takes the generated mesh, applies boundary conditions, and runs a headless FEA simulation (via *CalculiX* or *Elmer*). It reads the resulting stress tensor data and iteratively thickens load-bearing ribs if stress exceeds yield strength.
*   **The Manufacturability (DFM) Loop**: A **[Slicer Agent](../agentic-architecture/slicer-agent.md)** parses the mesh for unprintable overhangs (> 50 degrees) or thin walls, rejecting the design and kicking it back with coordinates of the failure points.

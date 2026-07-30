---

type: "Architecture"
title: "UI/UX & Topological Mapping"
description: "Linking user 3D clicks back to the agent's code."
resource: "agentic_cad_software_architecture.md"
tags: ["UI", "UX", "Topological-Naming"]
timestamp: "2026-07-24"
---

# UI/UX: Bi-directional Human-in-the-Loop

A purely text-based agentic CAD will fail because humans are highly visual. 

*   **The Selection Mapping Problem**: The user must be able to look at the 3D viewer (WebGL/Three.js), click a face, and say *"Add a 2mm chamfer here."*
*   **Topological Naming Resolution**: The software needs a robust way to map the clicked 3D face *back* to the specific line of code that generated it. If the agent modifies the code, the internal IDs of faces might change (the infamous "Topological Naming Problem"). You must architect a hashing system that tracks features persistently so the agent knows exactly what the user clicked. We resolve the hardware side of this selection mapping via [WebGPU Picking and Selection](../webgpu-visualizer/picking-and-selection.md).

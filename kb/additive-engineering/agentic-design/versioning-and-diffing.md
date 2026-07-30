---



type: "Concept"
title: "Versioning and Diffing"
description: "Core concept from agentcad Concepts"
resource: "agentcad Concepts"
tags: ['version-control', 'diff', 'iteration']
timestamp: "2026-07-24"
---

# Versioning and Diffing

Generative design by agents requires tracking every iteration to prevent regressions and guide the agent's next prompt.

## A/B Comparison
* **Versioned Outputs**: Every execution of a CAD script should produce a uniquely versioned directory containing the script, the mesh, the STEP file, and the metrics.
* **Parameter Diffing**: When an agent attempts to fix a tolerance issue, the system can diff the parameters (e.g., changing `clearance=0.1` to `clearance=0.2`) and overlay the resulting meshes to confirm the dimensional change.
* **Visual Handoff**: While the agent uses JSON, a synchronized side-by-side or overlay viewer is generated so a human supervisor can quickly approve the A/B changes.

---



type: "Concept"
title: "Geometric Validation"
description: "Core concept from agentcad Concepts"
resource: "agentcad Concepts"
tags: ['validation', 'metrics', 'topology']
timestamp: "2026-07-24"
---

# Geometric Validation

Agents cannot "look" at a 3D model to confirm a hole is the right size. They rely on programmatic introspection.

## Inspection and Measurement
* **Topological Checks**: Scripts must analyze the generated B-Rep ([Boundary Representation](../solid-modeling/brep.md)) to detect invalid [geometry](../mathematics/geometry.md), such as free edges, non-manifold vertices, or unclosed shells.
* **Dimensional Reports**: An agentic pipeline automatically measures face areas, edge lengths, bounding box dimensions, and cylindrical diameters (e.g., verifying a hole is exactly 3.2mm).
* **Spec Comparison**: By feeding a JSON specification checklist into a validation script alongside the generated STEP file, the agent can programmatically verify if the output meets all engineering constraints.

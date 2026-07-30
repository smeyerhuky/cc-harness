---

type: "Architecture"
title: "The Slicer Agent"
description: "Slicer and agentic printing techniques"
resource: "AI-SDLC / Web Synthesis"
tags: ['agent', 'slicer', 'dfm', 'governance']
timestamp: "2026-07-24"
---

# The Slicer Agent

In Agentic CAD, the Slicer Agent acts as the bridge between [Representation Layer](representation-layer.md) (the mesh) and physical reality. 

Under the [Spec-Driven Development](../../ai-sdlc/spec-driven-development.md) governance model, the Agent does not just output a generic STL; it must dynamically configure the slicer profile (via CLI tools like PrusaSlicer-cli or CuraEngine) to match the explicit intent of the Spec.

## Translating Spec to Slicer Profile

1. **Structural Spec -> Robust Profile**
   * If the spec dictates "load-bearing mechanism", the Slicer Agent automatically configures:
     * `perimeters`: 4+
     * `infill_pattern`: Gyroid
     * `infill_density`: 30%
2. **Aesthetic Spec -> Finish Profile**
   * If the spec dictates "display model" or "smooth surface":
     * `top_fill_pattern`: Monotonic
     * `layer_height`: 0.12mm
3. **Rapid Prototype Spec -> Speed Profile**
   * `infill_pattern`: Lightning
   * `layer_height`: 0.28mm (using adaptive layer heights for curves)

## The DFM Feedback Loop
Before generating G-Code, the Slicer Agent performs a Design for Manufacturability (DFM) pass. It searches the sliced layers for overhangs exceeding 50 degrees without support, or walls thinner than the nozzle diameter, and rejects the CAD model back to the geometric generator with specific coordinate failure points.

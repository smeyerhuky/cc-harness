---






type: "Mechanism"
title: "Layered and Additive Manufacturing"
description: "Principles, mechanisms, and constraints of additive manufacturing processes like Fused Deposition Modeling (FDM)."
resource: "Manufacturing Engineering and Technology, 8th ed. by S. Kalpakjian"
tags: ["additive", "3d-printing", "fdm", "cad", "layered-manufacturing"]
timestamp: "2025-05-01"
---

# Layered and Additive Manufacturing (AM)

Additive Manufacturing (AM), commonly known as [3D printing](../applications/3d-printing.md), encompasses processes that build parts layer-by-layer directly from 3D Computer-Aided Design (CAD) models, as opposed to subtractive methods like [Metal Cutting](metal-cutting.md).

## Computer-Aided Design (CAD) & Workflow
1. **Solid Modeling**: A 3D CAD model is created representing the exact [geometry](../mathematics/geometry.md).
2. **Tessellation**: The CAD model is converted into a surface mesh, typically an STL file (Standard Tessellation Language), which approximates the surfaces using triangles. *Constraint: Too coarse a mesh results in faceted, poor-quality surfaces; too fine a mesh creates unnecessarily large files.*
3. **Slicing**: The slicing software divides the STL model into horizontal layers and generates the toolpath (G-code) for the machine head.

## Fused Deposition Modeling (FDM)
FDM is a widespread material extrusion AM process. 

### Mechanism
* A thermoplastic filament (e.g., PLA, ABS, PETG) is fed into a heated extrusion head.
* The polymer is heated to a semi-molten state and extruded through a nozzle onto a build platform.
* The head moves in the X-Y plane to deposit a single layer, then the platform moves down in the Z-axis (or the head moves up) to begin the next layer.
* The newly extruded material fuses with the adjacent material and the layer below it upon cooling.

### Physics & Constraints
* **Anisotropy**: FDM parts are inherently anisotropic. The mechanical strength in the Z-direction (layer-to-layer adhesion) is significantly weaker than in the X-Y plane (continuous filament).
* **Support Structures**: Overhanging geometries beyond a certain angle (typically >45 degrees from vertical) require sacrificial support structures to prevent the extruded filament from drooping. This increases material waste and post-processing time.
* **Resolution and Surface Finish**: The Z-axis resolution is limited by the layer height. This results in the "stair-stepping" effect on curved or angled surfaces. Thinner layers improve resolution but drastically decrease the [Production Rate](../attributes/core-attributes.md).
* **Thermal Warpage**: Like [Injection Molding](injection-molding.md), uneven cooling and polymer shrinkage can cause the part to warp or lift off the build plate (especially with materials like ABS). Heated build plates and enclosed chambers are used to mitigate this.

## Design for Additive Manufacturing (DfAM)
Unlike traditional manufacturing, AM thrives on complexity.
* **Complexity is Free**: Lattices, internal channels, and organic topologies that are impossible to machine or mold can be easily printed without increasing cost.
* **Part Consolidation**: Multiple components of an assembly can be redesigned and printed as a single, complex part, eliminating [Joining & Assembly](joining-assembly.md) steps.

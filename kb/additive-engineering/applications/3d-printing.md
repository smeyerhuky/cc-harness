---





type: "Concept"
title: "3D Printing and Additive Manufacturing"
description: "Core concept from Simplifying 3D Printing with OpenSCAD"
resource: "Simplifying 3D Printing with OpenSCAD"
tags: ['manufacturing', '3d-printing', 'slicing']
timestamp: "2026-07-24"
---

# 3D Printing

3D printing (additive manufacturing) translates digital meshes into physical objects by depositing material layer by layer.

## Process and Constraints
* **Meshing**: Textual models are compiled into tessellated meshes (like STL or 3MF). High polygon counts yield smoother surfaces but increase file size and processing time.
* **Slicing and G-Code**: A slicer program converts the mesh into G-code, which dictates the toolpath, temperatures, and extrusion rates for the printer.
* **Design for Additive Manufacturing (DfAM)**:
  * **Overhangs**: Angles exceeding 45 degrees typically require support structures.
  * **Tolerances**: Clearance must be explicitly designed into functional, moving parts (relying on robust [parameterization](../programming/parameterization.md)).
  * **Orientation**: Parts should be oriented to maximize strength along the Z-axis layer lines and minimize the need for supports.

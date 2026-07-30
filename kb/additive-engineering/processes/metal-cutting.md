---






type: "Mechanism"
title: "Metal Cutting"
description: "Material removal processes using a cutting tool to shear away material in the form of chips."
resource: "Manufacturing Engineering and Technology, 8th ed. by S. Kalpakjian"
tags: ["machining", "subtractive", "metal"]
timestamp: "2025-05-01"
---

# Metal Cutting (Machining)

Metal cutting encompasses turning, milling, and drilling. It is a subtractive process used to achieve high dimensional accuracy and complex geometries.

## Physics of Chip Formation
* **Shear Zone**: Material is removed by localized shear deformation ahead of the cutting tool.
* **Cutting Forces**: The force required depends on the material's shear strength, the feed rate, depth of cut, and the tool rake angle.
* **Heat Generation**: Most of the mechanical energy is converted to heat in the primary shear zone and at the tool-chip interface. High temperatures accelerate tool wear.
* **Tool Wear**: Tools fail by flank wear (abrasion) or crater wear (chemical diffusion/adhesion). Taylor's tool life equation describes the relationship between cutting speed ($V$) and tool life ($T$): $V T^n = C$.

## Constraints & Rules of Thumb
* **Specific Energy**: The energy required to remove a unit volume of material ($u$) is a material constant used to estimate cutting power ($P = u \cdot MRR$, where $MRR$ is the Material Removal Rate).
* **Chatter**: Self-excited vibration (chatter) leads to poor surface finish and tool breakage. It is mitigated by maximizing system [stiffness](../analysis/stiffness.md) and selecting appropriate spindle speeds.
* **Coolant**: Cutting fluids are critical for cooling the tool and workpiece, and for flushing chips away.

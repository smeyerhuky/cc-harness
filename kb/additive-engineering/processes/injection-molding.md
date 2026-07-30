---






type: "Mechanism"
title: "Injection Molding"
description: "Process of injecting molten polymer into a mold cavity to form a part."
resource: "Manufacturing Engineering and Technology, 8th ed. by S. Kalpakjian"
tags: ["polymer", "molding", "injection"]
timestamp: "2025-05-01"
---

# Injection Molding

Injection molding is a highly automated process for manufacturing polymer parts at high volumes.

## Mechanism
1. **Plastication**: Thermoplastic pellets are melted by a rotating screw in a heated barrel.
2. **Injection**: The screw translates forward, acting as a ram to inject the melt into a closed mold cavity under high pressure.
3. **Packing**: Pressure is maintained to compensate for volumetric shrinkage as the polymer cools.
4. **Cooling**: Heat is extracted through mold cooling channels until the part is rigid enough to eject.
5. **Ejection**: The mold opens, and ejector pins push the part out.

## Physics & Constraints
* **Cooling Time**: The cycle time is dominated by the cooling phase, which scales with the square of the part thickness ($t^2$). 
* **Shrinkage & Warpage**: Semi-crystalline polymers shrink more than amorphous ones. Differential cooling leads to residual stresses and warpage.
* **Draft Angle**: Parts require a draft angle (typically 1-2 degrees) on vertical walls to allow ejection without damage.
* **Uniform Wall Thickness**: Designs must maintain uniform wall thickness to prevent sink marks and uneven shrinkage.

**Rule of Thumb**: Minimize wall thickness to reduce cooling time and material cost, using ribs for structural [stiffness](../analysis/stiffness.md) instead of thicker walls.

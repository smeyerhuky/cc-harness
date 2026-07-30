---






type: "Mechanism"
title: "Flexures"
description: "Compliant mechanisms used for high-precision, limited-range motion."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["flexures", "precision-engineering", "compliance", "hysteresis"]
timestamp: "2026-07-24"
---

# Flexures (Compliant Mechanisms)

Flexures provide motion through the elastic deformation of members rather than sliding/rolling joints. They are heavily used in nano/meso-scale precision machines.

## Advantages & Disadvantages
**Advantages:**
- Smooth, fine motion (Angstrom resolution possible).
- No backlash, no friction, no wear.
- Highly predictable linear/elastic operation.

**Disadvantages:**
- Limited motion/stroke (usually <10% of device size).
- Sensitive to manufacturing tolerances ($\delta_{thickness}$ drastically affects [stiffness](../analysis/stiffness.md) since $k \propto h^3$).
- Susceptible to axial or transverse buckling.

## Repeatability vs. Accuracy
Flexures can exhibit Angstrom-level repeatability if:
- They use low hysteresis materials (single crystals).
- Operating stresses remain well below yield ($\sigma \ll \sigma_{yield}$).
- There is no micro-slip at the assembly interfaces.

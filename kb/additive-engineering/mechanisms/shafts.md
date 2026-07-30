---






type: "Mechanism"
title: "Shafts"
description: "Design and manufacturing considerations for rotating shafts."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["shafts", "manufacturing", "tolerances", "stiffness"]
timestamp: "2026-07-24"
---

# Shaft Design and Manufacturing

Shafts transmit torque and support rotating components. Their design is often constrained by **deflection** rather than stress, requiring careful analysis of [Stiffness](../analysis/stiffness.md).

## Manufacturing (Lathe Turning)
The accuracy and repeatability of a shaft manufactured on a lathe depend on:
- **Thermal errors** (systematic).
- **Part deflection** during cutting (the tool force pushes the cantilevered shaft away).
- Machine slop/vibration (non-systematic).

To account for cantilever deflection during turning, multiple plunge cuts should be measured to characterize the compliance error.

## [Geometry](../mathematics/geometry.md) Rules
- Square cross section [stiffness](../analysis/stiffness.md) is proportional to $b \cdot h^3$.
- Circular cross section [stiffness](../analysis/stiffness.md) is governed by the moment of inertia $I = \frac{\pi}{64}(d_{outer}^4 - d_{inner}^4)$.

---






type: "Model"
title: "Fatigue"
description: "Failure of materials under cyclic loading."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["fatigue", "endurance-limit", "failure"]
timestamp: "2026-07-24"
---

# Fatigue

Fatigue failure occurs under cyclic loading at stress levels well below the ultimate tensile strength (and often below the yield strength). It is insidious because it gives little visible warning before catastrophic failure.

## Crack Origins
- **Inherent:** Casting imperfections, grain boundaries, coalescing dislocations.
- **Fabrication:** Tool marks, stress concentrations, Heat Affected Zones (HAZ) from welding.
- **Use:** Scratches, unintended high-stress events.

## The Endurance Limit ($S_e$)
Ferrous materials (steel, iron) exhibit an endurance limit—a stress level below which the material has infinite life (typically $> 10^6$ cycles).
- Ideal endurance limit: $S'_e \approx 0.5 S_{ut}$ (for $S_{ut} < 200$ kpsi).

Non-ferrous materials (like aluminum) **do not** have a true endurance limit; they will eventually fail regardless of how low the stress is if cycled enough times.

## Modifying Factors
The real-world endurance limit is reduced from the ideal by multiple factors:
$S_e = (k_a k_b k_c k_d k_e k_f) S'_e$
Where factors account for surface finish ($k_a$), size ($k_b$), load type ($k_c$), temperature ($k_d$), and reliability ($k_e$).

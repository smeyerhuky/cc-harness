---

type: "Concept"
title: "Non-Newtonian Melts & Die Swell"
description: "Viscoelastic behavior of polymers under shear stress."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["rheology", "fluids", "extrusion"]
timestamp: "2026-07-24"
---

# Non-Newtonian Melts & Die Swell (Barus Effect)

Polymers in a hotend are viscoelastic. Their apparent viscosity ($\eta$) drops under shear stress, modeled by the Power-Law fluid equation:
$\eta = K \gamma^{n-1}$ (where $n < 1$ for shear-thinning plastics).

**Die Swell**: Inside the nozzle, long polymer chains are stretched. Upon exiting the nozzle, the shear stress drops to zero, and the chains act like elastic springs, recoiling and causing the extruded filament to swell radially to a diameter larger than the nozzle orifice.

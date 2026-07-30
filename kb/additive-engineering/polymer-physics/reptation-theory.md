---

type: "Theory"
title: "Reptation Theory"
description: "The physics of polymer chains slithering across layers to create strong welds."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["physics", "polymers", "adhesion"]
timestamp: "2026-07-24"
---

# Reptation Theory (de Gennes)

The strength of the Z-axis in FDM depends on polymer chains diffusing across the boundary between two printed layers.

*   Polymer chains are confined in a "tube" created by neighboring chains. They can only move by slithering like a snake (reptation).
*   **Reptation Time ($\tau_d$)**: The time required for a chain to completely slither out of its original tube is proportional to its molecular weight cubed.
*   *The Printing Constraint*: The interface temperature must remain above the Glass Transition Temperature ($T_g$) long enough for entanglement to occur. If the layer cools too fast, the chains cannot entangle, leading to brittle delamination.

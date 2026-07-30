---

type: "Concept"
title: "Transient Heat Equations & Residual Stress"
description: "How thermal gradients induce warping and delamination."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["thermodynamics", "stress", "warping"]
timestamp: "2026-07-24"
---

# Transient Heat Equations & Residual Stress

When a molten track (200C) is laid onto a cooler layer (60C), massive thermal gradients are established.

*   The cooling is governed by the Fourier heat conduction equation.
*   As the new layer cools and shrinks, it is constrained by the solid layer beneath it, generating thermal strain: $\epsilon^{th} = \alpha \Delta T$.
*   This strain integrates across the part to form a powerful Residual Stress Tensor ($\sigma_{ij}$), which applies a bending moment to the part. When this moment overcomes bed adhesion, the part warps (curls) off the bed.

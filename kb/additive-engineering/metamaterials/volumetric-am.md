---

type: "Technology"
title: "Volumetric Additive Manufacturing (VAM)"
description: "Curing 3D objects instantly using tomographic 2D projections."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["manufacturing", "resin", "radon-transform"]
timestamp: "2026-07-24"
---

# Volumetric Additive Manufacturing (Tomographic AM)

Instead of slicing a model into 2D layers, VAM cures the entire 3D object at once.

A vat of photo-curable resin rotates. A light engine projects 2D patterns from multiple angles.

**The Radon Transform & Beer-Lambert Law**: The mathematics are the inverse of a CT scan. The algorithm calculates the necessary 2D light projections such that the cumulative light energy (dose) inside the 3D volume surpasses the polymerization threshold *only* at the coordinates defining the solid object, leaving the surrounding resin liquid. The part materializes instantly.

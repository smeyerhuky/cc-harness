---






type: "Concept"
title: "Elementary Features"
description: "Core 3D operations for generating and modifying primitive volumes."
resource: "https://ocw.mit.edu/courses/res-16-002-how-to-cad-almost-anything-january-iap-2024/"
tags: ["cad", "features", "extrude", "fillet"]
timestamp: "2024-01-01"
---

Once a 2D profile is fully defined (see [Sketches and Constraints](sketches_and_constraints.md)), it is converted into 3D [geometry](../mathematics/geometry.md) using feature commands.

The most fundamental operations include:
- **Extrude Boss/Base:** Projects a 2D sketch linearly to create a 3D volume.
- **Extrude Cut:** Removes material by projecting a 2D sketch through an existing volume.
- **Fillet / Chamfer:** Modifies sharp edges by rounding (fillet) or beveling (chamfer) them. This is crucial for manufacturability, stress reduction, and aesthetics.

The order in which these features are applied in the CAD software's history tree determines the final [geometry](../mathematics/geometry.md) and structural stability of the model.

---






type: "Concept"
title: "Patterns and Symmetry"
description: "Leveraging repetition and symmetry to simplify CAD design."
resource: "https://ocw.mit.edu/courses/res-16-002-how-to-cad-almost-anything-january-iap-2024/"
tags: ["cad", "patterns", "revolve", "mirror"]
timestamp: "2024-01-01"
---

Exploiting the mathematical symmetry of an object is critical for efficient modeling. Instead of manually drafting repetitive [geometry](../mathematics/geometry.md), CAD software automates these processes:

- **Revolve:** Creates a solid by spinning a 2D profile around an axis of revolution. This is the optimal command for any [geometry](../mathematics/geometry.md) exhibiting rotational symmetry (e.g., cones, cups, tires).
- **Mirroring:** Duplicates [geometry](../mathematics/geometry.md) across a plane of symmetry. This can be done at the sketch level (mirroring 2D lines) or the feature level (mirroring an entire 3D body).
- **Linear & Circular Patterns:** Propagates a specific feature or body along an axis or around a center point (e.g., gear teeth, honeycomb structures, repeating screw holes).

Applying these commands reduces computation load, decreases file size, and ensures perfect geometric precision.

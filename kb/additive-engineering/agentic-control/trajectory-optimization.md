---

type: "Algorithm"
title: "Trajectory Optimization"
description: "S-Curve velocity profiles to limit jerk and snap."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["kinematics", "motion", "algorithms"]
timestamp: "2026-07-24"
---

# Trajectory Optimization (S-Curves)

Standard trapezoidal motion profiles (constant acceleration) result in infinite *Jerk* (the derivative of acceleration), which violently shakes the printer, causing mechanical ringing.

*   **S-Curve Velocity**: The controller limits Jerk (and often *Snap*).
*   Position ($x$) is a 4th or 5th-order polynomial with respect to time. The velocity profile looks like a smooth "S" rather than a sharp trapezoid. This keeps the frequency of the motion forces below the natural resonant frequency of the machine's frame.

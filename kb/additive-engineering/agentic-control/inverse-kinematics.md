---

type: "Algorithm"
title: "Inverse Kinematics & Singularities"
description: "Solving joint angles and avoiding mathematical lockups in robotics."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["robotics", "math", "jacobian"]
timestamp: "2026-07-24"
---

# Inverse Kinematics & Jacobian Singularities

In non-planar 5-axis AM or robotic arm extrusion, mapping desired Cartesian nozzle coordinates to motor joint angles requires Inverse Kinematics.

*   The relationship between joint velocities and end-effector velocities is governed by the Jacobian matrix ($J$).
*   **Singularity**: A physical configuration where the determinant of the Jacobian approaches zero. At a singularity, a small Cartesian move requires infinite joint velocity to execute, causing the robot to violently crash or lock up. Path planners must mathematically map and avoid these regions.

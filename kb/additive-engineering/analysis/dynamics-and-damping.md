---






type: "Model"
title: "Dynamics and Damping"
description: "Vibrations, resonance, and 2nd order system responses."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["dynamics", "damping", "resonance", "vibrations"]
timestamp: "2026-07-24"
---

# Dynamics and Damping

Mechanical structures act as 2nd order systems ($m \ddot{x} + c \dot{x} + k x = F$). Understanding vibrations is critical for precision machines to avoid location errors and [fatigue](../analysis/fatigue.md).

## Frequency Response Regimes
1. **Low Frequency ($\omega \ll \omega_n$):** 
   - System behaves like a spring ($x \approx F/k$).
   - High disturbance rejection, tracks commands well.
2. **Resonance ($\omega \approx \omega_n$):**
   - System response is heavily amplified by the **Quality Factor (Q)**.
   - $Q = \frac{1}{2\zeta}$.
   - Small disturbances cause massive oscillations.
3. **High Frequency ($\omega \gg \omega_n$):**
   - System behaves like a mass ($x \approx F / m\omega^2$).
   - Response is lower than command.

## Attenuating Vibrations
To fix vibrational issues, designers can:
- **Change Mass or [Stiffness](../analysis/stiffness.md) ($m, k$):** Shifts the natural frequency $\omega_n$ away from the disturbance frequency.
- **Increase Damping ($c$):** Lowers the peak gain $Q$ at resonance. Strategies include adding viscoelastic materials, viscous air/fluid gaps (Couette flow damping), or active electromagnetic damping.

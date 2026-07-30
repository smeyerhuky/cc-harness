---






type: "Mechanism"
title: "Clutches and Brakes"
description: "Modeling torque capacity and wear in disc clutches and brakes."
resource: "https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/"
tags: ["clutches", "brakes", "wear", "torque"]
timestamp: "2026-07-24"
---

# Clutches and Brakes

Brakes and clutches rely on friction to transfer torque or dissipate energy. The two fundamental modeling regimes for disc-type devices are **Uniform Wear** and **Uniform Pressure**.

## Uniform Pressure
- Assumes the pressure $p$ across the friction surface is constant.
- Usually valid only for **new** clutches before wear has altered the [geometry](../mathematics/geometry.md).
- Tends to overestimate the torque capacity.

## Uniform Wear
- Wear is proportional to frictional work: $w = K_p (v \cdot t)$.
- Because velocity $v = \omega \cdot r$ increases with radius, the outer edges wear faster initially.
- Over time, the pressure redistributes such that $p \cdot r = \text{constant}$.
- This is the standard assumption for the longevity and steady-state performance of a clutch/brake.

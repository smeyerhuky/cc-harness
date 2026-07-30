---

type: "Concept"
title: "Model Predictive Control (MPC)"
description: "Proactive thermal regulation using state-space models."
resource: "cad_3d_printing_domain_dictionary.md"
tags: ["control-theory", "thermal", "pid"]
timestamp: "2026-07-24"
---

# Model Predictive Control (MPC)

Standard PID temperature control is purely reactive. MPC uses a state-space mathematical model of the hotend:
$\dot{x}(t) = Ax(t) + Bu(t)$ (where $x$ is temperature state, $u$ is heater power).

MPC solves an optimization problem at every time step to find the optimal sequence of heater power $u(t)$ over a future time horizon, predicting the temperature drop from an upcoming fast extrusion move and pre-heating the nozzle *before* the error occurs.

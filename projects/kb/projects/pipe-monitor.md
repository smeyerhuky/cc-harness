---
type: "Reference"
title: "Acoustic Pipe Monitor"
description: "Full-stack scaffold for a single-installation acoustic water-fixture disaggregation and leak-detection system: ESP32-S3 node, FastAPI server, React frontend, 3D-printable hybrid enclosure."
resource: "../../pipe-monitor/README.md"
tags: ["acoustics", "esp32", "cad", "firmware", "leak-detection", "scaffold"]
timestamp: "2026-08-24"
---

# Acoustic Pipe Monitor

A four-component scaffold for sensing structure-borne acoustics on a residential water main and
inferring fixture-level water use and leaks. Fit to **one** plumbing network — overfitting is the
goal, not a hazard.

## Status

**Scaffold / pre-Phase-0.** Architecturally faithful to the source deep-wiki spec; compiles/runs
where the toolchain allows. **Not a validated system** — the design is gated on Phase 0 physics
validation with real hardware, and the learned inference components are honest stubs until real
data exists.

## Directory map

```
projects/pipe-monitor/
├── cad/          parametric OpenSCAD — hybrid printed enclosure + pipe clamp (28.6 mm OD)
├── firmware/     ESP-IDF C — dumb sensor node (features, edge detection, MQTT/HTTP, chirp)
├── server/       FastAPI + Postgres — ingest, storage, training, inference stubs
├── frontend/     React + Vite — calibration wizard, live monitor, drift dashboard
├── kb/           project OKF KB — overview, decisions, plan
├── CLAUDE.md · README.md · version.json
```

## Hardware target

1″ copper main (**28.6 mm OD**); ESP32-S3-DevKitC-1-N16R8; PCM1808 at 96 kHz slave mode;
**hybrid** 3D-printed enclosure with copper-lined amp region (substituting for the spec's die-cast
aluminium, preserving the shielding intent).

## Key divergences from the source spec

- **Hybrid enclosure** instead of die-cast aluminium — see the project's `kb/decisions/`.
- **Stubbed inference** — plumbing and anti-leakage hygiene are real; trained weights are not,
  pending Phase 0 data.

## Entry points

- Project overview + quick start: [`pipe-monitor/README.md`](../../pipe-monitor/README.md)
- Project rules: [`pipe-monitor/CLAUDE.md`](../../pipe-monitor/CLAUDE.md)
- Project KB: [`pipe-monitor/kb/index.md`](../../pipe-monitor/kb/index.md)
- Phase 0 bring-up: [`pipe-monitor/kb/plan/phase-0-bringup.md`](../../pipe-monitor/kb/plan/phase-0-bringup.md)

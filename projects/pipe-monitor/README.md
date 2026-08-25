# Acoustic Pipe Monitor

A **single fixed residential installation** that senses structure-borne acoustics on a water
main and infers fixture-level water use and leaks. One sensor node (ESP32-S3), one LAN server,
one browser frontend.

This directory is a **full-stack scaffold** generated from the
[`pipe-monitor` deep-wiki spec](kb/overview/spec-source.md). It is architecturally faithful and
compiles/runs where the toolchain allows, but it is **not a validated system** — the design is
gated on Phase 0 physics validation with real hardware on your actual plumbing. See
[`kb/plan/phase-0-bringup.md`](kb/plan/phase-0-bringup.md).

## What's here

| Dir | Component | State |
|---|---|---|
| [`cad/`](cad/) | Parametric OpenSCAD hybrid enclosure + pipe clamp (1″ copper, 28.6 mm OD) | Renders to STL/3MF; printable |
| [`firmware/`](firmware/) | ESP-IDF sensor-node firmware (feature stream, edge detector, MQTT/HTTP, chirp) | Compiles on ESP-IDF 5.x; params are Phase-0 placeholders |
| [`server/`](server/) | FastAPI + Postgres: ingest, storage, training pipeline, inference stubs | Runs; inference is stubbed until real data exists |
| [`frontend/`](frontend/) | React + Vite calibration wizard, live monitor, drift dashboard | Builds; talks to the server API |
| [`kb/`](kb/) | Project knowledge base — design, decisions, plan | — |

## Hardware target (this scaffold's assumptions)

- **Pipe:** 1″ nominal copper, **28.6 mm OD** — the clamp saddle radius is cut for this.
- **Enclosure:** **hybrid** — 3D-printed shell with copper-tape/paint lining over the amplifier
  region and a single-point ground boss, preserving the spec's `[HARD]` shielding intent
  without a die-cast box. See [`kb/decisions/enclosure-hybrid.md`](kb/decisions/enclosure-hybrid.md).
- **MCU:** ESP32-S3-DevKitC-1-**N16R8** (16 MB flash, 8 MB PSRAM) — PSRAM is `[HARD]` for the
  ring buffer.
- **ADC:** PCM1808 breakout in **slave mode** at 96 kHz.

## Quick start

Each component has its own README:

- [`cad/README.md`](cad/README.md) — render and print the enclosure/clamp
- [`firmware/README.md`](firmware/README.md) — flash the node
- [`server/README.md`](server/README.md) — bring up Postgres + broker + API
- [`frontend/README.md`](frontend/README.md) — run the wizard/monitor

## The three rules this scaffold refuses to break

Carried verbatim from the spec's working notes, because they are the load-bearing constraints:

1. **Phase 0 is a gate.** Prove fixture signatures are visually separable at your sensor
   position before building the pipeline. The firmware's `start_raw` + the server's spectrogram
   endpoint exist to produce that evidence.
2. **Session holdout is mandatory.** `holdout_session_id` is a **required** parameter on the
   train endpoint; the retention job **pins calibration-session features** so the holdout set
   cannot silently roll off at 90 days.
3. **No per-frame classifier.** Inference is a two-path (transient + steady-state) design
   feeding an explicit state machine.

See [`kb/decisions/`](kb/decisions/) for where the scaffold diverges from the spec and why.

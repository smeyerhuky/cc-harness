---
type: "Playbook"
title: "Phase plan"
description: "The six gated phases from the source spec, mapped to what this scaffold provides for each."
resource: "../../README.md"
tags: ["planning", "phases", "gates"]
timestamp: "2026-08-24"
---

# Phase plan

Each phase has a hard exit gate. Do not proceed past a failed gate — replan. This scaffold puts
code/CAD in place for every phase, but **only Phase 0–1 can be exercised without training data**.

| Phase | Goal | Exit gate | Scaffold provides |
|---|---|---|---|
| **0** `[GATE]` | Physics validation | Human can separate fixtures in spectrograms; ρ>0.8 within-fixture; hum ≥20 dB down; A1–A3 | Front-end schematic + CAD to build the sensor; `start_raw` firmware; server spectrogram endpoint; CV sanity check |
| **1** | Data infrastructure | 3 calibration sessions across 3 weeks; coverage ≥90% | Feature stream, event/clip upload, server ingest+storage, **calibration wizard** |
| **2** | Transient classification | AC1 (≥90% holdout), AC2 (gap ≤8) | `templates.py`, training pipeline with dual metrics + activation gate |
| **3** | State tracking + overlap | AC3 (F1≥0.85), AC4 (≤3 s p95) | `nmf.py` (multi-label), `state_machine.py`, `augment.py`, live monitor |
| **4** | Active sensing | AC5 (leak <30 min), AC7 (drift ≥95%/night) | Chirp firmware, `leak.py`, `drift.py`, exciter CAD mount |
| **5** | Soak + hardening | AC6 (≤1 false alert/30 d over 90 d), success def | Alert tuning UI, OTA, retention |

## Where the scaffold sits today

**Pre-Phase-0.** The scaffold is architecturally complete and compiles/runs where the toolchain
allows, but no hardware has been built and no data recorded. The immediate next step is not more
code — it is the [Phase 0 bring-up](phase-0-bringup.md): breadboard the front end, mount the
sensor, and produce the spectrogram plots that decide whether the whole approach is viable at your
sensor position.

## The trap

Phase 0 produces **no code**, which makes it the phase most likely to be skipped. The deliverable
is the spectrogram plots and the cross-correlation numbers. Do not skip to Phase 2 because the
server is ready — a ready server trained on a bad Phase 0 is the worst outcome.

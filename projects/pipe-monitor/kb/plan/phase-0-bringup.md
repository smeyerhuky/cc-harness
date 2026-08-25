---
type: "Playbook"
title: "Phase 0 bring-up checklist"
description: "Concrete steps to turn this scaffold into the Phase 0 physics-validation evidence, using the firmware start_raw mode and the server spectrogram tools."
resource: "../../firmware/README.md"
tags: ["phase-0", "bring-up", "checklist"]
timestamp: "2026-08-24"
---

# Phase 0 bring-up checklist

The goal of Phase 0 is a **decision, not a build**: can a human visually separate fixtures in a
spectrogram at your sensor position on your 1″ copper main? Everything downstream is optionality
that only unlocks if this passes.

## Bill of materials (Phase 0 subset)

From the source spec BOM, the minimum to answer the question:

- ESP32-S3-DevKitC-1-**N16R8**
- PCM1808 breakout (reconfigure to **slave mode** — see BOM caveat)
- OPA1642 (JFET) + charge-amp passives (C_f 1 nF C0G, R_f 100 MΩ, BAT54S clamp)
- 27 mm brass piezo disc (buy 10 — cheap and easy to damage)
- Kapton tape + silicone grease + stainless hose clamp (for 28.6 mm OD) + compliant pad + foam
- Printed clamp/mount from `cad/` (enclosure shielding not yet critical for the plot, but mount
  stability is)

## Steps

1. **Build the front end** on a breadboard. Do **not** use the ESP32 internal ADC as a shortcut —
   at ~9 ENOB it will not tell you whether the analog chain works, and a bad Phase 0 from a bad
   converter is the worst possible outcome.
2. **Isolate at build time.** Kapton between piezo brass and pipe, grease both faces, single-point
   ground, shield grounded at amp end only. Retrofitting isolation means re-mounting means
   re-calibrating.
3. **Flash the firmware** (`firmware/`) and confirm the feature stream and heartbeat arrive at the
   server.
4. **Record 10 open/close cycles for each of 5 diverse fixtures.** Use the calibration wizard, or
   `capture_clip` / `start_raw` directly.
5. **Plot spectrograms.** `server/tools/plot_spectrograms.py` renders per-fixture panels from the
   stored clips/features.
6. **Run the numeric checks** (`server/tools/phase0_check.py`):
   - Within-fixture valve-closure cross-correlation **ρ > 0.8**.
   - Mains-hum band energy **≥20 dB below** flow-noise band energy.
   - CV sanity: most bins should have **high** coefficient of variation. If most bins come back
     low-CV, the sensor is not seeing the fixtures — a Phase 0 failure found numerically.

## Exit gate

All of: humans can separate fixtures by eye; ρ>0.8 within-fixture; hum ≥20 dB down; assumptions
A1–A3 confirmed.

## If it fails

Do not proceed on optimism. In order: reposition the sensor (metallic run, ≥300 mm from
elbows/valves, downstream of the meter); improve mounting/isolation; then **pivot to the
[pressure-sensing alternative](../decisions/enclosure-hybrid.md)** — a 0–100 psi transducer on a
hose bib, which the spec rates as the strongest single-point method and which is immune to the
coupling drift that threatens the acoustic build. The server's transient path is modality-agnostic
enough that a pressure pivot reuses most of the pipeline.

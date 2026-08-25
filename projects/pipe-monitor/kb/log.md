# Changelog

## 2026-08-25

* **Creation**: Full-stack scaffold generated from the `pipe-monitor` deep-wiki spec, for a 1″
  copper main (28.6 mm OD) with a hybrid printed enclosure.
* **CAD** (`cad/`): parametric OpenSCAD — sensor saddle, exciter saddle, hybrid enclosure body +
  lid. All four parts verified watertight, single-body, winding-consistent; lid register clearance
  0.30 mm/side; verifier green. STL + 3MF + renders exported.
  - Iteration: additive band ridges replaced subtractive grooves (grooves severed the thin saddle
    legs); ground boss reworked to overlap the floor slab (coincident-face touch read as a
    separate CGAL volume).
* **Firmware** (`firmware/`): ESP-IDF 5.x sensor node. Portable modules (protocol, DSP quantizer,
  edge detector, ring buffer, chirp generator) unit-tested on host — 34 checks pass. Device
  modules (I2S, MQTT, HTTP, timesync, commands) written to the ESP-IDF 5.x API.
  - Iteration: edge detector gained baseline seeding + warm-up (uninitialized LTE fired a spurious
    startup edge).
  - Divergence recorded: ESP32-S3 has no DAC; the Phase-4 exciter needs an external I2S DAC / PDM
    stage. Sweep synthesis is done and tested; the output binding is the integration point.
* **Server** (`server/`): FastAPI + Postgres. Core logic (proto parser, state machine, features,
  augmentation hygiene, retention pinning, holdout/activation guards) is real and unit-tested —
  19 pytest cases including a **cross-language proto roundtrip** against the actual firmware
  serializer. `schema.sql` applies cleanly on Postgres 16 (11 tables). Learned inference is honest
  stubs pending Phase-0 data.
* **Frontend** (`frontend/`): React + Vite (TS strict). Calibration wizard, live monitor, drift
  dashboard. Builds clean; screenshot-verified in headless Chromium.
* **Docs**: project `CLAUDE.md`, `README.md`, per-component READMEs, `kb/` (overview, decisions,
  plan incl. Phase-0 bring-up checklist), and DESIGN_REPORT for the CAD. Registered in
  `projects/kb/` and the root trees.

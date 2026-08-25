---
type: "Concept"
title: "System overview"
description: "The three-tier architecture of the pipe monitor scaffold and what each component in this project directory does."
resource: "../../README.md"
tags: ["architecture", "overview"]
timestamp: "2026-08-24"
---

# System overview

```
  ┌─────────────────────────────────────────────┐
  │ Sensor node (ESP32-S3)  — firmware/          │
  │  piezo → charge amp → AAF → PCM1808 → I2S    │
  │  exciter piezo ← amp ← DAC                    │
  │  features / events / clips ─────────────┐    │
  └─────────────────────────────────────────┼────┘
                                            │ WiFi (MQTT + HTTP)
  ┌─────────────────────────────────────────▼────┐
  │ Server (LAN)  — server/                       │
  │  MQTT ingest · store · infer · train          │
  └─────────────────────────────────────────┬────┘
                                            │ HTTP/WS
  ┌─────────────────────────────────────────▼────┐
  │ Frontend (browser)  — frontend/               │
  │  calibration wizard · live monitor · alerts   │
  └───────────────────────────────────────────────┘

  Enclosure + clamp — cad/ (holds the node on the pipe)
```

## Component responsibilities

| Component | Owns | Never does |
|---|---|---|
| **firmware/** (node) | Acquire, decimate, cheap features, edge detection, buffering, upload | Classification, thresholding decisions (server-configurable) |
| **server/** | All inference, all training, all state, storage | — (single source of truth) |
| **frontend/** | Calibration orchestration, observability | Business logic |
| **cad/** | Mechanical mounting + hybrid EMI shield | — |

## Data paths

- **Continuous features** — MQTT `pipe/{id}/features`, binary batch (~1 Hz batches of 16 frames,
  257 int8 bins + `scale_db` + `ultrasonic_rms` per frame).
- **Events** — MQTT `pipe/{id}/events`, JSON, QoS 1, no fixture attribution.
- **Clips** — HTTP POST FLAC to `/api/v1/nodes/{id}/clips` (not MQTT — clips would stall the
  feature stream).
- **Commands** — MQTT `pipe/{id}/cmd`, JSON, QoS 1, not retained.

See the source spec's `protocol/` files for byte-exact schemas; the scaffold implements them in
`firmware/main/proto.*` and `server/app/proto.py`.

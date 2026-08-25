---
type: "Reference"
title: "Placeholder parameters"
description: "Values in the scaffold that are Phase-0/Phase-4 defaults to be tuned empirically, not final design constants."
resource: "../../server"
tags: ["parameters", "tuning", "divergence"]
timestamp: "2026-08-24"
---

# Placeholder parameters

These are set to spec-recommended defaults so the system runs, but the spec explicitly says they
are **tuned empirically against real conditions**. Do not treat them as final.

| Parameter | Placeholder | Tuned in | Source-spec note |
|---|---|---|---|
| `θ_open` / `θ_close` (edge STE/LTE) | 6.0 / 2.0 | Phase 1–2 | Server-configurable; do not hardcode in firmware |
| Leak band limits | 50–700 Hz | Phase 4 | Server-configurable; sweep against an induced leak |
| Leak trigger margin / persistence | +3 dB / 3 nights | Phase 4 (AC6) | Main false-alarm defence |
| CV pruning cutoff | keep CV > 5% | Phase 2 | Also a Phase 0 sanity check (low CV ⇒ sensor not seeing fixtures) |
| Moving-average windows | M=5 (freq), N=8 (time) | Phase 2 | M≥15 erases features; N>16 adds latency |
| NMF activation threshold | 0.5 | Phase 3 | Multi-label >0.5 per published work |
| State-machine hysteresis | 60 s (20 s after abstention) | Phase 3 | Equivalent of published median filtering |
| AC2 activation-gate gap | 8 points | Phase 2 | Override allowed but logged |
| Chirp sweep | exp 100 Hz–20 kHz, 2 s, ×8 | Phase 4 | Exponential separates distortion |

## Ultrasonic band

The 35–45 kHz path is **instrumented but unproven** (`ultrasonic_rms` in every feature frame). The
scaffold records it and never gates on it. Per the corrected spec, do not build the leak detector
around it; evaluate against an induced leak in Phase 4 and drop it if it carries nothing.

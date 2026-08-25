# Firmware — Acoustic Pipe Monitor sensor node

ESP-IDF 5.x firmware for the **deliberately dumb** sensor node. It acquires audio, computes the
continuous log-power spectrogram, detects edges, buffers raw audio, and uploads — and does **no
classification**. Everything discretionary (featurization, thresholds, attribution) lives on the
server, so it can change without a reflash.

Target: **ESP32-S3-DevKitC-1-N16R8** (16 MB flash, 8 MB PSRAM). PSRAM is `[HARD]` — the 30 s ring
buffer will not fit without it.

## Module map

| File | Role | Tested |
|---|---|---|
| `node_config.h` | All compile-time constants; `[HARD]`/`[SOFT]` markers preserved | — |
| `proto.[ch]` | Feature-batch binary + event JSON, byte-exact to the server | ✅ host |
| `feature_stream.[ch]` | 257-bin log-power spectrogram; esp-dsp FFT (device) + pure int8 quantizer | ✅ host (quantizer) |
| `edge_detect.[ch]` | STE/LTE energy-ratio detector with baseline warm-up | ✅ host |
| `ring_buffer.[ch]` | 30 s PSRAM circular buffer, 10 s pre-roll extraction | ✅ host |
| `i2s_capture.[ch]` | PCM1808 @96 kHz slave, ÷6 decimation, ultrasonic bandpass | device |
| `net_mqtt.[ch]` | esp-mqtt: features/events/status pub, cmd sub (spec QoS) | device |
| `clip_upload.[ch]` | HTTP POST WAV clip (not MQTT — `[HARD]`) | device |
| `chirp.[ch]` | Exp-sweep generator (pure) + Phase-4 output binding | ✅ host (generator) |
| `timesync.[ch]` | SNTP UTC + monotonic µs (`[HARD]` both) | — |
| `commands.[ch]` | cmd dispatch: set_threshold/start_raw/…/reboot | device |
| `app_main.c` | Wires capture → features/edges → MQTT/HTTP, heartbeat, clips | device |

## Host unit tests (no ESP-IDF needed)

The portable modules (protocol, DSP quantization, edge detector, ring buffer) are unit-tested on
the host so the byte-exact wire format and the detector logic are verified without hardware:

```bash
cd firmware/test && bash run.sh      # compiles with cc, runs assertions
```

All 30 checks pass, including: batch layout offsets, `scale_db` round-trip, the int8 dB mapping,
the no-fixture-attribution invariant, edge rising/falling with baseline warm-up, and ring wrap.

## Build + flash (on a machine with ESP-IDF 5.x)

```bash
cd firmware
idf.py set-target esp32s3
idf.py menuconfig          # set WiFi creds, broker URI, server base, node_id (or via NVS)
idf.py build flash monitor
```

`main/idf_component.yml` pulls `espressif/esp-dsp` automatically.

## Bring-up integration points (intentionally left for hardware)

- **WiFi / provisioning** — `app_main` calls `timesync_start()` and MQTT/HTTP but does not yet
  join WiFi; wire `esp_wifi` or a provisioning flow first. Broker/server URLs are `[SOFT]`
  placeholders in `app_main.c`.
- **Decimation filter** — `i2s_capture.c` uses a simple ÷6 average for bring-up. Replace with a
  polyphase FIR / cascaded halfband (esp-dsp) after Phase 1 profiling (signal-chain.md).
- **Exciter output** — the **ESP32-S3 has no built-in DAC** (the classic ESP32 did). The Phase-4
  chirp needs an external I2S DAC or a PDM/sigma-delta → RC stage; `chirp_run()` is the binding
  point and the sweep synthesis (`chirp_gen_exp_sweep`) is already done and tested. See
  `../kb/decisions/` — this is a genuine divergence from the source spec's assumption.
- **Outage backfill** — `flush_batch()` counts dropped frames; the 5-minute PSRAM backfill queue
  (`[HARD]` NFR) is a TODO marked in code.

## Why the odd-looking parameters are correct

- **Hop 1024 with a 512-pt FFT** — frames do **not** overlap; they are *sampled* at 15.6 Hz. This
  is deliberate (steady flow is stationary). Setting hop = FFT/2 by reflex quadruples storage for
  nothing. See `feature-stream.md`.
- **`scale_db` shipped per frame** — the int8 bins are peak-normalized (shape only); `scale_db` is
  the leak detector's only absolute-level input. Dropping it to "save 4 bytes" silently removes
  leak detection. `[HARD]`
- **96 kHz sample rate** — kept for the decimation margin and to preserve the (unproven) ultrasonic
  option; the leak detector is **not** built on the ultrasonic band.

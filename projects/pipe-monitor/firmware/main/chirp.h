// =============================================================================
// chirp.h — reference-exciter sweep (firmware/chirp-playback.md), Phase 4.
// Exponential sweep 100 Hz–20 kHz, 2 s, ×8, captured at 48 kHz. The device only
// plays and records; the server runs the matched filter.
//
// HARDWARE CAVEAT: the ESP32-S3 has NO built-in DAC (the classic ESP32 did).
// The exciter output path must therefore use an external I2S DAC or a
// PDM/sigma-delta → RC analog stage. chirp_gen_exp_sweep() is pure and
// host-testable; the output binding is documented in chirp.c.
// =============================================================================
#ifndef CHIRP_H
#define CHIRP_H
#include <stdint.h>
#include <stddef.h>

// Fill `out` with an exponential (log) sweep, amplitude in [-amp,amp] as int16.
// Returns samples written (= n). Pure; no platform dependencies.
size_t chirp_gen_exp_sweep(int16_t *out, size_t n, int sample_rate,
                           float f0_hz, float f1_hz, float amp);

#ifdef ESP_PLATFORM
#include "esp_err.h"
// Play the sweep `repeats` times back-to-back and capture on channel A.
// Suppresses the edge detector for the duration and tags the clip "scheduled".
esp_err_t chirp_run(int repeats);
#endif

#endif // CHIRP_H

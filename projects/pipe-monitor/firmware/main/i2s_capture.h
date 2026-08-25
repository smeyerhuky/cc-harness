// =============================================================================
// i2s_capture.h — PCM1808 @ 96 kHz slave mode, decimate ÷6 to the 16 kHz ID band,
// plus a parallel 35–45 kHz ultrasonic RMS envelope at native rate.
// firmware/signal-chain.md. Device-only (ESP-IDF).
// =============================================================================
#ifndef I2S_CAPTURE_H
#define I2S_CAPTURE_H
#ifdef ESP_PLATFORM

#include <stdint.h>
#include <stddef.h>

// Called for each decimated 16 kHz mono block, with the concurrent ultrasonic
// RMS for the same span. Runs on the capture task.
typedef void (*i2s_block_cb_t)(const int16_t *pcm16k, size_t n,
                               float ultrasonic_rms, void *user);

// Bring up I2S std RX (master clock out to the PCM1808 in slave mode) and start
// the capture task. See node_config.h for pins and rates.
esp_err_t i2s_capture_start(i2s_block_cb_t cb, void *user);
void      i2s_capture_stop(void);

#endif // ESP_PLATFORM
#endif // I2S_CAPTURE_H

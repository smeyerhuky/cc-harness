// =============================================================================
// clip_upload.h — HTTP POST of a 30 s clip (protocol/http-endpoints.md).
// [HARD] clips go over HTTP, not MQTT — a multi-hundred-kB blob on MQTT stalls
// the feature stream, which must not be interrupted (state machine continuity).
// =============================================================================
#ifndef CLIP_UPLOAD_H
#define CLIP_UPLOAD_H
#ifdef ESP_PLATFORM
#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"

// Uploads a mono 16 kHz int16 PCM clip as WAV (FLAC preferred on device once an
// encoder is integrated; server accepts either and stores FLAC). trigger is one
// of "edge" | "manual" | "scheduled".
esp_err_t clip_upload(const char *base_url, const char *node_id,
                      const char *event_id, const char *trigger,
                      int64_t start_mono_us,
                      const int16_t *pcm, size_t n_samples, int sample_rate);

#endif // ESP_PLATFORM
#endif // CLIP_UPLOAD_H

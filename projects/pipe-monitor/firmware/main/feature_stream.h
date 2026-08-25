// =============================================================================
// feature_stream.h — continuous 257-bin log-power spectrogram at 15.6 fps.
// firmware/feature-stream.md. The FFT path is device-only (esp-dsp); the int8
// quantization mapping is factored out as a pure, host-testable function.
// =============================================================================
#ifndef FEATURE_STREAM_H
#define FEATURE_STREAM_H

#include <stdint.h>
#include "node_config.h"

// Pure quantization: log-power bins (dB) -> int8 [-127,0], returning the peak
// (scale_db). Mirrors the spec exactly: d = logp[k]-peak, clamp to LOG_FLOOR_DB,
// out = d * 127/96. [HARD] scale is returned separately; the leak detector needs
// absolute level that the normalized bins discard.
float feat_quantize(const float *logp, int n, int8_t *out);

#ifdef ESP_PLATFORM
// Device-only: window + FFT one NFFT-sample frame into int8 bins + scale.
void feat_init(void);
void feat_frame(const float *frame, int8_t *out, float *scale);
#endif

#endif // FEATURE_STREAM_H

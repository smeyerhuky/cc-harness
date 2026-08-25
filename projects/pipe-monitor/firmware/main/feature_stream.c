// =============================================================================
// feature_stream.c — see feature_stream.h.
// The device path uses esp-dsp exactly as in firmware/feature-stream.md.
// feat_quantize() is host-portable and unit-tested.
// =============================================================================
#include "feature_stream.h"
#include <math.h>

// ---- Pure, host-testable quantization (spec int8 mapping) -------------------
float feat_quantize(const float *logp, int n, int8_t *out) {
    float mx = -1e30f;
    for (int k = 0; k < n; k++) if (logp[k] > mx) mx = logp[k];
    for (int k = 0; k < n; k++) {
        float d = logp[k] - mx;
        if (d < LOG_FLOOR_DB) d = LOG_FLOOR_DB;
        out[k] = (int8_t)(d * 127.0f / (-LOG_FLOOR_DB));   // -96 dB -> -127
    }
    return mx;   // scale_db
}

// ---- Device-only FFT path ---------------------------------------------------
#ifdef ESP_PLATFORM
#include "esp_dsp.h"

static float win[NFFT];
static float fft_buf[NFFT * 2];

void feat_init(void) {
    dsps_fft2r_init_fc32(NULL, NFFT);
    dsps_wind_hann_f32(win, NFFT);
}

void feat_frame(const float *frame, int8_t *out, float *scale) {
    for (int i = 0; i < NFFT; i++) {
        fft_buf[2*i]     = frame[i] * win[i];
        fft_buf[2*i + 1] = 0.0f;
    }
    dsps_fft2r_fc32(fft_buf, NFFT);
    dsps_bit_rev_fc32(fft_buf, NFFT);

    float logp[NFFT/2 + 1];
    for (int k = 0; k <= NFFT/2; k++) {
        float re = fft_buf[2*k], im = fft_buf[2*k + 1];
        logp[k] = 10.0f * log10f(re*re + im*im + 1e-12f);
    }
    *scale = feat_quantize(logp, NFFT/2 + 1, out);
}
#endif // ESP_PLATFORM

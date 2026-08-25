// =============================================================================
// chirp.c — see chirp.h.
// =============================================================================
#include "chirp.h"
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Exponential sweep (Farina): instantaneous phase for f0->f1 over duration T.
//   phi(t) = 2*pi*f0*L*(exp(t/L) - 1),  L = T / ln(f1/f0)
// This is the sweep whose harmonic-distortion products separate into a
// pre-arrival region of the recovered impulse response (server-side).
size_t chirp_gen_exp_sweep(int16_t *out, size_t n, int sample_rate,
                           float f0_hz, float f1_hz, float amp) {
    if (n == 0 || sample_rate <= 0 || f0_hz <= 0 || f1_hz <= f0_hz) return 0;
    float T = (float)n / (float)sample_rate;
    float L = T / logf(f1_hz / f0_hz);
    float clamp = amp > 1.0f ? 1.0f : amp;
    for (size_t i = 0; i < n; i++) {
        float t = (float)i / (float)sample_rate;
        float phi = 2.0f * (float)M_PI * f0_hz * L * (expf(t / L) - 1.0f);
        float s = clamp * sinf(phi);
        // gentle Tukey-ish fade at the ends to avoid click transients
        float w = 1.0f;
        float edge = 0.01f * n;
        if (i < edge)          w = (float)i / edge;
        else if (i > n - edge) w = (float)(n - i) / edge;
        out[i] = (int16_t)(s * w * 32767.0f);
    }
    return n;
}

#ifdef ESP_PLATFORM
#include "node_config.h"
#include "esp_log.h"
static const char *TAG = "chirp";

// Output binding is left as an integration point because the S3 lacks a DAC.
// Recommended: a second i2s_std TX channel into a small I2S DAC (e.g. PCM5102),
// or i2s_pdm_tx into an RC low-pass driving the LM4871/PAM8302. The sweep buffer
// from chirp_gen_exp_sweep() feeds i2s_channel_write() on the TX channel, while
// the RX channel captures on A. Averaging across repeats is done server-side
// from the sample-aligned emissions (device timestamps the first sample).
esp_err_t chirp_run(int repeats) {
    (void)repeats;
    ESP_LOGW(TAG, "chirp_run: bind an I2S-DAC/PDM TX output (S3 has no DAC) before Phase 4");
    return ESP_ERR_NOT_SUPPORTED;   // Phase-4 integration point
}
#endif

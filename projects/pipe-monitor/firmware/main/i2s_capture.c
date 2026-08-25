// =============================================================================
// i2s_capture.c — see i2s_capture.h.
// Uses the ESP-IDF 5.x i2s_std driver. The PCM1808 is in SLAVE mode: the S3
// supplies MCLK (256×fs), BCLK, WS. Decimation and the ultrasonic bandpass are
// intentionally the only DSP on-device — everything discretionary lives server
// side (overview/system-architecture.md).
// =============================================================================
#ifdef ESP_PLATFORM
#include "i2s_capture.h"
#include "node_config.h"
#include "driver/i2s_std.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include <string.h>
#include <math.h>

static const char *TAG = "i2s";
static i2s_chan_handle_t s_rx = NULL;
static TaskHandle_t s_task = NULL;
static volatile int s_run = 0;
static i2s_block_cb_t s_cb = NULL;
static void *s_user = NULL;

// Simple 2nd-order bandpass (biquad) for the 35–45 kHz ultrasonic envelope at
// the native 96 kHz rate. Coefficients are computed once at start.
typedef struct { float b0,b1,b2,a1,a2,x1,x2,y1,y2; } biquad_t;
static biquad_t s_us_bp;

static void biquad_bandpass(biquad_t *q, float fs, float fc, float Q) {
    float w0 = 2.0f * (float)M_PI * fc / fs;
    float alpha = sinf(w0) / (2.0f * Q);
    float cw = cosf(w0);
    float a0 = 1.0f + alpha;
    q->b0 =  alpha / a0;  q->b1 = 0.0f;  q->b2 = -alpha / a0;
    q->a1 = -2.0f * cw / a0;  q->a2 = (1.0f - alpha) / a0;
    q->x1 = q->x2 = q->y1 = q->y2 = 0.0f;
}
static inline float biquad_run(biquad_t *q, float x) {
    float y = q->b0*x + q->b1*q->x1 + q->b2*q->x2 - q->a1*q->y1 - q->a2*q->y2;
    q->x2 = q->x1; q->x1 = x; q->y2 = q->y1; q->y1 = y;
    return y;
}

// Polyphase/FIR decimation is preferred (ESP-DSP); this integer-average ÷6 is a
// placeholder that is correct but not optimal — replace with dsps_fir + halfband
// in Phase 1 profiling (firmware/signal-chain.md). Kept simple for bring-up.
static void capture_task(void *arg) {
    (void)arg;
    const int RAW = 1536;                 // native 96k samples per read (multiple of DECIM)
    static int32_t raw[1536];             // PCM1808 24-bit left-justified in 32-bit slots
    static int16_t dec[1536 / DECIM];
    size_t got = 0;

    while (s_run) {
        esp_err_t e = i2s_channel_read(s_rx, raw, sizeof(raw), &got, pdMS_TO_TICKS(200));
        if (e != ESP_OK || got == 0) continue;
        int nraw = got / sizeof(int32_t);

        // Ultrasonic envelope at native rate over this block.
        double us_acc = 0.0; int us_n = 0;
        int nd = 0;
        long acc = 0; int cnt = 0;
        for (int i = 0; i < nraw; i++) {
            int32_t s24 = raw[i] >> 8;          // 24-bit sample in the low bytes
            float f = (float)s24 / 8388608.0f;  // normalize to [-1,1)
            float u = biquad_run(&s_us_bp, f);
            us_acc += (double)u * u; us_n++;
            // naive ÷DECIM average -> 16 kHz int16
            acc += s24; if (++cnt == DECIM) {
                int32_t avg = (int32_t)(acc / DECIM);
                dec[nd++] = (int16_t)(avg >> 8);   // scale 24->16 bit
                acc = 0; cnt = 0;
            }
        }
        float us_rms = us_n ? sqrtf((float)(us_acc / us_n)) : 0.0f;
        if (s_cb) s_cb(dec, nd, us_rms, s_user);
    }
    vTaskDelete(NULL);
}

esp_err_t i2s_capture_start(i2s_block_cb_t cb, void *user) {
    s_cb = cb; s_user = user;
    biquad_bandpass(&s_us_bp, (float)ADC_SAMPLE_RATE_HZ,
                    0.5f * (US_BAND_LO_HZ + US_BAND_HI_HZ),
                    (float)(0.5f*(US_BAND_LO_HZ+US_BAND_HI_HZ)) / (US_BAND_HI_HZ - US_BAND_LO_HZ));

    i2s_chan_config_t chcfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0, I2S_ROLE_MASTER);
    ESP_ERROR_CHECK(i2s_new_channel(&chcfg, NULL, &s_rx));

    i2s_std_config_t std = {
        .clk_cfg  = I2S_STD_CLK_DEFAULT_CONFIG(ADC_SAMPLE_RATE_HZ),
        .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(
                        I2S_DATA_BIT_WIDTH_24BIT, I2S_SLOT_MODE_STEREO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_MCLK, .bclk = I2S_GPIO_BCLK,
            .ws = I2S_GPIO_WS, .dout = I2S_GPIO_UNUSED, .din = I2S_GPIO_DIN,
            .invert_flags = { .mclk_inv=false, .bclk_inv=false, .ws_inv=false },
        },
    };
    std.clk_cfg.mclk_multiple = I2S_MCLK_MULTIPLE_256;   // 24.576 MHz at 96 kHz
    ESP_ERROR_CHECK(i2s_channel_init_std_mode(s_rx, &std));
    ESP_ERROR_CHECK(i2s_channel_enable(s_rx));

    s_run = 1;
    xTaskCreatePinnedToCore(capture_task, "i2s_cap", 4096, NULL, 6, &s_task, 1);
    ESP_LOGI(TAG, "capture started @ %d Hz, decimate /%d -> %d Hz", ADC_SAMPLE_RATE_HZ, DECIM, ID_RATE_HZ);
    return ESP_OK;
}

void i2s_capture_stop(void) {
    s_run = 0;
    if (s_rx) { i2s_channel_disable(s_rx); i2s_del_channel(s_rx); s_rx = NULL; }
}
#endif // ESP_PLATFORM

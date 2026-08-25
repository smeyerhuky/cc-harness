// =============================================================================
// app_main.c — sensor-node top level. Wires: I2S capture -> feature stream +
// edge detector -> MQTT features/events + HTTP clips, plus heartbeat and command
// handling. The node is deliberately dumb: it does NO classification.
//
// This file is device-only (ESP-IDF 5.x). WiFi/NVS provisioning is a bring-up
// integration point (Kconfig or a provisioning flow); the DSP/protocol logic it
// drives is unit-tested on host under firmware/test/.
// =============================================================================
#ifdef ESP_PLATFORM
#include "node_config.h"
#include "proto.h"
#include "feature_stream.h"
#include "edge_detect.h"
#include "ring_buffer.h"
#include "i2s_capture.h"
#include "net_mqtt.h"
#include "clip_upload.h"
#include "timesync.h"
#include "commands.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include "esp_mac.h"
#include <string.h>
#include <stdio.h>
#include <math.h>

static const char *TAG = "app";

// ---- Configuration a real build pulls from NVS/Kconfig -----------------------
static char       s_node_id[32]  = NODE_ID_DEFAULT;
static const char *BROKER_URI    = "mqtt://192.168.1.10:1883";     // [SOFT] set for your LAN
static const char *SERVER_BASE   = "http://192.168.1.10:8000";     // [SOFT]

// ---- Shared state ------------------------------------------------------------
static ring_t        s_ring;
static edge_state_t  s_edge;
static float         s_frame_accum[NFFT];
static int           s_accum_n = 0;
static proto_frame_t s_batch[FRAMES_PER_BATCH];
static int           s_batch_n = 0;
static int64_t       s_batch_t0_utc = 0, s_batch_t0_mono = 0;
static volatile uint32_t s_adc_clip_count = 0;
static volatile uint32_t s_dropped_frames = 0;
static int           s_skip = 0;             // samples to skip to realize the 1024 hop
static float         s_us_pending = 0.0f;    // ultrasonic RMS attached to the next frame

// A pending clip capture: after an edge we keep recording POSTROLL, then upload.
typedef struct { char event_id[40]; char trigger[12]; int64_t start_mono; int active; int64_t due_mono; } pending_clip_t;
static pending_clip_t s_pending;

static void make_uuid(char *out, size_t n) {
    uint8_t m[6]; esp_read_mac(m, ESP_MAC_WIFI_STA);
    snprintf(out, n, "%02x%02x-%02x%02x-%lld", m[2], m[3], m[4], m[5], (long long)now_mono_us());
}

// Frame energy = sum of linear power over the ID band (drives the edge detector).
static float frame_energy(const int8_t *bins, float scale_db) {
    // bins are dB below peak; approximate linear energy from the peak + shape.
    // Cheap proxy: 10^(scale_db/10) scaled by the mean bin level. Good enough for
    // an energy-ratio detector (absolute calibration is not needed here).
    double acc = 0;
    for (int k = 0; k < N_BINS; k++) acc += powf(10.0f, (scale_db + bins[k] * (-LOG_FLOOR_DB) / 127.0f) / 10.0f);
    return (float)acc;
}

static void flush_batch(void) {
    if (s_batch_n == 0) return;
    static uint8_t buf[PROTO_HEADER_BYTES + FRAMES_PER_BATCH * PROTO_FRAME_BYTES];
    size_t n = proto_serialize_batch(buf, sizeof buf, (uint8_t)s_batch_n,
                                     s_batch_t0_utc, s_batch_t0_mono, FRAME_PERIOD_US, s_batch);
    if (n) {
        if (mqtt_pub_features(buf, n) < 0) s_dropped_frames += s_batch_n;  // TODO: PSRAM backfill queue
    }
    s_batch_n = 0;
}

// Called when a full NFFT frame has accumulated.
static void on_feature_frame(void) {
    int8_t bins[N_BINS];
    float scale;
#ifdef ESP_PLATFORM
    feat_frame(s_frame_accum, bins, &scale);
#else
    scale = feat_quantize(s_frame_accum, N_BINS, bins);
#endif
    // Edge detection on this frame.
    float e = frame_energy(bins, scale);
    edge_kind_t k = edge_update(&s_edge, e);
    if (k != EDGE_NONE && !s_pending.active) {
        make_uuid(s_pending.event_id, sizeof s_pending.event_id);
        strcpy(s_pending.trigger, "edge");
        s_pending.start_mono = now_mono_us();
        s_pending.due_mono = s_pending.start_mono + (int64_t)CLIP_POSTROLL_SEC * 1000000;
        s_pending.active = 1;
        char js[320];
        size_t jn = proto_event_json(js, sizeof js, s_node_id, s_pending.event_id,
                                     now_utc_us(), s_pending.start_mono, "edge",
                                     k == EDGE_RISING ? "rising" : "falling",
                                     s_edge.last_ratio, 1);
        if (jn) mqtt_pub_event(js, jn);
    }
    // Batch the feature frame (ultrasonic_rms filled by the capture callback path).
    if (s_batch_n == 0) { s_batch_t0_utc = now_utc_us(); s_batch_t0_mono = now_mono_us(); }
    s_batch[s_batch_n].scale_db = scale;
    s_batch[s_batch_n].ultrasonic_rms = s_us_pending;   // 35-45 kHz envelope (stored, not trusted)
    memcpy(s_batch[s_batch_n].bins, bins, N_BINS);
    if (++s_batch_n >= FRAMES_PER_BATCH) flush_batch();
}

// I2S capture callback: 16 kHz mono block + concurrent ultrasonic RMS.
// Realizes the [HARD] hop-1024 / NFFT-512 sampling: fill NFFT, emit a frame,
// then SKIP (HOP-NFFT) samples so frames do not overlap (feature-stream.md).
static void on_i2s_block(const int16_t *pcm, size_t n, float us_rms, void *user) {
    (void)user;
    ring_write(&s_ring, pcm, n);
    s_us_pending = us_rms;               // most recent block's US envelope
    for (size_t i = 0; i < n; i++) {
        if (pcm[i] >= 32760 || pcm[i] <= -32760) s_adc_clip_count++;   // saturation surfacing
        if (s_skip > 0) { s_skip--; continue; }
        s_frame_accum[s_accum_n++] = (float)pcm[i] / 32768.0f;
        if (s_accum_n >= NFFT) {
            on_feature_frame();
            s_accum_n = 0;
            s_skip = HOP - NFFT;         // 512-sample gap -> 15.6 fps
        }
    }
}

static void heartbeat_task(void *arg) {
    (void)arg;
    char js[192];
    while (1) {
        snprintf(js, sizeof js,
            "{\"node_id\":\"%s\",\"uptime_s\":%lld,\"buf_fill\":%u,"
            "\"dropped_frames\":%u,\"adc_clip_count\":%u,\"mqtt\":%d}",
            s_node_id, (long long)(now_mono_us()/1000000), (unsigned)s_ring.filled,
            (unsigned)s_dropped_frames, (unsigned)s_adc_clip_count, mqtt_is_connected());
        mqtt_pub_status(js, strlen(js));
        vTaskDelay(pdMS_TO_TICKS(HEARTBEAT_PERIOD_MS));
    }
}

// Watches pending clips and manual capture requests; uploads the 30 s window.
static void clip_task(void *arg) {
    (void)arg;
    static int16_t clip[(CLIP_PREROLL_SEC + CLIP_POSTROLL_SEC) * ID_RATE_HZ];
    while (1) {
        if (commands_take_capture_request() && !s_pending.active) {
            make_uuid(s_pending.event_id, sizeof s_pending.event_id);
            strcpy(s_pending.trigger, "manual");
            s_pending.start_mono = now_mono_us();
            s_pending.due_mono = s_pending.start_mono + (int64_t)CLIP_POSTROLL_SEC * 1000000;
            s_pending.active = 1;
        }
        if (s_pending.active && now_mono_us() >= s_pending.due_mono) {
            size_t want = (size_t)(CLIP_PREROLL_SEC + CLIP_POSTROLL_SEC) * ID_RATE_HZ;
            size_t got = ring_read_last(&s_ring, clip, want);
            clip_upload(SERVER_BASE, s_node_id, s_pending.event_id, s_pending.trigger,
                        s_pending.start_mono, clip, got, ID_RATE_HZ);
            s_pending.active = 0;
        }
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_LOGI(TAG, "pipe-monitor node starting: %s", s_node_id);

    // TODO(bring-up): connect WiFi (esp_wifi / provisioning) before MQTT/HTTP.
    timesync_start();

    float dt = (float)HOP / (float)ID_RATE_HZ;
    edge_init(&s_edge, THETA_OPEN_DEFAULT, THETA_CLOSE_DEFAULT, dt, STE_WIN_MS, LTE_WIN_MS,
              EDGE_CONFIRM_FRAMES);
    commands_init(&s_edge);

    if (ring_init(&s_ring, (size_t)RING_SECONDS * ID_RATE_HZ) != 0)
        ESP_LOGE(TAG, "ring buffer alloc failed (need 8 MB PSRAM part!)");

    feat_init();
    ESP_ERROR_CHECK(mqtt_start(BROKER_URI, s_node_id, commands_handle));
    ESP_ERROR_CHECK(i2s_capture_start(on_i2s_block, NULL));

    xTaskCreate(heartbeat_task, "hb", 3072, NULL, 3, NULL);
    xTaskCreate(clip_task, "clip", 4096, NULL, 4, NULL);
    ESP_LOGI(TAG, "node running");
}
#endif // ESP_PLATFORM

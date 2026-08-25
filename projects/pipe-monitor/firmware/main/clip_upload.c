// =============================================================================
// clip_upload.c — see clip_upload.h. Streams a WAV body via esp_http_client.
// Headers carry X-Clip-Trigger and X-Clip-Start-Us; the event_id (query param)
// joins to the MQTT event message on the server.
// =============================================================================
#ifdef ESP_PLATFORM
#include "clip_upload.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "clip";

static void wav_header(uint8_t h[44], uint32_t data_bytes, int sr) {
    uint32_t byte_rate = sr * 2, chunk = 36 + data_bytes;
    memcpy(h, "RIFF", 4);            memcpy(h+4, &chunk, 4);
    memcpy(h+8, "WAVEfmt ", 8);
    uint32_t sub1 = 16; uint16_t fmt = 1, ch = 1, bps = 16, align = 2;
    memcpy(h+16,&sub1,4); memcpy(h+20,&fmt,2); memcpy(h+22,&ch,2);
    uint32_t srr = sr; memcpy(h+24,&srr,4); memcpy(h+28,&byte_rate,4);
    memcpy(h+32,&align,2); memcpy(h+34,&bps,2);
    memcpy(h+36,"data",4); memcpy(h+40,&data_bytes,4);
}

esp_err_t clip_upload(const char *base_url, const char *node_id,
                      const char *event_id, const char *trigger,
                      int64_t start_mono_us,
                      const int16_t *pcm, size_t n_samples, int sample_rate) {
    char url[256];
    snprintf(url, sizeof url, CLIP_ENDPOINT_FMT "?event_id=%s", base_url, node_id, event_id);

    uint32_t data_bytes = (uint32_t)(n_samples * sizeof(int16_t));
    uint8_t hdr[44]; wav_header(hdr, data_bytes, sample_rate);

    esp_http_client_config_t cfg = { .url = url, .method = HTTP_METHOD_POST, .timeout_ms = 15000 };
    esp_http_client_handle_t c = esp_http_client_init(&cfg);
    if (!c) return ESP_FAIL;

    char hs[32];
    esp_http_client_set_header(c, "Content-Type", "audio/wav");
    esp_http_client_set_header(c, "X-Clip-Trigger", trigger);
    snprintf(hs, sizeof hs, "%lld", (long long)start_mono_us);
    esp_http_client_set_header(c, "X-Clip-Start-Us", hs);

    esp_err_t err = esp_http_client_open(c, 44 + data_bytes);
    if (err != ESP_OK) { esp_http_client_cleanup(c); return err; }
    esp_http_client_write(c, (const char *)hdr, 44);
    // Write PCM in chunks to bound peak RAM.
    const size_t CHUNK = 4096;
    const uint8_t *p = (const uint8_t *)pcm;
    for (size_t off = 0; off < data_bytes; off += CHUNK) {
        size_t w = (data_bytes - off) < CHUNK ? (data_bytes - off) : CHUNK;
        if (esp_http_client_write(c, (const char *)(p + off), w) < 0) { err = ESP_FAIL; break; }
    }
    int status = esp_http_client_fetch_headers(c) >= 0 ? esp_http_client_get_status_code(c) : -1;
    ESP_LOGI(TAG, "clip %s -> HTTP %d (%u bytes)", event_id, status, (unsigned)data_bytes);
    esp_http_client_cleanup(c);
    return (status >= 200 && status < 300) ? ESP_OK : ESP_FAIL;
}
#endif // ESP_PLATFORM

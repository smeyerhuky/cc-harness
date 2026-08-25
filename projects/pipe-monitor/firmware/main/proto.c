// =============================================================================
// proto.c — see proto.h. Host-portable; no ESP dependencies.
// =============================================================================
#include "proto.h"
#include <string.h>
#include <stdio.h>

// Little-endian writers. We assume a little-endian host (ESP32-S3 is LE); the
// memcpy of float relies on IEEE-754 LE, which both target and CI hosts satisfy.
static inline void put_u8 (uint8_t **p, uint8_t v)  { **p = v; (*p)++; }
static inline void put_u16(uint8_t **p, uint16_t v) { memcpy(*p, &v, 2); *p += 2; }
static inline void put_u32(uint8_t **p, uint32_t v) { memcpy(*p, &v, 4); *p += 4; }
static inline void put_i64(uint8_t **p, int64_t v)  { memcpy(*p, &v, 8); *p += 8; }
static inline void put_f32(uint8_t **p, float v)    { memcpy(*p, &v, 4); *p += 4; }

size_t proto_serialize_batch(uint8_t *out, size_t out_cap,
                             uint8_t frame_count,
                             int64_t t0_utc_us, int64_t t0_mono_us,
                             uint32_t frame_period_us,
                             const proto_frame_t *frames) {
    if (!out || !frames || frame_count == 0) return 0;
    size_t need = proto_batch_size(frame_count);
    if (out_cap < need) return 0;

    uint8_t *p = out;
    put_u8 (&p, PROTO_VERSION);
    put_u8 (&p, frame_count);
    put_u16(&p, PROTO_BIN_COUNT);
    put_i64(&p, t0_utc_us);
    put_i64(&p, t0_mono_us);
    put_u32(&p, frame_period_us);

    for (uint8_t i = 0; i < frame_count; i++) {
        put_f32(&p, frames[i].scale_db);
        put_f32(&p, frames[i].ultrasonic_rms);
        memcpy(p, frames[i].bins, PROTO_BIN_COUNT);
        p += PROTO_BIN_COUNT;
    }
    return (size_t)(p - out);
}

size_t proto_event_json(char *out, size_t out_cap,
                        const char *node_id, const char *event_id,
                        int64_t t_utc_us, int64_t t_mono_us,
                        const char *kind, const char *direction,
                        float ste_lte_ratio, int clip_pending) {
    if (!out || out_cap == 0) return 0;
    int n = snprintf(out, out_cap,
        "{\"version\":%d,\"node_id\":\"%s\",\"event_id\":\"%s\","
        "\"t_utc_us\":%lld,\"t_mono_us\":%lld,\"kind\":\"%s\","
        "\"direction\":\"%s\",\"ste_lte_ratio\":%.2f,\"clip_pending\":%s}",
        PROTO_VERSION, node_id, event_id,
        (long long)t_utc_us, (long long)t_mono_us, kind, direction,
        ste_lte_ratio, clip_pending ? "true" : "false");
    if (n < 0 || (size_t)n >= out_cap) return 0;
    return (size_t)n;
}

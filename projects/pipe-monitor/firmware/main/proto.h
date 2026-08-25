// =============================================================================
// proto.h — wire formats shared with the server (protocol/feature-batch-format.md,
// protocol/event-message.md). Host-portable (stdint only) so the byte layout can
// be unit-tested off-target. Little-endian throughout (native ESP32-S3 order).
// =============================================================================
#ifndef PROTO_H
#define PROTO_H

#include <stdint.h>
#include <stddef.h>

#define PROTO_VERSION       1
#define PROTO_BIN_COUNT     257

// One feature frame as held in RAM before serialization.
typedef struct {
    float   scale_db;                    // [HARD] peak log-power; leak detector's only level input
    float   ultrasonic_rms;              // 35-45 kHz band RMS (unproven; stored not trusted)
    int8_t  bins[PROTO_BIN_COUNT];       // dB below peak, mapped [-96,0] -> [-127,0]
} proto_frame_t;

// Header + N frames. Matches feature-batch-format.md exactly.
//   uint8  version = 1
//   uint8  frame_count
//   uint16 bin_count = 257
//   int64  t0_utc_us
//   int64  t0_mono_us
//   uint32 frame_period_us = 64000
//   repeat frame_count: float32 scale_db, float32 ultrasonic_rms, int8[257] bins
#define PROTO_HEADER_BYTES  24
#define PROTO_FRAME_BYTES   (4 + 4 + PROTO_BIN_COUNT)   // 265

// Serialize a batch into out (must be >= proto_batch_size(frame_count)).
// Returns bytes written, or 0 on error (null args / count 0).
size_t proto_serialize_batch(uint8_t *out, size_t out_cap,
                             uint8_t frame_count,
                             int64_t t0_utc_us, int64_t t0_mono_us,
                             uint32_t frame_period_us,
                             const proto_frame_t *frames);

static inline size_t proto_batch_size(uint8_t frame_count) {
    return (size_t)PROTO_HEADER_BYTES + (size_t)frame_count * PROTO_FRAME_BYTES;
}

// Build the event JSON (edge message). Returns strlen written, or 0 on overflow.
// direction: "rising" | "falling"; kind: "edge" | "manual" | "scheduled".
size_t proto_event_json(char *out, size_t out_cap,
                        const char *node_id, const char *event_id,
                        int64_t t_utc_us, int64_t t_mono_us,
                        const char *kind, const char *direction,
                        float ste_lte_ratio, int clip_pending);

#endif // PROTO_H

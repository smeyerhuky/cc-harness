// =============================================================================
// ring_buffer.h — 30 s circular audio buffer in PSRAM (16 kHz mono int16).
// firmware/event-detection-and-clips.md. The 10 s pre-roll is what makes
// labelling tractable and preserves the quiet baseline the transient classifier
// needs — a detector that starts recording on trigger has already lost the onset.
// =============================================================================
#ifndef RING_BUFFER_H
#define RING_BUFFER_H

#include <stdint.h>
#include <stddef.h>

typedef struct {
    int16_t *buf;        // PSRAM-backed
    size_t   cap;        // samples (RING_SECONDS * ID_RATE_HZ)
    size_t   head;       // next write index
    size_t   filled;     // samples written so far (saturates at cap)
} ring_t;

// Allocate in PSRAM (device) / heap (host). Returns 0 on success.
int  ring_init(ring_t *r, size_t capacity_samples);
void ring_free(ring_t *r);

// Append n samples (wraps).
void ring_write(ring_t *r, const int16_t *samples, size_t n);

// Copy the most recent `count` samples (oldest-first) into out (>= count).
// Returns samples copied (may be < count if not yet filled).
size_t ring_read_last(const ring_t *r, int16_t *out, size_t count);

#endif // RING_BUFFER_H

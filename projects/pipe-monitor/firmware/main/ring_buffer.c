// =============================================================================
// ring_buffer.c — see ring_buffer.h. Host-portable; PSRAM alloc on device.
// =============================================================================
#include "ring_buffer.h"
#include <string.h>
#include <stdlib.h>

#ifdef ESP_PLATFORM
#include "esp_heap_caps.h"
static void *rb_alloc(size_t n) { return heap_caps_malloc(n, MALLOC_CAP_SPIRAM); }
static void  rb_dealloc(void *p) { heap_caps_free(p); }
#else
static void *rb_alloc(size_t n) { return malloc(n); }
static void  rb_dealloc(void *p) { free(p); }
#endif

int ring_init(ring_t *r, size_t capacity_samples) {
    r->buf = (int16_t *)rb_alloc(capacity_samples * sizeof(int16_t));
    if (!r->buf) return -1;
    r->cap = capacity_samples;
    r->head = 0;
    r->filled = 0;
    memset(r->buf, 0, capacity_samples * sizeof(int16_t));
    return 0;
}

void ring_free(ring_t *r) {
    if (r->buf) rb_dealloc(r->buf);
    r->buf = NULL; r->cap = r->head = r->filled = 0;
}

void ring_write(ring_t *r, const int16_t *samples, size_t n) {
    for (size_t i = 0; i < n; i++) {
        r->buf[r->head] = samples[i];
        r->head = (r->head + 1) % r->cap;
    }
    r->filled += n;
    if (r->filled > r->cap) r->filled = r->cap;
}

size_t ring_read_last(const ring_t *r, int16_t *out, size_t count) {
    size_t avail = r->filled < count ? r->filled : count;
    // Oldest of the `avail` samples starts at head - avail (mod cap).
    size_t start = (r->head + r->cap - avail) % r->cap;
    for (size_t i = 0; i < avail; i++) out[i] = r->buf[(start + i) % r->cap];
    return avail;
}

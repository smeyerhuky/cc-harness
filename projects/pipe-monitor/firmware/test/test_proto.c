// =============================================================================
// test_proto.c — host unit tests for the wire format + DSP math.
// Build/run: see firmware/test/run.sh. No ESP dependencies.
// =============================================================================
#include "../main/proto.h"
#include "../main/edge_detect.h"
#include "../main/feature_stream.h"
#include "../main/ring_buffer.h"
#include "../main/chirp.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

static int fails = 0;
#define CHECK(cond, msg) do { if (!(cond)) { printf("FAIL: %s\n", msg); fails++; } \
                              else { printf("ok:   %s\n", msg); } } while (0)

static uint16_t rd_u16(const uint8_t *p){ uint16_t v; memcpy(&v,p,2); return v; }
static uint32_t rd_u32(const uint8_t *p){ uint32_t v; memcpy(&v,p,4); return v; }
static int64_t  rd_i64(const uint8_t *p){ int64_t  v; memcpy(&v,p,8); return v; }
static float    rd_f32(const uint8_t *p){ float    v; memcpy(&v,p,4); return v; }

static void test_batch_layout(void) {
    proto_frame_t f[2];
    for (int i = 0; i < 2; i++) {
        f[i].scale_db = -12.5f + i;
        f[i].ultrasonic_rms = 0.001f * (i + 1);
        for (int k = 0; k < PROTO_BIN_COUNT; k++) f[i].bins[k] = (int8_t)(-k % 128);
    }
    uint8_t buf[4096];
    size_t n = proto_serialize_batch(buf, sizeof buf, 2,
                                     1735689600000000LL, 84213000000LL,
                                     FRAME_PERIOD_US, f);

    CHECK(n == proto_batch_size(2), "batch size matches header+frames");
    CHECK(n == 24 + 2 * 265, "batch size is 24 + 2*265 = 554 bytes");
    CHECK(buf[0] == PROTO_VERSION, "byte0 is version=1 (server dispatches on it)");
    CHECK(buf[1] == 2, "byte1 is frame_count");
    CHECK(rd_u16(buf + 2) == 257, "bin_count=257 at offset 2");
    CHECK(rd_i64(buf + 4) == 1735689600000000LL, "t0_utc_us at offset 4");
    CHECK(rd_i64(buf + 12) == 84213000000LL, "t0_mono_us at offset 12");
    CHECK(rd_u32(buf + 20) == 64000u, "frame_period_us=64000 at offset 20");

    // first frame: scale_db, ultrasonic_rms, then 257 int8 bins
    const uint8_t *fr0 = buf + 24;
    CHECK(fabsf(rd_f32(fr0) - (-12.5f)) < 1e-6, "frame0 scale_db round-trips");
    CHECK(fabsf(rd_f32(fr0 + 4) - 0.001f) < 1e-9, "frame0 ultrasonic_rms round-trips");
    CHECK((int8_t)fr0[8]   == 0, "frame0 bin[0] == 0");
    CHECK((int8_t)fr0[8+1] == -1, "frame0 bin[1] == -1");

    // overflow guard
    CHECK(proto_serialize_batch(buf, 10, 2, 0, 0, 64000, f) == 0, "refuses undersized buffer");
}

static void test_event_json(void) {
    char js[512];
    size_t n = proto_event_json(js, sizeof js, "basement-main", "abc-123",
                                1735689600000000LL, 84213000000LL,
                                "edge", "rising", 8.4f, 1);
    CHECK(n > 0, "event json serializes");
    CHECK(strstr(js, "\"version\":1") != NULL, "json has version");
    CHECK(strstr(js, "\"clip_pending\":true") != NULL, "json clip_pending bool not quoted");
    CHECK(strstr(js, "\"direction\":\"rising\"") != NULL, "json direction hint present");
    CHECK(strstr(js, "\"ste_lte_ratio\":8.40") != NULL, "json ratio formatted");
    // no fixture attribution [HARD]
    CHECK(strstr(js, "fixture") == NULL, "event carries NO fixture attribution");
}

static void test_quantize(void) {
    // Flat spectrum -> all bins at peak -> all zeros; scale = the peak value.
    float logp[257];
    for (int k = 0; k < 257; k++) logp[k] = -30.0f;
    int8_t out[257];
    float scale = feat_quantize(logp, 257, out);
    CHECK(fabsf(scale - (-30.0f)) < 1e-6, "quantize returns peak as scale_db");
    int all_zero = 1; for (int k=0;k<257;k++) if (out[k]!=0) all_zero=0;
    CHECK(all_zero, "flat spectrum -> all bins 0 (shape only)");

    // One bin 96 dB below peak -> -127; below floor clamps to -127.
    logp[10] = -30.0f - 96.0f;
    logp[11] = -30.0f - 200.0f;   // beyond floor
    scale = feat_quantize(logp, 257, out);
    CHECK(out[10] == -127, "bin 96 dB down maps to -127");
    CHECK(out[11] == -127, "bin beyond floor clamps to -127");
    CHECK(out[0] == 0, "peak bin stays 0");
}

static void test_edge(void) {
    edge_state_t s;
    float dt = (float)HOP / (float)ID_RATE_HZ;   // 0.064 s
    edge_init(&s, THETA_OPEN_DEFAULT, THETA_CLOSE_DEFAULT, dt, STE_WIN_MS, LTE_WIN_MS,
              EDGE_CONFIRM_FRAMES);

    // Establish a quiet baseline for a while.
    for (int i = 0; i < 400; i++) edge_update(&s, 1.0f);   // energy ~1 -> amp ~1

    // Sudden loud flow: energy jumps to 900 (amp 30) -> ratio >> theta_open.
    edge_kind_t k = EDGE_NONE;
    for (int i = 0; i < 10 && k == EDGE_NONE; i++) k = edge_update(&s, 900.0f);
    CHECK(k == EDGE_RISING, "rising edge fires on sustained loud flow");
    CHECK(s.armed == 1, "detector armed after rising edge");

    // Sustained flow should NOT keep re-firing rising (armed) and should NOT drag
    // the baseline up (lte frozen while armed).
    edge_kind_t again = EDGE_NONE;
    for (int i = 0; i < 200; i++) { edge_kind_t r = edge_update(&s, 900.0f); if (r==EDGE_RISING) again=r; }
    CHECK(again == EDGE_NONE, "no repeated rising while flow sustained (baseline not dragged)");

    // Flow stops: ratio collapses -> falling edge.
    edge_kind_t f = EDGE_NONE;
    for (int i = 0; i < 10 && f == EDGE_NONE; i++) f = edge_update(&s, 1.0f);
    CHECK(f == EDGE_FALLING, "falling edge fires when flow stops");
}

static void test_ring(void) {
    ring_t r;
    CHECK(ring_init(&r, 100) == 0, "ring allocates");
    int16_t in[250];
    for (int i = 0; i < 250; i++) in[i] = (int16_t)i;
    ring_write(&r, in, 250);            // overwrites; last 100 should be 150..249
    CHECK(r.filled == 100, "ring filled saturates at cap");
    int16_t out[100];
    size_t n = ring_read_last(&r, out, 100);
    CHECK(n == 100, "read_last returns cap samples");
    CHECK(out[0] == 150 && out[99] == 249, "read_last returns most-recent, oldest-first");
    // partial fill
    ring_t r2; ring_init(&r2, 100);
    ring_write(&r2, in, 30);
    int16_t o2[100];
    CHECK(ring_read_last(&r2, o2, 100) == 30, "partial fill returns only what's written");
    CHECK(o2[0] == 0 && o2[29] == 29, "partial fill oldest-first");
    ring_free(&r); ring_free(&r2);
}

static void test_chirp(void) {
    int sr = CHIRP_CAPTURE_HZ, N = sr * CHIRP_DUR_S;
    static int16_t sw[48000 * 2];
    size_t n = chirp_gen_exp_sweep(sw, N, sr, CHIRP_F0_HZ, CHIRP_F1_HZ, 0.9f);
    CHECK(n == (size_t)N, "sweep fills the full duration");
    // ends fade to ~0 (Tukey), middle is energetic
    CHECK(sw[0] == 0, "sweep starts at zero (fade-in)");
    int mid_energetic = 0; for (int i=N/2-50;i<N/2+50;i++) if (abs(sw[i])>3000) mid_energetic=1;
    CHECK(mid_energetic, "sweep has energy in the middle");
    // amplitude never exceeds full-scale
    int in_range = 1; for (int i=0;i<N;i++) if (sw[i] > 32767 || sw[i] < -32768) in_range=0;
    CHECK(in_range, "sweep stays within int16 range");
}

int main(void) {
    printf("== proto/dsp host tests ==\n");
    test_batch_layout();
    test_event_json();
    test_quantize();
    test_edge();
    test_ring();
    test_chirp();
    printf(fails ? "\n%d FAILURE(S)\n" : "\nALL PASS\n", fails);
    return fails ? 1 : 0;
}

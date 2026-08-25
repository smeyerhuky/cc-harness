// =============================================================================
// edge_detect.c — see edge_detect.h. Pure C, host-testable.
// =============================================================================
#include "edge_detect.h"
#include <math.h>

// Convert a window length (ms) and frame period (s) into a leaky-integrator
// smoothing coefficient alpha in (0,1): alpha = 1 - exp(-dt/tau).
static float win_to_alpha(float frame_dt_s, float win_ms) {
    float tau = win_ms / 1000.0f;
    if (tau <= 0.0f) return 1.0f;
    float a = 1.0f - expf(-frame_dt_s / tau);
    if (a < 0.0f) a = 0.0f;
    if (a > 1.0f) a = 1.0f;
    return a;
}

void edge_init(edge_state_t *s, float theta_open, float theta_close,
               float frame_dt_s, float ste_win_ms, float lte_win_ms,
               int confirm_needed) {
    s->ste = 0.0f;
    s->lte = 1e-9f;              // avoid divide-by-zero before the pipe is heard
    s->theta_open = theta_open;
    s->theta_close = theta_close;
    s->ste_alpha = win_to_alpha(frame_dt_s, ste_win_ms);
    s->lte_alpha = win_to_alpha(frame_dt_s, lte_win_ms);
    s->confirm = 0;
    s->confirm_needed = confirm_needed;
    s->armed = 0;
    s->last_ratio = 0.0f;
    s->initialized = 0;
    // Hold off edge emission until the LTE baseline has converged (one window).
    s->warmup_needed = (int)(lte_win_ms / 1000.0f / (frame_dt_s > 0 ? frame_dt_s : 1.0f));
    s->warmup = s->warmup_needed;
}

void edge_set_thresholds(edge_state_t *s, float theta_open, float theta_close) {
    s->theta_open = theta_open;
    s->theta_close = theta_close;
}

edge_kind_t edge_update(edge_state_t *s, float frame_energy) {
    // RMS-like estimate from per-frame energy (sqrt of power).
    float amp = sqrtf(frame_energy > 0.0f ? frame_energy : 0.0f);

    // Seed both estimates to the first observed level so the ratio starts near 1
    // instead of exploding from a zero baseline.
    if (!s->initialized) {
        s->ste = amp;
        s->lte = amp > 1e-9f ? amp : 1e-9f;
        s->initialized = 1;
        s->last_ratio = 1.0f;
        if (s->warmup > 0) s->warmup--;
        return EDGE_NONE;
    }

    // Fast STE, slow LTE. LTE only tracks while NOT in an active event, so a
    // sustained flow does not drag the baseline up and mask the close edge.
    s->ste += s->ste_alpha * (amp - s->ste);
    if (!s->armed) s->lte += s->lte_alpha * (amp - s->lte);

    float ratio = s->ste / (s->lte > 1e-9f ? s->lte : 1e-9f);
    s->last_ratio = ratio;

    // During warm-up, keep adapting the baseline but never emit an edge.
    if (s->warmup > 0) { s->warmup--; s->confirm = 0; return EDGE_NONE; }

    if (!s->armed) {
        // Look for a rising edge: ratio above θ_open for N consecutive frames.
        if (ratio > s->theta_open) {
            if (++s->confirm >= s->confirm_needed) {
                s->confirm = 0;
                s->armed = 1;
                return EDGE_RISING;
            }
        } else {
            s->confirm = 0;
        }
    } else {
        // Armed: look for the falling edge back toward baseline.
        if (ratio < s->theta_close) {
            if (++s->confirm >= s->confirm_needed) {
                s->confirm = 0;
                s->armed = 0;
                return EDGE_FALLING;
            }
        } else {
            s->confirm = 0;
        }
    }
    return EDGE_NONE;
}

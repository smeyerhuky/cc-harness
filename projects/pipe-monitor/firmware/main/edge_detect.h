// =============================================================================
// edge_detect.h — short-term/long-term energy ratio edge detector.
// firmware/event-detection-and-clips.md. Host-portable (pure math).
// The device emits a HINT only ("rising"/"falling"); fixture attribution is a
// server responsibility and never appears here (event-message.md [HARD]).
// =============================================================================
#ifndef EDGE_DETECT_H
#define EDGE_DETECT_H

#include <stdint.h>

typedef enum { EDGE_NONE = 0, EDGE_RISING, EDGE_FALLING } edge_kind_t;

typedef struct {
    float ste;                // short-term RMS estimate
    float lte;                // long-term RMS (leaky integrator)
    float theta_open;         // server-configurable
    float theta_close;        // server-configurable
    float ste_alpha;          // smoothing for STE (from STE window)
    float lte_alpha;          // smoothing for LTE (from LTE window)
    int   confirm;            // consecutive frames over threshold
    int   confirm_needed;     // EDGE_CONFIRM_FRAMES
    int   armed;              // 1 while above θ_open, prevents re-fire until reset
    float last_ratio;         // most recent STE/LTE, exposed on the event
    int   initialized;        // 0 until the first frame seeds the baseline
    int   warmup;             // frames remaining before edges are emitted
    int   warmup_needed;      // one LTE time-constant of frames
} edge_state_t;

// frame_dt_s: seconds per feature frame (HOP/ID_RATE_HZ). ste_win_ms/lte_win_ms
// set the leaky-integrator time constants.
void edge_init(edge_state_t *s, float theta_open, float theta_close,
               float frame_dt_s, float ste_win_ms, float lte_win_ms,
               int confirm_needed);

void edge_set_thresholds(edge_state_t *s, float theta_open, float theta_close);

// Feed one frame's broadband energy (e.g. sum of linear power over the ID band).
// Returns EDGE_RISING/EDGE_FALLING on a confirmed edge, else EDGE_NONE.
edge_kind_t edge_update(edge_state_t *s, float frame_energy);

#endif // EDGE_DETECT_H

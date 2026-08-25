// =============================================================================
// node_config.h — compile-time constants for the sensor node.
// Values marked [HARD] are load-bearing per the source spec; do not "correct"
// them without reading the referenced spec file. [SOFT] values are defaults.
// =============================================================================
#ifndef NODE_CONFIG_H
#define NODE_CONFIG_H

// ---- Identity ----
#define NODE_ID_DEFAULT      "basement-main"   // overridden by NVS if provisioned

// ---- Sampling / DSP (physics/transients-vs-flow-noise.md, firmware/*) ----
#define ADC_SAMPLE_RATE_HZ   96000     // [HARD] preserves ultrasonic option + decimation margin
#define ID_RATE_HZ           16000     // decimated fixture-ID band
#define DECIM                6         // 96k -> 16k  (ADC_SAMPLE_RATE_HZ / ID_RATE_HZ)
#define NFFT                 512       // continuous-stream FFT size
#define HOP                  1024      // [HARD] frames DO NOT overlap (feature-stream.md)
#define N_BINS               257       // NFFT/2 + 1
#define FRAME_PERIOD_US      64000     // HOP / ID_RATE_HZ = 64 ms -> 15.6 fps
#define LOG_FLOOR_DB         (-96.0f)  // int8 quantization floor

// Ultrasonic path (instrumented but UNPROVEN — physics/leak-noise-bands.md)
#define US_BAND_LO_HZ        35000
#define US_BAND_HI_HZ        45000

// ---- Feature batching (protocol/mqtt-topics.md) ----
#define FRAMES_PER_BATCH     16        // ~1 Hz batches at 15.6 fps

// ---- Edge detector (firmware/event-detection-and-clips.md) ----
#define STE_WIN_MS           32
#define LTE_WIN_MS           10000
#define EDGE_CONFIRM_FRAMES  3         // >= 3 consecutive frames over threshold
#define THETA_OPEN_DEFAULT   6.0f      // [placeholder] server-configurable, tuned Phase 1-2
#define THETA_CLOSE_DEFAULT  2.0f      // [placeholder]

// ---- Ring buffer / clips (event-detection-and-clips.md) ----
#define RING_SECONDS         30        // [HARD] needs 8 MB PSRAM part
#define CLIP_PREROLL_SEC     10
#define CLIP_POSTROLL_SEC    20        // total clip = 30 s

// ---- Chirp / exciter (firmware/chirp-playback.md) — Phase 4 ----
#define CHIRP_F0_HZ          100
#define CHIRP_F1_HZ          20000
#define CHIRP_DUR_S          2
#define CHIRP_REPEATS        8
#define CHIRP_CAPTURE_HZ     48000

// ---- Reliability NFRs (firmware/device-interface.md) ----
#define HEARTBEAT_PERIOD_MS  30000
#define OUTAGE_BUFFER_MIN    5         // [HARD] backfill on reconnect

// ---- MQTT topics (protocol/mqtt-topics.md) ----
#define TOPIC_FEATURES_FMT   "pipe/%s/features"
#define TOPIC_EVENTS_FMT     "pipe/%s/events"
#define TOPIC_STATUS_FMT     "pipe/%s/status"
#define TOPIC_CMD_FMT        "pipe/%s/cmd"

// ---- HTTP (protocol/http-endpoints.md) ----
#define CLIP_ENDPOINT_FMT    "%s/api/v1/nodes/%s/clips"   // base_url, node_id

// ---- I2S GPIO (firmware/signal-chain.md) ----
#define I2S_GPIO_MCLK        16
#define I2S_GPIO_BCLK        17
#define I2S_GPIO_WS          18
#define I2S_GPIO_DIN         15
#define EXCITER_DAC_GPIO     17        // DAC channel to exciter amp (Phase 4; on a DAC-capable pin)

#endif // NODE_CONFIG_H

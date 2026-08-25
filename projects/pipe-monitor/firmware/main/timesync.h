// =============================================================================
// timesync.h — UTC (SNTP) + device-monotonic microseconds.
// [HARD] both are required: UTC to correlate with labels, monotonic to compute
// intervals safely across an NTP step (firmware/device-interface.md).
// =============================================================================
#ifndef TIMESYNC_H
#define TIMESYNC_H
#include <stdint.h>

void    timesync_start(void);        // start SNTP (non-blocking)
int64_t now_utc_us(void);            // wall clock; may step on NTP correction
int64_t now_mono_us(void);           // esp_timer; never steps

#endif // TIMESYNC_H

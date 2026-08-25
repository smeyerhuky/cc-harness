// =============================================================================
// timesync.c — see timesync.h.
// =============================================================================
#ifdef ESP_PLATFORM
#include "timesync.h"
#include "esp_timer.h"
#include "esp_sntp.h"
#include "esp_log.h"
#include <sys/time.h>

void timesync_start(void) {
    esp_sntp_setoperatingmode(ESP_SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, "pool.ntp.org");   // [SOFT] point at a LAN NTP if available
    esp_sntp_init();
}

int64_t now_utc_us(void) {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (int64_t)tv.tv_sec * 1000000LL + tv.tv_usec;
}

int64_t now_mono_us(void) {
    return esp_timer_get_time();   // microseconds since boot; monotonic
}
#else
// Host stub so shared code links in tests if ever needed.
#include "timesync.h"
#include <time.h>
void timesync_start(void) {}
int64_t now_utc_us(void){ struct timespec t; clock_gettime(CLOCK_REALTIME,&t); return (int64_t)t.tv_sec*1000000LL+t.tv_nsec/1000; }
int64_t now_mono_us(void){ struct timespec t; clock_gettime(CLOCK_MONOTONIC,&t); return (int64_t)t.tv_sec*1000000LL+t.tv_nsec/1000; }
#endif

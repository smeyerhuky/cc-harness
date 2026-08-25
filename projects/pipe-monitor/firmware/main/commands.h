// =============================================================================
// commands.h — server->device command dispatch (firmware/device-interface.md).
// set_threshold | start_raw | stop_raw | capture_clip | run_chirp | reboot
// =============================================================================
#ifndef COMMANDS_H
#define COMMANDS_H
#ifdef ESP_PLATFORM

#include "edge_detect.h"

// Wire the command handler to the shared edge-detector state so set_threshold
// takes effect live (thresholds are never hardcoded in firmware [HARD]).
void commands_init(edge_state_t *edge);

// Parse and dispatch one JSON command payload (from the cmd topic).
void commands_handle(const char *json, int len);

// Flags the dispatcher exposes to app_main's loops.
int  commands_raw_mode(void);        // start_raw/stop_raw
int  commands_take_capture_request(void);   // one-shot: capture_clip pressed

#endif // ESP_PLATFORM
#endif // COMMANDS_H

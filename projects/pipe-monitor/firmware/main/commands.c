// =============================================================================
// commands.c — see commands.h. Uses cJSON (bundled with ESP-IDF).
// =============================================================================
#ifdef ESP_PLATFORM
#include "commands.h"
#include "chirp.h"
#include "node_config.h"
#include "cJSON.h"
#include "esp_log.h"
#include "esp_system.h"
#include <string.h>

static const char *TAG = "cmd";
static edge_state_t *s_edge = NULL;
static volatile int s_raw_mode = 0;
static volatile int s_capture_req = 0;

void commands_init(edge_state_t *edge) { s_edge = edge; }
int  commands_raw_mode(void) { return s_raw_mode; }
int  commands_take_capture_request(void) { int v = s_capture_req; s_capture_req = 0; return v; }

void commands_handle(const char *json, int len) {
    cJSON *root = cJSON_ParseWithLength(json, len);
    if (!root) { ESP_LOGW(TAG, "bad JSON"); return; }
    const cJSON *cmd = cJSON_GetObjectItem(root, "cmd");
    if (!cJSON_IsString(cmd)) { cJSON_Delete(root); return; }

    if (!strcmp(cmd->valuestring, "set_threshold")) {
        const cJSON *o = cJSON_GetObjectItem(root, "theta_open");
        const cJSON *c = cJSON_GetObjectItem(root, "theta_close");
        if (s_edge && cJSON_IsNumber(o) && cJSON_IsNumber(c)) {
            edge_set_thresholds(s_edge, (float)o->valuedouble, (float)c->valuedouble);
            ESP_LOGI(TAG, "thresholds set: open=%.2f close=%.2f", o->valuedouble, c->valuedouble);
        }
    } else if (!strcmp(cmd->valuestring, "start_raw")) {
        s_raw_mode = 1; ESP_LOGI(TAG, "raw mode ON (calibration)");
    } else if (!strcmp(cmd->valuestring, "stop_raw")) {
        s_raw_mode = 0; ESP_LOGI(TAG, "raw mode OFF");
    } else if (!strcmp(cmd->valuestring, "capture_clip")) {
        s_capture_req = 1; ESP_LOGI(TAG, "manual clip requested");
    } else if (!strcmp(cmd->valuestring, "run_chirp")) {
        const cJSON *r = cJSON_GetObjectItem(root, "repeats");
        chirp_run(cJSON_IsNumber(r) ? r->valueint : CHIRP_REPEATS);
    } else if (!strcmp(cmd->valuestring, "reboot")) {
        ESP_LOGW(TAG, "reboot"); cJSON_Delete(root); esp_restart();
    } else {
        ESP_LOGW(TAG, "unknown cmd: %s", cmd->valuestring);
    }
    cJSON_Delete(root);
}
#endif // ESP_PLATFORM

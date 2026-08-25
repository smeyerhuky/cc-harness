// =============================================================================
// net_mqtt.c — see net_mqtt.h. esp-mqtt client.
// QoS choices per protocol/mqtt-topics.md:
//   features QoS0 (loss tolerable; node backfills), events QoS1 (a dropped event
//   is a missed transition), status QoS0 retained, cmd QoS1 NOT retained.
// =============================================================================
#ifdef ESP_PLATFORM
#include "net_mqtt.h"
#include "node_config.h"
#include "mqtt_client.h"
#include "esp_log.h"
#include <string.h>
#include <stdio.h>

static const char *TAG = "mqtt";
static esp_mqtt_client_handle_t s_client = NULL;
static cmd_handler_t s_on_cmd = NULL;
static char s_t_features[64], s_t_events[64], s_t_status[64], s_t_cmd[64];
static volatile int s_connected = 0;

static void ev_handler(void *arg, esp_event_base_t base, int32_t id, void *data) {
    (void)arg; (void)base;
    esp_mqtt_event_handle_t e = (esp_mqtt_event_handle_t)data;
    switch ((esp_mqtt_event_id_t)id) {
    case MQTT_EVENT_CONNECTED:
        s_connected = 1;
        esp_mqtt_client_subscribe(s_client, s_t_cmd, 1);
        ESP_LOGI(TAG, "connected; subscribed %s", s_t_cmd);
        break;
    case MQTT_EVENT_DISCONNECTED:
        s_connected = 0;
        break;
    case MQTT_EVENT_DATA:
        if (s_on_cmd && e->topic_len && strncmp(e->topic, s_t_cmd, e->topic_len) == 0)
            s_on_cmd(e->data, e->data_len);
        break;
    default: break;
    }
}

esp_err_t mqtt_start(const char *broker_uri, const char *node_id, cmd_handler_t on_cmd) {
    s_on_cmd = on_cmd;
    snprintf(s_t_features, sizeof s_t_features, TOPIC_FEATURES_FMT, node_id);
    snprintf(s_t_events,   sizeof s_t_events,   TOPIC_EVENTS_FMT,   node_id);
    snprintf(s_t_status,   sizeof s_t_status,   TOPIC_STATUS_FMT,   node_id);
    snprintf(s_t_cmd,      sizeof s_t_cmd,      TOPIC_CMD_FMT,      node_id);

    esp_mqtt_client_config_t cfg = { .broker.address.uri = broker_uri };
    s_client = esp_mqtt_client_init(&cfg);
    if (!s_client) return ESP_FAIL;
    esp_mqtt_client_register_event(s_client, ESP_EVENT_ANY_ID, ev_handler, NULL);
    return esp_mqtt_client_start(s_client);
}

int mqtt_is_connected(void) { return s_connected; }

int mqtt_pub_features(const uint8_t *buf, size_t len) {
    if (!s_connected) return -1;
    return esp_mqtt_client_publish(s_client, s_t_features, (const char *)buf, len, 0, 0);
}
int mqtt_pub_event(const char *json, size_t len) {
    if (!s_connected) return -1;
    return esp_mqtt_client_publish(s_client, s_t_events, json, len, 1, 0);   // QoS1
}
int mqtt_pub_status(const char *json, size_t len) {
    if (!s_connected) return -1;
    return esp_mqtt_client_publish(s_client, s_t_status, json, len, 0, 1);   // QoS0, retained
}
#endif // ESP_PLATFORM

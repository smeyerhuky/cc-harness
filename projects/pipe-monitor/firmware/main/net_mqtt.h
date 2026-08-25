// =============================================================================
// net_mqtt.h — MQTT transport (protocol/mqtt-topics.md).
// features QoS0, events QoS1, status QoS0, cmd QoS1 (subscribed).
// =============================================================================
#ifndef NET_MQTT_H
#define NET_MQTT_H
#ifdef ESP_PLATFORM
#include <stdint.h>
#include <stddef.h>
#include "esp_err.h"

typedef void (*cmd_handler_t)(const char *json, int len);

esp_err_t mqtt_start(const char *broker_uri, const char *node_id, cmd_handler_t on_cmd);
int mqtt_pub_features(const uint8_t *buf, size_t len);   // QoS0
int mqtt_pub_event(const char *json, size_t len);        // QoS1
int mqtt_pub_status(const char *json, size_t len);       // QoS0 (retained)
int mqtt_is_connected(void);

#endif // ESP_PLATFORM
#endif // NET_MQTT_H

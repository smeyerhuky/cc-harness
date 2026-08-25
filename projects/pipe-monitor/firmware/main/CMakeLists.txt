idf_component_register(
    SRCS
        "app_main.c"
        "proto.c"
        "feature_stream.c"
        "edge_detect.c"
        "ring_buffer.c"
        "i2s_capture.c"
        "net_mqtt.c"
        "clip_upload.c"
        "chirp.c"
        "timesync.c"
        "commands.c"
    INCLUDE_DIRS "."
    REQUIRES
        driver          # i2s_std
        esp-dsp         # FFT / windows
        mqtt            # esp-mqtt
        esp_http_client # clip upload
        esp_wifi
        nvs_flash
        esp_timer
        json            # cJSON
        lwip
)

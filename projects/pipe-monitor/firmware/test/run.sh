#!/usr/bin/env bash
# Host unit tests for the firmware's portable modules (no ESP-IDF needed).
set -euo pipefail
cd "$(dirname "$0")"
cc -std=c11 -Wall -Wextra -O2 -o /tmp/pm_test \
   test_proto.c ../main/proto.c ../main/edge_detect.c ../main/feature_stream.c \
   ../main/ring_buffer.c ../main/chirp.c -lm
/tmp/pm_test

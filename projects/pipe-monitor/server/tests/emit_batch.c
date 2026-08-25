// Emits a golden feature batch (firmware serializer) to stdout, so the server's
// Python parser can be tested against the ACTUAL firmware byte layout.
#include "proto.h"
#include <stdio.h>
#include <unistd.h>

int main(void) {
    proto_frame_t f[3];
    for (int i = 0; i < 3; i++) {
        f[i].scale_db = -10.0f - i;
        f[i].ultrasonic_rms = 0.01f * (i + 1);
        for (int k = 0; k < PROTO_BIN_COUNT; k++) f[i].bins[k] = (int8_t)(-(k % 128));
    }
    uint8_t buf[PROTO_HEADER_BYTES + 3 * PROTO_FRAME_BYTES];
    size_t n = proto_serialize_batch(buf, sizeof buf, 3,
                                     1735689600000000LL, 84213000000LL, 64000, f);
    fwrite(buf, 1, n, stdout);
    return 0;
}

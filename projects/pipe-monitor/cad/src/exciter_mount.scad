// =============================================================================
// exciter_mount.scad — slim saddle for the reference-exciter piezo.
// Identical isolation approach; placed ~300 mm along the pipe from the sensor
// (exciter_spacing in config.scad; set by tape measure, not printed rail).
// Build: openscad -o ../stl/exciter_mount.stl exciter_mount.scad
// =============================================================================
include <config.scad>
use <saddle.scad>

saddle(len = exc_len, wrap = exc_wrap_deg, with_foam = false);

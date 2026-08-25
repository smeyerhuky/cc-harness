// =============================================================================
// clamp.scad — sensor saddle (primary piezo) for the 28.6 mm main.
// Renders the sensor saddle with foam-retention lip.
// Build: openscad -o ../stl/clamp.stl clamp.scad
// =============================================================================
include <config.scad>
use <saddle.scad>

saddle(len = sad_len, wrap = sad_wrap_deg, with_foam = true);

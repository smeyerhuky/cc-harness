// =============================================================================
// assembly.scad — VISUAL ONLY. Shows the sensor saddle on the pipe with the
// enclosure nearby and the exciter saddle offset along the pipe. Not for print.
// =============================================================================
include <config.scad>
use <saddle.scad>
use <enclosure.scad>

// A length of pipe for context.
module pipe(len) {
    color("orange") rotate([90,0,0]) cylinder(h = len, r = pipe_r, center = true);
}

pipe_len = exciter_spacing + 120;

// Center the pipe between the sensor (z=0) and exciter (z=exciter_spacing) saddles.
translate([0, 0, exciter_spacing / 2]) pipe(pipe_len);

// Sensor saddle at origin.
color("gray") saddle(len = sad_len, wrap = sad_wrap_deg, with_foam = true);

// Exciter saddle, offset along +Z (pipe axis).
translate([0, 0, exciter_spacing])
    color("lightblue") saddle(len = exc_len, wrap = exc_wrap_deg, with_foam = false);

// Enclosure sitting beside the pipe (mounted to a joist in reality).
translate([pipe_r + 55, 0, 20]) color("seagreen") body();

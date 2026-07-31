// ============================================================================
// ring.scad — parametric torus ring (the maille unit)
// One job: produce a single ring of given wire diameter + inner diameter,
// optionally tilted, at a given centre. Field rings and crease rings both
// come from here with different (wd, id).
// ============================================================================

include <config.scad>

// A torus: tube of diameter `wd`, hole of diameter `id`.
// Centreline radius = (id + wd)/2.
module ring(wd = WD, id = ID, fn = $fn) {
    R = (id + wd) / 2;
    rotate_extrude($fn = fn)
        translate([R, 0, 0])
            circle(d = wd, $fn = max(16, fn / 2));
}

// A ring tilted `tilt` degrees about the Y axis (row axis), placed at `center`.
// This is the orientation used for E4-1 rings that lean +tilt / -tilt.
module ring_tilted(center = [0, 0, 0], tilt = TILT, wd = WD, id = ID, fn = $fn) {
    translate(center)
        rotate([0, tilt, 0])
            ring(wd = wd, id = id, fn = fn);
}

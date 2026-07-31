// ============================================================================
// link.scad — interchangeable maille link primitives for the unit comparison
// (round E4-1 ring  vs  square "box link" à la NASA space fabric).
// Both use a round wire cross-section (WD) and a clear inner span (ID), so they
// interlink with the same M1-verified opposite-tilt geometry.
// ============================================================================

include <../src/config.scad>

// round link = torus (same as src/ring.scad)
module round_link(wd = WD, id = ID, fn = $fn) {
    R = (id + wd) / 2;
    rotate_extrude($fn = fn) translate([R, 0, 0]) circle(d = wd, $fn = max(16, fn/2));
}

// square link = rounded-square loop of round wire.
// side = inner clear span; corner radius keeps it printable and articulating.
module square_link(wd = WD, id = ID, corner = 2.2, fn = $fn) {
    half = id/2 + wd/2;                 // centreline half-span (wire centre)
    r    = corner;                      // corner radius on the centreline path
    // four corner arcs (quarter tori) + four straight edges (cylinders)
    for (sx = [-1, 1], sy = [-1, 1])
        translate([sx*(half - r), sy*(half - r), 0])
            rotate([0, 0, (sx>0? (sy>0?0:270) : (sy>0?90:180))])
                rotate_extrude(angle = 90, $fn = fn)
                    translate([r, 0, 0]) circle(d = wd, $fn = max(16, fn/2));
    // edges
    for (sy = [-1, 1])
        translate([-(half - r), sy*half, 0]) rotate([0, 90, 0])
            cylinder(h = 2*(half - r), d = wd, $fn = max(16, fn/2));
    for (sx = [-1, 1])
        translate([sx*half, -(half - r), 0]) rotate([-90, 0, 0])
            cylinder(h = 2*(half - r), d = wd, $fn = max(16, fn/2));
}

// dispatcher
module link(shape = "round") {
    if (shape == "square") square_link();
    else                   round_link();
}

// ============================================================================
// sheet.scad — flat European 4-in-1 maille sheet (VERIFIED weave), for renders.
// Row-brick weave: adjacent rows lean +/-WEAVE_TILT, odd rows staggered px/2,
// all rings on the bed. Verified collision-free (fused=0, clearance >= GAP) with
// every interior ring interlinking all 4 neighbours (|Lk|=1). See src/config.scad.
//
//   SHAPE = "round" | "square"   COLS, ROWS = patch extent
// Printable full-bed plates are generated with tools/build_plate.py (instancing),
// since OpenSCAD/CGAL can't export ~1000 rings; this file is for preview renders.
// ============================================================================

include <../src/config.scad>
use <link.scad>

SHAPE = "round";
COLS  = 8;
ROWS  = 9;

PX = (SHAPE == "square") ? WEAVE_PX_SQUARE : WEAVE_PX_ROUND;
PY = (SHAPE == "square") ? WEAVE_PY_SQUARE : WEAVE_PY_ROUND;
LIFT = (ID + WD)/2 * sin(WEAVE_TILT) + WD/2;

module sheet() {
    for (r = [0 : ROWS - 1]) {
        tilt = (r % 2 == 0) ? WEAVE_TILT : -WEAVE_TILT;
        for (c = [0 : COLS - 1]) {
            x = c * PX + (r % 2) * (PX / 2);
            color((r % 2 == 0) ? [0.60,0.64,0.70] : [0.50,0.54,0.62])
            translate([x, r * PY, LIFT]) rotate([0, tilt, 0]) link(SHAPE);
        }
    }
}

sheet();

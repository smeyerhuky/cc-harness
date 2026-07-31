// ============================================================================
// sheet.scad — wider 2D maille sheet (single X/Y grid) for the stress test.
// Diagonal E4-1 lattice from the M1-verified link vector: link (a,b) sits at
// (a+b)*VX, (a-b)*VY with tilt alternating by (a+b) parity, so every orthogonal
// lattice neighbour is an opposite-tilt interlink at the verified (VX, VY) offset.
//
//   SHAPE = "round" | "square"
//   COLS, ROWS  : lattice extent
//   ZW          : woven-height Z offset (over/under) to clear same-tilt neighbours
//   FLEX        : articulation perturbation (deg) — swept by kinematic_scan.py
// ============================================================================

include <../src/config.scad>
use <link.scad>

SHAPE = "round";
COLS  = 6;
ROWS  = 6;
ZW    = 0;      // tune so the whole-assembly collision gate passes
FLEX  = 0;      // rock each link about its axis (range-of-motion stress)

T    = LINK_TILT;
VX   = LINK_DX;
VY   = LINK_DY;
LIFT = (ID + WD)/2 * sin(T) + WD/2 + ZW;   // keep everything above the bed

module sheet() {
    for (a = [0 : COLS - 1])
        for (b = [0 : ROWS - 1]) {
            even = ((a + b) % 2 == 0);
            tilt = even ? T : -T;
            x = (a + b) * VX;
            y = (a - b) * VY;
            z = LIFT + ZW * (a % 2);                 // woven over/under by column parity
            ft = tilt + (even ? FLEX : -FLEX);       // articulation
            color(even ? [0.60,0.64,0.70] : [0.50,0.54,0.62])
            translate([x, y, z]) rotate([0, ft, 0]) link(SHAPE);
        }
}

sheet();

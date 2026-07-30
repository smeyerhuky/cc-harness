// ============================================================================
// coupon_plate.scad — M1 print-in-place test plate (SPEC §9 / M1) [PRINTABLE+LINKED]
// Three GENUINELY INTERLINKED ring pairs (Lk = +1 each), printed as one job.
// Opposite tilt (+30 / -30) makes the rings link; both feet on the bed => no
// floating islands, no support. Print at 0.2mm / 0.4mm nozzle and see which gap
// releases without fusing -> picks the real design clearance G.
//
//   pair @ dx 3.7 -> ~0.31 mm gap (tight)
//   pair @ dx 3.4 -> ~0.40 mm gap (nominal)
//   pair @ dx 3.1 -> ~0.51 mm gap (safe)
// dx->gap MEASURED (check_fit.py); interlink PROVEN (linking_number.py, Lk=+1).
// ============================================================================

include <config.scad>
use <ring.scad>

TILT = 30;
DY   = 3.0;
LIFT = (ID + WD)/2 * sin(TILT) + WD/2;

// [dx, gap_label]
LADDER = [ [3.7, 0.30], [3.4, 0.40], [3.1, 0.50] ];

GROUP_SPACING_Y = 26;

module pair(dx) {
    translate([0,  0,  LIFT]) rotate([0,  TILT, 0]) ring();   // ring A (+TILT)
    translate([dx, DY, LIFT]) rotate([0, -TILT, 0]) ring();   // ring B (-TILT) threads A
}

for (i = [0 : len(LADDER) - 1])
    translate([0, i * GROUP_SPACING_Y, 0])
        pair(LADDER[i][0]);

// ============================================================================
// coupon_plate.scad — M1 print-in-place test plate (SPEC §9 / M1)
// Four linked-ring pairs printed as one job:
//   pair 0: slack articulating pair (shift 0)     -> proves free movement
//   pair 1: gap 0.50 mm  (shift 2.70)  } tolerance ladder -> find the fusing
//   pair 2: gap 0.40 mm  (shift 2.80)  } floor for this P1S / PLA / profile
//   pair 3: gap 0.30 mm  (shift 2.90)  }
// Shift->gap values were MEASURED with check_fit.py (trust the boolean).
//
// NOTE (orientation): ring B currently prints axis-vertical. Print pose is a
// provisional; the printable E4-1 lean pose is finalized at M2. This plate is
// valid for topology + the fusing-floor test as-is.
// ============================================================================

include <config.scad>
use <ring.scad>

// shift values calibrated to target gaps (measured, not assumed)
PAIRS = [
    // [shift,  gap_label]
    [0.00, 0.00],   // slack articulating
    [2.70, 0.50],
    [2.80, 0.40],
    [2.90, 0.30],
];

PAIR_SPACING_Y = 20;   // centre-to-centre spacing between pairs on the bed

module coupon_pair(offset = 4.8, shift = 0) {
    ring();                                                  // ring A, axis Z
    translate([offset, shift, 0]) rotate([90, 0, 0]) ring(); // ring B, threads A
}

for (i = [0 : len(PAIRS) - 1])
    translate([0, i * PAIR_SPACING_Y, OD/2])   // lift so lowest ring point ~ on bed
        coupon_pair(offset = 4.8, shift = PAIRS[i][0]);

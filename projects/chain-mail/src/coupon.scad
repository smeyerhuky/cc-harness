// ============================================================================
// coupon.scad — M1 print-in-place linkage coupon (SPEC §9 / M1)  [PRINTABLE + LINKED]
// Two OPPOSITE-tilted rings: ring A leans +TILT, ring B leans -TILT, offset
// diagonally. Opposite tilt => non-parallel planes => the rings genuinely
// INTERLINK (Gauss linking number Lk = +1), not merely sit side by side.
// Both rings rest a foot on the bed (z=0) => no floating, no support.
//
// Two independent checks gate this geometry:
//   check_fit.py       -> collision 0, min clearance = the design gap
//   linking_number.py  -> |Lk| = 1  (proves topological interlink)
// At TILT 30, dy 3, the gap is set by dx:
//   dx 3.7 -> 0.31 mm   dx 3.4 -> 0.40 mm   dx 3.1 -> 0.51 mm   (all Lk +1)
//
// -D overrides: PART (-1 both / 0 A / 1 B), COUPON_TILT, COUPON_DX, COUPON_DY
// ============================================================================

include <config.scad>
use <ring.scad>

PART        = -1;
COUPON_TILT = 30;
COUPON_DX   = 3.4;   // -> ~0.40 mm gap (nominal)
COUPON_DY   = 3.0;

LIFT = (ID + WD)/2 * sin(COUPON_TILT) + WD/2;   // low point rests on the bed

module coupon_ring_A()                                       // leans +TILT
    translate([0, 0, LIFT]) rotate([0,  COUPON_TILT, 0]) ring();
module coupon_ring_B()                                       // leans -TILT, threads A
    translate([COUPON_DX, COUPON_DY, LIFT]) rotate([0, -COUPON_TILT, 0]) ring();

if (PART == 0)      coupon_ring_A();
else if (PART == 1) coupon_ring_B();
else { coupon_ring_A(); coupon_ring_B(); }

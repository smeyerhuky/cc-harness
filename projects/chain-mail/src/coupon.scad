// ============================================================================
// coupon.scad — M1 two-ring print-in-place linkage coupon (SPEC §8 / M1)
// Canonical perpendicular chain-link pair: ring A (axis Z) + ring B (axis Y)
// offset along X so B threads A's hole. Purpose: validate print-in-place
// release + MEASURE the real gap between linked wires against GAP.
// Exact E4-1 tilt clearances are validated later at the M2 swatch.
//
// Overridable at CLI with -D:
//   PART           : -1 = both (visual), 0 = ring A only, 1 = ring B only
//   COUPON_OFFSET  : centre-to-centre distance along X between the two rings
// ============================================================================

include <config.scad>
use <ring.scad>

PART          = -1;
COUPON_OFFSET = 4.8;   // = (ID+WD)/2 nominal; centred slack pose
COUPON_SHIFT  = 0;     // lateral (Y) shift of ring B — pushes B toward one side
                       // of A's hole to force a controlled tightest gap (tolerance ladder)

module coupon_ring_A() ring();                                  // axis Z, at origin
module coupon_ring_B() translate([COUPON_OFFSET, COUPON_SHIFT, 0])
                           rotate([90, 0, 0]) ring();           // axis Y, threads A

if (PART == 0)      coupon_ring_A();
else if (PART == 1) coupon_ring_B();
else { coupon_ring_A(); coupon_ring_B(); }

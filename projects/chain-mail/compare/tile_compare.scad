// ============================================================================
// tile_compare.scad — side-by-side print-in-place unit comparison (M2)
// A small woven maille strip built from either round rings or square box-links,
// using the M1-verified interlink: adjacent links lean +T / -T (opposite tilt),
// diagonal offset, each link's low point on the bed. Print both, compare drape /
// pack / printability on the P1S.
//
//   SHAPE = "round" | "square"
//   PART  = -1 both (visual) | 0 A-links only | 1 B-links only (for check_fit)
// ============================================================================

include <../src/config.scad>
use <link.scad>

SHAPE = "round";
PART  = -1;
LINKS = 9;             // links in the woven zigzag band

T  = LINK_TILT;        // 30
DX = LINK_DX;          // 3.7  (verified: opposite-tilt neighbours interlink at (DX,DY), gap=GAP)
DY = LINK_DY;          // 3.0
LIFT = (ID + WD)/2 * sin(T) + WD/2;

// Woven zigzag band (2 courses): consecutive links alternate lean +T/-T and sit
// at the M1-verified diagonal offset (DX, +-DY), so every neighbour is interlinked
// and same-tilt links (2 apart, (2*DX,0)) clear. A full 2D sheet (many courses)
// is the woven-height M2 problem and is intentionally not attempted here.
function is_A(i) = (i % 2 == 0);

module place(i) {
    tilt = is_A(i) ? T : -T;
    x = i * DX;
    y = (i % 2) * DY;                       // 0, 3, 0, 3 ... -> zigzag = 2 courses
    translate([x, y, LIFT]) rotate([0, tilt, 0])
        color(is_A(i) ? [0.60,0.64,0.70] : [0.50,0.54,0.62]) link(SHAPE);
}

for (i = [0 : LINKS-1])
    if (PART == -1 || (PART == 0 && is_A(i)) || (PART == 1 && !is_A(i)))
        place(i);

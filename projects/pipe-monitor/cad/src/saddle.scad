// =============================================================================
// saddle.scad — parametric pipe saddle that carries a 27 mm piezo disc.
// Shared by clamp.scad (sensor) and exciter_mount.scad (reference exciter).
// Frame: pipe axis = Z; pipe center at origin; crown (piezo) at +Y.
//
// Band retention is ADDITIVE (raised ridges the hose-clamp band nests between)
// rather than subtractive grooves — grooves cut through the thin side legs and
// detach a wing. Ridges keep the part a single manifold solid.
// =============================================================================
include <config.scad>

// 2D wedge polygon spanning [a0,a1] degrees, radius r, apex at origin.
module sector2d(r, a0, a1) {
    step = 3;
    pts = concat(
        [[0, 0]],
        [ for (a = [a0 : step : a1]) [r * cos(a), r * sin(a)] ],
        [[r * cos(a1), r * sin(a1)]]
    );
    polygon(pts);
}

function outer_r_of() = pipe_r + seat_clear + sad_wall;

// 2D cross-section of the wrap shell (annular sector centered on +Y / 90 deg).
module saddle_section(rc, outer_r, wrap_deg) {
    intersection() {
        difference() { circle(r = outer_r); circle(r = rc); }
        sector2d(outer_r + 1, 90 - wrap_deg / 2, 90 + wrap_deg / 2);
    }
}

// Raised ridge (additive) that stops the band sliding along the pipe axis.
module band_ridge(z, wrap_deg) {
    orr = outer_r_of();
    translate([0, 0, z])
        linear_extrude(height = 2.0, center = true)
            intersection() {
                difference() { circle(orr + band_t + 1.0); circle(orr - eps); }
                sector2d(orr + band_t + 2, 90 - wrap_deg/2, 90 + wrap_deg/2);
            }
}

// Crown boss: extra material at +Y so the piezo pocket has depth to live in.
module crown_boss(len) {
    rc = pipe_r + seat_clear;
    boss_w = piezo_pocket_d + 2 * sad_wall;      // across the pipe (X)
    boss_l = min(len - 2, piezo_pocket_d + 8);   // along the pipe (Z)
    boss_top = rc + piezo_pocket_h + pad_recess_h + 1.6;
    translate([-boss_w/2, rc - 3, -boss_l/2])
        cube([boss_w, boss_top - (rc - 3), boss_l]);
}

// Piezo pocket + compliant-pad recess + wire slot, cut radially at the crown.
module piezo_cavity(rc, len) {
    // Pocket for the disc (free fit), opening toward the pipe (-Y into channel).
    translate([0, rc - eps, 0]) rotate([-90, 0, 0])
        cylinder(h = piezo_pocket_h, d = piezo_pocket_d);
    // Compliant-pad recess behind the disc (narrower).
    translate([0, rc - eps + piezo_pocket_h, 0]) rotate([-90, 0, 0])
        cylinder(h = pad_recess_h + eps, d = pad_recess_d);
    // Wire exit slot straight out through the crown.
    translate([-wire_slot_w/2, rc, -wire_slot_w/2])
        cube([wire_slot_w, outer_r_of() + pad_recess_h + 6, wire_slot_w]);
}

// Foam-retention lip: two end flanges the closed-cell foam tucks under.
module foam_lip(len, wrap_deg) {
    orr = outer_r_of();
    for (s = [-1, 1])
        translate([0, 0, s * (len/2 - foam_lip_t/2)])
            linear_extrude(height = foam_lip_t, center = true)
                intersection() {
                    difference() { circle(orr + foam_lip_h); circle(orr - eps); }
                    sector2d(orr + foam_lip_h + 1, 90 - wrap_deg/2 - 6, 90 + wrap_deg/2 + 6);
                }
}

// Full saddle. with_foam adds the foam retention flanges (sensor only).
module saddle(len, wrap, with_foam = true) {
    rc  = pipe_r + seat_clear;
    orr = outer_r_of();
    band_gap = band_w / 2 + 1.0;   // ridges flank a central band seat
    difference() {
        union() {
            linear_extrude(height = len, center = true) saddle_section(rc, orr, wrap);
            crown_boss(len);
            band_ridge( band_gap, wrap);
            band_ridge(-band_gap, wrap);
            if (with_foam) foam_lip(len, wrap);
        }
        piezo_cavity(rc, len);
        // Re-assert the pipe bore so nothing intrudes on the pipe surface.
        rotate([90, 0, 0]) cylinder(h = len + 6, r = rc, center = true);
    }
}

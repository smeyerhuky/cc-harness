// =============================================================================
// enclosure.scad — hybrid printed shell for the sensor-node PCB.
// Printed shell + copper-lined Faraday pocket over the charge-amp summing node
// + single-point ground boss. Substitutes for the spec's die-cast aluminium box
// while preserving the shielding intent (see kb/decisions/enclosure-hybrid.md).
//
// Select the part to render with -D:
//   openscad -D 'part="body"' -o ../stl/enclosure_body.stl enclosure.scad
//   openscad -D 'part="lid"'  -o ../stl/enclosure_lid.stl  enclosure.scad
// =============================================================================
include <config.scad>

part = "body";   // "body" | "lid"

outer_x = enc_ix + 2 * enc_wall;
outer_y = enc_iy + 2 * enc_wall;
body_h  = enc_floor + enc_iz;

// Corner post XY positions (shared by body bosses and lid screw holes).
function corner_xy() = [
    for (sx = [-1, 1], sy = [-1, 1])
        [ sx * (enc_ix / 2 - screw_boss_d / 2 + eps),
          sy * (enc_iy / 2 - screw_boss_d / 2 + eps) ]
];

// PCB standoff XY positions (DevKitC-1 mounting rectangle, centered).
function pcb_xy() = [
    for (sx = [-1, 1], sy = [-1, 1])
        [ sx * (pcb_x / 2 - pcb_hole_inset), sy * (pcb_y / 2 - pcb_hole_inset) ]
];

module tube(d_out, d_in, h) {
    difference() { cylinder(h = h, d = d_out); translate([0,0,-eps]) cylinder(h = h + 2*eps, d = d_in); }
}

// Ground-boss XY position (center of the copper pocket).
function ground_xy() = [ -enc_ix/2 + enc_wall + cu_pocket_x/2,
                         -enc_iy/2 + enc_wall + cu_pocket_y/2 ];

module body() {
    union() {
        difference() {
            union() {
                // Outer shell with open top.
                difference() {
                    translate([-outer_x/2, -outer_y/2, 0]) cube([outer_x, outer_y, body_h]);
                    translate([-enc_ix/2, -enc_iy/2, enc_floor])
                        cube([enc_ix, enc_iy, enc_iz + eps]);
                }
                // Corner screw bosses (floor to rim).
                for (p = corner_xy())
                    translate([p[0], p[1], enc_floor]) cylinder(h = enc_iz, d = screw_boss_d);
                // PCB standoffs.
                for (p = pcb_xy())
                    translate([p[0], p[1], enc_floor]) cylinder(h = standoff_h, d = standoff_d);
            }
            // Copper-lined Faraday pocket recessed into the floor (top face of floor).
            translate([ground_xy()[0], ground_xy()[1], enc_floor - cu_pocket_d])
                translate([-cu_pocket_x/2, -cu_pocket_y/2, 0])
                    cube([cu_pocket_x, cu_pocket_y, cu_pocket_d + eps]);
            // Corner screw pilots.
            for (p = corner_xy())
                translate([p[0], p[1], enc_floor + enc_iz - 8]) cylinder(h = 8 + eps, d = screw_pilot_d);
            // PCB standoff pilots.
            for (p = pcb_xy())
                translate([p[0], p[1], enc_floor - eps]) cylinder(h = standoff_h + eps, d = standoff_pilot);
            // Two slit cable glands through the +Y wall.
            for (gx = [-16, 16]) {
                translate([gx, enc_iy/2 - eps, enc_floor + 10])
                    rotate([-90, 0, 0]) cylinder(h = enc_wall + 2*eps, d = gland_d);
                translate([gx - gland_slit_w/2, enc_iy/2 - eps, enc_floor + 10])
                    cube([gland_slit_w, enc_wall + 2*eps, enc_iz]);
            }
        }
        // Single-point ground boss — unioned AFTER the pocket cut so the recess
        // cannot sever its base. Starts below the floor top so it OVERLAPS the
        // floor slab (a touching coincident face would read as a separate volume).
        translate([ground_xy()[0], ground_xy()[1], 0])
            difference() {
                cylinder(h = enc_floor + ground_boss_h, d = ground_boss_d);
                // blind ground-screw pilot from the top
                translate([0, 0, enc_floor]) cylinder(h = ground_boss_h + eps, d = ground_tap_d);
            }
    }
}

module lid() {
    lid_top = enc_wall;   // top plate thickness
    difference() {
        union() {
            // Top plate covering the outer footprint.
            translate([-outer_x/2, -outer_y/2, 0]) cube([outer_x, outer_y, lid_top]);
            // Register lip that drops into the cavity (snug clearance).
            translate([0,0,-lid_reg])
                linear_extrude(height = lid_reg + eps)
                    difference() {
                        square([enc_ix - 2*lid_reg_clear, enc_iy - 2*lid_reg_clear], center = true);
                        square([enc_ix - 2*lid_reg_clear - 4, enc_iy - 2*lid_reg_clear - 4], center = true);
                    }
        }
        // Corner screw clearance holes.
        for (p = corner_xy())
            translate([p[0], p[1], -lid_reg - eps]) cylinder(h = lid_top + lid_reg + 2*eps, d = screw_clear_d);
        // Countersink cups on the top face.
        for (p = corner_xy())
            translate([p[0], p[1], lid_top - 1.6]) cylinder(h = 1.6 + eps, d1 = screw_clear_d, d2 = screw_clear_d + 3);
    }
}

if (part == "body") body();
else if (part == "lid") lid();

---
type: "Code Example"
title: "Homework 2: Print-in-Place Hinge"
description: "Practical OpenSCAD implementation example."
resource: "Innate Knowledge"
tags: ['openscad', 'hinge', 'clearance', 'print-in-place']
timestamp: "2026-07-24"
---

# Print-in-Place Hinge

Print-in-place mechanisms require careful tuning of the `clearance` variable. If the gap is too small, the parts fuse due to layer expansion (thermal strain). If too large, the joint is sloppy.

```openscad
// Print-in-Place Hinge
$fn = 64;

// --- Variables ---
hinge_length = 30;
hinge_radius = 5;
clearance = 0.4; // 0.4mm is a standard safe clearance for FDM

// --- Main Execution ---
left_leaf();
right_leaf();

// --- Modules ---
module left_leaf() {
    difference() {
        union() {
            // Main body
            translate([-20, -hinge_length/2, -hinge_radius])
                cube([20, hinge_length, hinge_radius*2]);
            // Outer knuckles
            translate([0, -hinge_length/2, 0]) rotate([-90, 0, 0]) cylinder(h=10, r=hinge_radius);
            translate([0, hinge_length/2 - 10, 0]) rotate([-90, 0, 0]) cylinder(h=10, r=hinge_radius);
        }
        // Cutout for the center pin (with clearance!)
        translate([0, -10 - clearance, 0]) 
            rotate([-90, 0, 0]) 
            cylinder(h=20 + 2*clearance, r=hinge_radius + clearance);
    }
}

module right_leaf() {
    union() {
        // Main body
        translate([0, -10, -hinge_radius])
            cube([20, 20, hinge_radius*2]);
        // Center Pin
        translate([0, -10, 0]) 
            rotate([-90, 0, 0]) 
            cylinder(h=20, r=hinge_radius * 0.6); // Smaller radius to fit inside knuckles
    }
}
```

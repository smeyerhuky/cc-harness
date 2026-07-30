---
type: "Code Example"
title: "Homework 1: Parametric Enclosure"
description: "Practical OpenSCAD implementation example."
resource: "Innate Knowledge"
tags: ['openscad', 'parametric', 'difference', 'modules']
timestamp: "2026-07-24"
---

# Parametric Enclosure

This is a fundamental example of how to use variables and the `difference()` boolean operation to create a fully parametric, printable box with a lid.

```openscad
// Parametric Box with Lid

// --- Variables ---
box_length = 50;
box_width = 30;
box_height = 20;
wall_thickness = 2;
tolerance = 0.2; // Clearance for the lid to fit

// --- Main Execution ---
translate([0, 0, 0])
    box_base();

translate([0, box_width + 10, 0])
    box_lid();

// --- Modules ---
module box_base() {
    difference() {
        // Outer shell
        cube([box_length, box_width, box_height]);
        
        // Inner void (shifted up by wall_thickness to leave a floor)
        translate([wall_thickness, wall_thickness, wall_thickness])
            cube([box_length - 2*wall_thickness, 
                  box_width - 2*wall_thickness, 
                  box_height]);
    }
}

module box_lid() {
    // Lid top
    cube([box_length, box_width, wall_thickness]);
    
    // Inner lip (needs tolerance so it fits inside the base)
    translate([wall_thickness + tolerance, 
               wall_thickness + tolerance, 
               wall_thickness])
        cube([box_length - 2*(wall_thickness + tolerance), 
              box_width - 2*(wall_thickness + tolerance), 
              wall_thickness]);
}
```

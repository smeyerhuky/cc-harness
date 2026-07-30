---
type: "Code Example"
title: "Homework 3: Planetary Gear Spinner"
description: "Practical OpenSCAD implementation example."
resource: "Innate Knowledge"
tags: ['openscad', 'gears', 'math', 'for-loop']
timestamp: "2026-07-24"
---

# Planetary Gear Spinner

This demonstrates advanced mathematical placement using trigonometry (`sin`/`cos`) and `for` loops to instantiate multiple planet gears in orbit. *(Note: Actual involute gear tooth profiles require complex math, so this uses simple cylinder stand-ins to demonstrate the layout logic).*

```openscad
// Planetary Gear Layout Logic
$fn = 50;

// --- Variables ---
sun_radius = 15;
planet_radius = 10;
num_planets = 4;
thickness = 8;
clearance = 0.5;

// Calculated ring inner radius
ring_radius = sun_radius + (2 * planet_radius);

// --- Assembly ---
sun_gear();
planets();
ring_gear();

// --- Modules ---
module sun_gear() {
    color("gold") cylinder(h=thickness, r=sun_radius, center=true);
    // Center bearing hole
    #cylinder(h=thickness+2, r=4.1, center=true); // 8mm bearing hole
}

module planets() {
    // Calculate distance from center to planet centers
    orbit_distance = sun_radius + planet_radius + clearance;
    
    color("silver")
    for (i = [0 : num_planets - 1]) {
        angle = i * (360 / num_planets);
        x = orbit_distance * cos(angle);
        y = orbit_distance * sin(angle);
        
        translate([x, y, 0])
            cylinder(h=thickness, r=planet_radius, center=true);
    }
}

module ring_gear() {
    color("gray")
    difference() {
        cylinder(h=thickness, r=ring_radius + 5, center=true); // Outer casing
        cylinder(h=thickness+2, r=ring_radius + clearance, center=true); // Inner void
    }
}
```

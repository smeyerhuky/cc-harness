---
type: "Example"
title: "Transparent PETG Glass"
description: "Complex slicing configuration for optical clarity"
resource: "Web Synthesis"
tags: ['petg', 'transparent', 'glass', 'slicing', 'example']
timestamp: "2026-07-24"
---

# How to 3D Print Glass-Like Transparent PETG

Achieving optical clarity with FDM 3D printing requires precise manipulation of the slicer engine to eliminate voids and internal scattering interfaces. By carefully controlling extrusion, cooling, and toolpaths, you can force layers to fuse completely.

## Slicer Strategy (The "Secret Sauce")
Adjust these settings in your slicer (e.g., Bambu Studio, PrusaSlicer, Cura):

*   **Nozzle Temperature (Increase):** Print at the higher end of the PETG temperature range (**~250°C - 265°C**). The hotter plastic flows better and fuses into the surrounding lines, filling in any gaps.
*   **Print Speed (Lower):** Slow down the print significantly (**15 mm/s to 30 mm/s**). Slow speeds give the plastic time to melt completely and lay down smoothly without stretching or creating voids.
*   **Part Cooling Fan (Off / Very Low):** Turn the cooling fan off entirely, or set it very low (0% to 20%). You want the plastic to stay molten for as long as possible so it can blend and merge into a solid, gapless block.
*   **Infill Direction (One Direction):** This is a key configuration. Standard infill criss-crosses, which scatters light. 
    * Set your infill pattern to **Aligned Rectilinear** or **Lines**.
    * Set the Infill Direction angle to a single direction (e.g., **0° or 90°**). This forces the printer to draw lines perfectly parallel to one another on every layer.
*   **Infill Density:** Set this to **100%**. You want a solid block of plastic with no air pockets.
*   **Flow Rate / Extrusion Multiplier:** Slightly over-extrude to force plastic into any remaining microscopic gaps. Try setting the flow rate to **102% - 105%**.
*   **Layer Height:** Use thicker layers (e.g., **0.28mm or 0.3mm** on a 0.4mm nozzle). Fewer layers mean fewer layer-line interfaces for the light to pass through.

## Hardware Preparation
1. **Dry your filament**: This is **crucial**. Moisture in PETG turns to steam when heated, creating tiny micro-bubbles that will turn your print cloudy. Dry the filament in a filament dryer (at ~65°C) for at least 6-8 hours before printing.
2. **Use a Smooth Build Plate**: A textured PEI plate will transfer a matte/bumpy finish to the bottom of your print, making it opaque. Use a **smooth PEI plate** or a **glass bed** for a perfectly flat, clear bottom surface.

## Post-Processing
If the printed part still looks slightly "frosted" due to the top surface lines:
1. **Sanding:** Gently wet-sand the top surface starting with 400 grit and moving up to 2000+ grit.
2. **Clear Coat:** Apply a very thin layer of glossy clear coat spray paint, clear epoxy, or clear nail polish to the top surface. This fills in the microscopic ridges left by the nozzle and immediately turns the frosted look into a crystal-clear glass look.

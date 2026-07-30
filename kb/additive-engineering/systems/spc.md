---






type: "Concept"
title: "Statistical Process Control (SPC)"
description: "Use of statistical methods to monitor and control a process."
resource: "Manufacturing Engineering and Technology, 8th ed. by S. Kalpakjian"
tags: ["quality", "statistics", "control-charts"]
timestamp: "2025-05-01"
---

# Statistical Process Control (SPC)

SPC is essential for maintaining product quality in the presence of inherent process variations.

## Key Concepts
* **Common Cause Variation**: Inherent, natural variation in the system (e.g., thermal fluctuations, ambient humidity). It forms a stable, predictable distribution.
* **Special Cause Variation**: Unpredictable variation due to assignable causes (e.g., tool breakage, defective raw material).
* **Process Capability Index ($C_p$ / $C_{pk}$)**: Measures the relationship between the natural process variation ($6\sigma$) and the engineering specification limits (USL, LSL).
  $$ C_p = \frac{USL - LSL}{6\sigma} $$
  A $C_p \ge 1.33$ is generally required for a process to be considered capable.

## Control Charts
* **$\overline{X}$ (X-bar) Chart**: Monitors the process mean over time.
* **$R$ (Range) Chart**: Monitors the process variation over time.
A process is "in control" if sample points fall within the Upper and Lower Control Limits (UCL, LCL) and exhibit no non-random patterns.

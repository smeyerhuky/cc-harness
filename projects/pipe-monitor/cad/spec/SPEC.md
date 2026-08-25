# CAD Spec — Acoustic Pipe Monitor mounting + enclosure

Frozen design spec for the printable hardware. Derived from the source deep-wiki
`hardware/mounting-and-grounding.md`, `hardware/reference-exciter.md`, and
`hardware/bill-of-materials.md`, plus the operator decisions (1″ copper, hybrid enclosure).

## Parts

| Part | File | Function |
|---|---|---|
| Sensor saddle | `src/clamp.scad` | Clamps the 27 mm piezo onto the pipe crown, Kapton-isolated, hose-clamp-retained, foam-shrouded |
| Enclosure body | `src/enclosure.scad` (`part="body"`) | Houses the PCB; copper-lined amp pocket + single-point ground boss |
| Enclosure lid | `src/enclosure.scad` (`part="lid"`) | Friction+screw lid |
| Exciter saddle | `src/exciter_mount.scad` | Slim saddle for the second piezo, placed 300 mm along the pipe |

## Key dimensions (single source of truth = `src/config.scad`)

| Parameter | Value | Rationale |
|---|---|---|
| Pipe OD | **28.6 mm** | 1″ nominal copper (operator input) |
| Saddle seat clearance | 0.2 mm | Snug hug on the pipe; the band provides clamp force |
| Piezo disc Ø | 27 mm | Spec BOM item 4 |
| Piezo pocket Ø | 27.6 mm | +0.6 mm free-fit (disc is fragile; must not press-fit) |
| Kapton+grease standoff | 0.25 mm | Electrical isolation gap piezo↔pipe (the ground-loop mitigation) |
| Compliant-pad recess | Ø24 × 3 mm | Silicone/neoprene behind the disc maintains contact force through thermal cycling |
| Hose-clamp band | 12.7 mm wide, 1.0 mm thick | Standard 1/2″ stainless band; routed in external channels |
| Structural wall | 3.0 mm | ≥2× extrusion; stiffness for clamp force |
| Enclosure internal | 92 × 62 × 32 mm | ESP32-S3-DevKitC-1 (≈63×26) + PCM1808 breakout + charge-amp protoboard |
| Enclosure wall | 2.4 mm | 6 perimeters @ 0.4; sealed box |
| Copper pocket | 40 × 30 × 1.2 mm recess | Faraday region over the charge-amp summing node |
| Ground boss | Ø8, M3 tap | Single-point analog ground; copper tape bonds here |
| Cable entries | 2 × Ø6 slit glands | Sensor lead + power; slit lets you seat pre-terminated leads |

## Tolerances / FDM fits

- 0.2 mm press-fit, 0.3 mm snug, 0.4 mm free-sliding.
- Lid-to-body: 0.3 mm snug on the register lip; M3 screws at 4 corners.
- All fragile-part pockets (piezo): 0.6 mm free — never press a piezo disc.

## Print orientation

- **Saddles**: pipe-axis horizontal, saddle channel facing up (support-free crown; the channel is
  a bridge/overhang < 45° if wrap ≤ 160°). PETG recommended (basement thermal range, better creep
  resistance than PLA).
- **Enclosure body**: open face up, no supports.
- **Lid**: flat.

## Material

**PETG** primary (thermal stability + toughness in an unconditioned basement; PLA creeps under
sustained clamp load and warm pipes). ABS/ASA acceptable. See
`kb/platforms/openscad/materials.md`.

## Verification criteria

- All STL meshes watertight/manifold (`check_mesh.py`).
- Piezo pocket actual Ø within +0.6/−0.0 of 27 mm.
- Saddle channel radius matches pipe R (14.3 mm) + seat clearance.
- Lid register clears body by 0.3 mm (`check_fit.py`).
- Renders (top/section/iso) visually correct per part.

## Explicit non-goals

- Not a pressure boundary — nothing is plumbed into the water. All parts clamp externally.
- Enclosure is **not** a substitute for the copper lining; it is the carrier for it. Shielding
  efficacy is a Phase 0 measurement, not a CAD guarantee. See `kb/decisions/enclosure-hybrid.md`.

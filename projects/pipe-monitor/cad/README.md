# CAD — Acoustic Pipe Monitor enclosure + mounting

Parametric OpenSCAD for the printable hardware: a sensor saddle that clamps the piezo onto a
**1″ copper main (28.6 mm OD)**, a **hybrid** enclosure (printed shell + copper lining) for the
PCB, and a slim exciter saddle for the Phase-4 reference chirp.

## Parts

| Part | Source | STL | Print notes |
|---|---|---|---|
| Sensor saddle | `src/clamp.scad` | `stl/clamp.stl` | Channel-up, support-free; PETG |
| Exciter saddle | `src/exciter_mount.scad` | `stl/exciter_mount.stl` | Channel-up; PETG |
| Enclosure body | `src/enclosure.scad -D part="body"` | `stl/enclosure_body.stl` | Open-face up, no supports |
| Enclosure lid | `src/enclosure.scad -D part="lid"` | `stl/enclosure_lid.stl` | Flat |

All four verified **watertight, single-body, winding-consistent** (see `DESIGN_REPORT.md`).

## Edit → render → verify

Every dimension lives in `src/config.scad` (single source of truth). Change a value there, then:

```bash
# render STLs
cd src
xvfb-run -a openscad -o ../stl/clamp.stl           clamp.scad
xvfb-run -a openscad -o ../stl/exciter_mount.stl   exciter_mount.scad
xvfb-run -a openscad -D 'part="body"' -o ../stl/enclosure_body.stl enclosure.scad
xvfb-run -a openscad -D 'part="lid"'  -o ../stl/enclosure_lid.stl  enclosure.scad

# verify (from cad/)
SKILL=$(git rev-parse --show-toplevel)/.claude/skills/scad-design-to-print/scripts
python3 "$SKILL/verify.py" .
```

`xvfb-run` is only needed on a headless box; on a desktop use `openscad` directly.

## Fitting a different pipe

Set `pipe_od` in `src/config.scad` and re-render. The saddle channel, wrap, and band ridges all
derive from it. Nothing else needs to change for common copper/steel sizes. Keep
`exc_len > piezo_pocket_d` (the crown pocket must not exceed the saddle length).

## Assembly (sensor saddle)

1. **Kapton + grease** on the pipe crown where the disc will sit — this is the electrical
   isolation that prevents the 60 Hz ground loop. Grease **both** faces of the tape.
2. Drop the **27 mm piezo** into the crown pocket (free fit — never force it), leads out the wire
   slot. Add the **compliant pad** (silicone/neoprene) into the recess behind the disc.
3. Seat the saddle on the pipe; run a **1/2″ stainless hose clamp** around the pipe + saddle,
   nested between the two raised ridges. Tighten until the pad is compressed and the disc is
   firmly coupled — snug, not crushing.
4. Tuck **closed-cell foam** over the assembly under the end flanges for airborne rejection.

## Assembly (enclosure — the hybrid shielding)

1. Line the **copper pocket** in the floor with copper tape (or conductive paint), overlapping up
   the nearby wall. This is the Faraday region over the charge-amp summing node.
2. Run a short wire from the copper lining to the **ground boss** (M3 self-tapping screw) — this is
   the **single-point analog ground**. Bond the sensor-lead shield here **at the amplifier end
   only** (grounding both ends recreates the loop).
3. Mount the PCB on the four standoffs. Route the sensor lead and power through the two slit glands.
4. Lid drops on (0.30 mm register clearance), M3 screws at the corners.

> The copper lining is not optional. Without it, a plastic box provides zero EMI shielding and the
> ground-loop failure returns. Its efficacy is a **Phase 0 measurement** (mains hum ≥20 dB below
> flow-noise band), not a CAD guarantee. See `../kb/decisions/enclosure-hybrid.md`.

## Files

```
src/        config.scad (params), saddle.scad (shared), clamp.scad, exciter_mount.scad,
            enclosure.scad, assembly.scad (visual only)
stl/        per-part meshes        3mf/  per-part 3MF for the slicer
renders/    iso/top/section + per-part views
spec/       SPEC.md (frozen)       tools/ verification scripts (copies)
```

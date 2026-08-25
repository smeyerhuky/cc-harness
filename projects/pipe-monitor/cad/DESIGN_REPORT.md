# Design Report — Acoustic Pipe Monitor CAD

Engineering justification for the printable hardware. Companion to the frozen `spec/SPEC.md`.

## Parts and verification status

| Part | Watertight | Bodies | Volume | Bounding box (mm) |
|---|---|---|---|---|
| `clamp.stl` (sensor saddle) | ✅ | 1 | 7.94 cm³ | 42.4 × 18.8 × 40.0 |
| `exciter_mount.stl` | ✅ | 1 | 6.29 cm³ | 38.1 × 17.3 × 34.0 |
| `enclosure_body.stl` | ✅ | 1 | 43.73 cm³ | 96.8 × 66.8 × 34.4 |
| `enclosure_lid.stl` | ✅ | 1 | 16.31 cm³ | 96.8 × 66.8 × 4.0 |

`verify.py` (skill master orchestrator): **all mesh checks pass, no errors**. Remaining warnings
are the optional `libs/BOSL2` and `step/` directories, deliberately omitted (see below).

Functional checks (trimesh sectioning):

- **Lid ↔ body register clearance = 0.30 mm per side** (target 0.30, snug). Measured from a
  z-section of each part.
- **Body outer footprint 96.8 × 66.8 mm** = internal 92 × 62 + 2 × 2.4 wall. Confirmed.
- **Piezo pocket Ø 27.6 mm** — by construction (a `d = piezo_pocket_d` cylinder in `config.scad`);
  the STL is generated directly from that parameter.

## Key design decisions

### 1. Plain OpenSCAD, no BOSL2

The renderer available is OpenSCAD 2021.01. The geometry is entirely cylinders, cuboids, and
boolean operations on an annular-sector cross-section — BOSL2 would add a compatibility risk on the
old renderer for no boilerplate saving. Omitted deliberately.

### 2. Additive band retention, not subtractive grooves

**Iteration finding.** The first saddle cut circumferential grooves for the hose-clamp band. On the
thin (1.8 mm) side legs of a 150° wrap, a 1.2 mm groove severed a wing — the mesh split into two
bodies. Replaced with **raised ridges** flanking a central band seat: the band nests between them,
and because ridges are additive they cannot detach material. Both saddles are now single-body.

### 3. Ground boss must overlap the floor, not touch it

**Iteration finding.** The single-point ground boss sits in the middle of the copper-lining recess.
Two failures, fixed in turn: (a) the recess subtraction ate the boss base when the boss was built
before the difference — fixed by unioning the boss *after* the pocket cut; (b) resting the boss on
the recessed floor with a *coincident* face still read as a separate CGAL volume — fixed by starting
the boss below the floor top so it *volumetrically overlaps* the floor slab. Now single-body.

### 4. Free fit on the piezo pocket (0.6 mm)

A 27 mm brass-backed piezo disc is fragile and cheap. The pocket is +0.6 mm (free fit), never a
press fit — the compliant pad behind the disc, not the pocket walls, provides contact force onto the
pipe. The BOM says "buy 10 — they are cheap and easy to damage"; the design respects that.

### 5. Material: PETG

An unconditioned basement thermally cycles and the saddle carries sustained hose-clamp load. PLA
creeps under sustained load at warm-pipe temperatures; PETG (or ABS/ASA) holds. This also keeps the
mount stable, which directly sets the coupling-drift rate the Phase-4 reference exciter has to
track. See `kb/platforms/openscad/materials.md`.

### 6. Wall thicknesses

- Saddle structural wall 3.0 mm (stiffness under clamp force; ≥ 7 × 0.4 mm perimeters).
- Enclosure wall/floor 2.4 mm (6 perimeters @ 0.4 nozzle; sealed box).
- Minimum feature (band ridge, foam lip) 1.6–2.0 mm ≥ 2 × extrusion width.

## The shielding caveat (most important)

This enclosure is a **hybrid**: it substitutes a printed shell + copper lining for the source
spec's `[HARD]` die-cast aluminium box. The CAD provides the *carrier* for shielding (copper
pocket, single-point ground boss, isolation geometry) but **plastic shields nothing on its own**.
Shielding efficacy is a Phase 0 exit measurement — mains hum ≥ 20 dB below flow-noise band energy —
not something CAD can guarantee. If Phase 0 shows 60 Hz contamination, the fallback is to drop the
printed shell into a stock die-cast box; the printed clamp/mount still carries unchanged. Full
rationale: `../kb/decisions/enclosure-hybrid.md`.

## Print orientation summary

| Part | Orientation | Supports |
|---|---|---|
| Saddles | Pipe channel facing up (crown on the bed) | None (150° wrap keeps the channel a bridge) |
| Enclosure body | Open face up | None |
| Lid | Flat, register lip up | None |

## What is deliberately absent

- No STEP export (`step/`): OpenSCAD 2021.01 has no native B-Rep STEP; the STL/3MF meshes are the
  deliverable. Regenerate STEP downstream if a solid-CAD round-trip is needed.
- No pressure-boundary parts: nothing is plumbed into the water; all parts clamp externally.

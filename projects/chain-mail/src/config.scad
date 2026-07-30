// ============================================================================
// config.scad — Chain-Mail single source of truth
// All numeric parameters live here. Frozen SPEC.md §2–§7 govern these values.
// Units: millimetres, degrees.
// ============================================================================

// ---- Ring geometry (SPEC §3.1, finer gauge) --------------------------------
WD = 1.6;              // wire diameter (torus cross-section)
AR = 5.0;              // aspect ratio ID/WD
ID = AR * WD;          // inner diameter = 8.0
OD = ID + 2 * WD;      // outer diameter = 11.2

// ---- Print-in-place clearance (SPEC §3.2) — CHOSEN AT M1 -------------------
// M1 physical print (all three released & articulated cleanly on the P1S);
// user selected the tightest, 0.30 mm. This is the locked design clearance.
GAP        = 0.30;     // CHOSEN design clearance (M1 physical, 2026-07-30)
GAP_ALT_04 = 0.40;     // also printed clean — fallback / looser drape
GAP_ALT_05 = 0.50;     // also printed clean — safest

// ---- M1-calibrated interlink (tilt +T / -T pair) ---------------------------
// A verified linked pair (Gauss Lk = +1) that both rests on the bed and holds
// GAP between the threaded wires. Basis for the M2 weave lattice.
LINK_TILT  = 30;       // ring lean; opposite sign on adjacent rings
LINK_DX    = 3.7;      // diagonal X offset giving GAP=0.30 at this tilt
LINK_DY    = 3.0;      // diagonal Y offset (row step)

// ---- Weave: European 4-in-1 (SPEC §4) --------------------------------------
// Tilt angle of alternating rings. Derived nominal; VERIFIED by collision test,
// never trusted as typed. Refined during M2 swatch.
TILT       = 45;       // ring tilt from sheet plane (deg), nominal
ROW_PITCH  = OD * 0.55; // centre-to-centre row spacing (nominal, from feasibility calc)
COL_PITCH  = OD * 0.65; // centre-to-centre column spacing (nominal)

// ---- Engineered hinge / crease links (SPEC §5) -----------------------------
// Crease links get their own geometry tuned to fold tight, decoupling fold
// radius from drape gauge. Target hinge Rmin ~ 8 mm, pinned by M3 coupon.
HINGE_RMIN     = 8.0;  // target minimum fold radius at the crease
HINGE_WD       = 1.2;  // thinner wire at crease for tighter articulation (M3 tunes)
HINGE_AR       = 6.5;  // higher AR at crease for more hinge travel

// ---- Build volume (SPEC §2, P1S with buffer) -------------------------------
BED            = 256;
USABLE_X       = 230;
USABLE_Y       = 230;
USABLE_Z       = 236;

// ---- Print profile ---------------------------------------------------------
NOZZLE         = 0.4;
LAYER_H        = 0.2;
EXTRUSION_W    = 0.45;

// ---- Color (SPEC §7.1) -----------------------------------------------------
// "off" = monochrome (default for all prototypes/coupons),
// "band" = procedural banding, "image" = full image map.
COLOR_MODE     = "off";

// ---- Render/quality --------------------------------------------------------
$fn = 48;              // torus smoothness; bump for final renders/exports
EPS = 0.01;            // overlap fudge for clean unions

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

// ---- Print-in-place clearance (SPEC §3.2) ----------------------------------
// Design gap between linked wire surfaces. Coupon prints 0.30/0.40/0.50 to
// find the real floor for this P1S/PLA/profile before committing.
GAP        = 0.40;     // nominal design clearance
GAP_TIGHT  = 0.30;     // stretch (image's number) — must be proven
GAP_SAFE   = 0.50;     // fallback if 0.40 fuses

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

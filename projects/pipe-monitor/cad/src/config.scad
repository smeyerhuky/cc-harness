// =============================================================================
// config.scad — SINGLE SOURCE OF TRUTH for every numeric parameter.
// Acoustic Pipe Monitor: sensor saddle, enclosure, exciter mount.
// Units: millimetres. Target: 1" copper main, OD 28.6 mm. Material: PETG.
// =============================================================================

// ---- Global print/fit ----
$fn            = 96;    // curve smoothness for final render (drop to 48 for quick iterations)
eps            = 0.01;  // tiny overlap to avoid coplanar-face artifacts
fit_press      = 0.2;   // interference / press-fit
fit_snug       = 0.3;   // snug locating fit
fit_free       = 0.4;   // free sliding fit

// ---- Pipe ----
pipe_od        = 28.6;              // 1" nominal copper OD (operator input)
pipe_r         = pipe_od / 2;       // 14.3
seat_clear     = 0.2;               // saddle channel clearance over the pipe
kapton_gap     = 0.25;              // piezo-to-pipe isolation standoff (grease+Kapton sandwich)

// ---- Piezo disc (sensor + exciter, spec BOM item 4) ----
piezo_d        = 27.0;
piezo_pocket_d = piezo_d + 0.6;     // 27.6 — FREE fit; never press a fragile disc
piezo_t        = 0.6;               // brass carrier thickness (measure yours; 27mm ~0.5-0.6)
piezo_pocket_h = 2.0;               // pocket depth (disc + a little)
pad_recess_d   = 24.0;             // compliant-pad recess behind the disc
pad_recess_h   = 3.0;
wire_slot_w    = 4.0;               // exit for the two solder leads

// ---- Sensor saddle ----
sad_wall       = 3.0;               // structural wall around the pipe channel
sad_len        = 40.0;              // length along the pipe axis
sad_wrap_deg   = 150;               // channel wrap angle (<=160 keeps crown support-free)
band_w         = 12.7;              // 1/2" stainless hose-clamp band width
band_t         = 1.2;               // band thickness + clearance
band_inset     = 6.0;              // distance of band channel from each saddle end
foam_lip_h     = 4.0;               // shroud lip retaining closed-cell foam over the assembly
foam_lip_t     = 1.6;

// ---- Exciter saddle (slimmer; same piezo) ----
// Must exceed piezo_pocket_d so the crown pocket does not slice off the ends.
exc_len        = 34.0;
exc_wrap_deg   = 150;
exciter_spacing = 300.0;            // nominal sensor<->exciter distance (informational; set by tape)

// ---- Enclosure (hybrid: printed shell + copper lining) ----
enc_ix         = 92.0;   // internal X (ESP32-S3-DevKitC-1 ~63x26 + PCM1808 + charge-amp board)
enc_iy         = 62.0;   // internal Y
enc_iz         = 32.0;   // internal Z (headroom for headers)
enc_wall       = 2.4;    // 6 perimeters @ 0.4 nozzle
enc_floor      = 2.4;
lid_h          = 6.0;    // lid skirt height
lid_reg        = 1.6;    // register lip depth into the body
lid_reg_clear  = fit_snug;

// Copper-lined Faraday pocket over the charge-amp summing node
cu_pocket_x    = 40.0;
cu_pocket_y    = 30.0;
cu_pocket_d    = 1.2;    // recess depth for copper tape/paint
ground_boss_d  = 8.0;    // single-point analog ground boss
ground_boss_h  = 6.0;
ground_tap_d   = 2.5;    // pilot for an M3 self-tapping ground screw

// PCB standoffs
pcb_x          = 63.0;   // DevKitC-1 footprint
pcb_y          = 26.0;
standoff_d     = 6.0;
standoff_h     = 5.0;
standoff_pilot = 2.5;    // M3 self-tap pilot
pcb_hole_inset = 3.0;    // hole center inset from pcb corner (typical)

// Cable entries (slit glands)
gland_d        = 6.0;
gland_slit_w   = 1.6;    // slit so a pre-terminated lead can be seated

// Corner screw bosses (lid -> body)
screw_boss_d   = 7.0;
screw_pilot_d  = 2.6;    // M3 self-tap
screw_clear_d  = 3.4;    // M3 clearance in the lid

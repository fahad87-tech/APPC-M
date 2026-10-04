// ==============================================================================
// CONCEPT TAXONOMY — shared by student portal + teacher portal
// ==============================================================================
// Generated alongside data/exams.json concept tags. Each question carries a
// `concept` key; this map supplies the display label and accent colour.
//
// Palette keys map to the "Blueprint & Brass" tokens defined in each page's
// <style> block: brass, copper, coral, lime, plum.

const CONCEPT_META = {
  vectors:            { label: "Vectors & Components",              color: "brass",  blurb: "Magnitude, direction, components, and vector addition." },
  kinematics_1d:      { label: "1D Kinematics",                     color: "copper", blurb: "Motion along a single axis: position, velocity, acceleration." },
  kinematics_2d:      { label: "2D Kinematics & Projectiles",        color: "copper", blurb: "Motion in a plane, projectile components and trajectories." },
  relative_motion:    { label: "Relative Motion & Reference Frames",  color: "copper", blurb: "Motion as measured from different observers." },
  graph_analysis:     { label: "Graph & Data Analysis",              color: "brass",  blurb: "Reading slope, area, and shape from motion graphs." },
  newton_1d:          { label: "Newton's First Law",                 color: "plum",   blurb: "Inertia and the condition of zero net force." },
  newton_2d:          { label: "Newton's Second Law",                color: "plum",   blurb: "F = ma and the relationship between net force and acceleration." },
  newton_3d:          { label: "Newton's Third Law",                 color: "plum",   blurb: "Action-reaction pairs that never cancel." },
  fbd:                { label: "Free-Body Diagrams",                 color: "plum",   blurb: "Identifying and drawing every force on an object." },
  friction:           { label: "Friction",                           color: "plum",   blurb: "Kinetic and static friction, coefficients, and frictionless cases." },
  gravity:            { label: "Gravity & Weight",                   color: "plum",   blurb: "Gravitational force, apparent weight, and free-fall." },
  spring:             { label: "Springs & Elasticity",               color: "plum",   blurb: "Hooke's law, spring constants, and elastic limits." },
  circular:           { label: "Circular Motion",                    color: "plum",   blurb: "Centripetal force and uniform circular motion." },
  work:               { label: "Work",                               color: "lime",   blurb: "Force multiplied by displacement along the force." },
  energy_kinetic:     { label: "Kinetic Energy",                     color: "lime",   blurb: "K = 1/2 mv^2 and the work-energy theorem." },
  energy_potential:   { label: "Potential Energy",                   color: "lime",   blurb: "Gravitational and elastic potential energy." },
  energy_conservation:{ label: "Conservation of Energy",             color: "lime",   blurb: "Mechanical energy conserved in isolated systems." },
  power:              { label: "Power",                              color: "lime",   blurb: "Rate of doing work and energy transfer per unit time." },
  momentum:           { label: "Momentum & Impulse",                 color: "lime",   blurb: "Linear momentum, impulse, and collisions." },
  rotation:           { label: "Rotational Kinematics",             color: "copper", blurb: "Angular position, angular velocity, angular acceleration." },
  torque:             { label: "Torque & Equilibrium",              color: "copper", blurb: "Lever arm, net torque, and rotational equilibrium." },
  moment_inertia:     { label: "Rotational Inertia",                 color: "copper", blurb: "Moment of inertia and the parallel-axis theorem." },
  ang_momentum:       { label: "Angular Momentum & Impulse",         color: "copper", blurb: "Angular momentum, conservation, and angular impulse." },
  rot_energy:         { label: "Rotational Energy",                 color: "copper", blurb: "Rotational kinetic energy and rolling motion." },
  oscillations:       { label: "Oscillations & SHM",                 color: "plum",   blurb: "Simple harmonic motion, springs, pendulums, and period." },
  fluids:             { label: "Fluids",                             color: "copper", blurb: "Pressure, density, buoyancy, and continuity." }
};

/** Look up display metadata for a concept key, with a safe fallback. */
function conceptMeta(key) {
  return CONCEPT_META[key] || { label: key || "Unclassified", color: "brass", blurb: "" };
}

/**
 * Mastery band from a 0..1 accuracy ratio.
 * Thresholds are intentionally demanding: 85%+ is "secured", anything under
 * 55% is flagged for remediation.
 */
function masteryBand(accuracy) {
  if (accuracy >= 0.85) return { key: "secured",  label: "Secured",     tone: "lime" };
  if (accuracy >= 0.70) return { key: "developing",label: "Developing",  tone: "copper" };
  if (accuracy >= 0.55) return { key: "shaky",    label: "Shaky",       tone: "brass" };
  return { key: "priority", label: "Needs Work", tone: "coral" };
}
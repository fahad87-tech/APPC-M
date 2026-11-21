/* SI units throughout. No force softening, drag, gravity, or boundary forces. */
(function (root) {
  'use strict';
  const K = 8.9875517923e9;
  const CLOSE = 0.18;
  function initial() {
    return [
      { id: 1, q: 6e-9, x: -2, y: -1.5, vx: 0, vy: 0, mass: 1e-8, pinned: true },
      { id: 2, q: -2e-9, x: -2, y: 1.5, vx: 0, vy: 0, mass: 1e-8, pinned: true },
      { id: 3, q: 5e-9, x: 2, y: 1.5, vx: 0, vy: 0, mass: 1e-8, pinned: false }
    ];
  }
  function preset(name) {
    const c = initial();
    if (name === 'repel') c.forEach(q => { q.q = Math.abs(q.q); q.pinned = false; });
    if (name === 'line') c.forEach((q, i) => { q.x = (i - 1) * 3; q.y = 0; q.pinned = false; });
    if (name === 'balance') {
      c[0].x = -2; c[0].y = 0; c[0].q = 5e-9;
      c[1].x = 2; c[1].y = 0; c[1].q = 5e-9;
      c[2].x = 0; c[2].y = 0; c[2].q = 2e-9;
    }
    if (name === 'dipole') {
      c[0].x = -1.5; c[0].y = 0; c[0].q = 5e-9;
      c[1].x = 1.5; c[1].y = 0; c[1].q = -5e-9;
      c[2].x = 0; c[2].y = 2; c[2].q = 1e-9;
    }
    return c;
  }
  // Inspection follows the free particle only in the explicit single-particle experiment.
  function selectForMotion(charges, index, mode) {
    if (mode === 'selected') charges.forEach((c, i) => { c.pinned = i !== index; });
  }
  function forces(charges) {
    const net = charges.map(() => ({ x: 0, y: 0 }));
    const pairs = charges.map(() => charges.map(() => ({ x: 0, y: 0 })));
    for (let i = 0; i < charges.length; i++) for (let j = i + 1; j < charges.length; j++) {
      const a = charges[i], b = charges[j], dx = a.x - b.x, dy = a.y - b.y;
      const r = Math.hypot(dx, dy);
      if (r < 1e-12) continue; // Overlap is rejected by the editor and dynamics guard.
      const f = K * a.q * b.q / (r * r * r), x = f * dx, y = f * dy;
      pairs[i][j] = { x, y }; pairs[j][i] = { x: -x, y: -y };
      net[i].x += x; net[i].y += y; net[j].x -= x; net[j].y -= y;
    }
    return { net, pairs };
  }
  function energy(charges) {
    let kinetic = 0, potential = 0;
    charges.forEach(c => { kinetic += 0.5 * c.mass * (c.vx * c.vx + c.vy * c.vy); });
    for (let i = 0; i < charges.length; i++) for (let j = i + 1; j < charges.length; j++) {
      potential += K * charges[i].q * charges[j].q / Math.hypot(charges[i].x - charges[j].x, charges[i].y - charges[j].y);
    }
    return { kinetic, potential, total: kinetic + potential };
  }
  function separation(charges) {
    let r = Infinity;
    for (let i = 0; i < charges.length; i++) for (let j = i + 1; j < charges.length; j++)
      r = Math.min(r, Math.hypot(charges[i].x - charges[j].x, charges[i].y - charges[j].y));
    return r;
  }
  // Adaptive velocity Verlet. Resolve close approaches before the point-charge singularity.
  function advance(charges, duration) {
    let elapsed = 0, iterations = 0;
    while (elapsed < duration - 1e-12) {
      const r = separation(charges);
      if (r <= CLOSE) return { elapsed, stopped: 'close' };
      const f = forces(charges).net;
      const speed = Math.max(...charges.map(c => Math.hypot(c.vx, c.vy)));
      const acc = Math.max(...charges.map((c, i) => c.pinned ? 0 : Math.hypot(f[i].x, f[i].y) / c.mass));
      const h = Math.min(duration - elapsed, 1 / 240, 0.025 * r / Math.max(speed, 1e-12), Math.sqrt(0.001 * r / Math.max(acc, 1e-12)));
      const previous = charges.map(c => ({ x: c.x, y: c.y }));
      charges.forEach((c, i) => {
        if (c.pinned) { c.vx = c.vy = 0; return; }
        c.vx += 0.5 * h * f[i].x / c.mass; c.vy += 0.5 * h * f[i].y / c.mass;
        c.x += h * c.vx; c.y += h * c.vy;
      });
      // Swept separation catches crossing trajectories even between substeps.
      let crossed = false;
      for (let i = 0; i < charges.length; i++) for (let j = i + 1; j < charges.length; j++) {
        const x = previous[i].x - previous[j].x, y = previous[i].y - previous[j].y;
        const dx = charges[i].x - charges[j].x - x, dy = charges[i].y - charges[j].y - y;
        const t = Math.max(0, Math.min(1, -(x * dx + y * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(x + t * dx, y + t * dy) <= CLOSE) crossed = true;
      }
      if (crossed) {
        charges.forEach((c, i) => { c.x = previous[i].x; c.y = previous[i].y; });
        // Return the last complete state, including its velocities.
        charges.forEach((c, i) => { if (!c.pinned) { c.vx -= 0.5 * h * f[i].x / c.mass; c.vy -= 0.5 * h * f[i].y / c.mass; } });
        return { elapsed, stopped: 'close' };
      }
      const next = forces(charges).net;
      charges.forEach((c, i) => {
        if (!c.pinned) { c.vx += 0.5 * h * next[i].x / c.mass; c.vy += 0.5 * h * next[i].y / c.mass; }
      });
      elapsed += h;
      if (++iterations >= 4000) return { elapsed, stopped: 'resolution' };
    }
    return { elapsed, stopped: null };
  }
  const api = { K, CLOSE, initial, preset, selectForMotion, forces, energy, separation, advance };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Coulomb = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

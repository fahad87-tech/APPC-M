/* =========================================================================
   Mechanism: Interactive Electric Fields & Equipotentials Lab (2D & 3D)
   Choose any section independently (no auto-advancing video):
     0 : Isolated charge   (radial field lines, spherical equipotentials)
     1 : Opposite charges  (dipole loops, flat V = 0 midplane)
     2 : Like charges      (repelling plumes, central null point E = 0)
     3 : Uniform field     (parallel plates, constant E, flat V sheets)
   Place or drag +q close to or far from charges, toggle true 3D volumetric
   electric fields & 3D equipotential surfaces, or draw equipotentials live.
   ========================================================================= */
import { HUES, D2R, clamp01 } from '../kit.js';

// ---------- 1. physical & geometric constants (scene units) ----------
const A = 1.35;          // half-separation between two charges (at x = -A, +A)
const D_PLATE = 1.85;    // parallel plate x positions (-D_PLATE, +D_PLATE)
const PLATE_H = 1.75;
const PLATE_W = 2.30;
const R_CHARGE = 0.30;   // charge sphere radius
const K_COUL = 1.15;     // electrostatic scale so |E| sits naturally on 0..10 kV/m dial
const X_ELL = 3.85;      // generous outer elliptical clip for 2D field lines
const Z_ELL = 2.85;
const X_ELL_3D = 2.85;   // compact 3D outer clip so 3D arches frame cleanly
const Z_ELL_3D = 2.05;
const MAX_STAGE = 16.0;  // allow placing +q close or very far away across the whole grid

const DEFAULT_PROBES = [
  { x: 1.05, z: 0.55 },   // Isolated
  { x: -0.65, z: 0.78 },  // Opposite
  { x: -0.58, z: 0.42 },  // Like
  { x: -0.95, z: 0.35 },  // Uniform
];

// ---------- 2. closed-form electrostatic field & potential ----------
function evalField(sec, x, y, z, q, sgn) {
  const qs = q * sgn;
  if (sec === 0) {
    const r2 = Math.max(x * x + y * y + z * z, 0.12 * 0.12);
    const r = Math.sqrt(r2);
    const f = (K_COUL * qs) / (r2 * r);
    const ex = f * x, ey = f * y, ez = f * z;
    return { ex, ey, ez, Emag: Math.hypot(ex, ey, ez), V: (K_COUL * qs) / r };
  }
  if (sec === 1 || sec === 2) {
    const q1 = qs;
    const q2 = sec === 1 ? -qs : qs;
    const dx1 = x + A, dx2 = x - A;
    const r1sq = Math.max(dx1 * dx1 + y * y + z * z, 0.12 * 0.12);
    const r2sq = Math.max(dx2 * dx2 + y * y + z * z, 0.12 * 0.12);
    const r1 = Math.sqrt(r1sq), r2 = Math.sqrt(r2sq);
    const f1 = (K_COUL * q1) / (r1sq * r1);
    const f2 = (K_COUL * q2) / (r2sq * r2);
    const ex = f1 * dx1 + f2 * dx2;
    const ey = (f1 + f2) * y;
    const ez = (f1 + f2) * z;
    return {
      ex, ey, ez,
      Emag: Math.hypot(ex, ey, ez),
      V: K_COUL * (q1 / r1 + q2 / r2),
    };
  }
  // sec === 3: uniform field inside parallel plates, realistic falloff outside
  const insideX = Math.abs(x) <= D_PLATE;
  const insideZ = Math.abs(z) <= PLATE_W * 0.52;
  const exBase = K_COUL * qs * 1.05;
  let factor = 1;
  if (!insideX) factor *= Math.exp(-Math.abs(Math.abs(x) - D_PLATE) * 2.4);
  if (!insideZ) factor *= Math.exp(-Math.abs(Math.abs(z) - PLATE_W * 0.52) * 1.8);
  const ex = exBase * factor;
  const clampedX = Math.max(-D_PLATE, Math.min(D_PLATE, x));
  return { ex, ey: 0, ez: 0, Emag: Math.abs(ex), V: -exBase * clampedX * (insideZ ? 1 : factor) };
}

function normPotential(sec, x, z) {
  if (sec === 0) return 1 / Math.max(Math.hypot(x, z), 0.10);
  if (sec === 1) {
    const r1 = Math.max(Math.hypot(x + A, z), 0.10);
    const r2 = Math.max(Math.hypot(x - A, z), 0.10);
    return 1 / r1 - 1 / r2;
  }
  if (sec === 2) {
    const r1 = Math.max(Math.hypot(x + A, z), 0.10);
    const r2 = Math.max(Math.hypot(x - A, z), 0.10);
    return 1 / r1 + 1 / r2;
  }
  return -Math.max(-D_PLATE, Math.min(D_PLATE, x));
}

// ---------- 3. high-precision RK4 streamline tracer ----------
function unitField2D(sec, x, z) {
  const e = evalField(sec, x, 0, z, 1, 1);
  const m = Math.hypot(e.ex, e.ez);
  return m < 1e-5 ? [0, 0] : [e.ex / m, e.ez / m];
}

function outsideEll(x, z, rx = X_ELL, rz = Z_ELL) {
  return (x * x) / (rx * rx) + (z * z) / (rz * rz) >= 1;
}

function clipToEll(ax, az, bx, bz, rx = X_ELL, rz = Z_ELL) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 12; i++) {
    const mid = 0.5 * (lo + hi);
    const mx = ax + (bx - ax) * mid, mz = az + (bz - az) * mid;
    if (outsideEll(mx, mz, rx, rz)) hi = mid; else lo = mid;
  }
  return [ax + (bx - ax) * lo, az + (bz - az) * lo];
}

function traceStream2D(sec, x0, z0, dirSign, targetChargeX = null, rx = X_ELL, rz = Z_ELL, maxSteps = 560, ds = 0.020) {
  const pts = [[x0, z0]];
  let x = x0, z = z0;
  for (let s = 0; s < maxSteps; s++) {
    const [k1x, k1z] = unitField2D(sec, x, z);
    if (k1x === 0 && k1z === 0) break;
    const h = dirSign * ds;
    const [k2x, k2z] = unitField2D(sec, x + 0.5 * h * k1x, z + 0.5 * h * k1z);
    const [k3x, k3z] = unitField2D(sec, x + 0.5 * h * k2x, z + 0.5 * h * k2z);
    const [k4x, k4z] = unitField2D(sec, x + h * k3x, z + h * k3z);
    const nx = x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const nz = z + (h / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);

    if (targetChargeX !== null) {
      const d = Math.hypot(nx - targetChargeX, nz);
      if (d <= R_CHARGE) {
        const sc = R_CHARGE / Math.max(d, 1e-5);
        pts.push([targetChargeX + (nx - targetChargeX) * sc, nz * sc]);
        break;
      }
    }
    if (outsideEll(nx, nz, rx, rz)) {
      pts.push(clipToEll(x, z, nx, nz, rx, rz));
      break;
    }
    x = nx; z = nz;
    pts.push([x, z]);
  }
  return pts;
}

function resample2D(pts, count = 64) {
  if (pts.length < 2) return pts.slice();
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i][1] + (pts[i][1] - pts[i - 1][1])));
  }
  const total = cum[cum.length - 1];
  if (total < 1e-5) return pts.slice();
  const out = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const segLen = cum[j + 1] - cum[j] || 1;
    const t = clamp01((target - cum[j]) / segLen);
    out.push([
      pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
      pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t,
    ]);
  }
  return out;
}

function curveLength2D(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

function pointAtArc2D(pts, dist) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= dist || i === pts.length - 1) {
      const t = seg > 1e-6 ? clamp01((dist - acc) / seg) : 0;
      const dx = pts[i][0] - pts[i - 1][0], dz = pts[i][1] - pts[i - 1][1];
      const m = Math.hypot(dx, dz) || 1;
      return {
        x: pts[i - 1][0] + dx * t,
        z: pts[i - 1][1] + dz * t,
        tx: dx / m,
        tz: dz / m,
      };
    }
    acc += seg;
  }
  return null;
}

// ---------- 4. stitched Marching Squares for equipotential contours ----------
const MS_TABLE = {
  0: [], 15: [],
  1: [[3, 0]], 14: [[3, 0]],
  2: [[0, 1]], 13: [[0, 1]],
  3: [[3, 1]], 12: [[3, 1]],
  4: [[1, 2]], 11: [[1, 2]],
  6: [[0, 2]], 9: [[0, 2]],
  7: [[3, 2]], 8: [[3, 2]],
};

function marchingContours2D(vFn, level, xMin, xMax, zMin, zMax, nx, nz, maskFn) {
  const dx = (xMax - xMin) / nx;
  const dz = (zMax - zMin) / nz;
  const cols = nx + 1;
  const grid = new Float64Array(cols * (nz + 1));
  for (let iz = 0; iz <= nz; iz++) {
    const z = zMin + iz * dz;
    for (let ix = 0; ix <= nx; ix++) {
      grid[iz * cols + ix] = vFn(xMin + ix * dx, z);
    }
  }

  const frac = (a, b) => (Math.abs(b - a) < 1e-9 ? 0.5 : clamp01((level - a) / (b - a)));
  const edges = [];

  for (let iz = 0; iz < nz; iz++) {
    const z0 = zMin + iz * dz, z1 = z0 + dz;
    for (let ix = 0; ix < nx; ix++) {
      const x0 = xMin + ix * dx, x1 = x0 + dx;
      const v0 = grid[iz * cols + ix];
      const v1 = grid[iz * cols + ix + 1];
      const v2 = grid[(iz + 1) * cols + ix + 1];
      const v3 = grid[(iz + 1) * cols + ix];
      const code = (v0 >= level ? 1 : 0) | (v1 >= level ? 2 : 0) | (v2 >= level ? 4 : 0) | (v3 >= level ? 8 : 0);
      if (code === 0 || code === 15) continue;

      let pairs = MS_TABLE[code];
      if (!pairs) {
        const vc = vFn(0.5 * (x0 + x1), 0.5 * (z0 + z1));
        if (code === 5) pairs = vc >= level ? [[3, 2], [0, 1]] : [[3, 0], [1, 2]];
        else pairs = vc >= level ? [[0, 3], [2, 1]] : [[0, 1], [3, 2]];
      }

      const edgePt = (e) => {
        if (e === 0) return [x0 + dx * frac(v0, v1), z0];
        if (e === 1) return [x1, z0 + dz * frac(v1, v2)];
        if (e === 2) return [x0 + dx * frac(v3, v2), z1];
        return [x0, z0 + dz * frac(v0, v3)];
      };

      for (const [ea, eb] of pairs) {
        const a = edgePt(ea), b = edgePt(eb);
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue;
        if (maskFn && maskFn(0.5 * (a[0] + b[0]), 0.5 * (a[1] + b[1]))) continue;
        edges.push([a, b]);
      }
    }
  }

  const keyOf = (p) => `${Math.round(p[0] * 10000)},${Math.round(p[1] * 10000)}`;
  const nodes = new Map();
  const adj = new Map();
  edges.forEach(([a, b], idx) => {
    const ka = keyOf(a), kb = keyOf(b);
    if (ka === kb) return;
    if (!nodes.has(ka)) nodes.set(ka, a);
    if (!nodes.has(kb)) nodes.set(kb, b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka).push({ idx, to: kb });
    adj.get(kb).push({ idx, to: ka });
  });

  const used = new Uint8Array(edges.length);
  const chains = [];
  function walkChain(startKey) {
    const chain = [nodes.get(startKey)];
    let cur = startKey;
    while (true) {
      const list = adj.get(cur) || [];
      const next = list.find((e) => !used[e.idx]);
      if (!next) break;
      used[next.idx] = 1;
      cur = next.to;
      chain.push(nodes.get(cur));
    }
    if (chain.length >= 2) chains.push(chain);
  }
  for (const [k, list] of adj.entries()) {
    if (list.length === 1 && list.some((e) => !used[e.idx])) walkChain(k);
  }
  for (const [k, list] of adj.entries()) {
    while (list.some((e) => !used[e.idx])) walkChain(k);
  }
  return chains;
}

// ---------- 5. centerline profile helper for Block B X-Y plot ----------
function profileXRange(sec, state) {
  const px = state?.mech?.px ?? 1;
  const pz = state?.mech?.pz ?? 0;
  if (sec === 0) return [0.36, Math.max(3.6, Math.hypot(px, pz) * 1.15)];
  if (sec === 3) return [-D_PLATE + 0.08, D_PLATE - 0.08];
  const span = Math.max(3.4, Math.abs(px) * 1.15);
  return [-span, span];
}

function profileFieldAtU(u, state) {
  const sec = state.section ?? 0;
  const q = state.rate;
  const sgn = state.mech.sign ?? 1;
  const [x0, x1] = profileXRange(sec, state);
  const x = x0 + (x1 - x0) * u;
  const z = (sec === 1 || sec === 2) ? 0.34 : 0;
  return evalField(sec, x, 0, z, q, sgn).Emag;
}

function profileDot(state) {
  const sec = state.section ?? 0;
  const q = state.rate;
  const sgn = state.mech.sign ?? 1;
  const px = state.mech.px ?? DEFAULT_PROBES[sec].x;
  const pz = state.mech.pz ?? DEFAULT_PROBES[sec].z;
  const e = evalField(sec, px, 0, pz, q, sgn).Emag;
  if (sec === 0) {
    const [r0, r1] = profileXRange(0, state);
    const r = Math.hypot(px, pz);
    return { x: clamp01((r - r0) / (r1 - r0)), y: e };
  }
  const [x0, x1] = profileXRange(sec, state);
  return { x: clamp01((px - x0) / (x1 - x0)), y: e };
}

// ---------- 6. mechanism definition ----------
export default {
  id: 'electric-fields',
  sectionMode: true,
  autoPlay: false,
  skipIntro: true,
  hideSlow: true,
  hideAutoOrbitToggle: true,
  instrLabel: 'Probe & Equipotential Lab',
  orbitHint: 'Click/drag grid: place +q · Scroll: zoom · Right-drag: orbit 3D',
  meta: {
    pageTitle: 'How Electric Fields Work',
    fig: 'Fig. 03',
    caption: 'Interactive 2D & 3D electrostatics · field lines · equipotentials',
    title: 'How <em>electric fields</em> shape space around charges',
    lede: 'Choose a charge setup, place +q close or far away anywhere on the grid, draw equipotential lines, or toggle the 3D electric field view.',
    titleBlock: { title: 'Electric fields', dwg: 'ELC-EF-003' },
    alt: 'Interactive 2D and 3D electrostatics lab for isolated, opposite, like, and uniform electric fields',
    layout: 'sheet',
  },
  cycle: 360,
  start: 0,
  initialSection: 0,
  phases: [
    {
      name: 'Isolated charge', nick: 'radial', list: 'Isolated', short: 'ISOLATED', key: 'Isolated', color: HUES.blue,
      text: 'A single point charge sends radial field lines equally into 3D space. Move +q right up close or far out across the grid, draw equipotentials, and toggle 3D Field to see concentric equipotential spheres.',
    },
    {
      name: 'Opposite charges', nick: 'dipole', list: 'Opposite', short: 'OPPOSITE', key: 'Opposite', color: HUES.red,
      text: 'Field lines leave the positive (+) charge and curve smoothly into the negative (-) charge in 3D lobes. Place +q close to either pole or far away, draw V lines, and toggle 3D Field to inspect the revolved dipole cage.',
    },
    {
      name: 'Like charges', nick: 'repel', list: 'Like', short: 'LIKE', color: HUES.ochre, key: 'Like',
      text: 'Two identical charges push each other\'s field lines apart into 3D plumes, leaving a calm null point at the center where E = 0. Place +q at the center vs far out and draw V to compare inner loops with the outer peanut contour.',
    },
    {
      name: 'Uniform field', nick: 'plates', list: 'Uniform', short: 'UNIFORM', key: 'Uniform', color: HUES.grey,
      text: 'Two parallel oppositely charged plates create a uniform bundle of straight field lines and constant |E| everywhere between them. Toggle 3D Field to see the full 3D capacitor volume and flat parallel equipotential sheets.',
    },
  ],
  instances: { count: 1, label: 'Choose section', short: 'Section', offset: [0] },
  driver: {
    inputLabel: 'Charge strength',
    inputHint: 'Adjusts charge magnitude Q, field strength |E|, and number of field lines.',
    input: 0.45,
    start: 3.25,
    target: (x) => 1 + 5 * x,
    inputFormat: (x) => `${(1 + 5 * x).toFixed(1)} uC`,
    inertia: 4.0,
    degPerSec: (q) => 30 + q * 10,
  },
  speeds: [4, 2, 1],
  speed: 1,
  gauge: {
    max: 10, red: 8, minor: 0.5, major: 2, label: 'PROBE |E|', unit: 'kV/m',
    value: (s) => {
      const sec = s.section ?? 0;
      const px = s.mech.px ?? DEFAULT_PROBES[sec].x;
      const pz = s.mech.pz ?? DEFAULT_PROBES[sec].z;
      return evalField(sec, px, 0, pz, s.rate, s.mech.sign ?? 1).Emag;
    },
    readout: (v) => v.toFixed(1),
  },
  plot: {
    singleCurve: true,
    label: 'Field |E| across section',
    y: (u, s) => profileFieldAtU(u, s),
    dot: (s) => profileDot(s),
    yUnit: 'kV/m',
    xTicks: ['close / left', 'position', 'far / right'],
    yMin: 5,
  },
  chart: {
    label: 'Choose charge configuration',
    note: 'Click or drag anywhere on the grid (scroll to zoom out even farther) to place +q close or far away. Toggle "3D Field" to view and orbit the full 3D field.',
    markers: [],
  },
  layers: [
    { key: 'fields', label: 'Field lines', on: true },
    { key: 'cage3d', label: '3D field', on: false },
    { key: 'presetV', label: 'Full V map', on: false },
    { key: 'drawnV', label: 'Drawn V lines', on: true },
    { key: 'dragOrbit', label: 'Drag orbits', on: false },
  ],
  tools: [
    {
      label: 'Draw V line at +q',
      primary: true,
      full: true,
      title: 'Draw the exact equipotential contour (and 3D surface in 3D mode) through +q (shortcut: V)',
      run: (s) => s.mech.drawAtProbe?.(),
    },
    {
      label: 'Draw V on click',
      toggle: true,
      title: 'When active, clicking anywhere places +q and draws the equipotential line there',
      active: (s) => !!s.mech.autoDrawV,
      run: (s) => { s.mech.autoDrawV = !s.mech.autoDrawV; },
    },
    {
      label: 'Clear drawn V',
      title: 'Erase custom drawn equipotential lines in this section',
      run: (s) => s.mech.clearDrawn?.(),
    },
    {
      label: 'Field lines: ON',
      toggle: true,
      title: 'Turn electric field lines on or off',
      active: (s) => s.layers.fields !== false,
      labelFn: (s) => (s.layers.fields !== false ? 'Field lines: ON' : 'Field lines: OFF'),
      run: (s, api) => api.setLayerValue('fields', !s.layers.fields),
    },
    {
      label: '3D Field: OFF',
      toggle: true,
      title: 'Toggle full 3D volumetric electric field tubes, 3D equipotential surfaces, and 3D camera',
      active: (s) => !!s.layers.cage3d,
      labelFn: (s) => (s.layers.cage3d ? '3D Field: ON' : '3D Field: OFF'),
      run: (s, api) => api.setLayerValue('cage3d', !s.layers.cage3d),
    },
    {
      label: 'Flip +/-',
      title: 'Reverse positive and negative source polarity',
      run: (s) => { s.mech.sign = -(s.mech.sign ?? 1); },
    },
    {
      label: 'Reset +q',
      title: 'Return +q test charge to its placed start spot (or default spot)',
      run: (s, api) => s.mech.resetProbe?.(api),
    },
  ],
  actions: [],
  view: {
    target: [0, 0, 0],
    dir: [0, 7.8, 0.7],      // crisp overhead 2D view by default; tilts automatically when 3D Field is toggled ON
    radius: 3.35,
    radiusFigure: 3.25,
    radiusCompact: 4.9,
    minDist: 3.5,
    maxDist: 48,
    box: [[-2.95, -1.9, -2.15], [2.95, 1.9, 2.15]],
  },
  compactCallouts: [1, 2, 4, 5],

  // ---------- 7. build interactive 2D + 3D scene ----------
  build(kit, api) {
    const { state } = api;
    const { THREE, part, ghost, toon, M, inkRing, renderer, scene, camera, controls, INK } = kit;
    const root = new THREE.Group();
    scene.add(root);

    const canvas = renderer.domElement;
    const vtagBox = document.getElementById('vtags');

    state.mech.sign = 1;
    state.mech.autoDrawV = false;
    const probePos = DEFAULT_PROBES.map((p) => ({ x: p.x, z: p.z }));
    const savedStart = DEFAULT_PROBES.map((p) => ({ x: p.x, z: p.z }));
    state.mech.px = probePos[state.section].x;
    state.mech.pz = probePos[state.section].z;

    const UP = new THREE.Vector3(0, 1, 0);
    const tmpDir = new THREE.Vector3();
    const tmpPos = new THREE.Vector3();

    // ---------- crisp high-DPI camera-facing sign sprites (+, -, +q) ----------
    function makeBadgeTexture(symbol, bgHex, fgHex, borderHex = '#161b26') {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 192;
      const x = cv.getContext('2d');
      if (bgHex) {
        x.beginPath();
        x.arc(96, 96, 78, 0, Math.PI * 2);
        x.fillStyle = bgHex;
        x.fill();
        x.lineWidth = 10;
        x.strokeStyle = borderHex;
        x.stroke();
      }
      if (symbol === '+' || symbol === '-') {
        x.fillStyle = borderHex;
        x.fillRect(42, 80, 108, 32);
        if (symbol === '+') x.fillRect(80, 42, 32, 108);
        x.fillStyle = fgHex;
        x.fillRect(46, 84, 100, 24);
        if (symbol === '+') x.fillRect(84, 46, 24, 100);
      } else if (symbol === '+q') {
        x.fillStyle = '#161b26';
        x.fillRect(52, 85, 88, 22);
        x.fillRect(85, 52, 22, 88);
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const texPlus = makeBadgeTexture('+', null, '#ffffff', '#161b26');
    const texMinus = makeBadgeTexture('-', null, '#ffffff', '#161b26');
    const texPlatePlus = makeBadgeTexture('+', '#e5482f', '#ffffff', '#161b26');
    const texPlateMinus = makeBadgeTexture('-', '#2574db', '#ffffff', '#161b26');
    const texProbePlus = makeBadgeTexture('+q', null, '#161b26', '#161b26');

    function makeSignSprite(tex, scale) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }));
      sp.scale.setScalar(scale);
      sp.renderOrder = 30;
      return sp;
    }

    // ---------- shared materials ----------
    const matPos = toon('#e84a30');
    const matNeg = toon('#2676dc');
    const matProbe = toon('#f6be3b');
    const matForce = toon('#e5482f');

    const fieldTubeMat = new THREE.MeshBasicMaterial({ color: INK });
    const field3DTubeMat = new THREE.MeshBasicMaterial({ color: 0x3b4a62, transparent: true, opacity: 0.78 });
    const arrowMat = new THREE.MeshBasicMaterial({ color: INK });
    const arrow3DMat = new THREE.MeshBasicMaterial({ color: 0x2b394e });
    const arrowGeo = new THREE.ConeGeometry(0.058, 0.19, 20);
    const arrow3DGeo = new THREE.ConeGeometry(0.048, 0.16, 16);

    const presetPosMat = new THREE.LineDashedMaterial({ color: HUES.red, transparent: true, opacity: 0.58, dashSize: 0.10, gapSize: 0.07 });
    const presetNegMat = new THREE.LineDashedMaterial({ color: HUES.blue, transparent: true, opacity: 0.58, dashSize: 0.10, gapSize: 0.07 });
    const presetZeroMat = new THREE.LineDashedMaterial({ color: INK, transparent: true, opacity: 0.58, dashSize: 0.13, gapSize: 0.06 });
    const presetSaddleMat = new THREE.LineDashedMaterial({ color: HUES.ochre, transparent: true, opacity: 0.68, dashSize: 0.11, gapSize: 0.06 });

    const shellPosMat = new THREE.MeshBasicMaterial({ color: HUES.red, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
    const shellNegMat = new THREE.MeshBasicMaterial({ color: HUES.blue, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
    const shellDrawnMat = new THREE.MeshBasicMaterial({ color: '#0b8770', transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide });
    const drawnDash3DMat = new THREE.LineDashedMaterial({ color: '#0b8770', transparent: true, opacity: 0.75, dashSize: 0.10, gapSize: 0.07 });

    const drawnPosMat = new THREE.MeshBasicMaterial({ color: '#0b8770' });
    const rightAngleMat = new THREE.LineBasicMaterial({ color: '#0b8770' });

    const charges = [];     // { sphere, sprite, baseSign }
    const plates = [];      // { innerFace, sprites, baseSign }
    const allArrows = [];   // { mesh, dir }

    function makeCharge(parent, x, baseSign) {
      const g = new THREE.Group();
      g.position.set(x, 0, 0);
      parent.add(g);
      const sphere = part(new THREE.SphereGeometry(R_CHARGE, 36, 28), baseSign > 0 ? matPos : matNeg);
      g.add(sphere);
      const sprite = makeSignSprite(baseSign > 0 ? texPlus : texMinus, 0.42);
      sprite.position.set(0, 0.02, 0);
      g.add(sprite);
      const entry = { group: g, sphere, sprite, baseSign };
      charges.push(entry);
      return entry;
    }

    function addArrow3D(parent, pos, dirVec, is3D = false) {
      const mesh = new THREE.Mesh(is3D ? arrow3DGeo : arrowGeo, is3D ? arrow3DMat : arrowMat);
      mesh.position.copy(pos);
      const dir = dirVec.clone().normalize();
      mesh.quaternion.setFromUnitVectors(UP, dir);
      parent.add(mesh);
      allArrows.push({ mesh, dir });
    }

    function addFieldTube3D(parent, pts3, arrowFracs = [], radius = 0.014, is3D = false) {
      if (pts3.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(pts3, false, 'centripetal');
      const segs = Math.max(10, Math.min(96, pts3.length * 2));
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, segs, radius, 8, false),
        is3D ? field3DTubeMat : fieldTubeMat
      );
      tube.renderOrder = is3D ? 3 : 4;
      parent.add(tube);

      for (const f of arrowFracs) {
        const u = clamp01(f);
        const pos = curve.getPointAt(u);
        const tan = curve.getTangentAt(u);
        if (tan.lengthSq() > 1e-6) addArrow3D(parent, pos, tan, is3D);
      }
    }

    function addFieldTube2D(parent, pts2, arrowArcs = []) {
      if (pts2.length < 2) return;
      const pts3 = pts2.map(([x, z]) => new THREE.Vector3(x, 0, z));
      const curve = new THREE.CatmullRomCurve3(pts3, false, 'centripetal');
      const segs = Math.max(12, Math.min(96, pts2.length * 2));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.015, 8, false), fieldTubeMat);
      tube.renderOrder = 4;
      parent.add(tube);

      const len = curveLength2D(pts2);
      for (const dist of arrowArcs) {
        if (dist > 0.15 && dist < len - 0.12) {
          const p = pointAtArc2D(pts2, dist);
          if (p) addArrow3D(parent, new THREE.Vector3(p.x, 0.01, p.z), new THREE.Vector3(p.tx, 0, p.tz), false);
        }
      }
    }

    function revolve2DTo3D(pts2, az) {
      const s = Math.sin(az), c = Math.cos(az);
      return pts2.map(([x, r]) => new THREE.Vector3(x, r * s, r * c));
    }

    function addDashedPolyline(parent, pts3, mat) {
      if (pts3.length < 2) return;
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), mat);
      line.computeLineDistances();
      parent.add(line);
    }

    function buildBoldDashedGroup(chains, mat, y = 0.008, dash = 0.11, gap = 0.07, radius = 0.013) {
      const grp = new THREE.Group();
      for (const rawCh of chains) {
        const len = curveLength2D(rawCh);
        const ch = len > 0.08 ? resample2D(rawCh, Math.max(8, Math.ceil(len / 0.03))) : rawCh;
        let acc = 0;
        for (let i = 1; i < ch.length; i++) {
          const ax = ch[i - 1][0], az = ch[i - 1][1];
          const bx = ch[i][0], bz = ch[i][1];
          const seg = Math.hypot(bx - ax, bz - az);
          if (seg < 1e-5) continue;
          const phase = acc % (dash + gap);
          if (phase < dash) {
            const p0 = new THREE.Vector3(ax, y, az);
            const p1 = new THREE.Vector3(bx, y, bz);
            const mid = p0.clone().lerp(p1, 0.5);
            const dir = p1.clone().sub(p0);
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, seg, 6), mat);
            cyl.position.copy(mid);
            cyl.quaternion.setFromUnitVectors(UP, dir.normalize());
            cyl.renderOrder = 6;
            grp.add(cyl);
          }
          acc += seg;
        }
      }
      return grp;
    }

    function makeRightAngle(parent, origin, tan2D, norm2D, size = 0.15) {
      const t = new THREE.Vector2(tan2D[0], tan2D[1]).normalize().multiplyScalar(size);
      const n = new THREE.Vector2(norm2D[0], norm2D[1]).normalize().multiplyScalar(size);
      const p0 = new THREE.Vector3(origin[0] + t.x, 0.02, origin[1] + t.y);
      const p1 = new THREE.Vector3(origin[0] + t.x + n.x, 0.02, origin[1] + t.y + n.y);
      const p2 = new THREE.Vector3(origin[0] + n.x, 0.02, origin[1] + n.y);
      parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p0, p1, p2]), rightAngleMat));
    }

    // ---------- section containers ----------
    const sections = [0, 1, 2, 3].map(() => {
      const g = new THREE.Group();
      root.add(g);
      const fieldsWrap = new THREE.Group();
      const tiers = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
      tiers.forEach((t) => fieldsWrap.add(t));
      const fields3D = new THREE.Group();   // volumetric 3D field tubes (shown when fields && cage3d)
      fieldsWrap.add(fields3D);
      const presetV = new THREE.Group();
      const presetV3D = new THREE.Group();  // 3D equipotential surfaces for Full V map
      presetV.add(presetV3D);
      const drawnV = new THREE.Group();
      g.add(fieldsWrap, presetV, drawnV);
      return { g, fieldsWrap, tiers, fields3D, presetV, presetV3D, drawnV, drawnItems: [], anchors: {} };
    });

    // ==========================================================
    // SECTION 0: ISOLATED CHARGE (2D + 3D SPHERICAL STARBURST)
    // ==========================================================
    {
      const S = sections[0];
      makeCharge(S.g, 0, 1);

      [8, 12, 16].forEach((count, tierIdx) => {
        const tg = S.tiers[tierIdx];
        for (let k = 0; k < count; k++) {
          const a = (k / count) * Math.PI * 2;
          const c = Math.cos(a), s = Math.sin(a);
          const pts = resample2D([
            [c * R_CHARGE, s * R_CHARGE],
            [c * 3.35, s * 3.35],
          ], 28);
          addFieldTube2D(tg, pts, [0.75, 1.75, 2.75]);
        }
      });

      // True 3D spherical burst: +Y/-Y poles + two 3D elevation rings (+-38 deg and +-65 deg)
      for (const sy of [-1, 1]) {
        addFieldTube3D(S.fields3D, [
          new THREE.Vector3(0, sy * R_CHARGE, 0),
          new THREE.Vector3(0, sy * 2.25, 0),
        ], [0.42, 0.80], 0.012, true);
      }
      for (const [elDeg, nAz, rMax] of [[36, 8, 2.35], [-36, 8, 2.35], [64, 4, 2.15], [-64, 4, 2.15]]) {
        const el = elDeg * D2R;
        for (let k = 0; k < nAz; k++) {
          const az = ((k + 0.5) / nAz) * Math.PI * 2;
          const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
          addFieldTube3D(S.fields3D, [
            dir.clone().multiplyScalar(R_CHARGE),
            dir.clone().multiplyScalar(rMax),
          ], [0.42, 0.80], 0.0115, true);
        }
      }

      // Full V map + 3D concentric equipotential spheres
      [2.40, 1.20, 0.80, 0.60, 0.48].forEach((r, idx) => {
        const pts = Array.from({ length: 85 }, (_, k) => {
          const a = (k / 84) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
        });
        addDashedPolyline(S.presetV, pts, presetPosMat);
        if (idx <= 2) {
          S.presetV3D.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), shellPosMat));
          const xy = Array.from({ length: 73 }, (_, k) => { const a = (k / 72) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0); });
          const yz = Array.from({ length: 73 }, (_, k) => { const a = (k / 72) * Math.PI * 2; return new THREE.Vector3(0, Math.sin(a) * r, Math.cos(a) * r); });
          addDashedPolyline(S.presetV3D, xy, presetPosMat);
          addDashedPolyline(S.presetV3D, yz, presetPosMat);
        }
      });

      S.anchors = {
        charge1: new THREE.Vector3(-R_CHARGE - 0.03, 0, -0.05),
        field: new THREE.Vector3(0, 0, -1.45),
      };
    }

    // ==========================================================
    // SECTION 1: OPPOSITE CHARGES (2D + 3D REVOLVED DIPOLE CAGE)
    // ==========================================================
    {
      const S = sections[1];
      makeCharge(S.g, -A, 1);
      makeCharge(S.g, A, -1);

      [10, 14, 18].forEach((totalLines, tierIdx) => {
        const tg = S.tiers[tierIdx];
        addFieldTube2D(tg, resample2D([[-A + R_CHARGE, 0], [A - R_CHARGE, 0]], 32), [A - R_CHARGE]);
        addFieldTube2D(tg, resample2D([[-A - R_CHARGE, 0], [-X_ELL, 0]], 24), [0.85, 1.85]);
        addFieldTube2D(tg, resample2D([[X_ELL, 0], [A + R_CHARGE, 0]], 24), [0.65, 1.65]);

        const halfPairs = (totalLines - 2) / 2;
        for (let k = 0; k < halfPairs; k++) {
          const deg = ((k + 1) / (halfPairs + 1)) * 180;
          const a = deg * D2R;
          for (const sz of [1, -1]) {
            const rawL = traceStream2D(1, -A + (R_CHARGE + 0.01) * Math.cos(a), sz * (R_CHARGE + 0.01) * Math.sin(a), 1, A);
            const ptsL = resample2D(rawL, 72);
            const lenL = curveLength2D(ptsL);
            const connects = Math.hypot(ptsL[ptsL.length - 1][0] - A, ptsL[ptsL.length - 1][1]) <= R_CHARGE + 0.08;
            addFieldTube2D(tg, ptsL, [connects ? lenL * 0.5 : Math.min(1.1, lenL * 0.55)]);

            if (!connects) {
              const rawR = traceStream2D(1, A - (R_CHARGE + 0.01) * Math.cos(a), sz * (R_CHARGE + 0.01) * Math.sin(a), -1, null);
              const ptsR = resample2D(rawR.reverse(), 52);
              const lenR = curveLength2D(ptsR);
              addFieldTube2D(tg, ptsR, [lenR * 0.52]);
            }
          }
        }
      });

      // True 3D revolved dipole cage across 4 inclined azimuthal planes (60, 120, 240, 300 deg) + vertical (90, 270 deg)
      for (const deg of [36, 68, 102, 138]) {
        const a = deg * D2R;
        const rawL = traceStream2D(1, -A + (R_CHARGE + 0.01) * Math.cos(a), (R_CHARGE + 0.01) * Math.sin(a), 1, A, X_ELL_3D, Z_ELL_3D);
        const ptsL = resample2D(rawL, 56);
        const connects = Math.hypot(ptsL[ptsL.length - 1][0] - A, ptsL[ptsL.length - 1][1]) <= R_CHARGE + 0.08;
        const rawR = connects ? null : resample2D(
          traceStream2D(1, A - (R_CHARGE + 0.01) * Math.cos(a), (R_CHARGE + 0.01) * Math.sin(a), -1, null, X_ELL_3D, Z_ELL_3D).reverse(),
          44
        );
        for (const azDeg of [60, 90, 120, 240, 270, 300]) {
          // Keep 90/270 for inner loops and 60/120/240/300 for main 3D volume so it looks airy and sculptural
          if ((azDeg === 90 || azDeg === 270) && deg > 110) continue;
          if ((azDeg !== 90 && azDeg !== 270) && (deg === 102)) continue;
          const az = azDeg * D2R;
          addFieldTube3D(S.fields3D, revolve2DTo3D(ptsL, az), [0.5], 0.0115, true);
          if (rawR) addFieldTube3D(S.fields3D, revolve2DTo3D(rawR, az), [0.5], 0.0115, true);
        }
      }

      // Full V map + 3D revolved equipotential shells & V = 0 midplane sheet
      const maskDip = (x, z) => Math.hypot(x + A, z) < R_CHARGE + 0.03 || Math.hypot(x - A, z) < R_CHARGE + 0.03;
      const vDip = (x, z) => normPotential(1, x, z);
      for (const lvl of [0.42, 0.85, 1.45, 2.35]) {
        const posChains = marchingContours2D(vDip, lvl, -3.4, 3.4, -2.5, 2.5, 112, 84, maskDip);
        const negChains = marchingContours2D(vDip, -lvl, -3.4, 3.4, -2.5, 2.5, 112, 84, maskDip);
        for (const ch of posChains) {
          addDashedPolyline(S.presetV, ch.map(([x, z]) => new THREE.Vector3(x, 0, z)), presetPosMat);
          if (lvl === 0.85 || lvl === 1.45) addDashedPolyline(S.presetV3D, ch.map(([x, r]) => new THREE.Vector3(x, r, 0)), presetPosMat);
        }
        for (const ch of negChains) {
          addDashedPolyline(S.presetV, ch.map(([x, z]) => new THREE.Vector3(x, 0, z)), presetNegMat);
          if (lvl === 0.85 || lvl === 1.45) addDashedPolyline(S.presetV3D, ch.map(([x, r]) => new THREE.Vector3(x, r, 0)), presetNegMat);
        }
      }
      addDashedPolyline(S.presetV, [new THREE.Vector3(0, 0, -2.5), new THREE.Vector3(0, 0, 2.5)], presetZeroMat);
      S.presetV3D.add(ghost(new THREE.BoxGeometry(0.01, 2.2, 3.4)));

      S.anchors = {
        charge1: new THREE.Vector3(-A - R_CHARGE - 0.03, 0, 0),
        charge2: new THREE.Vector3(A + R_CHARGE + 0.03, 0, 0),
        field: new THREE.Vector3(0, 0, -1.02),
      };
    }

    // ==========================================================
    // SECTION 2: LIKE CHARGES (2D + 3D TWIN REPELLING PLUMES)
    // ==========================================================
    {
      const S = sections[2];
      makeCharge(S.g, -A, 1);
      makeCharge(S.g, A, 1);

      [8, 12, 16].forEach((perCharge, tierIdx) => {
        const tg = S.tiers[tierIdx];
        const half = perCharge / 2;
        for (let k = 0; k < half; k++) {
          const deg = ((k + 0.5) / half) * 180;
          const a = deg * D2R;
          const raw = traceStream2D(2, -A + (R_CHARGE + 0.01) * Math.cos(a), (R_CHARGE + 0.01) * Math.sin(a), 1, null);
          const ptsLTop = resample2D(raw, 68);
          const ptsLBot = ptsLTop.map(([x, z]) => [x, -z]);
          const ptsRTop = ptsLTop.map(([x, z]) => [-x, z]);
          const ptsRBot = ptsLTop.map(([x, z]) => [-x, -z]);
          const len = curveLength2D(ptsLTop);
          const arcs = len > 2.2 ? [0.75, 1.85] : [Math.min(0.75, len * 0.55)];
          addFieldTube2D(tg, ptsLTop, arcs);
          addFieldTube2D(tg, ptsLBot, arcs);
          addFieldTube2D(tg, ptsRTop, arcs);
          addFieldTube2D(tg, ptsRBot, arcs);
        }
      });

      // True 3D twin repelling plumes across inclined 3D planes around X-axis
      for (const deg of [25, 65, 115, 155]) {
        const a = deg * D2R;
        const ptsL = resample2D(
          traceStream2D(2, -A + (R_CHARGE + 0.01) * Math.cos(a), (R_CHARGE + 0.01) * Math.sin(a), 1, null, X_ELL_3D, Z_ELL_3D),
          52
        );
        const ptsR = ptsL.map(([x, r]) => [-x, r]);
        for (const azDeg of [60, 120, 240, 300]) {
          const az = azDeg * D2R;
          addFieldTube3D(S.fields3D, revolve2DTo3D(ptsL, az), [0.48], 0.0115, true);
          addFieldTube3D(S.fields3D, revolve2DTo3D(ptsR, az), [0.48], 0.0115, true);
        }
      }

      // Null-point crosshair & ring at (0, 0, 0)
      S.g.add(inkRing(0.16, 0.01, new THREE.LineBasicMaterial({ color: HUES.ochre }), 36));
      S.g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.09, 0.012, 0), new THREE.Vector3(0.09, 0.012, 0),
      ]), new THREE.LineBasicMaterial({ color: HUES.ochre })));
      S.g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.012, -0.09), new THREE.Vector3(0, 0.012, 0.09),
      ]), new THREE.LineBasicMaterial({ color: HUES.ochre })));

      const maskLike = (x, z) => Math.hypot(x + A, z) < R_CHARGE + 0.03 || Math.hypot(x - A, z) < R_CHARGE + 0.03;
      const vLike = (x, z) => normPotential(2, x, z);
      for (const lvl of [0.68, 0.92, 1.18, 1.95, 2.70]) {
        for (const ch of marchingContours2D(vLike, lvl, -3.5, 3.5, -2.6, 2.6, 112, 84, maskLike)) {
          addDashedPolyline(S.presetV, ch.map(([x, z]) => new THREE.Vector3(x, 0, z)), presetPosMat);
          if (lvl === 1.18 || lvl === 1.95) addDashedPolyline(S.presetV3D, ch.map(([x, r]) => new THREE.Vector3(x, r, 0)), presetPosMat);
        }
      }
      for (const ch of marchingContours2D(vLike, 2 / A, -3.5, 3.5, -2.6, 2.6, 112, 84, maskLike)) {
        addDashedPolyline(S.presetV, ch.map(([x, z]) => new THREE.Vector3(x, 0, z)), presetSaddleMat);
        addDashedPolyline(S.presetV3D, ch.map(([x, r]) => new THREE.Vector3(x, r, 0)), presetSaddleMat);
      }

      S.anchors = {
        charge1: new THREE.Vector3(-A - R_CHARGE - 0.03, 0, 0),
        charge2: new THREE.Vector3(A + R_CHARGE + 0.03, 0, 0),
        field: new THREE.Vector3(-0.95, 0, -1.25),
        nullPt: new THREE.Vector3(0, 0.02, 0),
      };
    }

    // ==========================================================
    // SECTION 3: UNIFORM FIELD (2D + 3D CAPACITOR VOLUME)
    // ==========================================================
    {
      const S = sections[3];
      const plateGeo = new THREE.BoxGeometry(0.14, PLATE_H, PLATE_W);
      const innerGeo = new THREE.BoxGeometry(0.04, PLATE_H + 0.02, PLATE_W + 0.02);
      const postGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.32, 16).rotateZ(Math.PI / 2);

      for (const baseSign of [1, -1]) {
        const px = baseSign > 0 ? -D_PLATE : D_PLATE;
        const pg = new THREE.Group();
        pg.position.set(px, 0, 0);
        S.g.add(pg);
        pg.add(part(plateGeo, M.alloy));

        const innerFace = part(innerGeo, baseSign > 0 ? matPos : matNeg, { outline: false });
        innerFace.position.x = baseSign > 0 ? 0.055 : -0.055;
        pg.add(innerFace);

        const post = part(postGeo, M.copper);
        post.position.x = baseSign > 0 ? -0.22 : 0.22;
        pg.add(post);

        const sprites = [-0.86, -0.43, 0, 0.43, 0.86].map((z) => {
          const sp = makeSignSprite(baseSign > 0 ? texPlatePlus : texPlateMinus, 0.26);
          sp.position.set(0, PLATE_H * 0.5 + 0.02, z);
          pg.add(sp);
          return sp;
        });

        plates.push({ innerFace, sprites, baseSign });
      }

      const x0 = -D_PLATE + 0.08, x1 = D_PLATE - 0.08;
      [5, 7, 9].forEach((rows, tierIdx) => {
        const tg = S.tiers[tierIdx];
        for (let k = 0; k < rows; k++) {
          const z = -0.94 + (1.88 * k) / (rows - 1);
          const pts = resample2D([[x0, z], [x1, z]], 32);
          addFieldTube2D(tg, pts, [1.10, 2.44]);
        }
        for (const sz of [-1, 1]) {
          const fr = new THREE.CatmullRomCurve3([
            new THREE.Vector3(x0, 0, sz * 1.12),
            new THREE.Vector3(0, 0, sz * 1.34),
            new THREE.Vector3(x1, 0, sz * 1.12),
          ]).getPoints(32).map((v) => [v.x, v.z]);
          addFieldTube2D(tg, fr, [1.80]);
        }
      });

      // True 3D capacitor bundle: upper & lower layers (y = +-0.58) + top/bottom 3D edge fringing
      for (const y of [-0.58, 0.58]) {
        for (const z of [-0.84, -0.28, 0.28, 0.84]) {
          addFieldTube3D(S.fields3D, [
            new THREE.Vector3(x0, y, z),
            new THREE.Vector3(x1, y, z),
          ], [0.33, 0.70], 0.0115, true);
        }
      }
      for (const sy of [-1, 1]) {
        for (const z of [-0.55, 0.55]) {
          addFieldTube3D(S.fields3D, [
            new THREE.Vector3(x0, sy * 0.88, z),
            new THREE.Vector3(0, sy * 1.08, z),
            new THREE.Vector3(x1, sy * 0.88, z),
          ], [0.5], 0.011, true);
        }
      }

      for (const ex of [-1.2, -0.6, 0, 0.6, 1.2]) {
        const mat = ex < 0 ? presetPosMat : ex > 0 ? presetNegMat : presetZeroMat;
        addDashedPolyline(S.presetV, [
          new THREE.Vector3(ex, 0, -PLATE_W * 0.49),
          new THREE.Vector3(ex, 0, PLATE_W * 0.49),
        ], mat);
        const pSheet = new THREE.Mesh(
          new THREE.PlaneGeometry(PLATE_W * 0.96, PLATE_H * 0.92).rotateY(Math.PI / 2),
          ex < 0 ? shellPosMat : ex > 0 ? shellNegMat : shellDrawnMat
        );
        pSheet.position.x = ex;
        S.presetV3D.add(pSheet);
        const frame = ghost(new THREE.BoxGeometry(0.01, PLATE_H * 0.92, PLATE_W * 0.96));
        frame.position.x = ex;
        S.presetV3D.add(frame);
      }

      S.anchors = {
        plateLeft: new THREE.Vector3(-D_PLATE - 0.08, 0, -PLATE_W * 0.48),
        field: new THREE.Vector3(0, 0, -0.94),
      };
    }

    // ==========================================================
    // INTERACTIVE TEST CHARGE (+q) & FORCE VECTOR ARROW (F)
    // ==========================================================
    const probeGroup = new THREE.Group();
    root.add(probeGroup);
    probeGroup.add(part(new THREE.SphereGeometry(0.155, 28, 22), matProbe));
    const probeRing = inkRing(0.22, 0.008, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.45 }), 36);
    probeGroup.add(probeRing);
    const probeBadge = makeSignSprite(texProbePlus, 0.24);
    probeBadge.position.set(0, 0.02, 0);
    probeGroup.add(probeBadge);

    const forceArrow = new THREE.Group();
    root.add(forceArrow);
    const fShaft = part(new THREE.CylinderGeometry(0.032, 0.032, 1, 14).translate(0, 0.5, 0), matForce, { edges: false });
    const fHead = part(new THREE.ConeGeometry(0.082, 0.24, 16).translate(0, 0.12, 0), matForce, { edges: 35 });
    forceArrow.add(fShaft, fHead);
    const forceTipWorld = new THREE.Vector3();

    // ==========================================================
    // INTERACTIVE EQUIPOTENTIAL DRAWING (2D CONTOUR + 3D SURFACE!)
    // ==========================================================
    function drawEquipotentialAtProbe() {
      const sec = state.section ?? 0;
      const S = sections[sec];
      const px = probePos[sec].x, pz = probePos[sec].z;
      const vNorm = normPotential(sec, px, pz);

      if (S.drawnItems.some((it) => Math.abs(it.vNorm - vNorm) < (sec === 3 ? 0.05 : 0.025))) return;

      // Dynamically size Marching Squares domain so far-away +q placements draw huge outer loops cleanly
      const bx = Math.max(4.4, Math.abs(px) * 1.45 + 1.8);
      const bz = Math.max(3.4, Math.abs(pz) * 1.45 + 1.8);

      let chains = [];
      if (sec === 0) {
        const r = Math.hypot(px, pz);
        chains = [Array.from({ length: 109 }, (_, k) => {
          const a = (k / 108) * Math.PI * 2;
          return [Math.cos(a) * r, Math.sin(a) * r];
        })];
      } else if (sec === 1) {
        if (Math.abs(vNorm) < 0.015) {
          chains = [[[0, -bz], [0, bz]]];
        } else {
          const maskDip = (x, z) => Math.hypot(x + A, z) < R_CHARGE + 0.02 || Math.hypot(x - A, z) < R_CHARGE + 0.02;
          chains = marchingContours2D((x, z) => normPotential(1, x, z), vNorm, -bx, bx, -bz, bz, 128, 96, maskDip);
        }
      } else if (sec === 2) {
        const maskLike = (x, z) => Math.hypot(x + A, z) < R_CHARGE + 0.02 || Math.hypot(x - A, z) < R_CHARGE + 0.02;
        chains = marchingContours2D((x, z) => normPotential(2, x, z), vNorm, -bx, bx, -bz, bz, 128, 96, maskLike);
      } else {
        const cx = Math.max(-D_PLATE + 0.06, Math.min(D_PLATE - 0.06, px));
        chains = [[[cx, -PLATE_W * 0.49], [cx, PLATE_W * 0.49]]];
      }
      if (!chains.length) return;

      const itemGroup = buildBoldDashedGroup(chains, drawnPosMat, 0.010, 0.11, 0.065, 0.013);

      // Build matching 3D equipotential surface child (visible whenever 3D Field is ON!)
      const surf3D = new THREE.Group();
      surf3D.visible = !!state.layers.cage3d;
      if (sec === 0) {
        const r = Math.hypot(px, pz);
        surf3D.add(new THREE.Mesh(new THREE.SphereGeometry(r, 36, 24), shellDrawnMat));
        const xy = Array.from({ length: 73 }, (_, k) => { const a = (k / 72) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0); });
        const yz = Array.from({ length: 73 }, (_, k) => { const a = (k / 72) * Math.PI * 2; return new THREE.Vector3(0, Math.sin(a) * r, Math.cos(a) * r); });
        addDashedPolyline(surf3D, xy, drawnDash3DMat);
        addDashedPolyline(surf3D, yz, drawnDash3DMat);
      } else if (sec === 1 && Math.abs(vNorm) < 0.015) {
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2).rotateY(Math.PI / 2), shellDrawnMat);
        surf3D.add(sheet);
      } else if (sec === 1 || sec === 2) {
        for (const ch of chains) {
          addDashedPolyline(surf3D, ch.map(([x, r]) => new THREE.Vector3(x, r, 0)), drawnDash3DMat);
        }
      } else if (sec === 3) {
        const cx = Math.max(-D_PLATE + 0.06, Math.min(D_PLATE - 0.06, px));
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(PLATE_W * 0.96, PLATE_H * 0.92).rotateY(Math.PI / 2), shellDrawnMat);
        sheet.position.x = cx;
        surf3D.add(sheet);
        const frame = ghost(new THREE.BoxGeometry(0.01, PLATE_H * 0.92, PLATE_W * 0.96));
        frame.position.x = cx;
        surf3D.add(frame);
      }
      itemGroup.add(surf3D);

      // Add a crisp 90-degree crossing marker right at +q
      const ef = evalField(sec, px, 0, pz, 1, 1);
      if (ef.Emag > 0.06) {
        const ex = ef.ex / ef.Emag, ez = ef.ez / ef.Emag;
        makeRightAngle(itemGroup, [px, pz], [ex, ez], [-ez, ex], 0.15);
      }

      S.drawnV.add(itemGroup);

      let tagEl = null;
      const anchor = new THREE.Vector3(px, 0.03, pz);
      if (ef.Emag > 0.06) {
        const tx = -ef.ez / ef.Emag, tz = ef.ex / ef.Emag;
        anchor.x = px + tx * 0.34;
        anchor.z = pz + tz * 0.34;
      }
      if (vtagBox) {
        tagEl = document.createElement('div');
        tagEl.className = 'vtag';
        tagEl.style.color = '#0b8770';
        vtagBox.appendChild(tagEl);
      }

      S.drawnItems.push({ vNorm, group: itemGroup, surf3D, tagEl, anchor });
      if (!state.layers.drawnV) api.setLayerValue('drawnV', true);
    }

    function clearDrawnInSection(sec = state.section ?? 0) {
      const S = sections[sec];
      S.drawnItems.forEach((it) => {
        S.drawnV.remove(it.group);
        it.tagEl?.remove();
      });
      S.drawnItems.length = 0;
    }

    state.mech.drawAtProbe = drawEquipotentialAtProbe;
    state.mech.clearDrawn = () => clearDrawnInSection(state.section ?? 0);

    // ==========================================================
    // UNRESTRICTED NEAR / FAR +q PLACEMENT & SMART 2D/3D INTERACTION
    // ==========================================================
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pointerNDC = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    function clampProbeToSafeZone(sec, x, z) {
      // Allow moving +q anywhere across the grid (up to +-16 units, close or very far away!)
      let cx = Math.max(-MAX_STAGE, Math.min(MAX_STAGE, x));
      let cz = Math.max(-MAX_STAGE, Math.min(MAX_STAGE, z));
      if (sec === 3) {
        // Only prevent +q from overlapping inside the solid metal plate slabs themselves
        for (const plateX of [-D_PLATE, D_PLATE]) {
          if (Math.abs(cx - plateX) < 0.22 && Math.abs(cz) < PLATE_W * 0.54) {
            cx = cx >= plateX ? plateX + 0.22 : plateX - 0.22;
          }
        }
        return { x: cx, z: cz };
      }
      const centers = sec === 0 ? [[0, 0]] : [[-A, 0], [A, 0]];
      const minR = R_CHARGE + 0.09; // let +q get right up close to any source charge!
      for (const [qx, qz] of centers) {
        const dx = cx - qx, dz = cz - qz;
        const d = Math.hypot(dx, dz);
        if (d < minR) {
          const ux = d > 1e-5 ? dx / d : 1;
          const uz = d > 1e-5 ? dz / d : 0;
          cx = qx + ux * minR;
          cz = qz + uz * minR;
        }
      }
      return { x: cx, z: cz };
    }

    function screenToGround(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      return raycaster.ray.intersectPlane(groundPlane, hitPoint) ? hitPoint : null;
    }

    function isPointerNearProbe(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      tmpPos.copy(probeGroup.position).project(camera);
      if (tmpPos.z >= 1) return false;
      const sx = rect.left + (tmpPos.x * 0.5 + 0.5) * rect.width;
      const sy = rect.top + (-tmpPos.y * 0.5 + 0.5) * rect.height;
      return Math.hypot(clientX - sx, clientY - sy) <= 28;
    }

    let draggingProbe = false;
    let pendingClickPlace = false;
    let downX = 0, downY = 0;

    function syncOrbitControlsMode() {
      const orbitPrimary = !!state.layers.dragOrbit || !!state.layers.cage3d;
      canvas.classList.toggle('place-mode', !orbitPrimary);
      controls.mouseButtons = {
        LEFT: orbitPrimary ? THREE.MOUSE.ROTATE : null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
      controls.touches = {
        ONE: orbitPrimary ? THREE.TOUCH.ROTATE : null,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };
    }

    function placeProbeAtClient(clientX, clientY) {
      const pt = screenToGround(clientX, clientY);
      if (!pt) return false;
      api.setPlaying(false);
      const sec = state.section ?? 0;
      const clamped = clampProbeToSafeZone(sec, pt.x, pt.z);
      probePos[sec] = clamped;
      savedStart[sec] = { ...clamped };
      state.mech.px = clamped.x;
      state.mech.pz = clamped.z;
      return true;
    }

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      downX = e.clientX; downY = e.clientY;
      const orbitPrimary = !!state.layers.dragOrbit || !!state.layers.cage3d;

      // In 2D mode, left-click/drag anywhere moves +q; in 3D/orbit mode, grabbing +q drags it,
      // dragging empty space orbits 3D, and a clean click on empty space still places +q!
      if (!orbitPrimary || isPointerNearProbe(e.clientX, e.clientY)) {
        if (!placeProbeAtClient(e.clientX, e.clientY)) return;
        e.stopImmediatePropagation();
        canvas.setPointerCapture(e.pointerId);
        draggingProbe = true;
        pendingClickPlace = false;
      } else {
        pendingClickPlace = true;
      }
    }, { capture: true });

    canvas.addEventListener('pointermove', (e) => {
      if (draggingProbe) {
        e.stopImmediatePropagation();
        placeProbeAtClient(e.clientX, e.clientY);
      } else if (pendingClickPlace && Math.hypot(e.clientX - downX, e.clientY - downY) > 7) {
        pendingClickPlace = false;
      }
    }, { capture: true });

    const finishPointer = (e) => {
      if (draggingProbe) {
        e.stopImmediatePropagation();
        draggingProbe = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch {}
        if (state.mech.autoDrawV && Math.hypot(e.clientX - downX, e.clientY - downY) < 12) {
          drawEquipotentialAtProbe();
        }
      } else if (pendingClickPlace) {
        pendingClickPlace = false;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) <= 7) {
          if (placeProbeAtClient(e.clientX, e.clientY) && state.mech.autoDrawV) {
            drawEquipotentialAtProbe();
          }
        }
      }
    };
    canvas.addEventListener('pointerup', finishPointer, { capture: true });
    canvas.addEventListener('pointercancel', finishPointer, { capture: true });

    // ---------- Play/Reset boundary helpers & Polarity ----------
    function isAtBoundaryOrSink(sec, x, z, sgn) {
      if (Math.abs(x) >= MAX_STAGE - 0.1 || Math.abs(z) >= MAX_STAGE - 0.1) return true;
      if (sec === 3) {
        if (Math.abs(z) < PLATE_W * 0.54) {
          if (sgn > 0 && Math.abs(x - D_PLATE) <= 0.24) return true;
          if (sgn < 0 && Math.abs(x + D_PLATE) <= 0.24) return true;
        }
        return Math.hypot(x, z) > 8.5;
      }
      if (sec === 0) {
        if (sgn < 0 && Math.hypot(x, z) <= R_CHARGE + 0.11) return true;
        return sgn > 0 && Math.hypot(x, z) >= 8.5;
      }
      if (sec === 1) {
        const sinkX = sgn > 0 ? A : -A;
        if (Math.hypot(x - sinkX, z) <= R_CHARGE + 0.11) return true;
        return Math.hypot(x, z) >= 9.0;
      }
      if (sec === 2) {
        if (sgn < 0 && (Math.hypot(x + A, z) <= R_CHARGE + 0.11 || Math.hypot(x - A, z) <= R_CHARGE + 0.11)) return true;
        return sgn > 0 && Math.hypot(x, z) >= 9.0;
      }
      return false;
    }

    state.mech.resetProbe = (a) => {
      const sec = state.section ?? 0;
      a.setPlaying(false);
      const cur = probePos[sec], sv = savedStart[sec];
      if (Math.hypot(cur.x - sv.x, cur.z - sv.z) < 0.02) {
        savedStart[sec] = { ...DEFAULT_PROBES[sec] };
      }
      probePos[sec] = { ...savedStart[sec] };
      state.mech.px = probePos[sec].x;
      state.mech.pz = probePos[sec].z;
    };

    function applyPolarity(sgn) {
      charges.forEach((c) => {
        const eff = c.baseSign * sgn;
        c.sphere.children[0].material = eff > 0 ? matPos : matNeg;
        c.sprite.material.map = eff > 0 ? texPlus : texMinus;
        c.sprite.material.needsUpdate = true;
      });
      plates.forEach((p) => {
        const eff = p.baseSign * sgn;
        p.innerFace.children[0].material = eff > 0 ? matPos : matNeg;
        p.sprites.forEach((sp) => {
          sp.material.map = eff > 0 ? texPlatePlus : texPlateMinus;
          sp.material.needsUpdate = true;
        });
      });
      allArrows.forEach((a) => {
        tmpDir.copy(a.dir).multiplyScalar(sgn);
        a.mesh.quaternion.setFromUnitVectors(UP, tmpDir);
      });
      presetPosMat.color.set(sgn > 0 ? HUES.red : HUES.blue);
      presetNegMat.color.set(sgn > 0 ? HUES.blue : HUES.red);
      shellPosMat.color.set(sgn > 0 ? HUES.red : HUES.blue);
      shellNegMat.color.set(sgn > 0 ? HUES.blue : HUES.red);
    }

    let prevCage3D = !!state.layers.cage3d;
    function applyLayerVisibility(changedKey = null) {
      const is3D = !!state.layers.cage3d;
      sections.forEach((st) => {
        st.fieldsWrap.visible = state.layers.fields !== false;
        st.fields3D.visible = is3D;
        st.presetV.visible = !!state.layers.presetV;
        st.presetV3D.visible = is3D;
        st.drawnV.visible = state.layers.drawnV !== false;
        st.drawnItems.forEach((it) => { if (it.surf3D) it.surf3D.visible = is3D; });
      });
      if (changedKey === 'cage3d' && is3D !== prevCage3D) {
        prevCage3D = is3D;
        if (is3D) api.setCameraDir(2.2, 2.7, 4.5);
        else api.setCameraDir(0, 7.8, 0.7);
      }
      syncOrbitControlsMode();
      api.syncToolButtons?.();
    }
    applyLayerVisibility();

    // ---------- 8. pose(theta, dt, state) ----------
    let shownSec = -1;
    let lastSign = 0;
    let shownTier = -1;

    function pose(theta, dt, s) {
      const sec = s.section ?? 0;
      const sgn = s.mech.sign ?? 1;

      if (sec !== shownSec) {
        shownSec = sec;
        sections.forEach((st, idx) => { st.g.visible = idx === sec; });
      }
      if (sgn !== lastSign) {
        lastSign = sgn;
        applyPolarity(sgn);
      }

      const tier = s.rate < 2.45 ? 0 : s.rate < 4.45 ? 1 : 2;
      if (tier !== shownTier) {
        shownTier = tier;
        sections.forEach((st) => st.tiers.forEach((tg, k) => { tg.visible = k === tier; }));
      }

      let { x: px, z: pz } = probePos[sec];
      if (s.playing && dt > 0) {
        const ef = evalField(sec, px, 0, pz, s.rate, sgn);
        if (ef.Emag < 0.015 || isAtBoundaryOrSink(sec, px, pz, sgn)) {
          api.setPlaying(false);
        } else {
          const speed = Math.min(2.4, 0.42 + 0.25 * ef.Emag);
          const stepDist = speed * dt;
          px += (ef.ex / ef.Emag) * stepDist;
          pz += (ef.ez / ef.Emag) * stepDist;
          if (isAtBoundaryOrSink(sec, px, pz, sgn)) {
            const clamped = clampProbeToSafeZone(sec, px, pz);
            px = clamped.x; pz = clamped.z;
            api.setPlaying(false);
          }
          probePos[sec] = { x: px, z: pz };
        }
      }
      s.mech.px = px;
      s.mech.pz = pz;

      probeGroup.position.set(px, 0, pz);
      const sample = evalField(sec, px, 0, pz, s.rate, sgn);
      if (sample.Emag > 0.025) {
        forceArrow.visible = true;
        const shaftLen = 0.20 + 0.115 * Math.min(sample.Emag, 9.0);
        tmpDir.set(sample.ex, 0, sample.ez).normalize();
        forceArrow.position.set(px, 0, pz).addScaledVector(tmpDir, 0.16);
        forceArrow.quaternion.setFromUnitVectors(UP, tmpDir);
        fShaft.scale.y = shaftLen;
        fHead.position.y = shaftLen;
        forceTipWorld.copy(forceArrow.position).addScaledVector(tmpDir, shaftLen + 0.14);
      } else {
        forceArrow.visible = false;
        forceTipWorld.set(px, 0.16, pz);
      }
    }

    function afterRender(vw, vh, s) {
      const sec = s.section ?? 0;
      const showTags = s.layers.drawnV !== false;
      const scaleV = K_COUL * s.rate * (s.mech.sign ?? 1);
      sections.forEach((st, idx) => {
        const active = idx === sec && showTags;
        st.drawnItems.forEach((it) => {
          if (!it.tagEl) return;
          if (!active) { it.tagEl.style.display = 'none'; return; }
          const vActual = it.vNorm * scaleV;
          const vr = Math.abs(vActual) < 0.03 ? 0 : vActual;
          it.tagEl.textContent = `${vr > 0 ? '+' : ''}${vr.toFixed(1)} V`;
          tmpPos.copy(it.anchor).project(camera);
          if (tmpPos.z >= 1) { it.tagEl.style.display = 'none'; return; }
          const sx = (tmpPos.x * 0.5 + 0.5) * vw;
          const sy = (-tmpPos.y * 0.5 + 0.5) * vh;
          if (sx < -40 || sx > vw + 40 || sy < -30 || sy > vh + 30) {
            it.tagEl.style.display = 'none';
            return;
          }
          it.tagEl.style.display = 'block';
          it.tagEl.style.left = `${sx.toFixed(1)}px`;
          it.tagEl.style.top = `${sy.toFixed(1)}px`;
        });
      });
    }

    const hideCallout = (v) => v.copy(camera.position).addScaledVector(camera.getWorldDirection(tmpPos), -5);
    const secNow = () => state.section ?? 0;

    return {
      root,
      pose,
      afterRender,
      sectionChanged(newSec) {
        state.mech.px = probePos[newSec].x;
        state.mech.pz = probePos[newSec].z;
      },
      onPlay(s) {
        const sec = s.section ?? 0;
        const { x, z } = probePos[sec];
        if (isAtBoundaryOrSink(sec, x, z, s.mech.sign ?? 1)) {
          probePos[sec] = { ...savedStart[sec] };
          s.mech.px = probePos[sec].x;
          s.mech.pz = probePos[sec].z;
        }
      },
      onKey(e) {
        if (e.key === 'v' || e.key === 'V' || e.key === 'e' || e.key === 'E') {
          drawEquipotentialAtProbe();
        }
      },
      setLayer(key) {
        applyLayerVisibility(key);
      },
      callouts: [
        { n: 1, name: 'Source charge', at: (v) => { const idx = secNow(); return idx === 3 ? hideCallout(v) : v.copy(sections[idx].anchors.charge1); } },
        { n: 2, name: 'Field line (E)', at: (v) => (state.layers.fields !== false ? v.copy(sections[secNow()].anchors.field) : hideCallout(v)) },
        { n: 3, name: 'Second charge', at: (v) => { const idx = secNow(); return (idx === 1 || idx === 2) ? v.copy(sections[idx].anchors.charge2) : hideCallout(v); } },
        { n: 4, name: 'Test charge (+q)', at: (v) => v.set(probeGroup.position.x - 0.15, 0.05, probeGroup.position.z) },
        { n: 5, name: 'Force arrow (F)', at: (v) => (forceArrow.visible ? v.copy(forceTipWorld) : hideCallout(v)) },
        { n: 6, name: 'Null point (E = 0)', at: (v) => (secNow() === 2 ? v.copy(sections[2].anchors.nullPt) : hideCallout(v)) },
        { n: 7, name: 'Charged plate', at: (v) => (secNow() === 3 ? v.copy(sections[3].anchors.plateLeft) : hideCallout(v)) },
      ],
      readouts: [
        {
          label: 'Polarity',
          value: ({ s }) => {
            const sgn = s.mech.sign ?? 1;
            const idx = secNow();
            if (idx === 0) return sgn > 0 ? { text: '+Q', cls: 'hot' } : { text: '-Q', cls: 'on' };
            if (idx === 1) return sgn > 0 ? '+Q & -Q' : '-Q & +Q';
            if (idx === 2) return sgn > 0 ? { text: '+Q & +Q', cls: 'hot' } : { text: '-Q & -Q', cls: 'on' };
            return sgn > 0 ? '+V & -V plates' : '-V & +V plates';
          },
        },
        {
          label: 'Probe (+q) spot',
          value: ({ s }) => `(${(s.mech.px ?? 0).toFixed(2)}, ${(-(s.mech.pz ?? 0)).toFixed(2)}) m`,
        },
        {
          label: 'Field |E| at +q',
          value: ({ s }) => {
            const sec = secNow();
            const smp = evalField(sec, s.mech.px ?? 0, 0, s.mech.pz ?? 0, s.rate, s.mech.sign ?? 1);
            if (smp.Emag < 0.08) return { text: '0.00 kV/m (null!)', cls: 'on' };
            return { text: `${smp.Emag.toFixed(2)} kV/m`, cls: smp.Emag >= 6.5 ? 'hot' : '' };
          },
        },
        {
          label: 'Potential V at +q',
          value: ({ s }) => {
            const sec = secNow();
            const smp = evalField(sec, s.mech.px ?? 0, 0, s.mech.pz ?? 0, s.rate, s.mech.sign ?? 1);
            const vr = Math.abs(smp.V) < 0.03 ? 0 : smp.V;
            return { text: `${vr > 0 ? '+' : ''}${vr.toFixed(2)} V`, cls: vr > 0.25 ? 'hot' : vr < -0.25 ? 'on' : '' };
          },
        },
        {
          label: 'View & V lines',
          value: ({ s }) => {
            const n = sections[secNow()].drawnItems.length;
            const mode = s.layers.cage3d ? '3D field' : '2D plane';
            return { text: `${mode} · ${n} V drawn`, cls: s.layers.cage3d ? 'on' : '' };
          },
        },
      ],
    };
  },
};

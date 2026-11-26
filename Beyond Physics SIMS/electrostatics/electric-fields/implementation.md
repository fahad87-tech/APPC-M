# Implementation Log: Electric Fields 3D Inkworks Explainer

This document records each completed step so the project can be replicated cleanly in another IDE or environment.

## Step 1: Global Skill Installation

- **Source:** `D:\APPS\Everything 3D\skills\inkworks`
- **Destination:** `C:\Users\fahad\.gemini\config\skills\inkworks`
- **Command (PowerShell):**
  ```powershell
  $src = "D:\APPS\Everything 3D\skills\inkworks"
  $dst = "C:\Users\fahad\.gemini\config\skills\inkworks"
  if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
  Copy-Item -Path $src -Destination $dst -Recurse
  Get-ChildItem -Path $dst -Recurse -Include "__pycache__","*.pyc",".DS_Store" -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  ```
- **Verified files:** `SKILL.md`, `kit/js/kit.js`, `kit/js/sheet.js`, `references/mechanism-api.md`, `scripts/new_project.py`.

## Step 2: Project Scaffolding

- **Target Directory:** `D:\APPS\Everything 3D\electric-fields`
- **Command (PowerShell, UTF-8 forced for Windows `read_text()` compatibility):**
  ```powershell
  $env:PYTHONUTF8="1"
  python "D:\APPS\Everything 3D\skills\inkworks\scripts\new_project.py" "D:\APPS\Everything 3D\electric-fields" --name electric-fields --from starter --layout sheet
  ```
- **Result:**
  - Copied stock Inkworks kit (`index.html`, `serve.py`, `css/sheet.css`, `js/kit.js`, `js/main.js`, `js/sheet.js`, `vendor/three/*`, `tools/*`).
  - Placed example mechanisms under `js/mechanisms/examples/`.
  - Created `js/mechanisms/electric-fields.js` and updated `index.html` with `<body data-mechanism="electric-fields" data-layout="sheet">`.
  - Updated `index.html` `<title>` to `How Electric Fields Work` and `<meta name="description">` to describe the electrostatics explainer.

## Step 3: Implementing the Electric Fields 3D Mechanism

- **File:** `D:\APPS\Everything 3D\electric-fields\js\mechanisms\electric-fields.js`
- **Stock kit kept untouched:** `js/kit.js`, `js/sheet.js`, `css/sheet.css`.
- **Electrostatic Physics Engine:**
  - `evalField(setupIdx, x, y, z, q, sgn)` computes exact 3D Coulomb fields and potentials for:
    - Setup 0 (`0 - 90 deg`, Isolated): single charge `sgn * q` at origin (`E ~ 1/r^2`, `V ~ 1/r`).
    - Setup 1 (`90 - 180 deg`, Opposite / Dipole): `+sgn * q` at `(-1.35, 0, 0)` and `-sgn * q` at `(+1.35, 0, 0)` with flat `V = 0` midplane at `x = 0`.
    - Setup 2 (`180 - 270 deg`, Like): identical `sgn * q` charges at `(-1.35, 0, 0)` and `(+1.35, 0, 0)` producing an exact `E = 0` null point at `(0, 0, 0)` while `V` remains non-zero.
    - Setup 3 (`270 - 360 deg`, Uniform): parallel plates at `x = -1.85` and `x = +1.85` with constant `|E|` and flat equally spaced equipotential planes.
  - RK4 2D streamline integrator (`traceLine2D`) + arc-length resampler (`resample2D`) builds smooth field curves and the `+q` test probe trajectories.
  - Stitched Marching Squares (`marchingContours2D`) generates continuous polylines (`THREE.Line` + `computeLineDistances()`) for smooth dashed equipotentials and the figure-eight saddle contour.
- **Interactive Controls & Visuals:**
  - `Charge strength` slider controls `Q` (`1.0 - 6.0 uC`), scaling `|E|` gauge, X-Y plot, and intermediate field/equipotential line density.
  - `Flip +/-` action reverses source polarity, sphere/plate colors, `+`/`-` signs, arrowhead directions, test flow direction, and `+V`/`-V` contour colors.
  - `Loop setup` layer toggle locks playback within the active 90-degree setup while still permitting manual step/scrub/phase-jump across setups.
  - 90-degree right-angle square markers highlight perpendicular crossings in every configuration.
- **Verification:** `node --check` passed and zero em dashes confirmed across all files.

## Step 4: Automated Smoke Testing & Visual Verification

- **Server Command:**
  ```powershell
  python "D:\APPS\Everything 3D\electric-fields\serve.py" 9085
  ```
- **Smoke Test (`--browser chromium`, matching CI):**
  ```powershell
  python "D:\APPS\Everything 3D\electric-fields\tools\smoke.py" --browser chromium --url "http://localhost:9085/"
  ```
  - Note: `--browser webkit` on Windows timed out under slow software WebGL at `1440x900` and reported a transient hostname lookup error for Google Fonts on first load; Chromium SwiftShader WebGL ran cleanly with zero errors.
  - Result after final edit: `all checks passed` (exit code 0, zero page/console errors) across all 6 layout/viewport pairs (`sheet` and `figure` at `1440x900`, `1280x720`, `390x844`).
- **Loop Setup Verification:**
  - Enabled `.tog[data-layer=loop]` at `phi = 340.2` (phase 3, Uniform) at `1x` speed and let play run for 3.5 seconds; `phi` wrapped cleanly within phase 3 (`end phase: 3`, `phi: 293.6`).
- **8-Still Visual Inspection & Refinements Applied:**
  - Inspected `iso-sheet.png`, `dip-sheet.png`, `like-sheet.png`, `uni-sheet.png`, `dip-figure.png`, `like-flip.png`, `compact-720.png`, and `phone-sheet.png`.
  - Fixed 4 visual issues discovered in the first still pass (inside `js/mechanisms/electric-fields.js`, keeping the kit stock):
    1. Injected `#ef-callout-fix` (`.callout { transition: none; }`) so callouts `7`, `8`, `9`, and `10` (hidden off-camera on frame 0) render immediately instead of getting stuck at computed `opacity: 0` when `sheet.js` resets opacity each frame.
    2. Moved parallel plate `+`/`-` bars onto the broad `+-X` faces (`M.ceramic` on the colored inner trim, `matPos`/`matNeg` on the light-grey outer face) so they stay crisp with zero edge overhang.
    3. Rounded `|V| < 0.05` to `0.0 V` in the Potential readout so near-zero crossings never display `-0.0 V`.
    4. Increased `view.radiusCompact` from `4.1` to `5.2` so mobile (`390x844`) compact callouts sit cleanly outside the 3D field lines and charges.

## Step 5: Architecture & Classroom Launch Reference

### Project File Map

- `D:\APPS\Everything 3D\electric-fields\index.html` - Page shell configured with `data-mechanism="electric-fields"` and `data-layout="sheet"`.
- `D:\APPS\Everything 3D\electric-fields\js\mechanisms\electric-fields.js` - Electrostatics physics, RK4 field tracer, Marching Squares contour solver, 3D scene builder, polarity flip logic, callouts, and readouts.
- `D:\APPS\Everything 3D\electric-fields\js\kit.js`, `js\sheet.js`, `js\main.js`, `css\sheet.css` - Stock Inkworks rendering kit and sheet/figure layout shell.
- `D:\APPS\Everything 3D\electric-fields\serve.py` - No-cache static HTTP server for ES modules.
- `D:\APPS\Everything 3D\electric-fields\tools\smoke.py`, `shoot.py`, `record.py` - Playwright verification and 60 fps recording utilities.
- `C:\Users\fahad\.gemini\config\skills\inkworks` - Global Antigravity installation of the `inkworks` skill.

### Key Physics & Visual Conventions

- **Field evaluation:** `evalField(setupIdx, x, y, z, q, sgn)` computes Coulomb `E ~ q / r^2` and `V ~ q / r` for Isolated (`0`), Opposite (`1`), and Like (`2`, with exact null point `E = 0` at origin and `V_saddle = 2/A`), and constant `E_x` with linear `V = -E_x x` for Uniform parallel plates (`3`).
- **Orthogonality (`90 deg`):** Every field line crosses equipotential lines/planes at right angles, highlighted with red `90 deg` corner markers (`makeRightAngle`).
- **One driver variable (`state.theta`):**
  - `0 - 90 deg`: Isolated charge (`radial`)
  - `90 - 180 deg`: Opposite charges (`dipole`)
  - `180 - 270 deg`: Like charges (`repel`)
  - `270 - 360 deg`: Uniform field (`plates`)

### Launching for Class

```powershell
python "D:\APPS\Everything 3D\electric-fields\serve.py" 9085
```

- **Full drafting sheet (recommended for exploration & readouts):** `http://localhost:9085/?layout=sheet`
- **Clean figure card (great for projector focus / embeds):** `http://localhost:9085/?layout=figure`
- **Teaching controls:**
  - Click `Radial`, `Dipole`, `Repel`, or `Plates` (or drag the bottom `Lesson sequence` chart) to switch setups.
  - Toggle `Loop setup` to keep the `+q` test probe repeating inside the current setup while discussing it.
  - Click `Flip +/-` to reverse source polarity (`+Q <-> -Q`, `+Q & -Q <-> -Q & +Q`, `+Q & +Q <-> -Q & -Q`, plates swapped).
  - Drag `Charge strength` (`1.0` to `6.0 uC`) to scale `|E|`, force arrow length, and line/contour density.
  - Toggle `Field lines`, `Equipotentials`, `Test flow`, `Labels`, or `Orbit` in the top bar; use `Space` to play/pause and `Left`/`Right` arrows to step setups.

## Step 6: Direct `file://` Double-Click Support & One-Click Launcher

- **Why needed:** Opening `index.html` directly via `file:///D:/APPS/Everything%203D/electric-fields/index.html` triggers browser CORS restrictions against `<script type="module">` and `importmap`, leaving only the CSS grid paper visible.
- **Files added/updated:**
  - `D:\APPS\Everything 3D\electric-fields\tools\build_file_bundle.mjs` - Bundles vendored `three.module.js`, `OrbitControls.js`, `js/kit.js`, `js/sheet.js`, `js/mechanisms/electric-fields.js`, and the three reference mechanisms into a classic non-module IIFE (`js/file-bundle.js`).
  - `D:\APPS\Everything 3D\electric-fields\js\file-bundle.js` - Generated classic bundle (~1.45 MB); regenerate anytime after editing `electric-fields.js` via:
    ```powershell
    node "D:\APPS\Everything 3D\electric-fields\tools\build_file_bundle.mjs"
    ```
  - `D:\APPS\Everything 3D\electric-fields\index.html` - Detects `location.protocol === 'file:'` and loads classic `js/file-bundle.js` (no CORS restriction), while still loading ES module `js/main.js` over `http://localhost`.
  - `D:\APPS\Everything 3D\electric-fields\start-server.bat` - Optional double-clickable Windows launcher that opens `http://localhost:9085/?layout=sheet` and runs `serve.py`.
- **Verification:**
  - `shoot.py` and `smoke.py --browser chromium` passed with 0 errors directly against `file:///D:/APPS/Everything%203D/electric-fields/index.html` (`sheet` and `figure` layouts) as well as `http://localhost:9085/`.

## Step 7: Interactive Electrostatics Lab Upgrade (Section Selector, +/- Badges, Crisp Field Tubes & Live Equipotential Drawing)

- **Why updated:** Replaced auto-advancing video playback with explicit section selection (`Isolated`, `Opposite`, `Like`, `Uniform`), upgraded field lines and `+`/`-` charge visibility, and added interactive test-charge placement and live equipotential contour drawing.
- **Files updated:**
  - `D:\APPS\Everything 3D\electric-fields\js\sheet.js` and `css\sheet.css`:
    - Added `sectionMode: true` and `autoPlay: false` support so the app starts paused and never auto-switches sections; clicking any section tab (`Isolated`, `Opposite`, `Like`, `Uniform`), bottom section card (`#sectionDeck`), or `Prev`/`Next` switches directly to that section.
    - Added `.lab-tools` button grid in Block B (`sheet` layout) and inline footer buttons in `figure` layout, `singleCurve` centerline `|E|` plotting, and `.vtags` overlay container for floating voltage labels.
  - `D:\APPS\Everything 3D\electric-fields\js\mechanisms\electric-fields.js`:
    - **Crisp 3D field tubes:** Replaced thin 1px WebGL lines and cluttering out-of-plane overlays with anti-aliased `THREE.TubeGeometry` ink tubes launched at equal angular intervals around every charge (3 Gauss's-Law density tiers scaling with `Charge strength` `Q`), clipped cleanly at an outer ellipse, with symmetric `ConeGeometry` arrowheads.
    - **Unmistakable `+` and `-` charge symbols:** Added high-DPI camera-facing `CanvasTexture` sprites (`depthTest: false`, white symbol with dark keyline) centered on every point charge sphere, 5 `+`/`-` charge badges along each parallel plate, and a dark-ink `+` inside the gold `+q` test charge.
    - **Click/drag `+q` test charge placement & release:** Left-clicking or dragging anywhere on `#gl` raycasts onto `y = 0`, places `+q` with its live 3D Force vector arrow `F`, and updates `Probe (+q) spot`, `Field |E| at +q`, and `Potential V at +q`. Pressing `Play` releases `+q` along `E` inside the chosen section; `Pause` freezes it; `Reset +q` restores its drop point.
    - **Interactive equipotential drawing:** `Draw V line at +q` (shortcut `V` or `E`) and `Draw V on click` compute `V` at `+q` and render bold dashed emerald equipotential contours (`buildBoldDashedGroup`) with a `90 deg` right-angle crossing marker and a floating voltage pill badge (e.g. `+4.7 V`, `0.0 V`, `-2.3 V`). `Clear drawn V` erases drawn contours; `Full V map` toggles the complete preset contour family.
    - **Field-line toggle & camera presets:** `Field lines: ON/OFF` button in Block B (synced with Top Bar `Field lines`) switches electric field lines on and off; `View: Top 2D / 3D Tilt` toggles between overhead 2D and tilted 3D views (right-drag or `Drag orbits` rotates freely).
  - `D:\APPS\Everything 3D\electric-fields\js\file-bundle.js` - Rebuilt via `node tools/build_file_bundle.mjs` so both `file:///` and `http://localhost:9085/` run the updated interactive lab identically.
- **Verification:**
  - Automated Playwright Chromium suite verified starting paused, independent section switching, `Field lines` ON/OFF toggling, canvas click `+q` placement, `Draw V line at +q`, `Draw V on click`, `Play`/`Pause` motion within a section, and `Flip +/-` with 0 page/console errors, plus visual inspection across `1440x900`, `1280x720`, and `figure` layout.

## Step 8: 3D Volumetric Electric Field Toggle & Unrestricted Near/Far `+q` Placement

- **Files updated:**
  - `D:\APPS\Everything 3D\electric-fields\js\mechanisms\electric-fields.js`
  - `D:\APPS\Everything 3D\electric-fields\js\file-bundle.js` (rebuilt via `node tools/build_file_bundle.mjs`)
- **3D Electric Field View (`3D Field: OFF / ON` button & `3D field` top-bar toggle):**
  - Added full volumetric 3D field tubes (`addFieldTube3D` with `TubeGeometry` + 3D directional cones):
    - `Isolated`: 3D spherical starburst across elevation rings (`+-36 deg`, `+-64 deg`, and `+-Y` poles) plus translucent 3D concentric equipotential spheres (`SphereGeometry` + orthogonal dashed meridians).
    - `Opposite`: 3D revolved dipole cage across 6 azimuthal planes plus revolved 3D equipotential shells and a 3D `0.0 V` midplane sheet.
    - `Like`: 3D twin repelling plumes across inclined azimuthal planes plus revolved 3D equipotential loops.
    - `Uniform`: 3D capacitor bundle across upper/mid/lower layers (`y = -0.58, 0, +0.58`), top/bottom 3D fringing tubes, and translucent 3D flat parallel equipotential sheets (`PlaneGeometry` + dashed frames).
  - Toggling `3D Field: ON` automatically tilts the camera into 3D perspective (`dir: [2.2, 2.7, 4.5]`) and lets left-drag on empty space orbit 3D while clicking anywhere or dragging the `+q` sphere still moves `+q`; toggling `3D Field: OFF` snaps cleanly back to the overhead 2D view.
- **Unrestricted Close & Far `+q` Placement:**
  - Removed the `2.63 x 1.93` bounding-box clamp on `clampProbeToSafeZone`: `+q` can now be placed right up against source charges (`R_CHARGE + 0.09`), anywhere inside or outside the parallel plates, and all the way out across the grid (`+-16.0` scene units, with scroll-wheel zoom up to `maxDist: 48`).
  - `drawEquipotentialAtProbe` dynamically expands its `128 x 96` Marching Squares window (`bx`, `bz`) around `+q` so drawing equipotentials works equally well right next to a charge or far out in the weak field.
- **Verification:**
  - Playwright Chromium verified close placement (`d = 0.67` from `+Q`), far placement (`(3.63, 2.98)`), outer `-0.4 V` contour generation, and all four 3D volumetric field views (`v3-far-near.png`, `v3-iso-3d.png`, `v3-opp-3d.png`, `v3-like-3d.png`, `v3-uni-3d.png`) with 0 errors.


## Step 9: Clean Static GitHub Pages Deployment under Electrostatics

- **Target Repository:** `https://github.com/fahad87-tech/APPC-M` (branch `main`, GitHub Actions Pages workflow `.github/workflows/static.yml`)
- **Published Subfolder:** `Beyond Physics SIMS/electrostatics/electric-fields/`
- **Clean Runtime Bundle Included (zero build step required):**
  - `index.html` (configured to load ES module `js/main.js` directly with `<script type="importmap">` pointing to `./vendor/three/`)
  - `css/sheet.css`
  - `js/kit.js`, `js/main.js`, `js/sheet.js`
  - `js/mechanisms/electric-fields.js`
  - `vendor/three/three.module.js`, `vendor/three/LICENSE`, `vendor/three/addons/controls/OrbitControls.js`
  - `.nojekyll` (added both at repo root `APPC-M/.nojekyll` and `electrostatics/electric-fields/.nojekyll` so GitHub Pages serves ES modules and vendor assets verbatim)
  - `.gitignore` (excludes `serve.py`, `start-server.bat`, `tools/`, `js/file-bundle.js`, `js/mechanisms/examples/`, `__pycache__/`, `*.pyc`, `.DS_Store`)
  - `implementation.md`
- **Dashboard Integration:**
  - Linked under `<h2 class="section-title">Electrostatics</h2>` in `Beyond Physics SIMS/index.html` (`href="electrostatics/electric-fields/index.html?layout=sheet"`).
- **Replicating in Any IDE:**
  ```bash
  git clone https://github.com/fahad87-tech/APPC-M.git
  cd "APPC-M/Beyond Physics SIMS/electrostatics/electric-fields"
  python -m http.server 8080
  ```
  Open `http://localhost:8080/?layout=sheet` (full interactive lab) or `http://localhost:8080/?layout=figure` (clean projector card).
- **Live Classroom Links:**
  - Full interactive lab (`?layout=sheet`): `https://fahad87-tech.github.io/APPC-M/Beyond%20Physics%20SIMS/electrostatics/electric-fields/?layout=sheet`
  - Clean projector card (`?layout=figure`): `https://fahad87-tech.github.io/APPC-M/Beyond%20Physics%20SIMS/electrostatics/electric-fields/?layout=figure`


## Step 10: Classroom Password Gate (`beyondphysics`)

- **Files updated:**
  - `Beyond Physics SIMS/electrostatics/electric-fields/index.html`
  - `Beyond Physics SIMS/index.html`
- **Implementation details:**
  - Added the suite-standard Web Crypto PBKDF2 SHA-256 verification gate (`SIM_AUTH`, `100,000` iterations, salt `371b341008c326c55780b3fab691c8c0`, hash `11479c7493d51324cfd86082a9d5c255ba9ce02399839f4dc4f21d9a47d0ab7d` matching classroom password `beyondphysics`).
  - Deferred mounting `<script type="module" src="js/main.js">` via `bootSimulation()` until after `pbkdf2Verify` succeeds so unauthorized visitors never load or render the 3D scene and Three.js initializes against an unlocked, fully visible viewport.
  - Added `pageshow` (`event.persisted`) bfcache re-locking and configured `Cancel` / failed attempts to navigate cleanly back to `../../index.html`.
  - Updated the Electrostatics dashboard card badge in `Beyond Physics SIMS/index.html` to `Simulation 🔒`.

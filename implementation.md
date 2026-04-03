# WASM Migration Implementation Plan (All Simulations)

## Goal

Migrate each simulation so that:

- Physics/math core runs in WebAssembly (Wasm) compiled from Rust or C++.
- UI and rendering remain in HTML/CSS/JavaScript (Canvas/WebGL/DOM).
- Each simulation continues to work as a standalone GitHub Pages–hosted HTML file.
- Existing password gating remains functional and unchanged from a user experience perspective.

This document focuses on a repeatable, low-risk rollout across all existing simulations in this repository.

## System Architecture

Each simulation becomes two layers:

- **UI Layer (JS/HTML/CSS)**
  - DOM controls, sliders, buttons, prompts, exports (DOCX/CSV), password overlay, layout.
  - Rendering via Canvas 2D or WebGL.
  - Animation loop timing and user input handling.

- **Core Layer (Wasm)**
  - State storage (positions, velocities, field grids, energies, etc.).
  - Numerical stepping/integration and heavy physics loops.
  - Bulk computation producing buffers that JS reads to render.

JS calls into Wasm a small number of times per frame (typically 1–3 calls), and reads typed arrays from Wasm memory.

## Recommended Toolchain

### Option A (Recommended): Rust → Wasm

- Rust stable (latest)
- wasm-pack
- wasm-bindgen

Why: predictable browser interop, smaller surface area, fewer “toolchain surprises” than C++ in many cases.

### Option B: C++ → Wasm (Emscripten)

- Emscripten SDK

Why: good if the physics core is already in C++ or you prefer C++ numerics; interop is typically more manual/heavier.

## Repository Layout (Proposed)

For each simulation folder (e.g., `mechanics/`, `magnetism/`, etc.):

- `SimulationName.html` (existing)
- `SimulationName_core_bg.wasm` (Wasm binary)
- `SimulationName_core.js` (loader/glue, if using wasm-pack bundling or Emscripten output)

Notes:

- Keep artifacts next to the HTML file so relative paths work on GitHub Pages.
- Use per-simulation names to prevent collisions and simplify caching/debugging.

## Standard Wasm API Contract

Each Wasm module exposes a consistent interface:

- `init(config...)`  
  Allocates/resets state based on initial configuration.

- `set_params(params...)`  
  Receives slider/input values from JS.

- `step(dt: f32/f64, n_steps: u32)`  
  Advances simulation by `n_steps` internal iterations.

- `get_state_ptr() -> u32` and `get_state_len() -> u32`  
  Returns location/size of the primary state buffer in linear memory.

Optional (for grid/vector fields):

- `get_field_ptr() -> u32`, `get_field_len() -> u32`

JS reads these buffers as `Float32Array`/`Float64Array` views over `WebAssembly.Memory`.

## Migration Process (Per Simulation)

### Step 1 — Inventory and Boundary Definition

For the target HTML file:

- Identify the simulation “hot path” (per-frame loops) and extract into a conceptual “core”.
- Decide output buffers JS needs to render (e.g., object positions, vectors, scalar fields).
- Decide parameter inputs JS will pass (sliders/toggles).

Deliverable: a short “contract sheet” listing:

- Params: names, types, ranges
- State buffers: layout, element type, meaning
- Step semantics: dt, stability expectations

### Step 2 — Implement Core in Wasm

- Implement data structures for state as contiguous arrays.
- Implement physics step and any expensive computations.
- Ensure deterministic stepping for identical parameters (as practical).

### Step 3 — Integrate Loader into the HTML

In the simulation HTML:

- Load Wasm module at startup (after password unlock if you want to avoid loading for unauthorized users).
- Maintain a fallback path: if Wasm fails to load, run the existing JS core.

### Step 4 — Wire the Animation Loop

In the existing animation/render loop:

- If Wasm ready:
  - Push params (only when changed, not every frame if possible).
  - Call `step(dt, nSteps)`.
  - Read state buffers and render.
- Else:
  - Use the legacy JS step function and render.

### Step 5 — Validate Physics Parity

Use a parity checklist:

- Same qualitative behavior across typical parameter ranges.
- Conserved quantities (when expected) match within tolerances.
- Visual output consistent (positions/graphs/labels).

### Step 6 — Performance & Memory Validation

Measure:

- Frame time (ms) in typical settings.
- Memory usage from buffer sizes (state + field grids).

### Step 7 — GitHub Pages Deployment

Confirm:

- `.wasm` is served with correct MIME type on GitHub Pages (generally OK).
- Relative paths resolve: `fetch("./Simulation_core_bg.wasm")`.

## Error Handling Strategy

### Wasm Load Failures

If any of these fail:

- fetch fails (404, offline)
- instantiate fails
- exports missing / contract mismatch

Then:

- Log a concise error to console.
- Automatically fall back to the existing JS core.
- Keep the simulation usable.

### Runtime Failures

If `step()` throws or returns an error code:

- Show a user-facing message (non-technical).
- Pause the simulation loop safely.
- Allow “Reset” to recover.

## Security Notes (Reality Check)

- Wasm makes casual copying harder than readable JS, but it is not a true protection mechanism.
- Do not embed secrets in Wasm (or JS). Anything shipped to the browser can be extracted.
- Continue using password gating for classroom control, not for high-security needs.

## Testing Methodology

### Functional Tests (Manual)

For each simulation:

- Unlock via password overlay → simulation loads.
- Controls modify behavior as before.
- Reset works.
- Export functions still work (DOCX/CSV).
- Mobile layout still acceptable (if applicable).

### Performance Tests

- Measure FPS/frame time with representative settings.
- Stress test worst-case settings.

### Regression Tests

- Ensure existing simulations unaffected (no shared global collisions).
- Ensure index.html links still point correctly and assets are committed.

## Deployment Procedure

For each migrated simulation:

- Add `.wasm` and any glue JS artifacts next to the HTML file.
- Update the HTML to load and use the module.
- Verify locally (simple static server is recommended).
- Push changes to GitHub and test the GitHub Pages URL.

## Success Criteria (Per Simulation)

- The simulation still functions normally (no UI regressions).
- Password gating behavior matches other simulations.
- Wasm loads reliably on GitHub Pages.
- Performance is equal or better in the heavy computation path.
- Fallback to JS works if Wasm cannot load.


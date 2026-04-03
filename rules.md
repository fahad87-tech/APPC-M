# WASM Migration Rules (Repo-Wide)

These rules keep the Wasm migration consistent across all simulations and prevent regressions.

## 1) Ownership Boundaries

- **Wasm owns physics/math and state**
  - integration/stepping
  - heavy loops (fields, forces, collisions, grid sampling)
  - state arrays and computed outputs

- **JS owns UI and rendering**
  - DOM controls, inputs, tabs
  - Canvas/WebGL drawing
  - exports (DOCX/CSV), guided prompts, localStorage
  - password overlays (same UX as existing)

## 2) No Secrets in Client Code

- Never store secrets in JS/Wasm/HTML.
- Treat password gating as classroom access control, not strong security.

## 3) Per-Simulation Artifacts and Naming

For a simulation file:

- `Some Simulation.html`

Use these artifacts next to it:

- `Some Simulation_core_bg.wasm` (binary)
- `Some Simulation_core.js` (glue/loader, if needed)

Rules:

- Use per-simulation names to avoid collisions between folders.
- Use relative paths so GitHub Pages works without rewrites.

## 4) Stable Wasm API Contract

Each Wasm module should export the same minimal interface:

- `init(...)`
- `set_params(...)`
- `step(dt, n_steps)`
- `get_state_ptr()`
- `get_state_len()`

Optional exports (only if needed):

- `get_field_ptr()`, `get_field_len()`
- `get_error_code()` (numeric), `get_error_message_ptr()` (if you want a message buffer)

## 5) Bulk Data Transfer Only

- Do not call Wasm once per particle/cell.
- Do one `step()` per frame (or per logical tick), then read bulk buffers.
- JS reads from `WebAssembly.Memory` via typed arrays.

## 6) Determinism and Numerical Stability

- Prefer consistent time step control (explicit dt).
- Clamp or validate dt in the core if needed.
- Avoid relying on JS timing jitter for physics correctness.

## 7) Fallback Must Always Work

If Wasm fails to load (fetch/instantiate/export mismatch):

- The simulation must still run using the existing JS core.
- The user should not be blocked by Wasm errors.

## 8) Error Handling Requirements

- Handle missing `.wasm` file gracefully.
- Handle incorrect export signatures gracefully.
- If core errors occur at runtime:
  - stop/pause cleanly
  - show a simple user message
  - allow Reset to recover

## 9) Password Gate Compatibility

- Password overlays must not break:
  - layout
  - input focus
  - navigation back to `../index.html`
- Wasm loading can happen:
  - either immediately, or
  - after unlock (recommended to avoid loading for unauthorized users)

## 10) Performance Targets (General)

Design for:

- minimal JS↔Wasm boundary calls per frame
- minimal allocations in the render loop
- fixed-size buffers where possible

## 11) GitHub Pages Constraints

- Must work as static hosting:
  - no server-side compilation
  - no runtime dependencies requiring Node/Python on the server
- All required artifacts (`.wasm`, glue JS) must be committed into the repo.

## 12) Change Management

- Migrate one simulation at a time.
- Keep changes localized to that simulation folder.
- Avoid repo-wide JS globals that can collide across pages.

## 13) Acceptance Checklist (Per Simulation)

Before marking a migration complete:

- Simulation unlock prompt still works.
- UI controls still function.
- Rendering matches expected visuals.
- Export features still work (if present).
- Runs on GitHub Pages with correct asset paths.
- Wasm failure triggers automatic fallback to JS.


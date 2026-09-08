# Implementation Guide: Physics Simulations Replication Reference

This document provides a comprehensive technical overview and replication reference for the physics simulations in this workspace, detailing mathematical formulations, high-FPS analytical physics engines, interactive measurement tools, canvas rendering architecture, and UI state models so that these applications can be replicated in another IDE, web framework (e.g., React, Vue, Svelte), or app engine.

---

## Part 1: Wave Mechanics Simulation (`Prompt_1788016539323/index.html`)

### 1.1 Mode-Specific Physics Defaults & UI Visibility Rules

1. **Transverse String Wave Defaults**:
   - **Tension ($T$)**: `1.0 N`
   - **Linear Mass Density ($\mu$)**: `0.100 kg/m` (Max!)
   - **Amplitude ($A$)**: `0.25 m`
   - **Frequency ($f$)**: `1.5 Hz`
   - **Damping ($\gamma$)**: `0.00`
   - **Controls Visible**: Tension, Linear Density, Amplitude, Frequency, Damping.

2. **Longitudinal Sound / Spring Wave Defaults**:
   - **Tension / Stiffness ($T$)**: `6.0 N`
   - **Linear Mass Density ($\mu$)**: `0.100 kg/m` (Max!)
   - **Amplitude ($A$)**: `0.50 m` (Max Amplitude!)
   - **Frequency ($f$)**: `1.5 Hz`
   - **Damping ($\gamma$)**: `0.00`
   - **Controls Visible**: Tension, Linear Density, Amplitude, Frequency, Damping.

3. **Electromagnetic Light Wave Defaults & Visibility**:
   - **Tension, Linear Density & Damping Controls**: Disabled / Hidden (EM light waves propagate in vacuum at constant speed $c$ independent of mechanical tension, mass density, or damping).
   - **Controls Active**: Amplitude ($A = 0.25\text{ m}$) and Frequency ($f = 1.5\text{ Hz}$).
   - **EM Physics Badge**: Displays `"⚡ Light Wave in Vacuum (Speed c = 3.0 × 10⁸ m/s)"`.

### 1.2 Layout & Driver Kinematics
- **Elevated Controls Panel**: Positioned directly under sticky top navigation bar with zero vertical gap.
- **Default Boundary Condition**: `boundaryEnd = 'none'` ("No End ♾️ / Open Window") for clean propagation without reflection clutter.
- **Physical Driver Orientation**:
  - Transverse: Vertical up-down piston ($y$-axis).
  - Longitudinal: Horizontal left-right acoustic plunger ($x$-axis).
  - Electromagnetic: Oscillating dipole antenna with $\mathbf{+}$ and $\mathbf{-}$ charge spheres.

---

## Part 2: Relative Velocity in 2D Simulation (`Relative Velocity 2.html`)

### 2.1 Reference Frames & Vectors
1. **Ground Frame (`observer = 'ground'`)**: Stationary origin $(0,0)$ with ground radar sweep.
2. **Car 1 Frame (`observer = 'car1'`)**: Camera tracks $Car_1$.
3. **Car 2 Frame (`observer = 'car2'`)**: Camera tracks $Car_2$.

### 2.2 Replication Checklist
1. **Dynamic Parameter Switcher (`setModeDefaults`)**: Auto-update physical parameters (e.g. $T=6.0\text{ N}$ for Longitudinal) and hide/show relevant UI controls when switching wave types.
2. **Horizontal Acoustic Driver**: Drive longitudinal sound waves along the $x$-axis using a horizontal plunger.
3. **High-DPI Canvas Scaling**: Scale canvas context by `window.devicePixelRatio`.

---

## Part 3: Kinematics Motion Graphs Studio (`Motion Graphs.html`)

### 3.1 Analytical Physics Engine & Numerical Integration

The 1D kinematics simulation models one-dimensional rectilinear motion with constant acceleration using the analytical equations of Uniformly Accelerated Motion (UAM):

$$\begin{aligned}
x(t) &= x_0 + v_0 t + \frac{1}{2} a t^2 \\
v(t) &= v_0 + a t \\
\Delta x(t) &= x(t) - x_0 = v_0 t + \frac{1}{2} a t^2 \\
d(t) &= \int_0^t |v(t')|\, dt' \quad (\text{monotonic total path distance})
\end{aligned}$$

#### Numerical State Stepping Algorithm:
The simulation steps forward dynamically at high FPS using a second-order Velocity Verlet / leapfrog integration scheme:
```javascript
function step(dt) {
  const oldX = state.x;
  state.t += dt;
  state.x += state.v * dt + 0.5 * state.a * dt * dt;
  state.v += state.a * dt;
  state.displacement = state.x - state.x0;
  state.distance += Math.abs(state.x - oldX);
  state.lastX = oldX;
  state.cameraX += (state.x - state.cameraX) * 0.08; // Smooth camera dampening
}
```
*Exactness Proof*: Because the third derivative $\frac{d^3x}{dt^3} = \frac{da}{dt} = 0$ for uniform acceleration, higher-order Taylor terms identically vanish. Thus, this numerical algorithm incurs **zero truncation error** regardless of frame rate fluctuations.

#### Camera & World Coordinate Projection:
The world coordinate system (meters) maps to canvas screen pixels (px) using a linear scaling factor ($8.6\text{ px/m}$) anchored at screen center:
```javascript
function worldToScreen(x, w) {
  const scale = 8.6;
  return w / 2 + (x - state.cameraX) * scale;
}
```

---

### 3.2 High-Performance Chart.js Multi-Stream Synchronization

The application runs 3 parallel real-time Chart.js instances:
1. **Graph 1 (Selectable Dual View)**: Distance (scalar, orange) & Displacement (vector, blue) vs. Time; or Speed vs. Velocity; or Acceleration vs. Time.
2. **Graph 2**: Speed (scalar, purple) & Velocity (vector, green) vs. Time (highlighting direction sign reversals across $v = 0$).
3. **Graph 3**: Acceleration (vector, red) vs. Time.

#### Chart Performance Optimization:
To maintain 60 FPS without layout thrashing:
- `animation: false`: Animation physics disabled for raw data streaming.
- `parsing: false` and `normalized: true`: Pre-formatted $\{x, y\}$ coordinate objects avoid library re-indexing.
- Decoupled sampling rate: Canvas renders every frame (`requestAnimationFrame`), while chart data points append every alternate frame (`chartFrameSkip % 2 === 0`) with `chart.update('none')`.

---

### 3.3 Multi-Tier Inquiry Architecture (AP Physics 1 & AP Physics C)

The 5E Inquiry module is partitioned into three distinct, scaffolded instructional tiers:

```
5E Inquiry Tab
├── Tier Switcher Pill Bar ([Tier 1] [Tier 2] [Tier 3])
├── Collapsible Formula & Theory Reference Card (Context-Aware)
├── Dynamic 5E Phase Card (ENGAGE, EXPLORE, EXPLAIN, ELABORATE, EVALUATE)
│   ├── Phase Badge & Question Index Badge ("Question X of N")
│   ├── Math-Formatted Physics Question Text
│   └── Auto-Saving Answer Textarea
├── Navigation Controls (◀ Prev, Interactive Pagination Dots, Next ▶)
└── Standalone Tier-Specific DOCX Exporter
```

#### Tier 1: Foundations & Graph Interpretation (11 Questions)
- **Target Audience**: Introductory Physics / High School Physics.
- **Core Concepts**: Scalar distance vs. vector displacement, sign of velocity indicating direction, strict monotonicity of distance ($\Delta d \ge 0$), distinguishing instantaneous rest ($v = 0, a \neq 0$) from equilibrium, and reading slopes/curvatures.

#### Tier 2: AP Physics 1 — UAM Kinematic Equations (10 Questions)
- **Target Audience**: AP Physics 1 / Algebra-Based Mechanics.
- **Core Formulations**:
  1. $v = v_0 + at$ (Linear velocity relation, omits $\Delta x$)
  2. $\Delta x = v_0 t + \frac{1}{2}at^2$ (Displacement relation, omits $v$)
  3. $v^2 = v_0^2 + 2a\Delta x$ (The "timeless" kinematic equation, omits $t$)
  4. $\Delta x = \left(\frac{v_0 + v}{2}\right)t = v_{\text{avg}} t$ (Average velocity relation, omits $a$)
  5. Stopping time: $t_{\text{stop}} = -\frac{v_0}{a}$
  6. Stopping distance: $\Delta x_{\text{stop}} = -\frac{v_0^2}{2a}$
- **Pedagogical Workflow**: Students solve pencil-and-paper numerical problems, formulate theoretical predictions, manually set simulation sliders ($x_0, v_0, a$), and verify answers against real-time HUD and graph readouts.

#### Tier 3: AP Physics C: Mechanics — Calculus & Analytical Modeling (10 Questions)
- **Target Audience**: AP Physics C: Mechanics / University-Level Calculus-Based Physics.
- **Core Formulations**:
  1. Differential relations: $v(t) = \frac{dx}{dt}$, $a(t) = \frac{dv}{dt} = \frac{d^2x}{dt^2}$
  2. Definite integral displacement: $\Delta x = \int_0^t v(t')\,dt'$ (signed Riemann sum area)
  3. Path length integral: $d = \int_0^t |v(t')|\,dt'$ (piecewise integral around turning points)
  4. Extrema & stationary points: $\frac{dx}{dt} = 0 \implies t^* = -v_0/a$, with second derivative test $\frac{d^2x}{dt^2} = a$ confirming concavity
  5. Work-Kinetic Energy Theorem derivation via chain rule: $\int_{x_0}^x a\,dx = \int_{v_0}^v v\,dv \implies a\Delta x = \frac{1}{2}(v^2 - v_0^2) \implies W_{\text{net}} = \Delta K$
  6. Phase-space trajectory geometry: $x(v) = x_0 + \frac{v^2 - v_0^2}{2a}$
  7. Numerical integration stability: Taylor series error bounds for Verlet vs. Euler solvers.

---

### 3.4 State Persistence & Independent Report Export

- **State Isolation**: Answers are saved under separate `localStorage` keys (`kin_answers_tier1`, `kin_answers_tier2`, `kin_answers_tier3`) with fallback migration from legacy single-tier storage.
- **Active Tier State**: Current tier selection is stored under `kin_active_tier`.
- **Independent DOCX Export**:
  - Each tier exports an independent Microsoft Word document utilizing `docx.js` UMD packaging.
  - Document metadata cleanly matches the active track:
    - Tier 1: `Kinematics_Tier1_Conceptual_[StudentName].docx`
    - Tier 2: `Kinematics_Tier2_AP1_UAM_[StudentName].docx`
    - Tier 3: `Kinematics_Tier3_APC_Calculus_[StudentName].docx`


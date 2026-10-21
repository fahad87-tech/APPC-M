# Oscillations & SHM Laboratory — Implementation & Replication Guide

## 1. Module Overview & Pedagogical Scope
The `oscillations` laboratory suite models Simple Harmonic Motion (SHM), spring combinations (Series vs. Parallel), inelastic momentum transfer collisions, and mechanical energy partition for AP Physics C: Mechanics.

This document details the mathematical framework, numerical integration schemes, 3D procedural rendering pipeline, builder challenge mode, and replication instructions for execution in any modern IDE or web server.

---

## 2. Simulations in this Module

### A. Vertical Series & Parallel Springs Simulator
- **File**: `oscillations/Vertical Series Parallel Springs.html`
- **Focus**:
  - Longitudinal SHM under restoring and damping forces ($F = -k_{\text{eq}} x - b v$).
  - Physical distinction between **Parallel** (shared displacement, additive forces) and **Series** (equal tension, additive displacements) topologies.
  - Inelastic collision at equilibrium ($x = 0$) with momentum conservation:
    $$p_i = m_P v = (m_P + m_Q) v' = p_f$$
  - Real-time kinematic telemetry ($x(t), v(t), a(t), F_{\text{net}}(t)$) and toggleable energy telemetry ($KE(t), PE_{\text{elastic}}(t), E_{\text{total}}(t)$).
  - Interactive direct-manipulation dragging to physically test spring compliance and resistance.

### B. Horizontal Series/Parallel Springs, Collision & Builder Lab
- **File**: `oscillations/Series Parallel Springs Drop Mass.html`
- **Focus**:
  - Horizontal air track glider dynamics with adjustable viscous surface damping ($c$).
  - Collision comparison: Drop at Equilibrium ($x = 0$, maximum kinetic energy loss) vs. Drop at Turning Point / Amplitude ($v = 0$, zero momentum transfer, mechanical energy conserved).
  - **Spring Builder Challenge Mode**:
    - Students are given a target effective stiffness $k_{\text{target}}$ and a finite inventory of springs without being told whether series or parallel is required.
    - Students configure topology (Side-by-Side vs. End-to-End) and spring counts, testing the resulting stiffness on the virtual track.
    - Dynamic verification measuring $k_{\text{eff}} = \frac{F_{\text{test}}}{\Delta x}$ and $T = 2\pi\sqrt{\frac{m}{k_{\text{eff}}}}$.

---

## 3. Mathematical Foundations & Physics Modeling

### 3.1 Spring Combinations & Stiffness Comparison

#### 1. Parallel Configuration (Side-by-Side)
When two springs are connected in parallel to a rigid block, both undergo identical displacement $\Delta x$:
$$\Delta x_1 = \Delta x_2 = \Delta x$$

The total restoring force exerted on the block is the superposition of both spring forces:
$$F_{\text{total}} = F_1 + F_2 = -k_1 \Delta x - k_2 \Delta x = -(k_1 + k_2) \Delta x$$

Thus, the equivalent spring constant is:
$$k_{\text{eq, parallel}} = k_1 + k_2$$

For $N$ identical springs of stiffness $k$:
$$k_{\text{eq, parallel}} = N \cdot k$$

**Physical Takeaway**: Parallel springs are **stiffer** and **harder to stretch or compress**. For a given displacement, the required force increases by a factor of $N$.

#### 2. Series Configuration (End-to-End Chain)
When two springs are connected end-to-end, each spring transmits the same tension force $F$:
$$F_1 = F_2 = F_{\text{total}}$$

The total elongation is the sum of the individual spring elongations:
$$\Delta x_{\text{total}} = \Delta x_1 + \Delta x_2 = \frac{F}{k_1} + \frac{F}{k_2} = F \left( \frac{1}{k_1} + \frac{1}{k_2} \right)$$

Equating to $F = k_{\text{eq}} \Delta x_{\text{total}}$ yields:
$$\frac{1}{k_{\text{eq, series}}} = \frac{1}{k_1} + \frac{1}{k_2} \implies k_{\text{eq, series}} = \frac{k_1 k_2}{k_1 + k_2}$$

For $N$ identical springs of stiffness $k$:
$$k_{\text{eq, series}} = \frac{k}{N}$$

**Physical Takeaway**: Series springs are **more compliant (softer)** and **easier to stretch or compress**. For a given pulling force, the total displacement is $N$ times larger.

#### 3. Intermediate Junction Kinematics in Series Mode
In the vertical series simulation, the junction between the top spring $k_1$ and bottom spring $k_2$ moves dynamically.
With total displacement $\Delta y$, the elongation of spring 1 is:
$$\Delta y_1 = \Delta y \cdot \frac{k_{\text{eq}}}{k_1} = \Delta y \cdot \frac{k_2}{k_1 + k_2}$$

The vertical position of the junction ring is:
$$y_{\text{junction}} = y_{\text{ceiling}} + L_{01} + \Delta y_1$$
This renders the physical reality: the softer spring elongates more than the stiffer spring.

#### 4. Asymmetric Spring Constants ($k_1 \neq k_2$) & Readings Impact
Both simulations support independent tuning of $k_1$ and $k_2$. The resulting asymmetry modifies readings in distinct ways depending on configuration:

1. **Parallel Configuration with $k_1 \neq k_2$**:
   - **Shared Kinematics**: Both springs undergo identical displacement $\Delta x_1 = \Delta x_2 = x$.
   - **Force Asymmetry**: The stiffer spring generates a proportionally greater restoring force:
     $$F_1 = -k_1 x = -F_{\text{net}} \left( \frac{k_1}{k_1 + k_2} \right), \quad F_2 = -k_2 x = -F_{\text{net}} \left( \frac{k_2}{k_1 + k_2} \right)$$
   - **Energy Partition**: Stiffer spring stores greater elastic potential energy:
     $$\frac{PE_1}{PE_2} = \frac{\frac{1}{2} k_1 x^2}{\frac{1}{2} k_2 x^2} = \frac{k_1}{k_2}$$

2. **Series Configuration with $k_1 \neq k_2$**:
   - **Shared Force**: Both springs carry the exact same tension $F_1 = F_2 = F_{\text{net}} = -k_{\text{eq}} x$.
   - **Displacement Asymmetry**: The softer spring elongates more than the stiffer spring:
     $$\Delta x_1 = x \left( \frac{k_2}{k_1 + k_2} \right), \quad \Delta x_2 = x \left( \frac{k_1}{k_1 + k_2} \right)$$
   - **Energy Partition**: The softer spring stores greater elastic potential energy:
     $$\frac{PE_1}{PE_2} = \frac{\frac{1}{2} F^2 / k_1}{\frac{1}{2} F^2 / k_2} = \frac{k_2}{k_1}$$
   - **Visual Intermediate Coupler**: In both vertical and horizontal simulators, the physical junction shifts dynamically along the axis according to $\frac{k_2}{k_1 + k_2}$.
   - **Visual Wire Gauge**: The 3D coil wire thickness and coil frequency scale independently as $\sqrt{k_1}$ and $\sqrt{k_2}$, so a stiffer spring visibly appears heavy-duty with thick wire, while a softer spring appears thin and compliant.

---

### 3.2 Inelastic Collision & Energy Dissipation Mechanics

#### Scenario 1: Dropping Mass $Q$ at Equilibrium ($x = 0$)
At equilibrium, displacement is zero, and the velocity is at its maximum:
$$v_{\text{max}} = \omega_0 A_0 = \sqrt{\frac{k_{\text{eq}}}{m_P}} A_0$$

When mass $m_Q$ is dropped onto $m_P$, linear momentum is conserved along the axis of motion:
$$m_P v_{\text{max}} = (m_P + m_Q) v_{\text{new}} \implies v_{\text{new}} = v_{\text{max}} \left( \frac{m_P}{m_P + m_Q} \right)$$

The initial kinetic energy prior to collision:
$$KE_{\text{before}} = \frac{1}{2} m_P v_{\text{max}}^2 = \frac{1}{2} k_{\text{eq}} A_0^2 = E_{\text{total, initial}}$$

The kinetic energy immediately following the inelastic collision:
$$KE_{\text{after}} = \frac{1}{2} (m_P + m_Q) v_{\text{new}}^2 = \frac{1}{2} (m_P + m_Q) \left[ v_{\text{max}} \left( \frac{m_P}{m_P + m_Q} \right) \right]^2 = KE_{\text{before}} \left( \frac{m_P}{m_P + m_Q} \right)$$

Mechanical energy lost to thermal/acoustic dissipation:
$$\Delta E_{\text{lost}} = E_{\text{before}} \left( 1 - \frac{m_P}{m_P + m_Q} \right) = E_{\text{before}} \left( \frac{m_Q}{m_P + m_Q} \right)$$

The subsequent amplitude $A_{\text{new}}$ is derived from energy balance:
$$\frac{1}{2} k_{\text{eq}} A_{\text{new}}^2 = KE_{\text{after}} \implies A_{\text{new}} = A_0 \sqrt{\frac{m_P}{m_P + m_Q}}$$

#### Scenario 2: Dropping Mass $Q$ at Turning Point / Amplitude ($v = 0$)
At maximum displacement $x = A_0$, velocity is identically zero ($v = 0$):
$$p = (m_P)(0) = 0$$

Dropping mass $m_Q$ vertically adds zero horizontal/axial momentum:
$$(m_P + m_Q) v_{\text{new}} = 0 \implies v_{\text{new}} = 0$$

Because $x = A_0$ and $v = 0$:
$$PE_{\text{elastic}} = \frac{1}{2} k_{\text{eq}} A_0^2, \quad KE = 0$$
Total mechanical energy is strictly conserved:
$$E_{\text{after}} = E_{\text{before}} \implies A_{\text{new}} = A_0$$
The amplitude remains unchanged, while the period increases:
$$T_{\text{new}} = 2\pi \sqrt{\frac{m_P + m_Q}{k_{\text{eq}}}} > T_{\text{initial}}$$

---

## 4. Numerical Integration Pipeline
To guarantee stability, physical fidelity, and avoid artificial energy drift, a fixed-timestep **Semi-Implicit Euler** scheme is executed at $120\text{ Hz}$ ($dt = \frac{1}{120}\text{ s}$):

```javascript
// Acceleration evaluated at state (x_n, v_n)
const F_spring = -this.k_eq * this.x;
const F_damping = -this.frictionC * this.v;
this.F = F_spring + F_damping;
this.a = this.F / this.m_current;

// Velocity update first (symplectic step)
this.v += this.a * dt;

// Position update uses next velocity v_{n+1}
this.x += this.v * dt;
```

---

## 5. Procedural 3D Volumetric Spring Rendering Algorithm
Rather than drawing 2D zig-zag lines, springs are rendered as 3D helical coils with specular highlights and depth shading:

1. **Wire Gauge Calculation**:
   $$\text{wireThickness} = 2.0 + 0.35 \sqrt{k} \quad (\text{px})$$
2. **Coil Subdivision**:
   The active length is divided into $N_{\text{coils}}$ segments ($8 \le N \le 24$).
3. **Dual-Pass Geometry**:
   - **Back Segments** ($y \in [-\text{radius}, +\text{radius}]$): Rendered in shadow tone (`#1e293b` or `#78350f`) using bezier curves.
   - **Front Segments**: Rendered with a linear specular gradient simulating metallic reflection (`#f8fafc` specular center, `#94a3b8` body, `#334155` rim shadow).

---

## 6. Spring Builder Challenge Architecture

### Topology & Logic
Students select:
- **Topology**: Side-by-Side (Branch) vs. End-to-End (Chain)
- **Spring Count**: $N \in [1, 4]$
- **Spring Stiffness**: $k_{\text{unit}}$

### Evaluation Function
```javascript
let achievedK = 0;
if (topology === 'parallel') {
    achievedK = unitK * count;
} else {
    achievedK = parseFloat((unitK / count).toFixed(1));
}

const error = Math.abs(achievedK - targetK);
if (error < 0.2) {
    // Target achieved! Display pedagogical reinforcement
} else if (achievedK > targetK) {
    // Too Stiff: Give hint regarding chain arrangements
} else {
    // Too Soft: Give hint regarding side-by-side arrangements
}
```

---

## 7. Replication Guide for Any IDE

### 1. Prerequisites
- Any modern web browser supporting HTML5 Canvas, Web Audio API, and ES6+.
- No build tools, Webpack, or Node.js compilation required.

### 2. Local HTTP Server Setup
To execute locally in any IDE:
- **VS Code**: Install `Live Server` extension -> Right-click `Vertical Series Parallel Springs.html` -> "Open with Live Server".
- **JetBrains (WebStorm / IntelliJ)**: Right-click file -> "Open in Browser".
- **Terminal (Python 3)**:
  ```bash
  python -m http.server 8000
  ```
  Navigate to `http://localhost:8000/oscillations/Vertical%20Series%20Parallel%20Springs.html` or `http://localhost:8000/oscillations/Series%20Parallel%20Springs%20Drop%20Mass.html`.

### 3. Password Gate Authentication
Classroom gate is active by default.
- Default Password: `beyondphysics`
- Password algorithm: PBKDF2 with SHA-256 (100,000 iterations, 32-byte salt).

---

## 8. Simulation Speed Controls & Visual Enhancements Pipeline

### 1. Multi-Speed Playback Scaling
To facilitate detailed student observation of turning points ($v=0$), equilibrium crossings ($x=0, v=v_{\text{max}}$), and collision impact dynamics, both simulations feature segmented speed buttons (`0.25x 🐢`, `0.5x ⏱️`, `1.0x ⚡`):
$$\Delta t_{\text{effective}} = \Delta t_{\text{frame}} \cdot \text{simSpeed}$$
Integrated into the fixed-timestep accumulator:
```javascript
accumulator += frameTime * simSpeed;
while (accumulator >= fixedDt) {
    engine.step(fixedDt);
    accumulator -= fixedDt;
}
```

### 2. Live On-Canvas Energy HUD Widget
Rather than forcing students to divert attention to graphs, a frosted-glass HUD widget is rendered directly on the simulation canvas:
- **Kinetic Energy ($KE$)**: Glowing emerald green bar (`#00F59B`).
- **Elastic Potential Energy ($PE$)**: Glowing electric cyan bar (`#00E5FF`).
- **Inelastic Dissipated Energy ($\Delta Q$)**: Crimson red bar (`#FF3B30`).
Normalized dynamically against total mechanical energy $E_{\text{max}} = KE + PE + E_{\text{lost}}$, visually demonstrating continuous energy exchange and the conversion of mechanical energy into internal thermal energy during collisions.

### 3. Collision Shockwave & Spark Particle Engine
On inelastic collision triggers:
- **Shockwave Ring**: Expanding circular wavefront with quadratic alpha decay ($r(t) = r_0 + v_{\text{wave}} t$).
- **Spark Particles**: 30-35 stochastic particles emitted from the contact plane with initial radial velocity vectors, gravitational downward acceleration, and lifespan fading.

### 4. Dynamic Amplitude Corridor Shading
A translucent luminous corridor spanning $[-A, +A]$ is rendered along the axis of oscillation. On collision at equilibrium, students visually observe the envelope contract instantly to $A_{\text{new}} = A_0 \sqrt{m_P / (m_P + m_Q)}$.

### 5. Polished Rail Surface Reflection
On the horizontal simulator (`Series Parallel Springs Drop Mass.html`), a vertical mirror reflection of the glider cart and attached mass is drawn on the track surface using an inverted coordinate transform with opacity damping, simulating polished aluminum optical tracks.

---

## 9. Initial Paused State & Parameter Exploration
To support inquiry-based pedagogy, both simulations start in a **paused static state** (`isRunning = false` / `isPlaying = false`):
1. **Interactive Parameter Configuration**:
   - Students can adjust masses ($m, m_Q$), spring constants ($k_1, k_2$), initial displacement amplitude ($A_0$), damping/friction ($b, c$), and spring configuration before starting.
   - Adjusting sliders updates the equilibrium displacement and restoring force telemetry in real time while paused.
2. **Play/Pause Toggle Contract**:
   - Initial button state displays `▶ Start Simulation`.
   - Clicking changes button to `⏸ Pause Simulation` and begins dynamic physics stepping.
   - Clicking Pause updates button to `▶ Resume Simulation`.
   - Clicking `↺ Reset System` returns the simulation to the initial displacement $A_0$ and resets the engine to the paused state with `▶ Start Simulation`.

---

## 10. Interactive Spring Builder with Fixed Spring Constants
The Spring Builder challenge was redesigned from simple dropdown/slider selection into a physical, hands-on **Assembly Workbench**:

### 1. Immutably Fixed Spring Constants
- In real physics laboratories, physical springs possess an immutable spring constant $k$ dictated by wire material, diameter, and coil radius ($k = \frac{G d^4}{8 D^3 N}$).
- In the Builder Challenge, each spring in the inventory parts rack has a **locked spring constant** (e.g. Spring A: $50\text{ N/m}$ [Locked 🔒], Spring B: $50\text{ N/m}$ [Locked 🔒]). Students cannot alter the individual values of $k$.

### 2. Physical Placement Mechanics (Drag-and-Drop & Click-to-Mount)
- **Parts Rack (Inventory)**: Displays all available physical springs as cards with draggable handles, locked stiffness badges, and direct mounting buttons (`+ Mount in Next Slot`, `↺ Recall to Rack`).
- **Topology Selector**: Toggles between `🔀 Parallel Rails (Side-by-Side)` and `⛓️ Series Chain (End-to-End)`.
- **Mounting Workstation Bay**:
  - In Parallel mode: Displays side-by-side mounting rail slots (`Rail Slot 1`, `Rail Slot 2`, `Rail Slot 3`).
  - In Series mode: Displays end-to-end chain links connected by inline couplers (`Chain Link 1 ── 🔗 Inline Coupler ── Chain Link 2`).
  - Supports native HTML5 Drag-and-Drop (`dragstart`, `dragover`, `drop`) as well as single-click slot assignment for accessibility and touchscreens.

### 3. Dynamic Multi-Spring Simulation on the Air Track
- Once springs are mounted in the workstation, the engine's `customSprings` array is populated with the selected spring constants.
- The `Renderer` dynamically draws the exact assembly on the virtual track:
  - **$N$ Parallel Springs**: Vertically distributed across the front face of the glider with independent wire gauges $\propto \sqrt{k_i}$ and alternating color themes (`silver`, `gold`, `cyan`, `emerald`).
  - **$N$ Series Springs**: Segmented along the axis of stretch according to individual compliance fractions:
    $$\Delta x_i = \Delta x_{\text{total}} \cdot \frac{1/k_i}{\sum (1/k_j)}$$
    Separated by cast-metal inline coupler blocks (`#475569`).

### 4. Dedicated Controls & Mandatory Pre-Run Mounting
- **Zero Auto-Run**: The Spring Builder workbench does not execute automatically upon loading or tab navigation. It remains statically paused (`engine.isRunning = false`) until the student explicitly commands it.
- **Mandatory Mounting Constraint**: Attempting to click Play without mounted springs is blocked. The simulation displays an alert: `⚠️ Mounting Required First!` and prevents playback.
- **Dedicated Bench Controls**:
  - `[▶ Test Assembly (Play)]` / `[⏸ Pause Simulation]`: Toggles SHM oscillation, allowing students to start or pause dynamic motion at will.
  - `[↺ Reset Bench]`: Pauses the engine, restores the glider to initial displacement $A_0 = 3.0\text{ m}$ ($v = 0$), resets telemetry graphs, and preserves mounted springs for inspection or adjustment.
  - `[Clear]`: Unmounts all springs back to inventory.

### 5. Challenging Multi-Spring Curriculum
The challenge series has been upgraded to AP Physics C standard with non-trivial math and distractor springs:
1. **Challenge 1 ($k_{\text{eff}} = 24.0\text{ N/m}$)**: Inventory contains $40, 60, 80, 120\text{ N/m}$. Requires Series synthesis: $\frac{40 \times 60}{40 + 60} = 24\text{ N/m}$.
2. **Challenge 2 ($k_{\text{eff}} = 105.0\text{ N/m}$)**: Inventory contains 5 choices ($30, 45, 60, 75, 90\text{ N/m}$). Requires identifying Parallel superposition: $45 + 60 = 105\text{ N/m}$.
3. **Challenge 3 ($k_{\text{eff}} = 18.0\text{ N/m}$)**: Inventory contains $30, 45, 60, 90\text{ N/m}$. Requires Series combination: $\frac{30 \times 45}{30 + 45} = 18\text{ N/m}$.
4. **Challenge 4 ($k_{\text{eff}} = 16.0\text{ N/m}$)**: 3-Spring Series puzzle with distractor springs ($32, 64, 64, 48, 96\text{ N/m}$). Requires $\frac{1}{32} + \frac{1}{64} + \frac{1}{64} = \frac{4}{64} = \frac{1}{16}$.
5. **Challenge 5 ($k_{\text{eff}} = 144.0\text{ N/m}$)**: 3-Spring Parallel puzzle with distractors ($24, 36, 48, 72, 96\text{ N/m}$). Requires $24 + 48 + 72 = 144\text{ N/m}$.
6. **Challenge 6 ($k_{\text{eff}} = 28.8\text{ N/m}$)**: AP Precision Series challenge ($36, 48, 72, 96\text{ N/m}$). Requires $\frac{48 \times 72}{120} = 28.8\text{ N/m}$.
7. **Challenge 7 ($k_{\text{eff}} = 12.0\text{ N/m}$)**: Mastery 3-Spring Series chain ($24, 40, 60, 80\text{ N/m}$). Requires $\frac{1}{24} + \frac{1}{40} + \frac{1}{60} = \frac{10}{120} = \frac{1}{12}$.
8. **Procedural Quest Generator**: Generates randomized multi-spring challenges with distractor springs across integer and 1-decimal effective stiffness targets.


# Newton's Laws — Implementation & Laboratory Guide

## 1. Module Overview
The **Newton's Laws** module provides interactive laboratories for exploring dynamics, classical forces, action-reaction pairs, and friction laws in AP Physics 1 and C mechanics curricula.

### Simulations in this Module
1. **Newton's Second Law (`Newton's Second Law.html`)**: Dynamic acceleration, $F = ma$, applied force vectors, and kinematics linkage.
2. **Newton's Third Law (`Newton's Third Law.html`)**: Contact interactions, action-reaction force symmetry, and tension/normal force sensors.
3. **Static and Kinetic Friction Explorer (`Static and Kinetic Friction.html`)**: Incline dynamics, Coulomb friction transitions, critical angle, and energy conservation.

---

## 2. Static and Kinetic Friction Laboratory (`Static and Kinetic Friction.html`)

### 2.1 Physical Model & Governing Equations
A rigid block of mass $m$ sits on an adjustable incline with angle $\theta$, subject to gravity $g$, applied force $F_{\text{app}}$ along the ramp, and surface contact forces:
1. **Normal Force**:
   $$N = m g \cos\theta$$
2. **Gravitational Ramp Component**:
   $$F_{g,\parallel} = m g \sin\theta \quad (\text{directed down the plane})$$
3. **Coulomb Friction Formulation**:
   - **Static Regime ($v = 0$)**:
     $$f_s = -(F_{\text{app}} - m g \sin\theta)$$
     bounded by maximum static friction:
     $$f_{s,\text{max}} = \mu_s N = \mu_s m g \cos\theta$$
     If $|F_{\text{net, ext}}| \le f_{s,\text{max}}$, the block remains at rest ($a = 0$).
   - **Critical Breakaway Angle (with $F_{\text{app}} = 0$)**:
     $$m g \sin\theta_c = \mu_s m g \cos\theta_c \implies \theta_c = \arctan(\mu_s)$$
     *Pedagogical proof*: Critical breakaway angle is completely independent of mass $m$.
   - **Kinetic Regime ($v \ne 0$)**:
     $$f_k = \mu_k N = \mu_k m g \cos\theta$$
     directed strictly opposite to velocity:
     $$\vec{f}_k = -\mu_k N \frac{\vec{v}}{\|\vec{v}\|}$$
   - **Acceleration along Incline**:
     $$a = \frac{F_{\text{app}} - m g \sin\theta - f}{m}$$
4. **Energy Conservation**:
   $$E_{\text{total}} = KE + PE + Q_{\text{thermal}} = \frac{1}{2} m v^2 + m g (s \sin\theta) + W_{\text{friction}} = \text{const}$$
   where work against kinetic friction dissipates mechanical energy into thermal energy ($Q_{\text{thermal}}$).
5. **Amontons' Law of Contact Area Neutrality**:
   Varying apparent contact surface area $A$ alters block visual geometry on screen but strictly leaves normal force $N$, friction $f$, acceleration $a$, and energy metrics invariant.

### 2.2 Numerical Engine
- High-precision **Velocity-Verlet** integration with fixed sub-stepping at $h = 1/240\text{ s}$ ensures zero drift and strict energy conservation over long runtimes ($< 1\%$ total energy error over $60\text{ s}$).

### 2.3 UI & Classroom Features
- **Author Badge**: Integrated single-line glowing pill `.author-badge` (`by Mr. F`).
- **Collapsible Sliding Live HUD Drawer**:
  - Right-hand live telemetry readout panel (`#liveHudCard`) slides and collapses off-screen to maximize simulation canvas width on smaller displays or focused demonstrations.
  - Initial state is configured to **collapsed by default** (`hud-collapsed` CSS class applied on grid initialization).
  - When collapsed, a persistent 42px vertical tab (`#btnExpandHud` / `.hud-collapsed-tab`) remains pinned on the right edge featuring a glowing badge, pulse indicator, and vertical "LIVE HUD" typography.
  - Clicking either the collapse button (`#btnCollapseHud`) or the persistent tab smoothly toggles the third grid column (`300px` $\leftrightarrow$ `42px`) with CSS `grid-template-columns` transition and triggers dynamic canvas viewport recalibration (`self.resize()`).
- **Telemetry Charts**: Real-time Chart.js tracking friction force vs. applied force, velocity vs. time, and energy partitioning.
- **Assessment Workspace**: Full 5E inquiry section with exportable Word (.docx) student lab reports.
- **Access Control Gate**: Cryptographic PBKDF2 SHA-256 password protection gate (`SIM_AUTH`, `beyondphysics`, 100,000 iterations).
- **Dashboard Integration**: Added to the Newton's Laws grid in `Beyond Physics SIMS/index.html` with `Simulation 🔒` badge.

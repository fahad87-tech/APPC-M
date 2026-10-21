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


---

## 3. Classic Circular Motion Laboratory (`Classic Circular Motion LAB.html`)

### 3.1 Physical Model & Governing Dynamics
The simulation models the classic AP Physics 1 uniform circular force laboratory apparatus:
- A rubber stopper of mass $m_{\text{stopper}}$ rotates horizontally overhead in a circle of radius $r$.
- A string runs through a vertical glass/plastic tube held by a clamp and attaches to $N$ hanging washers of mass $m_{\text{washer}}$.
- An equilibrium reference clip is fastened to the string immediately below the lower rim of the tube to verify constant radius without friction assistance.

#### Equations of Motion:
1. **Centripetal Force Requirement**:
   $$F_c = m_{\text{stopper}} a_c = m_{\text{stopper}} \frac{v^2}{r} = m_{\text{stopper}} \omega^2 r = m_{\text{stopper}} \left(\frac{2\pi}{T}\right)^2 r = \frac{4\pi^2 m_{\text{stopper}} r}{T^2}$$
2. **Equilibrium Tension from Suspended Washers**:
   $$T = M_{\text{hanging}} g = (N \cdot m_{\text{washer}}) g$$
3. **Period & Washer Mass Relationship**:
   $$(N \cdot m_{\text{washer}}) g = \frac{4\pi^2 m_{\text{stopper}} r}{T^2} \implies T = 2\pi \sqrt{\frac{m_{\text{stopper}} r}{N m_{\text{washer}} g}}$$
4. **Target Calculation for Student**:
   $$m_{\text{washer}} = \frac{4\pi^2 m_{\text{stopper}} r}{N g \left(\frac{t_{10}}{10}\right)^2}$$
   where $t_{10}$ is the recorded time for exactly 10 complete revolutions.

### 3.2 Key Features & Educational Design
- **Precision 10-Revolution Auto-Stop**: Apparatus whirls and halts automatically at exactly 10 revolutions with synchronised Web Audio pass chime.
- **Precision Digital Stopwatch**: Integrated millisecond timer coupled directly to rotation physics.
- **Randomized Parameter Generation**: Guarantees distinct values for $r$, $m_{\text{stopper}}$, $N$, and $m_{\text{washer}}$ on every reset/trial.
- **Direct Student Assessment**: Formative verification box showing student computed washer mass vs. true physical value with $\pm 5\%$ tolerance margin.
- **Security & Access Control**: PBKDF2 SHA-256 password protection gate (`SIM_AUTH`, `beyondphysics`, 100,000 iterations).
- **Branding & Navigation**: Styled `.author-badge` (`by Mr. F`) and direct return link to Dashboard.

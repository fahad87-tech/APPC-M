# Beyond Physics SIMS — Implementation & Replication Guide

## 1. Project Overview & Architecture
`Beyond Physics SIMS` is an interactive physics simulation suite designed for AP Physics C, AP Physics 1/2, and introductory college physics curricula. The project is delivered as a standalone, zero-build static web application suitable for hosting on GitHub Pages, local file execution, or any modern web server / IDE.

### Directory Structure & Simulation Categories
```text
Beyond Physics SIMS/
├── index.html                               # Central simulation catalog & dashboard
├── .gitignore                               # Node modules & temporary artifacts ignore rules
├── package.json                             # Tooling dependencies
├── package-lock.json                        # Dependency lockfile
├── Calculus/
│   ├── Derivative rules.html                # Interactive differentiation rules
│   ├── Integration rules.html               # Definite/indefinite integration explorer
│   ├── Linearization.html                   # Tangent line approximations & errors
│   └── implementation.md                    # Calculus module guide
├── circular motion/
│   ├── Artemis2.html                        # Lunar transfer & gravity assist orbits
│   ├── Orbital Mechanics (Advanced).html    # Two-body Keplerian mechanics & eccentricity
│   └── Orbital Mechanics.html               # Uniform circular orbits & satellite velocity
├── fluids/
│   ├── Bernoulli Application.html           # Venturi tubes & pressure gradients
│   ├── Buoyant Forces.html                  # Archimedes principle & submergence levels
│   └── Torciellis.html                      # Efflux velocity from punctured fluid tanks
├── Kinematics/
│   ├── Motion Graphs.html                   # x(t), v(t), a(t) live linkage
│   ├── Projectile Motion.html               # 2D ballistic trajectories with air drag options
│   ├── Relative Velocity.html               # 1D/2D inertial frame transformations
│   ├── Relative Velocity 2.html             # Multi-body relative pursuit & vector addition
│   ├── Vectors.html                         # Vector addition, components, and dot products
│   └── implementation.md                    # Kinematics engine guide
├── magnetism/
│   ├── Domains and Magnetic Materials.html  # Ferro/para/diamagnetic alignment
│   ├── Electromagnets and Electromagnetism.html # Solenoid coil fields & current control
│   └── Magnetic Force on Charge or Current Carrying Wire.html # Lorentz force F = q(v x B) + IL x B
├── momentum/
│   ├── Ballistic Simple Pendulum.html       # Inelastic projectile-pendulum collision
│   ├── Block on Cart Collision.html         # Elastic/inelastic conservation of momentum
│   └── Center of Mass(Position, Velocity and Acceleration).html # Discrete & continuous COM
├── newton's Laws/
│   ├── Newton's Second Law.html             # F = ma, inclined planes, and friction coefficients
│   └── Newton's Third Law.html              # Action-reaction contact pairs & force sensors
├── optics/
│   ├── PRISM.html                           # Triangular prism dispersion & TIR ray tracing
│   ├── Light Characteristics.html           # Reflection, refraction, dispersion, and diffraction bench
│   ├── Mirrors and Lenses.html              # Spherical mirrors, thin lenses, and ray tracing
│   ├── Real_Apparent Depth + Mirror.html    # Snell refraction & virtual depth shift
│   └── implementation.md                    # Optics mathematical derivation & verification
├── oscillations/
│   ├── Ballistic Pendulum.html              # Conservation of mechanical energy & SHM
│   ├── Series Parallel Springs Drop Mass.html # Effective spring constants k_eff
│   ├── SHM - 3 Perspectives.html            # Kinematic, energetic, and phase-space SHM
│   └── Vertical Series Parallel Springs.html # Gravitational preload & oscillations
├── rotational motion/
│   ├── Angular Momentum - 3 Scenarios.html  # Collision, contraction, and torque-free precession
│   ├── Ladybug on Disc.html                 # Radial motion on rotating turntable (Coriolis & torque)
│   ├── Rod_Spring_Torque.html               # Pivot dynamics with restoring spring moments
│   ├── Rolling with Slipping - Top Spin.html# Sliding-to-rolling friction transitions
│   ├── Rolling Without Slipping (with Slipping).html # Pure rolling kinematics v = omega * r
│   └── Rolling Without Slipping 2.html      # Energy partition between rotational & translational KE
└── Sound and Light Waves/
    ├── Doppler Effect.html                  # Subsonic/supersonic wavefront compression
    ├── Rays and Wavefronts.html             # Huygens wavefront construction
    ├── Sound Intensity.html                 # Decibel scale & inverse-square dissipation
    ├── Standing Waves.html                  # Open/closed pipe and string harmonics
    ├── Types of Waves.html                  # Transverse vs longitudinal wave visualization
    ├── Wave Energy.html                     # Energy density and power transmission
    └── Wave Speed and Temperature.html      # Thermodynamic speed of sound v = sqrt(gamma * R * T)
```

---

## 2. Replication Instructions for Any IDE

To run, inspect, or develop this application inside any IDE (VS Code, JetBrains WebStorm, Cursor, Sublime Text, Eclipse, etc.):

### Step 1: Clone Repository
```bash
git clone https://github.com/fahad87-tech/APPC-M.git
cd "APPC-M/Beyond Physics SIMS"
```

### Step 2: Environment & Dependencies
No compilation or bundler (Vite/Webpack) is strictly required for the core simulations in this directory. All simulations run natively in modern web browsers (Chrome, Edge, Firefox, Safari) using HTML5 Canvas, WebGL, SVG, or CSS3.
- If running locally, start an HTTP server to avoid CORS issues with any local asset loads:
  - **Python 3**:
    ```bash
    python -m http.server 8000
    ```
    Then open `http://localhost:8000/index.html`.
  - **VS Code**: Use the **Live Server** extension (right click `index.html` -> "Open with Live Server").
  - **Node.js**:
    ```bash
    npx serve .
    ```

### Step 3: Git Configuration
Ensure `.gitignore` is present in `Beyond Physics SIMS/` to avoid committing local dependency caches:
```gitignore
node_modules/
```

---

## 3. Step Summary & Synchronized Changes

1. **Prism Dispersion Simulator (`optics/PRISM.html`)**:
   - Traced light rays entering a triangular prism with dynamic apex angle $A \in [30^\circ, 80^\circ]$ and variable incidence angle $\theta_1 \in [10^\circ, 80^\circ]$.
   - Implemented Snell's law at entry: $\theta_2 = \arcsin\left(\frac{\sin\theta_1}{n}\right)$.
   - Calculated internal incidence angle at exit face: $\theta_3 = A - \theta_2$.
   - Computed critical angle $\theta_c = \arcsin(1/n)$ and branched ray state between **Total Internal Reflection (TIR)** and **Refracted Out** ($\theta_4 = \arcsin(n \sin\theta_3)$).
   - Displayed dual-trace comparison between Red ($n \approx 1.52$) and Violet ($n \approx 1.55$) wavelengths.
2. **Dashboard Synchronization (`index.html`)**:
   - Added interactive card for `optics/PRISM.html` with icon `📐`, title, subtitle, and description.
   - Added interactive cards for `optics/Light Characteristics.html` (`🌈`) and `optics/Mirrors and Lenses.html` (`🔭`).
   - Added interactive card for `Sound and Light Waves/Sound Intensity.html` (`📢`).
3. **Repository Cleanliness**:
   - Configured `.gitignore` to prevent tracking `node_modules/`.
   - Staged and committed changes strictly within `Beyond Physics SIMS` and pushed to GitHub `origin/main`.
4. **Enhanced Prism Dispersion Lab (`optics/PRISM.html` update)**:
   - Added multi-ray spectral tracing, real-time photon packet propagation animation using `requestAnimationFrame`, and detailed angle/normal line visual overlays.
   - Integrated inquiry questions preset mode and student prediction workspace for reflection/refraction hypotheses.
   - Synchronized metrics readout: $\theta_1$, $\theta_2$, $\theta_3$, $\theta_4$, critical angle thresholding ($\theta_c$), and exit angular spread ($\Delta\theta$).
5. **Classroom Security & Password Gate**:
   - Integrated PBKDF2 SHA-256 password gate (`beyondphysics`) into `optics/PRISM.html`.
   - Updated dashboard badge to `Simulation 🔒` in `index.html`.
   - Guaranteed failure/cancellation redirects back to dashboard and secured back-navigation via `pageshow` listener.
6. **Curved Mirrors Laboratory (`optics/Curved Mirrors.html`)**:
   - Added comprehensive ray optics laboratory for concave and convex spherical curved mirrors ($f = R/2$).
   - Implemented real-time ray tracing of 4 principal rays (parallel, focal, radial, and vertex) with virtual image extensions.
   - Designed and built virtual ray propagation behind the mirror: diverging reflected rays in front have their dashed extensions project behind the mirror and intersect precisely at the virtual image tip $(|d_i|, h_i)$ for convex mirrors and concave mirrors inside the focal length ($d_o < f$).
   - Solved real image convergence: eliminated spherical curvature divergence and artificial aperture clamping so that all 4 principal rays and all light bundle rays converge at the exact single focus point $(-d_i, h_i)$ with zero error.
   - Integrated glowing multi-color pulsing intersection nodes, optical crosshairs reticles, and anti-colliding educational callout badges for both real convergence (`✨ Real Ray Focus`) and virtual intersection (`✨ Virtual Ray Intersection`).
   - Added `hudRealPill` ("Real Rays: Converging at Single Focus") and `hudVirtualPill` in the simulation stage header with dedicated sidebar visibility controls.
   - Integrated dynamic image categorization (real vs. virtual, inverted vs. upright, magnified vs. diminished), Chart.js optical graph telemetry, and client-side DOCX assessment export.
   - Integrated PBKDF2 SHA-256 classroom password gate (`beyondphysics`) with `pageshow` bfcache protection.
   - Added interactive card to the Optics category in `index.html` with `Simulation 🔒` badge.
   - Streamlined the interface by completely removing the DataLogger table card and row recording controls.
   - Refactored the title to render `by Mr. F` as an unbroken, styled inline badge (`.brand-badge`).
7. **Static and Kinetic Friction Explorer (`newton's Laws/Static and Kinetic Friction.html`)**:
   - Added Coulomb friction laboratory with adjustable incline $\theta$, applied force $F_{\text{app}}$, mass $m$, and surface coefficient controls ($\mu_s, \mu_k$).
   - Derived static breakaway threshold, kinetic sliding acceleration, critical angle $\theta_c = \arctan(\mu_s)$, and Amontons' contact area neutrality.
   - Solved with Velocity-Verlet numerical integration at $h = 1/240\text{ s}$ with mechanical-to-thermal energy conservation.
   - Added author badge pill (`by Mr. F`), PBKDF2 password gate (`beyondphysics`), and interactive card to the Newton's Laws grid in `index.html`.
   - Built a collapsible sliding Live HUD drawer (`#liveHudCard`) that starts collapsed by default to maximize canvas visibility, retaining a persistent 42px interactive vertical tab (`#btnExpandHud`) along the right edge with smooth CSS grid transition and canvas auto-resize.
8. **Advanced SHM & Spring Configuration Laboratories (`oscillations/Vertical Series Parallel Springs.html` and `oscillations/Series Parallel Springs Drop Mass.html`)**:
   - Upgraded both simulators with procedural **3D volumetric helical springs**, multi-pass lighting, depth shading, dynamic wire gauge ($\propto \sqrt{k}$), and cast-metal ceiling/wall brackets.
   - Built an interactive **Stiffness & Compliance Educational Card** in both simulations that dynamically explains Hooke's Law:
     - **Parallel (Side-by-Side)**: $k_{\text{eff}} = k_1 + k_2$ — Stiffest configuration, forces combine, hardest to stretch/compress.
     - **Series (End-to-End)**: $\frac{1}{k_{\text{eff}}} = \frac{1}{k_1} + \frac{1}{k_2}$ — Most compliant configuration, elongations add up, easiest to stretch/compress.
     - Displays exact pull force required to produce a $0.5\text{ m}$ or $1.0\text{ m}$ elongation.
   - Replaced fixed graphs with multi-mode telemetry:
     - **Motion Mode**: Real-time graphs for Displacement/Position $x(t)$, Velocity $v(t)$, Acceleration $a(t)$, and Restoring Net Force $F_{\text{net}}(t)$.
     - **Energy Mode (Toggleable)**: Kinetic Energy $KE(t)$, Elastic Potential Energy $PE(t)$, and Total Mechanical Energy $E_{\text{total}}(t)$.
   - Configured **immediate paused initial state** on both simulations: simulations load paused (`▶ Start Simulation`), enabling students to explore and tune parameters ($m, m_Q, k_1, k_2, A_0, b, c$, and configuration) before activating dynamic motion.
   - Cleaned up the horizontal mass-spring visual background by **removing the amplitude corridor bounding lines**, providing an unobstructed view of the glider, air track, and springs.
   - Upgraded the **Spring Builder Challenge Mode** into an interactive **Assembly Workstation**:
     - Each spring in inventory has an **immutably fixed spring constant** (e.g. $50\text{ N/m}$ [Locked 🔒]), reflecting real lab equipment where $k$ cannot be altered.
     - Students physically move/mount springs via **HTML5 drag-and-drop** and **click-to-mount** into Parallel Rail Slots or Series Chain Links.
     - Added dynamic multi-spring canvas rendering for $N$ springs in parallel (vertically distributed with alternating color themes) and $N$ springs in series (segmented by individual compliance with inline couplers).
     - Added dedicated **Play/Pause, Reset, and Clear controls** to the Spring Builder workbench (`▶ Test Assembly (Play)`, `⏸ Pause Simulation`, `↺ Reset Bench`, `Clear`). The challenge **never auto-runs**, and **mounting springs is strictly mandatory before playback begins**.
     - Upgraded the Spring Builder challenge curriculum to **AP Physics C level difficulty** with non-trivial multi-spring combinations (2-spring and 3-spring series/parallel), fractional stiffnesses ($12.0, 16.0, 18.0, 24.0, 28.8, 105.0, 144.0\text{ N/m}$), and distractor springs in the parts rack.
   - Added full independent adjustment for both **$k_1$ and $k_2$** across both simulations, dynamically demonstrating asymmetric load sharing in parallel ($F_1/F_2 = k_1/k_2$) and asymmetric elongation sharing in series ($\Delta x_1/\Delta x_2 = k_2/k_1$), with corresponding 3D wire gauge scaling and physical intermediate coupler displacement.
   - Added interactive direct-manipulation dragging: students can click and drag the mass directly on the canvas to feel and see spring resistance.
   - Added **multi-speed playback controls** (`0.25x 🐢`, `0.5x ⏱️`, `1.0x ⚡`) allowing students to analyze collisions and turning points in smooth slow motion.
   - Added rich visual systems: on-canvas **Live Energy Bar HUD**, collision **spark particle explosions** and expanding **shockwave rings**, dynamic **spring strain color glow**, and **polished rail reflections**.
   - Added Web Audio API sound synthesis for latch clicks and inelastic collision thuds.
   - Created detailed module guide in `oscillations/implementation.md`.







9. **Classic Circular Force Laboratory (`newton's Laws/Classic Circular Motion LAB.html`)**:
   - Implemented AP Physics 1 horizontal circular motion inquiry apparatus with rotating stopper overhead and hanging washers below.
   - Derived coupled dynamics $T = N m_w g = m_{\text{stopper}} \frac{4\pi^2 r}{T^2}$, allowing students to measure $t_{10}$ and calculate individual washer mass $m_w$.
   - Added automatic 10-revolution stop trigger with synchronized Web Audio audio feedback and precision digital stopwatch.
   - Integrated PBKDF2 SHA-256 password protection gate (`SIM_AUTH`, `beyondphysics`, 100,000 iterations).
   - Added author badge (`by Mr. F`), return navigation, and synchronized dashboard card in `index.html` with `Simulation 🔒` tag.

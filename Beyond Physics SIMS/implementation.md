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



# Light Characteristics & Optical Prism Dispersion — Implementation Guide

## 1. Overview & Pedagogical Objectives

This application is an AP Physics C and advanced optics laboratory simulation covering **Reflection, Refraction, Diffraction, Absorption, and Prism Dispersion**.

### Educational Need for Prism Dispersion
In typical geometric optics simulations, dispersion in flat slabs of glass produces parallel emergent rays with only a microscopic transverse displacement, making chromatic dispersion almost imperceptible to students. 

To make dispersion intuitive and impactful:
1. **Dispersive Optical Prism**: A triangular glass prism refracts light twice at non-parallel interfaces, converting microscopic wavelength-dependent refractive indices into wide, distinct angular separation ($\Delta\theta$).
2. **Exaggerated Dispersion Scaling (Default 5×, toggleable to 8× or 1× True Scale)**: By exaggerating the Cauchy dispersion parameter $B$ by a calibrated factor, the 7 spectral wavelengths (400 nm Violet to 700 nm Red) fan out into distinct, vibrant rays that project a continuous rainbow spectrum across the detector screen.
3. **Refractive Medium Variation**: When students increase the refractive index of the prism ($n_2$), the simulator clearly demonstrates:
   - Increased total deviation angle $\delta$ across all wavelengths.
   - Monotonic widening of the angular spread $\Delta\theta = \theta_{\text{red}} - \theta_{\text{violet}}$.
   - Greater physical separation of colors on the detector screen.

---

## 2. Mathematical & Optical Engine

### 2.1 Prism Geometry
The prism is modeled in Cartesian world meters:
- **Vertex 1 (Apex)**: $V_1 = (0.000\text{ m}, +0.065\text{ m})$
- **Vertex 2 (Base Entry)**: $V_2 = (0.000\text{ m}, -0.065\text{ m})$
- **Vertex 3 (Base Exit)**: $V_3 = (+0.090\text{ m}, -0.065\text{ m})$
- **Face 1 (Entry Face)**: Lies along $x = 0$ from $y = -0.065$ to $+0.065$. The surface normal vector is $\hat{n}_1 = (-1, 0)$.
- **Face 2 (Exit Face)**: Slanted interface from $V_1$ to $V_3$, with apex angle:
  $$A = \arctan\left(\frac{0.090}{0.130}\right) \approx 34.7^\circ \text{ to } 37^\circ$$
  *Design Rationale*: An apex angle $\approx 35^\circ$ allows smooth transmission without premature Total Internal Reflection (TIR) across the full range of refractive indices $n_2 \in [1.10, 2.05]$ and incident angles $\theta_i \in [0^\circ, 75^\circ]$.

### 2.2 Wavelength-Dependent Refractive Index (Cauchy Dispersion)
For each spectral wavelength $\lambda \in \{400, 450, 500, 550, 600, 650, 700\}\text{ nm}$:
$$n_2(\lambda) = n_{550} + B_{\text{eff}} \left( \frac{1}{\lambda^2} - \frac{1}{550^2} \right)$$
where $B_{\text{base}} = 0.0055\,\mu\text{m}^2$ and $B_{\text{eff}} = B_{\text{base}} \times \text{exaggeration}$.

- Violet light ($400\text{ nm}$): Higher refractive index $n_2(400) > n_{550}$
- Red light ($700\text{ nm}$): Lower refractive index $n_2(700) < n_{550}$

### 2.3 Ray Tracing Algorithm (`PhysicsEngine.getPrismBundle`)
1. **Incidence on Face 1**:
   The incident beam strikes Face 1 at $(0, 0)$ with incident angle $\theta_i$:
   $$\theta_{t1}(\lambda) = \arcsin\left(\frac{n_1}{n_2(\lambda)} \sin\theta_i\right)$$
   Inside the prism, the ray propagates with unit direction vector:
   $$\vec{d}_{\text{prism}} = (\cos\theta_{t1}, -\sin\theta_{t1})$$

2. **Intersection with Face 2**:
   Face 2 is parameterized from $V_1$ to $V_3$:
   $$\vec{P}(u) = V_1 + u(V_3 - V_1), \quad u \in [0, 1]$$
   Solving the 2D ray-segment intersection $\vec{R}(t) = (0, 0) + t\,\vec{d}_{\text{prism}} = \vec{P}(u)$ yields the exact exit coordinates $(x_{\text{exit}}, y_{\text{exit}})$.

3. **Refraction at Face 2 into Ambient Medium $n_1$**:
   - Outward normal vector at Face 2:
     $$\hat{n}_2 = \frac{(0.130, 0.090)}{\sqrt{0.130^2 + 0.090^2}}$$
   - Internal angle of incidence $\theta_{i2}$:
     $$\cos\theta_{i2} = \vec{d}_{\text{prism}} \cdot \hat{n}_2, \quad \theta_{i2} = \arccos(\vec{d}_{\text{prism}} \cdot \hat{n}_2)$$
   - Check for Total Internal Reflection:
     $$\text{If } \sin\theta_{i2} > \frac{n_1}{n_2(\lambda)} \implies \text{TIR occurs.}$$
   - Otherwise, by Snell's law:
     $$\theta_{t2}(\lambda) = \arcsin\left(\frac{n_2(\lambda)}{n_1} \sin\theta_{i2}\right)$$
   - Refracted ray emerges with unit direction $\vec{d}_{\text{out}}$ deflected away from the normal into air.

4. **Screen Projection ($x_{\text{screen}} = 0.370\text{ m}$)**:
   The ray travels to the detector screen plate at $x_{\text{screen}} = 0.370\text{ m}$:
   $$y_{\text{screen}}(\lambda) = y_{\text{exit}} + (0.370 - x_{\text{exit}}) \frac{d_{\text{out}, y}}{d_{\text{out}, x}}$$
   Angular spread is calculated directly as:
   $$\Delta\theta = |\theta_{\text{red}} - \theta_{\text{violet}}|$$

---

## 3. UI Controls & Visual Enhancements

### 3.1 Dispersion Scale Toggle Button
- **Element ID**: `#dispersion-scale-button`
- **Location**: In `.bench-buttons` toolbar.
- **Behavior**:
  - Automatically displayed when the student clicks the **Dispersion** focus tab.
  - Automatically hidden in Reflection, Refraction, Diffraction, and Absorption tabs.
  - Clicking cycles through 3 operational modes:
    1. **Dispersion: 5× (Enhanced)** *(Default)*: Optimized for standard classroom screens so all 7 spectral rays are distinct.
    2. **Dispersion: 8× (High Spread)**: High exaggeration for demonstration on large projectors.
    3. **Dispersion: 1× (True Scale)**: Real physical scale for precision comparison.

### 3.2 Visual Rendering Pipeline (`Renderer`)
- **Prism Glass Body**: Translucent multi-stop cyan-to-purple gradient with internal facet bevel lines, simulating a 3D cut glass optical component.
- **Polished Glass Edges**: High-contrast glowing borders with corner vertex nodes.
- **7 Spectral Rays**: Rendered with authentic optical colors (`#7c3aed`, `#2563eb`, `#06b6d4`, `#22c55e`, `#facc15`, `#fb923c`, `#ef4444`) and directional propagation arrows.
- **Detector Screen Rainbow Projection**: High-intensity glowing gradient ribbon across the screen plate marking where rays land, with discrete wavelength tick markers.
- **Dynamic Callout Banners**:
  - `PRISM DISPERSION • SPREAD Δθ = ...°`
  - `400 nm Violet • exit ...°`
  - `700 nm Red • exit ...°`
  - Live scale badge: `DISPERSION: 5× EXAGGERATED FOR CLARITY`
- **Animated Light Pulses**: When playback is active (`▶ Play`), photon packets travel along the incident beam, refract through the glass interior, and fan outward to the detector.

### 3.3 Dynamic Focus Metric Cards
When on the **Dispersion** tab, the 3 metric cards update live as sliders move:
- **Card 1 (Wavelength λ)**: `${model.wavelengthNm} nm`
- **Card 2 (n₂ at λ)**: `${model.n2.toFixed(3)}`
- **Card 3 (Angular spread Δθ)**: `Δθ = ${bundle.angularSpreadDeg.toFixed(2)}°`

---

## 4. Preservation & Non-Regression Guarantee

1. **Analytical Physics Precision**:
   - `calculateOptics()` remains completely untouched for Reflection, Refraction, Diffraction, and Absorption.
   - Energy conservation identity $R + A + T = 1$ is maintained to floating-point precision ($< 10^{-15}$).
2. **Self-Test Suite (`runSelfTests`)**:
   - All 4 automated benchmark tests pass with 100% precision:
     1. Fresnel reflection at normal incidence ($R = 0.042580$).
     2. Total internal reflection critical angle ($\theta_c = 55.18^\circ$, TIR = true).
     3. Strict energy conservation ($|R + A + T - 1| = 0.000\times 10^0$).
     4. First diffraction minimum ($D\lambda/a = 1.7188\text{ mm}$).
3. **Data Logging & Export**:
   - 26-column CSV telemetry export via `exportManager.exportCsv()` remains fully intact.
   - Formative assessment 5E student worksheet generator (`exportAssessmentDocx()`) remains fully functional.
4. **Camera Controls**:
   - All pan, scroll-to-zoom, and "Bench: Upright" vs "Bench: Sideways" orientation toggles transform prism coordinates seamlessly through `camera.worldToScreen()`.


---

## 5. Standalone Prism Light Dispersion Simulator (`PRISM.html`)

### 5.1 Objectives & Overview
`PRISM.html` provides a lightweight, focused, single-file simulation dedicated specifically to triangular prism ray tracing, dispersion, and Total Internal Reflection (TIR).

### 5.2 Mathematical Formulation
1. **Geometry & Vertex Definition**:
   - The triangular prism vertices are computed dynamically using the apex angle $A$ and scale $S = 260\text{ px}$:
     $$r_{\text{poly}} = \frac{S}{2 \sin(A/2)}$$
     $$V_{\text{top}} = (c_x, c_y - r_{\text{poly}} \cos(A/2))$$
     $$V_{\text{left}} = \left(c_x - \frac{S}{2}, c_y + r_{\text{poly}} \sin(A/2)\right)$$
     $$V_{\text{right}} = \left(c_x + \frac{S}{2}, c_y + r_{\text{poly}} \sin(A/2)\right)$$
2. **First Refraction (Entry Face)**:
   - For incident angle $\theta_1$ and refractive index $n$:
     $$\theta_2 = \arcsin\left(\frac{\sin\theta_1}{n}\right)$$
3. **Internal Angle of Incidence**:
   - At the second face:
     $$\theta_3 = A - \theta_2$$
   - Critical angle for total internal reflection:
     $$\theta_c = \arcsin\left(\frac{1}{n}\right)$$
4. **Exit Angle or TIR Condition**:
   - If $\theta_3 > \theta_c$: The ray undergoes **Total Internal Reflection** ($r_{\text{status}} = \text{TIR (Trapped)}$), reflecting internally at angle $\theta_{\text{refl}} = \theta_3$.
   - If $\theta_3 \le \theta_c$: The ray refracts out into air ($r_{\text{status}} = \text{Refracted Out}$) at exit angle:
     $$\theta_4 = \arcsin\left(n \sin\theta_3\right)$$
5. **Dispersion Tracking**:
   - Red light ($n_{\text{red}} \approx 1.52$) and Violet light ($n_{\text{vio}} \approx 1.55$) are traced concurrently, showing angular divergence upon exit and differences in critical angle thresholds.

### 5.3 UI & Interactive Laboratory Enhancements
- **Dynamic Spectral Controls**: Sliders for Incidence Angle ($\theta_1 \in [10^\circ, 80^\circ]$), Apex Angle ($A \in [30^\circ, 80^\circ]$), and wavelength-dependent refractive indices ($n_{\text{red}}, n_{\text{violet}}$).
- **Interactive Toggles**:
  - Show Incident Beam, First Face, Second Face rays independently.
  - Show Normal lines & Angles ($\theta_1, \theta_2, \theta_3, \theta_4$).
  - Animated Photon Wave Packets along ray trajectories via `requestAnimationFrame`.
  - Student Measurement Overlay & Labels.
- **Inquiry & Formative Workspace**:
  - Embedded guided Question mode button (`#questionBtn`) loading challenge scenarios.
  - Interactive prediction inputs for sequence notes, critical angle guesses, and TIR notes.
  - Live metric telemetry displaying exit angles, angular spread ($\Delta\theta$), and critical threshold margins.
- **Security & Access Control Gate**:
  - Implemented PBKDF2 SHA-256 cryptographic password gate (`SIM_AUTH`, 100,000 iterations) protecting student access.
  - Password key matches suite standard (`beyondphysics`).
  - On cancellation or incorrect input, redirects cleanly to `../index.html`.
  - Integrated `pageshow` listener to handle bfcache back-navigation security.
- **Dashboard Integration**:
  - Linked directly via the Optics category in `Beyond Physics SIMS/index.html` with `Simulation 🔒` badge.



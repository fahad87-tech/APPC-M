# Calculus & AP Physics Simulation Suite — Implementation Notes

This document provides complete implementation specifications, architectural details, mathematical foundations, and replication instructions for the simulations in this suite so that they can be easily replicated or extended in any IDE or web development environment.

---

## 1. AP Physics Integration Rules Explorer (`Integration rules.html`)

### Overview
`Integration rules.html` is an interactive dual-graph simulation designed for AP Physics C (Mechanics and E&M) and AP Calculus (AB/BC). It bridges the gap between discrete numerical Riemann sums, multi-function physics operations, and continuous antiderivative accumulation functions governed by the Fundamental Theorem of Calculus (FTC).

### Key Architectural & Ergonomic Capabilities

#### A. Multi-Location Area & Integral Answer Scoreboards
To ensure users immediately and clearly see the answer of the integral (both the discrete approximation and exact continuous area) as intervals resize or shrink to zero, prominent live scoreboards are positioned across the simulation:
1. **Top Header Live Scoreboard (`.info-header`)**:
   - **`Exact Area (∫)` Badge**: Glowing emerald pill showing the true analytical definite integral answer with physical units (e.g. `2.40 m/s`, `16.00 J`).
   - **`Riemann Approx` Badge**: Glowing amber pill showing the current numerical partition area ($S_N = 2.390$).
   - **Live $\Delta x$ Pill**: Displays current subinterval width $\Delta x = \frac{b - a}{N}$.
2. **Sidebar Partition & Limit Card**:
   - Displays:
     - **Interval Span $[a, b]$**: Total length $|b - a|$.
     - **Rectangle Width $(\Delta x)$**: Direct width of each subdivision.
     - **Riemann Area ($S_N$)**: Large glowing amber readout ($0.95\text{rem}$).
     - **Exact Area (Limit $\int$)**: Large glowing emerald readout ($0.95\text{rem}$).
     - **Convergence Indicator**: *As $\Delta x \to 0$ ($N \to \infty$), Riemann Area $\to$ Exact Area*.
4. **Bottom Mode Utility Bar**:
   - Shows Riemann Sum, Exact Integral, Absolute Error $|\Delta|$, and Percentage Error $(\%)$.

#### B. Segmented Focus Modes
To prevent cognitive overload and maintain clean ergonomics, the interface is organized into 4 dedicated, distraction-free focus modes via top segmented tabs:
1. **📐 Riemann Limits Mode**:
   - Focuses on the partition shrinking process ($\Delta x = \frac{b-a}{N} \to 0$).
   - Method selector: Left ($L_n$), Right ($R_n$), Midpoint ($M_n$), Trapezoidal ($T_n$), Simpson's ($S_n$), and Exact ($\int$).
   - "⚡ Shrink $\Delta x \to 0$" automated animation progressively stepping $N = 2 \to 4 \to 8 \dots \to 200$.
2. **📈 FTC & Accumulation Mode**:
   - Focuses on the Fundamental Theorem of Calculus ($\frac{d}{dx}\left[\int_a^x f(t)\,dt\right] = f(x)$).
   - Shows the slope triangle on the antiderivative accumulation curve $F(x)$ dynamically matching the height of $f(x)$.
   - Interactive Constant of Integration $+ C$ ($F_0$) slider to demonstrate vertical curve families without affecting slope or definite area.
3. **🔄 Area Between Multiple Curves Mode ($\int [f(x) - g(x)]\,dx$)**:
   - Simultaneous multi-function capability:
     - Primary Function $f(x)$ (Cyan).
     - Second Function $g(x)$ (Green).
     - Difference / Net Curve $h(x) = f(x) - g(x)$ (Amber).
   - Visually shades the bounded region between $f$ and $g$ representing Net Work, relative displacement, or net charge.
4. **🎯 AP Quiz Lab Mode**:
   - Exam practice lab with instant feedback, score tracking, and step-by-step worked solutions.

#### C. Dedicated Partitions ($N$) & Subinterval Size ($\Delta x$) Slider
- **Location**: Prominently placed in the sidebar drawer under the Interval section, visible regardless of mode.
- **Components**:
  - **Dynamic Range Slider**: $N \in [1, 250]$ subintervals.
  - **Quick Buttons Grid**: Immediate one-click jumps ($N=2, 5, 10, 50, 200$).
  - **Two-Way Synchronization**: Moving the sidebar slider automatically updates the bottom Riemann panel slider, and vice versa.

#### D. High-Fidelity Math Typography (Fix for Raw Delimiters)
- Clean, universally supported HTML math typography (`<i>a</i>(<i>t</i>) = <i>a</i><sub>0</sub> − <i>kt</i>`, `<i>v</i>(<i>t</i>) = <i>v</i><sub>0</sub> + <i>a</i><sub>0</sub><i>t</i> − &frac12;<i>kt</i><sup>2</sup>`, `&Delta;<i>v</i>`, `&int;`).
- Mathematical variables rendered in serif italics (`font-family: 'Cambria Math', 'Times New Roman', Georgia, serif; font-style: italic;`) matching textbook AP Physics typesetting across all offline/online environments without external CDN latency.

#### E. Ergonomic Quick Preset Strip
- Located right below the header for one-click access to all AP Physics C scenarios:
  - 🚀 **Kinematics**: $a(t) = a_0 - kt \implies v(t)$
  - 🚗 **Kinematics**: $v(t) \to x(t)$
  - 🏹 **Hooke's Law**: $F = kx \implies W = \frac{1}{2}kx^2$
  - 🌀 **Non-Linear Spring**: $F = k_1 x + k_2 x^3$
  - 🪐 **Newtonian Gravity**: $F(r) = -GMm/r^2 \implies U(r) = -GMm/r$
  - 〰 **SHM**: $a(t) = -\omega^2 x \implies v(t)$
  - 🔨 **Collision Impulse**: $F(t) = F_0\sin(\pi t / T) \implies J = \Delta p$
  - ⚡ **RC Capacitor**: $I(t) = I_0 e^{-t/\tau} \implies Q(t)$
  - 🪂 **Fluid Drag**: $\int \frac{1}{v_t - v}\,dv \implies \ln(v)$
  - 📏 **Variable Mass Rod**: $\lambda(x) = \lambda_0(1 + \alpha x) \implies M = \int \lambda\,dx$
  - ⚛ **Ring E-Field U-Sub**: $E(x) \propto \frac{x}{(x^2 + d^2)^{3/2}} \implies V(x)$
  - ⚙ **Custom Polynomials & Trigonometrics**.

#### F. Integrated Function Graph Slide Collapse & Expand Toggle (`📉 F(x) Graph: SHOW / HIDE`)
- **Location**: Prominently placed in the top navigation actions bar (`#btnToggleFGraph`).
- **Mechanism**:
  - The second graph card (`#cardAccumulation`) uses CSS flex transitions: `transition: flex 0.4s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.4s ease, max-height 0.4s ease, opacity 0.3s ease, transform 0.4s ease;`.
  - When toggled off, `#cardAccumulation` receives the `.collapsed` class (`flex: 0 0 0px !important; min-height: 0px !important; max-height: 0px !important; opacity: 0; pointer-events: none; transform: translateY(30px);`), causing it to smoothly slide down and disappear while `#cardIntegrand` effortlessly expands to fill the entire vertical height.
  - When toggled on, the card slides back up smoothly into dual-graph view.
  - An animation frame listener triggers canvas `resize()` continuously during the 400ms CSS transition to prevent any visual stuttering.

#### G. Moving Sweep Point & Laser Toggle (`📍 Sweep Point: ON / OFF`)
- **Location**: Top actions bar (`#btnToggleSweep`).
- **Dual Graph Synchronization**:
  - Toggles the moving yellow dot and vertical dashed laser beam simultaneously on both the rate curve $f(t)$ and the antiderivative curve $F(x)$, along with the FTC tangent line and slope triangle.
  - **Static Area Mode When OFF**: When the sweep point is toggled OFF, the integration area fill under $f(x)$ cleanly spans the entire definite interval $[a, b]$ statically rather than following the moving sweep cursor, and the animation loop pauses coordinate advancement.
  - When toggled ON, the laser sweep smoothly scans across $[a, b]$ demonstrating the dynamic accumulation process $\int_a^x f(t)\,dt$.

#### H. Symmetrical Interval Handling Across the Y-Axis & Viewport Centering
- **Bilateral Coordinate Alignment**:
  - Centered default viewport domain at `S.xCenter = 0.0` with viewport span $W = 10.0$ ($x \in [-5.0, 5.0]$). This ensures the $y$-axis ($x=0$) is positioned in the exact center of both canvas views (`toSX(0, w) = w / 2`).
  - Functions spanning both sides of the $y$-axis (negative domain $x < 0$ and positive domain $x > 0$, such as oscillating SHM, cubic polynomials, and symmetric charged ring potential) now display with balanced visibility.
- **Symmetric Interval Range Sliders**:
  - `slBoundA` (lower limit $a$) and `slBoundB` (upper limit $b$) are both standardized with symmetric ranges: `min="-8.0" max="8.0" step="0.2"`.
  - Direct canvas pin dragging (`drawPin`) and touch/mouse interaction (`pointerDown`, `pointerMove`) smoothly handle intervals across negative and positive domains without boundary clamping anomalies.
- **Net Signed Area & Convergence Across Zero**:
  - Riemann sum items ($L_n, R_n, M_n, T_n, S_n$) and continuous shaded fills render negative regions ($y < 0$) below the $y=0$ baseline and positive regions above.
  - Demonstrates signed area cancellation: for odd/symmetric functions over $[-c, c]$ (e.g., $\int_{-\pi}^\pi \cos(t)\,dt$ or $\int_{-2}^2 x^3\,dx$), net definite area properly cancels to zero while local partition heights and widths reflect respective signs.

#### I. Streamlined Ergonomics (Redundant Selector Removal)
- **Unified Function Selection**:
  - Removed redundant `<select id="selFuncF">` ("Primary Function f(x)") from the right sidebar drawer.
  - The top "AP Presets" strip serves as the single source of truth for selecting scenarios and primary functions.
  - The sidebar card was retitled to **"Function Tuning & Dual Curves"**, cleanly dedicating that card to parameter tuning (Scale $A / a_0$, Scale $B / k$) and the second curve $g(x)$ selector for the "Area Between Curves" mode.

---

## 2. Linearization Simulation (`Linearization.html`)

### Overview
Simulates graphical data linearization techniques for experimental physics labs.

### Key Capabilities
1. **Slope Triangle Toggle Button (`📐 Slope Triangle: ON / OFF`)**:
   - Toggles rise-over-run slope triangle along the OLS regression line.
2. **Step-by-Step Algebra Substitution Breakdown**:
   - Maps empirical slope $m$ to physical constant groupings (e.g. $g = \frac{4\pi^2}{m^2}$).
3. **Relocated OLS Fit Bar**:
   - Dedicated clean display for $R^2$ score and regression formula without obscuring canvas.
4. **Multi-Target Linearization Modes**:
   - X-Axis transformations ($x, x^2, \sqrt{x}, 1/x, 1/x^2, x^3$).
   - Y-Axis transformations ($y, y^2, \sqrt{y}, 1/y, 1/y^2$).
   - Log-Log transformations ($\ln y$ vs $\ln x$).

---

## 3. Wave Energy & Dynamics Simulation (`index.html`)

### Overview
`index.html` is a self-contained, high-performance simulation demonstrating wave energy relationships across frequency, wavelength, tension, linear density, and amplitude for AP Physics 1 (CED: SP 4.1, SP 5.2, SP 6.4) and Honors Physics.

### Physical Model & Governing Equations
- **Medium Dynamics**: 3 independent harmonic transverse waves on identical 1D strings sharing tension $T$ and linear mass density $\mu$.
- **Wave Velocity**: $v = \sqrt{T / \mu}$ ($v = \sqrt{50 / 0.01} \approx 70.71\text{ m/s}$ by default).
- **Analytic Transverse Displacement**: $y(x, t) = A \sin(kx - \omega t)$, with $k = 2\pi / \lambda$ and $\omega = 2\pi f$.
- **Energy Densities**:
  - Kinetic energy density: $\frac{dE_K}{dx} = \frac{1}{2}\mu \left(\frac{\partial y}{\partial t}\right)^2$
  - Potential energy density: $\frac{dE_U}{dx} = \frac{1}{2}T \left(\frac{\partial y}{\partial x}\right)^2$
  - Mechanical Energy over one wavelength $\lambda$:
    $$E_{\text{total}} = \frac{1}{4}\mu \omega^2 A^2 \lambda = \frac{1}{2}\mu \omega^2 A^2 / k \propto f^2 A^2$$
- **Core Relationships Demonstrated**:
  - $E \propto A^2$: Doubling amplitude quadruples total mechanical energy ($4\times$).
  - $E \propto f^2$: Doubling frequency quadruples energy rate and accumulation ($4\times$).
  - $E \propto 1/\lambda$: Inverse relationship since $\lambda = v/f$.
  - Phase integration: RK4 integrator evolves wave phase $\phi$ at $\frac{d\phi}{dt} = \omega$, strictly auditing energy conservation drift every 60 seconds ($< 0.01\%$).

### Architectural Design: 6 ES6 Classes
1. **`PhysicsEngine`**:
   - Manages physical parameters ($A, f_A, f_B, f_C, \mu, T$).
   - Computes wave speed $v$, wavelength $\lambda$, wave number $k$, velocity $\frac{\partial y}{\partial t}$, acceleration $\frac{\partial^2 y}{\partial t^2}$, energy densities, and analytical total energy $E_{\text{total}}$.
   - Evolves phases $\phi_A, \phi_B, \phi_C$ using 4th-order Runge-Kutta (RK4) with NaN-safe clamping.
2. **`Camera`**:
   - Maps physical simulation coordinates (meters) to screen pixels.
   - Smooth auto-scale adaptive window based on global amplitude $A$ to eliminate clipping.
3. **`Renderer`**:
   - High-DPR multi-canvas rendering across 4 canvases (Wave A, Wave B, Wave C, and superimposed comparison strip).
   - Draws dynamic neon glow trails, equilibrium baselines, and realtime physical vector arrows (velocity in cyan, acceleration in pink, strictly rendered via `ctx.arc()` to meet canvas guidelines).
   - Peak drag handles for interactive amplitude adjustment directly on canvas.
4. **`UIControls`**:
   - Two-way bound controls for 6 sliders:
     1. Global Amplitude $A \in [0.01, 0.10]\text{ m}$ (affects all 3 waves).
     2. Wave A Frequency $f_A \in [0.5, 5.0]\text{ Hz}$ (Control wave).
     3. Wave B Frequency $f_B \in [0.5, 5.0]\text{ Hz}$ (Frequency variation).
     4. Wave C Frequency $f_C \in [0.5, 5.0]\text{ Hz}$ (Harmonic comparison).
     5. Linear Mass Density $\mu \in [0.005, 0.020]\text{ kg/m}$.
     6. String Tension $T \in [20, 100]\text{ N}$.
   - 3 visual toggles: Wave Glow, Vector Arrows, and Stacked Energy Bars.
   - Hotkeys: `P` (Pause/Resume), `R` (Reset defaults), `Tab` (Toggle 5E assessment).
5. **`DataLogger`**:
   - Decimated telemetry sampling every 10th frame: `time`, `t`, `A_wave_amplitude`, `f_B`, `f_C`, `mu`, `T`, `E_A`, `E_B`, `E_C`, `E_total`.
6. **`ExportManager`**:
   - Packages logged data into RFC 4180 CSV format and initiates download via `FileSaver.js` (`wave_energy_log.csv`).

### Interactive Demonstrations & Visual Caliper System
To turn the theoretical equations into immediate, visual, and conceptual demonstrations, the simulation features 4 guided interactive demonstration scenarios selectable from the top banner strip:

1. **Demonstration 1: Amplitude Scaling ($E \propto A^2$)**:
   - **Configuration**: Waves A, B, C share identical frequency ($f = 1.0\text{ Hz}$), tension ($T = 50\text{ N}$), and density ($\mu = 0.01\text{ kg/m}$). Amplitudes are stepped as $A_A = 0.03\text{ m}$, $A_B = 0.06\text{ m}$ ($2\times$), and $A_C = 0.09\text{ m}$ ($3\times$).
   - **Live Outcome**: Proves that transverse kinetic speed $\frac{\partial y}{\partial t} \propto A$ causes kinetic energy density $\frac{1}{2}\mu\left(\frac{\partial y}{\partial t}\right)^2$ to scale as $A^2$. The live badge demonstrates the quadratic ratio: $E_B / E_A = 4.00\times$ and $E_C / E_A = 9.00\times$.
2. **Demonstration 2: Frequency Scaling ($E \propto f^2$)**:
   - **Configuration**: Amplitudes are held strictly equal ($A = 0.04\text{ m}$), while frequencies scale: $f_A = 1.0\text{ Hz}$, $f_B = 2.0\text{ Hz}$ ($2\times$), and $f_C = 3.0\text{ Hz}$ ($3\times$).
   - **Live Outcome**: String segments oscillate twice as rapidly, quadrupling transverse kinetic energy ($E \propto \omega^2 = 4\pi^2 f^2$), yielding exactly $E_B / E_A = 4.00\times$ and $E_C / E_A = 9.00\times$.
3. **Demonstration 3: Wavelength & Energy Rate ($\lambda = v/f$, $E_{\text{rate}} \propto 1/\lambda^2$)**:
   - **Configuration**: Constant medium velocity $v = \sqrt{T/\mu} \approx 70.71\text{ m/s}$. Frequency is varied to demonstrate that wavelength scales inversely ($\lambda = v/f$).
   - **Live Outcome**: Wave B ($f=2\text{ Hz}, \lambda \approx 35.4\text{ m}$) packs twice as many crests into the screen as Wave A ($f=1\text{ Hz}, \lambda \approx 70.7\text{ m}$), delivering twice the cycle density and $4\times$ the rate of mechanical energy transmission.
4. **Demonstration 4: Compound Scaling ($2A$ & $2f = 16\times$ Energy)**:
   - **Configuration**: Doubling both amplitude ($A_A = 0.03\text{ m} \to A_B = 0.06\text{ m}$) AND frequency ($f_A = 1.0\text{ Hz} \to f_B = 2.0\text{ Hz}$) simultaneously.
   - **Live Outcome**: Demonstrates the compounding law:
     $$\frac{E_B}{E_A} = \left(\frac{A_B}{A_A}\right)^2 \times \left(\frac{f_B}{f_A}\right)^2 = 2^2 \times 2^2 = 16.00\times$$
   - The live ratio badge displays `Live Ratio: EB/EA = 16.00×`, showing full energy bar saturation on Wave B.

#### Visual On-Canvas Caliper Dimensions
- **Amplitude Caliper Line ($A$)**:
  - Rendered dynamically on each wave generator canvas.
  - Dashed caliper line spanning from the string's equilibrium centerline ($y=0$) to the positive crest peak, labeled with `A = 0.0Xm`.
- **Wavelength Dimension Bracket ($\lambda$)**:
  - Horizontal dimension bracket with tick marks spanning between two consecutive crests on the wave string.
  - Labeled in glowing amber (`λ = XX.Xm`), visually connecting the physical length of the wave to frequency and wave speed.

### Physical Energy Demonstration Rigs (`#physicalDemoView` & `PhysicalEnergyDemonstrators`)
To provide unmistakable, intuitive physical demonstrations connecting wave amplitude and frequency directly to real-world mechanical work, projectile distance, and fluid cavitation, the simulation features two specialized demonstration rigs selectable via the subtabs in the **"🧪 Physical Demos (Ruler & Water Splash)"** view:

#### Rig 1: Top-View Vertical Cantilever & Level Marble Track (Vertical Ruler Bends Right, Hits Ball Left)
- **Top-Down Perspective & Geometry**:
  - **Vertical Ruler Placement**: Positioned vertically across the table at $x = x_{\text{zero}}$.
  - **Cantilever Overhang Height ($L$)**: The ruler stands vertically from the bottom clamp, extending upwards across the track level ($y_{\text{track}} = 0.48h$). Adjusting the overhang length slider $L \in [15, 35]\text{ cm}$ modulates beam stiffness ($k = \frac{3EI}{L^3}$) and natural oscillation frequency ($f \propto 1/L^2$).
  - **Horizontal Track (Extends to the Left, 0 to 400 cm)**: The level track starts at $x_{\text{zero}}$ ($0\text{ cm}$) and extends to the **LEFT** edge ($x = 35\text{ px}$). Centimeter markings run from right to left across a wide **$400\text{ cm}$ physical scale** with major graduations every $50\text{ cm}$ ($0, 50, 100, 150, 200, 250, 300, 350, 400\text{ cm}$) and minor ticks every $10\text{ cm}$.
- **Bending to the Right & Euler-Bernoulli Cantilever Deflection**:
  - When the user pulls/stretches the ruler, it bends laterally to the **RIGHT**:
    $$x(y) = x_{\text{zero}} + A_{\text{px}} \cdot \left[ \frac{3}{2}\xi^2 - \frac{1}{2}\xi^3 \right], \quad \xi = \frac{y_{\text{base}} - y}{y_{\text{base}} - y_{\text{tip}}} \in [0, 1]$$
    At the base clamp ($y = y_{\text{base}}$), $dx/dy = 0$ (vertical clamped condition). As $y$ increases toward the free tip, the ruler curves smoothly to the right, storing elastic strain energy $PE = \frac{1}{2}kA^2$.
  - A glowing cyan caliper arrow at track level measures `Bend A = X.X cm` extending to the right.
- **Release, Impact & Unconstrained Quadratic Marble Travel (No 140 cm Ceiling)**:
  - **Release Snap**: The ruler swings back to the left in a high-speed damped harmonic oscillation ($x(t) = x_{\text{zero}} + A e^{-\gamma t} \cos(\omega t)$) with multi-frame motion blur ghosting.
  - **Impact at Neutral Line**: As the ruler crosses the vertical zero line ($x = x_{\text{zero}}$), it strikes the glass marble waiting at the $0\text{ cm}$ mark.
  - **Collision FX**: Expanding circular shockwave rings, bright spark burst, and `"💥 CLACK!"` visual badge.
  - **Calibrated Rolling Friction Physics**:
    $$v_0 = \sqrt{\frac{2 \cdot \eta \cdot PE_{\text{elastic}}}{m_{\text{marble}}}}, \quad d_{\text{stop}} = \frac{v_0^2}{2 \mu_k g} = \frac{\eta \cdot k A^2}{2 m \mu_k g} \propto A^2$$
    With $\eta = 0.02980$, $\mu_k = 0.035$, $k = 320\text{ N/m}$, and $m = 0.025\text{ kg}$, the marble's travel distance scales smoothly and quadratically without prematurely saturating at the end of the track:
    - Bend $A = 1.0\text{ cm} \implies d = 5.5\text{ cm}$
    - Bend $A = 2.0\text{ cm} \implies d = 22.2\text{ cm}$
    - Bend $A = 3.0\text{ cm} \implies d = 50.0\text{ cm}$ (Baseline Preset 1)
    - Bend $A = 4.0\text{ cm} \implies d = 88.9\text{ cm}$
    - Bend $A = 5.0\text{ cm} \implies d = 138.9\text{ cm}$
    - Bend $A = 6.0\text{ cm} \implies d = 200.0\text{ cm}$ (Preset 2 — **exactly $4\times$ farther than $3\text{ cm}$!**)
    - Bend $A = 7.0\text{ cm} \implies d = 272.2\text{ cm}$
    - Bend $A = 8.0\text{ cm} \implies d = 355.6\text{ cm}$ (smooth deceleration within the $400\text{ cm}$ track)
  - **Instant History Ghost Line**: Launching automatically transfers previous stopping distance to a golden dashed ghost marker (`Prev: 50.0 cm`), while the new run draws a red caliper line (`d = 200.0 cm (∝ A²)`) and awards the `"🌟 4× FARTHER! (d ∝ A²)"` milestone banner.

#### Rig 2: Tuning Fork & Stable Acoustic Splash Water Tank (Frequency Energy Scaling $P \propto f^2 \cdot A^2$)
- **Stable Fluid Dynamics (Zero-Drift Guarantee)**:
  - **Fixed Equilibrium Baseline**: The water surface equilibrium line is anchored at an immutable vertical coordinate ($y = \text{waterLevelY}$), permanently eliminating numerical sinking or rising drift.
  - **Analytic Capillary Ripple Superposition**:
    $$h(x, t) = A_{\text{wave}} \cdot \exp\left(-\frac{|x - x_{\text{tines}}|}{75}\right) \cdot \sin(k_{\text{wave}} |x - x_{\text{tines}}| - \omega_{\text{wave}} t)$$
    Because $\int_0^T h(x, t) dt \equiv 0$, the surface oscillates strictly around the fixed baseline with spatial damping and immediately returns to a calm, flat mirror line when vibration stops.
- **Acoustic Cavitation & Ballistic Splash Fountain**:
  - **Mallet Strike**: Animated lab mallet swings in, strikes the fork with an acoustic impact flash, and rebounds.
  - **Antiphase Tine Vibration**: Tines oscillate in antiphase with high-speed motion-blur fan envelopes at $512\text{ Hz}$ and $1024\text{ Hz}$.
  - **Acoustic Wavefront Rings**: Concentric circular pressure rings radiate into the air above the tank ($\lambda \propto 1/f$).
  - **Underwater Cavitation Bubbles**: Micro-bubbles nucleate beneath the submerged tine tips, swirling in acoustic micro-streaming currents and popping upon reaching the surface.
  - **Ballistic Droplet Fountain**:
    - Droplets are ejected upward into the air in parabolic flight trajectories ($x(t), y(t)$ under gravity $g$).
    - Droplet count and ejection velocity scale with mechanical splash power $P \propto f^2 \cdot A^2$:
      - **$128\text{ Hz}$**: Mild capillary surface ripples, 1-2 droplets.
      - **$256\text{ Hz}$**: Visible wave agitation, 15-20 droplets.
      - **$512\text{ Hz}$**: **$4\times$ Splash Power!** Violent cavitation fountain ejecting 60-80 droplets high into the air.
      - **$1024\text{ Hz}$**: **$16\times$ Power Rate!** Ultrasonic atomization cloud and explosive fountain geyser spraying over the tank rim.
    - Droplets falling back into the water surface splash cleanly without perturbing the mean water height.
  - **Mechanical Splash Power Readout**: Displays instantaneous power index $P_{\text{index}} = \left(\frac{f}{256}\right)^2 \cdot \left(\frac{A}{1.0}\right)^2$ in an annotated callout box with dynamic comparisons.

### KaTeX Mathematical Typography & Live Auto-Rendering
To eliminate raw LaTeX markup leaks (such as unrendered `$\omega^2 = 4\pi^2 f^2$` strings):
1. **KaTeX Integration**:
   - Loaded KaTeX stylesheet (`katex@0.16.9/dist/katex.min.css`), core library (`katex.min.js`), and auto-render extension (`contrib/auto-render.min.js`) in the `<head>`.
2. **Safe Render Dispatcher (`renderMathSafely(el)`)**:
   - A centralized utility wraps `renderMathInElement(el, { delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false })`.
3. **Reactive Re-Rendering Hooks**:
   - Triggered on initial document readiness (`DOMContentLoaded` & `window.load`).
   - Triggered upon switching top view tabs (`Lab Explorer`, `Physical Demos`, `5E Assessment`).
   - Triggered dynamically when switching demonstration scenarios (Amplitude $E \propto A^2$, Frequency $E \propto f^2$, Wavelength $\lambda = v/f$, Compound $2A \& 2f = 16\times$).
   - Triggered dynamically when toggling between Physical Demo rigs (`Top-View Ruler` $\leftrightarrow$ `Tuning Fork Splash Tank`).
   - Delivers publication-grade mathematical typography across all viewports.

### Assessment Input Sanitization & Anti-Leak Safeguards
- **Placeholder Cleansing**: All answer values previously embedded in placeholder text (such as `placeholder="Enter factor (e.g., 4)"`) were completely removed and replaced with neutral instructional cues (`placeholder="Enter numerical factor..."`).
- **Prompt Question Cleansing**: Removed internal mathematical hints and derivations from question text (e.g., removed `(because λ = v/f → λ ∝ 1/f)` from Question 6), requiring students to independently derive and justify physical relationships.

---

## 4. Replication Instructions for Another IDE / Environment

To replicate or deploy these applications in any other IDE (e.g., VS Code, Cursor, WebStorm, PyCharm) or web server:

1. **Self-Contained Architecture**:
   - All simulations are zero-dependency single-file HTML applications.
   - Typography: System UI font stacks with monospace accents (`JetBrains Mono`, `Cascadia Code`).
   - Graphics: HTML5 Canvas 2D with dynamic DPR scaling for 4K/Retina displays.
2. **File Map**:
   - `index.html`: Wave Energy & Dynamics Simulation (3 harmonic wave generators, energy analysis, live Chart.js, Top-View Ruler/Marble launcher, Tuning Fork Water Splash rig, 5E assessment, CSV logger).
   - `Integration rules.html`: AP Physics & Calculus Integration Explorer.
   - `Derivative rules.html`: Derivative rules explorer.
   - `Linearization.html`: Experimental data linearization lab.
   - `implementation.md`: Complete implementation and architectural documentation.

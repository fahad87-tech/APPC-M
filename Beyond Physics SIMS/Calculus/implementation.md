# Inverse-Square Sound Wave Propagation & Point Power Simulator — Implementation Guide

## 1. Overview & Objective
This self-contained single-file HTML5 physics simulation interactively demonstrates the fundamental 3D inverse-square law ($I propto 1/r^2$) and proves that **sound waves emitted from an isotropic point source propagate as expanding spherical shells of continuous circular wavefront rings**, rather than particles.

### Major Upgrades in this Release:
1. **Clean 2-Tab Navigation Interface**:
   - **🔬 Interactive Simulation Tab**: Hosts the dual 3D/2D visualization canvas, 8 responsive physical parameter sliders, live Telemetry HUD, and 3 Chart.js graphs.
   - **📝 5E Assessment & Worksheet Tab**: Dedicated, distraction-free assessment portal with Student Full Name input, real-time question progress counter, score badge, all 10 interactive questions (8 multiple-choice with radio selection + 2 FRQs with auto-check), and client-side **Export to .DOCX** worksheet generator.
2. **Complete CSV Elimination**:
   - As specified, the CSV table, download button, and DOM datalogger card have been completely removed from the interface.
3. **Point Power Aperture Mechanism**:
   - Explains and demonstrates the physics of finding "power at a point": at a mathematical geometric point ($dA \to 0$), power is strictly zero ($dP \to 0$).
   - A physical point sensor (such as a microphone capsule diaphragm) intercepts acoustic power across a localized aperture area $\Delta A$:
     $$\Delta P = I(r) \cdot \Delta A$$
   - Users can interactively adjust the localized sensor aperture area $\Delta A$ ($0.10\text{ cm}^2$ to $10.00\text{ cm}^2$, default $1.00\text{ cm}^2 = 1.0 \times 10^{-4}\text{ m}^2$) and observe the measured power in microwatts ($\mu\text{W}$) and milliwatts ($\text{mW}$) across both 2D and 3D scenes.
4. **Professional .DOCX Worksheet Export**:
   - Powered by `docx@8.5.0` (UMD) and `FileSaver.js`.
   - Generates a formatted Word document containing the student name, date, live experimental state parameters snapshot, assessment score, and all 10 questions with the student's selected answer, correctness indicator, and explanation.

---

## 2. Mathematical & Physical Foundations

### A. 3D Spherical Wave Propagation
$$\psi(r, t) = \frac{A_0 r_0}{r} \sin(k r - \omega t)$$
- Angular frequency: $\omega = 2\pi f$
- Wavenumber: $k = \frac{2\pi}{\lambda} = \frac{2\pi f}{c}$
- Reference distance: $r_0 = 1.0\text{ m}$
- Reference acoustic amplitude: $A_0\text{ [Pa]}$

### B. Total 3D Surface Area & Spherical Spreading
$$A_{\text{total}}(r) = 4\pi r^2$$

### C. 3D Conical Sector & Solid Angle
For an apex plane angle $\theta$, the subtended 3D solid angle of the cone is:
$$\Omega = 2\pi \left(1 - \cos\frac{\theta}{2}\right) \quad [\text{steradians}]$$
The 3D spherical cap area subtended by this solid angle on a sphere of radius $r$ is:
$$A_{\text{sector}}(r) = \Omega \cdot r^2$$

### D. Acoustic Intensity & Geometric Dilution
$$I(r) = \frac{P_{\text{source}}}{4\pi r^2} \quad [\text{W/m}^2]$$
Decibel Sound Pressure Level (SPL):
$$L_p = 10 \log_{10}\left(\frac{I}{10^{-12}}\right) \quad [\text{dB SPL}]$$

### E. Point Power Aperture Physics (Differential Limit)
A fundamental question in acoustics is: *"What is the sound power at a single point in space?"*
1. **Infinitesimal Limit**: Acoustic power is the surface integral of intensity:
   $$P = \iint_{A} I(r) \, dA$$
   At a dimensionless mathematical point, the geometric area is zero ($dA = 0$). Consequently, the acoustic power passing through an idealized zero-area geometric point is mathematically **$0\text{ W}$**.
2. **Localized Point Detection via Aperture $\Delta A$**: Any physical sensor measuring acoustic power at a coordinate (e.g. a microphone diaphragm or acoustic transducer) possesses a small, finite receiver aperture area $\Delta A$. The power intercepted by this localized point sensor is:
   $$\Delta P = I(r) \cdot \Delta A$$
3. **Definition of Point Intensity**: Acoustic intensity is therefore the point-wise power density:
   $$I(r) = \frac{dP}{dA} = \lim_{\Delta A \to 0} \frac{\Delta P}{\Delta A}$$
4. **Standard Microphone Diaphragm Calibrations**:
   - Default probe aperture: $\Delta A = 1.0\text{ cm}^2 = 1.0 \times 10^{-4}\text{ m}^2$ (standard 1/2\" lab microphone capsule).
   - At $r = 5.0\text{ m}$ with $P_{\text{source}} = 100\text{ W}$:
     $$I(5) = \frac{100}{4\pi (5)^2} \approx 0.31831\text{ W/m}^2$$
     $$\Delta P_{\text{sensor}} = 0.31831 \times 10^{-4}\text{ W} = 31.83\ \mu\text{W} \quad (0.0318\text{ mW})$$

### F. Total Power Conservation in Sector
Power traversing the solid angle cone at radius $r$:
$$P_{\text{sector}} = I(r) \cdot A_{\text{sector}}(r) = \left(\frac{P_{\text{source}}}{4\pi r^2}\right) \cdot (\Omega r^2) = P_{\text{source}} \cdot \left(\frac{\Omega}{4\pi}\right)$$
Because $r^2$ in the numerator strictly cancels $r^2$ in the denominator, $P_{\text{sector}}$ is constant across all radii ($< 0.01\%$ drift).

---

## 3. ES6 Class Architecture (Strict Ordered Hierarchy)

The codebase strictly adheres to the 6-class modular hierarchy:

1. **`PhysicsEngine`**:
   - Computes wave equation, sector area, solid angle, intensity, and SPL.
   - Evaluates localized point power via `getPointPower(r, area_cm2)`:
     `const I = this.getIntensityFor(r); return I * (area_cm2 * 1e-4);`
   - Formats point power cleanly in $\mu\text{W}$, $\text{mW}$, or $\text{W}$ via `formatPointPower(watts)`.
2. **`Camera`**:
   - Dual-mode support (`'3d'` or `'2d'`).
   - In 3D: computes full 3D rotation and perspective projection coordinates with depth tracking and mouse orbit (`yaw`, `pitch`, `dist`).
   - In 2D: transforms world coordinates (meters) to canvas screen space (pixels) with DPR scaling.
3. **`Renderer`**:
   - **3D Mode**: Renders 3D coordinate triad, 3D speaker source, expanding spherical multi-planar wave rings ($X-Z$, $X-Y$, $Y-Z$, and $\pm 45^\circ$ latitude rings), 3D conical sector boundary rays, 3D spherical cap rim with translucent fill, 3D velocity/pressure gradient arrows, and the 3D localized point receiver aperture disk with live callout badge (`Point Sensor (ΔA = 1.0 cm²): ΔP = 31.8 µW`). Zero particles.
   - **2D Mode**: Renders equatorial grid, angular calipers, smooth concentric circular rings with highlighted sector arcs, fading pulse ripples, and the localized point receiver reticle with crosshairs and callout badge.
4. **`UIControls`**:
   - Manages top-level tab switching between `#tab-sim` and `#tab-assessment`.
   - Binds all 8 sliders ($P_{\text{src}}$, $f$, $c$, $\theta$, $A_0$, $r$, Sim Speed, and Point Sensor Aperture $\Delta A$) plus simulation action buttons (`Play/Pause`, `Step`, `Reset`).
   - Binds view mode switcher (`🌐 3D Spherical Space` vs `🔘 2D Equatorial Slice`).
   - Canvas pointer events: mouse drag orbits camera in 3D mode or drags observation probe radius in 2D mode; mouse wheel zooms camera distance.
   - Drives live updates to the superimposed telemetry HUD overlay (including Point Sensor Area and Point Intercepted Power).
5. **`DataLogger`**:
   - High-performance, memory-efficient internal state recorder.
   - Records telemetry snapshots at decimated intervals for simulation graph stability without rendering an unnecessary DOM table or CSV elements.
6. **`ExportManager`**:
   - Orchestrates formatted client-side `.docx` worksheet export using `docx@8.5.0` and `FileSaver.js`.
   - Generates document sections: Title, Subtitle, Student Name, Timestamp, Active Simulation Telemetry Snapshot, and all 10 5E Assessment Questions with student responses, correctness evaluation, and pedagogical rationale.
   - Automatically names files: `Inverse_Square_Sound_${StudentName}_Assessment.docx`.

---

## 4. UI Layout & Navigation Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Header: Title, AP Physics / Acoustics Badge, Mathematical Formula   │
├────────────────────────────────────────────────────────────────────────┤
│ [🔬 Interactive Simulation]             [📝 5E Assessment & Worksheet] │
├────────────────────────────────────────────────────────────────────────┤
│ TAB 1: SIMULATION CONTENT                                              │
│  - Controls Panel (8 Sliders + Action Buttons + Point Power Formula)   │
│  - Dual-Mode 3D/2D Canvas with Live HUD Overlay                        │
│    * Includes Point Sensor Area & Point Intercepted Power Readouts     │
│  - 3 Live Chart.js Visualizations (Log-Log, Waveform, Power Conserved) │
│                                                                        │
│ TAB 2: 5E ASSESSMENT CONTENT                                           │
│  - Assessment Header with Student Name Input Field                     │
│  - Status Bar: 10 Questions, Answered Count, Score Badge, Export DOCX  │
│  - 10 Interactive Questions (8 Radio MCQs + 2 Auto-Checked FRQs)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Verification & Quality Checklist

| Check | Specification | Status |
|---|---|---|
| **CSV Removed** | Completely remove CSV download button, CSV filename, and datalogger card | ✅ Passed (0 occurrences in DOM) |
| **Tab Bar** | Clean 2-tab navigation (`#tabBtnSim`, `#tabBtnAssessment`) with active indicator | ✅ Passed |
| **5E Assessment Tab** | Dedicated tab containing all 10 questions, student name input, and score counter | ✅ Passed |
| **.DOCX Export** | Generates formatted Word document using `docx@8.5.0` and `FileSaver.js` | ✅ Passed (`exportToDocx()`) |
| **Point Power Physics** | Mathematically proves $dP/dA = I(r)$, models receiver aperture $\Delta A$ | ✅ Passed |
| **Point Power UI** | Slider for $\Delta A$, telemetry readout, and canvas reticle badge in 2D and 3D | ✅ Passed |
| **Class Hierarchy** | Strict order: PhysicsEngine, Camera, Renderer, UIControls, DataLogger, ExportManager | ✅ Passed |
| **JavaScript Syntax** | 100% valid ES6, verified with Node.js parser | ✅ Passed |

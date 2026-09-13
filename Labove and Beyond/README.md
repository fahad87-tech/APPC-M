# 🔬 Lab-ove and Beyond (Student Edition)
### *Advanced High-Speed Video Kinematics & Interactive Physics Laboratory*
**Created by MR. F.**

[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-Math-00d084.svg?style=flat-square)](https://katex.org/)

---

## 📖 Overview

**Lab-ove and Beyond (Student Edition)** is an open-source, web-based physics video analysis and experimental acoustics laboratory designed specifically for high school and university physics students.

Unlike demonstration tools with pre-recorded solutions, this **Student Edition** is built on an **inquiry-based, hands-on pedagogy**:
- **Clean Slate Guarantee**: None of the videos are pre-tracked. Every experiment requires students to calibrate the metric ruler, align coordinate axes, track object trajectories frame-by-frame (manually or via cross-correlation autotracking), and interpret scientific graphs.
- **57 Built-in Real Physics Experiments**: High-speed, high-framerate clips covering 1D kinematics, parabolic projectile motion, elastic/inelastic collisions, pendulums, rotational dynamics, drag forces, and terminal velocity.
- **Complete Measurement Suites**: Includes a 2-channel audio oscilloscope & FFT spectrum analyzer, digital lab notebook with LaTeX formulas, stroboscopic motion visualization, and multi-format data export (Excel, CSV, Project State).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/lab-ove-and-beyond-student.git
cd lab-ove-and-beyond-student

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with hot module replacement (HMR) |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm test` | Runs the automated test suite verifying video assets, calibration, and physics calculations |

---

## 🔬 Core Features

### 1. High-Precision Video Tracking Engine
- **Manual Point-and-Click**: Click on moving targets frame-by-frame with sub-pixel crosshair accuracy.
- **Visual Cross-Correlation Autotracker**: Drag a region-of-interest (ROI) template around any object; normalized cross-correlation automatically advances and tracks consecutive frames.
- **Multi-Body Dynamics**: Track multiple simultaneous objects (e.g. Puck A & Puck B in collisions, Cart 1 & Cart 2 on air tracks).
- **Center of Mass Computation**: Real-time weighted centroid calculation $\vec{r}_{cm} = \frac{\sum m_i \vec{r}_i}{\sum m_i}$.
- **Vector Overlays**: Instant velocity vectors ($\vec{v}$), acceleration vectors ($\vec{a}$), force vectors ($\vec{F} = m\vec{a}$), and trajectory path lines.
- **Stroboscopic Synthesis**: Generate strobe composite images showing multi-exposure position evolution.
- **Webcam & Custom Video Upload**: Record experiments directly from your webcam or import local MP4, WebM, and MOV files.

### 2. Multi-Metric Calibration & Coordinate Systems
- **Calibrated Scale Ruler**: Set 2 reference points and enter known physical distance in meters.
- **Movable & Rotatable Origin**: Position $(0, 0)$ anywhere in the frame.
- **Axis Flipping**: Toggle positive $X$ (Right vs. Left) and positive $Y$ (Up vs. Down) to match any textbook convention.

### 3. Scientific Kinematics Graphs & Regression
- **Kinematics Curves**:
  - Position: $x(t)$, $y(t)$, distance $s(t)$
  - Velocity: $v_x(t)$, $v_y(t)$, speed $v(t)$
  - Acceleration: $a_x(t)$, $a_y(t)$, magnitude $a(t)$
  - Energy: Kinetic $E_k = \frac{1}{2}mv^2$, Gravitational Potential $E_p = mgy$, Mechanical $E_m = E_k + E_p$
  - Phase Space: $y$ vs. $x$ (trajectory), $v$ vs. $x$
- **Curve Fitting & Regression**:
  - Linear ($y = mx + b$)
  - Quadratic ($y = Ax^2 + Bx + C$ for gravitational acceleration $g = 2A$)
  - Power Law & Exponential
  - Statistical metrics: $R^2$, slope, intercept, standard deviation

### 4. Interactive Lab Notebook (*Cahier d'expériences*)
- **LaTeX Math Rendering**: Formatted mathematical formulas rendered with KaTeX.
- **10 Curriculum-Aligned Lab Templates**:
  1. Uniform Linear Motion & Invariance of Velocity
  2. Free Fall Gravitational Acceleration ($g \approx 9.81\,\text{m/s}^2$)
  3. 2D Parabolic Projectile Motion
  4. Conservation of Momentum in 2D Collisions
  5. Simple Harmonic Motion & Restoring Force
  6. Terminal Velocity & Viscous Fluid Resistance
  7. Newton's Second Law on an Incline
  8. Rotational Kinematics & Moment of Inertia
  9. Acoustics & Standing Waves in Resonators
  10. Conservation of Mechanical Energy
- **1-Click Graph & Trajectory Snapshots**: Direct capture of analysis curves into student lab reports.
- **Print & PDF Export**: Clean, publication-grade lab write-up printing.

### 5. Sound & Acoustics Studio
- **Oscilloscope**: Real-time microphone waveform capture with trigger controls and peak-to-peak amplitude measurement.
- **FFT Spectrum Analyzer**: Fast Fourier Transform showing fundamental frequencies and harmonic overtones.
- **Sound Level Meter (dB)**: Calibrated decibel intensity measurement.
- **Dual-Tone Synthesizer**: Generate sine, square, triangle, or sawtooth waves to demonstrate acoustic beat frequencies ($f_{beat} = |f_1 - f_2|$).

### 6. Multi-Topic Physics Suites
- **Rotational Dynamics & Optics**: Centripetal acceleration, angular velocity $\omega$, Snell's Law refraction, thin lens ray tracing.
- **Circuits & Electromagnetism**: Ohm's law, RC circuit transient decay, magnetic Lorentz force $\vec{F} = q(\vec{v} \times \vec{B})$.
- **Thermodynamics**: Ideal gas law $PV = nRT$, isothermal/adiabatic processes, thermal heat transfer.

---

## 📊 57 Built-in Physics Experiments

The library includes real high-speed recordings categorized by fundamental physics concepts:

| Category | Sample Experiments |
| :--- | :--- |
| **1D Kinematics & Constant Velocity** | Rolling Ball, Model Train, Fast Ball Track, Linear Slider |
| **Gravitational Free Fall** | Dropped Sphere, Free Fall from Rest, Multi-Mass Drop |
| **2D Projectile Motion** | Parabolic Toss, Basket Shot, Cannon Launch, Trampoline Trajectory |
| **Collisions & Conservation Laws** | 2D Air Hockey Pucks, Two Inelastic Carts, Spring Bumper Collision |
| **Oscillations & Harmonic Motion** | Simple Pendulum, Spring-Mass Resonator, Damped Oscillations |
| **Fluids & Aerodynamic Drag** | Coffee Filter Drop, Feather vs. Coin, Sphere in Viscous Oil |
| **Rotational Kinematics** | Spinning Wheel, Rolling Cylinder vs. Ring, Gyroscope Precession |

---

## 🎓 Student Workflow Guide

```
[Select Video] ➔ [Calibrate Metric Ruler] ➔ [Set Origin & Axes]
       │
       ▼
[Track Points (Manual or Autotrack)] ➔ [Inspect Real-Time Graphs]
       │
       ▼
[Apply Curve Fits (g, v, R²)] ➔ [Add Snapshots to Lab Notebook]
       │
       ▼
[Complete Hypothesis & Discussion] ➔ [Export to Excel / PDF Report]
```

1. **Step 1: Choose Experiment**: Click **Library** in the top bar and select an experiment (e.g., *Parabolic Motion*).
2. **Step 2: Calibrate Scale**: Align the cyan ruler markers with the reference object in the video (e.g., a 1-meter ruler) and set the distance.
3. **Step 3: Set Coordinate Origin**: Click **Set Origin** and click where $(0,0)$ should be placed (e.g., launch position).
4. **Step 4: Track Motion**:
   - For manual tracking: Click the moving object. The video automatically advances by 1 frame.
   - For autotracking: Click **Autotrack**, drag a box over the object, and press **Start**.
5. **Step 5: Analyze Kinematics**: Switch to **Graph** view. View $x(t)$, $y(t)$, and velocity curves. Select **Quadratic Fit** on $y(t)$ to calculate acceleration $g$.
6. **Step 6: Write Report**: Switch to **Notebook** view. Answer the guided inquiry prompts and insert graph snapshots.
7. **Step 7: Export**: Click **Export** to download an Excel workbook (`.xlsx`), CSV (`.csv`), or print your lab notebook to PDF.

---

## 📁 Repository Structure

```
lab-ove-and-beyond-student/
├── public/
│   ├── videos/              # 57 real physics experiment videos (.mp4)
│   ├── images/              # Poster thumbnails and reference illustrations
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Graphs/          # Kinematics graphing & regression fits
│   │   ├── Modals/          # Video library, webcam recorder, help guide
│   │   ├── Navbar.tsx       # Main navigation header
│   │   ├── Notebook/        # Digital Lab Notebook with KaTeX math
│   │   ├── PhysicsSuites/   # Rotational, optics, circuits, thermo labs
│   │   ├── Sound/           # Oscilloscope, FFT spectrum, dB meter, tone generator
│   │   ├── Table/           # Spreadsheet data table
│   │   └── Tracker/         # Video tracker canvas, crosshair, autotracker, stroboscope
│   ├── data/
│   │   └── labTemplates.ts  # 10 curriculum experiment inquiry templates
│   ├── types/
│   │   └── physics.ts       # TypeScript type definitions
│   ├── utils/
│   │   ├── autotracker.ts   # Template matching & normalized cross-correlation
│   │   ├── exportUtils.ts   # Excel (.xlsx), CSV, and JSON export utilities
│   │   ├── kinematics.ts    # Velocity, acceleration, and energy algorithms
│   │   ├── mathRenderer.ts  # KaTeX math formula rendering engine
│   │   ├── pretrackedData.ts# Empty dataset (clean slate for student tracking)
│   │   └── videoLibrary.ts  # 57 calibrated experiment configurations
│   ├── App.tsx              # Root application component
│   ├── index.css            # Tailwind styles and custom sliders
│   └── main.tsx             # Application entry point
├── tests/
│   └── student-edition.test.mjs # Automated verification test suite
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts & Data Visualization**: [Chart.js 4](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/) + [chartjs-plugin-annotation](https://www.chartjs.org/chartjs-plugin-annotation/)
- **Math Typesetting**: [KaTeX](https://katex.org/)
- **Spreadsheet Generation**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📄 License

This project is open-source educational software distributed under the MIT License. Physics teachers and students worldwide are welcome to clone, use, adapt, and contribute.

**Lab-ove and Beyond — by MR. F.**

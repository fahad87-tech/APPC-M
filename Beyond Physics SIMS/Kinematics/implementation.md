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

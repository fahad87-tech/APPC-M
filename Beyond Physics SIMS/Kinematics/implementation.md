# Implementation Guide: Relative Velocity in 2D Simulation

This document provides a comprehensive technical overview and replication guide for the **Relative Velocity in 2D** simulation (`Relative Velocity 2.html`). It details the physics formulation, frame-of-reference transformations, visual rendering pipeline, UI architecture, datalogging, and assessment features so that the application can be seamlessly replicated in another IDE, web framework (e.g., React, Vue, Svelte), or desktop/mobile app engine (e.g., Unity, Flutter, Canvas/WebGL).

---

## 1. Physics Engine & Reference Frames

The simulation models two vehicles ($Car_1$ and $Car_2$) moving in 2D or 1D kinematics space.

### 1.1 Ground Reference Frame Positions & Velocities
- **$Car_1$ Velocity ($\vec{v}_1$)**:
  - In 2D mode: $Car_1$ moves Northbound at speed $v_1$:
    $$\vec{v}_1 = (0, v_1)$$
  - In 1D mode: $Car_1$ moves Eastbound at speed $v_1$:
    $$\vec{v}_1 = (v_1, 0)$$

- **$Car_2$ Velocity ($\vec{v}_2$)**:
  - Defined by speed $v_2$ and direction angle $\theta$ (measured counterclockwise from East ($+x$)):
    $$\vec{v}_2 = (v_2 \cos\theta, v_2 \sin\theta)$$
  - Standard preset directions:
    - **West ($180^\circ$)**: $\vec{v}_2 = (-v_2, 0)$
    - **East ($0^\circ$)**: $\vec{v}_2 = (v_2, 0)$
    - **North ($90^\circ$)**: $\vec{v}_2 = (0, v_2)$
    - **South ($270^\circ$)**: $\vec{v}_2 = (0, -v_2)$
    - **Custom Angle ($\theta$)**: variable input $[0^\circ, 360^\circ]$

### 1.2 Observer Perspective Modes
The application supports three reference frames:

1. **Ground Frame (`observer = 'ground'`)**:
   - Camera origin anchored at $(0, 0)$ (the intersection).
   - Positions updated relative to the stationary ground:
     $$\vec{r}_1(t + \Delta t) = \vec{r}_1(t) + \vec{v}_1 \Delta t$$
     $$\vec{r}_2(t + \Delta t) = \vec{r}_2(t) + \vec{v}_2 \Delta t$$
   - Displays absolute ground vectors $\vec{v}_1$ and $\vec{v}_2$, alongside relative velocity vector $\vec{v}_{2/1} = \vec{v}_2 - \vec{v}_1$.

2. **Car 1 Frame (`observer = 'car1'`)**:
   - Camera follows $Car_1$: $\vec{r}_{camera} = \vec{r}_1$.
   - Relative velocity of $Car_2$ as observed by $Car_1$:
     $$\vec{v}_{rel} = \vec{v}_{2/1} = \vec{v}_2 - \vec{v}_1 = (v_{2x} - v_{1x}, v_{2y} - v_{1y})$$

3. **Car 2 Frame (`observer = 'car2'`)**:
   - Camera follows $Car_2$: $\vec{r}_{camera} = \vec{r}_2$.
   - Relative velocity of $Car_1$ as observed by $Car_2$:
     $$\vec{v}_{rel} = \vec{v}_{1/2} = \vec{v}_1 - \vec{v}_2 = - \vec{v}_{2/1}$$

### 1.3 Relative Velocity Magnitude & Vector Addition
- Magnitude of relative velocity:
  $$|\vec{v}_{rel}| = \sqrt{v_{rel, x}^2 + v_{rel, y}^2} = \sqrt{(v_{2x} - v_{1x})^2 + (v_{2y} - v_{1y})^2}$$
- Vector Addition Equation overlay:
  $$\vec{v}_1 + \vec{v}_{2/1} = \vec{v}_2$$

---

## 2. Canvas Graphics & Rendering Architecture

### 2.1 Coordinate Space Transformation
World coordinates $(w_x, w_y)$ in meters are mapped to Canvas screen coordinates $(c_x, c_y)$ in pixels:

```javascript
function worldToCanvas(wx, wy) {
    const relX = wx - cameraOffset.x;
    const relY = wy - cameraOffset.y;
    return {
        x: CENTER_X + relX * POSITION_SCALE, // POSITION_SCALE = 5 px/m
        y: CENTER_Y - relY * POSITION_SCALE  // Inverted Y axis for canvas
    };
}
```

### 2.2 Rendering Layers
1. **Background & Tech Grid**: Deep dark fill `#08081c` with subtle grid lines scrolling with `cameraOffset`.
2. **Road Surface & Intersection**:
   - Dark asphalt `#121226` with cyan/white curbs.
   - Double solid yellow center lines `#ffd740`.
   - Zebra crosswalks rendered with white rectangular stripes before intersection entries.
3. **Ground Observer Station Pin (at $(0,0)$)**:
   - When in `observer = 'ground'`, displays a pulsing radar ring, rotating conic radar sweep beam, and a station badge `GROUND OBSERVER (0,0)`.
4. **Exhaust Particle Trail**:
   - Translucent particles spawned behind moving car rear bumpers that expand and fade over time.
5. **Detailed Vehicles (`drawCar`)**:
   - Vehicles rotated according to velocity heading: $\theta = \text{atan2}(-v_y, v_x)$.
   - Metallic gradient finish (`#00e5ff` for Car 1, `#ffd740` for Car 2).
   - 4 Rubber tires, front glass windshield, rear window, side mirrors.
   - Front Headlights: 2 linear light beam cones casting illumination on the road ahead.
   - Rear Taillights: red glowing rectangles.
   - Reticle Halo: pulsing dashed targeting reticle with `OBSERVER` tag when car is the active observer.
6. **Vectors & Overlays (`drawVectors`)**:
   - Neon glowing vector shafts with drop shadow glow (`shadowBlur = 10`).
   - Component projections: dashed orthogonal projection lines down to reference axes with numerical component labels when enabled.
   - Vector Triangle: dashed green vector addition triangle illustrating $\vec{v}_1 + \vec{v}_{rel} = \vec{v}_2$.
7. **Canvas HUD**:
   - Top-right glassmorphic badge showing active reference frame (`Ground Frame (Fixed)`, `Car 1 Frame`, or `Car 2 Frame`).
   - Vector legend box in bottom-left.

---

## 3. UI Control & Data Infrastructure

### 3.1 Controls
- **Car 1 Controls**: Speed slider $[5.0, 50.0] \text{ m/s}$.
- **Car 2 Controls**: Speed slider $[5.0, 50.0] \text{ m/s}$, direction dropdown (West, East, North, South, Custom Angle slider $[0^\circ, 360^\circ]$).
- **Observer Perspective Radios**:
  - `ground`: Ground Frame (Fixed at intersection)
  - `car1`: Car 1 Frame (Car 1 sees Car 2)
  - `car2`: Car 2 Frame (Car 2 sees Car 1)
- **Vector Overlays Checkboxes**:
  - `chk-components`: Component projections
  - `chk-triangle`: Vector Addition Triangle
- **View Modes**: 2D Intersection, 1D Head-On, 1D Same Direction.

### 3.2 Real-Time Data Logger & Charts
- Logs $(t, v_1, v_2, v_{rel,x}, v_{rel,y}, |\vec{v}_{rel}|)$ every 3 decimated frames into an in-memory array.
- **Data Table**: Displays recent log entries with CSV export capability (`exportCSV()`).
- **Graph 1**: Canvas plot of $v_{rel, x}$ and $v_{rel, y}$ vs time.
- **Graph 2**: Canvas plot of $|\vec{v}_{rel}|$ vs time.

### 3.3 Assessment & DOCX Worksheet Export
- 10-Question 5E Formative Assessment (Engage, Explore, Explain, Elaborate, Evaluate).
- Navigation slider, progress counter, dot indicator tracking.
- One-click `.DOCX` worksheet export powered by `docx.js` and `FileSaver.js`.

---

## 4. Replication Checklist for Other IDEs / Frameworks

1. **State Management**: Implement reactive state holding `v1`, `v2`, `car2Direction`, `customAngle`, `observer` (`ground` | `car1` | `car2`), `viewMode`, `showComponents`, `showTriangle`, and car positions.
2. **Game Loop**: Use a 60 FPS animation loop (`requestAnimationFrame` or delta time loop) updating physics positions, spawning particles, recomputing camera offset, and drawing canvas layers.
3. **Canvas Drawing**: Ensure proper canvas context state isolation (`ctx.save()` / `ctx.restore()`) during car rotations, vector shadows, and radar gradient sweeps.

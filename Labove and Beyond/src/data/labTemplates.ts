// Curriculum-Aligned Physics Lab Worksheets & Guided Inquiry Templates
// Designed for AP Physics 1, IB Physics, and General Introductory Mechanics

export interface LabQuestion {
  id: string;
  category: 'hypothesis' | 'calibration' | 'data-analysis' | 'calculation' | 'error-analysis' | 'conclusion';
  prompt: string;
  hint?: string;
  defaultAnswer?: string;
  expectedValue?: number;
  unit?: string;
  tolerancePercent?: number;
}

export interface LabWorksheetTemplate {
  id: string;
  matchingSampleIds: string[];
  category: string;
  title: string;
  course: string;
  objectives: string[];
  theorySummary: string;
  relevantFormulas: string[];
  recommendedGraph: {
    yVariable: string;
    regressionType: 'linear' | 'quadratic' | 'sine';
  };
  questions: LabQuestion[];
}

export const LAB_WORKSHEET_TEMPLATES: LabWorksheetTemplate[] = [
  {
    id: 'lab-uniform-motion',
    matchingSampleIds: ['fizziq-uniform-ball', 'fizziq-train-uniform', 'fizziq-curling'],
    category: '1D Kinematics & Constant Velocity',
    title: 'Lab 1: Uniform Linear Motion & Velocity Verification',
    course: 'AP Physics 1 / Mechanics & Kinematics',
    objectives: [
      'Investigate the position-time relationship x(t) for an object moving with zero net force.',
      'Perform a linear regression fit x(t) = v*t + x_0 to determine experimental velocity vx.',
      'Verify that acceleration ax is zero within experimental uncertainty (Newton\'s First Law).'
    ],
    theorySummary: 'According to Newton\'s First Law of Motion, an object in motion continues with constant velocity unless acted upon by a net external force. In uniform linear motion, the position function is given by x(t) = x_0 + v_x * t, producing a straight line on an x vs. t graph whose slope equals the constant velocity v_x. The derivative dx/dt is constant, meaning acceleration a_x = d²x/dt² = 0.',
    relevantFormulas: [
      'v_x = \\Delta x / \\Delta t = (x_2 - x_1) / (t_2 - t_1)',
      'x(t) = v_x \\cdot t + x_0',
      'a_x = dv_x / dt = 0\\text{ m/s}^2'
    ],
    recommendedGraph: {
      yVariable: 'x',
      regressionType: 'linear'
    },
    questions: [
      {
        id: 'q-hyp',
        category: 'hypothesis',
        prompt: '1. Pre-Lab Hypothesis: What shape do you predict for the position-time (x vs. t) graph and velocity-time (vx vs. t) graph? Explain your reasoning using Newton\'s First Law.',
        hint: 'Consider whether any external horizontal forces (like friction or pushing) are acting on the object during the analyzed frames.'
      },
      {
        id: 'q-calib',
        category: 'calibration',
        prompt: '2. Calibration & Reference Verification: What physical reference object did you use to set the scale ruler, what is its real length in meters, and how does your pixel-to-meter calibration ensure measurement accuracy?',
        hint: 'Check the yellow tape measure or white reference bar visible in the video frame.'
      },
      {
        id: 'q-graph',
        category: 'data-analysis',
        prompt: '3. Graphical Analysis & Regression Fit: Attach your x vs. t kinematics graph. What is the linear regression equation (slope, intercept, and R² correlation coefficient)? Does the high R² value (> 0.99) support constant velocity?',
        hint: 'Use the \'Attach Graph Snapshot\' button above to embed your live Chart.js regression fit.'
      },
      {
        id: 'q-calc',
        category: 'calculation',
        prompt: '4. Experimental Velocity Calculation: State your measured horizontal velocity vx in m/s. Enter your value below to check accuracy.',
        expectedValue: 0.95,
        unit: 'm/s',
        tolerancePercent: 20
      },
      {
        id: 'q-err',
        category: 'error-analysis',
        prompt: '5. Error Analysis & Uncertainty: Discuss possible sources of systematic and random error (e.g. video motion blur, manual point-clicking uncertainty, camera lens perspective distortion, or residual friction on the track).',
        hint: 'Examine whether the points deviate slightly towards the end due to rolling friction.'
      },
      {
        id: 'q-conc',
        category: 'conclusion',
        prompt: '6. Scientific Conclusion: Summarize whether your data confirms uniform motion. How does this laboratory experiment demonstrate Galileo\'s principle of inertia?',
        hint: 'State your final measured velocity with uncertainty (e.g. vx = 0.95 ± 0.04 m/s).'
      }
    ]
  },
  {
    id: 'lab-free-fall',
    matchingSampleIds: ['fizziq-freefall', 'fizziq-freefall-ball', 'fizziq-coffee-filter', 'fizziq-parachute'],
    category: '1D Kinematics & Gravitational Acceleration',
    title: 'Lab 2: Determination of Gravitational Acceleration (g)',
    course: 'AP Physics 1 / Kinematics & Gravity',
    objectives: [
      'Measure the downward vertical position y(t) and velocity vy(t) of a falling object.',
      'Fit a quadratic curve y(t) = -0.5*g*t² + v_0*t + y_0 to extract experimental gravitational acceleration g.',
      'Fit a linear line to vy(t) = -g*t + v_0 to cross-check g against the theoretical standard (9.81 m/s²).',
      'Compute experimental percentage error and evaluate aerodynamic drag effects.'
    ],
    theorySummary: 'In the absence of significant air resistance, all objects in free fall near Earth\'s surface experience constant downward acceleration g \\approx 9.81\\text{ m/s}². The kinematic equations of motion are: v_y(t) = v_{0y} - g\\cdot t and y(t) = y_0 + v_{0y}t - \\frac{1}{2}gt². On a y vs. t graph, the trajectory is a downward parabola where the quadratic coefficient A = -\\frac{1}{2}g, so g = 2|A|. On a vy vs. t graph, the slope is exactly -g.',
    relevantFormulas: [
      'y(t) = y_0 + v_{0y}\\cdot t - \\frac{1}{2}g\\cdot t^2',
      'v_y(t) = v_{0y} - g\\cdot t',
      'g_{\\text{exp}} = 2\\cdot |A| \\quad \\text{(from } y = At^2 + Bt + C\\text{)}',
      '\\text{Percent Error} = \\frac{|g_{\\text{exp}} - 9.81\\text{ m/s}^2|}{9.81\\text{ m/s}^2} \\times 100\\%'
    ],
    recommendedGraph: {
      yVariable: 'y',
      regressionType: 'quadratic'
    },
    questions: [
      {
        id: 'q-hyp',
        category: 'hypothesis',
        prompt: '1. Pre-Lab Hypothesis: Why should the position-time curve for a dropped object be parabolic rather than linear? What does the slope of the velocity-time graph represent?',
        hint: 'Recall that acceleration is the rate of change of velocity, and velocity is the rate of change of position.'
      },
      {
        id: 'q-calib',
        category: 'calibration',
        prompt: '2. Experimental Calibration: Note the reference marker used in the video (e.g. 1.00m vertical white bar on the left). How was the coordinate origin placed (at release point or ground)?',
        hint: 'Setting origin at release point makes y(0) = 0 m.'
      },
      {
        id: 'q-graph',
        category: 'data-analysis',
        prompt: '3. Kinematics Graph & Regression Fit: Attach your y(t) or vy(t) graph. From your quadratic fit y = At² + Bt + C, identify coefficient A. Calculate g_exp = 2*|A|.',
        hint: 'Click \'Attach Graph Snapshot\' above. The equation and R² are automatically imported.'
      },
      {
        id: 'q-calc',
        category: 'calculation',
        prompt: '4. Gravitational Acceleration Measurement: Enter your calculated value of g in m/s² below to compute percent error relative to 9.81 m/s².',
        expectedValue: 9.81,
        unit: 'm/s²',
        tolerancePercent: 10
      },
      {
        id: 'q-err',
        category: 'error-analysis',
        prompt: '5. Error Analysis & Drag Assessment: Was your measured value of g slightly smaller or larger than 9.81 m/s²? Does air drag F_drag = 0.5*C_d*\\rho*A*v² explain any difference?',
        hint: 'For a solid ball over 1-2 meters, air resistance is minimal (~1-3%), but video frame rate and shutter speed can cause sub-pixel tracking shifts.'
      },
      {
        id: 'q-conc',
        category: 'conclusion',
        prompt: '6. Scientific Conclusion: Summarize your findings. Did the ball accelerate uniformly under gravity within your margin of experimental error?',
        hint: 'Report g = [measured value] ± [uncertainty] m/s² with your final conclusion.'
      }
    ]
  },
  {
    id: 'lab-parabola',
    matchingSampleIds: ['fizziq-parabola', 'fizziq-parabola-cinematique', 'fizziq-basketball', 'fizziq-tennis'],
    category: '2D Kinematics & Projectile Motion',
    title: 'Lab 3: Two-Dimensional Projectile Motion & Independence of Motions',
    course: 'AP Physics 1 / 2D Kinematics',
    objectives: [
      'Demonstrate Galileo\'s principle of the independence of horizontal and vertical motions.',
      'Show that horizontal velocity vx(t) is constant while vertical motion vy(t) accelerates downward at g.',
      'Determine the launch speed v_0, launch angle \\theta, apex maximum height, and total range.'
    ],
    theorySummary: 'A 2D projectile under gravity experiences no horizontal acceleration (ax = 0) and uniform vertical acceleration (ay = -g). Hence: x(t) = v_{0x}*t and y(t) = y_0 + v_{0y}*t - 0.5*g*t². Combining these equations eliminates time t, yielding the parabolic path y(x) = y_0 + \\tan(\\theta)*x - \\frac{g}{2(v_0 \\cos\\theta)^2}x². Launch angle is \\theta = \\arctan(v_{0y} / v_{0x}), and initial velocity magnitude is v_0 = \\sqrt{v_{0x}² + v_{0y}²}.',
    relevantFormulas: [
      'v_{0x} = v_0 \\cos\\theta, \\quad v_{0y} = v_0 \\sin\\theta',
      'x(t) = v_{0x}\\cdot t \\implies v_x(t) = \\text{constant}',
      'y(t) = y_0 + v_{0y}\\cdot t - \\frac{1}{2}g\\cdot t^2 \\implies a_y = -g',
      'y_{\\text{max}} = \\frac{v_{0y}^2}{2g}, \\quad \\text{Range } R = \\frac{v_0^2 \\sin(2\\theta)}{g}'
    ],
    recommendedGraph: {
      yVariable: 'trajectory',
      regressionType: 'quadratic'
    },
    questions: [
      {
        id: 'q-hyp',
        category: 'hypothesis',
        prompt: '1. Pre-Lab Hypothesis: State Galileo\'s principle of independence of vertical and horizontal motions. What should happen to vx as the projectile ascends to its apex and descends?',
        hint: 'Does gravity act horizontally?'
      },
      {
        id: 'q-calib',
        category: 'calibration',
        prompt: '2. Calibration & Origin Setup: Confirm your scale calibration (1.00m vertical ruler at x=140). Where did you set the coordinate origin, and is +Y directed upwards?',
        hint: 'Standard kinematics requires +Y Up to obtain negative gravitational acceleration.'
      },
      {
        id: 'q-graph',
        category: 'data-analysis',
        prompt: '3. Trajectory & Velocity Analysis: Attach both your 2D trajectory path (y vs. x) and your velocity components graph (vx and vy vs. t). Confirm that vx is flat while vy decreases linearly.',
        hint: 'Use \'Attach Graph Snapshot\' and \'Attach Trajectory Snapshot\'.'
      },
      {
        id: 'q-calc',
        category: 'calculation',
        prompt: '4. Launch Speed & Angle Determination: Compute the launch angle \\theta in degrees from your initial components v_{0x} and v_{0y}: \\theta = \\arctan(|v_{0y}| / |v_{0x}|).',
        expectedValue: 55.0,
        unit: 'degrees',
        tolerancePercent: 25
      },
      {
        id: 'q-err',
        category: 'error-analysis',
        prompt: '5. Comparison of ay with g: From your vy(t) linear regression slope or y(t) quadratic fit, what is your measured vertical acceleration ay? Compare with theoretical -9.81 m/s².',
        hint: 'Calculate percent discrepancy between |ay| and 9.81 m/s².'
      },
      {
        id: 'q-conc',
        category: 'conclusion',
        prompt: '6. Scientific Conclusion: Summarize how this experiment validates 2D projectile kinematics and the independence of orthogonal motion components.',
        hint: 'Contrast the behavior of the horizontal and vertical velocity vectors.'
      }
    ]
  },
  {
    id: 'lab-pendulum',
    matchingSampleIds: ['fizziq-pendulum', 'fizziq-pendulum-cinematique'],
    category: 'Harmonic Motion & Oscillations',
    title: 'Lab 4: Simple Harmonic Motion of a Pendulum & Energy Conservation',
    course: 'AP Physics 1 / Oscillations & Gravitation',
    objectives: [
      'Investigate simple harmonic oscillation x(t) and sinusoidal motion of a pendulum.',
      'Measure the oscillation period T and frequency f = 1/T.',
      'Test the small-angle approximation formula T = 2*\\pi*\\sqrt{L/g}.',
      'Observe the continuous transformation between kinetic energy Ek and gravitational potential energy Ep.'
    ],
    theorySummary: 'For small angular displacements (\\theta < 15°), the restoring force on a simple pendulum is linear F \\approx -mg\\theta = -(mg/L)x. The resulting motion is Simple Harmonic Motion (SHM) with position x(t) = A\\cos(\\omega t + \\phi), where angular frequency \\omega = \\sqrt{g/L} and period T = 2\\pi\\sqrt{L/g}. Mechanical energy is conserved: E_m = E_k + E_p = \\frac{1}{2}mv^2 + mgh = \\text{constant}. At maximum amplitude, Ek = 0 and Ep is maximum; at equilibrium (lowest point), Ep is minimum and Ek is maximum.',
    relevantFormulas: [
      'T = 2\\pi \\sqrt{\\frac{L}{g}} \\implies g = \\frac{4\\pi^2 L}{T^2}',
      '\\omega = 2\\pi f = \\frac{2\\pi}{T}',
      'E_k = \\frac{1}{2}mv^2, \\quad E_p = mg\\Delta y, \\quad E_{\\text{total}} = E_k + E_p = \\text{constant}'
    ],
    recommendedGraph: {
      yVariable: 'x',
      regressionType: 'sine'
    },
    questions: [
      {
        id: 'q-hyp',
        category: 'hypothesis',
        prompt: '1. Pre-Lab Hypothesis: Does the period of a simple pendulum depend on the mass of the bob? How should period T change if the string length L is quadrupled?',
        hint: 'Examine the formula T = 2\\pi\\sqrt{L/g}. Notice that mass m does not appear in the equation!'
      },
      {
        id: 'q-calib',
        category: 'calibration',
        prompt: '2. Calibration & Dimension Verification: Confirm the 0.40m scale bar calibration and bob mass m = 0.20 kg. What is the measured length L from pivot to bob center?',
        hint: 'Use the ruler tool to measure distance from the top pivot to the center of the white bob.'
      },
      {
        id: 'q-graph',
        category: 'data-analysis',
        prompt: '3. Sinusoidal Fit & Period Determination: Attach your position-time x(t) graph. From peak-to-peak or zero-crossing intervals, what is the experimental period T in seconds?',
        hint: 'Attach the kinematics graph with sinusoidal fit showing amplitude A and period T.'
      },
      {
        id: 'q-calc',
        category: 'calculation',
        prompt: '4. Gravitational Constant Calculation from Pendulum Period: Using your measured length L and period T, calculate g = 4*\\pi²*L / T².',
        expectedValue: 9.81,
        unit: 'm/s²',
        tolerancePercent: 12
      },
      {
        id: 'q-err',
        category: 'error-analysis',
        prompt: '5. Small Angle Assumption & Damping: How does releasing the pendulum at large initial angles (> 20°) affect the period T compared to the ideal small-angle formula?',
        hint: 'For larger angles, the exact period involves elliptic integrals and is slightly longer than 2\\pi\\sqrt{L/g}.'
      },
      {
        id: 'q-conc',
        category: 'conclusion',
        prompt: '6. Scientific Conclusion: Summarize your findings regarding harmonic motion and mechanical energy conservation in a pendulum system.',
        hint: 'Discuss the interchange between potential and kinetic energy throughout an oscillation.'
      }
    ]
  },
  {
    id: 'lab-collisions',
    matchingSampleIds: ['fizziq-elastic-collision', 'tracker-collision-pucks', 'fizziq-newton-cradle', 'tracker-two-carts'],
    category: 'Collisions & Conservation of Momentum',
    title: 'Lab 5: Conservation of Linear Momentum & Kinetic Energy in 2D Collisions',
    course: 'AP Physics 1 / Momentum & Impulse',
    objectives: [
      'Track the positions and velocities of two colliding bodies before and after impact.',
      'Verify the Law of Conservation of Linear Momentum in 2D: \\vec{P}_{total} = m_1\\vec{v}_1 + m_2\\vec{v}_2 = \\text{constant}.',
      'Track the motion of the Center of Mass (CM) to demonstrate constant \\vec{V}_{cm}.',
      'Calculate total initial and final kinetic energies to determine elasticity (elastic vs inelastic).'
    ],
    theorySummary: 'According to Newton\'s Third Law, forces exerted by two colliding bodies on one another are equal in magnitude and opposite in direction (F12 = -F21). Since the net external force on the system is zero, total linear momentum is conserved: \\vec{P}_{initial} = \\vec{P}_{final}. In Cartesian components: P_{1x} + P_{2x} = P\' _{1x} + P\' _{2x} and P_{1y} + P_{2y} = P\' _{1y} + P\' _{2y}. The center of mass moves with constant velocity \\vec{V}_{cm} = \\vec{P}_{total} / (m_1 + m_2). If kinetic energy is conserved (\\Delta Ek = 0), the collision is perfectly elastic.',
    relevantFormulas: [
      '\\vec{P}_{\\text{total}} = m_1\\vec{v}_1 + m_2\\vec{v}_2 = \\text{constant}',
      '\\vec{V}_{\\text{cm}} = \\frac{m_1\\vec{v}_1 + m_2\\vec{v}_2}{m_1 + m_2}',
      'E_{k,\\text{initial}} = \\frac{1}{2}m_1 v_1^2 + \\frac{1}{2}m_2 v_2^2, \\quad E_{k,\\text{final}} = \\frac{1}{2}m_1 v_1\'^{2} + \\frac{1}{2}m_2 v_2\'^{2}',
      'e = \\frac{|\\vec{v}_2\' - \\vec{v}_1\'|}{|\\vec{v}_1 - \\vec{v}_2|} \\quad \\text{(Coefficient of Restitution)}'
    ],
    recommendedGraph: {
      yVariable: 'px_m',
      regressionType: 'linear'
    },
    questions: [
      {
        id: 'q-hyp',
        category: 'hypothesis',
        prompt: '1. Pre-Lab Hypothesis: In the absence of friction, what should happen to the velocity of the center of mass \\vec{V}_{cm} during and after the collision?',
        hint: 'Because internal collision forces cancel out by Newton\'s Third Law, the center of mass continues unaccelerated.'
      },
      {
        id: 'q-calib',
        category: 'calibration',
        prompt: '2. Mass & Scale Calibration: Record the masses of Body 1 and Body 2 (e.g. m1 = 0.20 kg, m2 = 0.20 kg). State the reference distance used to calibrate the scale.',
        hint: 'Check mass values in the series control panel.'
      },
      {
        id: 'q-graph',
        category: 'data-analysis',
        prompt: '3. Momentum Vector Verification: Attach your Momentum / Center of Mass graph. Confirm that the total momentum P_total before and after collision remains constant within uncertainty.',
        hint: 'Toggle Center of Mass vector display to visualize constant V_cm.'
      },
      {
        id: 'q-calc',
        category: 'calculation',
        prompt: '4. Coefficient of Restitution & Energy Loss: Calculate initial Ek and final Ek. What percentage of kinetic energy was retained? (e = 1.0 for elastic, e < 1.0 for inelastic).',
        expectedValue: 0.90,
        unit: 'elasticity ratio (0-1)',
        tolerancePercent: 20
      },
      {
        id: 'q-err',
        category: 'error-analysis',
        prompt: '5. Error Analysis & Friction: Discuss any loss in total momentum due to surface friction or off-axis rotational spin imparted during contact.',
        hint: 'In real collisions, a small amount of linear energy converts into rotational kinetic energy of the spheres.'
      },
      {
        id: 'q-conc',
        category: 'conclusion',
        prompt: '6. Scientific Conclusion: State whether linear momentum was conserved in your experiment. Compare the behavior of individual bodies versus the combined center of mass.',
        hint: 'Summarize your quantitative conservation percentages.'
      }
    ]
  }
];

export function getLabTemplateForSample(sampleId: string): LabWorksheetTemplate {
  const found = LAB_WORKSHEET_TEMPLATES.find((t) => t.matchingSampleIds.includes(sampleId));
  if (found) return found;
  if (sampleId.includes('fall') || sampleId.includes('chute') || sampleId.includes('drop')) {
    return LAB_WORKSHEET_TEMPLATES[1]; // free fall
  }
  if (sampleId.includes('parabole') || sampleId.includes('parabola') || sampleId.includes('toss')) {
    return LAB_WORKSHEET_TEMPLATES[2]; // parabola
  }
  if (sampleId.includes('pendul')) {
    return LAB_WORKSHEET_TEMPLATES[3]; // pendulum
  }
  if (sampleId.includes('collision') || sampleId.includes('puck') || sampleId.includes('cart') || sampleId.includes('choc')) {
    return LAB_WORKSHEET_TEMPLATES[4]; // collisions
  }
  return LAB_WORKSHEET_TEMPLATES[0]; // default uniform motion
}

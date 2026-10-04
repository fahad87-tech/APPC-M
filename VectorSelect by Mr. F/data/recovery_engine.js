// ==============================================================================
// VectorSelect - High-Rigor Procedural Physics Recovery Engine
// Comprehensive Question Pool for AP Physics 1 (Algebra) & AP Physics C (Calculus)
// Features: 60+ Deep Conceptual & Analytical Archetypes, Randomized Numbers,
// Realistic Distractors, KaTeX Formatting, and Cumulative Spiral Review
// ==============================================================================

(function() {
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function parseUnitNumber(unitStr) {
    if (typeof unitStr === 'number') return unitStr;
    const match = String(unitStr || '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  function isCalculusCourse(courseId) {
    const c = String(courseId || '').toLowerCase();
    return c.includes('appc') || c.includes('physics c') || c.includes('calc') || c.includes('mechanics');
  }

  // --------------------------------------------------------------------------
  // AP PHYSICS C (CALCULUS-BASED) DEEP QUESTION POOL (5 Archetypes Per Unit)
  // --------------------------------------------------------------------------
  const APPC_GENERATORS = {
    // Unit 1: Kinematics (Calculus)
    1: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Jerk / Derivative Acceleration
        const a = randInt(2, 4);
        const b = randInt(2, 5);
        const c = randInt(1, 7);
        const t0 = randInt(1, 3);
        const ans = 6 * a * t0 - 2 * b;
        const prompt = `A particle moves along the x-axis with position $x(t) = ${a}t^3 - ${b}t^2 + ${c}t$ meters. What is its instantaneous acceleration $a(${t0})$ at $t = ${t0}\\text{ s}$?`;
        const choices = [
          { text: `${ans} m/s²`, isCorrect: true },
          { text: `${3 * a * t0 * t0 - 2 * b * t0 + c} m/s²`, isCorrect: false },
          { text: `${6 * a * t0 + 2 * b} m/s²`, isCorrect: false },
          { text: `${3 * a * t0 - b} m/s²`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics (Calculus)",
          rigorLabel: "Derivative Acceleration a(t) = d²x/dt²",
          prompt,
          choices: shuffle(choices),
          explanation: `Velocity is $v(t) = \\frac{dx}{dt} = ${3*a}t^2 - ${2*b}t + ${c}$. Taking the second derivative yields $a(t) = \\frac{dv}{dt} = ${6*a}t - ${2*b}$. Evaluating at $t = ${t0}\\text{ s}$: $a(${t0}) = ${6*a}(${t0}) - ${2*b} = ${ans}\\text{ m/s}^2$.`
        };
      } else if (mode === 2) {
        // Definite displacement integral
        const k = randInt(1, 3);
        const m = randInt(1, 4);
        const t0 = randInt(1, 3);
        const ans = k * Math.pow(t0, 3) + m * Math.pow(t0, 2);
        const prompt = `A particle starts from rest at the origin ($x(0)=0$) with velocity $v(t) = ${3*k}t^2 + ${2*m}t\\text{ m/s}$. Find its position $x(${t0})$ at $t = ${t0}\\text{ s}$.`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${3 * k * t0 * t0 + 2 * m * t0} m`, isCorrect: false },
          { text: `${ans + 4} m`, isCorrect: false },
          { text: `${k * t0 * t0 + m * t0} m`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics (Calculus)",
          rigorLabel: "Displacement Integral x(t) = ∫ v dt",
          prompt,
          choices: shuffle(choices),
          explanation: `Position is the definite integral of velocity: $x(${t0}) = \\int_0^{${t0}} (${3*k}t^2 + ${2*m}t) dt = [${k}t^3 + ${m}t^2]_0^{${t0}} = ${k}(${t0}^3) + ${m}(${t0}^2) = ${ans}\\text{ m}$.`
        };
      } else if (mode === 3) {
        // Separation of Variables Quadratic Deceleration
        const k = randInt(1, 3);
        const v0 = randInt(2, 5);
        const prompt = `A particle moves through a viscous medium with acceleration given by $a(v) = -${k}v^2$, where $v(0) = ${v0}\\text{ m/s}$. Which function represents its velocity $v(t)$ for $t \\ge 0$?`;
        const choices = [
          { text: `v(t) = ${v0} / (1 + ${k * v0}t)`, isCorrect: true },
          { text: `v(t) = ${v0} e^{-${k}t}`, isCorrect: false },
          { text: `v(t) = ${v0} - ${k}t²`, isCorrect: false },
          { text: `v(t) = ${v0} / (1 - ${k * v0}t)`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics (Calculus)",
          rigorLabel: "Non-Linear Deceleration via Separation of Variables",
          prompt,
          choices: shuffle(choices),
          explanation: `Using $\\frac{dv}{dt} = -${k}v^2$, separate variables: $\\frac{dv}{v^2} = -${k}dt$. Integrating: $-\\frac{1}{v} + \\frac{1}{${v0}} = -${k}t \\Rightarrow \\frac{1}{v} = \\frac{1}{${v0}} + ${k}t = \\frac{1 + ${k*v0}t}{${v0}} \\Rightarrow v(t) = \\frac{${v0}}{1 + ${k*v0}t}$.`
        };
      } else if (mode === 4) {
        // v dv/dx stopping distance
        const alpha = randInt(2, 4);
        const v0 = randInt(6, 12);
        const ans = Math.round((v0 / alpha) * 10) / 10;
        const prompt = `A glider decelerates with acceleration $a(v) = -${alpha}v$, where $v$ is speed. If its initial velocity is $v_0 = ${v0}\\text{ m/s}$, what total distance $\\Delta x$ does it travel before coming to a stop? (Hint: Use $a = v \\frac{dv}{dx}$)`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${Math.round((v0 * v0 / (2 * alpha)) * 10) / 10} m`, isCorrect: false },
          { text: `${v0 * alpha} m`, isCorrect: false },
          { text: `${Math.round((v0 / (2 * alpha)) * 10) / 10} m`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics (Calculus)",
          rigorLabel: "Chain Rule Spatial Acceleration a = v dv/dx",
          prompt,
          choices: shuffle(choices),
          explanation: `Substitute $a = v\\frac{dv}{dx}$: $v\\frac{dv}{dx} = -${alpha}v \\Rightarrow \\frac{dv}{dx} = -${alpha}$. Integrating from $v_0$ to $0$: $\\int_{v_0}^0 dv = -${alpha} \\int_0^{\\Delta x} dx \\Rightarrow -v_0 = -${alpha}\\Delta x \\Rightarrow \\Delta x = \\frac{v_0}{${alpha}} = \\frac{${v0}}{${alpha}} = ${ans}\\text{ m}$.`
        };
      } else {
        // Curvature acceleration on parabolic path
        const c = randInt(2, 5);
        const v0 = randInt(2, 4);
        const ans = c * v0 * v0;
        const prompt = `A particle traverses a parabolic wire $y(x) = \\frac{1}{2}(${c})x^2$ with constant horizontal speed $v_x = ${v0}\\text{ m/s}$. What is the magnitude of its total acceleration at the vertex $(0,0)$?`;
        const choices = [
          { text: `${ans} m/s²`, isCorrect: true },
          { text: `${c * v0} m/s²`, isCorrect: false },
          { text: `${Math.round(ans / 2)} m/s²`, isCorrect: false },
          { text: `0 m/s²`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics (Calculus)",
          rigorLabel: "Curvature & Parametric Trajectory Calculus",
          prompt,
          choices: shuffle(choices),
          explanation: `Since $v_x$ is constant, $a_x = 0$. By the chain rule, $v_y = \\frac{dy}{dt} = ${c}x \\frac{dx}{dt} = ${c}x v_x$. Then $a_y = \\frac{d^2y}{dt^2} = ${c}\\left(\\frac{dx}{dt}\\right)v_x + ${c}x a_x = ${c}v_x^2 + 0 = ${c}(${v0}^2) = ${ans}\\text{ m/s}^2$. Total acceleration at $(0,0)$ is $|a| = a_y = ${ans}\\text{ m/s}^2$.`
        };
      }
    },

    // Unit 2: Force & Translational Dynamics (Calculus)
    2: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Variable force impulse
        const alpha = randInt(2, 4);
        const T = randInt(2, 3);
        const ans = alpha * Math.pow(T, 3);
        const prompt = `A time-dependent force $F(t) = ${3 * alpha}t^2\\text{ N}$ acts on a mass from $t = 0$ to $t = ${T}\\text{ s}$. What total impulse $J$ is delivered?`;
        const choices = [
          { text: `${ans} N·s`, isCorrect: true },
          { text: `${3 * alpha * T * T} N·s`, isCorrect: false },
          { text: `${2 * ans} N·s`, isCorrect: false },
          { text: `${Math.round(ans / 3)} N·s`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics (Calculus)",
          rigorLabel: "Variable Force Impulse Integral J = ∫ F dt",
          prompt,
          choices: shuffle(choices),
          explanation: `Impulse is $J = \\int_0^{${T}} F(t) dt = \\int_0^{${T}} ${3*alpha}t^2 dt = [${alpha}t^3]_0^{${T}} = ${alpha}(${T}^3) = ${ans}\\text{ N}\\cdot\\text{s}$.`
        };
      } else if (mode === 2) {
        // Terminal velocity with linear drag
        const mass = randInt(2, 5);
        const b = randInt(2, 4);
        const g = 10;
        const ans = Math.round((mass * g / b) * 10) / 10;
        const prompt = `A sphere of mass $m = ${mass}\\text{ kg}$ falls vertically through oil with resistive drag $F_{\\text{drag}} = -${b}v\\text{ N}$. Using $g = 10\\text{ m/s}^2$, what is its terminal velocity $v_t$?`;
        const choices = [
          { text: `${ans} m/s`, isCorrect: true },
          { text: `${Math.round(b * g / mass * 10)/10} m/s`, isCorrect: false },
          { text: `${mass * g} m/s`, isCorrect: false },
          { text: `${Math.round(ans * 2 * 10)/10} m/s`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics (Calculus)",
          rigorLabel: "Terminal Velocity Differential Equation",
          prompt,
          choices: shuffle(choices),
          explanation: `At terminal velocity, acceleration $a = 0 \\Rightarrow \\Sigma F = mg - bv_t = 0 \\Rightarrow v_t = \\frac{mg}{b} = \\frac{${mass} \\times 10}{${b}} = ${ans}\\text{ m/s}$.`
        };
      } else if (mode === 3) {
        // Quadratic drag terminal velocity
        const m = randInt(2, 4);
        const c = pickRandom([0.1, 0.2, 0.4]);
        const g = 10;
        const ans = Math.round(Math.sqrt((m * g) / c) * 10) / 10;
        const prompt = `A skydiver of mass $m = ${m * 10}\\text{ kg}$ experiences quadratic aerodynamic drag $F_d = ${c}v^2\\text{ N}$. Using $g = 10\\text{ m/s}^2$, calculate the terminal speed $v_t$.`;
        const choices = [
          { text: `${ans} m/s`, isCorrect: true },
          { text: `${Math.round((m * 10 * g / c) * 10) / 10} m/s`, isCorrect: false },
          { text: `${Math.round(ans * 1.414 * 10) / 10} m/s`, isCorrect: false },
          { text: `${Math.round(Math.sqrt(c * m * 10 * g) * 10) / 10} m/s`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics (Calculus)",
          rigorLabel: "Quadratic Drag Terminal Equilibrium",
          prompt,
          choices: shuffle(choices),
          explanation: `Equilibrium occurs when gravity balances quadratic drag: $mg = c v_t^2 \\Rightarrow v_t = \\sqrt{\\frac{mg}{c}} = \\sqrt{\\frac{${m * 10} \\times 10}{${c}}} = ${ans}\\text{ m/s}$.`
        };
      } else if (mode === 4) {
        // Velocity half-life under drag in deep space
        const m = randInt(2, 5);
        const b = randInt(1, 3);
        const v0 = randInt(20, 40);
        const ans = Math.round((m / (b * v0)) * 100) / 100;
        const prompt = `A deep-space probe of mass $m = ${m}\\text{ kg}$ coasting at $v_0 = ${v0}\\text{ m/s}$ enters a dust cloud exerting resistive drag $F = -${b}v^2\\text{ N}$. How much time $t_{1/2}$ elapses before its speed drops to $\\frac{1}{2}v_0$?`;
        const choices = [
          { text: `${ans} s`, isCorrect: true },
          { text: `${Math.round(ans * 2 * 100) / 100} s`, isCorrect: false },
          { text: `${Math.round((m * v0 / b) * 10) / 10} s`, isCorrect: false },
          { text: `${Math.round((b / (m * v0)) * 1000) / 1000} s`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics (Calculus)",
          rigorLabel: "Velocity Halving Time via Integration",
          prompt,
          choices: shuffle(choices),
          explanation: `Using Newton's 2nd Law: $m \\frac{dv}{dt} = -b v^2 \\Rightarrow \\int_{v_0}^{v_0/2} v^{-2} dv = -\\frac{b}{m} \\int_0^t dt$. Thus $-\\frac{1}{v_0/2} + \\frac{1}{v_0} = -\\frac{b}{m}t \\Rightarrow -\\frac{1}{v_0} = -\\frac{b}{m}t \\Rightarrow t = \\frac{m}{b v_0} = \\frac{${m}}{${b} \\times ${v0}} = ${ans}\\text{ s}$.`
        };
      } else {
        // Loop vertical normal force with variable gravity
        const factor = pickRandom([3, 4, 5]);
        const ans = 2 * factor + 1;
        const prompt = `A small cart is released from rest at height $h = ${factor}R$ above the bottom of a frictionless vertical circular loop of radius $R$. What is the normal force $N$ exerted by the track on the cart at the very bottom, expressed in units of $mg$?`;
        const choices = [
          { text: `${ans} mg`, isCorrect: true },
          { text: `${ans - 1} mg`, isCorrect: false },
          { text: `${factor * 2} mg`, isCorrect: false },
          { text: `${ans + 2} mg`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics (Calculus)",
          rigorLabel: "Radial Dynamics & Centripetal Normal Force",
          prompt,
          choices: shuffle(choices),
          explanation: `By conservation of mechanical energy: $mgh = \\frac{1}{2}mv^2 \\Rightarrow v^2 = 2gh = 2g(${factor}R) = ${2*factor}gR$. At the bottom, radial acceleration is directed upward: $\\Sigma F_r = N - mg = \\frac{mv^2}{R} = \\frac{m(${2*factor}gR)}{R} = ${2*factor}mg$. Thus $N = ${2*factor}mg + mg = ${ans}mg$.`
        };
      }
    },

    // Unit 3: Work, Energy & Power (Calculus)
    3: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Force gradient F = -dU/dx
        const k = randInt(2, 5);
        const c = randInt(3, 8);
        const x0 = randInt(1, 3);
        const ans = -2 * k * x0 + c;
        const prompt = `A conservative force has potential energy $U(x) = ${k}x^2 - ${c}x$ Joules. What force $F(${x0})$ acts on the particle at $x = ${x0}\\text{ m}$?`;
        const choices = [
          { text: `${ans} N`, isCorrect: true },
          { text: `${-ans} N`, isCorrect: false },
          { text: `${2 * k * x0} N`, isCorrect: false },
          { text: `${k * x0 * x0 - c * x0} N`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power (Calculus)",
          rigorLabel: "Conservative Force Gradient F = -dU/dx",
          prompt,
          choices: shuffle(choices),
          explanation: `The conservative force is the negative gradient of potential energy: $F(x) = -\\frac{dU}{dx} = -(${2*k}x - ${c}) = -${2*k}x + ${c}$. At $x = ${x0}$: $F = -${2*k}(${x0}) + ${c} = ${ans}\\text{ N}$.`
        };
      } else if (mode === 2) {
        // Lennard-Jones style molecular equilibrium separation
        const A = randInt(2, 6);
        const B = randInt(2, 5);
        const prompt = `The potential energy between two neutral atoms is modeled as $U(r) = \\frac{${A}}{r^2} - \\frac{${B}}{r}$. At what separation distance $r_{\\text{eq}}$ is the system in stable equilibrium?`;
        const ansVal = Math.round((2 * A / B) * 100) / 100;
        const choices = [
          { text: `r = ${2 * A} / ${B} (${ansVal} m)`, isCorrect: true },
          { text: `r = ${A} / ${B}`, isCorrect: false },
          { text: `r = ${B} / (${2 * A})`, isCorrect: false },
          { text: `r = ${2 * B} / ${A}`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power (Calculus)",
          rigorLabel: "Potential Well Equilibrium dU/dr = 0",
          prompt,
          choices: shuffle(choices),
          explanation: `Equilibrium occurs where force $F = -\\frac{dU}{dr} = 0$. Here $\\frac{dU}{dr} = -\\frac{2(${A})}{r^3} + \\frac{${B}}{r^2} = 0 \\Rightarrow \\frac{${B}}{r^2} = \\frac{${2*A}}{r^3} \\Rightarrow r_{\\text{eq}} = \\frac{${2*A}}{${B}} = ${ansVal}\\text{ m}$.`
        };
      } else if (mode === 3) {
        // Non-linear spring compression integral
        const k = randInt(10, 30);
        const beta = randInt(4, 12);
        const d = 2;
        const ans = 0.5 * k * Math.pow(d, 2) + 0.25 * beta * Math.pow(d, 4);
        const prompt = `A non-linear bumper exerts restoring force $F(x) = -${k}x - ${beta}x^3\\text{ N}$. How much external work is required to compress the bumper by $d = ${d}\\text{ m}$ from equilibrium?`;
        const choices = [
          { text: `${ans} J`, isCorrect: true },
          { text: `${k * d + beta * Math.pow(d, 3)} J`, isCorrect: false },
          { text: `${ans * 2} J`, isCorrect: false },
          { text: `${Math.round(ans / 2)} J`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power (Calculus)",
          rigorLabel: "Non-Linear Work Integral W = ∫ F dx",
          prompt,
          choices: shuffle(choices),
          explanation: `Work done against the spring is $W = \\int_0^{${d}} (${k}x + ${beta}x^3) dx = [\\frac{1}{2}(${k})x^2 + \\frac{1}{4}(${beta})x^4]_0^{${d}} = \\frac{1}{2}(${k})(4) + \\frac{1}{4}(${beta})(16) = ${ans}\\text{ J}$.`
        };
      } else if (mode === 4) {
        // Instantaneous power P(t) = F(t) v(t)
        const m = randInt(2, 4);
        const c = randInt(2, 3);
        const t0 = 2;
        const ans = 2 * m * Math.pow(c, 2) * Math.pow(t0, 3);
        const prompt = `A vehicle of mass $m = ${m}\\text{ kg}$ starts from rest and moves such that its velocity is $v(t) = ${c}t^2\\text{ m/s}$. What is the instantaneous mechanical power $P(${t0})$ delivered to the vehicle at $t = ${t0}\\text{ s}$?`;
        const choices = [
          { text: `${ans} W`, isCorrect: true },
          { text: `${Math.round(ans / 2)} W`, isCorrect: false },
          { text: `${ans * 2} W`, isCorrect: false },
          { text: `${m * c * t0 * t0} W`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power (Calculus)",
          rigorLabel: "Instantaneous Power Derivative P = F · v",
          prompt,
          choices: shuffle(choices),
          explanation: `Acceleration is $a(t) = \\frac{dv}{dt} = 2(${c})t = ${2*c}t$. Net force is $F(t) = m a(t) = ${m}(${2*c}t) = ${2*m*c}t$. Power is $P(t) = F(t)v(t) = (${2*m*c}t)(${c}t^2) = ${2*m*c*c}t^3$. At $t = ${t0}$: $P(${t0}) = ${2*m*c*c}(${t0}^3) = ${ans}\\text{ W}$.`
        };
      } else {
        // Gravitational escape integral
        const prompt = `Using Newton's law of universal gravitation, determine the minimum work required to lift a satellite of mass $m$ from Earth's surface ($r = R_E$) to an altitude equal to one Earth radius ($r = 2R_E$). Express in terms of $g = GM_E/R_E^2$.`;
        const choices = [
          { text: `(1/2) m g R_E`, isCorrect: true },
          { text: `m g R_E`, isCorrect: false },
          { text: `(1/4) m g R_E`, isCorrect: false },
          { text: `2 m g R_E`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power (Calculus)",
          rigorLabel: "Definite Gravitational Work Integral",
          prompt,
          choices: shuffle(choices),
          explanation: `$W = \\int_{R_E}^{2R_E} \\frac{G M_E m}{r^2} dr = G M_E m \\left[-\\frac{1}{r}\\right]_{R_E}^{2R_E} = G M_E m \\left(\\frac{1}{R_E} - \\frac{1}{2R_E}\\right) = \\frac{G M_E m}{2 R_E}$. Since $g = \\frac{G M_E}{R_E^2}$, we have $\\frac{G M_E}{R_E} = g R_E$, giving $W = \\frac{1}{2} m g R_E$.`
        };
      }
    },

    // Unit 4: Linear Momentum & Systems of Particles (Calculus)
    4: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Center of mass linear density lambda(x) = cx
        const prompt = `A non-uniform thin rod of length $L$ has linear density $\\lambda(x) = cx$, where $x$ is measured from one end. What is the coordinate of its center of mass $x_{\\text{cm}}$?`;
        const choices = [
          { text: `(2/3) L`, isCorrect: true },
          { text: `(1/2) L`, isCorrect: false },
          { text: `(3/4) L`, isCorrect: false },
          { text: `(1/3) L`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum & CoM (Calculus)",
          rigorLabel: "Linear Density Center of Mass Integral",
          prompt,
          choices: shuffle(choices),
          explanation: `$x_{\\text{cm}} = \\frac{\\int_0^L x \\lambda dx}{\\int_0^L \\lambda dx} = \\frac{\\int_0^L c x^2 dx}{\\int_0^L c x dx} = \\frac{\\frac{1}{3} c L^3}{\\frac{1}{2} c L^2} = \\frac{2}{3}L$.`
        };
      } else if (mode === 2) {
        // Quadratic density center of mass lambda(x) = c x^2
        const prompt = `A slender beam of length $L$ has non-uniform linear mass density $\\lambda(x) = c x^2$, where $x$ is measured from the left tip ($x = 0$). Where is the center of mass $x_{\\text{cm}}$ located?`;
        const choices = [
          { text: `(3/4) L`, isCorrect: true },
          { text: `(2/3) L`, isCorrect: false },
          { text: `(4/5) L`, isCorrect: false },
          { text: `(1/2) L`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Systems of Particles & Momentum (Calculus)",
          rigorLabel: "Quadratic Density CoM Integration",
          prompt,
          choices: shuffle(choices),
          explanation: `$x_{\\text{cm}} = \\frac{\\int_0^L x \\lambda(x) dx}{\\int_0^L \\lambda(x) dx} = \\frac{\\int_0^L c x^3 dx}{\\int_0^L c x^2 dx} = \\frac{\\frac{1}{4} c L^4}{\\frac{1}{3} c L^3} = \\frac{3}{4}L$.`
        };
      } else if (mode === 3) {
        // Half-sine impulse pulse
        const F0 = randInt(100, 300);
        const T = pickRandom([0.02, 0.04, 0.05]);
        const ans = Math.round((2 * F0 * T / Math.PI) * 100) / 100;
        const prompt = `A collision delivers a half-sine force pulse $F(t) = ${F0} \\sin\\left(\\frac{\\pi t}{${T}}\\right)\\text{ N}$ from $t = 0$ to $t = ${T}\\text{ s}$. What total impulse $J$ is imparted to the target?`;
        const choices = [
          { text: `${ans} N·s`, isCorrect: true },
          { text: `${Math.round(F0 * T * 100) / 100} N·s`, isCorrect: false },
          { text: `${Math.round((F0 * T / 2) * 100) / 100} N·s`, isCorrect: false },
          { text: `${Math.round(ans * Math.PI * 100) / 100} N·s`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum (Calculus)",
          rigorLabel: "Sinusoidal Collision Force Impulse Integral",
          prompt,
          choices: shuffle(choices),
          explanation: `$J = \\int_0^T F_0 \\sin(\\frac{\\pi t}{T}) dt = F_0 \\left[-\\frac{T}{\\pi} \\cos(\\frac{\\pi t}{T})\\right]_0^T = \\frac{2 F_0 T}{\\pi} = \\frac{2(${F0})(${T})}{\\pi} = ${ans}\\text{ N}\\cdot\\text{s}$.`
        };
      } else if (mode === 4) {
        // Variable mass rocket acceleration
        const ve = randInt(1500, 2500);
        const R = randInt(30, 60);
        const M0 = randInt(4000, 6000);
        const g = 10;
        const ans = Math.round(((R * ve / M0) - g) * 10) / 10;
        const prompt = `A rocket with initial total mass $M_0 = ${M0}\\text{ kg}$ ejects fuel at speed $v_e = ${ve}\\text{ m/s}$ relative to the rocket at a rate of $R = |dm/dt| = ${R}\\text{ kg/s}$. Using $g = 10\\text{ m/s}^2$, what is its initial acceleration at liftoff?`;
        const choices = [
          { text: `${ans} m/s²`, isCorrect: true },
          { text: `${Math.round((R * ve / M0) * 10) / 10} m/s²`, isCorrect: false },
          { text: `${Math.round(ans + 20)} m/s²`, isCorrect: false },
          { text: `${Math.round((ans / 2) * 10) / 10} m/s²`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Systems of Particles (Calculus)",
          rigorLabel: "Rocket Equation & Differential Thrust",
          prompt,
          choices: shuffle(choices),
          explanation: `Thrust is $F_{\\text{thrust}} = v_e \\left|\\frac{dm}{dt}\\right| = ${ve} \\times ${R} = ${ve * R}\\text{ N}$. Net force is $\\Sigma F = F_{\\text{thrust}} - M_0 g$. Initial acceleration is $a = \\frac{F_{\\text{thrust}}}{M_0} - g = \\frac{${ve * R}}{${M0}} - 10 = ${ans}\\text{ m/s}^2$.`
        };
      } else {
        // Falling chain impact scale force
        const prompt = `A flexible chain of length $L$ and total mass $M$ is held vertically above a scale. It is released from rest with its bottom link touching the pan. When a length $x$ has fallen, what force $F$ does the scale register?`;
        const choices = [
          { text: `3 (M/L) g x`, isCorrect: true },
          { text: `(M/L) g x`, isCorrect: false },
          { text: `2 (M/L) g x`, isCorrect: false },
          { text: `(1/2) (M/L) g x`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum (Calculus)",
          rigorLabel: "Continuous Momentum Transfer (Chain Drop)",
          prompt,
          choices: shuffle(choices),
          explanation: `The scale reading consists of two terms: (1) the static weight of fallen chain $W = \\lambda g x$, plus (2) the rate of momentum absorption $F_p = v \\frac{dm}{dt} = v (\\lambda v) = \\lambda v^2$. Since $v^2 = 2gx$, $F_p = 2\\lambda gx$. Total reading is $F = \\lambda g x + 2\\lambda g x = 3\\lambda gx = 3\\frac{M}{L}gx$.`
        };
      }
    },

    // Unit 5: Rotation & Rotational Dynamics (Calculus)
    5: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Parallel axis theorem off-center pivot
        const prompt = `A uniform thin rod of mass $M$ and length $L$ has rotational inertia $I_{\\text{cm}} = \\frac{1}{12}ML^2$. What is its rotational inertia about an axis perpendicular to the rod located at distance $d = \\frac{L}{6}$ from its center?`;
        const choices = [
          { text: `(1/9) M L²`, isCorrect: true },
          { text: `(5/36) M L²`, isCorrect: false },
          { text: `(1/12) M L²`, isCorrect: false },
          { text: `(7/36) M L²`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Rotation (Calculus)",
          rigorLabel: "Parallel Axis Theorem I = I_cm + Md²",
          prompt,
          choices: shuffle(choices),
          explanation: `By the Parallel Axis Theorem: $I = I_{\\text{cm}} + M d^2 = \\frac{1}{12}ML^2 + M\\left(\\frac{L}{6}\\right)^2 = \\frac{1}{12}ML^2 + \\frac{1}{36}ML^2 = \\frac{3+1}{36}ML^2 = \\frac{4}{36}ML^2 = \\frac{1}{9}ML^2$.`
        };
      } else if (mode === 2) {
        // Rotational inertia integral of non-uniform disk sigma(r) = sigma0 (r/R)
        const prompt = `A circular disk of radius $R$ and mass $M$ has radial surface density $\\sigma(r) = \\sigma_0 \\left(\\frac{r}{R}\\right)$. By integrating $I = \\int r^2 dm$, determine its rotational inertia about the central perpendicular axis.`;
        const choices = [
          { text: `(3/5) M R²`, isCorrect: true },
          { text: `(1/2) M R²`, isCorrect: false },
          { text: `(2/5) M R²`, isCorrect: false },
          { text: `(3/4) M R²`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Rotation & Rotational Dynamics (Calculus)",
          rigorLabel: "Rotational Inertia Integral I = ∫ r² dm",
          prompt,
          choices: shuffle(choices),
          explanation: `Mass element is $dm = \\sigma(r) 2\\pi r dr = \\frac{2\\pi \\sigma_0}{R} r^2 dr$. Total mass is $M = \\int_0^R dm = \\frac{2\\pi \\sigma_0}{R} \\int_0^R r^2 dr = \\frac{2\\pi \\sigma_0 R^2}{3}$. Moment of inertia is $I = \\int r^2 dm = \\frac{2\\pi \\sigma_0}{R} \\int_0^R r^4 dr = \\frac{2\\pi \\sigma_0 R^4}{5}$. Dividing: $\\frac{I}{M} = \\frac{R^2 / 5}{1 / 3} = \\frac{3}{5} R^2 \\Rightarrow I = \\frac{3}{5}MR^2$.`
        };
      } else if (mode === 3) {
        // Angular acceleration integration theta(t)
        const beta = randInt(3, 9);
        const t0 = 2;
        const ans = Math.round(((1 / 6) * beta * Math.pow(t0, 3)) * 10) / 10;
        const prompt = `A flywheel starts from rest ($\\omega(0) = 0, \\theta(0) = 0$) and accelerates with time-dependent angular acceleration $\\alpha(t) = ${beta}t\\text{ rad/s}^2$. What total angular displacement $\\theta$ does it turn through in $t = ${t0}\\text{ s}$?`;
        const choices = [
          { text: `${ans} rad`, isCorrect: true },
          { text: `${Math.round(0.5 * beta * t0 * t0 * 10) / 10} rad`, isCorrect: false },
          { text: `${beta * t0} rad`, isCorrect: false },
          { text: `${Math.round(ans * 2 * 10) / 10} rad`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Rotation (Calculus)",
          rigorLabel: "Angular Kinematics Double Integration",
          prompt,
          choices: shuffle(choices),
          explanation: `$\\omega(t) = \\int \\alpha dt = \\int ${beta}t dt = \\frac{1}{2}${beta}t^2$. Then $\\theta(t) = \\int \\omega dt = \\int \\frac{1}{2}${beta}t^2 dt = \\frac{1}{6}${beta}t^3$. At $t = ${t0}$: $\\theta(${t0}) = \\frac{1}{6}(${beta})(8) = ${ans}\\text{ rad}$.`
        };
      } else if (mode === 4) {
        // Angular momentum point mass strikes pivoted rod
        const prompt = `A particle of mass $m$ moving at speed $v_0$ strikes and embeds into the free bottom end of a uniform rod of mass $M$ and length $L$ pivoted at its top end. What is the system's angular speed $\\omega$ immediately after collision? (Recall $I_{\\text{rod}} = \\frac{1}{3}ML^2$)`;
        const choices = [
          { text: `(m v₀) / [ ( (1/3)M + m ) L ]`, isCorrect: true },
          { text: `(m v₀) / [ ( (1/12)M + m ) L ]`, isCorrect: false },
          { text: `(v₀) / [ ( (1/3)M + m ) L ]`, isCorrect: false },
          { text: `(m v₀) / [ ( (1/2)M + m ) L ]`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Rotation (Calculus)",
          rigorLabel: "Angular Momentum Conservation L_i = L_f",
          prompt,
          choices: shuffle(choices),
          explanation: `Conserving angular momentum about the fixed pivot: $L_i = m v_0 L$. The total rotational inertia after impact is $I_{\\text{sys}} = I_{\\text{rod}} + I_{\\text{particle}} = \\frac{1}{3}ML^2 + mL^2 = (\\frac{1}{3}M + m)L^2$. Thus $\\omega = \\frac{L_i}{I_{\\text{sys}}} = \\frac{m v_0 L}{(\\frac{1}{3}M + m)L^2} = \\frac{m v_0}{(\\frac{1}{3}M + m)L}$.`
        };
      } else {
        // Rolling down incline acceleration
        const prompt = `A uniform solid sphere of mass $M$ and radius $R$ ($I_{\\text{cm}} = \\frac{2}{5}MR^2$) rolls without slipping down an incline of angle $\\theta$. What is its linear acceleration $a$?`;
        const choices = [
          { text: `(5/7) g sin θ`, isCorrect: true },
          { text: `(2/7) g sin θ`, isCorrect: false },
          { text: `(2/5) g sin θ`, isCorrect: false },
          { text: `(5/9) g sin θ`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Rotation (Calculus)",
          rigorLabel: "Rolling Without Slipping Dynamics",
          prompt,
          choices: shuffle(choices),
          explanation: `Linear acceleration for rolling without slipping is $a = \\frac{g \\sin\\theta}{1 + \\frac{I_{\\text{cm}}}{MR^2}}$. Substituting $I_{\\text{cm}} = \\frac{2}{5}MR^2$: $a = \\frac{g \\sin\\theta}{1 + 2/5} = \\frac{g \\sin\\theta}{7/5} = \\frac{5}{7}g \\sin\\theta$.`
        };
      }
    },

    // Unit 6/7: Oscillations & Differential Equations (Calculus)
    6: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // SHM Differential Equation
        const omega = pickRandom([2, 3, 4, 5, 6]);
        const K = omega * omega;
        const prompt = `An oscillating block satisfies the differential equation $\\frac{d^2x}{dt^2} + ${K}x = 0$. What is the period $T$ of oscillation in seconds?`;
        const ans = Math.round((2 * Math.PI / omega) * 100) / 100;
        const choices = [
          { text: `${ans} s (2π / ${omega})`, isCorrect: true },
          { text: `${Math.round(2 * Math.PI * omega * 100) / 100} s`, isCorrect: false },
          { text: `${Math.round(Math.PI / K * 100) / 100} s`, isCorrect: false },
          { text: `${omega} s`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Oscillations (Calculus)",
          rigorLabel: "Second-Order SHM Differential Equation",
          prompt,
          choices: shuffle(choices),
          explanation: `The standard harmonic oscillator equation is $\\frac{d^2x}{dt^2} + \\omega^2 x = 0$. Here $\\omega^2 = ${K} \\Rightarrow \\omega = ${omega}\\text{ rad/s}$. The period is $T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{${omega}} = ${ans}\\text{ s}$.`
        };
      } else if (mode === 2) {
        // Physical pendulum frequency
        const prompt = `A uniform thin rod of length $L$ is pivoted at one end and oscillates with small angular amplitude as a physical pendulum. What is its angular frequency $\\omega$? (Recall $I = \\frac{1}{3}ML^2$ and $d_{\\text{cm}} = L/2$)`;
        const choices = [
          { text: `√( 3g / (2L) )`, isCorrect: true },
          { text: `√( g / L )`, isCorrect: false },
          { text: `√( 2g / (3L) )`, isCorrect: false },
          { text: `√( 3g / L )`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Oscillations (Calculus)",
          rigorLabel: "Physical Pendulum Angular Frequency",
          prompt,
          choices: shuffle(choices),
          explanation: `For a physical pendulum, $\\omega = \\sqrt{\\frac{mg d_{\\text{cm}}}{I}}$. Substituting $d_{\\text{cm}} = L/2$ and $I = \\frac{1}{3}ML^2$: $\\omega = \\sqrt{\\frac{mg(L/2)}{\\frac{1}{3}ML^2}} = \\sqrt{\\frac{3g}{2L}}$.`
        };
      } else if (mode === 3) {
        // SHM Equal partition of energy
        const prompt = `A mass-spring simple harmonic oscillator has amplitude $A$. At what displacement $x$ from equilibrium is the kinetic energy $K$ equal to the potential energy $U$?`;
        const choices = [
          { text: `x = A / √2 (≈ 0.707 A)`, isCorrect: true },
          { text: `x = A / 2 (0.500 A)`, isCorrect: false },
          { text: `x = A / 4 (0.250 A)`, isCorrect: false },
          { text: `x = A / √3`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Oscillations (Calculus)",
          rigorLabel: "SHM Energy Partitioning U(x) = K(x)",
          prompt,
          choices: shuffle(choices),
          explanation: `Total mechanical energy is $E = \\frac{1}{2}kA^2$. When $K = U$, $U = \\frac{1}{2}E \\Rightarrow \\frac{1}{2}kx^2 = \\frac{1}{2}\\left(\\frac{1}{2}kA^2\\right) = \\frac{1}{4}kA^2 \\Rightarrow x^2 = \\frac{A^2}{2} \\Rightarrow x = \\frac{A}{\\sqrt{2}} \\approx 0.707A$.`
        };
      } else if (mode === 4) {
        // Amplitude from Initial non-zero conditions
        const x0 = randInt(2, 4);
        const v0 = randInt(3, 6);
        const omega = 2;
        const ans = Math.round(Math.sqrt(x0 * x0 + Math.pow(v0 / omega, 2)) * 100) / 100;
        const prompt = `A harmonic oscillator with angular frequency $\\omega = ${omega}\\text{ rad/s}$ is released with initial position $x(0) = ${x0}\\text{ m}$ and initial velocity $v(0) = ${v0}\\text{ m/s}$. What is the amplitude $A$ of oscillation?`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${Math.round((x0 + v0 / omega) * 100) / 100} m`, isCorrect: false },
          { text: `${Math.round(Math.sqrt(x0 * x0 + v0 * v0) * 100) / 100} m`, isCorrect: false },
          { text: `${x0} m`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Oscillations (Calculus)",
          rigorLabel: "Oscillation Amplitude from Boundary Conditions",
          prompt,
          choices: shuffle(choices),
          explanation: `Total energy is $E = \\frac{1}{2}kA^2 = \\frac{1}{2}kx_0^2 + \\frac{1}{2}mv_0^2$. Dividing by $\\frac{1}{2}k$ and using $k/m = \\omega^2$: $A^2 = x_0^2 + \\frac{v_0^2}{\\omega^2} = ${x0}^2 + \\frac{${v0}^2}{${omega}^2} = ${x0*x0} + ${Math.pow(v0/omega, 2)} \\Rightarrow A = ${ans}\\text{ m}$.`
        };
      } else {
        // Critical damping condition
        const m = randInt(2, 5);
        const k = randInt(15, 45);
        const ans = Math.round((2 * Math.sqrt(m * k)) * 10) / 10;
        const prompt = `A damped oscillator satisfies $m \\frac{d^2x}{dt^2} + b \\frac{dx}{dt} + kx = 0$ with mass $m = ${m}\\text{ kg}$ and spring stiffness $k = ${k}\\text{ N/m}$. What damping coefficient $b_{\\text{crit}}$ produces critical damping?`;
        const choices = [
          { text: `${ans} N·s/m`, isCorrect: true },
          { text: `${Math.round(Math.sqrt(m * k) * 10) / 10} N·s/m`, isCorrect: false },
          { text: `${Math.round(4 * m * k * 10) / 10} N·s/m`, isCorrect: false },
          { text: `${Math.round(ans / 2 * 10) / 10} N·s/m`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Oscillations (Calculus)",
          rigorLabel: "Critical Damping Boundary b = 2√(mk)",
          prompt,
          choices: shuffle(choices),
          explanation: `The characteristic equation is $m r^2 + b r + k = 0$. Critical damping occurs when the discriminant vanishes: $b^2 - 4mk = 0 \\Rightarrow b_{\\text{crit}} = 2\\sqrt{mk} = 2\\sqrt{${m} \\times ${k}} = ${ans}\\text{ N}\\cdot\\text{s/m}$.`
        };
      }
    },
    7: function() {
      return APPC_GENERATORS[6]();
    }
  };

  // --------------------------------------------------------------------------
  // AP PHYSICS 1 (ALGEBRA & COLLEGE BOARD RIGOR) DEEP POOL (5 Archetypes/Unit)
  // --------------------------------------------------------------------------
  const APP1_GENERATORS = {
    // Unit 1: Kinematics (College Board Multi-Step)
    1: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Two-stage rocket acceleration & coasting
        const a1 = pickRandom([4, 5, 6]);
        const t1 = pickRandom([4, 6]);
        const g = 10;
        const v1 = a1 * t1;
        const h1 = 0.5 * a1 * t1 * t1;
        const h2 = (v1 * v1) / (2 * g);
        const ans = h1 + h2;
        const prompt = `A model rocket accelerates straight upward from rest with constant acceleration $a = ${a1}\\text{ m/s}^2$ for $t = ${t1}\\text{ s}$, at which point its engine burns out. Neglecting air resistance ($g = 10\\text{ m/s}^2$), what maximum height $H_{\\text{max}}$ above the ground does it reach?`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${h1} m`, isCorrect: false },
          { text: `${h2} m`, isCorrect: false },
          { text: `${ans + 20} m`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics",
          rigorLabel: "Two-Stage Powered Flight to Coasting Apex",
          prompt,
          choices: shuffle(choices),
          explanation: `Stage 1 (burn): $v_1 = a t_1 = ${a1}(${t1}) = ${v1}\\text{ m/s}$, and $h_1 = \\frac{1}{2}a t_1^2 = \\frac{1}{2}(${a1})(${t1}^2) = ${h1}\\text{ m}$. Stage 2 (coasting to peak): $h_2 = \\frac{v_1^2}{2g} = \\frac{${v1}^2}{20} = ${h2}\\text{ m}$. Total max height is $H = h_1 + h_2 = ${h1} + ${h2} = ${ans}\\text{ m}$.`
        };
      } else if (mode === 2) {
        // Police cruiser catch-up pursuit
        const vs = pickRandom([24, 30, 36]);
        const ap = pickRandom([3, 4, 6]);
        const ans = Math.round((2 * vs / ap) * 10) / 10;
        const prompt = `A speeder travels at constant speed $v_s = ${vs}\\text{ m/s}$ past a stationary police car. At that exact instant, the police car starts from rest with constant acceleration $a_p = ${ap}\\text{ m/s}^2$. How much time elapses before the police car overtakes the speeder?`;
        const choices = [
          { text: `${ans} s`, isCorrect: true },
          { text: `${Math.round(ans / 2 * 10) / 10} s`, isCorrect: false },
          { text: `${Math.round(ans * 2 * 10) / 10} s`, isCorrect: false },
          { text: `${Math.round(vs / ap * 10) / 10} s`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics",
          rigorLabel: "Two-Body Relative Pursuit Kinematics",
          prompt,
          choices: shuffle(choices),
          explanation: `At the catch-up position, displacements are equal: $x_{\\text{speeder}} = x_{\\text{police}} \\Rightarrow v_s t = \\frac{1}{2} a_p t^2$. Canceling $t \\ne 0$: $v_s = \\frac{1}{2} a_p t \\Rightarrow t = \\frac{2 v_s}{a_p} = \\frac{2(${vs})}{${ap}} = ${ans}\\text{ s}$.`
        };
      } else if (mode === 3) {
        // Angled projectile apex height
        const v0 = pickRandom([40, 50, 60]);
        const angle = 30; // sin 30 = 0.5
        const g = 10;
        const vy = v0 * 0.5;
        const ans = (vy * vy) / (2 * g);
        const prompt = `A projectile is launched from ground level with speed $v_0 = ${v0}\\text{ m/s}$ at an angle $\\theta = 30^\\circ$ above the horizontal. Using $g = 10\\text{ m/s}^2$, what is its maximum height above ground? ($\\sin 30^\\circ = 0.5$)`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${ans * 4} m`, isCorrect: false },
          { text: `${Math.round((v0 * v0 / (2 * g)) * 10) / 10} m`, isCorrect: false },
          { text: `${ans * 2} m`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics",
          rigorLabel: "2D Projectile Vertical Motion Decomposition",
          prompt,
          choices: shuffle(choices),
          explanation: `Initial vertical velocity is $v_{0y} = v_0 \\sin 30^\\circ = ${v0}(0.5) = ${vy}\\text{ m/s}$. At the apex $v_y = 0$, so $h_{\\text{max}} = \\frac{v_{0y}^2}{2g} = \\frac{${vy}^2}{20} = ${ans}\\text{ m}$.`
        };
      } else if (mode === 4) {
        // Horizontal cliff range
        const H = pickRandom([20, 45, 80]); // sqrt(2H/10) = 2, 3, 4
        const v0 = randInt(12, 25);
        const tFlight = Math.sqrt((2 * H) / 10);
        const ans = Math.round(v0 * tFlight);
        const prompt = `A marble is rolled horizontally off a cliff of height $H = ${H}\\text{ m}$ with initial speed $v_0 = ${v0}\\text{ m/s}$. Using $g = 10\\text{ m/s}^2$, how far from the base of the cliff does it strike the ground?`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${ans * 2} m`, isCorrect: false },
          { text: `${Math.round(ans / tFlight)} m`, isCorrect: false },
          { text: `${ans + 15} m`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics",
          rigorLabel: "Horizontal Launch Independence of Motion",
          prompt,
          choices: shuffle(choices),
          explanation: `Vertical fall time depends strictly on height: $H = \\frac{1}{2}gt^2 \\Rightarrow t = \\sqrt{\\frac{2(${H})}{10}} = ${tFlight}\\text{ s}$. Horizontal range is $R = v_0 t = ${v0} \\times ${tFlight} = ${ans}\\text{ m}$.`
        };
      } else {
        // Multi-segment v-t trapezoid displacement
        const vMax = pickRandom([15, 20, 25]);
        const t1 = 4;
        const t2 = 6;
        const t3 = 4;
        const ans = 0.5 * vMax * t1 + vMax * t2 + 0.5 * vMax * t3;
        const prompt = `A train starts from rest, accelerates uniformly to $v_{\\text{max}} = ${vMax}\\text{ m/s}$ in $4\\text{ s}$, cruises at constant speed for $6\\text{ s}$, and then brakes uniformly to rest in $4\\text{ s}$. What total distance did the train travel?`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${vMax * (t1 + t2 + t3)} m`, isCorrect: false },
          { text: `${Math.round(ans / 2)} m`, isCorrect: false },
          { text: `${ans - 40} m`, isCorrect: false }
        ];
        return {
          unit: 1,
          unitTitle: "Unit 1: Kinematics",
          rigorLabel: "Piecewise Velocity-Time Area Integration",
          prompt,
          choices: shuffle(choices),
          explanation: `Displacement is the total area under the $v\\text{-}t$ graph: $\\Delta x = \\text{Area}_1 + \\text{Area}_2 + \\text{Area}_3 = \\frac{1}{2}(${vMax})(4) + (${vMax})(6) + \\frac{1}{2}(${vMax})(4) = ${0.5*vMax*4} + ${vMax*6} + ${0.5*vMax*4} = ${ans}\\text{ m}$.`
        };
      }
    },

    // Unit 2: Force & Translational Dynamics (Newton's Laws & Friction)
    2: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Stacked blocks with static friction threshold
        const mA = randInt(2, 4);
        const mB = randInt(4, 8);
        const mu_s = pickRandom([0.3, 0.4, 0.5]);
        const g = 10;
        const ans = Math.round((mA + mB) * mu_s * g * 10) / 10;
        const prompt = `Block A ($m_A = ${mA}\\text{ kg}$) rests on top of Block B ($m_B = ${mB}\\text{ kg}$), which sits on a frictionless floor. The coefficient of static friction between A and B is $\\mu_s = ${mu_s}$. What maximum horizontal force $F$ can be applied to Block B without Block A slipping off?`;
        const choices = [
          { text: `${ans} N`, isCorrect: true },
          { text: `${Math.round(mA * mu_s * g * 10) / 10} N`, isCorrect: false },
          { text: `${Math.round(mB * mu_s * g * 10) / 10} N`, isCorrect: false },
          { text: `${Math.round(ans * 2 * 10) / 10} N`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics",
          rigorLabel: "Coupled Two-Body Static Friction Threshold",
          prompt,
          choices: shuffle(choices),
          explanation: `The maximum acceleration Block A can experience without slipping is caused solely by static friction: $a_{\\text{max}} = \\frac{f_{s,\\text{max}}}{m_A} = \\frac{\\mu_s m_A g}{m_A} = \\mu_s g = ${mu_s} \\times 10 = ${mu_s * 10}\\text{ m/s}^2$. For the entire combined system $(m_A + m_B)$, applying Newton's 2nd Law gives $F_{\\text{max}} = (m_A + m_B) a_{\\text{max}} = (${mA} + ${mB})(${mu_s * 10}) = ${ans}\\text{ N}$.`
        };
      } else if (mode === 2) {
        // Modified Atwood on incline
        const m1 = 4;
        const m2 = 6;
        const angle = 30; // sin 30 = 0.5
        const g = 10;
        const netForce = m2 * g - m1 * g * 0.5;
        const totalMass = m1 + m2;
        const ans = Math.round((netForce / totalMass) * 10) / 10;
        const prompt = `A block of mass $m_1 = ${m1}\\text{ kg}$ sits on a frictionless $30^\\circ$ incline ($\\sin 30^\\circ = 0.5$) and is connected by a light string over a massless pulley to a hanging mass $m_2 = ${m2}\\text{ kg}$. Using $g = 10\\text{ m/s}^2$, what is the magnitude of the system acceleration?`;
        const choices = [
          { text: `${ans} m/s²`, isCorrect: true },
          { text: `${Math.round((m2 * g / totalMass) * 10) / 10} m/s²`, isCorrect: false },
          { text: `${Math.round((m2 - m1) * g / totalMass * 10) / 10} m/s²`, isCorrect: false },
          { text: `5.0 m/s²`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics",
          rigorLabel: "Modified Atwood System Dynamics",
          prompt,
          choices: shuffle(choices),
          explanation: `The driving force is the hanging weight minus the incline component of gravity: $\\Sigma F_{\\text{ext}} = m_2 g - m_1 g \\sin 30^\\circ = (${m2})(10) - (${m1})(10)(0.5) = ${m2*10} - ${m1*5} = ${netForce}\\text{ N}$. The system acceleration is $a = \\frac{\\Sigma F}{m_1 + m_2} = \\frac{${netForce}}{${totalMass}} = ${ans}\\text{ m/s}^2$.`
        };
      } else if (mode === 3) {
        // Banked frictionless turn speed
        const R = pickRandom([40, 60, 90]);
        const theta = 45; // tan 45 = 1
        const g = 10;
        const ans = Math.round(Math.sqrt(g * R) * 10) / 10;
        const prompt = `A highway curve of radius $R = ${R}\\text{ m}$ is banked at an angle $\\theta = 45^\\circ$ ($\\tan 45^\\circ = 1.0$). For a car traveling on frictionless ice ($g = 10\\text{ m/s}^2$), at what speed can it round the curve without sliding up or down?`;
        const choices = [
          { text: `${ans} m/s`, isCorrect: true },
          { text: `${Math.round(ans * 1.414 * 10) / 10} m/s`, isCorrect: false },
          { text: `${Math.round(g * R * 10) / 10} m/s`, isCorrect: false },
          { text: `${Math.round(ans / 2 * 10) / 10} m/s`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics",
          rigorLabel: "Frictionless Banked Curve Equilibrium",
          prompt,
          choices: shuffle(choices),
          explanation: `In a banked frictionless turn, horizontal normal force provides centripetal acceleration: $N \\sin\\theta = \\frac{mv^2}{R}$, and vertical balance gives $N \\cos\\theta = mg$. Dividing equations: $\\tan\\theta = \\frac{v^2}{gR} \\Rightarrow v = \\sqrt{gR\\tan\\theta} = \\sqrt{10 \\times ${R} \\times 1} = ${ans}\\text{ m/s}$.`
        };
      } else if (mode === 4) {
        // Apparent weight in accelerating elevator
        const mass = randInt(50, 80);
        const a = pickRandom([2, 3, 4]);
        const g = 10;
        const ans = mass * (g + a);
        const prompt = `A student of mass $m = ${mass}\\text{ kg}$ stands on a scale inside an elevator that is accelerating upward at $a = ${a}\\text{ m/s}^2$. Using $g = 10\\text{ m/s}^2$, what apparent weight (normal force) does the scale display?`;
        const choices = [
          { text: `${ans} N`, isCorrect: true },
          { text: `${mass * g} N`, isCorrect: false },
          { text: `${mass * (g - a)} N`, isCorrect: false },
          { text: `${mass * a} N`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics",
          rigorLabel: "Non-Inertial Reference & Apparent Weight",
          prompt,
          choices: shuffle(choices),
          explanation: `By Newton's 2nd Law in the vertical direction: $\\Sigma F_y = N - mg = ma \\Rightarrow N = m(g + a) = ${mass}(10 + ${a}) = ${mass}(${10+a}) = ${ans}\\text{ N}$.`
        };
      } else {
        // Contact normal force between two blocks
        const m1 = randInt(2, 4);
        const m2 = randInt(5, 8);
        const F = randInt(20, 50);
        const a = F / (m1 + m2);
        const ans = Math.round(m2 * a * 10) / 10;
        const prompt = `Two blocks of masses $m_1 = ${m1}\\text{ kg}$ and $m_2 = ${m2}\\text{ kg}$ sit in contact on a frictionless floor. A horizontal force $F = ${F}\\text{ N}$ is pushed against $m_1$ from the left. What contact normal force is exerted on $m_2$ by $m_1$?`;
        const choices = [
          { text: `${ans} N`, isCorrect: true },
          { text: `${F} N`, isCorrect: false },
          { text: `${Math.round(m1 * a * 10) / 10} N`, isCorrect: false },
          { text: `${Math.round((F / 2) * 10) / 10} N`, isCorrect: false }
        ];
        return {
          unit: 2,
          unitTitle: "Unit 2: Force & Translational Dynamics",
          rigorLabel: "Internal Contact Force between Accelerating Bodies",
          prompt,
          choices: shuffle(choices),
          explanation: `The common acceleration of the combined mass is $a = \\frac{F}{m_1 + m_2} = \\frac{${F}}{${m1 + m2}}\\text{ m/s}^2$. The only horizontal force accelerating $m_2$ is the contact force from $m_1$: $F_{\\text{contact}} = m_2 a = ${m2}\\left(\\frac{${F}}{${m1 + m2}}\\right) = ${ans}\\text{ N}$.`
        };
      }
    },

    // Unit 3: Work, Energy & Power
    3: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Loop-the-loop critical release height
        const R = pickRandom([4, 6, 8]);
        const ans = 2.5 * R;
        const prompt = `A small cart slides down a frictionless track into a circular loop of radius $R = ${R}\\text{ m}$. What is the minimum release height $h_{\\text{min}}$ above the bottom of the loop such that the cart remains on the track at the very top of the loop?`;
        const choices = [
          { text: `${ans} m (2.5 R)`, isCorrect: true },
          { text: `${2 * R} m (2.0 R)`, isCorrect: false },
          { text: `${3 * R} m (3.0 R)`, isCorrect: false },
          { text: `${1.5 * R} m`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power",
          rigorLabel: "Critical Velocity & Conservation of Energy in Loop",
          prompt,
          choices: shuffle(choices),
          explanation: `At the top of the loop, the minimum speed to maintain contact ($N \\ge 0$) satisfies $mg = \\frac{mv_{\\text{top}}^2}{R} \\Rightarrow v_{\\text{top}}^2 = gR$. By conservation of energy from release height $h$: $mgh = mg(2R) + \\frac{1}{2}mv_{\\text{top}}^2 = 2mgR + \\frac{1}{2}mgR = 2.5 mgR \\Rightarrow h = 2.5 R = 2.5(${R}) = ${ans}\\text{ m}$.`
        };
      } else if (mode === 2) {
        // Spring compression with friction stopping distance
        const k = pickRandom([200, 400]);
        const x = 0.2; // 20 cm
        const mass = 2;
        const mu = 0.25;
        const g = 10;
        const E_spring = 0.5 * k * x * x;
        const f_friction = mu * mass * g;
        const ans = Math.round((E_spring / f_friction) * 100) / 100;
        const prompt = `A block of mass $m = ${mass}\\text{ kg}$ is compressed against a horizontal spring ($k = ${k}\\text{ N/m}$) by $x = 0.2\\text{ m}$ on a level floor with friction coefficient $\\mu_k = ${mu}$. After release from rest, what total distance $d$ does the block slide before coming to rest? ($g = 10\\text{ m/s}^2$)`;
        const choices = [
          { text: `${ans} m`, isCorrect: true },
          { text: `${Math.round(ans * 2 * 100) / 100} m`, isCorrect: false },
          { text: `${Math.round(ans / 2 * 100) / 100} m`, isCorrect: false },
          { text: `0.40 m`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power",
          rigorLabel: "Spring Potential Dissipated by Friction Work",
          prompt,
          choices: shuffle(choices),
          explanation: `All initial elastic potential energy is dissipated as thermal work by friction: $\\frac{1}{2}kx^2 = f_k d = (\\mu_k mg)d$. Thus $d = \\frac{\\frac{1}{2}kx^2}{\\mu_k mg} = \\frac{0.5(${k})(0.04)}{${mu} \\times ${mass} \\times 10} = \\frac{${E_spring}}{${f_friction}} = ${ans}\\text{ m}$.`
        };
      } else if (mode === 3) {
        // Power to maintain constant speed up an incline
        const m = randInt(800, 1200);
        const v = 20; // m/s
        const angle = 30; // sin 30 = 0.5
        const g = 10;
        const P_watts = m * g * 0.5 * v;
        const P_kw = P_watts / 1000;
        const prompt = `A vehicle of mass $m = ${m}\\text{ kg}$ climbs a frictionless $30^\\circ$ slope at a constant speed of $v = ${v}\\text{ m/s}$. Using $g = 10\\text{ m/s}^2$, what mechanical power must the engine output? ($\\sin 30^\\circ = 0.5$)`;
        const choices = [
          { text: `${P_kw} kW (${P_watts} W)`, isCorrect: true },
          { text: `${P_kw * 2} kW`, isCorrect: false },
          { text: `${Math.round(P_kw / 2)} kW`, isCorrect: false },
          { text: `${Math.round(m * g * v / 1000)} kW`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power",
          rigorLabel: "Steady-State Power on Incline P = F · v",
          prompt,
          choices: shuffle(choices),
          explanation: `At constant speed, driving force equals gravity's component along the slope: $F = mg \\sin 30^\\circ = ${m}(10)(0.5) = ${m * 5}\\text{ N}$. Mechanical power is $P = F v = (${m * 5})(${v}) = ${P_watts}\\text{ W} = ${P_kw}\\text{ kW}$.`
        };
      } else if (mode === 4) {
        // Maximum spring compression in inelastic two-cart collision
        const m1 = 2;
        const m2 = 2;
        const v0 = 6;
        const k = 200;
        const mu_red = (m1 * m2) / (m1 + m2); // 1.0 kg
        const U_max = 0.5 * mu_red * v0 * v0;
        const x_max = Math.round(Math.sqrt((2 * U_max) / k) * 100) / 100;
        const prompt = `Cart 1 ($m_1 = ${m1}\\text{ kg}$) moving at $v_0 = ${v0}\\text{ m/s}$ collides head-on with identical stationary Cart 2 ($m_2 = ${m2}\\text{ kg}$) equipped with a light spring buffer ($k = ${k}\\text{ N/m}$). What is the maximum compression $x_{\\text{max}}$ of the spring during the impact?`;
        const choices = [
          { text: `${x_max} m`, isCorrect: true },
          { text: `${Math.round(x_max * 1.414 * 100) / 100} m`, isCorrect: false },
          { text: `${Math.round(x_max / 2 * 100) / 100} m`, isCorrect: false },
          { text: `0.60 m`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power",
          rigorLabel: "Center of Mass Energy in Spring Collision",
          prompt,
          choices: shuffle(choices),
          explanation: `At maximum spring compression, both carts share the center-of-mass velocity $v_{\\text{cm}} = \\frac{m_1 v_0}{m_1 + m_2} = \\frac{2(6)}{4} = 3\\text{ m/s}$. The energy stored in the spring equals the initial kinetic energy minus the center-of-mass kinetic energy: $U_{\\text{spring}} = \\frac{1}{2}(2)(6^2) - \\frac{1}{2}(4)(3^2) = 36 - 18 = 18\\text{ J}$. Then $\\frac{1}{2}(${k})x^2 = 18 \\Rightarrow x = \\sqrt{\\frac{36}{${k}}} = ${x_max}\\text{ m}$.`
        };
      } else {
        // Thermal energy fraction lost to friction
        const prompt = `A box is launched up a rough inclined plane and slides back down to its starting point. If the box returns with only half of its launch kinetic energy ($K_{\\text{return}} = \\frac{1}{2}K_{\\text{launch}}$), what percentage of the initial mechanical energy was converted into thermal internal energy?`;
        const choices = [
          { text: `50%`, isCorrect: true },
          { text: `25%`, isCorrect: false },
          { text: `75%`, isCorrect: false },
          { text: `100%`, isCorrect: false }
        ];
        return {
          unit: 3,
          unitTitle: "Unit 3: Work, Energy & Power",
          rigorLabel: "Thermal Energy Dissipation Accounting",
          prompt,
          choices: shuffle(choices),
          explanation: `Initial mechanical energy was $E_i = K_{\\text{launch}}$. The final mechanical energy upon returning to the same height is $E_f = \\frac{1}{2}K_{\\text{launch}}$. By the First Law of Thermodynamics: $\\Delta E_{\\text{thermal}} = E_i - E_f = K_{\\text{launch}} - \\frac{1}{2}K_{\\text{launch}} = \\frac{1}{2}K_{\\text{launch}}$, which is exactly $50\\%$ of the initial energy.`
        };
      }
    },

    // Unit 4: Linear Momentum & Impulse
    4: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Ballistic pendulum
        const m = 0.02; // 20g
        const M = 1.98; // 1.98kg -> total 2kg
        const h = 0.05; // 5 cm
        const g = 10;
        const v_sys = Math.sqrt(2 * g * h); // 1.0 m/s
        const ans = Math.round(((m + M) / m * v_sys) * 10) / 10;
        const prompt = `In a ballistic pendulum experiment, a bullet of mass $m = 20\\text{ g}$ is fired horizontally into a suspended wooden block of mass $M = 1.98\\text{ kg}$. The block and embedded bullet swing upward to a maximum vertical height of $h = 5.0\\text{ cm}$. Using $g = 10\\text{ m/s}^2$, what was the bullet's initial speed $v_0$?`;
        const choices = [
          { text: `${ans} m/s`, isCorrect: true },
          { text: `${Math.round(ans / 2 * 10) / 10} m/s`, isCorrect: false },
          { text: `100 m/s`, isCorrect: false },
          { text: `${Math.round(v_sys * 10) / 10} m/s`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum & Impulse",
          rigorLabel: "Ballistic Pendulum Conservation Coupling",
          prompt,
          choices: shuffle(choices),
          explanation: `Stage 2 (energy conservation during swing): $\\frac{1}{2}(m+M)v_{\\text{sys}}^2 = (m+M)gh \\Rightarrow v_{\\text{sys}} = \\sqrt{2gh} = \\sqrt{2(10)(0.05)} = 1.0\\text{ m/s}$. Stage 1 (momentum conservation during inelastic collision): $m v_0 = (m+M)v_{\\text{sys}} \\Rightarrow v_0 = \\frac{m+M}{m} v_{\\text{sys}} = \\frac{2.0}{0.02}(1.0) = ${ans}\\text{ m/s}$.`
        };
      } else if (mode === 2) {
        // 2D Perpendicular Inelastic Collision
        const p1 = 30000; // kg m/s East
        const p2 = 40000; // kg m/s North
        const totalMass = 2500;
        const p_tot = Math.sqrt(p1 * p1 + p2 * p2); // 50000
        const ans = p_tot / totalMass; // 20 m/s
        const prompt = `Car 1 has momentum $p_1 = 30{,}000\\text{ kg}\\cdot\\text{m/s}$ heading East, and Car 2 has momentum $p_2 = 40{,}000\\text{ kg}\\cdot\\text{m/s}$ heading North. They collide at an intersection and stick together into a wreckage of total mass $M = 2500\\text{ kg}$. What is the wreckage speed immediately after collision?`;
        const choices = [
          { text: `${ans} m/s`, isCorrect: true },
          { text: `${Math.round((p1 + p2) / totalMass)} m/s`, isCorrect: false },
          { text: `${Math.round(p1 / totalMass)} m/s`, isCorrect: false },
          { text: `28 m/s`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum & Impulse",
          rigorLabel: "2D Vector Momentum Conservation",
          prompt,
          choices: shuffle(choices),
          explanation: `Momentum is a vector quantity. Since the cars travel at right angles: $P_{\\text{total}} = \\sqrt{p_x^2 + p_y^2} = \\sqrt{30000^2 + 40000^2} = 50{,}000\\text{ kg}\\cdot\\text{m/s}$. The speed after sticking is $v = \\frac{P_{\\text{total}}}{M} = \\frac{50000}{2500} = ${ans}\\text{ m/s}$.`
        };
      } else if (mode === 3) {
        // Triangular force pulse impulse
        const Fmax = randInt(2000, 6000);
        const dt = pickRandom([0.02, 0.04]);
        const m = 0.5; // kg
        const impulse = 0.5 * Fmax * dt;
        const ans = Math.round((impulse / m) * 10) / 10;
        const prompt = `A soccer ball of mass $m = 0.5\\text{ kg}$ initially at rest is struck with an impact force that rises linearly to $F_{\\text{max}} = ${Fmax}\\text{ N}$ and falls back to zero over $\\Delta t = ${dt}\\text{ s}$ (triangular pulse). What speed does the ball leave the foot with?`;
        const choices = [
          { text: `${ans} m/s`, isCorrect: true },
          { text: `${ans * 2} m/s`, isCorrect: false },
          { text: `${Math.round(ans / 2 * 10) / 10} m/s`, isCorrect: false },
          { text: `${Fmax * dt} m/s`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum & Impulse",
          rigorLabel: "Triangular Force Pulse Impulse Area",
          prompt,
          choices: shuffle(choices),
          explanation: `Impulse is the area of the triangular force-time plot: $J = \\frac{1}{2} F_{\\text{max}} \\Delta t = \\frac{1}{2}(${Fmax})(${dt}) = ${impulse}\\text{ N}\\cdot\\text{s}$. By the impulse-momentum theorem: $\\Delta p = m \\Delta v \\Rightarrow v = \\frac{J}{m} = \\frac{${impulse}}{0.5} = ${ans}\\text{ m/s}$.`
        };
      } else if (mode === 4) {
        // Explosion kinetic energy ratio
        const m1 = randInt(2, 4);
        const m2 = m1 * 2;
        const prompt = `A compressed spring is released between two blocks of masses $m_1 = ${m1}\\text{ kg}$ and $m_2 = ${m2}\\text{ kg}$ initially at rest on a frictionless table. What is the ratio of kinetic energy acquired by Block 1 to that acquired by Block 2 ($K_1 / K_2$)?`;
        const choices = [
          { text: `2 : 1 (Block 1 has twice the KE)`, isCorrect: true },
          { text: `1 : 2 (Block 2 has twice the KE)`, isCorrect: false },
          { text: `1 : 1 (Equal kinetic energies)`, isCorrect: false },
          { text: `4 : 1`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum & Impulse",
          rigorLabel: "Explosive Recoil Kinetic Energy Inversion",
          prompt,
          choices: shuffle(choices),
          explanation: `By conservation of linear momentum: $p_1 = p_2 = p$. Expressing kinetic energy in terms of momentum: $K = \\frac{p^2}{2m}$. Therefore, the ratio is $\\frac{K_1}{K_2} = \\frac{p^2 / (2m_1)}{p^2 / (2m_2)} = \\frac{m_2}{m_1} = \\frac{${m2}}{${m1}} = 2$. The lighter mass receives twice the kinetic energy.`
        };
      } else {
        // Elastic bounce vs sticky clay average force
        const prompt = `Two identical spheres of mass $m$ hit a rigid wall with speed $v$. Sphere A bounces back elastically with speed $v$, while Sphere B is made of clay and sticks to the wall ($v_f = 0$). If both collisions occur over the exact same contact time $\\Delta t$, what is the ratio of average force exerted on the wall $F_A / F_B$?`;
        const choices = [
          { text: `2 : 1`, isCorrect: true },
          { text: `1 : 1`, isCorrect: false },
          { text: `1 : 2`, isCorrect: false },
          { text: `4 : 1`, isCorrect: false }
        ];
        return {
          unit: 4,
          unitTitle: "Unit 4: Linear Momentum & Impulse",
          rigorLabel: "Impulse Comparison: Elastic vs Inelastic Impact",
          prompt,
          choices: shuffle(choices),
          explanation: `For elastic rebound: $\\Delta p_A = mv - (-mv) = 2mv$. For sticking: $\\Delta p_B = mv - 0 = mv$. Since average force is $F_{\\text{avg}} = \\frac{\\Delta p}{\\Delta t}$, the ratio of forces is $\\frac{2mv / \\Delta t}{mv / \\Delta t} = 2 : 1$.`
        };
      }
    },

    // Unit 5: Torque & Rotational Dynamics
    5: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Angled cable supporting heavy beam
        const M = randInt(40, 80);
        const g = 10;
        const angle = 30; // sin 30 = 0.5
        const ans = (M * g) / (2 * 0.5); // = M * g
        const prompt = `A uniform horizontal beam of mass $M = ${M}\\text{ kg}$ is attached to a wall by a frictionless pivot. A cable anchored to the far end of the beam makes an angle of $\\theta = 30^\\circ$ above the horizontal. Using $g = 10\\text{ m/s}^2$, what is the tension $T$ in the cable? ($\\sin 30^\\circ = 0.5$)`;
        const choices = [
          { text: `${ans} N`, isCorrect: true },
          { text: `${ans / 2} N`, isCorrect: false },
          { text: `${ans * 2} N`, isCorrect: false },
          { text: `${Math.round(M * g * 0.5)} N`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Torque & Rotational Dynamics",
          rigorLabel: "Static Equilibrium Torque Balance",
          prompt,
          choices: shuffle(choices),
          explanation: `Taking torques about the wall pivot: $\\Sigma \\tau = 0 \\Rightarrow T L \\sin 30^\\circ - Mg\\left(\\frac{L}{2}\\right) = 0$. Solving for tension: $T = \\frac{Mg}{2 \\sin 30^\\circ} = \\frac{${M}(10)}{2(0.5)} = ${ans}\\text{ N}$.`
        };
      } else if (mode === 2) {
        // Rolling race: sphere vs disk vs hoop
        const prompt = `A solid sphere ($I = \\frac{2}{5}MR^2$), a solid cylinder ($I = \\frac{1}{2}MR^2$), and a thin hoop ($I = MR^2$) of identical mass and radius are released simultaneously from rest down a rough incline. Which object reaches the bottom first?`;
        const choices = [
          { text: `Solid sphere (reaches bottom first)`, isCorrect: true },
          { text: `Solid cylinder`, isCorrect: false },
          { text: `Thin hoop`, isCorrect: false },
          { text: `All three tie (independent of rotational inertia)`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Torque & Rotational Dynamics",
          rigorLabel: "Rotational Inertia Fraction & Rolling Acceleration",
          prompt,
          choices: shuffle(choices),
          explanation: `Linear acceleration rolling without slipping is $a = \\frac{g \\sin\\theta}{1 + c}$, where $I = c MR^2$. Here $c_{\\text{sphere}} = 0.40$, $c_{\\text{cylinder}} = 0.50$, and $c_{\\text{hoop}} = 1.00$. Smaller $c$ yields greater acceleration, meaning the solid sphere accelerates fastest and wins the race.`
        };
      } else if (mode === 3) {
        // Figure skater turntable angular momentum
        const I1 = 4.0;
        const I2 = 1.6;
        const omega1 = 2.0;
        const ans = Math.round((I1 * omega1 / I2) * 10) / 10;
        const prompt = `A dancer on a low-friction turntable rotates at $\\omega_1 = ${omega1}\\text{ rad/s}$ with arms outstretched ($I_1 = ${I1}\\text{ kg}\\cdot\\text{m}^2$). When she pulls her arms tight against her body, her rotational inertia decreases to $I_2 = ${I2}\\text{ kg}\\cdot\\text{m}^2$. What is her new angular velocity $\\omega_2$?`;
        const choices = [
          { text: `${ans} rad/s`, isCorrect: true },
          { text: `${omega1} rad/s`, isCorrect: false },
          { text: `${Math.round(I2 * omega1 / I1 * 10) / 10} rad/s`, isCorrect: false },
          { text: `${ans * 2} rad/s`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Torque & Rotational Dynamics",
          rigorLabel: "Conservation of Angular Momentum",
          prompt,
          choices: shuffle(choices),
          explanation: `In the absence of external torque: $L_i = L_f \\Rightarrow I_1 \\omega_1 = I_2 \\omega_2 \\Rightarrow \\omega_2 = \\frac{I_1 \\omega_1}{I_2} = \\frac{${I1} \\times ${omega1}}{${I2}} = ${ans}\\text{ rad/s}$.`
        };
      } else if (mode === 4) {
        // Massive pulley Atwood
        const m1 = 2;
        const m2 = 4;
        const Mp = 4; // I = 0.5 Mp R^2
        const g = 10;
        const netForce = (m2 - m1) * g;
        const effectiveMass = m1 + m2 + 0.5 * Mp; // 2 + 4 + 2 = 8
        const ans = Math.round((netForce / effectiveMass) * 10) / 10;
        const prompt = `An Atwood machine has hanging masses $m_1 = ${m1}\\text{ kg}$ and $m_2 = ${m2}\\text{ kg}$. The pulley is a uniform disk of mass $M_p = ${Mp}\\text{ kg}$ ($I = \\frac{1}{2}M_p R^2$) with friction at the axle neglected. Using $g = 10\\text{ m/s}^2$, what is the linear acceleration $a$ of the system?`;
        const choices = [
          { text: `${ans} m/s²`, isCorrect: true },
          { text: `${Math.round((m2 - m1) * g / (m1 + m2) * 10) / 10} m/s² (massless pulley)`, isCorrect: false },
          { text: `5.0 m/s²`, isCorrect: false },
          { text: `${Math.round(ans / 2 * 10) / 10} m/s²`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Torque & Rotational Dynamics",
          rigorLabel: "Modified Atwood with Rotational Inertia of Pulley",
          prompt,
          choices: shuffle(choices),
          explanation: `Accounting for pulley rotational inertia, the effective system mass is $m_{\\text{eff}} = m_1 + m_2 + \\frac{I}{R^2} = m_1 + m_2 + \\frac{1}{2}M_p = ${m1} + ${m2} + ${0.5*Mp} = ${effectiveMass}\\text{ kg}$. The driving net force is $(m_2 - m_1)g = (${m2} - ${m1})(10) = ${netForce}\\text{ N}$. Thus $a = \\frac{${netForce}}{${effectiveMass}} = ${ans}\\text{ m/s}^2$.`
        };
      } else {
        // Ladder impending slip static friction
        const angle = 45; // tan 45 = 1
        const ans = 0.5;
        const prompt = `A uniform ladder rests against a frictionless vertical wall, making an angle $\\theta = 45^\\circ$ with the rough horizontal ground ($\\tan 45^\\circ = 1.0$). What is the minimum coefficient of static friction $\\mu_s$ between the ladder and the ground required to prevent slipping?`;
        const choices = [
          { text: `0.50 (1 / (2 tan θ))`, isCorrect: true },
          { text: `1.00`, isCorrect: false },
          { text: `0.25`, isCorrect: false },
          { text: `0.71`, isCorrect: false }
        ];
        return {
          unit: 5,
          unitTitle: "Unit 5: Torque & Rotational Dynamics",
          rigorLabel: "Rigid Body Ladder Statics & Slip Threshold",
          prompt,
          choices: shuffle(choices),
          explanation: `From equilibrium of torques about the base of the ladder: $N_{\\text{wall}} L \\sin\\theta - Mg \\left(\\frac{L}{2}\\right) \\cos\\theta = 0 \\Rightarrow N_{\\text{wall}} = \\frac{Mg}{2\\tan\\theta}$. Horizontal balance requires $f_s = N_{\\text{wall}}$, and vertical balance gives $N_{\\text{floor}} = Mg$. At impending slip, $f_s = \\mu_s N_{\\text{floor}} \\Rightarrow \\mu_s Mg = \\frac{Mg}{2\\tan 45^\\circ} \\Rightarrow \\mu_s = \\frac{1}{2(1.0)} = 0.50$.`
        };
      }
    },

    // Unit 6/7: Simple Harmonic Motion & Gravitation
    6: function() {
      const mode = randInt(1, 5);
      if (mode === 1) {
        // Mass-Spring scaling factor
        const factorM = 4;
        const factorK = 0.25;
        const ans = Math.round(Math.sqrt(factorM / factorK) * 10) / 10;
        const prompt = `A block-spring oscillator has period $T$. If the oscillating mass is quadrupled ($m \\to 4m$) and the spring constant is reduced to one-fourth ($k \\to k/4$), by what factor does the new period $T'$ change?`;
        const choices = [
          { text: `4 times T (${ans} T)`, isCorrect: true },
          { text: `2 times T`, isCorrect: false },
          { text: `16 times T`, isCorrect: false },
          { text: `T remains unchanged`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Simple Harmonic Motion",
          rigorLabel: "Oscillation Period Proportionality T = 2π√(m/k)",
          prompt,
          choices: shuffle(choices),
          explanation: `The period of a mass-spring system is $T = 2\\pi \\sqrt{\\frac{m}{k}}$. With the modifications: $T' = 2\\pi \\sqrt{\\frac{4m}{k/4}} = 2\\pi \\sqrt{16\\frac{m}{k}} = 4 \\left(2\\pi \\sqrt{\\frac{m}{k}}\\right) = 4T$.`
        };
      } else if (mode === 2) {
        // SHM Velocity at A/2
        const prompt = `A particle executes simple harmonic motion with amplitude $A$ and maximum velocity $v_{\\text{max}}$. What is its speed when its position is at $x = \\frac{1}{2}A$?`;
        const choices = [
          { text: `(√3 / 2) v_max (≈ 0.866 v_max)`, isCorrect: true },
          { text: `(1/2) v_max`, isCorrect: false },
          { text: `(1/4) v_max`, isCorrect: false },
          { text: `(√2 / 2) v_max`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Simple Harmonic Motion",
          rigorLabel: "Phase Space Velocity-Position Relation",
          prompt,
          choices: shuffle(choices),
          explanation: `By conservation of mechanical energy: $\\frac{1}{2}mv^2 + \\frac{1}{2}kx^2 = \\frac{1}{2}kA^2$. Substituting $x = \\frac{1}{2}A$: $\\frac{1}{2}mv^2 = \\frac{1}{2}kA^2 - \\frac{1}{2}k\\left(\\frac{A}{2}\\right)^2 = \\frac{3}{4}\\left(\\frac{1}{2}kA^2\\right)$. Since $K_{\\text{max}} = \\frac{1}{2}mv_{\\text{max}}^2 = \\frac{1}{2}kA^2$, we have $v^2 = \\frac{3}{4}v_{\\text{max}}^2 \\Rightarrow v = \\frac{\\sqrt{3}}{2} v_{\\text{max}} \\approx 0.866 v_{\\text{max}}$.`
        };
      } else if (mode === 3) {
        // Gravitational acceleration at altitude
        const prompt = `What is the acceleration due to gravity at an altitude $h = R_E$ above Earth's surface (where $R_E$ is Earth's radius), in terms of surface gravity $g_0$?`;
        const choices = [
          { text: `(1/4) g₀ (0.25 g₀)`, isCorrect: true },
          { text: `(1/2) g₀`, isCorrect: false },
          { text: `(1/9) g₀`, isCorrect: false },
          { text: `4 g₀`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Gravitation",
          rigorLabel: "Inverse-Square Law Radial Scaling",
          prompt,
          choices: shuffle(choices),
          explanation: `Gravitational acceleration is measured from the center of Earth: $r = R_E + h = R_E + R_E = 2 R_E$. By Newton's law: $g(r) = \\frac{GM_E}{r^2} = \\frac{GM_E}{(2R_E)^2} = \\frac{1}{4} \\frac{GM_E}{R_E^2} = \\frac{1}{4} g_0$.`
        };
      } else if (mode === 4) {
        // Kepler's Third Law orbital period ratio
        const prompt = `Satellite A orbits a planet at radius $r_A = r$ with period $T_A$. Satellite B orbits the same planet at radius $r_B = 4r$. What is Satellite B's orbital period $T_B$?`;
        const choices = [
          { text: `8 T_A`, isCorrect: true },
          { text: `4 T_A`, isCorrect: false },
          { text: `16 T_A`, isCorrect: false },
          { text: `64 T_A`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Gravitation",
          rigorLabel: "Kepler's Third Law Period Proportionality T² ∝ r³",
          prompt,
          choices: shuffle(choices),
          explanation: `By Kepler's Third Law: $\\frac{T_B^2}{T_A^2} = \\frac{r_B^3}{r_A^3} = \\left(\\frac{4r}{r}\\right)^3 = 4^3 = 64$. Taking the square root: $T_B = \\sqrt{64} T_A = 8 T_A$.`
        };
      } else {
        // Pendulum in accelerating elevator
        const L = 2.5; // m
        const a = 6.0; // m/s^2
        const g = 10;
        const geff = g + a; // 16 m/s^2
        const ans = Math.round((2 * Math.PI * Math.sqrt(L / geff)) * 100) / 100;
        const prompt = `A simple pendulum of length $L = 2.5\\text{ m}$ is suspended inside an elevator accelerating upward at $a = 6.0\\text{ m/s}^2$. Using Earth gravity $g = 10\\text{ m/s}^2$, what is the period $T$ of small oscillations?`;
        const choices = [
          { text: `${ans} s`, isCorrect: true },
          { text: `${Math.round(2 * Math.PI * Math.sqrt(L / g) * 100) / 100} s`, isCorrect: false },
          { text: `${Math.round(2 * Math.PI * Math.sqrt(L / (g - a)) * 100) / 100} s`, isCorrect: false },
          { text: `${Math.round(ans * 2 * 100) / 100} s`, isCorrect: false }
        ];
        return {
          unit: 6,
          unitTitle: "Unit 6: Simple Harmonic Motion",
          rigorLabel: "Effective Gravitational Field in Non-Inertial Frame",
          prompt,
          choices: shuffle(choices),
          explanation: `In an elevator accelerating upward with $a$, the effective gravitational field experienced by the bob is $g_{\\text{eff}} = g + a = 10 + 6 = 16\\text{ m/s}^2$. The period is $T = 2\\pi \\sqrt{\\frac{L}{g_{\\text{eff}}}} = 2\\pi \\sqrt{\\frac{2.5}{16}} = 2\\pi \\frac{\\sqrt{2.5}}{4} = ${ans}\\text{ s}$.`
        };
      }
    },
    7: function() {
      return APP1_GENERATORS[6]();
    }
  };

  // --------------------------------------------------------------------------
  // COLLEGIATE LABORATORY SIMULATION CHALLENGE GENERATORS (Prompt + Choices + Sim)
  // --------------------------------------------------------------------------
  const LAB_SIMULATION_GENERATORS = {
    // Unit 1: Precision Ballistics & Projectile Kinematics (Dual-Axis Vector Photogate)
    1: function(isCalc) {
      const g = isCalc ? 9.8 : 10.0;
      const angle = pickRandom([30, 37, 45, 53, 60]);
      const v0 = pickRandom([20.0, 24.0, 25.0, 28.0, 30.0]);
      const rad = (angle * Math.PI) / 180;
      const vox = v0 * Math.cos(rad);
      const voy = v0 * Math.sin(rad);
      
      const totalRange = (v0 * v0 * Math.sin(2 * rad)) / g;
      const photogateX = Math.round((totalRange * pickRandom([0.35, 0.45, 0.55, 0.65])) * 10) / 10;
      
      const tTransit = photogateX / vox;
      const yTransit = voy * tTransit - 0.5 * g * tTransit * tTransit;
      const ansRounded = Math.round(yTransit * 10) / 10;
      
      const prompt = `
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <span>🔬 Laboratory Investigation: Projectile Kinematics &amp; Sensor Telemetry</span>
          </div>
          <p class="text-slate-100 text-sm md:text-base leading-relaxed">
            The precision ballistics apparatus above launches a projectile at elevation $\\theta = ${angle}^\\circ$ with initial speed $v_0 = ${v0.toFixed(1)}\\text{ m/s}$. Photogate Sensor 1 is positioned at horizontal distance $X = ${photogateX.toFixed(1)}\\text{ m}$ from the muzzle ($g = ${g.toFixed(1)}\\text{ m/s}^2$).
          </p>
          <p class="text-slate-200 text-sm md:text-base font-semibold">
            Using the apparatus telemetry or analytical kinematics equations, calculate the vertical altitude $y$ of the projectile at the instant it triggers Photogate Sensor 1.
          </p>
        </div>
      `;

      const choices = [
        { text: `${ansRounded.toFixed(1)} m`, isCorrect: true },
        { text: `${(Math.max(1, ansRounded + randInt(3, 7))).toFixed(1)} m`, isCorrect: false },
        { text: `${(Math.max(0.5, ansRounded - randInt(3, 5))).toFixed(1)} m`, isCorrect: false },
        { text: `${(voy * tTransit).toFixed(1)} m`, isCorrect: false }
      ];

      const explanation = `**Step 1: Horizontal Motion & Transit Time**
Since horizontal acceleration is zero:
$$v_{0x} = v_0 \\cos\\theta = ${v0.toFixed(1)} \\cos(${angle}^\\circ) = ${vox.toFixed(2)}\\text{ m/s}$$
$$t_{\\text{gate}} = \\frac{X}{v_{0x}} = \\frac{${photogateX.toFixed(1)}}{${vox.toFixed(2)}} = ${tTransit.toFixed(3)}\\text{ s}$$

**Step 2: Vertical Altitude at Sensor Plane**
$$v_{0y} = v_0 \\sin\\theta = ${v0.toFixed(1)} \\sin(${angle}^\\circ) = ${voy.toFixed(2)}\\text{ m/s}$$
$$y(t) = v_{0y} t - \\frac{1}{2}g t^2 = (${voy.toFixed(2)})(${tTransit.toFixed(3)}) - \\frac{1}{2}(${g.toFixed(1)})(${tTransit.toFixed(3)})^2 = ${ansRounded.toFixed(1)}\\text{ m}$$`;

      return {
        unit: 1,
        unitTitle: "Unit 1: Kinematics (Collegiate Lab)",
        simType: 'cannon',
        simData: { angle, v0, photogateX, g, isCalculus: isCalc },
        prompt,
        choices: shuffle(choices),
        explanation
      };
    },

    // Unit 2: Dynamic Friction & Work-Energy Dissipation (Air Track Apparatus)
    2: function(isCalc) {
      const g = isCalc ? 9.8 : 10.0;
      const m = pickRandom([1.5, 2.0, 2.5, 3.0]);
      const vA = pickRandom([10.0, 12.0, 14.0, 15.0]);
      const L = pickRandom([6.0, 8.0, 9.0, 10.0]);
      const mu = pickRandom([0.25, 0.30, 0.35, 0.40]);

      const vB_sq = vA * vA - 2 * mu * g * L;
      const vB = Math.sqrt(Math.max(0.1, vB_sq));
      const workFric = mu * m * g * L;
      const ansRounded = Math.round(vB * 10) / 10;

      const prompt = `
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span>🔬 Laboratory Investigation: Non-Conservative Work &amp; Energy Dissipation</span>
          </div>
          <p class="text-slate-100 text-sm md:text-base leading-relaxed">
            In the laboratory air-track apparatus above, a glider of mass $m = ${m.toFixed(1)}\\text{ kg}$ transits Photogate A at velocity $v_A = ${vA.toFixed(1)}\\text{ m/s}$. It immediately enters a rough test strip of length $L = ${L.toFixed(1)}\\text{ m}$ calibrated with coefficient of kinetic friction $\\mu_k = ${mu.toFixed(2)}$ ($g = ${g.toFixed(1)}\\text{ m/s}^2$).
          </p>
          <p class="text-slate-200 text-sm md:text-base font-semibold">
            Applying the Work-Energy Theorem ($W_{\\text{nc}} = \\Delta K$), what is the velocity $v_B$ of the glider as it emerges through Photogate B?
          </p>
        </div>
      `;

      const choices = [
        { text: `${ansRounded.toFixed(1)} m/s`, isCorrect: true },
        { text: `${(ansRounded + 2.4).toFixed(1)} m/s`, isCorrect: false },
        { text: `${(Math.max(1, ansRounded - 2.8)).toFixed(1)} m/s`, isCorrect: false },
        { text: `${(vA - mu * g * L / vA).toFixed(1)} m/s`, isCorrect: false }
      ];

      const explanation = `**Step 1: Work-Energy Theorem**
$$\\Delta K = K_B - K_A = W_{\\text{fric}}$$
$$\\frac{1}{2}m v_B^2 - \\frac{1}{2}m v_A^2 = -f_k L = -\\mu_k m g L$$

**Step 2: Solve for Velocity $v_B$**
$$v_B = \\sqrt{v_A^2 - 2\\mu_k g L} = \\sqrt{(${vA.toFixed(1)})^2 - 2(${mu.toFixed(2)})(${g.toFixed(1)})(${L.toFixed(1)})} = ${ansRounded.toFixed(1)}\\text{ m/s}$$
Total thermal dissipation: $W_{\\text{dissipated}} = ${(workFric).toFixed(1)}\\text{ J}$.`;

      return {
        unit: 2,
        unitTitle: "Unit 2: Work & Energy (Collegiate Lab)",
        simType: 'drift',
        simData: { m, vA, L, mu, g, isCalculus: isCalc },
        prompt,
        choices: shuffle(choices),
        explanation
      };
    },

    // Unit 3: Centripetal Acceleration & Vertical Loop (Apex Strain Gauge)
    3: function(isCalc) {
      const g = isCalc ? 9.8 : 10.0;
      const m = pickRandom([1.2, 1.5, 2.0]);
      const R = pickRandom([12.0, 15.0, 16.0]);
      const H = Math.round((2.5 * R + pickRandom([6.0, 9.0, 12.0, 15.0])) * 10) / 10;

      const vApexSq = 2 * g * (H - 2 * R);
      const fnApex = m * (vApexSq / R - g);
      const ansRounded = Math.round(fnApex * 10) / 10;

      const prompt = `
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <span>🔬 Laboratory Investigation: Centripetal Dynamics &amp; Apex Track Load</span>
          </div>
          <p class="text-slate-100 text-sm md:text-base leading-relaxed">
            A test assembly of mass $m = ${m.toFixed(1)}\\text{ kg}$ is released from rest at height $H = ${H.toFixed(1)}\\text{ m}$ along a frictionless track into a vertical circular loop of radius $R = ${R.toFixed(1)}\\text{ m}$ ($g = ${g.toFixed(1)}\\text{ m/s}^2$).
          </p>
          <p class="text-slate-200 text-sm md:text-base font-semibold">
            According to Newton's Second Law and the digital strain sensor located at the apex of the loop, what normal force $F_N$ does the track exert downward on the assembly at the exact apex (top)?
          </p>
        </div>
      `;

      const choices = [
        { text: `${ansRounded.toFixed(1)} N`, isCorrect: true },
        { text: `${(ansRounded + m * g).toFixed(1)} N`, isCorrect: false },
        { text: `${(Math.max(1, ansRounded - m * g)).toFixed(1)} N`, isCorrect: false },
        { text: `${(m * vApexSq / R).toFixed(1)} N`, isCorrect: false }
      ];

      const explanation = `**Step 1: Conservation of Mechanical Energy**
$$E_i = m g H = m g (2R) + \\frac{1}{2}m v_{\\text{apex}}^2$$
$$v_{\\text{apex}}^2 = 2g(H - 2R) = 2(${g.toFixed(1)})(${H.toFixed(1)} - ${(2 * R).toFixed(1)}) = ${vApexSq.toFixed(1)}\\text{ m}^2/\\text{s}^2$$

**Step 2: Radial Dynamics at Loop Apex**
Both normal force $F_N$ and gravity $mg$ act downward toward the center:
$$\\Sigma F_r = F_N + mg = \\frac{m v_{\\text{apex}}^2}{R}$$
$$F_N = m \\left( \\frac{v_{\\text{apex}}^2}{R} - g \\right) = ${m.toFixed(1)} \\left( \\frac{${vApexSq.toFixed(1)}}{${R.toFixed(1)}} - ${g.toFixed(1)} \\right) = ${ansRounded.toFixed(1)}\\text{ N}$$`;

      return {
        unit: 3,
        unitTitle: "Unit 3: Circular Motion & Energy (Collegiate Lab)",
        simType: 'coaster',
        simData: { m, H, R, g, isCalculus: isCalc },
        prompt,
        choices: shuffle(choices),
        explanation
      };
    },

    // Unit 4: Damped & Driven Harmonic Oscillator (Oscilloscope Spectrometer)
    4: function(isCalc) {
      const m = pickRandom([1.5, 2.0, 2.5, 3.0]);
      const k = pickRandom([120.0, 150.0, 160.0, 200.0, 240.0]);
      const x0 = pickRandom([0.15, 0.20, 0.25, 0.30]);

      const omega0 = Math.sqrt(k / m);
      const T = (2 * Math.PI) / omega0;
      const vMax = omega0 * x0;
      const ETotal = 0.5 * k * x0 * x0;
      const ansRounded = Math.round(ETotal * 100) / 100;

      const prompt = `
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <span>🔬 Laboratory Investigation: Simple Harmonic Oscillations &amp; Energy</span>
          </div>
          <p class="text-slate-100 text-sm md:text-base leading-relaxed">
            The laboratory oscilloscope apparatus above monitors a low-friction horizontal mass-spring oscillator with mass $m = ${m.toFixed(1)}\\text{ kg}$ and spring stiffness $k = ${k.toFixed(1)}\\text{ N/m}$. The mass is displaced to $x_0 = ${x0.toFixed(2)}\\text{ m}$ and released from rest at $t = 0$.
          </p>
          <p class="text-slate-200 text-sm md:text-base font-semibold">
            Based on the oscilloscope trace $x(t) = x_0 \\cos(\\omega_0 t)$, what is the total mechanical energy $E$ of the oscillating system and its maximum velocity $v_{\\max}$?
          </p>
        </div>
      `;

      const choices = [
        { text: `E = ${ansRounded.toFixed(2)} J,  v_max = ${vMax.toFixed(2)} m/s`, isCorrect: true },
        { text: `E = ${(ansRounded * 2).toFixed(2)} J,  v_max = ${vMax.toFixed(2)} m/s`, isCorrect: false },
        { text: `E = ${ansRounded.toFixed(2)} J,  v_max = ${(vMax * 1.5).toFixed(2)} m/s`, isCorrect: false },
        { text: `E = ${(0.5 * k * x0).toFixed(2)} J,  v_max = ${(omega0).toFixed(2)} m/s`, isCorrect: false }
      ];

      const explanation = `**Step 1: Angular Frequency & Period**
$$\\omega_0 = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{${k.toFixed(1)}}{${m.toFixed(1)}}} = ${omega0.toFixed(2)}\\text{ rad/s}$$
$$T = \\frac{2\\pi}{\\omega_0} = ${T.toFixed(2)}\\text{ s}$$

**Step 2: Total Mechanical Energy & Maximum Velocity**
$$E = \\frac{1}{2} k x_0^2 = \\frac{1}{2}(${k.toFixed(1)})(${x0.toFixed(2)})^2 = ${ansRounded.toFixed(2)}\\text{ J}$$
$$v_{\\max} = \\omega_0 x_0 = (${omega0.toFixed(2)})(${x0.toFixed(2)}) = ${vMax.toFixed(2)}\\text{ m/s}$$`;

      return {
        unit: 4,
        unitTitle: "Unit 4: Simple Harmonic Motion (Collegiate Lab)",
        simType: 'harmonic',
        simData: { m, k, x0, isCalculus: isCalc },
        prompt,
        choices: shuffle(choices),
        explanation
      };
    },

    // Unit 5: Static Equilibrium & Distributed Torque Beam
    5: function(isCalc) {
      const g = isCalc ? 9.8 : 10.0;
      const L = 6.0;
      const Mbeam = pickRandom([6.0, 8.0, 10.0]);
      const xFulcrum = 2.0;
      const m1 = pickRandom([8.0, 10.0, 12.0]);
      const m2 = pickRandom([3.0, 4.0, 5.0]);

      const idealD2 = (m1 * xFulcrum - Mbeam * (L / 2 - xFulcrum)) / m2;
      const ansRounded = Math.round(idealD2 * 100) / 100;

      const prompt = `
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span>🔬 Laboratory Investigation: Static &amp; Rotational Equilibrium ($\\Sigma \\tau = 0$)</span>
          </div>
          <p class="text-slate-100 text-sm md:text-base leading-relaxed">
            A uniform rigid laboratory beam of length $L = ${L.toFixed(1)}\\text{ m}$ and mass $M_b = ${Mbeam.toFixed(1)}\\text{ kg}$ is balanced horizontally on a knife-edge fulcrum placed $x_f = ${xFulcrum.toFixed(1)}\\text{ m}$ from the left end. A load mass $m_1 = ${m1.toFixed(1)}\\text{ kg}$ rests at the far left tip ($x = 0$).
          </p>
          <p class="text-slate-200 text-sm md:text-base font-semibold">
            To achieve complete rotational equilibrium ($\\Sigma \\tau_{\\text{pivot}} = 0$), at what distance $d_2$ to the right of the fulcrum must a counterweight $m_2 = ${m2.toFixed(1)}\\text{ kg}$ be suspended?
          </p>
        </div>
      `;

      const choices = [
        { text: `${ansRounded.toFixed(2)} m`, isCorrect: true },
        { text: `${((m1 * xFulcrum) / m2).toFixed(2)} m`, isCorrect: false },
        { text: `${(ansRounded + 0.65).toFixed(2)} m`, isCorrect: false },
        { text: `${(Math.max(0.5, ansRounded - 0.75)).toFixed(2)} m`, isCorrect: false }
      ];

      const explanation = `**Step 1: Rotational Equilibrium Condition**
$$\\Sigma \\tau_{\\text{pivot}} = 0 \\implies \\tau_{\\text{CCW}} = \\tau_{\\text{CW}}$$

**Step 2: Balance Equation**
$$m_1 g (x_f) = M_b g \\left(\\frac{L}{2} - x_f\\right) + m_2 g (d_2)$$
$$(${m1.toFixed(1)})(${xFulcrum.toFixed(1)}) = (${Mbeam.toFixed(1)})(1.0) + (${m2.toFixed(1)})(d_2)$$
$$d_2 = \\frac{${(m1 * xFulcrum).toFixed(1)} - ${(Mbeam * 1.0).toFixed(1)}}{${m2.toFixed(1)}} = ${ansRounded.toFixed(2)}\\text{ m}$$`;

      return {
        unit: 5,
        unitTitle: "Unit 5: Rotational Equilibrium (Collegiate Lab)",
        simType: 'torque',
        simData: { L, Mbeam, xFulcrum, m1, m2, g, isCalculus: isCalc },
        prompt,
        choices: shuffle(choices),
        explanation
      };
    }
  };

  // --------------------------------------------------------------------------
  // PUBLIC API: CUMULATIVE SPIRAL INTERLEAVING GENERATOR
  // --------------------------------------------------------------------------
  window.RecoveryEngine = {
    generateChallenge: function(courseId, currentUnitInput, forceFormat) {
      const currentUnitNum = parseUnitNumber(currentUnitInput);
      const isCalc = isCalculusCourse(courseId);

      let selectedUnit = currentUnitNum;
      let isSpiralReview = false;

      if (currentUnitNum > 1 && Math.random() < 0.40) {
        selectedUnit = randInt(1, currentUnitNum - 1);
        isSpiralReview = true;
      }

      selectedUnit = Math.max(1, Math.min(5, selectedUnit || 1));

      const format = forceFormat || 'sim';
      let challenge;
      if (format === 'sim') {
        const labGenerator = LAB_SIMULATION_GENERATORS[selectedUnit] || LAB_SIMULATION_GENERATORS[1];
        challenge = labGenerator(isCalc);
        challenge.format = 'sim';
      } else {
        const pool = isCalc ? APPC_GENERATORS : APP1_GENERATORS;
        const gen = pool[selectedUnit] || pool[1];
        challenge = gen();
        challenge.format = 'mcq';
      }

      challenge.isSpiralReview = isSpiralReview;
      challenge.isCalculus = isCalc;
      challenge.activeUnitNum = currentUnitNum;
      challenge.servedUnitNum = selectedUnit;
      challenge.pointsRecovery = 3.5;

      return challenge;
    }
  };

})();

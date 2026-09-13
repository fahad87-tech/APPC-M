import { PhysicsExperimentSample } from '../types/physics';

/**
 * Helper to record a canvas animation into an MP4/WebM blob URL
 */
function recordCanvas(
  canvas: HTMLCanvasElement,
  renderFrame: (ctx: CanvasRenderingContext2D, t: number) => void,
  durationSec: number,
  fps: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not supported'));
      return;
    }

    const stream = canvas.captureStream(fps);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    recorder.start();

    const totalFrames = Math.floor(durationSec * fps);
    let frame = 0;

    const interval = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
        return;
      }
      const t = frame / fps;
      renderFrame(ctx, t);
      frame++;
    }, 1000 / fps);
  });
}

/**
 * Draws a realistic scientific 1-meter or 2-meter calibration ruler on canvas
 */
function drawRuler(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string
) {
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'square';

  // Main ruler bar
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // End ticks
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const perp = angle + Math.PI / 2;
  const tickLen = 14;

  const drawTick = (x: number, y: number, len: number, color = '#f8fafc') => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(perp) * len, y + Math.sin(perp) * len);
    ctx.lineTo(x - Math.cos(perp) * len, y - Math.sin(perp) * len);
    ctx.stroke();
  };

  drawTick(x1, y1, tickLen, '#38bdf8');
  drawTick(x2, y2, tickLen, '#38bdf8');

  // Intermediate cm ticks
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const numDivs = 10;
  for (let i = 1; i < numDivs; i++) {
    const fraction = i / numDivs;
    const tx = x1 + (x2 - x1) * fraction;
    const ty = y1 + (y2 - y1) * fraction;
    drawTick(tx, ty, i === 5 ? 10 : 6, '#94a3b8');
  }

  // Text label
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const midX = (x1 + x2) / 2 + Math.cos(perp) * 16;
  const midY = (y1 + y2) / 2 + Math.sin(perp) * 16;
  ctx.fillText(label, midX, midY);

  ctx.restore();
}

/**
 * Built-in Physics Experiments
 */
export const PHYSICS_SAMPLES: PhysicsExperimentSample[] = [
  {
    id: 'projectile-motion',
    title: 'Parabolic Projectile Motion',
    category: 'Kinematics in 2D',
    description: 'A neon sports ball launched with initial horizontal and vertical velocity under gravity (g = 9.8 m/s²). Includes a 1.00m calibration stick.',
    fps: 30,
    defaultMass: 0.15, // 150g ball
    rulerRealLength: 1.0, // 1 meter
    autoCalibrate: {
      rulerP1: { x: 100, y: 520 },
      rulerP2: { x: 350, y: 520 }, // 250 px = 1 meter -> 250 px/m
      origin: { x: 80, y: 480 },
      invertY: true,
    },
    generator: async (canvas, durationSec = 2.4, fps = 30) => {
      canvas.width = 960;
      canvas.height = 560;

      // Physics parameters:
      // Scale: 250 px = 1 meter
      const ppm = 250;
      const g = 9.8; // m/s^2
      const x0 = 80; // px
      const y0 = 480; // px (floor level)
      const v0x = 1.45; // m/s -> px/s = 1.45 * 250 = 362.5
      const v0y = 4.2; // m/s upward

      const ballRadius = 14;

      return recordCanvas(
        canvas,
        (ctx, t) => {
          // Background - Physics Laboratory wall with subtle grid
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Grid lines (every 50px)
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let gx = 0; gx < canvas.width; gx += 50) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, canvas.height);
            ctx.stroke();
          }
          for (let gy = 0; gy < canvas.height; gy += 50) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(canvas.width, gy);
            ctx.stroke();
          }

          // Ground floor
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 500, canvas.width, 60);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 500);
          ctx.lineTo(canvas.width, 500);
          ctx.stroke();

          // 1.00 Meter Calibration Stick on floor
          drawRuler(ctx, 100, 520, 350, 520, '1.00 m Reference Ruler');

          // Launch Pad / Stand
          ctx.fillStyle = '#334155';
          ctx.fillRect(50, 440, 40, 60);

          // Kinematic position at time t
          const x_m = v0x * t;
          const y_m = Math.max(0, v0y * t - 0.5 * g * t * t);

          const px = x0 + x_m * ppm;
          const py = y0 - y_m * ppm;

          // Ghost trail of previous positions
          const trailSteps = 16;
          for (let s = 1; s <= trailSteps; s++) {
            const pastT = t - (s * 0.04);
            if (pastT > 0) {
              const pastX = x0 + (v0x * pastT) * ppm;
              const pastY = y0 - Math.max(0, v0y * pastT - 0.5 * g * pastT * pastT) * ppm;
              ctx.beginPath();
              ctx.arc(pastX, pastY, ballRadius * (1 - s / 24), 0, Math.PI * 2);
              ctx.fillStyle = `rgba(56, 189, 248, ${0.4 * (1 - s / trailSteps)})`;
              ctx.fill();
            }
          }

          // Ball with gradient and highlight
          const grad = ctx.createRadialGradient(
            px - 4,
            py - 4,
            2,
            px,
            py,
            ballRadius
          );
          grad.addColorStop(0, '#7dd3fc');
          grad.addColorStop(0.5, '#0284c7');
          grad.addColorStop(1, '#0369a1');

          ctx.beginPath();
          ctx.arc(px, py, ballRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center crosshair mark on ball for easy tracking
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px - 5, py);
          ctx.lineTo(px + 5, py);
          ctx.moveTo(px, py - 5);
          ctx.lineTo(px, py + 5);
          ctx.stroke();

          // Live on-screen physics display overlay
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.fillRect(canvas.width - 240, 16, 224, 76);
          ctx.strokeRect(canvas.width - 240, 16, 224, 76);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`TIME: ${t.toFixed(3)} s`, canvas.width - 224, 38);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`FPS: ${fps} | g = 9.80 m/s²`, canvas.width - 224, 56);
          ctx.fillText(`THEORETICAL MODEL`, canvas.width - 224, 74);
        },
        durationSec,
        fps
      );
    },
  },
  {
    id: 'bouncing-ball',
    title: 'Bouncing Ball (Energy Dissipation)',
    category: 'Conservation of Energy',
    description: 'A ball dropped from height h = 1.4m experiencing inelastic collisions with the ground. Demonstrates kinetic, potential, and mechanical energy changes.',
    fps: 30,
    defaultMass: 0.1,
    rulerRealLength: 1.0,
    autoCalibrate: {
      rulerP1: { x: 200, y: 150 },
      rulerP2: { x: 200, y: 450 }, // 300 px = 1.00 m -> 300 px/m
      origin: { x: 480, y: 450 },
      invertY: true,
    },
    generator: async (canvas, durationSec = 3.0, fps = 30) => {
      canvas.width = 960;
      canvas.height = 560;

      const ppm = 300; // 300 px = 1 meter
      const g = 9.8;
      const x0 = 480;
      const groundY = 450;
      const h0 = 1.35; // meters initial height

      // Pre-simulate trajectory for clean rendering
      const dt = 1 / fps;
      const steps = Math.floor(durationSec * fps);
      const heights: number[] = [];
      let y = h0;
      let v = 0;
      const e = 0.76; // coefficient of restitution

      for (let s = 0; s < steps; s++) {
        heights.push(y);
        v -= g * dt;
        y += v * dt;
        if (y <= 0) {
          y = 0;
          v = -v * e;
        }
      }

      return recordCanvas(
        canvas,
        (ctx, t) => {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Vertical ruler
          drawRuler(ctx, 200, 150, 200, 450, '1.00 m Scale');

          // Ground floor
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, groundY, canvas.width, 110);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(canvas.width, groundY);
          ctx.stroke();

          const f = Math.min(Math.floor(t * fps), steps - 1);
          const currentH = heights[f] || 0;
          const py = groundY - currentH * ppm;

          // Ball
          const radius = 16;
          const grad = ctx.createRadialGradient(x0 - 4, py - 4, 2, x0, py, radius);
          grad.addColorStop(0, '#fde047');
          grad.addColorStop(0.6, '#eab308');
          grad.addColorStop(1, '#a16207');

          ctx.beginPath();
          ctx.arc(x0, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Crosshair
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x0 - 5, py);
          ctx.lineTo(x0 + 5, py);
          ctx.moveTo(x0, py - 5);
          ctx.lineTo(x0, py + 5);
          ctx.stroke();

          // Overlay
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(canvas.width - 240, 16, 224, 76);
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.fillText(`TIME: ${t.toFixed(3)} s`, canvas.width - 224, 38);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`HEIGHT: ${currentH.toFixed(3)} m`, canvas.width - 224, 56);
          ctx.fillText(`RESTITUTION e = 0.76`, canvas.width - 224, 74);
        },
        durationSec,
        fps
      );
    },
  },
  {
    id: 'simple-pendulum',
    title: 'Simple Harmonic Pendulum',
    category: 'Harmonic Oscillation',
    description: 'A 0.80m pendulum bob swinging back and forth. Ideal for testing sinusoidal curve fitting, measuring period T, and angular frequency ω.',
    fps: 30,
    defaultMass: 0.2,
    rulerRealLength: 0.8,
    autoCalibrate: {
      rulerP1: { x: 480, y: 100 },
      rulerP2: { x: 480, y: 380 }, // 280 px = 0.80 m -> 350 px/m
      origin: { x: 480, y: 380 },
      invertY: true,
    },
    generator: async (canvas, durationSec = 3.5, fps = 30) => {
      canvas.width = 960;
      canvas.height = 560;

      const pivotX = 480;
      const pivotY = 100;
      const L_px = 280; // corresponds to 0.80m
      const maxAngle = (32 * Math.PI) / 180;
      const g = 9.8;
      const L_m = 0.8;
      const omega = Math.sqrt(g / L_m); // ~3.5 rad/s

      return recordCanvas(
        canvas,
        (ctx, t) => {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Pendulum support mount
          ctx.fillStyle = '#334155';
          ctx.fillRect(pivotX - 60, pivotY - 20, 120, 20);
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#94a3b8';
          ctx.fill();

          // Angle calculation with slight damping
          const theta = maxAngle * Math.exp(-0.06 * t) * Math.cos(omega * t);
          const bobX = pivotX + L_px * Math.sin(theta);
          const bobY = pivotY + L_px * Math.cos(theta);

          // Draw String
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(bobX, bobY);
          ctx.stroke();

          // Reference ruler
          drawRuler(ctx, 160, 100, 160, 380, '0.80 m Length');

          // Bob
          const radius = 18;
          const grad = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, radius);
          grad.addColorStop(0, '#f472b6');
          grad.addColorStop(0.6, '#db2777');
          grad.addColorStop(1, '#9d174d');

          ctx.beginPath();
          ctx.arc(bobX, bobY, radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = '#fbcfe8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Center crosshair
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bobX - 6, bobY);
          ctx.lineTo(bobX + 6, bobY);
          ctx.moveTo(bobX, bobY - 6);
          ctx.lineTo(bobX, bobY + 6);
          ctx.stroke();

          // Live info
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(canvas.width - 240, 16, 224, 76);
          ctx.fillStyle = '#f472b6';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.fillText(`TIME: ${t.toFixed(3)} s`, canvas.width - 224, 38);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`THETA: ${((theta * 180) / Math.PI).toFixed(1)}°`, canvas.width - 224, 56);
          ctx.fillText(`T = 2π√(L/g) ≈ 1.80 s`, canvas.width - 224, 74);
        },
        durationSec,
        fps
      );
    },
  },
];

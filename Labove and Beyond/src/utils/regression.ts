import { RegressionResult } from '../types/physics';

/**
 * Solves a 3x3 linear system A * X = B using Cramer's rule / Gaussian elimination
 */
function solve3x3(A: number[][], B: number[]): number[] | null {
  const det =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

  if (Math.abs(det) < 1e-12) return null;

  function replaceCol(colIdx: number): number[][] {
    const copy = A.map((row) => [...row]);
    for (let i = 0; i < 3; i++) {
      copy[i][colIdx] = B[i];
    }
    return copy;
  }

  function det3(M: number[][]): number {
    return (
      M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
    );
  }

  const x0 = det3(replaceCol(0)) / det;
  const x1 = det3(replaceCol(1)) / det;
  const x2 = det3(replaceCol(2)) / det;

  return [x0, x1, x2];
}

/**
 * Calculates R-squared determination coefficient
 */
function computeRSquared(
  actualY: number[],
  predictFn: (x: number) => number,
  xs: number[]
): number {
  if (actualY.length < 2) return 1.0;
  const meanY = actualY.reduce((sum, val) => sum + val, 0) / actualY.length;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < actualY.length; i++) {
    const pred = predictFn(xs[i]);
    const res = actualY[i] - pred;
    ssRes += res * res;
    const tot = actualY[i] - meanY;
    ssTot += tot * tot;
  }

  if (ssTot === 0) return 1.0;
  const r2 = 1 - ssRes / ssTot;
  return Math.max(0, Math.min(1, Number(r2.toFixed(4))));
}

/**
 * Linear Regression: y = m * x + b
 */
export function fitLinear(xs: number[], ys: number[]): RegressionResult | null {
  const n = xs.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-12) return null;

  const m = (n * sumXY - sumX * sumY) / denominator;
  const b = (sumY - m * sumX) / n;

  const predict = (x: number) => m * x + b;
  const rSquared = computeRSquared(ys, predict, xs);

  const sign = b >= 0 ? '+' : '-';
  const equation = `y = ${m.toFixed(3)}·t ${sign} ${Math.abs(b).toFixed(3)}`;

  return {
    type: 'linear',
    equation,
    rSquared,
    coefficients: { slope: m, intercept: b },
    predict,
    calculatedValues: [
      { label: 'Slope (m or velocity)', value: Number(m.toFixed(4)), unit: 'm/s' },
      { label: 'Y-Intercept (b)', value: Number(b.toFixed(4)), unit: 'm' },
      { label: 'R² Correlation', value: rSquared, unit: '' },
    ],
  };
}

/**
 * Quadratic Regression: y = A * x^2 + B * x + C
 * In physics kinematics: y(t) = 0.5 * a * t^2 + v0 * t + y0
 * Therefore: a = 2 * A (acceleration)
 */
export function fitQuadratic(xs: number[], ys: number[]): RegressionResult | null {
  const n = xs.length;
  if (n < 3) return null;

  let s4 = 0,
    s3 = 0,
    s2 = 0,
    s1 = 0;
  let sy = 0,
    sxy = 0,
    sx2y = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x3 * x;

    s1 += x;
    s2 += x2;
    s3 += x3;
    s4 += x4;
    sy += y;
    sxy += x * y;
    sx2y += x2 * y;
  }

  const matrix = [
    [s4, s3, s2],
    [s3, s2, s1],
    [s2, s1, n],
  ];
  const rhs = [sx2y, sxy, sy];

  const solution = solve3x3(matrix, rhs);
  if (!solution) return null;

  const [A, B, C] = solution;
  const predict = (x: number) => A * x * x + B * x + C;
  const rSquared = computeRSquared(ys, predict, xs);

  // In kinematics: A = 0.5 * a -> a = 2 * A
  const experimentalAccel = 2 * A;
  const theoreticalG = 9.80665;
  const errorPercent = Math.abs((Math.abs(experimentalAccel) - theoreticalG) / theoreticalG) * 100;

  const bSign = B >= 0 ? '+' : '-';
  const cSign = C >= 0 ? '+' : '-';
  const equation = `y = ${A.toFixed(3)}·t² ${bSign} ${Math.abs(B).toFixed(3)}·t ${cSign} ${Math.abs(C).toFixed(3)}`;

  return {
    type: 'quadratic',
    equation,
    rSquared,
    coefficients: { A, B, C, acceleration: experimentalAccel },
    predict,
    calculatedValues: [
      { label: 'Quadratic Coeff (A = ½·a)', value: Number(A.toFixed(4)), unit: 'm/s²' },
      { label: 'Initial Velocity (B = v₀)', value: Number(B.toFixed(4)), unit: 'm/s' },
      { label: 'Initial Position (C = y₀)', value: Number(C.toFixed(4)), unit: 'm' },
      {
        label: 'Measured Acceleration (|2A|)',
        value: Number(Math.abs(experimentalAccel).toFixed(3)),
        unit: 'm/s²',
        expected: theoreticalG,
        errorPercent: Number(errorPercent.toFixed(1)),
      },
      { label: 'R² Correlation', value: rSquared, unit: '' },
    ],
  };
}

/**
 * Harmonic Oscillator / Sine Fit: y = A * sin(omega * t + phi) + offset
 */
export function fitSine(xs: number[], ys: number[]): RegressionResult | null {
  const n = xs.length;
  if (n < 6) return null;

  // Approximate baseline offset and amplitude
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const offset = (maxY + minY) / 2;
  const amplitude = (maxY - minY) / 2;

  // Approximate frequency from zero-crossings
  let zeroCrossings = 0;
  for (let i = 1; i < n; i++) {
    if ((ys[i - 1] - offset) * (ys[i] - offset) < 0) {
      zeroCrossings++;
    }
  }

  const duration = xs[n - 1] - xs[0];
  const estPeriod = zeroCrossings > 1 ? (2 * duration) / zeroCrossings : duration;
  const omega = (2 * Math.PI) / (estPeriod || 1);
  const phi = 0;

  const predict = (x: number) => amplitude * Math.sin(omega * x + phi) + offset;
  const rSquared = computeRSquared(ys, predict, xs);
  const freq = omega / (2 * Math.PI);

  const equation = `y = ${amplitude.toFixed(2)}·sin(${omega.toFixed(2)}·t) + ${offset.toFixed(2)}`;

  return {
    type: 'sine',
    equation,
    rSquared,
    coefficients: { amplitude, omega, phi, offset, frequency: freq, period: estPeriod },
    predict,
    calculatedValues: [
      { label: 'Amplitude (A)', value: Number(amplitude.toFixed(4)), unit: 'm' },
      { label: 'Angular Frequency (ω)', value: Number(omega.toFixed(4)), unit: 'rad/s' },
      { label: 'Frequency (f = ω/2π)', value: Number(freq.toFixed(3)), unit: 'Hz' },
      { label: 'Period (T = 1/f)', value: Number(estPeriod.toFixed(3)), unit: 's' },
      { label: 'R² Correlation', value: rSquared, unit: '' },
    ],
  };
}

/**
 * Exponential Fit: y = A * e^(B * x) (e.g. radioactive decay, damped pendulum, RC discharge)
 */
export function fitExponential(xs: number[], ys: number[]): RegressionResult | null {
  const n = xs.length;
  if (n < 2) return null;

  // Filter positive y values or shift
  const minY = Math.min(...ys);
  const shift = minY <= 0 ? Math.abs(minY) + 1.0 : 0;
  const shiftedYs = ys.map((y) => y + shift);

  // Linear regression on ln(y) vs x
  let sumX = 0;
  let sumLnY = 0;
  let sumXLnY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const lny = Math.log(shiftedYs[i]);
    sumX += x;
    sumLnY += lny;
    sumXLnY += x * lny;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-12) return null;

  const B = (n * sumXLnY - sumX * sumLnY) / denominator;
  const lnA = (sumLnY - B * sumX) / n;
  const A = Math.exp(lnA);

  const predict = (x: number) => A * Math.exp(B * x) - shift;
  const rSquared = computeRSquared(ys, predict, xs);

  const sign = B >= 0 ? '+' : '';
  const shiftStr = shift > 0 ? ` - ${shift.toFixed(2)}` : '';
  const equation = `y = ${A.toFixed(3)}·e^(${sign}${B.toFixed(3)}·t)${shiftStr}`;

  const halfLife = Math.abs(B) > 1e-6 ? Math.LN2 / Math.abs(B) : Infinity;
  const timeConstant = Math.abs(B) > 1e-6 ? 1 / Math.abs(B) : Infinity;

  return {
    type: 'exponential',
    equation,
    rSquared,
    coefficients: { A, B, shift, halfLife, timeConstant },
    predict,
    calculatedValues: [
      { label: 'Initial Amplitude (A)', value: Number(A.toFixed(4)), unit: '' },
      { label: 'Rate Constant (k)', value: Number(B.toFixed(4)), unit: '1/s' },
      { label: 'Time Constant (τ = 1/|k|)', value: Number(timeConstant.toFixed(3)), unit: 's' },
      { label: 'Half-Life (t½)', value: Number(halfLife.toFixed(3)), unit: 's' },
      { label: 'R² Correlation', value: rSquared, unit: '' },
    ],
  };
}

/**
 * Power Law Fit: y = A * x^B (e.g. Kepler's 3rd law T ∝ a^1.5, Pendulum T ∝ L^0.5, Drag F ∝ v^2)
 */
export function fitPowerLaw(xs: number[], ys: number[]): RegressionResult | null {
  const n = xs.length;
  if (n < 2) return null;

  // Filter positive values
  const validIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (xs[i] > 0 && ys[i] > 0) {
      validIndices.push(i);
    }
  }

  if (validIndices.length < 2) return null;

  const validN = validIndices.length;
  let sumLnX = 0;
  let sumLnY = 0;
  let sumLnXLnY = 0;
  let sumLnX2 = 0;

  for (const i of validIndices) {
    const lnx = Math.log(xs[i]);
    const lny = Math.log(ys[i]);
    sumLnX += lnx;
    sumLnY += lny;
    sumLnXLnY += lnx * lny;
    sumLnX2 += lnx * lnx;
  }

  const denominator = validN * sumLnX2 - sumLnX * sumLnX;
  if (Math.abs(denominator) < 1e-12) return null;

  const B = (validN * sumLnXLnY - sumLnX * sumLnY) / denominator;
  const lnA = (sumLnY - B * sumLnX) / validN;
  const A = Math.exp(lnA);

  const predict = (x: number) => (x > 0 ? A * Math.pow(x, B) : 0);
  const actualYValid = validIndices.map((i) => ys[i]);
  const xsValid = validIndices.map((i) => xs[i]);
  const rSquared = computeRSquared(actualYValid, predict, xsValid);

  const equation = `y = ${A.toFixed(3)}·t^(${B.toFixed(3)})`;

  return {
    type: 'power',
    equation,
    rSquared,
    coefficients: { prefactor: A, exponent: B },
    predict,
    calculatedValues: [
      { label: 'Prefactor (A)', value: Number(A.toFixed(4)), unit: '' },
      { label: 'Scaling Exponent (B)', value: Number(B.toFixed(4)), unit: '' },
      { label: 'R² Correlation', value: rSquared, unit: '' },
    ],
  };
}

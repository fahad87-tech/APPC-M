import {
  CalibrationScale,
  CenterOfMassPoint,
  CoordinateOrigin,
  Point2D,
  RawTrackPoint,
  TrackPoint,
  TrackSeries,
} from '../types/physics';

export const STANDARD_GRAVITY = 9.80665; // m/s^2

/**
 * Calculates pixels-per-meter scale factor from the calibration ruler
 */
export function getPixelsPerMeter(scale: CalibrationScale): number {
  if (!scale.isCalibrated || scale.distanceInMeters <= 0) return 100;
  const dx = scale.p2.x - scale.p1.x;
  const dy = scale.p2.y - scale.p1.y;
  const pixelDist = Math.hypot(dx, dy);
  return pixelDist / scale.distanceInMeters;
}

/**
 * Transforms a 2D pixel coordinate into real-world coordinate in meters
 */
export function pixelToMetric(
  pixel: Point2D,
  origin: CoordinateOrigin,
  scale: CalibrationScale
): Point2D {
  const ppm = getPixelsPerMeter(scale);

  // 1. Shift relative to origin
  let dx = pixel.x - origin.origin.x;
  let dy = pixel.y - origin.origin.y;

  // 2. Rotate by coordinate system angle
  if (origin.rotationDeg !== 0) {
    const rad = (-origin.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    dx = rx;
    dy = ry;
  }

  // 3. Invert Y if standard physics convention (upward is positive Y)
  // Invert X if flipped (leftward is positive X)
  const metricX = origin.invertX ? -dx / ppm : dx / ppm;
  const metricY = origin.invertY ? -dy / ppm : dy / ppm;

  return {
    x: Math.abs(metricX) < 1e-12 ? 0 : metricX,
    y: Math.abs(metricY) < 1e-12 ? 0 : metricY,
  };
}

export function convertScaleUnit(
  value: number,
  fromUnit: 'm' | 'cm' | 'mm' | 'ft' | 'in',
  toUnit: 'm' | 'cm' | 'mm' | 'ft' | 'in'
): number {
  const metersFactor: Record<'m' | 'cm' | 'mm' | 'ft' | 'in', number> = {
    m: 1.0,
    cm: 0.01,
    mm: 0.001,
    ft: 0.3048,
    in: 0.0254,
  };
  const meters = value * (metersFactor[fromUnit] || 1.0);
  return meters / (metersFactor[toUnit] || 1.0);
}

/**
 * Transforms a real-world coordinate in meters back to pixel coordinate
 */
export function metricToPixel(
  metric: Point2D,
  origin: CoordinateOrigin,
  scale: CalibrationScale
): Point2D {
  const ppm = getPixelsPerMeter(scale);

  let dx = origin.invertX ? -metric.x * ppm : metric.x * ppm;
  let dy = origin.invertY ? -metric.y * ppm : metric.y * ppm;

  // Reverse rotation
  if (origin.rotationDeg !== 0) {
    const rad = (origin.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    dx = rx;
    dy = ry;
  }

  return {
    x: origin.origin.x + dx,
    y: origin.origin.y + dy,
  };
}

/**
 * Comprehensive physics kinematics, dynamics, momentum, rotational, and energy calculations
 */
export function computeKinematics(
  rawPoints: RawTrackPoint[],
  origin: CoordinateOrigin,
  scale: CalibrationScale,
  mass: number = 0.15,
  g: number = STANDARD_GRAVITY
): TrackPoint[] {
  if (rawPoints.length === 0) return [];

  const timeShift = origin.timeOffset || 0;

  // 1. Convert to metric coordinates, apply time shift, and sort by frame/time
  const sorted = [...rawPoints].sort((a, b) => a.frame - b.frame);
  const points: TrackPoint[] = sorted.map((pt) => {
    const rawTime = pt.rawTime !== undefined ? pt.rawTime : pt.time;
    const shiftedTime = Number((rawTime - timeShift).toFixed(4));

    const metric = pixelToMetric(pt.px, origin, scale);
    const x = Number(metric.x.toFixed(5));
    const y = Number(metric.y.toFixed(5));

    // Polar coordinates
    const r = Number(Math.hypot(x, y).toFixed(5));
    const thetaRad = Math.atan2(y, x);
    const theta = Number(((thetaRad * 180) / Math.PI).toFixed(2));

    return {
      ...pt,
      rawTime,
      time: shiftedTime,
      x,
      y,
      r,
      theta,
      thetaRad,
    };
  });

  const n = points.length;
  if (n === 1) {
    const p0 = points[0];
    p0.vx = 0; p0.vy = 0; p0.v = 0;
    p0.ax = 0; p0.ay = 0; p0.a = 0;
    p0.vr = 0; p0.vtheta = 0; p0.ac = 0; p0.at = 0;
    p0.px_m = 0; p0.py_m = 0; p0.p = 0;
    p0.fx = 0; p0.fy = 0; p0.f = 0;
    p0.omega = 0; p0.alpha = 0; p0.angularMomentum = 0; p0.torque = 0;
    p0.kineticEnergy = 0;
    p0.potentialEnergy = Number((mass * g * p0.y).toFixed(4));
    p0.totalEnergy = p0.potentialEnergy;
    p0.work = 0;
    return points;
  }

  // 2. Numerical differentiation for velocities (Central Difference)
  for (let i = 0; i < n; i++) {
    let vx = 0;
    let vy = 0;
    let vr = 0;
    let omega = 0;

    if (i === 0) {
      const dt = points[1].time - points[0].time;
      if (dt > 0) {
        vx = (points[1].x - points[0].x) / dt;
        vy = (points[1].y - points[0].y) / dt;
        vr = (points[1].r! - points[0].r!) / dt;
        omega = (points[1].thetaRad! - points[0].thetaRad!) / dt;
      }
    } else if (i === n - 1) {
      const dt = points[n - 1].time - points[n - 2].time;
      if (dt > 0) {
        vx = (points[n - 1].x - points[n - 2].x) / dt;
        vy = (points[n - 1].y - points[n - 2].y) / dt;
        vr = (points[n - 1].r! - points[n - 2].r!) / dt;
        omega = (points[n - 1].thetaRad! - points[n - 2].thetaRad!) / dt;
      }
    } else {
      const dt = points[i + 1].time - points[i - 1].time;
      if (dt > 0) {
        vx = (points[i + 1].x - points[i - 1].x) / dt;
        vy = (points[i + 1].y - points[i - 1].y) / dt;
        vr = (points[i + 1].r! - points[i - 1].r!) / dt;
        omega = (points[i + 1].thetaRad! - points[i - 1].thetaRad!) / dt;
      }
    }

    const v = Math.hypot(vx, vy);
    const r = points[i].r || 0.001;
    const vtheta = r * omega;

    points[i].vx = Number(vx.toFixed(4));
    points[i].vy = Number(vy.toFixed(4));
    points[i].v = Number(v.toFixed(4));
    points[i].vr = Number(vr.toFixed(4));
    points[i].vtheta = Number(vtheta.toFixed(4));
    points[i].omega = Number(omega.toFixed(4));

    // Centripetal acceleration
    points[i].ac = Number(((v * v) / Math.max(0.01, r)).toFixed(4));

    // Momentum p = m * v
    points[i].px_m = Number((mass * vx).toFixed(4));
    points[i].py_m = Number((mass * vy).toFixed(4));
    points[i].p = Number((mass * v).toFixed(4));

    // Angular momentum L = m * (x * vy - y * vx)
    const angMom = mass * (points[i].x * vy - points[i].y * vx);
    points[i].angularMomentum = Number(angMom.toFixed(4));

    // Energetics
    const ke = 0.5 * mass * v * v;
    const pe = mass * g * points[i].y;
    points[i].kineticEnergy = Number(ke.toFixed(4));
    points[i].potentialEnergy = Number(pe.toFixed(4));
    points[i].totalEnergy = Number((ke + pe).toFixed(4));
  }

  // Work = delta Ek
  const initialKe = points[0].kineticEnergy || 0;
  for (let i = 0; i < n; i++) {
    points[i].work = Number(((points[i].kineticEnergy || 0) - initialKe).toFixed(4));
  }

  // 3. Numerical differentiation for accelerations
  for (let i = 0; i < n; i++) {
    let ax = 0;
    let ay = 0;
    let at = 0;
    let alpha = 0;

    if (n < 3) {
      const p0 = points[0];
      const p1 = points[1];
      const dt = p1.time - p0.time;
      if (dt > 0 && p1.vx !== undefined && p0.vx !== undefined && p1.vy !== undefined && p0.vy !== undefined) {
        ax = (p1.vx - p0.vx) / dt;
        ay = (p1.vy - p0.vy) / dt;
        at = (p1.v! - p0.v!) / dt;
        alpha = (p1.omega! - p0.omega!) / dt;
      }
    } else {
      if (i === 0) {
        const p0 = points[0];
        const p1 = points[1];
        const dt = p1.time - p0.time;
        if (dt > 0 && p1.vx !== undefined && p0.vx !== undefined && p1.vy !== undefined && p0.vy !== undefined) {
          ax = (p1.vx - p0.vx) / dt;
          ay = (p1.vy - p0.vy) / dt;
          at = (p1.v! - p0.v!) / dt;
          alpha = (p1.omega! - p0.omega!) / dt;
        }
      } else if (i === n - 1) {
        const pLast = points[n - 1];
        const pPrev = points[n - 2];
        const dt = pLast.time - pPrev.time;
        if (dt > 0 && pLast.vx !== undefined && pPrev.vx !== undefined && pLast.vy !== undefined && pPrev.vy !== undefined) {
          ax = (pLast.vx - pPrev.vx) / dt;
          ay = (pLast.vy - pPrev.vy) / dt;
          at = (pLast.v! - pPrev.v!) / dt;
          alpha = (pLast.omega! - pPrev.omega!) / dt;
        }
      } else {
        const pNext = points[i + 1];
        const pPrev = points[i - 1];
        const dt = pNext.time - pPrev.time;
        if (dt > 0 && pNext.vx !== undefined && pPrev.vx !== undefined && pNext.vy !== undefined && pPrev.vy !== undefined) {
          ax = (pNext.vx - pPrev.vx) / dt;
          ay = (pNext.vy - pPrev.vy) / dt;
          at = (pNext.v! - pPrev.v!) / dt;
          alpha = (pNext.omega! - pPrev.omega!) / dt;
        }
      }
    }

    const a = Math.hypot(ax, ay);
    points[i].ax = Number(ax.toFixed(4));
    points[i].ay = Number(ay.toFixed(4));
    points[i].a = Number(a.toFixed(4));
    points[i].at = Number(at.toFixed(4));
    points[i].alpha = Number(alpha.toFixed(4));

    // Force F = m * a
    points[i].fx = Number((mass * ax).toFixed(4));
    points[i].fy = Number((mass * ay).toFixed(4));
    points[i].f = Number((mass * a).toFixed(4));

    // Torque tau = m * (x * ay - y * ax)
    const tq = mass * (points[i].x * ay - points[i].y * ax);
    points[i].torque = Number(tq.toFixed(4));
  }

  return points;
}

/**
 * Calculates the Center of Mass (COM) and total momentum across all tracked series
 */
export function computeCenterOfMass(
  seriesList: TrackSeries[],
  origin: CoordinateOrigin,
  scale: CalibrationScale
): CenterOfMassPoint[] {
  const visibleSeries = seriesList.filter((s) => s.visible && s.points.length > 0);
  if (visibleSeries.length < 2) return [];

  const totalMass = visibleSeries.reduce((sum, s) => sum + s.mass, 0);
  if (totalMass <= 0) return [];

  // Find all unique frame indices present across series
  const allFrames = new Set<number>();
  visibleSeries.forEach((s) => s.points.forEach((p) => allFrames.add(p.frame)));
  const sortedFrames = Array.from(allFrames).sort((a, b) => a - b);

  const comPoints: CenterOfMassPoint[] = [];

  for (const f of sortedFrames) {
    let sumMX = 0;
    let sumMY = 0;
    let sumPX = 0;
    let sumPY = 0;
    let activeMass = 0;
    let frameTime = 0;

    for (const s of visibleSeries) {
      const pt = s.points.find((p) => p.frame === f);
      if (pt) {
        sumMX += s.mass * pt.x;
        sumMY += s.mass * pt.y;
        if (pt.vx !== undefined && pt.vy !== undefined) {
          sumPX += s.mass * pt.vx;
          sumPY += s.mass * pt.vy;
        }
        activeMass += s.mass;
        frameTime = pt.time;
      }
    }

    if (activeMass > 0) {
      const comX = sumMX / activeMass;
      const comY = sumMY / activeMass;
      const comVx = sumPX / activeMass;
      const comVy = sumPY / activeMass;
      const comV = Math.hypot(comVx, comVy);
      const totalP = Math.hypot(sumPX, sumPY);

      const pxPos = metricToPixel({ x: comX, y: comY }, origin, scale);

      comPoints.push({
        frame: f,
        time: frameTime,
        x: Number(comX.toFixed(4)),
        y: Number(comY.toFixed(4)),
        px: pxPos,
        vx: Number(comVx.toFixed(4)),
        vy: Number(comVy.toFixed(4)),
        v: Number(comV.toFixed(4)),
        totalMomentumX: Number(sumPX.toFixed(4)),
        totalMomentumY: Number(sumPY.toFixed(4)),
        totalMomentum: Number(totalP.toFixed(4)),
        totalMass: Number(activeMass.toFixed(3)),
      });
    }
  }

  return comPoints;
}

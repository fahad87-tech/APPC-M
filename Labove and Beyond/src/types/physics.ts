export interface Point2D {
  x: number;
  y: number;
}

export interface CalibrationScale {
  p1: Point2D;
  p2: Point2D;
  distanceInMeters: number;
  displayValue?: number; // e.g. 100 when unit is cm, 1.0 when unit is m
  isCalibrated: boolean;
  unit: 'm' | 'cm' | 'mm' | 'ft' | 'in';
}

export interface CoordinateOrigin {
  origin: Point2D; // in pixel coordinates
  rotationDeg: number; // angle in degrees
  invertY: boolean; // if true, upward is positive y (standard physics convention)
  invertX?: boolean; // if true, leftward is positive x (flipped x-axis)
  timeOffset?: number; // time shift in seconds so t=0 can be set at any frame
}

export interface VideoTrimRange {
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  isTrimmed: boolean;
}

export interface RawTrackPoint {
  id: string;
  frame: number;
  time: number; // in seconds (with timeOffset applied)
  rawTime?: number; // original video time
  px: Point2D; // pixel coordinate on video
}

export interface TrackPoint extends RawTrackPoint {
  // Cartesian Kinematics
  x: number; // real-world x in meters
  y: number; // real-world y in meters
  vx?: number; // velocity x (m/s)
  vy?: number; // velocity y (m/s)
  v?: number; // total speed (m/s)
  ax?: number; // acceleration x (m/s^2)
  ay?: number; // acceleration y (m/s^2)
  a?: number; // total acceleration (m/s^2)

  // Polar Kinematics
  r?: number; // distance from origin (m)
  theta?: number; // angle from +x axis (degrees)
  thetaRad?: number; // angle in radians
  vr?: number; // radial velocity dr/dt (m/s)
  vtheta?: number; // tangential velocity r*dtheta/dt (m/s)
  ac?: number; // centripetal acceleration v^2/r (m/s^2)
  at?: number; // tangential acceleration dv/dt (m/s^2)

  // Dynamics & Momentum
  px_m?: number; // momentum x: p_x = m * v_x (kg·m/s)
  py_m?: number; // momentum y: p_y = m * v_y (kg·m/s)
  p?: number; // total momentum magnitude (kg·m/s)
  fx?: number; // net force x: F_x = m * a_x (N)
  fy?: number; // net force y: F_y = m * a_y (N)
  f?: number; // net force magnitude (N)

  // Rotational Quantities
  omega?: number; // angular velocity dtheta/dt (rad/s)
  alpha?: number; // angular acceleration domega/dt (rad/s^2)
  angularMomentum?: number; // L = r x p = m*(x*vy - y*vx) (kg·m^2/s)
  torque?: number; // tau = r x F = m*(x*ay - y*ax) (N·m)

  // Energetics
  kineticEnergy?: number; // Joules: 0.5 * m * v^2
  potentialEnergy?: number; // Joules: m * g * y
  totalEnergy?: number; // Joules: Ek + Ep
  work?: number; // Joules: delta Ek from initial point
}

export interface TrackSeries {
  id: string;
  name: string;
  color: string;
  points: TrackPoint[];
  mass: number; // in kg (default 0.15 kg)
  visible: boolean;
}

export interface CenterOfMassPoint {
  frame: number;
  time: number;
  x: number; // m
  y: number; // m
  px: Point2D; // screen pixel position
  vx?: number; // m/s
  vy?: number; // m/s
  v?: number; // m/s
  totalMomentumX?: number; // kg·m/s
  totalMomentumY?: number; // kg·m/s
  totalMomentum?: number; // kg·m/s
  totalMass: number; // kg
}

export interface VectorDisplayOptions {
  showVelocity: boolean;
  showAcceleration: boolean;
  showForce: boolean;
  showCenterOfMass: boolean;
  showStrobe: boolean;
  showPolar: boolean;
  vectorScale: number; // multiplier for vector arrow lengths
  showDataMarkers?: boolean; // toggle visibility of tracked data markers on video canvas
  showAccelerationLines?: boolean; // toggle horizontal and vertical reference lines passing through the mass showing acceleration / deceleration
}

export type VariableType =
  // Position
  | 'y'
  | 'x'
  | 'trajectory'
  | 'r'
  | 'theta'
  // Velocity
  | 'vy'
  | 'vx'
  | 'v'
  | 'vr'
  | 'vtheta'
  | 'omega'
  // Acceleration
  | 'ay'
  | 'ax'
  | 'a'
  | 'ac'
  | 'at'
  | 'alpha'
  // Momentum & Forces
  | 'px_m'
  | 'py_m'
  | 'p'
  | 'fx'
  | 'fy'
  | 'f'
  | 'angularMomentum'
  | 'torque'
  // Energetics
  | 'kineticEnergy'
  | 'potentialEnergy'
  | 'totalEnergy'
  | 'work';

export interface VariableMeta {
  key: VariableType;
  label: string;
  symbol: string;
  unit: string;
  yAxisLabel: string;
  color: string;
  category: 'Position' | 'Velocity' | 'Acceleration' | 'Dynamics' | 'Rotational' | 'Energy';
  description: string;
}

export type ViewMode = 'split' | 'tracker' | 'graph' | 'table' | 'sound' | 'physics-suites' | 'notebook';

export interface NotebookCard {
  id: string;
  type: 'hypothesis' | 'protocol' | 'text' | 'snapshot' | 'graph' | 'sound' | 'physics-suite' | 'conclusion';
  title: string;
  content: string;
  imageUrl?: string;
  dataSnippet?: Record<string, string | number>;
  timestamp: string;
}

export interface LabNotebookState {
  title: string;
  author: string;
  date: string;
  description: string;
  cards: NotebookCard[];
  activeLabId?: string;
  partnerName?: string;
  courseName?: string;
  answers?: Record<string, string>;
  studentValues?: Record<string, number>;
}

export type ActiveTool = 'track' | 'autotrack' | 'ruler' | 'origin' | 'pan' | 'delete';

export interface AutotrackConfig {
  templateSize: number; // width & height of template box (e.g. 24px)
  searchRadius: number; // search area radius around predicted position (e.g. 35px)
  threshold: number; // match score threshold (0.5 to 0.95, default 0.65)
  autoAdvance: boolean;
  evolutionRate: number; // 0 to 0.3 template adaptation
}

export interface AutotrackTemplate {
  imageData: ImageData;
  width: number;
  height: number;
  centerPx: Point2D;
  frame: number;
  time: number;
}

export interface AutotrackMatchResult {
  found: boolean;
  bestPoint: Point2D;
  score: number;
  searchWindow: { x: number; y: number; width: number; height: number };
}

export interface RegressionResult {
  type: 'linear' | 'quadratic' | 'sine' | 'exponential' | 'power';
  equation: string;
  formulaTex?: string;
  rSquared: number;
  coefficients: { [key: string]: number };
  predict: (x: number) => number;
  calculatedValues?: {
    label: string;
    value: number;
    unit: string;
    expected?: number;
    errorPercent?: number;
  }[];
}

export interface PhysicsExperimentSample {
  id: string;
  title: string;
  source?: 'FizziQ' | 'Tracker' | 'Simulated';
  category: string;
  description: string;
  videoUrl?: string; // real local or remote video url
  posterUrl?: string; // thumbnail poster url
  fps: number;
  defaultMass: number;
  rulerRealLength: number;
  autoCalibrate: {
    rulerP1: Point2D;
    rulerP2: Point2D;
    origin: Point2D;
    invertY: boolean;
    invertX?: boolean;
  };
  sampleTrackPoints?: { frame: number; time: number; px: Point2D }[];
  sampleSeriesList?: {
    id: string;
    name: string;
    color: string;
    mass: number;
    points: { frame: number; time: number; px: Point2D }[];
  }[];
  generator?: (canvas: HTMLCanvasElement, durationSec?: number, fps?: number) => Promise<string>;
}

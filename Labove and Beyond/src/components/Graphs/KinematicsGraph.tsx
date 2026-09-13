import React, { useState, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import {
  NotebookCard,
  RegressionResult,
  TrackSeries,
  VariableMeta,
  VariableType,
} from '../../types/physics';
import {
  TrendingUp,
  Download,
  BookOpen,
  Plus,
  X,
  LayoutGrid,
  Rows,
  Grid2X2,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Table,
} from 'lucide-react';
import { CurveFitModal } from './CurveFitModal';

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  annotationPlugin
);

export const VARIABLES_META: Record<VariableType, VariableMeta> = {
  // Position
  y: {
    key: 'y',
    label: 'Height Y(t)',
    symbol: 'y',
    unit: 'm',
    yAxisLabel: 'Vertical Position y (meters)',
    color: '#2563eb',
    category: 'Position',
    description: 'Vertical coordinate over time',
  },
  x: {
    key: 'x',
    label: 'Position X(t)',
    symbol: 'x',
    unit: 'm',
    yAxisLabel: 'Horizontal Position x (meters)',
    color: '#0284c7',
    category: 'Position',
    description: 'Horizontal coordinate over time',
  },
  trajectory: {
    key: 'trajectory',
    label: 'Trajectory Y(X)',
    symbol: 'y(x)',
    unit: 'm',
    yAxisLabel: 'Vertical Position y (meters)',
    color: '#7c3aed',
    category: 'Position',
    description: '2D Trajectory curve (y vs x)',
  },
  r: {
    key: 'r',
    label: 'Polar Radius R(t)',
    symbol: 'r',
    unit: 'm',
    yAxisLabel: 'Distance r (meters)',
    color: '#0d9488',
    category: 'Position',
    description: 'Distance from origin: r = √(x² + y²)',
  },
  theta: {
    key: 'theta',
    label: 'Polar Angle θ(t)',
    symbol: 'θ',
    unit: '°',
    yAxisLabel: 'Angle θ (degrees)',
    color: '#059669',
    category: 'Position',
    description: 'Polar angle from positive X axis',
  },

  // Velocity
  vy: {
    key: 'vy',
    label: 'Vertical Velocity Vy(t)',
    symbol: 'vy',
    unit: 'm/s',
    yAxisLabel: 'Velocity vy (m/s)',
    color: '#059669',
    category: 'Velocity',
    description: 'Vertical velocity component: dy/dt',
  },
  vx: {
    key: 'vx',
    label: 'Horizontal Velocity Vx(t)',
    symbol: 'vx',
    unit: 'm/s',
    yAxisLabel: 'Velocity vx (m/s)',
    color: '#10b981',
    category: 'Velocity',
    description: 'Horizontal velocity component: dx/dt',
  },
  v: {
    key: 'v',
    label: 'Speed V(t)',
    symbol: 'v',
    unit: 'm/s',
    yAxisLabel: 'Speed v (m/s)',
    color: '#d97706',
    category: 'Velocity',
    description: 'Total speed magnitude: √(vx² + vy²)',
  },
  vr: {
    key: 'vr',
    label: 'Radial Velocity Vr(t)',
    symbol: 'vr',
    unit: 'm/s',
    yAxisLabel: 'Radial Velocity vr (m/s)',
    color: '#0891b2',
    category: 'Velocity',
    description: 'Rate of change of distance: dr/dt',
  },
  vtheta: {
    key: 'vtheta',
    label: 'Tangential Velocity Vθ(t)',
    symbol: 'vθ',
    unit: 'm/s',
    yAxisLabel: 'Tangential Velocity vθ (m/s)',
    color: '#4f46e5',
    category: 'Velocity',
    description: 'Perpendicular velocity: r · dθ/dt',
  },
  omega: {
    key: 'omega',
    label: 'Angular Velocity ω(t)',
    symbol: 'ω',
    unit: 'rad/s',
    yAxisLabel: 'Angular Velocity ω (rad/s)',
    color: '#9333ea',
    category: 'Rotational',
    description: 'Rate of angular change: dθ/dt',
  },

  // Acceleration
  ay: {
    key: 'ay',
    label: 'Vertical Accel Ay(t)',
    symbol: 'ay',
    unit: 'm/s²',
    yAxisLabel: 'Acceleration ay (m/s²)',
    color: '#dc2626',
    category: 'Acceleration',
    description: 'Vertical acceleration (gravity in free fall)',
  },
  ax: {
    key: 'ax',
    label: 'Horizontal Accel Ax(t)',
    symbol: 'ax',
    unit: 'm/s²',
    yAxisLabel: 'Acceleration ax (m/s²)',
    color: '#e11d48',
    category: 'Acceleration',
    description: 'Horizontal acceleration: dvx/dt',
  },
  a: {
    key: 'a',
    label: 'Total Accel A(t)',
    symbol: 'a',
    unit: 'm/s²',
    yAxisLabel: 'Acceleration a (m/s²)',
    color: '#b91c1c',
    category: 'Acceleration',
    description: 'Total acceleration magnitude: √(ax² + ay²)',
  },
  ac: {
    key: 'ac',
    label: 'Centripetal Accel Ac(t)',
    symbol: 'ac',
    unit: 'm/s²',
    yAxisLabel: 'Centripetal Accel ac (m/s²)',
    color: '#ea580c',
    category: 'Acceleration',
    description: 'Inward normal acceleration: v² / r',
  },
  at: {
    key: 'at',
    label: 'Tangential Accel At(t)',
    symbol: 'at',
    unit: 'm/s²',
    yAxisLabel: 'Tangential Accel at (m/s²)',
    color: '#c026d3',
    category: 'Acceleration',
    description: 'Rate of change of speed: dv/dt',
  },
  alpha: {
    key: 'alpha',
    label: 'Angular Accel α(t)',
    symbol: 'α',
    unit: 'rad/s²',
    yAxisLabel: 'Angular Accel α (rad/s²)',
    color: '#7e22ce',
    category: 'Rotational',
    description: 'Angular acceleration: dω/dt',
  },

  // Momentum & Dynamics
  px_m: {
    key: 'px_m',
    label: 'Momentum Px(t)',
    symbol: 'px',
    unit: 'kg·m/s',
    yAxisLabel: 'Momentum px (kg·m/s)',
    color: '#0284c7',
    category: 'Dynamics',
    description: 'Horizontal momentum: m · vx',
  },
  py_m: {
    key: 'py_m',
    label: 'Momentum Py(t)',
    symbol: 'py',
    unit: 'kg·m/s',
    yAxisLabel: 'Momentum py (kg·m/s)',
    color: '#2563eb',
    category: 'Dynamics',
    description: 'Vertical momentum: m · vy',
  },
  p: {
    key: 'p',
    label: 'Total Momentum P(t)',
    symbol: 'p',
    unit: 'kg·m/s',
    yAxisLabel: 'Total Momentum p (kg·m/s)',
    color: '#1d4ed8',
    category: 'Dynamics',
    description: 'Total momentum magnitude: m · v',
  },
  fx: {
    key: 'fx',
    label: 'Net Force Fx(t)',
    symbol: 'Fx',
    unit: 'N',
    yAxisLabel: 'Force Fx (Newtons)',
    color: '#7c3aed',
    category: 'Dynamics',
    description: 'Horizontal net force: m · ax',
  },
  fy: {
    key: 'fy',
    label: 'Net Force Fy(t)',
    symbol: 'Fy',
    unit: 'N',
    yAxisLabel: 'Force Fy (Newtons)',
    color: '#9333ea',
    category: 'Dynamics',
    description: 'Vertical net force: m · ay',
  },
  f: {
    key: 'f',
    label: 'Net Force F(t)',
    symbol: 'F',
    unit: 'N',
    yAxisLabel: 'Net Force F (Newtons)',
    color: '#6b21a8',
    category: 'Dynamics',
    description: 'Total net force: m · a',
  },
  angularMomentum: {
    key: 'angularMomentum',
    label: 'Angular Momentum L(t)',
    symbol: 'L',
    unit: 'kg·m²/s',
    yAxisLabel: 'Angular Momentum L (kg·m²/s)',
    color: '#a21caf',
    category: 'Rotational',
    description: 'Angular momentum: m · (x·vy - y·vx)',
  },
  torque: {
    key: 'torque',
    label: 'Torque τ(t)',
    symbol: 'τ',
    unit: 'N·m',
    yAxisLabel: 'Torque τ (N·m)',
    color: '#be185d',
    category: 'Rotational',
    description: 'Torque about origin: m · (x·ay - y·ax)',
  },

  // Energetics
  kineticEnergy: {
    key: 'kineticEnergy',
    label: 'Kinetic Energy Ek',
    symbol: 'Ek',
    unit: 'J',
    yAxisLabel: 'Kinetic Energy (Joules)',
    color: '#ea580c',
    category: 'Energy',
    description: 'Kinetic energy: ½ · m · v²',
  },
  potentialEnergy: {
    key: 'potentialEnergy',
    label: 'Potential Energy Ep',
    symbol: 'Ep',
    unit: 'J',
    yAxisLabel: 'Potential Energy (Joules)',
    color: '#2563eb',
    category: 'Energy',
    description: 'Gravitational potential energy: m · g · y',
  },
  totalEnergy: {
    key: 'totalEnergy',
    label: 'Total Mechanical Energy Em',
    symbol: 'Em',
    unit: 'J',
    yAxisLabel: 'Mechanical Energy (Joules)',
    color: '#db2777',
    category: 'Energy',
    description: 'Mechanical energy: Ek + Ep',
  },
  work: {
    key: 'work',
    label: 'Work Done W(t)',
    symbol: 'W',
    unit: 'J',
    yAxisLabel: 'Work (Joules)',
    color: '#059669',
    category: 'Energy',
    description: 'Work done by forces: ΔEk from t=0',
  },
};

interface SinglePlotProps {
  id?: string;
  plotNumber?: number;
  variable: VariableType;
  onChangeVariable: (v: VariableType) => void;
  seriesList: TrackSeries[];
  activeSeriesId: string;
  currentTime: number;
  hoveredPointTime: number | null;
  onHoverPoint: (time: number | null) => void;
  onSeekTime: (time: number) => void;
  fitResult: RegressionResult | null;
  onOpenFitModal: () => void;
  onClearFit: () => void;
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
  onRemove?: () => void;
  canRemove?: boolean;
  showInfo?: boolean;
  onToggleInfo?: () => void;
}

const SinglePlot: React.FC<SinglePlotProps> = ({
  plotNumber,
  variable,
  onChangeVariable,
  seriesList,
  activeSeriesId,
  currentTime,
  hoveredPointTime,
  onHoverPoint,
  onSeekTime,
  fitResult,
  onOpenFitModal,
  onClearFit,
  onAddToNotebook,
  onRemove,
  canRemove,
  showInfo,
  onToggleInfo,
}) => {
  const chartRef = useRef<any>(null);
  const meta = VARIABLES_META[variable] || VARIABLES_META.y;
  const isTrajectory = variable === 'trajectory';
  const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];

  const [internalShowInfo, setInternalShowInfo] = useState<boolean>(false);
  const isInfoOpen = showInfo !== undefined ? showInfo : internalShowInfo;
  const handleToggleInfo = onToggleInfo || (() => setInternalShowInfo((prev) => !prev));
  const [infoTab, setInfoTab] = useState<'stats' | 'physics' | 'table'>('stats');

  // Compute valid points, instantaneous numerical slopes and values
  const validPoints = useMemo(() => {
    if (!activeSeries) return [];
    const pts = activeSeries.points.filter((pt) => {
      if (isTrajectory) return pt.x !== undefined && pt.y !== undefined;
      const v = pt[variable as keyof typeof pt];
      return typeof v === 'number' && !isNaN(v);
    });

    return pts.map((pt, idx, arr) => {
      const val = (isTrajectory ? pt.y : (pt as any)[variable]) as number;
      let slope = 0;
      if (arr.length > 1) {
        if (idx === 0) {
          const nextVal = (isTrajectory ? arr[1].y : (arr[1] as any)[variable]) as number;
          const dt = isTrajectory ? (arr[1].x - pt.x) : (arr[1].time - pt.time);
          slope = dt !== 0 ? (nextVal - val) / dt : 0;
        } else if (idx === arr.length - 1) {
          const prevVal = (isTrajectory ? arr[idx - 1].y : (arr[idx - 1] as any)[variable]) as number;
          const dt = isTrajectory ? (pt.x - arr[idx - 1].x) : (pt.time - arr[idx - 1].time);
          slope = dt !== 0 ? (val - prevVal) / dt : 0;
        } else {
          const nextVal = (isTrajectory ? arr[idx + 1].y : (arr[idx + 1] as any)[variable]) as number;
          const prevVal = (isTrajectory ? arr[idx - 1].y : (arr[idx - 1] as any)[variable]) as number;
          const dt = isTrajectory ? (arr[idx + 1].x - arr[idx - 1].x) : (arr[idx + 1].time - arr[idx - 1].time);
          slope = dt !== 0 ? (nextVal - prevVal) / dt : 0;
        }
      }
      return {
        ...pt,
        val,
        slope,
      };
    });
  }, [activeSeries, variable, isTrajectory]);

  // Closest point to current timeline
  const currentPoint = useMemo(() => {
    if (validPoints.length === 0) return null;
    return validPoints.reduce((closest, pt) =>
      Math.abs(pt.time - currentTime) < Math.abs(closest.time - currentTime) ? pt : closest
    );
  }, [validPoints, currentTime]);

  // Numerical trapezoidal integration up to currentTime
  const integralValue = useMemo(() => {
    if (validPoints.length < 2 || isTrajectory) return 0;
    let area = 0;
    for (let i = 1; i < validPoints.length; i++) {
      const prev = validPoints[i - 1];
      const curr = validPoints[i];
      if (curr.time > currentTime) {
        if (prev.time < currentTime) {
          const fraction = (currentTime - prev.time) / (curr.time - prev.time);
          const interpVal = prev.val + fraction * (curr.val - prev.val);
          area += ((prev.val + interpVal) / 2) * (currentTime - prev.time);
        }
        break;
      }
      area += ((prev.val + curr.val) / 2) * (curr.time - prev.time);
    }
    return area;
  }, [validPoints, currentTime, isTrajectory]);

  // Dataset statistical summary
  const stats = useMemo(() => {
    if (validPoints.length === 0) return null;
    const vals = validPoints.map((p) => p.val);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const minPt = validPoints.find((p) => p.val === minVal);
    const maxPt = validPoints.find((p) => p.val === maxVal);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const peakToPeak = maxVal - minVal;

    return {
      count: vals.length,
      min: minVal,
      minTime: minPt ? (isTrajectory ? minPt.x : minPt.time) : 0,
      max: maxVal,
      maxTime: maxPt ? (isTrajectory ? maxPt.x : maxPt.time) : 0,
      mean,
      stdDev,
      peakToPeak,
    };
  }, [validPoints, isTrajectory]);

  const chartData = useMemo(() => {
    const datasets: any[] = [];

    seriesList.forEach((series) => {
      if (!series.visible) return;

      const pts = series.points.filter((pt) => {
        if (isTrajectory) return pt.x !== undefined && pt.y !== undefined;
        const val = pt[variable as keyof typeof pt];
        return typeof val === 'number' && !isNaN(val);
      });

      const data = pts.map((pt) => ({
        x: isTrajectory ? pt.x : pt.time,
        y: isTrajectory ? pt.y : (pt[variable as keyof typeof pt] as number),
        time: pt.time,
      }));

      datasets.push({
        label: `${series.name} (${meta.symbol})`,
        data,
        borderColor: series.color,
        backgroundColor: series.color,
        borderWidth: 2.5,
        pointRadius: 3.5,
        pointHoverRadius: 6.5,
        pointBackgroundColor: series.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        tension: 0.35, // Smooth natural cubic spline curve
      });
    });

    if (fitResult) {
      const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];
      if (activeSeries && activeSeries.points.length > 1) {
        const xValues = activeSeries.points.map((pt) => (isTrajectory ? pt.x : pt.time));
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const steps = 60;
        const fitData = [];
        for (let i = 0; i <= steps; i++) {
          const x = minX + ((maxX - minX) * i) / steps;
          fitData.push({ x, y: fitResult.predict(x) });
        }

        datasets.push({
          label: `Fit: ${fitResult.equation}`,
          data: fitData,
          borderColor: '#d97706',
          borderWidth: 2.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.25,
        });
      }
    }

    return { datasets };
  }, [seriesList, variable, isTrajectory, meta, fitResult, activeSeriesId]);

  const options: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#334155',
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' },
            boxWidth: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#38bdf8',
          bodyColor: '#ffffff',
          titleFont: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
          bodyFont: { family: 'JetBrains Mono', size: 11 },
          borderColor: '#cbd5e1',
          borderWidth: 1,
          padding: 8,
          callbacks: {
            title: (items) => {
              if (!items || items.length === 0 || !items[0].parsed) return '';
              const raw = items[0].raw as any;
              const xVal = items[0].parsed.x ?? 0;
              return isTrajectory
                ? `x = ${xVal.toFixed(3)} m`
                : `t = ${raw && raw.time !== undefined ? raw.time.toFixed(3) : xVal.toFixed(3)} s`;
            },
            label: (item) => {
              const yVal =
                item.parsed && item.parsed.y !== null && item.parsed.y !== undefined
                  ? item.parsed.y.toFixed(3)
                  : '0.000';
              return ` ${item.dataset.label}: ${yVal} ${meta.unit}`;
            },
          },
        },
        annotation: {
          annotations: isTrajectory
            ? {}
            : {
                timeLine: {
                  type: 'line',
                  xMin: currentTime,
                  xMax: currentTime,
                  borderColor: '#2563eb',
                  borderWidth: 2,
                  borderDash: [4, 4],
                  label: {
                    display: true,
                    content: `t = ${currentTime.toFixed(2)}s`,
                    position: 'start',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    font: { size: 10, family: 'JetBrains Mono', weight: 'bold' },
                  },
                },
              },
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: isTrajectory ? 'Horizontal Position x (meters)' : 'Time t (seconds)',
            color: '#475569',
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' },
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.8)',
          },
          ticks: {
            color: '#64748b',
            font: { family: 'JetBrains Mono', size: 10 },
          },
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: meta.yAxisLabel,
            color: '#475569',
            font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' },
          },
          grid: {
            color: 'rgba(226, 232, 240, 0.8)',
          },
          ticks: {
            color: '#64748b',
            font: { family: 'JetBrains Mono', size: 10 },
          },
        },
      },
      onHover: (_event, elements) => {
        if (elements && elements.length > 0) {
          const el = elements[0];
          const ds = chartData.datasets[el.datasetIndex];
          const pt = ds?.data[el.index] as any;
          if (pt && pt.time !== undefined) {
            onHoverPoint(pt.time);
          }
        } else {
          if (hoveredPointTime !== null) onHoverPoint(null);
        }
      },
      onClick: (_event, elements) => {
        if (elements && elements.length > 0) {
          const el = elements[0];
          const ds = chartData.datasets[el.datasetIndex];
          const pt = ds?.data[el.index] as any;
          if (pt && pt.time !== undefined) {
            onSeekTime(pt.time);
          }
        }
      },
    };
  }, [currentTime, meta, isTrajectory, chartData, hoveredPointTime, onHoverPoint, onSeekTime]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs overflow-hidden">
      {/* Plot Toolbar */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1.5 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {plotNumber !== undefined && (
            <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
              {plotNumber}
            </span>
          )}
          <select
            value={variable}
            onChange={(e) => onChangeVariable(e.target.value as VariableType)}
            className="bg-slate-50 text-blue-700 font-bold text-xs rounded-lg border border-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-xs max-w-[150px] sm:max-w-none"
          >
            <optgroup label="📍 Position & Trajectory">
              <option value="y">Height Y(t) [meters]</option>
              <option value="x">Position X(t) [meters]</option>
              <option value="trajectory">2D Trajectory Y(X) [meters]</option>
              <option value="r">Polar Distance R(t) [meters]</option>
              <option value="theta">Polar Angle θ(t) [deg]</option>
            </optgroup>
            <optgroup label="⚡ Velocities">
              <option value="vy">Vertical Velocity Vy(t) [m/s]</option>
              <option value="vx">Horizontal Velocity Vx(t) [m/s]</option>
              <option value="v">Speed V(t) [m/s]</option>
              <option value="vr">Radial Velocity Vr(t) [m/s]</option>
              <option value="vtheta">Tangential Velocity Vθ(t) [m/s]</option>
              <option value="omega">Angular Velocity ω(t) [rad/s]</option>
            </optgroup>
            <optgroup label="🚀 Accelerations">
              <option value="ay">Vertical Accel Ay(t) [m/s²]</option>
              <option value="ax">Horizontal Accel Ax(t) [m/s²]</option>
              <option value="a">Total Accel A(t) [m/s²]</option>
              <option value="ac">Centripetal Accel Ac(t) [m/s²]</option>
              <option value="at">Tangential Accel At(t) [m/s²]</option>
              <option value="alpha">Angular Accel α(t) [rad/s²]</option>
            </optgroup>
            <optgroup label="💥 Dynamics & Momentum">
              <option value="p">Total Momentum P(t) [kg·m/s]</option>
              <option value="px_m">Momentum Px(t) [kg·m/s]</option>
              <option value="py_m">Momentum Py(t) [kg·m/s]</option>
              <option value="f">Net Force F(t) [Newtons]</option>
              <option value="angularMomentum">Angular Momentum L(t) [kg·m²/s]</option>
              <option value="torque">Torque τ(t) [N·m]</option>
            </optgroup>
            <optgroup label="🔋 Energetics">
              <option value="kineticEnergy">Kinetic Energy Ek [J]</option>
              <option value="potentialEnergy">Potential Energy Ep [J]</option>
              <option value="totalEnergy">Total Mechanical Energy Em [J]</option>
              <option value="work">Work Done W(t) [J]</option>
            </optgroup>
          </select>

          <span className="text-[11px] text-slate-500 font-medium hidden 2xl:inline truncate max-w-[200px]">
            {meta.description}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {fitResult && (
            <button
              onClick={onClearFit}
              className="text-[10px] text-slate-500 hover:text-rose-600 underline font-mono"
            >
              Clear Fit
            </button>
          )}

          <button
            onClick={onOpenFitModal}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition shadow-xs"
            title="Mathematical curve fitting & physics regression"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit</span>
          </button>

          <button
            onClick={() => {
              if (chartRef.current) {
                const url = chartRef.current.toBase64Image();
                const a = document.createElement('a');
                a.download = `graph_${variable}_export.png`;
                a.href = url;
                a.click();
              }
            }}
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition shadow-xs"
            title="Download High-Resolution Graph Image (PNG)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onAddToNotebook && (
            <button
              onClick={() => {
                const imgUrl = chartRef.current ? chartRef.current.toBase64Image() : undefined;
                const activeS = seriesList.find((s) => s.id === activeSeriesId);
                const snippet: Record<string, string | number> = {
                  'Plot Index': `#${plotNumber || 1}`,
                  'Variable Plotted': meta.label,
                  'Active Object': activeS?.name || 'Object 1',
                  'Total Points': activeS?.points.length || 0,
                };
                if (fitResult) {
                  snippet['Model Equation'] = fitResult.equation;
                  snippet['R² Correlation'] = fitResult.rSquared.toFixed(4);
                  if (fitResult.calculatedValues) {
                    fitResult.calculatedValues.forEach((cv) => {
                      snippet[cv.label] = `${cv.value.toFixed(3)} ${cv.unit}`;
                    });
                  }
                }

                onAddToNotebook({
                  type: 'graph',
                  title: `Kinematics Graph #${plotNumber || 1}: ${meta.label}`,
                  content: fitResult
                    ? `Mathematical regression fit for ${meta.label}: ${fitResult.equation} with correlation coefficient R² = ${fitResult.rSquared.toFixed(4)}.`
                    : `Kinematic graph of ${meta.label} recorded across ${activeS?.points.length || 0} tracking frames.`,
                  imageUrl: imgUrl,
                  dataSnippet: snippet,
                });
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs"
              title="Add this graph & fit to Digital Lab Notebook"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notebook</span>
            </button>
          )}

          {/* Toggle Information View below this graph */}
          <button
            onClick={handleToggleInfo}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-bold transition shadow-xs ${
              isInfoOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
            title="Toggle detailed statistics, slope, area, and coordinates view below this graph"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Info View</span>
            {isInfoOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {canRemove && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shadow-xs ml-0.5"
              title="Close this graph pane"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[120px] relative w-full h-full">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Information View Panel (Positioned directly below this graph) */}
      {isInfoOpen && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-200 bg-slate-50/90 rounded-lg p-2 flex flex-col gap-1.5 shrink-0 max-h-[180px] overflow-hidden border border-slate-200/80 shadow-inner">
          {/* Tab Header */}
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3 h-3 text-indigo-600" />
                Info #{plotNumber || 1}:
              </span>
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-md border border-slate-300/80 text-[10px]">
                <button
                  onClick={() => setInfoTab('stats')}
                  className={`px-1.5 py-0.5 rounded font-bold transition ${
                    infoTab === 'stats'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 Stats & Calculus
                </button>
                <button
                  onClick={() => setInfoTab('physics')}
                  className={`px-1.5 py-0.5 rounded font-bold transition ${
                    infoTab === 'physics'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📐 Physics & Model
                </button>
                <button
                  onClick={() => setInfoTab('table')}
                  className={`px-1.5 py-0.5 rounded font-bold transition ${
                    infoTab === 'table'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 Data Table
                </button>
              </div>
            </div>

            <button
              onClick={handleToggleInfo}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              title="Hide information panel below this graph"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab 1: Stats & Calculus */}
          {infoTab === 'stats' && (
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1.5">
              {/* Instantaneous row */}
              <div className="grid grid-cols-3 gap-1 shrink-0">
                <div className="bg-blue-50/90 border border-blue-200 rounded p-1">
                  <div className="text-[9px] text-blue-600 font-bold uppercase truncate">
                    {meta.symbol} (t={currentTime.toFixed(2)}s)
                  </div>
                  <div className="text-[11px] font-black text-blue-900 font-mono">
                    {currentPoint ? `${currentPoint.val.toFixed(3)} ${meta.unit}` : '---'}
                  </div>
                </div>
                <div className="bg-emerald-50/90 border border-emerald-200 rounded p-1">
                  <div className="text-[9px] text-emerald-600 font-bold uppercase truncate">
                    Slope d({meta.symbol})/dt
                  </div>
                  <div className="text-[11px] font-black text-emerald-900 font-mono">
                    {currentPoint ? `${currentPoint.slope.toFixed(3)} ${meta.unit}/s` : '---'}
                  </div>
                </div>
                <div className="bg-amber-50/90 border border-amber-200 rounded p-1">
                  <div className="text-[9px] text-amber-600 font-bold uppercase truncate">
                    Area ∫ {meta.symbol} dt
                  </div>
                  <div className="text-[11px] font-black text-amber-900 font-mono">
                    {!isTrajectory ? `${integralValue.toFixed(3)} ${meta.unit}·s` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Global dataset statistics */}
              {stats && (
                <div className="grid grid-cols-5 gap-1 shrink-0 text-center">
                  <div className="bg-white border border-slate-200 rounded p-1 shadow-xs">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Min</span>
                    <span className="text-[10px] font-extrabold text-slate-800 font-mono">
                      {stats.min.toFixed(3)}
                    </span>
                    <span className="text-[8px] text-slate-400 block font-mono truncate">
                      {isTrajectory ? `x=${stats.minTime.toFixed(2)}` : `t=${stats.minTime.toFixed(2)}s`}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-1 shadow-xs">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Max</span>
                    <span className="text-[10px] font-extrabold text-slate-800 font-mono">
                      {stats.max.toFixed(3)}
                    </span>
                    <span className="text-[8px] text-slate-400 block font-mono truncate">
                      {isTrajectory ? `x=${stats.maxTime.toFixed(2)}` : `t=${stats.maxTime.toFixed(2)}s`}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-1 shadow-xs">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Mean (μ)</span>
                    <span className="text-[10px] font-extrabold text-slate-800 font-mono">
                      {stats.mean.toFixed(3)}
                    </span>
                    <span className="text-[8px] text-slate-400 block truncate">{meta.unit}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-1 shadow-xs">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Std Dev (σ)</span>
                    <span className="text-[10px] font-extrabold text-slate-800 font-mono">
                      {stats.stdDev.toFixed(3)}
                    </span>
                    <span className="text-[8px] text-slate-400 block truncate">{meta.unit}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-1 shadow-xs">
                    <span className="text-[8px] text-slate-500 font-bold block uppercase">Range (Δ)</span>
                    <span className="text-[10px] font-extrabold text-slate-800 font-mono">
                      {stats.peakToPeak.toFixed(3)}
                    </span>
                    <span className="text-[8px] text-slate-400 block truncate">{meta.unit}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Physics & Model */}
          {infoTab === 'physics' && (
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1 text-xs">
              <div className="bg-white border border-slate-200 rounded p-1.5 shadow-xs">
                <div className="font-extrabold text-slate-800 flex items-center justify-between text-[11px]">
                  <span>{meta.label} ({meta.symbol})</span>
                  <span className="text-[9px] px-1 py-0.2 bg-blue-100 text-blue-800 rounded-full uppercase font-bold">
                    {meta.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">{meta.description}</p>
              </div>

              {fitResult ? (
                <div className="bg-amber-50/80 border border-amber-200 rounded p-1.5">
                  <div className="text-[10px] font-bold text-amber-900 flex items-center justify-between">
                    <span>Model: {fitResult.equation}</span>
                    <span className="font-mono text-amber-800">R² = {fitResult.rSquared.toFixed(4)}</span>
                  </div>
                  {fitResult.calculatedValues && fitResult.calculatedValues.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                      {fitResult.calculatedValues.map((cv, i) => (
                        <div key={i} className="bg-white/80 px-1.5 py-0.5 rounded text-[9px] font-mono border border-amber-200/50">
                          <span className="text-slate-500">{cv.label}: </span>
                          <span className="font-bold text-slate-800">{cv.value.toFixed(3)} {cv.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100/80 border border-slate-200 rounded p-1.5 text-center text-slate-500 text-[10px]">
                  No mathematical curve fit applied yet. Click <span className="font-bold text-blue-600">"Fit"</span> in the toolbar above to compute physics constants (e.g. g, v₀, T).
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Data Table */}
          {infoTab === 'table' && (
            <div className="flex-1 overflow-y-auto min-h-0 bg-white border border-slate-200 rounded shadow-xs">
              <table className="w-full text-left text-[10px] font-mono border-collapse">
                <thead className="bg-slate-100 sticky top-0 text-slate-600 text-[9px] font-bold uppercase">
                  <tr>
                    <th className="px-1.5 py-0.5">#</th>
                    <th className="px-1.5 py-0.5">Time (s)</th>
                    <th className="px-1.5 py-0.5">{meta.symbol} ({meta.unit})</th>
                    <th className="px-1.5 py-0.5">Slope ({meta.unit}/s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validPoints.map((pt, i) => {
                    const isCurrent = currentPoint && currentPoint.id === pt.id;
                    return (
                      <tr
                        key={pt.id || i}
                        onClick={() => onSeekTime(pt.time)}
                        className={`cursor-pointer transition ${
                          isCurrent
                            ? 'bg-blue-100/90 font-bold text-blue-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <td className="px-1.5 py-0.5">{i + 1}</td>
                        <td className="px-1.5 py-0.5">{pt.time.toFixed(3)}</td>
                        <td className="px-1.5 py-0.5 font-bold">{pt.val.toFixed(3)}</td>
                        <td className="px-1.5 py-0.5 text-slate-500">{pt.slope.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface PlotPaneConfig {
  id: string;
  variable: VariableType;
  fitResult: RegressionResult | null;
  showInfo?: boolean;
}

const SMART_VARIABLE_SEQUENCE: VariableType[] = [
  'y',
  'vy',
  'ay',
  'trajectory',
  'x',
  'vx',
  'ax',
  'kineticEnergy',
  'potentialEnergy',
  'totalEnergy',
  'p',
  'f',
];

interface KinematicsGraphProps {
  seriesList: TrackSeries[];
  activeSeriesId: string;
  currentTime: number;
  hoveredPointTime: number | null;
  onHoverPoint: (time: number | null) => void;
  onSeekTime: (time: number) => void;
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
}

export const KinematicsGraph: React.FC<KinematicsGraphProps> = ({
  seriesList,
  activeSeriesId,
  currentTime,
  hoveredPointTime,
  onHoverPoint,
  onSeekTime,
  onAddToNotebook,
}) => {
  const [plots, setPlots] = useState<PlotPaneConfig[]>([
    { id: 'plot-1', variable: 'y', fitResult: null, showInfo: false },
  ]);
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'grid'>('stacked');
  const [isFitModalOpen, setIsFitModalOpen] = useState<boolean>(false);
  const [targetPlotId, setTargetPlotId] = useState<string | null>(null);

  const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];
  const targetPlot = plots.find((p) => p.id === targetPlotId);

  const handleOpenFit = (plotId: string) => {
    setTargetPlotId(plotId);
    setIsFitModalOpen(true);
  };

  const handleApplyFit = (result: RegressionResult) => {
    if (targetPlotId) {
      setPlots((prev) =>
        prev.map((p) => (p.id === targetPlotId ? { ...p, fitResult: result } : p))
      );
    }
  };

  const handleClearFit = (plotId: string) => {
    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, fitResult: null } : p))
    );
  };

  const handleChangePlotVariable = (id: string, newVar: VariableType) => {
    setPlots((prev) =>
      prev.map((p) => (p.id === id ? { ...p, variable: newVar, fitResult: null } : p))
    );
  };

  const handleTogglePlotInfo = (index: number) => {
    setPlots((prev) =>
      prev.map((p, i) => (i === index ? { ...p, showInfo: !p.showInfo } : p))
    );
  };

  const handleAddPlot = () => {
    if (plots.length >= 4) return;
    const existingVars = plots.map((p) => p.variable);
    const nextVar = SMART_VARIABLE_SEQUENCE.find((v) => !existingVars.includes(v)) || 'vy';
    const newPlot: PlotPaneConfig = {
      id: `plot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      variable: nextVar,
      fitResult: null,
      showInfo: false,
    };
    setPlots((prev) => [...prev, newPlot]);
  };

  const handleRemovePlot = (id: string) => {
    if (plots.length <= 1) return;
    setPlots((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSetPlotCount = (count: number) => {
    if (count === plots.length) return;
    if (count < plots.length) {
      setPlots((prev) => prev.slice(0, count));
    } else {
      setPlots((prev) => {
        const nextPlots = [...prev];
        while (nextPlots.length < count) {
          const existingVars = nextPlots.map((p) => p.variable);
          const nextVar = SMART_VARIABLE_SEQUENCE.find((v) => !existingVars.includes(v)) || 'y';
          nextPlots.push({
            id: `plot-${Date.now()}-${nextPlots.length}-${Math.random().toString(36).slice(2, 6)}`,
            variable: nextVar,
            fitResult: null,
            showInfo: false,
          });
        }
        return nextPlots;
      });
    }
  };

  const getContainerLayoutClass = () => {
    if (layoutMode === 'stacked') {
      switch (plots.length) {
        case 1:
          return 'grid grid-cols-1 grid-rows-1 gap-2.5 h-full min-h-0';
        case 2:
          return 'grid grid-cols-1 grid-rows-2 gap-2.5 h-full min-h-0';
        case 3:
          return 'grid grid-cols-1 grid-rows-3 gap-2.5 h-full min-h-0 overflow-y-auto';
        case 4:
        default:
          return 'grid grid-cols-1 grid-rows-4 gap-2.5 h-full min-h-0 overflow-y-auto';
      }
    }
    switch (plots.length) {
      case 1:
        return 'grid grid-cols-1 grid-rows-1 gap-2.5 h-full min-h-0';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-1 gap-2.5 h-full min-h-0';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-2.5 h-full min-h-0';
      case 4:
      default:
        return 'grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-2.5 h-full min-h-0';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-2.5 gap-2.5 overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Scientific Graphs & Mathematical Models
          </h2>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            (Click points to jump video)
          </span>
        </div>

        {/* Controls Toolbar: Presets, Info View Toggles, Add Graph, Layout Mode */}
        <div className="flex items-center gap-2">
          {/* Quick Plot Count Presets */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => handleSetPlotCount(n)}
                className={`px-2 py-0.5 rounded-md text-xs font-bold transition ${
                  plots.length === n
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Display ${n} simultaneous graph${n > 1 ? 's' : ''}`}
              >
                {n === 4 ? '4 (2×2)' : `${n}`}
              </button>
            ))}
          </div>

          {/* Quick toggles for Info View below Graph 1 / Below Graph 2 */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
            <span className="text-[10px] font-extrabold text-slate-600 uppercase px-1 hidden md:inline">
              Info Below:
            </span>
            <button
              onClick={() => handleTogglePlotInfo(0)}
              className={`px-2 py-0.5 rounded-md text-xs font-bold transition ${
                plots[0]?.showInfo
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle detailed information panel below Graph 1"
            >
              Graph 1
            </button>
            {plots.length >= 2 && (
              <button
                onClick={() => handleTogglePlotInfo(1)}
                className={`px-2 py-0.5 rounded-md text-xs font-bold transition ${
                  plots[1]?.showInfo
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Toggle detailed information panel below Graph 2"
              >
                Graph 2
              </button>
            )}
          </div>

          {/* Add Graph Button */}
          <button
            onClick={handleAddPlot}
            disabled={plots.length >= 4}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition shadow-xs ${
              plots.length >= 4
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 active:scale-95'
            }`}
            title={plots.length >= 4 ? 'Maximum 4 graphs reached' : 'Add another graph to split view (up to 4)'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Graph</span>
            <span className="text-[10px] opacity-80">({plots.length}/4)</span>
          </button>

          {/* Above & Below vs Side-by-Side Layout Mode Toggle */}
          {plots.length >= 2 && (
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
              <button
                onClick={() => setLayoutMode('stacked')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold transition ${
                  layoutMode === 'stacked'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Stack graphs vertically: Above and Below (Top and Bottom)"
              >
                <Rows className="w-3.5 h-3.5" />
                <span>Above & Below</span>
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold transition ${
                  layoutMode === 'grid'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={plots.length === 4 ? '2×2 Quad Grid' : 'Side-by-Side (Horizontal Columns)'}
              >
                {plots.length === 4 ? <Grid2X2 className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                <span>{plots.length === 4 ? '2×2 Grid' : 'Side-by-Side'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Graphs Grid / Stack Area */}
      <div className={`flex-1 min-h-0 ${getContainerLayoutClass()}`}>
        {plots.map((plot, idx) => (
          <div
            key={plot.id}
            className={`min-h-0 h-full flex flex-col ${
              plots.length === 3 && idx === 0 && layoutMode === 'grid'
                ? 'lg:col-span-2'
                : ''
            }`}
          >
            <SinglePlot
              id={plot.id}
              plotNumber={idx + 1}
              variable={plot.variable}
              onChangeVariable={(newVar) => handleChangePlotVariable(plot.id, newVar)}
              seriesList={seriesList}
              activeSeriesId={activeSeriesId}
              currentTime={currentTime}
              hoveredPointTime={hoveredPointTime}
              onHoverPoint={onHoverPoint}
              onSeekTime={onSeekTime}
              fitResult={plot.fitResult}
              onOpenFitModal={() => handleOpenFit(plot.id)}
              onClearFit={() => handleClearFit(plot.id)}
              onAddToNotebook={onAddToNotebook}
              onRemove={() => handleRemovePlot(plot.id)}
              canRemove={plots.length > 1}
              showInfo={plot.showInfo}
              onToggleInfo={() => handleTogglePlotInfo(idx)}
            />
          </div>
        ))}
      </div>

      {activeSeries && targetPlot && (
        <CurveFitModal
          isOpen={isFitModalOpen}
          onClose={() => {
            setIsFitModalOpen(false);
            setTargetPlotId(null);
          }}
          series={activeSeries}
          variable={targetPlot.variable}
          onApplyFit={handleApplyFit}
        />
      )}
    </div>
  );
};

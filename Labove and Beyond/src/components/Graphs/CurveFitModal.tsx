import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Sparkles, Check, GripHorizontal } from 'lucide-react';
import { RegressionResult, TrackSeries, VariableType } from '../../types/physics';
import {
  fitLinear,
  fitQuadratic,
  fitSine,
  fitExponential,
  fitPowerLaw,
} from '../../utils/regression';

interface CurveFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: TrackSeries;
  variable: VariableType;
  onApplyFit: (result: RegressionResult) => void;
}

export const CurveFitModal: React.FC<CurveFitModalProps> = ({
  isOpen,
  onClose,
  series,
  variable,
  onApplyFit,
}) => {
  const [modelType, setModelType] = useState<
    'quadratic' | 'linear' | 'sine' | 'exponential' | 'power'
  >('quadratic');

  // Draggable window state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    const modalEl = (e.currentTarget as HTMLElement).parentElement;
    const rect = modalEl?.getBoundingClientRect();
    const currentX = position?.x ?? (rect ? rect.left : Math.max(10, (window.innerWidth - 576) / 2));
    const currentY = position?.y ?? (rect ? rect.top : Math.max(10, (window.innerHeight - 520) / 2));
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const validPoints = series.points.filter((pt) => {
    if (variable === 'trajectory') return pt.x !== undefined && pt.y !== undefined;
    const val = pt[variable as keyof typeof pt];
    return typeof val === 'number' && !isNaN(val);
  });

  const xs = validPoints.map((pt) => (variable === 'trajectory' ? pt.x : pt.time));
  const ys = validPoints.map((pt) => {
    if (variable === 'trajectory') return pt.y;
    return pt[variable as keyof typeof pt] as number;
  });

  let fitResult: RegressionResult | null = null;
  if (modelType === 'linear') {
    fitResult = fitLinear(xs, ys);
  } else if (modelType === 'quadratic') {
    fitResult = fitQuadratic(xs, ys);
  } else if (modelType === 'sine') {
    fitResult = fitSine(xs, ys);
  } else if (modelType === 'exponential') {
    fitResult = fitExponential(xs, ys);
  } else if (modelType === 'power') {
    fitResult = fitPowerLaw(xs, ys);
  }

  const handleApply = () => {
    if (fitResult) {
      onApplyFit(fitResult);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${position ? 'pointer-events-none' : 'flex items-center justify-center bg-slate-900/40 backdrop-blur-xs'} p-4 select-none font-sans`}>
      <div
        style={position ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, margin: 0 } : undefined}
        className={`w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-shadow ${
          isDragging ? 'ring-2 ring-blue-500 shadow-blue-500/25' : ''
        }`}
      >
        {/* Header */}
        <div
          onMouseDown={handleMouseDown}
          className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 cursor-grab active:cursor-grabbing hover:bg-slate-100/80 transition-colors"
          title="Drag to reposition window"
        >
          <div className="flex items-center gap-3">
            <GripHorizontal className="w-4 h-4 text-slate-400" />
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Mathematical Curve Fitting</h3>
              <p className="text-xs text-slate-500 font-medium">
                Fit analytical model to <span className="font-semibold text-blue-600">{variable}</span> of{' '}
                <span className="text-slate-700">{series.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Model selector buttons */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Select Mathematical Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModelType('quadratic')}
                className={`flex flex-col items-center py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  modelType === 'quadratic'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span>Quadratic / Gravity</span>
                <span className="text-[10px] opacity-75 font-mono">y = At² + Bt + C</span>
              </button>

              <button
                type="button"
                onClick={() => setModelType('linear')}
                className={`flex flex-col items-center py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  modelType === 'linear'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span>Linear / Constant v</span>
                <span className="text-[10px] opacity-75 font-mono">y = mt + b</span>
              </button>

              <button
                type="button"
                onClick={() => setModelType('sine')}
                className={`flex flex-col items-center py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  modelType === 'sine'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span>Sinusoidal (SHM)</span>
                <span className="text-[10px] opacity-75 font-mono">y = A·sin(ωt)</span>
              </button>

              <button
                type="button"
                onClick={() => setModelType('exponential')}
                className={`flex flex-col items-center py-2 px-2.5 rounded-xl border text-xs font-medium transition ${
                  modelType === 'exponential'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span>Exponential Decay</span>
                <span className="text-[10px] opacity-75 font-mono">y = A·e^(Bt)</span>
              </button>

              <button
                type="button"
                onClick={() => setModelType('power')}
                className={`flex flex-col items-center py-2 px-2.5 rounded-xl border text-xs font-medium transition col-span-2 sm:col-span-1 ${
                  modelType === 'power'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span>Power Law (Scaling)</span>
                <span className="text-[10px] opacity-75 font-mono">y = A·t^B</span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {fitResult ? (
            <div className="flex flex-col gap-3">
              {/* Formula & R^2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-slate-500">Regression Equation</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    R² = {fitResult.rSquared}
                  </span>
                </div>
                <div className="text-base font-mono font-bold text-blue-700 tracking-wide">
                  {fitResult.equation}
                </div>
              </div>

              {/* Physical Parameters Breakdown */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-600">Physical Interpretation</span>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white divide-y divide-slate-100">
                  {fitResult.calculatedValues?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3.5 py-2 text-xs">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          {item.value} {item.unit}
                        </span>
                        {item.errorPercent !== undefined && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              item.errorPercent < 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Err: {item.errorPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {modelType === 'quadratic' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    In kinematics ($y = \frac{1}{2}at^2 + v_0t + y_0$), the acceleration is
                    equal to $2 \times A$. For free fall or projectile motion, this yields experimental
                    gravitational acceleration ($g$).
                  </p>
                </div>
              )}

              {modelType === 'exponential' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Exponential decay models air drag damping, terminal velocity approach (v(t) = v_t · (1 - e^(-t/τ))),
                    and Newton's law of cooling.
                  </p>
                </div>
              )}

              {modelType === 'power' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Power laws reveal physical scaling exponents: B ≈ 2 for quadratic aerodynamic drag force,
                    B ≈ 0.5 for pendulum period vs length (T ∝ √L), or B ≈ 1.5 for Kepler's 3rd Law.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
              Need at least 3 tracked data points to compute regression.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!fitResult}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Fit to Graph</span>
          </button>
        </div>
      </div>
    </div>
  );
};

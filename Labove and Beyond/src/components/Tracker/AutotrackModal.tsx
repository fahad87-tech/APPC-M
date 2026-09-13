import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Crosshair,
  Play,
  Pause,
  ChevronRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import { AutotrackConfig, AutotrackTemplate, VectorDisplayOptions } from '../../types/physics';

interface AutotrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: AutotrackTemplate | null;
  config: AutotrackConfig;
  onChangeConfig: (cfg: AutotrackConfig) => void;
  isAutotracking: boolean;
  onStartAutotrack: () => void;
  onStopAutotrack: () => void;
  onStepAutotrack: () => void;
  onResetTemplate: () => void;
  onSelectFeatureMode: () => void;
  isSelectingFeature: boolean;
  lastScore: number | null;
  statusMessage: string;
  currentTime?: number;
  duration?: number;
  fps?: number;
  onSeekToStart?: () => void;
  vectorOptions?: VectorDisplayOptions;
  onToggleVector?: (key: keyof VectorDisplayOptions) => void;
}

export const AutotrackModal: React.FC<AutotrackModalProps> = ({
  isOpen,
  onClose,
  template,
  config,
  onChangeConfig,
  isAutotracking,
  onStartAutotrack,
  onStopAutotrack,
  onStepAutotrack,
  onResetTemplate,
  onSelectFeatureMode,
  isSelectingFeature,
  lastScore,
  statusMessage,
  currentTime = 0,
  duration = 0,
  fps = 30,
  onSeekToStart,
  vectorOptions,
  onToggleVector,
}) => {
  const templateCanvasRef = useRef<HTMLCanvasElement>(null);

  // Movable / Draggable state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 64 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Render zoomed template onto preview canvas
  useEffect(() => {
    if (!template || !templateCanvasRef.current) return;
    const canvas = templateCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 96;
    canvas.height = 96;
    ctx.imageSmoothingEnabled = false;

    // Draw zoomed
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = template.width;
    tempCanvas.height = template.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(template.imageData, 0, 0);
      ctx.clearRect(0, 0, 96, 96);
      ctx.drawImage(tempCanvas, 0, 0, 96, 96);
    }

    // Reticle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(48, 96);
    ctx.moveTo(0, 48);
    ctx.lineTo(96, 48);
    ctx.stroke();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 94, 94);
  }, [template]);

  if (!isOpen) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 ${isMinimized ? 'w-auto' : 'w-80'} bg-white/95 text-slate-800 rounded-2xl shadow-2xl border border-slate-300/80 backdrop-blur-md overflow-hidden flex flex-col font-sans select-none transition-shadow ${
        isDragging ? 'shadow-blue-500/25 ring-2 ring-blue-500/50' : ''
      }`}
    >
      {/* Header (Drag Handle) */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="px-3.5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-slate-200/70 transition"
        title="Drag header to move modal anywhere on screen"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="p-1 rounded bg-blue-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Tracker Autotracker</span>
              {lastScore !== null && (
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    lastScore >= 0.6 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {(lastScore * 100).toFixed(0)}%
                </span>
              )}
            </h3>
            {!isMinimized && (
              <p className="text-[10px] text-slate-500 font-medium">
                Drag anywhere • Won't block video
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            title={isMinimized ? 'Expand full panel' : 'Minimize to compact bar'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            title="Close Autotracker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Minimized Compact Bar View */}
      {isMinimized && (
        <div className="p-2 flex items-center gap-2 bg-white/95">
          <button
            onClick={isAutotracking ? onStopAutotrack : onStartAutotrack}
            disabled={!template}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-white shadow-xs transition disabled:opacity-40 ${
              isAutotracking ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isAutotracking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isAutotracking ? 'Pause' : 'Autotrack'}</span>
          </button>

          <button
            onClick={onStepAutotrack}
            disabled={!template || isAutotracking}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-300 shadow-xs transition"
            title="Step 1 Frame"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          {/* Quick Marker Visibility Toggle */}
          <button
            onClick={() => onToggleVector?.('showDataMarkers')}
            className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              vectorOptions?.showDataMarkers !== false
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                : 'bg-slate-100 border-slate-300 text-slate-400 hover:text-slate-600'
            }`}
            title="Toggle data markers on video canvas (hide/show markers while autotracking)"
          >
            {vectorOptions?.showDataMarkers !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Acc/Dec Lines Toggle */}
          <button
            onClick={() => onToggleVector?.('showAccelerationLines')}
            className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              vectorOptions?.showAccelerationLines
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                : 'bg-slate-100 border-slate-300 text-slate-400 hover:text-slate-600'
            }`}
            title="Toggle horizontal & vertical reference lines showing acceleration or deceleration"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] text-slate-600 font-mono truncate max-w-[140px] pl-1">
            {statusMessage}
          </span>
        </div>
      )}

      {/* Full Body (Hidden when minimized) */}
      {!isMinimized && (
        <div className="p-3.5 flex flex-col gap-3 text-xs">
        {/* Template Box Preview & Selection */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden border border-slate-300 relative shrink-0">
            {template ? (
              <canvas ref={templateCanvasRef} className="w-full h-full" />
            ) : (
              <div className="text-center p-2 text-[10px] text-slate-400 font-medium">
                No feature selected
              </div>
            )}
            {template && (
              <div className="absolute bottom-1 right-1 px-1 rounded bg-slate-900/80 text-[9px] font-mono text-white">
                {template.width}×{template.height}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <button
              onClick={onSelectFeatureMode}
              className={`w-full py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs ${
                isSelectingFeature
                  ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isSelectingFeature ? 'Click Target on Video...' : 'Select Target on Video'}</span>
            </button>

            {template && (
              <button
                onClick={onResetTemplate}
                className="w-full py-1 px-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] font-medium flex items-center justify-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Target</span>
              </button>
            )}

            {lastScore !== null && (
              <div className="mt-1 flex items-center gap-1 text-[11px] font-mono">
                <span className="text-slate-500 font-bold">Match Score:</span>
                <span
                  className={`font-bold ${
                    lastScore >= config.threshold ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {(lastScore * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Frame / Time readout and Quick Rewind */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700">
              Frame {Math.round(currentTime * fps)} ({currentTime.toFixed(2)}s / {duration.toFixed(2)}s)
            </span>
            {duration > 0 && currentTime >= duration - 0.15 && (
              <span className="text-[10px] text-amber-600 font-bold">End of video reached</span>
            )}
          </div>
          {onSeekToStart && (
            <button
              onClick={onSeekToStart}
              className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300 text-[10px] flex items-center gap-1 shadow-sm transition"
              title="Rewind video to start (t=0)"
            >
              <RotateCcw className="w-3 h-3 text-blue-600" />
              Rewind (t=0)
            </button>
          )}
        </div>

        {/* Visual Aids: Markers & Acc/Dec Lines Toggles */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Video Overlays While Tracking:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleVector?.('showDataMarkers')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-[11px] font-semibold transition ${
                vectorOptions?.showDataMarkers !== false
                  ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-500 hover:text-slate-800'
              }`}
              title="Hide data markers while autotracking to see the feature and motion clearly"
            >
              {vectorOptions?.showDataMarkers !== false ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Markers: Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Markers: Hidden</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleVector?.('showAccelerationLines')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-[11px] font-semibold transition ${
                vectorOptions?.showAccelerationLines
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-500 hover:text-slate-800'
              }`}
              title="Show horizontal & vertical reference lines through the mass showing whether it is accelerating or decelerating"
            >
              <Activity
                className={`w-3.5 h-3.5 ${vectorOptions?.showAccelerationLines ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <span>Acc/Dec Lines</span>
            </button>
          </div>
        </div>

        {/* Configuration Sliders */}
        <div className="space-y-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              Search Radius
            </span>
            <span className="font-mono font-bold text-blue-600">{config.searchRadius} px</span>
          </div>
          <input
            type="range"
            min={20}
            max={180}
            value={config.searchRadius}
            onChange={(e) =>
              onChangeConfig({ ...config, searchRadius: parseInt(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600">Match Threshold</span>
            <span className="font-mono font-bold text-blue-600">
              {(config.threshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={95}
            value={Math.round(config.threshold * 100)}
            onChange={(e) =>
              onChangeConfig({ ...config, threshold: parseInt(e.target.value) / 100 })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600" title="Gradually adapts template to follow object rotations, lighting shifts, and motion blur">
              Template Adaptation
            </span>
            <span className="font-mono font-bold text-blue-600">
              {(config.evolutionRate * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={25}
            value={Math.round(config.evolutionRate * 100)}
            onChange={(e) =>
              onChangeConfig({ ...config, evolutionRate: parseInt(e.target.value) / 100 })
            }
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            title="Adapts template to follow rotating, blurring, or lighting-shifting objects"
          />
        </div>

        {/* Status Message */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-blue-50 border border-blue-100 text-[11px] text-blue-700 font-medium">
          {isAutotracking ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onStepAutotrack}
            disabled={!template || isAutotracking}
            className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 border border-slate-200 transition"
            title="Track next single frame"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Step 1 Frame</span>
          </button>

          {!isAutotracking ? (
            <button
              onClick={onStartAutotrack}
              disabled={!template}
              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              title="Continuously track all frames until end of video"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Autotrack All</span>
            </button>
          ) : (
            <button
              onClick={onStopAutotrack}
              className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              title="Halt automated tracking"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause / Stop</span>
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Ruler,
  Compass,
  Trash2,
  Plus,
  Layers,
  Weight,
  Sparkles,
  ArrowRight,
  Target,
  Clock,
  Camera,
  Scissors,
  Gauge,
  RotateCcw,
  ArrowLeftRight,
  ArrowUpDown,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import {
  ActiveTool,
  CalibrationScale,
  CoordinateOrigin,
  TrackSeries,
  VectorDisplayOptions,
  VideoTrimRange,
} from '../../types/physics';
import { convertScaleUnit } from '../../utils/kinematics';

interface TrackerControlsProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepFrame: (delta: number) => void;
  onSeekToStart: () => void;
  currentTime: number;
  duration: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  onChangeFps: (fps: number) => void;
  onSeekTime: (time: number) => void;
  advanceStep: number;
  onChangeAdvanceStep: (step: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  trimRange: VideoTrimRange;
  onUpdateTrimRange: (range: VideoTrimRange) => void;
  scale: CalibrationScale;
  onUpdateScale: (scale: CalibrationScale) => void;
  origin: CoordinateOrigin;
  onUpdateOrigin: (origin: CoordinateOrigin) => void;
  seriesList: TrackSeries[];
  activeSeriesId: string;
  onSelectSeries: (id: string) => void;
  onAddSeries: () => void;
  onChangeMass: (seriesId: string, mass: number) => void;
  pointCount: number;
  vectorOptions: VectorDisplayOptions;
  onToggleVector: (key: keyof VectorDisplayOptions) => void;
  onChangeVectorScale: (scale: number) => void;
  onOpenAutotrack: () => void;
  onExportSnapshot: () => void;
  onOpenStroboscope?: () => void;
}

export const TrackerControls: React.FC<TrackerControlsProps> = ({
  activeTool,
  onSelectTool,
  isPlaying,
  onTogglePlay,
  onStepFrame,
  onSeekToStart,
  currentTime,
  duration,
  currentFrame,
  totalFrames,
  fps,
  onChangeFps,
  onSeekTime,
  advanceStep,
  onChangeAdvanceStep,
  playbackRate,
  onChangePlaybackRate,
  trimRange,
  onUpdateTrimRange,
  scale,
  onUpdateScale,
  origin,
  onUpdateOrigin,
  seriesList,
  activeSeriesId,
  onSelectSeries,
  onAddSeries,
  onChangeMass,
  pointCount,
  vectorOptions,
  onToggleVector,
  onChangeVectorScale,
  onOpenAutotrack,
  onExportSnapshot,
  onOpenStroboscope,
}) => {
  const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];

  // Local state for dynamic scale input
  const [scaleVal, setScaleVal] = useState<string>(
    (scale.displayValue !== undefined ? scale.displayValue : scale.distanceInMeters).toString()
  );
  const [scaleUnit, setScaleUnit] = useState<'m' | 'cm' | 'mm' | 'ft' | 'in'>(scale.unit || 'm');

  useEffect(() => {
    setScaleVal((scale.displayValue !== undefined ? scale.displayValue : scale.distanceInMeters).toString());
    setScaleUnit(scale.unit || 'm');
  }, [scale.displayValue, scale.distanceInMeters, scale.unit]);

  const handleApplyScale = (newValStr: string, newUnit: 'm' | 'cm' | 'mm' | 'ft' | 'in') => {
    const num = parseFloat(newValStr);
    if (isNaN(num) || num <= 0) return;
    const distanceInMeters = convertScaleUnit(num, newUnit, 'm');
    onUpdateScale({
      ...scale,
      distanceInMeters,
      displayValue: num,
      unit: newUnit,
      isCalibrated: true,
    });
  };

  const rulerPx = Math.hypot(scale.p2.x - scale.p1.x, scale.p2.y - scale.p1.y);
  const ppm = (rulerPx / scale.distanceInMeters).toFixed(1);

  return (
    <div className="bg-slate-100 border-t border-slate-200 p-2.5 flex flex-col gap-2 shrink-0 select-none text-slate-800">
      {/* Top Row: Timeline scrubber & time readout & trim badges */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={1 / fps}
            value={currentTime}
            onChange={(e) => onSeekTime(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />
          {/* Visual Trim Region Highlight */}
          {trimRange.isTrimmed && duration > 0 && (
            <div
              className="absolute h-2 bg-emerald-400/40 rounded pointer-events-none border-x-2 border-emerald-600"
              style={{
                left: `${(trimRange.startTime / duration) * 100}%`,
                width: `${Math.max(2, ((trimRange.endTime - trimRange.startTime) / duration) * 100)}%`,
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          <div className="px-2 py-0.5 rounded bg-white border border-slate-300 text-blue-700 font-bold shadow-xs">
            t = {currentTime.toFixed(3)}s
          </div>
          <div className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 font-semibold shadow-xs">
            Frame {currentFrame} / {totalFrames > 0 ? totalFrames : Math.round(duration * fps)}
          </div>
          <div className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-500 text-[11px] shadow-xs">
            {pointCount} pts
          </div>
        </div>
      </div>

      {/* Middle Row: Tool Palette & Playback Transport & Scale Input */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Tool Palette (Tracker Style) */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
          <button
            onClick={() => onSelectTool('track')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeTool === 'track'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Manual Frame-by-Frame Point Tracking"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>

          <button
            onClick={onOpenAutotrack}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
            title="Open Automated Tracking Panel"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Autotrack</span>
          </button>

          <button
            onClick={() => onSelectTool('ruler')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeTool === 'ruler'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Calibrate Scale Ruler"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Scale</span>
          </button>

          <button
            onClick={() => onSelectTool('origin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
              activeTool === 'origin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Set Coordinate Axes and Origin"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Axes</span>
          </button>

          <button
            onClick={() => onSelectTool('delete')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition ${
              activeTool === 'delete'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title="Delete point tool (Tip: You can also Right-Click any point, or press Del / Backspace, or Ctrl+Z to undo)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Video Transport Buttons & Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSeekToStart}
            className="p-1.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
            title="Rewind to start"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onStepFrame(-advanceStep)}
            className="p-1.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs flex items-center"
            title={`Step Back ${advanceStep} Frame(s)`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition shadow-xs"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={() => onStepFrame(advanceStep)}
            className="p-1.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs flex items-center"
            title={`Step Forward ${advanceStep} Frame(s)`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Advance step dropdown */}
          <div className="flex items-center ml-1 text-xs text-slate-700 gap-1 bg-white px-2 py-1 rounded border border-slate-300 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Step:</span>
            <select
              value={advanceStep}
              onChange={(e) => onChangeAdvanceStep(parseInt(e.target.value))}
              className="bg-transparent text-blue-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value={1}>+1 frame</option>
              <option value={2}>+2 frames</option>
              <option value={5}>+5 frames</option>
            </select>
          </div>

          {/* Playback speed */}
          <div className="flex items-center text-xs text-slate-700 gap-1 bg-white px-2 py-1 rounded border border-slate-300 shadow-xs">
            <Gauge className="w-3 h-3 text-slate-500" />
            <select
              value={playbackRate}
              onChange={(e) => onChangePlaybackRate(parseFloat(e.target.value))}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
              title="Playback speed"
            >
              <option value={0.1}>0.1x</option>
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1.0}>1.0x</option>
              <option value={2.0}>2.0x</option>
            </select>
          </div>

          {/* FPS dropdown */}
          <div className="flex items-center text-xs text-slate-700 gap-1 bg-white px-2 py-1 rounded border border-slate-300 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">FPS:</span>
            <select
              value={fps}
              onChange={(e) => onChangeFps(parseInt(e.target.value))}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value={24}>24</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={120}>120</option>
              <option value={300}>300</option>
            </select>
          </div>
        </div>

        {/* DYNAMIC SCALE CALIBRATION WIDGET */}
        <div className="flex items-center bg-white px-2.5 py-1 rounded-lg border border-emerald-300 gap-1.5 shadow-xs">
          <Ruler className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">Scale:</span>
          <input
            type="number"
            min="0.001"
            step="0.1"
            value={scaleVal}
            onChange={(e) => {
              setScaleVal(e.target.value);
              handleApplyScale(e.target.value, scaleUnit);
            }}
            className="w-14 bg-emerald-50/50 text-emerald-900 font-mono text-xs font-bold px-1.5 py-0.5 rounded border border-emerald-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
            title="Type real scale length (e.g. 1.0, 100, 2.5) to dynamically rescale all graphs and kinematics"
          />
          <select
            value={scaleUnit}
            onChange={(e) => {
              const u = e.target.value as any;
              setScaleUnit(u);
              handleApplyScale(scaleVal, u);
            }}
            className="bg-emerald-50/50 text-emerald-900 text-xs font-bold px-1 py-0.5 rounded border border-emerald-200 focus:outline-none cursor-pointer"
            title="Calibration measurement unit"
          >
            <option value="m">m</option>
            <option value="cm">cm</option>
            <option value="mm">mm</option>
            <option value="ft">ft</option>
            <option value="in">in</option>
          </select>
          <span className="text-[10px] text-emerald-600 font-mono hidden xl:inline">
            ({ppm} px/m)
          </span>
        </div>

        {/* Video Range Trim & Zero-Time */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-300 shadow-xs text-xs gap-1">
            <Scissors className="w-3 h-3 text-slate-500" />
            <button
              onClick={() =>
                onUpdateTrimRange({
                  ...trimRange,
                  startFrame: currentFrame,
                  startTime: currentTime,
                  isTrimmed: true,
                })
              }
              className="text-[11px] font-semibold text-slate-700 hover:text-blue-600 px-1 py-0.5 rounded hover:bg-slate-100"
              title="Set Start Frame of analysis region"
            >
              [ In
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() =>
                onUpdateTrimRange({
                  ...trimRange,
                  endFrame: currentFrame,
                  endTime: currentTime,
                  isTrimmed: true,
                })
              }
              className="text-[11px] font-semibold text-slate-700 hover:text-blue-600 px-1 py-0.5 rounded hover:bg-slate-100"
              title="Set End Frame of analysis region"
            >
              Out ]
            </button>
            {trimRange.isTrimmed && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() =>
                    onUpdateTrimRange({
                      startFrame: 0,
                      endFrame: totalFrames,
                      startTime: 0,
                      endTime: duration,
                      isTrimmed: false,
                    })
                  }
                  className="text-[10px] text-rose-600 hover:underline"
                >
                  Reset
                </button>
              </>
            )}
          </div>

          <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-300 shadow-xs text-xs gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <button
              onClick={() => onUpdateOrigin({ ...origin, timeOffset: currentTime })}
              className="text-[11px] font-semibold text-slate-700 hover:text-blue-600 px-1 py-0.5 rounded hover:bg-slate-100"
              title="Set current video frame as t = 0 (origin of time)"
            >
              Set t=0
            </button>
            {origin.timeOffset !== undefined && origin.timeOffset !== 0 && (
              <button
                onClick={() => onUpdateOrigin({ ...origin, timeOffset: 0 })}
                className="text-[10px] text-slate-500 hover:text-slate-800"
                title="Reset t=0 to video start"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Coordinate Axes Flip Controls (+X Left/Right, +Y Up/Down) */}
          <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-300 shadow-xs text-xs gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Axes:</span>
            <button
              onClick={() => onUpdateOrigin({ ...origin, invertX: !origin.invertX })}
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
                origin.invertX
                  ? 'bg-blue-100 text-blue-800 font-bold border border-blue-300'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
              }`}
              title="Flip X-axis direction (toggle between +X Right and +X Left)"
            >
              <ArrowLeftRight className="w-3 h-3 text-blue-600" />
              <span>{origin.invertX ? '+X Left' : '+X Right'}</span>
            </button>

            <span className="text-slate-300">|</span>

            <button
              onClick={() => onUpdateOrigin({ ...origin, invertY: !origin.invertY })}
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
                origin.invertY
                  ? 'bg-purple-100 text-purple-800 font-bold border border-purple-300'
                  : 'text-slate-700 hover:text-purple-600 hover:bg-slate-100'
              }`}
              title="Flip Y-axis direction (toggle between +Y Up and +Y Down)"
            >
              <ArrowUpDown className="w-3 h-3 text-purple-600" />
              <span>{origin.invertY ? '+Y Up' : '+Y Down'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Multi-Object Series, Vectors & Snapshot */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-xs">
        {/* Series manager & Object Mass */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-300 gap-1.5 shadow-xs">
            <Layers className="w-3 h-3 text-slate-500" />
            <div className="flex items-center gap-1">
              {seriesList.map((series) => (
                <button
                  key={series.id}
                  onClick={() => onSelectSeries(series.id)}
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition font-semibold ${
                    activeSeriesId === series.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  <span>{series.name}</span>
                </button>
              ))}

              {seriesList.length < 3 && (
                <button
                  onClick={onAddSeries}
                  className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                  title="Add another object (e.g. Object 2 for collisions)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {activeSeries && (
            <div
              className="flex items-center bg-white px-2 py-1 rounded border border-slate-300 gap-1 text-xs shadow-xs"
              title="Mass of tracked object (used for momentum, force, kinetic energy)"
            >
              <Weight className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-bold">m =</span>
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={activeSeries.mass}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) onChangeMass(activeSeries.id, val);
                }}
                className="w-12 bg-transparent text-slate-900 font-mono text-xs font-bold focus:outline-none text-center"
              />
              <span className="text-[10px] text-slate-500 font-medium">kg</span>
            </div>
          )}
        </div>

        {/* Tracker Physical Vectors & Center of Mass Overlays */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 hidden sm:flex">
            <ArrowRight className="w-3 h-3 text-blue-600" />
            Vectors:
          </span>

          {/* Velocity vector toggle */}
          <button
            onClick={() => onToggleVector('showVelocity')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${
              vectorOptions.showVelocity
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Velocity (v⃗)</span>
          </button>

          {/* Acceleration vector toggle */}
          <button
            onClick={() => onToggleVector('showAcceleration')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${
              vectorOptions.showAcceleration
                ? 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Acceleration (a⃗)</span>
          </button>

          {/* Net Force vector toggle */}
          <button
            onClick={() => onToggleVector('showForce')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${
              vectorOptions.showForce
                ? 'bg-purple-100 border-purple-400 text-purple-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>Force (F⃗)</span>
          </button>

          {/* Center of Mass toggle */}
          <button
            onClick={() => onToggleVector('showCenterOfMass')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${
              vectorOptions.showCenterOfMass
                ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Compute and display Center of Mass for multi-body collisions"
          >
            <Target className="w-3 h-3 text-blue-600" />
            <span>Center of Mass</span>
          </button>

          {/* Data Markers (Hide/Show) toggle */}
          <button
            onClick={() => onToggleVector('showDataMarkers')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${
              vectorOptions.showDataMarkers !== false
                ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                : 'bg-white border-slate-300 text-slate-500 hover:text-slate-800'
            }`}
            title="Toggle visibility of data markers (points and numbering) on the canvas"
          >
            {vectorOptions.showDataMarkers !== false ? (
              <>
                <Eye className="w-3 h-3 text-blue-600" />
                <span>Markers</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 text-slate-400" />
                <span>Markers (Off)</span>
              </>
            )}
          </button>

          {/* Horizontal & Vertical Acc/Dec Reference Lines toggle */}
          <button
            onClick={() => onToggleVector('showAccelerationLines')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${
              vectorOptions.showAccelerationLines
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold shadow-xs'
                : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle horizontal & vertical reference lines through the mass showing whether it is accelerating or decelerating"
          >
            <Activity
              className={`w-3 h-3 ${vectorOptions.showAccelerationLines ? 'text-emerald-700' : 'text-slate-500'}`}
            />
            <span>Acc/Dec Lines</span>
          </button>

          {/* Vector scale slider */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300 text-[11px]">
            <span className="text-[10px] text-slate-500 font-semibold">Scale:</span>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.25}
              value={vectorOptions.vectorScale}
              onChange={(e) => onChangeVectorScale(parseFloat(e.target.value))}
              className="w-12 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
              title="Vector arrow display scale"
            />
            <span className="font-mono text-[10px] text-slate-600 font-bold">{vectorOptions.vectorScale}x</span>
          </div>

          {/* 1-Click Snapshot / PNG Export */}
          <button
            onClick={onExportSnapshot}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition"
            title="Export high-resolution PNG snapshot of video with vectors & tracks overlaid"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snapshot</span>
          </button>

          {/* Stroboscopic Chronophotography Generator */}
          {onOpenStroboscope && (
            <button
              onClick={onOpenStroboscope}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              title="Chronophotographie: Compose multiple motion frames into a high-res stroboscopic photograph"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stroboscope</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

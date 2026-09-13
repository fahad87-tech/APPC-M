import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ActiveTool,
  AutotrackConfig,
  AutotrackMatchResult,
  AutotrackTemplate,
  CalibrationScale,
  CenterOfMassPoint,
  CoordinateOrigin,
  Point2D,
  TrackSeries,
  VectorDisplayOptions,
} from '../../types/physics';
import { LoupeMagnifier } from './LoupeMagnifier';
import { ArrowUpDown, ArrowLeftRight, RotateCcw, Check, Sparkles, X, Target, Ruler } from 'lucide-react';
import { convertScaleUnit } from '../../utils/kinematics';

// Distance from point p to line segment (v, w)
function distToSegment(p: Point2D, v: Point2D, w: Point2D): number {
  const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

interface VideoTrackerProps {
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  activeTool: ActiveTool;
  onSelectTool?: (tool: ActiveTool) => void;
  scale: CalibrationScale;
  onUpdateScale: (scale: CalibrationScale) => void;
  onResetScaleToDefault?: () => void;
  origin: CoordinateOrigin;
  onUpdateOrigin: (origin: CoordinateOrigin) => void;
  seriesList: TrackSeries[];
  activeSeriesId: string;
  onAddPoint: (seriesId: string, px: Point2D) => void;
  onUpdatePoint: (seriesId: string, pointId: string, px: Point2D) => void;
  onDeletePoint: (seriesId: string, pointId: string) => void;
  currentFrame: number;
  currentTime: number;
  duration?: number;
  fps: number;
  advanceStep: number;
  onStepFrame: (delta: number) => void;
  onSeekToStart?: () => void;
  onSeekTime?: (time: number) => void;
  onResetPoints?: () => void;
  vectorOptions: VectorDisplayOptions;
  centerOfMassPoints: CenterOfMassPoint[];
  hoveredPointTime: number | null;
  onHoverPoint: (time: number | null) => void;
  // Autotracker props
  autotrackTemplate: AutotrackTemplate | null;
  autotrackConfig: AutotrackConfig;
  lastMatchResult: AutotrackMatchResult | null;
  isSelectingAutotrackFeature: boolean;
  onSelectFeaturePoint: (px: Point2D) => void;
  onCancelSelectFeature?: () => void;
  onOpenAutotrack: () => void;
}

export const VideoTracker: React.FC<VideoTrackerProps> = ({
  videoUrl,
  videoRef,
  activeTool,
  onSelectTool,
  scale,
  onUpdateScale,
  onResetScaleToDefault,
  origin,
  onUpdateOrigin,
  seriesList,
  activeSeriesId,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  currentFrame,
  currentTime,
  duration = 0,
  fps,
  advanceStep,
  onStepFrame,
  onSeekToStart,
  onSeekTime,
  onResetPoints,
  vectorOptions,
  centerOfMassPoints,
  hoveredPointTime,
  onHoverPoint,
  autotrackTemplate,
  autotrackConfig,
  lastMatchResult,
  isSelectingAutotrackFeature,
  onSelectFeaturePoint,
  onCancelSelectFeature,
  onOpenAutotrack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mousePos, setMousePos] = useState<Point2D | null>(null);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 960, height: 540 });
  const [dragTarget, setDragTarget] = useState<{
    type: 'ruler_p1' | 'ruler_p2' | 'ruler_tape' | 'origin' | 'origin_rot' | 'point';
    pointId?: string;
    seriesId?: string;
    startCoords?: Point2D;
    initialP1?: Point2D;
    initialP2?: Point2D;
  } | null>(null);

  const [showScaleModal, setShowScaleModal] = useState<boolean>(false);
  const [scaleVal, setScaleVal] = useState<string>(
    (scale.displayValue !== undefined ? scale.displayValue : scale.distanceInMeters).toString()
  );
  const [scaleUnit, setScaleUnit] = useState<'m' | 'cm' | 'mm' | 'ft' | 'in'>(scale.unit || 'm');

  const handleCloseScale = useCallback(() => {
    setShowScaleModal(false);
    if (onSelectTool && activeTool === 'ruler') {
      onSelectTool('track');
    }
  }, [activeTool, onSelectTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      if (e.key === 'Escape') {
        handleCloseScale();
        return;
      }

      // Undo last point: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];
        if (activeSeries && activeSeries.points.length > 0) {
          const sorted = [...activeSeries.points].sort((a, b) => a.frame - b.frame);
          const currentOrPastPoints = sorted.filter((pt) => pt.time <= currentTime + 0.05);
          const pointToDelete = currentOrPastPoints.length > 0
            ? currentOrPastPoints[currentOrPastPoints.length - 1]
            : sorted[sorted.length - 1];
          if (pointToDelete) {
            onDeletePoint(activeSeries.id, pointToDelete.id);
            if (onSeekTime) {
              onSeekTime(pointToDelete.time);
            }
          }
        }
        return;
      }

      // Delete / Backspace: Delete point at current frame or hovered point
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];
        if (activeSeries && activeSeries.points.length > 0) {
          // If hovering over a point, delete that point
          if (hoveredPointTime !== null) {
            const hoveredPt = activeSeries.points.find(
              (pt) => Math.abs(pt.time - hoveredPointTime) < 0.75 / fps
            );
            if (hoveredPt) {
              onDeletePoint(activeSeries.id, hoveredPt.id);
              return;
            }
          }
          // Otherwise delete point on current frame
          const currentPoint = activeSeries.points.find(
            (pt) => Math.abs(pt.time - currentTime) < 0.75 / fps
          );
          if (currentPoint) {
            onDeletePoint(activeSeries.id, currentPoint.id);
            return;
          }
          // Fallback: delete the most recent point
          const sorted = [...activeSeries.points].sort((a, b) => a.frame - b.frame);
          const prevPoints = sorted.filter((pt) => pt.time <= currentTime + 0.05);
          const target = prevPoints[prevPoints.length - 1] || sorted[sorted.length - 1];
          if (target) {
            onDeletePoint(activeSeries.id, target.id);
          }
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseScale, seriesList, activeSeriesId, currentTime, fps, hoveredPointTime, onDeletePoint, onSeekTime]);

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

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.videoWidth && video.videoHeight) {
      setVideoDims({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    }
  };

  useEffect(() => {
    const updateDims = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDims((prev) => {
          if (prev.width === video.videoWidth && prev.height === video.videoHeight) return prev;
          return {
            width: video.videoWidth,
            height: video.videoHeight,
          };
        });
      }
    };

    updateDims();
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', updateDims);
      video.addEventListener('loadeddata', updateDims);
      video.addEventListener('canplay', updateDims);
      video.addEventListener('play', updateDims);
      video.addEventListener('timeupdate', updateDims);
      return () => {
        video.removeEventListener('loadedmetadata', updateDims);
        video.removeEventListener('loadeddata', updateDims);
        video.removeEventListener('canplay', updateDims);
        video.removeEventListener('play', updateDims);
        video.removeEventListener('timeupdate', updateDims);
      };
    }
  }, [videoUrl, videoRef]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Main Overlay Rendering (Tracker Analysis Aesthetic)
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = origin.origin.x;
    const oy = origin.origin.y;
    const rotRad = (origin.rotationDeg * Math.PI) / 180;
    const axisLen = 180;

    // 1. Draw Tracker-style Coordinate Axes with Ticks & Origin Crosshairs
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(rotRad);

    // Dashed grid lines through axes
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)'; // FizziQ blue
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(-canvas.width, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.moveTo(0, -canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Solid X Axis Arrow
    const xDir = origin.invertX ? -1 : 1;
    ctx.strokeStyle = '#2563eb'; // FizziQ royal blue
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(xDir * axisLen, 0);
    ctx.stroke();

    // X Ticks every 30px
    for (let tx = 30; tx < axisLen; tx += 30) {
      ctx.beginPath();
      ctx.moveTo(xDir * tx, -4);
      ctx.lineTo(xDir * tx, 4);
      ctx.stroke();
    }

    // X arrowhead
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(xDir * axisLen, 0);
    ctx.lineTo(xDir * (axisLen - 10), -5);
    ctx.lineTo(xDir * (axisLen - 10), 5);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('+X', xDir > 0 ? axisLen + 8 : -axisLen - 30, 4);

    // Solid Y Axis Arrow
    const yDir = origin.invertY ? -1 : 1;
    ctx.strokeStyle = '#7c3aed'; // violet Y axis
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, yDir * axisLen);
    ctx.stroke();

    // Y Ticks
    for (let ty = 30; ty < axisLen; ty += 30) {
      ctx.beginPath();
      ctx.moveTo(-4, yDir * ty);
      ctx.lineTo(4, yDir * ty);
      ctx.stroke();
    }

    // Y arrowhead
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(0, yDir * axisLen);
    ctx.lineTo(-5, yDir * (axisLen - 10));
    ctx.lineTo(5, yDir * (axisLen - 10));
    ctx.closePath();
    ctx.fill();

    ctx.fillText('+Y', -10, yDir * (axisLen + 14));

    // Rotation Handle
    if (activeTool === 'origin') {
      ctx.strokeStyle = '#d97706';
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(xDir * 80, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Origin Reticle & Label (0,0)
    ctx.strokeStyle = '#2563eb';
    ctx.fillStyle = activeTool === 'origin' ? '#2563eb' : 'rgba(37, 99, 235, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox, oy, activeTool === 'origin' ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('(0,0)', ox + 10, oy - 8);

    // 2. Draw Tracker-style Calibration Tape Measure (Only visible while in Scale Ruler mode)
    if (activeTool === 'ruler') {
      const { p1, p2, distanceInMeters } = scale;
      ctx.save();
      ctx.strokeStyle = '#059669'; // emerald tape
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // End crosshair ticks
      const drawTapeCrosshair = (p: Point2D, label: string) => {
        ctx.strokeStyle = '#059669';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(p.x - 10, p.y);
        ctx.lineTo(p.x + 10, p.y);
        ctx.moveTo(p.x, p.y - 10);
        ctx.lineTo(p.x, p.y + 10);
        ctx.stroke();
      };

      drawTapeCrosshair(p1, 'P1');
      drawTapeCrosshair(p2, 'P2');

      // Tape badge
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const rulerPixelDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const ppm = (rulerPixelDist / distanceInMeters).toFixed(1);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      const badgeText = `${distanceInMeters.toFixed(2)} m (${ppm} px/m)`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(badgeText).width;
      ctx.fillRect(midX - textWidth / 2 - 6, midY - 24, textWidth + 12, 18);
      ctx.strokeRect(midX - textWidth / 2 - 6, midY - 24, textWidth + 12, 18);

      ctx.fillStyle = '#065f46';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, midX, midY - 15);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }

    // 3. Draw Tracked Points, Trajectory Path & Stroboscopic Trails
    seriesList.forEach((series) => {
      if (!series.visible || series.points.length === 0) return;
      const points = series.points;

      // Draw Trajectory Path Line
      if (points.length > 1) {
        ctx.strokeStyle = series.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[0].px.x, points[0].px.y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].px.x, points[i].px.y);
        }
        ctx.stroke();
      }

      // Draw Points (hide past dots and labels if showDataMarkers is false)
      points.forEach((pt, index) => {
        const isCurrent = pt.frame === currentFrame || Math.abs(pt.time - currentTime) < 0.75 / fps;
        const isHovered = hoveredPointTime !== null && (Math.abs(pt.time - hoveredPointTime) < 0.75 / fps);
        const shouldDrawMarker = vectorOptions.showDataMarkers !== false || isCurrent || isHovered;

        if (shouldDrawMarker) {
          ctx.save();
          ctx.fillStyle = series.color;
          ctx.strokeStyle = isHovered || isCurrent ? '#ffffff' : '#0f172a';
          ctx.lineWidth = isHovered || isCurrent ? 2.5 : 1.5;

          const radius = isHovered ? 8 : isCurrent ? 7 : 5;

          ctx.beginPath();
          ctx.arc(pt.px.x, pt.px.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (isCurrent) {
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pt.px.x, pt.px.y, radius + 4, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Label number only if full markers are visible
          if (vectorOptions.showDataMarkers !== false) {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText(`${index + 1}`, pt.px.x + 8, pt.px.y - 6);
          }

          ctx.restore();
        }

        ctx.save();

        // 4. Tracker Physical Vector Overlays (Velocity, Acceleration, Force)
        const vScale = 16 * vectorOptions.vectorScale;
        const aScale = 2.5 * vectorOptions.vectorScale;
        const fScale = 25 * vectorOptions.vectorScale;

        // Helper to draw vector arrow
        const drawVector = (endX: number, endY: number, color: string, label: string) => {
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pt.px.x, pt.px.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(endY - pt.px.y, endX - pt.px.x);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - 8 * Math.cos(angle - Math.PI / 6), endY - 8 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(endX - 8 * Math.cos(angle + Math.PI / 6), endY - 8 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillText(label, endX + 4, endY);
        };

        // Instantaneous Velocity Vector (v)
        if (vectorOptions.showVelocity && pt.vx !== undefined && pt.vy !== undefined && (pt.v || 0) > 0.05) {
          const vxEnd = origin.invertX ? pt.px.x - pt.vx * vScale : pt.px.x + pt.vx * vScale;
          const vyEnd = origin.invertY ? pt.px.y - pt.vy * vScale : pt.px.y + pt.vy * vScale;
          drawVector(vxEnd, vyEnd, '#d97706', `v = ${pt.v?.toFixed(2)} m/s`);
        }

        // Instantaneous Acceleration Vector (a)
        if (vectorOptions.showAcceleration && pt.ax !== undefined && pt.ay !== undefined && (pt.a || 0) > 0.1) {
          const axEnd = origin.invertX ? pt.px.x - pt.ax * aScale : pt.px.x + pt.ax * aScale;
          const ayEnd = origin.invertY ? pt.px.y - pt.ay * aScale : pt.px.y + pt.ay * aScale;
          drawVector(axEnd, ayEnd, '#dc2626', `a = ${pt.a?.toFixed(2)} m/s²`);
        }

        // Net Force Vector (F_net = m * a)
        if (vectorOptions.showForce && pt.fx !== undefined && pt.fy !== undefined && (pt.f || 0) > 0.02) {
          const fxEnd = origin.invertX ? pt.px.x - pt.fx * fScale : pt.px.x + pt.fx * fScale;
          const fyEnd = origin.invertY ? pt.px.y - pt.fy * fScale : pt.px.y + pt.fy * fScale;
          drawVector(fxEnd, fyEnd, '#7c3aed', `F = ${pt.f?.toFixed(2)} N`);
        }

        ctx.restore();
      });
    });

    // 4.5. Horizontal & Vertical Reference Lines passing through the mass showing Acceleration / Deceleration
    if (vectorOptions.showAccelerationLines) {
      const activeSeries =
        seriesList.find((s) => s.id === activeSeriesId && s.visible) ||
        seriesList.find((s) => s.visible && s.points.length > 0);

      if (activeSeries && activeSeries.points.length > 0) {
        const currentPt =
          activeSeries.points.find(
            (p) => p.frame === currentFrame || Math.abs(p.time - currentTime) < 0.75 / fps
          ) || activeSeries.points[activeSeries.points.length - 1];

        if (currentPt) {
          const pxX = currentPt.px.x;
          const pxY = currentPt.px.y;
          const vx = currentPt.vx ?? 0;
          const vy = currentPt.vy ?? 0;
          const speed = currentPt.v ?? Math.hypot(vx, vy);
          const ax = currentPt.ax ?? 0;
          const ay = currentPt.ay ?? 0;
          const aTotal = currentPt.a ?? Math.hypot(ax, ay);

          // Tangential acceleration at = (vx * ax + vy * ay) / v
          const at = speed > 0.05 ? (vx * ax + vy * ay) / speed : 0;

          // X direction analysis
          const prodX = vx * ax;
          let colorX = '#0284c7'; // Sky blue (uniform)
          let labelX = 'X: Uniform (ax ≈ 0)';

          if (Math.abs(ax) >= 0.08 && Math.abs(vx) >= 0.03) {
            if (prodX > 0.03) {
              colorX = '#10b981'; // Emerald green
              labelX = `X: Accelerating (+ax = ${ax > 0 ? '+' : ''}${ax.toFixed(2)} m/s²)`;
            } else if (prodX < -0.03) {
              colorX = '#f43f5e'; // Rose red
              labelX = `X: Decelerating (ax = ${ax > 0 ? '+' : ''}${ax.toFixed(2)} m/s²)`;
            }
          }

          // Y direction analysis
          const prodY = vy * ay;
          let colorY = '#0284c7';
          let labelY = 'Y: Uniform (ay ≈ 0)';

          if (Math.abs(ay) >= 0.08 && Math.abs(vy) >= 0.03) {
            if (prodY > 0.03) {
              colorY = '#10b981';
              labelY = `Y: Accelerating (${vy < 0 ? 'Falling faster' : 'Rising faster'}, ay = ${ay > 0 ? '+' : ''}${ay.toFixed(2)} m/s²)`;
            } else if (prodY < -0.03) {
              colorY = '#f43f5e';
              labelY = `Y: Decelerating (${vy > 0 ? 'Rising to apex' : 'Braking'}, ay = ${ay > 0 ? '+' : ''}${ay.toFixed(2)} m/s²)`;
            }
          }

          // Overall tangential status
          let overallStatus = 'UNIFORM SPEED';
          let overallColor = '#0284c7';
          if (speed > 0.05 && Math.abs(at) >= 0.08) {
            if (at > 0.08) {
              overallStatus = 'ACCELERATING (Speeding Up)';
              overallColor = '#10b981';
            } else {
              overallStatus = 'DECELERATING (Slowing Down)';
              overallColor = '#f43f5e';
            }
          }

          ctx.save();

          // A. Multi-marker projection lines (ticker-tape spacing visualization)
          if (activeSeries.points.length > 1) {
            ctx.setLineDash([2, 3]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.40)';
            activeSeries.points.forEach((p) => {
              ctx.beginPath();
              ctx.moveTo(p.px.x, p.px.y);
              ctx.lineTo(p.px.x, canvas.height);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(p.px.x, p.px.y);
              ctx.lineTo(0, p.px.y);
              ctx.stroke();
            });
          }

          // B. Horizontal reference line through mass (y = pxY)
          ctx.beginPath();
          ctx.setLineDash([8, 4]);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = colorX;
          ctx.moveTo(0, pxY);
          ctx.lineTo(canvas.width, pxY);
          ctx.stroke();

          // Horizontal Directional chevrons along line
          if (Math.abs(ax) >= 0.1) {
            const xDir = (origin.invertX ? -ax : ax) > 0 ? 1 : -1;
            ctx.setLineDash([]);
            ctx.fillStyle = colorX;
            for (let x = 60; x < canvas.width - 60; x += 90) {
              if (Math.abs(x - pxX) < 45) continue;
              ctx.beginPath();
              ctx.moveTo(x, pxY - 5);
              ctx.lineTo(x + xDir * 8, pxY);
              ctx.lineTo(x, pxY + 5);
              ctx.fill();
            }
          }

          // Horizontal Edge Status Badge
          ctx.setLineDash([]);
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const textXWidth = ctx.measureText(labelX).width;
          const badgeXLeft = Math.max(10, Math.min(canvas.width - textXWidth - 24, pxX + 30));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
          ctx.beginPath();
          ctx.roundRect(badgeXLeft, Math.max(8, pxY - 24), textXWidth + 16, 20, 4);
          ctx.fill();
          ctx.strokeStyle = colorX;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = colorX;
          ctx.fillText(labelX, badgeXLeft + 8, Math.max(8, pxY - 24) + 14);

          // C. Vertical reference line through mass (x = pxX)
          ctx.beginPath();
          ctx.setLineDash([8, 4]);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = colorY;
          ctx.moveTo(pxX, 0);
          ctx.lineTo(pxX, canvas.height);
          ctx.stroke();

          // Vertical Directional chevrons along line
          if (Math.abs(ay) >= 0.1) {
            const yDir = (origin.invertY ? -ay : ay) > 0 ? 1 : -1;
            ctx.setLineDash([]);
            ctx.fillStyle = colorY;
            for (let y = 60; y < canvas.height - 60; y += 90) {
              if (Math.abs(y - pxY) < 45) continue;
              ctx.beginPath();
              ctx.moveTo(pxX - 5, y);
              ctx.lineTo(pxX, y + yDir * 8);
              ctx.lineTo(pxX + 5, y);
              ctx.fill();
            }
          }

          // Vertical Edge Status Badge
          ctx.setLineDash([]);
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const textYWidth = ctx.measureText(labelY).width;
          const badgeYTop = Math.max(10, Math.min(canvas.height - 30, pxY + 28));
          const badgeYLeft = Math.max(10, Math.min(canvas.width - textYWidth - 24, pxX - textYWidth / 2));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
          ctx.beginPath();
          ctx.roundRect(badgeYLeft, badgeYTop, textYWidth + 16, 20, 4);
          ctx.fill();
          ctx.strokeStyle = colorY;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = colorY;
          ctx.fillText(labelY, badgeYLeft + 8, badgeYTop + 14);

          // D. Mass Center Concentric Target Reticle & Floating HUD Card
          ctx.strokeStyle = overallColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pxX, pxY, 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pxX, pxY, 22, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshair ticks
          ctx.strokeStyle = overallColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pxX - 26, pxY); ctx.lineTo(pxX - 16, pxY);
          ctx.moveTo(pxX + 16, pxY); ctx.lineTo(pxX + 26, pxY);
          ctx.moveTo(pxX, pxY - 26); ctx.lineTo(pxX, pxY - 16);
          ctx.moveTo(pxX, pxY + 16); ctx.lineTo(pxX, pxY + 26);
          ctx.stroke();

          // Floating HUD Box directly beside the mass
          const hudWidth = 200;
          const hudHeight = 54;
          const hudX = pxX + 30 + hudWidth > canvas.width ? pxX - hudWidth - 30 : pxX + 30;
          const hudY = pxY - hudHeight - 20 < 10 ? pxY + 20 : pxY - hudHeight - 20;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.beginPath();
          ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 6);
          ctx.fill();
          ctx.strokeStyle = overallColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Status dot and title
          ctx.fillStyle = overallColor;
          ctx.beginPath();
          ctx.arc(hudX + 12, hudY + 15, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.fillText(overallStatus, hudX + 22, hudY + 19);

          // Velocity and acceleration readouts
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`v = ${speed.toFixed(2)} m/s`, hudX + 12, hudY + 34);
          ctx.fillText(`a = ${aTotal.toFixed(2)} m/s²`, hudX + 105, hudY + 34);
          ctx.fillText(`at = ${at > 0 ? '+' : ''}${at.toFixed(2)} m/s² (tangential)`, hudX + 12, hudY + 47);

          ctx.restore();
        }
      }
    }

    // 5. Draw Multi-Body Center of Mass (COM) Marker (Target circle with + crosshair)
    if (vectorOptions.showCenterOfMass && centerOfMassPoints.length > 0) {
      const currentCOM = centerOfMassPoints.find(
        (c) => Math.abs(c.time - currentTime) < 0.5 / fps
      ) || centerOfMassPoints[centerOfMassPoints.length - 1];

      if (currentCOM) {
        const cx = currentCOM.px.x;
        const cy = currentCOM.px.y;

        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.lineWidth = 2;

        // Outer COM circle
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crosshair reticle
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy);
        ctx.lineTo(cx + 14, cy);
        ctx.moveTo(cx, cy - 14);
        ctx.lineTo(cx, cy + 14);
        ctx.stroke();

        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`COM (V = ${currentCOM.v?.toFixed(2)} m/s)`, cx + 14, cy - 6);
        ctx.restore();
      }
    }

    // 6. Draw Autotracker Template Box, Search Window & Live Score Badge
    if (autotrackTemplate) {
      ctx.save();
      const halfW = autotrackTemplate.width / 2;
      const halfH = autotrackTemplate.height / 2;
      const lastPt = lastMatchResult?.bestPoint || autotrackTemplate.centerPx;

      // Search Window Box (dashed amber)
      const searchR = autotrackConfig.searchRadius;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(lastPt.x - searchR, lastPt.y - searchR, searchR * 2, searchR * 2);
      ctx.setLineDash([]);

      // Current template location box (high-visibility cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(lastPt.x - halfW, lastPt.y - halfH, autotrackTemplate.width, autotrackTemplate.height);

      // Small center crosshair
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lastPt.x - 5, lastPt.y);
      ctx.lineTo(lastPt.x + 5, lastPt.y);
      ctx.moveTo(lastPt.x, lastPt.y - 5);
      ctx.lineTo(lastPt.x, lastPt.y + 5);
      ctx.stroke();

      // Score badge
      if (lastMatchResult?.score !== undefined) {
        const scorePct = Math.round(lastMatchResult.score * 100);
        const badgeLabel = `${scorePct}% Match`;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        const textW = ctx.measureText(badgeLabel).width;
        ctx.fillStyle = scorePct >= autotrackConfig.threshold * 100 ? '#059669' : '#dc2626';
        ctx.fillRect(lastPt.x - textW / 2 - 4, lastPt.y - halfH - 16, textW + 8, 14);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLabel, lastPt.x, lastPt.y - halfH - 9);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }

      ctx.restore();
    }

    // 7. Interactive Crosshair Reticle when hovering
    if (mousePos && (activeTool === 'track' || isSelectingAutotrackFeature)) {
      ctx.save();
      ctx.strokeStyle = isSelectingAutotrackFeature ? '#ef4444' : '#2563eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, canvas.height);
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(canvas.width, mousePos.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [
    origin,
    scale,
    activeTool,
    seriesList,
    currentTime,
    currentFrame,
    fps,
    vectorOptions,
    centerOfMassPoints,
    autotrackTemplate,
    autotrackConfig,
    lastMatchResult,
    isSelectingAutotrackFeature,
    hoveredPointTime,
    mousePos,
  ]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Right-click (button === 2) on ANY point deletes it immediately in ANY mode!
    if (e.button === 2) {
      for (const series of seriesList) {
        for (const pt of series.points) {
          const dist = Math.hypot(coords.x - pt.px.x, coords.y - pt.px.y);
          if (dist < 18) {
            onDeletePoint(series.id, pt.id);
            return;
          }
        }
      }
      return;
    }

    // Only process primary left button for normal tools
    if (e.button !== 0) return;

    // Feature selection for Autotracker
    if (isSelectingAutotrackFeature) {
      onSelectFeaturePoint(coords);
      return;
    }

    // Scale Ruler dragging
    if (activeTool === 'ruler') {
      const distP1 = Math.hypot(coords.x - scale.p1.x, coords.y - scale.p1.y);
      const distP2 = Math.hypot(coords.x - scale.p2.x, coords.y - scale.p2.y);
      if (distP1 < 28) {
        setDragTarget({ type: 'ruler_p1' });
        return;
      }
      if (distP2 < 28) {
        setDragTarget({ type: 'ruler_p2' });
        return;
      }
      const distLine = distToSegment(coords, scale.p1, scale.p2);
      if (distLine < 20) {
        setDragTarget({
          type: 'ruler_tape',
          startCoords: coords,
          initialP1: { ...scale.p1 },
          initialP2: { ...scale.p2 },
        });
        return;
      }
      onUpdateScale({
        ...scale,
        p1: coords,
        p2: coords,
        isCalibrated: true,
      });
      setDragTarget({ type: 'ruler_p2' });
      return;
    }

    // Origin dragging
    if (activeTool === 'origin') {
      const distOrig = Math.hypot(coords.x - origin.origin.x, coords.y - origin.origin.y);
      if (distOrig < 25) {
        setDragTarget({ type: 'origin' });
        return;
      }
      const rotRad = (origin.rotationDeg * Math.PI) / 180;
      const rotHandleX = origin.origin.x + 80 * Math.cos(rotRad);
      const rotHandleY = origin.origin.y + 80 * Math.sin(rotRad);
      const distRot = Math.hypot(coords.x - rotHandleX, coords.y - rotHandleY);
      if (distRot < 20) {
        setDragTarget({ type: 'origin_rot' });
        return;
      }
      onUpdateOrigin({ ...origin, origin: coords });
      return;
    }

    // Delete mode
    if (activeTool === 'delete') {
      for (const series of seriesList) {
        for (const pt of series.points) {
          const dist = Math.hypot(coords.x - pt.px.x, coords.y - pt.px.y);
          if (dist < 15) {
            onDeletePoint(series.id, pt.id);
            return;
          }
        }
      }
      return;
    }

    // Manual Track mode
    if (activeTool === 'track') {
      const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];
      // Only drag point if clicking directly on the CURRENT frame's point
      const currentPoint = activeSeries?.points.find(
        (pt) => Math.abs(pt.time - currentTime) < 0.5 / fps
      );
      if (currentPoint && Math.hypot(coords.x - currentPoint.px.x, coords.y - currentPoint.px.y) < 14) {
        setDragTarget({ type: 'point', pointId: currentPoint.id, seriesId: activeSeriesId });
        return;
      }

      // Record point for current frame and step forward
      onAddPoint(activeSeriesId, coords);
      onStepFrame(advanceStep);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setMousePos(coords);

    if (dragTarget) {
      if (dragTarget.type === 'ruler_p1') {
        onUpdateScale({ ...scale, p1: coords, isCalibrated: true });
      } else if (dragTarget.type === 'ruler_p2') {
        onUpdateScale({ ...scale, p2: coords, isCalibrated: true });
      } else if (dragTarget.type === 'ruler_tape' && dragTarget.startCoords && dragTarget.initialP1 && dragTarget.initialP2) {
        const dx = coords.x - dragTarget.startCoords.x;
        const dy = coords.y - dragTarget.startCoords.y;
        onUpdateScale({
          ...scale,
          p1: { x: dragTarget.initialP1.x + dx, y: dragTarget.initialP1.y + dy },
          p2: { x: dragTarget.initialP2.x + dx, y: dragTarget.initialP2.y + dy },
          isCalibrated: true,
        });
      } else if (dragTarget.type === 'origin') {
        onUpdateOrigin({ ...origin, origin: coords });
      } else if (dragTarget.type === 'origin_rot') {
        const dx = coords.x - origin.origin.x;
        const dy = coords.y - origin.origin.y;
        const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
        onUpdateOrigin({ ...origin, rotationDeg: deg });
      } else if (dragTarget.type === 'point' && dragTarget.pointId && dragTarget.seriesId) {
        onUpdatePoint(dragTarget.seriesId, dragTarget.pointId, coords);
      }
      return;
    }

    let foundHoverTime: number | null = null;
    for (const series of seriesList) {
      for (const pt of series.points) {
        const dist = Math.hypot(coords.x - pt.px.x, coords.y - pt.px.y);
        if (dist < 10) {
          foundHoverTime = pt.time;
          break;
        }
      }
      if (foundHoverTime !== null) break;
    }
    onHoverPoint(foundHoverTime);
  };

  const handleMouseUp = () => {
    if (dragTarget?.type === 'ruler_p2') {
      const len = Math.hypot(scale.p2.x - scale.p1.x, scale.p2.y - scale.p1.y);
      if (len < 15) {
        onUpdateScale({
          ...scale,
          p2: { x: scale.p1.x + 200, y: scale.p1.y },
          isCalibrated: true,
        });
      }
    }
    setDragTarget(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden select-none border-b border-slate-200"
    >
      <div
        className="relative max-w-full max-h-full flex items-center justify-center"
        style={{ aspectRatio: `${videoDims.width} / ${videoDims.height}` }}
      >
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          playsInline
          muted
          crossOrigin="anonymous"
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-fill pointer-events-none shadow-lg"
        />

        <canvas
          ref={canvasRef}
          width={videoDims.width}
          height={videoDims.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          onMouseLeave={() => {
            setMousePos(null);
            setDragTarget(null);
            onHoverPoint(null);
          }}
          className={`absolute inset-0 w-full h-full z-10 ${
            isSelectingAutotrackFeature
              ? 'cursor-crosshair'
              : activeTool === 'track'
              ? 'cursor-crosshair'
              : activeTool === 'ruler'
              ? dragTarget ? 'cursor-grabbing' : 'cursor-crosshair'
              : activeTool === 'origin'
              ? 'cursor-move'
              : activeTool === 'delete'
              ? 'cursor-not-allowed'
              : 'cursor-default'
          }`}
        />

        {/* Subpixel Loupe Magnifier (Active in Track and Ruler calibration modes) */}
        {(activeTool === 'track' || activeTool === 'ruler') && mousePos && !isSelectingAutotrackFeature && (
          <LoupeMagnifier
            cursorPos={mousePos}
            videoElement={videoRef.current}
            canvasElement={canvasRef.current}
            zoom={2.5}
            size={110}
          />
        )}

        {/* Interactive Floating Scale Ruler Badge Directly Over Tape Measure (Only in Ruler mode) */}
        {activeTool === 'ruler' && (
          <div
            className="absolute z-20 pointer-events-auto flex items-center gap-1.5 bg-white/95 px-3 py-1 rounded-full border border-emerald-500 shadow-md text-xs text-emerald-900 font-mono font-bold transform -translate-x-1/2 -translate-y-full hover:scale-105 transition cursor-pointer"
            style={{
              left: `${((scale.p1.x + scale.p2.x) / 2 / videoDims.width) * 100}%`,
              top: `${Math.max(6, Math.min(94, ((scale.p1.y + scale.p2.y) / 2 / videoDims.height) * 100 - 3))}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCloseScale();
            }}
            title="Click to close scale calibration"
          >
            <span>📏</span>
            <span>
              {scale.displayValue !== undefined ? scale.displayValue : scale.distanceInMeters} {scale.unit || 'm'}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-sans font-semibold">
              Calibrating
            </span>
          </div>
        )}

        {/* Inline Calibration Popover (Only when clicked from badge outside Ruler mode) */}
        {showScaleModal && activeTool !== 'ruler' && (
          <div
            className="absolute z-30 bg-white/95 text-slate-800 p-3 rounded-xl shadow-2xl border border-emerald-400 flex flex-col gap-2 transform -translate-x-1/2 backdrop-blur-xs"
            style={{
              left: `${((scale.p1.x + scale.p2.x) / 2 / videoDims.width) * 100}%`,
              top: `${Math.min(82, ((scale.p1.y + scale.p2.y) / 2 / videoDims.height) * 100 + 4)}%`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-emerald-800 border-b border-slate-200 pb-1.5">
              <span>📏 Scale Ruler Calibration</span>
              <button
                type="button"
                onClick={handleCloseScale}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <label className="text-slate-600 font-medium">Real Length:</label>
              <input
                type="number"
                min="0.001"
                step="0.1"
                value={scaleVal}
                onChange={(e) => {
                  setScaleVal(e.target.value);
                  handleApplyScale(e.target.value, scaleUnit);
                }}
                className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                autoFocus
              />
              <select
                value={scaleUnit}
                onChange={(e) => {
                  const u = e.target.value as any;
                  setScaleUnit(u);
                  handleApplyScale(scaleVal, u);
                }}
                className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="m">m (meters)</option>
                <option value="cm">cm (centimeters)</option>
                <option value="mm">mm (millimeters)</option>
                <option value="ft">ft (feet)</option>
                <option value="in">in (inches)</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 max-w-[200px]">
              Drag endpoints P1 and P2 across reference ruler. All kinematics and graph axes update automatically.
            </p>
            <button
              type="button"
              onClick={handleCloseScale}
              className="w-full py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Prominent Active Ruler Calibration Top Banner (Never blocks the video ruler) */}
      {activeTool === 'ruler' && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 text-slate-800 px-4 py-2 rounded-2xl shadow-2xl border-2 border-emerald-500 flex flex-wrap items-center gap-3 text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <Ruler className="w-4 h-4 text-emerald-600" />
            <span>Calibrate Scale:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Real Length:</span>
            <input
              type="number"
              min="0.001"
              step="0.1"
              value={scaleVal}
              onChange={(e) => {
                setScaleVal(e.target.value);
                handleApplyScale(e.target.value, scaleUnit);
              }}
              className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
            />
            <select
              value={scaleUnit}
              onChange={(e) => {
                const u = e.target.value as any;
                setScaleUnit(u);
                handleApplyScale(scaleVal, u);
              }}
              className="bg-slate-50 border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="m">m</option>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
              <option value="ft">ft</option>
              <option value="in">in</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-emerald-700 font-semibold hidden md:inline">
            ({(Math.hypot(scale.p2.x - scale.p1.x, scale.p2.y - scale.p1.y) / scale.distanceInMeters).toFixed(1)} px/m)
          </span>

          <span className="text-[11px] text-slate-500 hidden xl:inline">
            • Drag P1 / P2 or tape line to fit ruler
          </span>

          {onResetScaleToDefault && (
            <button
              type="button"
              onClick={onResetScaleToDefault}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-semibold transition"
              title="Reset ruler coordinates to video's reference markers"
            >
              Fit Default Ruler
            </button>
          )}

          <button
            type="button"
            onClick={handleCloseScale}
            className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            title="Save scale and start tracking points"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done (Start Tracking)</span>
          </button>

          <button
            type="button"
            onClick={handleCloseScale}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close scale calibration and return to tracking"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Prominent Autotracker Feature Selection Directive Banner */}
      {isSelectingAutotrackFeature && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs font-bold animate-pulse border-2 border-white">
          <Sparkles className="w-4 h-4" />
          <span>Click directly on the target object (ball, cart, puck) on video to lock feature</span>
          {onCancelSelectFeature && (
            <button
              onClick={onCancelSelectFeature}
              className="px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-[11px] font-semibold transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Floating Origin Toolbar (when in Origin mode) */}
      {activeTool === 'origin' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 px-3.5 py-1.5 rounded-full flex items-center gap-3 shadow-lg border border-slate-300 text-xs text-slate-800">
          <span className="font-bold text-blue-700">Coordinate Axes:</span>
          <button
            onClick={() => onUpdateOrigin({ ...origin, invertX: !origin.invertX })}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition font-medium border ${
              origin.invertX
                ? 'bg-blue-100 border-blue-400 text-blue-800 font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Flip X-axis direction (toggle between +X Right and +X Left)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>{origin.invertX ? '+X Left (Flipped)' : '+X Right (Standard)'}</span>
          </button>

          <button
            onClick={() => onUpdateOrigin({ ...origin, invertY: !origin.invertY })}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition font-medium border ${
              origin.invertY
                ? 'bg-purple-100 border-purple-400 text-purple-800 font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title="Flip Y-axis direction (toggle between +Y Up and +Y Down)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
            <span>{origin.invertY ? '+Y Up (Standard)' : '+Y Down'}</span>
          </button>

          <button
            onClick={() => onUpdateOrigin({ ...origin, rotationDeg: 0 })}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition font-medium"
          >
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span>Reset 0°</span>
          </button>
        </div>
      )}

      {/* End of Video Notice in Manual Track Mode */}
      {activeTool === 'track' && duration > 0 && currentTime >= duration - 0.5 / fps && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white px-4 py-2 rounded-xl shadow-2xl border border-slate-600 flex items-center gap-3 text-xs backdrop-blur-md animate-in fade-in">
          <span className="text-amber-400 font-semibold">End of video reached.</span>
          {onSeekToStart && (
            <button
              onClick={onSeekToStart}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 transition shadow-sm"
              title="Rewind video to frame 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rewind to Start (t=0)</span>
            </button>
          )}
          {onResetPoints && (
            <button
              onClick={onResetPoints}
              className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-semibold transition"
              title="Clear tracked points"
            >
              Clear Points
            </button>
          )}
        </div>
      )}

      {/* Quick Launch Autotracker Badge on Video */}
      <div className="absolute bottom-3 right-3 z-30">
        <button
          onClick={onOpenAutotrack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
          title="Open Automated Tracking Panel"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autotracker</span>
        </button>
      </div>
    </div>
  );
};

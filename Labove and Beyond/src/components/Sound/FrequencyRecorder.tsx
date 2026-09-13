import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Download,
  BookOpen,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  Sliders,
  Radio,
  Gauge,
  HelpCircle,
} from 'lucide-react';
import { FrequencyHistoryRecord, NotebookCard } from '../../types/physics';
import { exportFrequencyToCsv } from '../../utils/exportUtils';

export function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  if (freq < 15 || !Number.isFinite(freq)) return { note: '--', octave: 0, cents: 0 };
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(semitones) + 69;
  const noteName = noteNames[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const exactNoteFreq = A4 * Math.pow(2, (midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(freq / exactNoteFreq));
  return { note: noteName, octave, cents };
}

export interface FrequencyRecorderProps {
  currentFreq: number; // Current instantaneous frequency in Hz
  currentDb?: number; // Current sound amplitude in dB SPL
  isListening?: boolean;
  onStartAudio?: () => void;
  onStopAudio?: () => void;
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
  title?: string;
  subtitle?: string;
  allowSimulations?: boolean;
  onSimulateFreq?: (freq: number) => void;
}

export const FrequencyRecorder: React.FC<FrequencyRecorderProps> = ({
  currentFreq,
  currentDb = -30,
  isListening = false,
  onStartAudio,
  onStopAudio,
  onAddToNotebook,
  title = 'Frequency as a Function of Time f(t)',
  subtitle = 'Real-time fundamental acoustic frequency tracking, f(t) time series graph, and CSV export',
  allowSimulations = false,
  onSimulateFreq,
}) => {
  // Toggle: Instantaneous f0 vs. Frequency vs. Time f(t) Graph
  const [displayMode, setDisplayMode] = useState<'instantaneous' | 'timeSeries'>('timeSeries');

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [records, setRecords] = useState<FrequencyHistoryRecord[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Frequency Graph Scale & Preset
  const [freqScale, setFreqScale] = useState<'voice' | 'music' | 'full' | 'auto'>('auto');

  // Modern Curve Smoothing & High FPS Animation
  const [curveSmoothing, setCurveSmoothing] = useState<boolean>(true);
  const [fpsLive, setFpsLive] = useState<number>(60);

  // Simulation generator (Doppler, Chirp, Vibrato)
  const [simType, setSimType] = useState<'none' | 'doppler' | 'chirp' | 'vibrato'>('none');
  const [simBaseFreq, setSimBaseFreq] = useState<number>(440);
  const [simSourceSpeed, setSimSourceSpeed] = useState<number>(25); // m/s for Doppler

  // Mouse Inspection
  const [hoveredPoint, setHoveredPoint] = useState<{ time: number; freq: number; note: string; x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // High-performance refs for 60/120/144 FPS requestAnimationFrame rendering
  const recordsBufferRef = useRef<FrequencyHistoryRecord[]>(records);
  const elapsedTimeRef = useRef<number>(elapsedTime);
  const currentFreqRef = useRef<number>(currentFreq);
  currentFreqRef.current = currentFreq;
  const currentDbRef = useRef<number>(currentDb);
  currentDbRef.current = currentDb;
  const freqScaleRef = useRef<'voice' | 'music' | 'full' | 'auto'>(freqScale);
  freqScaleRef.current = freqScale;
  const curveSmoothingRef = useRef<boolean>(curveSmoothing);
  curveSmoothingRef.current = curveSmoothing;
  const hoveredPointRef = useRef<{ time: number; freq: number; note: string; x: number; y: number } | null>(hoveredPoint);
  hoveredPointRef.current = hoveredPoint;

  // Active note representation
  const activeNote = useMemo(() => frequencyToNote(currentFreq), [currentFreq]);

  // Handle Recording Timer & High-Density Sampling (60 Hz / ~16ms) decoupled from React component renders
  useEffect(() => {
    if (!isRecording || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalMs = 16; // 60 Hz recording rate for ultra-smooth capture
    let lastSyncTime = performance.now();

    timerRef.current = setInterval(() => {
      const now = performance.now();
      elapsedTimeRef.current = Math.round((elapsedTimeRef.current + intervalMs / 1000) * 1000) / 1000;
      const nextTime = elapsedTimeRef.current;

      // Sample current frequency if valid
      const fNow = currentFreqRef.current;
      const freqToRecord = fNow > 15 ? fNow : 0;
      const noteInfo = frequencyToNote(freqToRecord);

      recordsBufferRef.current.push({
        time: nextTime,
        frequency: freqToRecord,
        note: noteInfo.note !== '--' ? `${noteInfo.note}${noteInfo.octave}` : '--',
        cents: noteInfo.cents,
        decibels: currentDbRef.current,
      });

      // Throttle React state updates to 10 Hz (every 100ms) to eliminate React re-render lag
      if (now - lastSyncTime >= 100) {
        setElapsedTime(nextTime);
        setRecords([...recordsBufferRef.current]);
        lastSyncTime = now;
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(elapsedTimeRef.current);
      setRecords([...recordsBufferRef.current]);
    };
  }, [isRecording, isPaused]);

  // Simulation physics loop (if active)
  useEffect(() => {
    if (simType === 'none' || !onSimulateFreq) return;

    let animFrame: number;
    let startSimTime = performance.now();

    const loop = (now: number) => {
      const t = (now - startSimTime) / 1000; // seconds
      let f = simBaseFreq;

      if (simType === 'doppler') {
        // Source moving past observer at x = 0 with speed vs
        // Position x(t) = -50 + vs * t
        const vSound = 343;
        const d = 5; // observer distance from road in meters
        const x = -40 + simSourceSpeed * (t % 6);
        const cosTheta = x / Math.hypot(x, d);
        // Observed frequency: f_obs = f0 * (v / (v - vs * cosTheta))
        f = simBaseFreq * (vSound / (vSound - simSourceSpeed * cosTheta));
      } else if (simType === 'chirp') {
        // Linear frequency sweep from baseFreq to baseFreq + 600 Hz over 4 seconds
        const k = 150; // Hz/s
        f = simBaseFreq + ((t * k) % 600);
      } else if (simType === 'vibrato') {
        // Vibrato modulation at 6 Hz rate, 25 Hz amplitude
        f = simBaseFreq + 25 * Math.sin(2 * Math.PI * 5.5 * t);
      }

      onSimulateFreq(Math.round(f * 10) / 10);
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [simType, simBaseFreq, simSourceSpeed, onSimulateFreq]);

  // Erase and Restart
  const handleEraseAndRestart = () => {
    recordsBufferRef.current = [];
    elapsedTimeRef.current = 0;
    setRecords([]);
    setElapsedTime(0);
    setIsRecording(true);
    setIsPaused(false);
  };

  // Stop Recording
  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecords([...recordsBufferRef.current]);
    setElapsedTime(elapsedTimeRef.current);
  };

  // Toggle Pause/Resume
  const handleTogglePause = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPaused(false);
    } else {
      setIsPaused((prev) => {
        if (!prev) {
          setRecords([...recordsBufferRef.current]);
          setElapsedTime(elapsedTimeRef.current);
        }
        return !prev;
      });
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const dataToExport = recordsBufferRef.current.length > 0 ? recordsBufferRef.current : records;
    if (dataToExport.length === 0) {
      alert('No recorded frequency data to export. Click Record to capture data first.');
      return;
    }
    const filename = `frequency_vs_time_${Date.now()}.csv`;
    exportFrequencyToCsv(dataToExport, filename);
  };

  // Summary Statistics
  const stats = useMemo(() => {
    const recsToUse = recordsBufferRef.current.length > 0 ? recordsBufferRef.current : records;
    const validRecs = recsToUse.filter((r) => r.frequency > 15);
    if (validRecs.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        count: recsToUse.length,
        duration: elapsedTime,
      };
    }
    const freqs = validRecs.map((r) => r.frequency);
    const min = Math.min(...freqs);
    const max = Math.max(...freqs);
    const avg = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    return {
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      avg: Math.round(avg * 10) / 10,
      count: recsToUse.length,
      duration: elapsedTime,
    };
  }, [records, elapsedTime]);

  // Render Frequency vs Time Canvas Graph at 60/120/144 FPS via requestAnimationFrame
  useEffect(() => {
    if (displayMode !== 'timeSeries') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    const frameTimes: number[] = [];
    let lastFpsUpdate = performance.now();

    const render = (now: number) => {
      // Calculate real-time FPS
      const dt = now - lastTime;
      lastTime = now;
      if (dt > 0) {
        frameTimes.push(1000 / dt);
        if (frameTimes.length > 30) frameTimes.shift();
      }
      if (now - lastFpsUpdate > 350 && frameTimes.length > 0) {
        const measured = Math.round(frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length);
        setFpsLive(Math.min(144, Math.max(15, measured)));
        lastFpsUpdate = now;
      }

      // Handle Retina / High-DPI display scaling for razor-sharp rendering
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = Math.max(300, Math.round(rect.width));
      const displayH = Math.max(200, Math.round(rect.height));

      if (canvas.width !== Math.round(displayW * dpr) || canvas.height !== Math.round(displayH * dpr)) {
        canvas.width = Math.round(displayW * dpr);
        canvas.height = Math.round(displayH * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const w = displayW;
      const h = displayH;

      ctx.clearRect(0, 0, w, h);

      // Modern publication-grade pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const padLeft = 68;
      const padRight = 36;
      const padTop = 28;
      const padBottom = 38;
      const plotW = Math.max(10, w - padLeft - padRight);
      const plotH = Math.max(10, h - padTop - padBottom);

      const recs = recordsBufferRef.current;
      const elTime = elapsedTimeRef.current;
      const cFreq = currentFreqRef.current;
      const fScale = freqScaleRef.current;
      const isSmooth = curveSmoothingRef.current;
      const hPoint = hoveredPointRef.current;

      // Determine Y range (Frequency Hz)
      let yMin = 0;
      let yMax = 1000;

      if (fScale === 'voice') {
        yMin = 50;
        yMax = 1200;
      } else if (fScale === 'music') {
        yMin = 50;
        yMax = 3500;
      } else if (fScale === 'full') {
        yMin = 20;
        yMax = 8000;
      } else {
        // Auto-scale with smooth bounds
        const validRecs = recs.filter((r) => r.frequency > 15);
        if (validRecs.length > 0) {
          const maxCaptured = Math.max(...validRecs.map((r) => r.frequency));
          const minCaptured = Math.min(...validRecs.map((r) => r.frequency));
          yMax = Math.max(500, Math.ceil((maxCaptured * 1.25) / 100) * 100);
          yMin = Math.max(0, Math.floor((minCaptured * 0.75) / 50) * 50);
        } else {
          yMax = 1000;
          yMin = 0;
        }
      }

      // Determine X range (Time seconds)
      const maxTime = Math.max(10, elTime + 0.5);
      const minTime = Math.max(0, maxTime - 20); // 20s scrolling window
      const tSpan = Math.max(0.1, maxTime - minTime);

      // Horizontal Frequency Grids
      const ySteps = 5;
      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';

      for (let i = 0; i <= ySteps; i++) {
        const fVal = yMin + (i * (yMax - yMin)) / ySteps;
        const py = padTop + plotH - ((fVal - yMin) / (yMax - yMin)) * plotH;

        ctx.strokeStyle = i === 0 ? '#cbd5e1' : '#f1f5f9';
        ctx.lineWidth = i === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, py);
        ctx.lineTo(padLeft + plotW, py);
        ctx.stroke();

        ctx.fillText(`${Math.round(fVal)} Hz`, padLeft - 8, py + 3.5);
      }

      // Musical Landmark Guides (C4 = 261.6 Hz, A4 = 440 Hz, C5 = 523.3 Hz, A5 = 880 Hz)
      const landmarks = [
        { f: 261.6, note: 'C4' },
        { f: 440.0, note: 'A4' },
        { f: 523.3, note: 'C5' },
        { f: 880.0, note: 'A5' },
      ];

      landmarks.forEach((lm) => {
        if (lm.f >= yMin && lm.f <= yMax) {
          const py = padTop + plotH - ((lm.f - yMin) / (yMax - yMin)) * plotH;
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.28)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(padLeft, py);
          ctx.lineTo(padLeft + plotW, py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Modern Pitch Tag Badge on right
          const badgeW = 24;
          const badgeH = 15;
          const badgeX = padLeft + plotW + 5;
          const badgeY = py - 7.5;
          ctx.fillStyle = '#eef2ff';
          ctx.strokeStyle = '#c7d2fe';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#4338ca';
          ctx.textAlign = 'center';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillText(lm.note, badgeX + badgeW / 2, badgeY + 11);
        }
      });

      // Vertical Time Grids
      const xSteps = 5;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px JetBrains Mono, monospace';

      for (let i = 0; i <= xSteps; i++) {
        const tVal = minTime + (i * tSpan) / xSteps;
        const px = padLeft + ((tVal - minTime) / tSpan) * plotW;

        ctx.strokeStyle = i === 0 ? '#cbd5e1' : '#f1f5f9';
        ctx.lineWidth = i === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(px, padTop);
        ctx.lineTo(px, padTop + plotH);
        ctx.stroke();

        ctx.fillText(`${tVal.toFixed(1)}s`, px, padTop + plotH + 16);
      }

      // Axis Titles with modern typography
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Time t (seconds)', padLeft + plotW / 2, h - 8);

      ctx.save();
      ctx.translate(16, padTop + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Frequency f(t) [Hz]', 0, 0);
      ctx.restore();

      // Plot Recorded Data Points & Curve
      if (recs.length > 1) {
        // Collect visible active coordinates
        const activePoints: { x: number; y: number; f: number; t: number }[] = [];

        recs.forEach((pt) => {
          if (pt.time < minTime || pt.time > maxTime) return;
          if (pt.frequency <= 15) return;

          const px = padLeft + ((pt.time - minTime) / tSpan) * plotW;
          const py = padTop + plotH - ((pt.frequency - yMin) / (yMax - yMin)) * plotH;
          activePoints.push({ x: px, y: py, f: pt.frequency, t: pt.time });
        });

        if (activePoints.length >= 2) {
          // Helper: Catmull-Rom cubic spline interpolation path
          const buildSplinePath = () => {
            ctx.beginPath();
            ctx.moveTo(activePoints[0].x, activePoints[0].y);

            if (!isSmooth || activePoints.length < 3) {
              for (let i = 1; i < activePoints.length; i++) {
                ctx.lineTo(activePoints[i].x, activePoints[i].y);
              }
            } else {
              const tension = 0.35;
              for (let i = 0; i < activePoints.length - 1; i++) {
                const p0 = i > 0 ? activePoints[i - 1] : activePoints[i];
                const p1 = activePoints[i];
                const p2 = activePoints[i + 1];
                const p3 = i < activePoints.length - 2 ? activePoints[i + 2] : p2;

                const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
                const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
                const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
                const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
              }
            }
          };

          // 1. Sleek Gradient Fill Under Curve
          ctx.save();
          buildSplinePath();
          ctx.lineTo(activePoints[activePoints.length - 1].x, padTop + plotH);
          ctx.lineTo(activePoints[0].x, padTop + plotH);
          ctx.closePath();
          const fillGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
          fillGrad.addColorStop(0, 'rgba(37, 99, 235, 0.16)');
          fillGrad.addColorStop(0.7, 'rgba(37, 99, 235, 0.04)');
          fillGrad.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
          ctx.fillStyle = fillGrad;
          ctx.fill();
          ctx.restore();

          // 2. High-definition Sapphire Spline Stroke with soft glow
          ctx.save();
          ctx.shadowColor = 'rgba(37, 99, 235, 0.22)';
          ctx.shadowBlur = 6;
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2.5;
          buildSplinePath();
          ctx.stroke();
          ctx.restore();

          // 3. Crisp Data Point Halos (subsampled cleanly if dense)
          const stride = activePoints.length > 120 ? 4 : activePoints.length > 60 ? 2 : 1;
          for (let i = 0; i < activePoints.length; i += stride) {
            const pt = activePoints[i];
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw Live Reticle for Current Instantaneous Value with 60/120/144 FPS Animated Pulse
      if (cFreq > 15) {
        const liveX = padLeft + ((elTime - minTime) / tSpan) * plotW;
        const liveY = padTop + plotH - ((cFreq - yMin) / (yMax - yMin)) * plotH;

        if (liveX >= padLeft && liveX <= padLeft + plotW && liveY >= padTop && liveY <= padTop + plotH) {
          // Central glowing reticle dot
          ctx.save();
          ctx.shadowColor = 'rgba(37, 99, 235, 0.35)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(liveX, liveY, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Smooth Expanding Pulse Wave
          const pulsePhase = (now % 1000) / 1000;
          const pulseRadius = 5 + pulsePhase * 16;
          const pulseAlpha = (1 - pulsePhase) * 0.65;
          ctx.strokeStyle = `rgba(37, 99, 235, ${pulseAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(liveX, liveY, pulseRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // Draw Hover Crosshair & Modern Tooltip Card
      if (hPoint) {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(hPoint.x, padTop);
        ctx.lineTo(hPoint.x, padTop + plotH);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(padLeft, hPoint.y);
        ctx.lineTo(padLeft + plotW, hPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tooltip Card
        const tipText = `t = ${hPoint.time.toFixed(2)}s | f = ${hPoint.freq.toFixed(1)} Hz (${hPoint.note})`;
        ctx.font = '500 11px JetBrains Mono, monospace';
        const textW = ctx.measureText(tipText).width + 20;
        let tipX = hPoint.x + 10;
        if (tipX + textW > padLeft + plotW) tipX = hPoint.x - textW - 10;
        let tipY = hPoint.y - 30;
        if (tipY < padTop) tipY = hPoint.y + 14;

        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(tipX, tipY, textW, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.fillText(tipText, tipX + 10, tipY + 17);
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [displayMode]);

  // Handle Canvas Mouse Move for Tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const allRecs = recordsBufferRef.current;
    if (!canvas || allRecs.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padLeft = 68;
    const padRight = 36;
    const padTop = 28;
    const padBottom = 38;
    const plotW = Math.max(10, rect.width - padLeft - padRight);
    const plotH = Math.max(10, rect.height - padTop - padBottom);

    if (x < padLeft || x > padLeft + plotW || y < padTop || y > padTop + plotH) {
      setHoveredPoint(null);
      return;
    }

    const maxTime = Math.max(10, elapsedTimeRef.current + 0.5);
    const minTime = Math.max(0, maxTime - 20);
    const tSpan = Math.max(0.1, maxTime - minTime);
    const hoverT = minTime + ((x - padLeft) / plotW) * tSpan;

    // Find closest recorded point (reverse search for speed)
    let closest: FrequencyHistoryRecord | null = null;
    let minDist = Infinity;

    for (let i = allRecs.length - 1; i >= 0; i--) {
      const r = allRecs[i];
      if (r.time < minTime - 1) break;
      const d = Math.abs(r.time - hoverT);
      if (d < minDist) {
        minDist = d;
        closest = r;
      }
    }

    if (closest) {
      const targetRecord: FrequencyHistoryRecord = closest;
      if (minDist < 1.5 && targetRecord.frequency > 15) {
        let yMin = 0;
        let yMax = 1000;
        if (freqScale === 'voice') { yMin = 50; yMax = 1200; }
        else if (freqScale === 'music') { yMin = 50; yMax = 3500; }
        else if (freqScale === 'full') { yMin = 20; yMax = 8000; }
        else {
          const validRecs = allRecs.filter((r) => r.frequency > 15);
          if (validRecs.length > 0) {
            const maxCaptured = Math.max(...validRecs.map((r) => r.frequency));
            const minCaptured = Math.min(...validRecs.map((r) => r.frequency));
            yMax = Math.max(500, Math.ceil((maxCaptured * 1.25) / 100) * 100);
            yMin = Math.max(0, Math.floor((minCaptured * 0.75) / 50) * 50);
          }
        }

        const px = padLeft + ((targetRecord.time - minTime) / tSpan) * plotW;
        const py = padTop + plotH - ((targetRecord.frequency - yMin) / (yMax - yMin)) * plotH;

        setHoveredPoint({
          time: targetRecord.time,
          freq: targetRecord.frequency,
          note: targetRecord.note,
          x: px,
          y: py,
        });
        return;
      }
    }
    setHoveredPoint(null);
  };

  const handleSaveToNotebook = () => {
    if (!onAddToNotebook) return;
    const canvas = canvasRef.current;
    const imgUrl = canvas ? canvas.toDataURL('image/png') : undefined;
    const recsToUse = recordsBufferRef.current.length > 0 ? recordsBufferRef.current : records;
    const curTime = elapsedTimeRef.current;

    onAddToNotebook({
      type: 'sound',
      title: `Acoustic Frequency as a Function of Time f(t)`,
      content: `Recorded ${recsToUse.length} frequency samples over ${curTime.toFixed(1)} seconds. Average fundamental frequency f_avg = ${stats.avg} Hz (Range: ${stats.min} - ${stats.max} Hz). Pitch range spans ${activeNote.note}${activeNote.octave}.`,
      imageUrl: imgUrl,
      dataSnippet: {
        'Average Frequency': `${stats.avg} Hz`,
        'Min Frequency': `${stats.min} Hz`,
        'Max Frequency': `${stats.max} Hz`,
        'Pitch Range': `${activeNote.note}${activeNote.octave}`,
        'Sample Count': `${recsToUse.length} samples`,
        'Elapsed Time': `${curTime.toFixed(1)} s`,
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {/* Header Bar with Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              f(t) Kinematics
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>

        {/* View Mode Toggle: Instantaneous vs. f(t) Graph */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setDisplayMode('instantaneous')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              displayMode === 'instantaneous'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Instantaneous f₀</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('timeSeries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              displayMode === 'timeSeries'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Frequency Graph f(t)</span>
          </button>
        </div>

        {/* Audio Input Control */}
        <div className="flex items-center gap-2">
          {onStartAudio && onStopAudio && (
            isListening ? (
              <button
                type="button"
                onClick={onStopAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop Mic</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Start Mic</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* INSTANTANEOUS VIEW MODE */}
      {displayMode === 'instantaneous' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Live Frequency Meter */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Fundamental Frequency f₀</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="my-4">
              <div className="text-4xl font-black font-mono text-blue-600">
                {currentFreq > 15 ? currentFreq.toFixed(1) : '--'}
                <span className="text-lg font-bold text-slate-500 ml-1.5">Hz</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Period T = {currentFreq > 15 ? (1000 / currentFreq).toFixed(2) : '--'} ms | λ ={' '}
                {currentFreq > 15 ? (343 / currentFreq).toFixed(2) : '--'} m
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-75"
                style={{ width: `${Math.min(100, (currentFreq / 2000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Musical Pitch & Note */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Musical Note / Intonation</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="my-4">
              <div className="text-4xl font-black font-mono text-indigo-600">
                {currentFreq > 15 ? `${activeNote.note}${activeNote.octave}` : '--'}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-1">
                Pitch offset:{' '}
                <span className={activeNote.cents > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                  {activeNote.cents > 0 ? `+${activeNote.cents}` : activeNote.cents} cents
                </span>{' '}
                ({Math.abs(activeNote.cents) < 5 ? 'In Tune' : activeNote.cents > 0 ? 'Sharp' : 'Flat'})
              </div>
            </div>
            {/* Cent Tuning Meter */}
            <div className="relative w-full h-4 flex items-center">
              <div className="w-full h-1.5 bg-slate-200 rounded-full" />
              <div
                className="absolute w-3 h-3 rounded-full bg-indigo-600 border border-white shadow transition-all duration-75 -translate-x-1.5"
                style={{
                  left: `${Math.max(5, Math.min(95, 50 + (activeNote.cents / 50) * 45))}%`,
                }}
              />
            </div>
          </div>

          {/* Quick Mode Switcher Banner */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-indigo-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                Need Continuous f(t) Curve?
              </div>
              <p className="text-xs text-indigo-700 mt-1.5 leading-relaxed">
                Switch to the <strong>Frequency Graph f(t)</strong> tab to record pitch variations over time, export to CSV, or evaluate Doppler frequency shifts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDisplayMode('timeSeries')}
              className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open f(t) Time Graph</span>
            </button>
          </div>
        </div>
      )}

      {/* FREQUENCY VS. TIME f(t) GRAPH & RECORDER */}
      {displayMode === 'timeSeries' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Controls Strip: Record, Pause, Erase/Restart, Export CSV, Range */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              {/* Record / Pause Button */}
              <button
                type="button"
                onClick={handleTogglePause}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                  isRecording && !isPaused
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                }`}
              >
                {isRecording && !isPaused ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>{isPaused ? 'Resume Record' : 'Start Record'}</span>
                  </>
                )}
              </button>

              {/* Erase and Restart Button */}
              <button
                type="button"
                onClick={handleEraseAndRestart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-300"
                title="Erase all recorded points, reset timer, and restart recording"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Erase & Restart</span>
              </button>

              {/* Export to CSV Button */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={records.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border shadow-xs ${
                  records.length > 0
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
                title="Export all recorded frequency data to .csv file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .CSV</span>
              </button>

              {/* Add to Notebook */}
              {onAddToNotebook && (
                <button
                  type="button"
                  onClick={handleSaveToNotebook}
                  disabled={records.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border shadow-xs ${
                    records.length > 0
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Save f(t) curve to Lab Notebook"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Add to Notebook</span>
                </button>
              )}
            </div>

            {/* Timer, Smoothing Toggle, Scale Presets & Live FPS Monitor */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Curve Smoothing Spline vs Linear Toggle */}
              <button
                type="button"
                onClick={() => setCurveSmoothing(!curveSmoothing)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                  curveSmoothing
                    ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title="Toggle smooth cubic spline curve interpolation vs. linear points"
              >
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>{curveSmoothing ? 'Spline Smooth' : 'Linear Points'}</span>
              </button>

              {/* Hardware Accelerated Live FPS Monitor Badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold shadow-2xs"
                title="Hardware-accelerated live rendering frame rate"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{fpsLive} FPS</span>
              </div>

              <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                ⏱ {elapsedTime.toFixed(1)}s ({records.length} pts)
              </div>

              {/* Scale Selector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 font-medium">Scale:</span>
                <select
                  value={freqScale}
                  onChange={(e) => setFreqScale(e.target.value as any)}
                  className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1 font-bold outline-none cursor-pointer"
                >
                  <option value="auto">Auto-Fit</option>
                  <option value="voice">Voice (50-1200 Hz)</option>
                  <option value="music">Music (50-3500 Hz)</option>
                  <option value="full">Full (20-8000 Hz)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Simulated Physics Generator Strip (if allowed) */}
          {allowSimulations && (
            <div className="flex flex-wrap items-center gap-2 bg-indigo-50/70 px-3 py-2 rounded-lg border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Physical Generator:
              </span>

              <button
                type="button"
                onClick={() => setSimType('none')}
                className={`px-2 py-1 rounded font-bold transition ${
                  simType === 'none' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Microphone / Live
              </button>

              <button
                type="button"
                onClick={() => setSimType('doppler')}
                className={`px-2 py-1 rounded font-bold transition ${
                  simType === 'doppler' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
                title="Simulate ambulance siren passing an observer (Doppler effect shift)"
              >
                🚑 Doppler Shift
              </button>

              <button
                type="button"
                onClick={() => setSimType('chirp')}
                className={`px-2 py-1 rounded font-bold transition ${
                  simType === 'chirp' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
                title="Linear frequency sweep (f0 + kt)"
              >
                📈 Linear Chirp
              </button>

              <button
                type="button"
                onClick={() => setSimType('vibrato')}
                className={`px-2 py-1 rounded font-bold transition ${
                  simType === 'vibrato' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
                title="Vibrato / FM periodic modulation"
              >
                🎵 Vibrato FM
              </button>

              {simType !== 'none' && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-slate-500 font-mono text-[11px]">Base f₀:</span>
                  <input
                    type="number"
                    value={simBaseFreq}
                    onChange={(e) => setSimBaseFreq(Number(e.target.value) || 440)}
                    className="w-16 px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-xs font-bold text-center"
                    step="10"
                    min="50"
                    max="2000"
                  />
                  <span className="text-slate-500 text-[11px]">Hz</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Canvas Graph */}
          <div className="relative flex-1 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs min-h-[300px]">
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              className="w-full h-full block cursor-crosshair"
            />
          </div>

          {/* Live Summary Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current f(t)</div>
              <div className="text-lg font-black font-mono text-blue-600 mt-0.5">
                {currentFreq > 15 ? `${currentFreq.toFixed(1)} Hz` : '--'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentFreq > 15 ? `${activeNote.note}${activeNote.octave}` : 'Silence'}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average f_avg</div>
              <div className="text-lg font-black font-mono text-indigo-600 mt-0.5">
                {stats.avg > 0 ? `${stats.avg} Hz` : '--'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Mean frequency</div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Frequency</div>
              <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                {stats.min > 0 ? `${stats.min} Hz` : '--'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Lowest captured</div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Frequency</div>
              <div className="text-lg font-black font-mono text-rose-600 mt-0.5">
                {stats.max > 0 ? `${stats.max} Hz` : '--'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Highest peak</div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Samples Recorded</div>
              <div className="text-lg font-black font-mono text-slate-800 mt-0.5">{records.length}</div>
              <div className="text-[10px] text-slate-400 font-mono">{elapsedTime.toFixed(1)}s elapsed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

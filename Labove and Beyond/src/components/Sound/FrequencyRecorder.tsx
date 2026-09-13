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

  // Simulation generator (Doppler, Chirp, Vibrato)
  const [simType, setSimType] = useState<'none' | 'doppler' | 'chirp' | 'vibrato'>('none');
  const [simBaseFreq, setSimBaseFreq] = useState<number>(440);
  const [simSourceSpeed, setSimSourceSpeed] = useState<number>(25); // m/s for Doppler

  // Mouse Inspection
  const [hoveredPoint, setHoveredPoint] = useState<{ time: number; freq: number; note: string; x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active note representation
  const activeNote = useMemo(() => frequencyToNote(currentFreq), [currentFreq]);

  // Handle Recording Timer & Sampling
  useEffect(() => {
    if (!isRecording || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const intervalMs = 50; // 20 Hz recording rate
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const nextTime = Math.round((prev + intervalMs / 1000) * 1000) / 1000;

        // Sample current frequency if valid
        const freqToRecord = currentFreq > 15 ? currentFreq : 0;
        const noteInfo = frequencyToNote(freqToRecord);

        setRecords((prevRecs) => [
          ...prevRecs,
          {
            time: nextTime,
            frequency: freqToRecord,
            note: noteInfo.note !== '--' ? `${noteInfo.note}${noteInfo.octave}` : '--',
            cents: noteInfo.cents,
            decibels: currentDb,
          },
        ]);

        return nextTime;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused, currentFreq, currentDb]);

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
    setRecords([]);
    setElapsedTime(0);
    setIsRecording(true);
    setIsPaused(false);
  };

  // Stop Recording
  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  // Toggle Pause/Resume
  const handleTogglePause = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPaused(false);
    } else {
      setIsPaused((prev) => !prev);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (records.length === 0) {
      alert('No recorded frequency data to export. Click Record to capture data first.');
      return;
    }
    const filename = `frequency_vs_time_${Date.now()}.csv`;
    exportFrequencyToCsv(records, filename);
  };

  // Summary Statistics
  const stats = useMemo(() => {
    const validRecs = records.filter((r) => r.frequency > 15);
    if (validRecs.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        count: records.length,
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
      count: records.length,
      duration: elapsedTime,
    };
  }, [records, elapsedTime]);

  // Render Frequency vs Time Canvas Graph
  useEffect(() => {
    if (displayMode !== 'timeSeries') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, w, h);

    const padLeft = 65;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Determine Y range (Frequency Hz)
    let yMin = 0;
    let yMax = 1000;

    if (freqScale === 'voice') {
      yMin = 50;
      yMax = 1200;
    } else if (freqScale === 'music') {
      yMin = 50;
      yMax = 3500;
    } else if (freqScale === 'full') {
      yMin = 20;
      yMax = 8000;
    } else {
      // Auto-scale
      if (stats.max > 0) {
        yMax = Math.max(500, Math.ceil((stats.max * 1.2) / 100) * 100);
        yMin = Math.max(0, Math.floor((stats.min * 0.8) / 50) * 50);
      } else {
        yMax = 1000;
        yMin = 0;
      }
    }

    // Determine X range (Time seconds)
    const maxTime = Math.max(10, elapsedTime + 1);
    const minTime = Math.max(0, maxTime - 20); // 20-second scrolling window if long

    // Draw Grid Lines & Musical Reference Tiers
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;

    // Horizontal Frequency Grids
    const ySteps = 5;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= ySteps; i++) {
      const fVal = yMin + (i * (yMax - yMin)) / ySteps;
      const py = padTop + plotH - ((fVal - yMin) / (yMax - yMin)) * plotH;

      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(padLeft + plotW, py);
      ctx.stroke();

      ctx.fillText(`${Math.round(fVal)} Hz`, padLeft - 8, py + 3);
    }

    // Musical Landmark Guides (e.g. A4 = 440 Hz, C4 = 261.6 Hz, C5 = 523.3 Hz)
    const landmarks = [
      { f: 261.6, note: 'C4' },
      { f: 440.0, note: 'A4' },
      { f: 523.3, note: 'C5' },
      { f: 880.0, note: 'A5' },
    ];

    landmarks.forEach((lm) => {
      if (lm.f >= yMin && lm.f <= yMax) {
        const py = padTop + plotH - ((lm.f - yMin) / (yMax - yMin)) * plotH;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, py);
        ctx.lineTo(padLeft + plotW, py);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#818cf8';
        ctx.textAlign = 'left';
        ctx.fillText(lm.note, padLeft + plotW + 4, py + 3);
      }
    });

    // Vertical Time Grids
    const tSpan = maxTime - minTime;
    const xSteps = 5;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';

    for (let i = 0; i <= xSteps; i++) {
      const tVal = minTime + (i * tSpan) / xSteps;
      const px = padLeft + ((tVal - minTime) / tSpan) * plotW;

      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.beginPath();
      ctx.moveTo(px, padTop);
      ctx.lineTo(px, padTop + plotH);
      ctx.stroke();

      ctx.fillText(`${tVal.toFixed(1)}s`, px, padTop + plotH + 18);
    }

    // Axis Labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time t (seconds)', padLeft + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency f(t) [Hz]', 0, 0);
    ctx.restore();

    // Plot Recorded Data Points & Curve
    if (records.length > 1) {
      // Draw smooth line
      ctx.strokeStyle = '#38bdf8'; // Sky blue
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let isDrawing = false;

      records.forEach((pt) => {
        if (pt.time < minTime || pt.time > maxTime) return;
        if (pt.frequency <= 15) {
          isDrawing = false;
          return;
        }

        const px = padLeft + ((pt.time - minTime) / tSpan) * plotW;
        const py = padTop + plotH - ((pt.frequency - yMin) / (yMax - yMin)) * plotH;

        if (!isDrawing) {
          ctx.moveTo(px, py);
          isDrawing = true;
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();

      // Draw point markers with glow
      records.forEach((pt) => {
        if (pt.time < minTime || pt.time > maxTime || pt.frequency <= 15) return;
        const px = padLeft + ((pt.time - minTime) / tSpan) * plotW;
        const py = padTop + plotH - ((pt.frequency - yMin) / (yMax - yMin)) * plotH;

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Draw Live Reticle for Current Instantaneous Value
    if (currentFreq > 15) {
      const liveX = padLeft + ((elapsedTime - minTime) / tSpan) * plotW;
      const liveY = padTop + plotH - ((currentFreq - yMin) / (yMax - yMin)) * plotH;

      if (liveX >= padLeft && liveX <= padLeft + plotW && liveY >= padTop && liveY <= padTop + plotH) {
        ctx.fillStyle = '#22c55e'; // Emerald
        ctx.beginPath();
        ctx.arc(liveX, liveY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing radar ring
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(liveX, liveY, 11, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Draw Hover Crosshair (if active)
    if (hoveredPoint) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoveredPoint.x, padTop);
      ctx.lineTo(hoveredPoint.x, padTop + plotH);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, hoveredPoint.y);
      ctx.lineTo(padLeft + plotW, hoveredPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip Card
      const tipText = `t = ${hoveredPoint.time.toFixed(2)}s | f = ${hoveredPoint.freq.toFixed(1)} Hz (${hoveredPoint.note})`;
      ctx.font = '11px JetBrains Mono, monospace';
      const textW = ctx.measureText(tipText).width + 16;
      let tipX = hoveredPoint.x + 10;
      if (tipX + textW > padLeft + plotW) tipX = hoveredPoint.x - textW - 10;
      let tipY = hoveredPoint.y - 25;
      if (tipY < padTop) tipY = hoveredPoint.y + 15;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tipX, tipY, textW, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(tipText, tipX + 8, tipY + 16);
    }
  }, [displayMode, records, elapsedTime, currentFreq, freqScale, stats, hoveredPoint]);

  // Handle Canvas Mouse Move for Tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || records.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padLeft = 65;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = canvas.width - padLeft - padRight;
    const plotH = canvas.height - padTop - padBottom;

    if (x < padLeft || x > padLeft + plotW || y < padTop || y > padTop + plotH) {
      setHoveredPoint(null);
      return;
    }

    const maxTime = Math.max(10, elapsedTime + 1);
    const minTime = Math.max(0, maxTime - 20);
    const tSpan = maxTime - minTime;
    const hoverT = minTime + ((x - padLeft) / plotW) * tSpan;

    // Find closest recorded point
    let closest: FrequencyHistoryRecord | null = null;
    let minDist = Infinity;

    for (const r of records) {
      const d = Math.abs(r.time - hoverT);
      if (d < minDist) {
        minDist = d;
        closest = r;
      }
    }

    if (closest) {
      const targetRecord: FrequencyHistoryRecord = closest;
      if (minDist < 1.0 && targetRecord.frequency > 15) {
        let yMin = 0;
        let yMax = 1000;
        if (freqScale === 'voice') { yMin = 50; yMax = 1200; }
        else if (freqScale === 'music') { yMin = 50; yMax = 3500; }
        else if (freqScale === 'full') { yMin = 20; yMax = 8000; }
        else {
          yMax = Math.max(500, Math.ceil((stats.max * 1.2) / 100) * 100);
          yMin = Math.max(0, Math.floor((stats.min * 0.8) / 50) * 50);
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

    onAddToNotebook({
      type: 'sound',
      title: `Acoustic Frequency as a Function of Time f(t)`,
      content: `Recorded ${records.length} frequency samples over ${elapsedTime.toFixed(1)} seconds. Average fundamental frequency f_avg = ${stats.avg} Hz (Range: ${stats.min} - ${stats.max} Hz). Pitch range spans ${activeNote.note}${activeNote.octave}.`,
      imageUrl: imgUrl,
      dataSnippet: {
        'Average Frequency': `${stats.avg} Hz`,
        'Min Frequency': `${stats.min} Hz`,
        'Max Frequency': `${stats.max} Hz`,
        'Pitch Range': `${activeNote.note}${activeNote.octave}`,
        'Sample Count': `${records.length} samples`,
        'Elapsed Time': `${elapsedTime.toFixed(1)} s`,
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

            {/* Timer & Scale Presets */}
            <div className="flex items-center gap-3">
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
          <div className="relative flex-1 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner min-h-[300px]">
            <canvas
              ref={canvasRef}
              width={900}
              height={380}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              className="w-full h-full object-fill cursor-crosshair"
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

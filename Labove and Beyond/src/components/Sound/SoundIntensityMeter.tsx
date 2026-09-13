import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Gauge,
  Sparkles,
  BookOpen,
  RotateCcw,
  Sliders,
  Play,
  Pause,
  Circle,
  Square,
  Download,
  AlertTriangle,
  Table as TableIcon,
  Zap,
  Mic,
  Radio,
  VolumeX,
} from 'lucide-react';
import { NotebookCard } from '../../types/physics';

// IEC 61672:2003 A-weighting transfer function
export function getAWeightingCorrection(freq: number): number {
  if (freq < 10) return -70;
  const f2 = freq * freq;
  const num = 12194 * 12194 * f2 * f2;
  const den =
    (f2 + 20.6 * 20.6) *
    Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9)) *
    (f2 + 12194 * 12194);
  const ra = num / den;
  return 20 * Math.log10(ra) + 2.0;
}

export interface HistoryPoint {
  time: number;
  db: number;
  dba: number;
  intensityMicroWatts: number;
}

export const NOISE_LANDMARKS = [
  { level: 30, label: 'Whisper', color: '#10b981' },
  { level: 40, label: 'Quiet Room', color: '#10b981' },
  { level: 60, label: 'Speech', color: '#3b82f6' },
  { level: 75, label: 'City Traffic', color: '#f59e0b' },
  { level: 85, label: 'OSHA Limit', color: '#f97316' },
  { level: 100, label: 'Lawn Mower', color: '#ef4444' },
  { level: 115, label: 'Rock Concert', color: '#dc2626' },
  { level: 130, label: 'Pain Threshold', color: '#7f1d1d' },
];

export interface SoundIntensityMeterProps {
  analyser: AnalyserNode | null;
  audioCtx: AudioContext | null;
  isListening: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  inputSource: 'mic' | 'simulated';
  simulatedSignal: string;
  micError: string | null;
  speakerMonitor: boolean;
  onToggleRecord: () => void;
  onPauseResumeRecord: () => void;
  onStartMicrophone: () => void;
  onStopAudio: () => void;
  onSelectInputSource: (source: 'mic' | 'simulated') => void;
  onSelectSimulatedSignal: (signal: any) => void;
  onToggleSpeakerMonitor: () => void;
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
}

export const SoundIntensityMeter: React.FC<SoundIntensityMeterProps> = ({
  analyser,
  audioCtx,
  isListening,
  isRecording,
  recordingSeconds,
  inputSource,
  simulatedSignal,
  micError,
  speakerMonitor,
  onToggleRecord,
  onPauseResumeRecord,
  onStartMicrophone,
  onStopAudio,
  onSelectInputSource,
  onSelectSimulatedSignal,
  onToggleSpeakerMonitor,
  onAddToNotebook,
}) => {
  // Sound Metrics State
  const [dbSpl, setDbSpl] = useState<number>(30);
  const [dbA, setDbA] = useState<number>(28);
  const [soundIntensityWatts, setSoundIntensityWatts] = useState<number>(1e-9);
  const [soundIntensityMicroWatts, setSoundIntensityMicroWatts] = useState<number>(0.001);

  // Statistics State
  const [peakDb, setPeakDb] = useState<number>(30);
  const [minDb, setMinDb] = useState<number>(100);
  const [leqDb, setLeqDb] = useState<number>(30);
  const [calibrationOffset, setCalibrationOffset] = useState<number>(0);

  // Strip Chart State & History
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Leq Accumulators
  const eqSumRef = useRef<number>(0);
  const eqCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Format MM:SS helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Measurement Loop (driven by Web Audio AnalyserNode)
  useEffect(() => {
    if (!isListening || !analyser || !audioCtx) return;

    // Guarantee audio context is active
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Float32Array(bufferLength);
    let lastChartUpdate = performance.now();

    const measure = () => {
      analyser.getByteTimeDomainData(timeData);
      analyser.getFloatFrequencyData(freqData);

      // 1. RMS Unweighted Sound Pressure Level (dB SPL)
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        const val = (timeData[i] - 128) / 128;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const rawDb = Math.min(
        125,
        Math.max(25, 20 * Math.log10(rms + 1e-6) + 95 + calibrationOffset)
      );
      const roundedDb = Math.round(rawDb * 10) / 10;

      // 2. A-Weighted Decibels (dBA) via IEC 61672:2003 filter across FFT bins
      const sampleRate = audioCtx.sampleRate || 44100;
      const binWidth = sampleRate / analyser.fftSize;
      let sumAPower = 0;

      for (let i = 1; i < bufferLength; i++) {
        const f = i * binWidth;
        if (f > 20000) break;
        const aCorr = getAWeightingCorrection(f);
        const corrected = freqData[i] + aCorr;
        sumAPower += Math.pow(10, corrected / 10);
      }

      const rawDba = Math.min(
        125,
        Math.max(20, 10 * Math.log10(sumAPower + 1e-12) + 115 + calibrationOffset)
      );
      const roundedDba = Math.round(rawDba * 10) / 10;

      // 3. Physical Sound Intensity I = I0 * 10^(L / 10) in W/m² (I0 = 10^-12 W/m²)
      const I_watts = 1e-12 * Math.pow(10, roundedDb / 10);
      const I_microWatts = I_watts * 1e6;

      setDbSpl(roundedDb);
      setDbA(roundedDba);
      setSoundIntensityWatts(I_watts);
      setSoundIntensityMicroWatts(I_microWatts);

      // 4. Update Statistics (Peak, Min, Leq)
      setPeakDb((prev) => Math.max(prev, roundedDba));
      setMinDb((prev) => (prev === 100 ? roundedDba : Math.min(prev, roundedDba)));

      eqSumRef.current += Math.pow(10, roundedDba / 10);
      eqCountRef.current += 1;
      const currentLeq = 10 * Math.log10(eqSumRef.current / eqCountRef.current);
      setLeqDb(Math.round(currentLeq * 10) / 10);

      // 5. Update Strip Chart at ~10 Hz (every 100ms) when recording
      const now = performance.now();
      if (isRecording && now - lastChartUpdate >= 100) {
        lastChartUpdate = now;
        const timeSec = (Date.now() - startTimeRef.current) / 1000;
        setHistory((prev) => {
          const updated = [
            ...prev,
            {
              time: Math.round(timeSec * 10) / 10,
              db: roundedDb,
              dba: roundedDba,
              intensityMicroWatts: Math.round(I_microWatts * 1000) / 1000,
            },
          ];
          return updated.length > 300 ? updated.slice(updated.length - 300) : updated;
        });
      }

      animFrameRef.current = requestAnimationFrame(measure);
    };

    animFrameRef.current = requestAnimationFrame(measure);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, analyser, audioCtx, calibrationOffset, isRecording]);

  // Draw Strip Chart Canvas
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clean background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Margins
    const padL = 46;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const minPlotDb = 30;
    const maxPlotDb = 110;
    const dbRange = maxPlotDb - minPlotDb;

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';

    [30, 50, 70, 85, 100].forEach((level) => {
      const y = padT + plotH - ((level - minPlotDb) / dbRange) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${level} dB`, padL - 6, y + 3);
    });

    // OSHA Danger Threshold Line (85 dB)
    const y85 = padT + plotH - ((85 - minPlotDb) / dbRange) * plotH;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y85);
    ctx.lineTo(padL + plotW, y85);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('OSHA Caution (85 dB)', padL + 4, y85 - 4);

    if (history.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isRecording
          ? 'Acquiring acoustic measurements...'
          : 'Click "Record Intensity" to begin recording live acoustic data...',
        padL + plotW / 2,
        padT + plotH / 2
      );
      return;
    }

    // Draw dBA curve (Royal Blue, Solid, 2.5px)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = padL + (i / (history.length - 1)) * plotW;
      const y =
        padT +
        plotH -
        ((Math.min(maxPlotDb, Math.max(minPlotDb, pt.dba)) - minPlotDb) / dbRange) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dB SPL curve (Cyan, Dashed, 1.5px)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#06b6d4';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = padL + (i / (history.length - 1)) * plotW;
      const y =
        padT +
        plotH -
        ((Math.min(maxPlotDb, Math.max(minPlotDb, pt.db)) - minPlotDb) / dbRange) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }, [history, isRecording]);

  const handleResetStats = () => {
    setPeakDb(dbA);
    setMinDb(dbA);
    eqSumRef.current = 0;
    eqCountRef.current = 0;
    setLeqDb(dbA);
    setHistory([]);
    startTimeRef.current = Date.now();
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const header = 'Time (s),dBA (A-weighted),dB SPL (Unweighted),Sound Intensity (uW/m2)\n';
    const rows = history
      .map(
        (p) =>
          `${p.time.toFixed(2)},${p.dba.toFixed(1)},${p.db.toFixed(1)},${p.intensityMicroWatts.toFixed(4)}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fizziq_sound_intensity_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddToNotebook = () => {
    if (!onAddToNotebook) return;
    const canvas = chartCanvasRef.current;
    const imgUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    onAddToNotebook({
      type: 'sound',
      title: `Sound Intensity & Decibel Log (${dbA.toFixed(1)} dBA / ${dbSpl.toFixed(1)} dB SPL)`,
      content: `Acoustic measurement recorded via ${
        inputSource === 'mic' ? 'hardware microphone' : `Physics Simulator (${simulatedSignal})`
      }. Sound level: ${dbA.toFixed(1)} dBA (${dbSpl.toFixed(1)} dB SPL). Physical intensity: ${
        soundIntensityMicroWatts < 1
          ? soundIntensityMicroWatts.toFixed(4)
          : soundIntensityMicroWatts.toFixed(2)
      } µW/m². Equivalent continuous Leq: ${leqDb.toFixed(1)} dBA. Recorded points: ${
        history.length
      }.`,
      dataSnippet: {
        'A-Weighted Level (dBA)': `${dbA.toFixed(1)} dBA`,
        'Sound Pressure Level (SPL)': `${dbSpl.toFixed(1)} dB SPL`,
        'Physical Sound Intensity (I)': `${
          soundIntensityMicroWatts < 1
            ? soundIntensityMicroWatts.toFixed(4)
            : soundIntensityMicroWatts.toFixed(2)
        } µW/m² (${soundIntensityWatts.toExponential(3)} W/m²)`,
        'Equivalent Level (Leq)': `${leqDb.toFixed(1)} dBA`,
        'Peak Loudness (Lmax)': `${peakDb.toFixed(1)} dBA`,
        'Minimum Level (Lmin)': `${minDb.toFixed(1)} dBA`,
        'Auditory Reference (I0)': '1.0 × 10⁻¹² W/m²',
        'Calibration Offset': `${calibrationOffset > 0 ? '+' : ''}${calibrationOffset} dB`,
        'Data Samples': `${history.length} frames`,
      },
      imageUrl: imgUrl,
    });
  };

  const activeLandmark =
    [...NOISE_LANDMARKS].reverse().find((lm) => dbA >= lm.level) || NOISE_LANDMARKS[0];

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 select-none font-sans overflow-y-auto pr-1">
      {/* Mic Warning Banner if Permission Denied or Unavailable */}
      {micError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900">
              <strong className="font-bold block">Microphone Notice:</strong>
              {micError}. Automatically running in <strong>Physics Signal Simulator</strong> mode so
              you can measure sound intensity, examine decibels, and test frequency acoustics without
              hardware limitations!
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onStartMicrophone}
              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
            >
              Retry Microphone
            </button>
            <button
              onClick={() => onSelectInputSource('simulated')}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-amber-900 border border-amber-300 text-xs font-bold transition"
            >
              Use Physics Simulator
            </button>
          </div>
        </div>
      )}

      {/* Main Recording & Measurement Action Header Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Big Prominent Record & Measure Intensity Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleRecord}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition shadow-sm active:scale-95 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white ring-4 ring-blue-50'
            }`}
            title={
              isRecording
                ? 'Stop recording acoustic intensity and freeze data'
                : 'Start recording live sound intensity, decibels, and history'
            }
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 fill-rose-400 text-rose-400" />
                <span>Record & Measure Intensity</span>
              </>
            )}
          </button>

          {/* Pause / Resume Button when active */}
          {isListening && (
            <button
              onClick={onPauseResumeRecord}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition ${
                isRecording
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
              title={isRecording ? 'Pause recording stream' : 'Resume recording stream'}
            >
              {isRecording ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Pause' : 'Resume'}</span>
            </button>
          )}

          {/* Status Badge & Recording Timer */}
          <div className="flex items-center gap-2 pl-1">
            {isRecording ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                <span>REC {formatTime(recordingSeconds)}</span>
              </span>
            ) : isListening ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>PAUSED</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                <span>READY</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Audio Input Source Selector & Speaker Monitor Toggle */}
        <div className="flex items-center gap-2">
          {/* Audio Input Selector Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onSelectInputSource('mic')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                inputSource === 'mic'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Record sound using your physical microphone"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone</span>
            </button>
            <button
              onClick={() => onSelectInputSource('simulated')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                inputSource === 'simulated'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Use the Physics Signal Simulator for instant calibrated experiments"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Physics Simulator</span>
            </button>
          </div>

          {/* Simulator Sound Selector (if in simulator mode) */}
          {inputSource === 'simulated' && (
            <select
              value={simulatedSignal}
              onChange={(e) => onSelectSimulatedSignal(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
              title="Select simulated sound signal for physical analysis"
            >
              <option value="a4">A4 Tuning Fork (440 Hz ~65 dB)</option>
              <option value="speech">Classroom Speech (~63 dB)</option>
              <option value="claps">Loud Claps / Pulses (&gt;85 dB)</option>
              <option value="whistle">Whistle (1200 Hz)</option>
              <option value="distance">Distance Demo (I ∝ 1/r²)</option>
            </select>
          )}

          {/* Speaker Monitor Toggle */}
          <button
            onClick={onToggleSpeakerMonitor}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
              speakerMonitor
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
            }`}
            title="Toggle audible speaker output (default muted to prevent audio feedback)"
          >
            {speakerMonitor ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {speakerMonitor ? 'Speaker On' : 'Speaker Muted'}
            </span>
          </button>
        </div>
      </div>

      {/* Top Main Cards: Sound Level, Physical Intensity, Statistics & Calibration */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Decibel Level (dBA & dB SPL) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Acoustic Loudness
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              IEC 61672
            </span>
          </div>

          <div className="my-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-blue-600 font-mono tracking-tight">
                {isListening ? dbA.toFixed(1) : '--'}
              </span>
              <span className="text-sm font-extrabold text-blue-800">dBA</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              Unweighted SPL:{' '}
              <strong className="text-slate-700 font-mono">
                {isListening ? dbSpl.toFixed(1) : '--'} dB
              </strong>
            </div>
          </div>

          {/* Color Level Gauge */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${Math.min(100, Math.max(0, ((dbA - 30) / 80) * 100))}%`,
                backgroundColor: dbA < 65 ? '#10b981' : dbA < 85 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        </div>

        {/* Card 2: True Physical Intensity (W/m² & µW/m²) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Physical Sound Intensity I
            </span>
            <span className="text-[10px] font-mono text-slate-400">I = I₀ · 10^(L/10)</span>
          </div>

          <div className="my-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight">
                {isListening
                  ? soundIntensityMicroWatts < 1
                    ? soundIntensityMicroWatts.toFixed(4)
                    : soundIntensityMicroWatts.toFixed(2)
                  : '--'}
              </span>
              <span className="text-xs font-bold text-slate-600">µW/m²</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
              {isListening ? `${soundIntensityWatts.toExponential(3)} W/m²` : '--'}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium">
            Reference I₀ = 1.0 × 10⁻¹² W/m² (Threshold of Hearing)
          </div>
        </div>

        {/* Card 3: Continuous Statistics (Leq, Peak, Min) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Acoustic Exposure Stats
            </span>
            <button
              onClick={handleResetStats}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              title="Reset Peak & Leq Statistics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 my-1.5 text-center">
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Leq</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {isListening ? leqDb.toFixed(1) : '--'}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Lmax</span>
              <span className="text-base font-bold text-rose-600 font-mono">
                {isListening ? peakDb.toFixed(1) : '--'}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Lmin</span>
              <span className="text-base font-bold text-emerald-600 font-mono">
                {isListening && minDb < 100 ? minDb.toFixed(1) : '--'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium">
            Leq is equivalent continuous acoustic energy over time
          </div>
        </div>

        {/* Card 4: Calibration & Controls */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              Sensor Calibration
            </span>
            <span className="font-mono text-xs font-bold text-blue-600">
              {calibrationOffset > 0 ? `+${calibrationOffset}` : calibrationOffset} dB
            </span>
          </div>

          <div className="my-1.5">
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={calibrationOffset}
              onChange={(e) => setCalibrationOffset(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
              <span>-20 dB</span>
              <button
                onClick={() => setCalibrationOffset(0)}
                className="hover:text-blue-600 font-bold underline"
              >
                0 dB Reset
              </button>
              <span>+20 dB</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRecord}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition ${
                isRecording
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              {isRecording ? 'Stop Rec' : 'Start Rec'}
            </button>

            {onAddToNotebook && (
              <button
                onClick={handleAddToNotebook}
                className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                title="Save sound measurement to notebook"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Notebook</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Environmental Noise Reference Landmark Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-blue-600" />
            Environmental Noise Landmark Comparison
          </span>
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            Current Environment:
            <strong
              className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-2xs"
              style={{ backgroundColor: activeLandmark.color }}
            >
              {activeLandmark.label} ({Math.round(dbA)} dBA)
            </strong>
          </span>
        </div>

        {/* Landmarks Scale Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1 text-center">
          {NOISE_LANDMARKS.map((lm) => {
            const isCurrent = activeLandmark.label === lm.label;
            return (
              <div
                key={lm.label}
                className={`py-1.5 px-1 rounded-lg border text-[10px] transition ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50 font-bold shadow-2xs scale-102 ring-1 ring-blue-400'
                    : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                <span className="block font-bold text-slate-800">{lm.level} dB</span>
                <span className="block truncate text-[10px] text-slate-600">{lm.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Strip Chart: Sound Level vs. Time */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[220px]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Sound Level vs. Time Strip-Chart (Loudness History)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold ml-2">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-0.5 bg-blue-600 inline-block" /> dBA (A-weighted)
              </span>
              <span className="flex items-center gap-1 text-cyan-500">
                <span className="w-2.5 h-0.5 bg-cyan-500 inline-block border-t border-dashed border-cyan-500" />{' '}
                dB SPL (Unweighted)
              </span>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTable(!showTable)}
              className={`py-1 px-2 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                showTable
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>{showTable ? 'Hide Table' : 'Show Table'}</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="py-1 px-2 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
                title="Download recorded points as CSV file"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            )}

            <button
              onClick={() => setHistory([])}
              className="py-1 px-2 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Clear graph history"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Strip Chart Canvas */}
        <div className="w-full relative h-[180px] bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          <canvas
            ref={chartCanvasRef}
            width={840}
            height={180}
            className="w-full h-full object-fill block"
          />
        </div>

        {/* Expandable Data Table */}
        {showTable && history.length > 0 && (
          <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 sticky top-0">
                <tr>
                  <th className="py-1 px-2.5">Time (s)</th>
                  <th className="py-1 px-2.5 text-blue-700">dBA</th>
                  <th className="py-1 px-2.5 text-cyan-700">dB SPL</th>
                  <th className="py-1 px-2.5 text-emerald-700">Intensity (µW/m²)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                {[...history]
                  .reverse()
                  .slice(0, 50)
                  .map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1 px-2.5">{pt.time.toFixed(1)}s</td>
                      <td className="py-1 px-2.5 font-bold text-blue-600">{pt.dba.toFixed(1)}</td>
                      <td className="py-1 px-2.5 font-semibold text-cyan-600">{pt.db.toFixed(1)}</td>
                      <td className="py-1 px-2.5 font-mono text-emerald-600">
                        {pt.intensityMicroWatts < 1
                          ? pt.intensityMicroWatts.toFixed(4)
                          : pt.intensityMicroWatts.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

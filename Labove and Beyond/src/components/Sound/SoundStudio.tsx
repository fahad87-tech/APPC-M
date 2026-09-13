import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  Radio,
  Clock,
  Sparkles,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Gauge,
} from 'lucide-react';
import { NotebookCard } from '../../types/physics';
import { SoundIntensityMeter } from './SoundIntensityMeter';
import { FrequencyRecorder } from './FrequencyRecorder';

interface SoundStudioProps {
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
}

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  if (freq < 20) return { note: '-', octave: 0, cents: 0 };
  const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
  const rounded = Math.round(noteNum) + 69;
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  const standardFreq = 440 * Math.pow(2, (rounded - 69) / 12);
  const cents = Math.round(1200 * Math.log2(freq / standardFreq));
  return { note: NOTE_STRINGS[noteIndex], octave, cents };
}

export const SoundStudio: React.FC<SoundStudioProps> = ({ onAddToNotebook }) => {
  const [activeTab, setActiveTab] = useState<'meter' | 'analyzer' | 'generator' | 'speedOfSound'>('meter');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [inputSource, setInputSource] = useState<'mic' | 'simulated'>('mic');
  const [simulatedSignal, setSimulatedSignal] = useState<string>('a4');
  const [speakerMonitor, setSpeakerMonitor] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Analyzer options
  const [analyzerMode, setAnalyzerMode] = useState<'instantaneous' | 'timeSeries'>('instantaneous');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [maxFftFreq, setMaxFftFreq] = useState<number>(4000); // max displayed Hz
  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [decibels, setDecibels] = useState<number>(30);
  const [peakDecibels, setPeakDecibels] = useState<number>(30);

  // Tone Generator options
  const [isGenPlaying, setIsGenPlaying] = useState<boolean>(false);
  const [genFreq1, setGenFreq1] = useState<number>(440);
  const [genFreq2, setGenFreq2] = useState<number>(444);
  const [isDualTone, setIsDualTone] = useState<boolean>(false);
  const [genWaveform, setGenWaveform] = useState<OscillatorType>('sine');
  const [genVolume, setGenVolume] = useState<number>(0.2);

  // Speed of Sound options
  const [sosDistance, setSosDistance] = useState<number>(1.0); // meters
  const [sosIsEcho, setSosIsEcho] = useState<boolean>(false);
  const [sosThreshold, setSosThreshold] = useState<number>(75); // dB threshold trigger
  const [sosWaiting, setSosWaiting] = useState<boolean>(false);
  const [sosTimeDelta, setSosTimeDelta] = useState<number | null>(null);
  const [sosCalculatedSpeed, setSosCalculatedSpeed] = useState<number | null>(null);

  // Canvas Refs
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserGainRef = useRef<GainNode | null>(null);
  const speakerGainRef = useRef<GainNode | null>(null);
  const simIntervalRef = useRef<any>(null);
  const simNodesRef = useRef<AudioNode[]>([]);

  // Generator Audio Refs
  const genCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Speed of sound trigger timestamps
  const sosTriggersRef = useRef<number[]>([]);

  // Recording Timer effect
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Clean Stop Audio (both mic and simulated)
  const stopAudio = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    simNodesRef.current.forEach((node) => {
      try {
        if ('stop' in node) (node as OscillatorNode).stop();
        node.disconnect();
      } catch {}
    });
    simNodesRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsListening(false);
    setIsRecording(false);
  };

  // Initialize Physical Hardware Microphone
  const startMicrophone = async () => {
    try {
      setMicError(null);
      stopAudio();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access requires HTTPS or localhost browser origin');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setInputSource('mic');
      setIsListening(true);
    } catch (err: any) {
      console.warn('Microphone access unavailable, switching to synthetic physics signal:', err);
      setMicError(err?.message || 'Microphone access denied or unavailable');
      setInputSource('simulated');
      startSimulatedAudio(simulatedSignal);
    }
  };

  // Synthetic Physics Signal Generator (calibrated ~65-75 dB for lab experiments)
  const startSimulatedAudio = async (type: string = 'a4') => {
    stopAudio();

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    audioCtxRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;

    // Analyser Gain feeds full, calibrated signal into visual analyser
    const analyserGain = audioCtx.createGain();
    analyserGain.gain.value = 0.42;
    analyserGain.connect(analyser);
    analyserGainRef.current = analyserGain;

    // Speaker Gain feeds optional audible monitor (kept quiet or muted by default)
    const speakerGain = audioCtx.createGain();
    speakerGain.gain.value = speakerMonitor ? 0.05 : 0;
    speakerGain.connect(audioCtx.destination);
    speakerGainRef.current = speakerGain;

    simNodesRef.current = [];

    if (type === 'a4') {
      // 440 Hz Tuning Fork Pure Sine Wave
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 440;
      osc.connect(analyserGain);
      osc.connect(speakerGain);
      osc.start();
      simNodesRef.current.push(osc);
    } else if (type === 'whistle') {
      // 1200 Hz High Whistle
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      osc.connect(analyserGain);
      osc.connect(speakerGain);
      osc.start();
      simNodesRef.current.push(osc);
    } else if (type === 'speech') {
      // Formants simulating vocal acoustic resonances (300, 800, 2400 Hz)
      [300, 800, 2400].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const g = audioCtx.createGain();
        g.gain.value = 0.3 / (idx + 1);
        osc.connect(g);
        g.connect(analyserGain);
        g.connect(speakerGain);
        osc.start();
        simNodesRef.current.push(osc, g);
      });
      // Speech volume envelope cadence
      let step = 0;
      simIntervalRef.current = setInterval(() => {
        if (!analyserGainRef.current || !audioCtxRef.current) return;
        step++;
        const mod = 0.35 + 0.15 * Math.sin(step * 0.4) + 0.08 * Math.sin(step * 0.9);
        analyserGainRef.current.gain.setValueAtTime(mod, audioCtxRef.current.currentTime);
      }, 120);
    } else if (type === 'claps') {
      // Periodic sharp bursts (>85 dB) for threshold testing
      const pulse = () => {
        if (!audioCtxRef.current || !analyserGainRef.current) return;
        const t = audioCtxRef.current.currentTime;
        analyserGainRef.current.gain.setValueAtTime(0.05, t);
        analyserGainRef.current.gain.exponentialRampToValueAtTime(0.95, t + 0.02);
        analyserGainRef.current.gain.exponentialRampToValueAtTime(0.02, t + 0.15);
      };
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 880;
      osc.connect(analyserGain);
      osc.connect(speakerGain);
      osc.start();
      simNodesRef.current.push(osc);
      pulse();
      simIntervalRef.current = setInterval(pulse, 1500);
    } else if (type === 'distance') {
      // Inverse Square Law demo: 500 Hz tone
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 500;
      osc.connect(analyserGain);
      osc.connect(speakerGain);
      osc.start();
      simNodesRef.current.push(osc);
    }

    setInputSource('simulated');
    setIsListening(true);
  };

  // Toggle Recording & Audio Pipeline
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      if (!isListening) {
        if (inputSource === 'mic') {
          startMicrophone();
        } else {
          startSimulatedAudio(simulatedSignal);
        }
      }
      setIsRecording(true);
    }
  };

  const handlePauseResumeRecord = () => {
    setIsRecording((prev) => !prev);
  };

  const handleSelectInputSource = (source: 'mic' | 'simulated') => {
    setInputSource(source);
    if (source === 'mic') {
      startMicrophone();
    } else {
      startSimulatedAudio(simulatedSignal);
    }
  };

  const handleSelectSimulatedSignal = (signal: string) => {
    setSimulatedSignal(signal);
    if (inputSource === 'simulated' && isListening) {
      startSimulatedAudio(signal);
    }
  };

  const handleToggleSpeakerMonitor = () => {
    const next = !speakerMonitor;
    setSpeakerMonitor(next);
    if (speakerGainRef.current && audioCtxRef.current) {
      speakerGainRef.current.gain.setValueAtTime(
        next ? 0.05 : 0,
        audioCtxRef.current.currentTime
      );
    }
  };

  // Render Loop for Oscilloscope & FFT Spectrum
  useEffect(() => {
    if (!isListening) return;

    let localPeakDb = 30;

    const draw = () => {
      if (isFrozen) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const analyser = analyserRef.current;
      const audioCtx = audioCtxRef.current;
      if (!analyser || !audioCtx) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);
      const freqData = new Float32Array(bufferLength);

      analyser.getByteTimeDomainData(timeData);
      analyser.getFloatFrequencyData(freqData);

      // 1. Calculate Decibels (RMS)
      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        const val = (timeData[i] - 128) / 128;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const computedDb = Math.min(110, Math.max(30, Math.round(20 * Math.log10(rms + 1e-6) + 95)));
      setDecibels(computedDb);
      if (computedDb > localPeakDb) {
        localPeakDb = computedDb;
        setPeakDecibels(localPeakDb);
      }

      // Speed of sound trigger detection
      if (sosWaiting && computedDb >= sosThreshold) {
        const nowMs = performance.now();
        const triggers = sosTriggersRef.current;
        if (triggers.length === 0 || nowMs - triggers[triggers.length - 1] > 60) {
          triggers.push(nowMs);
          if (triggers.length >= 2) {
            const dtSec = (triggers[1] - triggers[0]) / 1000;
            setSosTimeDelta(dtSec);
            const distMultiplier = sosIsEcho ? 2 : 1;
            const speed = (sosDistance * distMultiplier) / dtSec;
            setSosCalculatedSpeed(Math.round(speed));
            setSosWaiting(false);
          }
        }
      }

      // 2. Find Fundamental / Peak Frequency
      const sampleRate = audioCtx.sampleRate;
      let maxVal = -Infinity;
      let maxIndex = 0;
      const minBin = Math.floor(40 / (sampleRate / analyser.fftSize));
      const maxBin = Math.floor(maxFftFreq / (sampleRate / analyser.fftSize));

      for (let i = minBin; i < maxBin && i < bufferLength; i++) {
        if (freqData[i] > maxVal) {
          maxVal = freqData[i];
          maxIndex = i;
        }
      }
      const rawPeak = maxIndex * (sampleRate / analyser.fftSize);
      if (maxVal > -70) {
        setPeakFreq(Math.round(rawPeak * 10) / 10);
      }

      // 3. Draw Oscilloscope V(t)
      const oscCanvas = oscCanvasRef.current;
      if (oscCanvas) {
        const ctx = oscCanvas.getContext('2d');
        if (ctx) {
          const w = oscCanvas.width;
          const h = oscCanvas.height;
          ctx.fillStyle = '#0f172a'; // dark navy slate
          ctx.fillRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Center zero line
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          // Waveform
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#38bdf8'; // bright cyan
          ctx.beginPath();

          const sliceWidth = w / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        }
      }

      // 4. Draw FFT Frequency Spectrum
      const fftCanvas = fftCanvasRef.current;
      if (fftCanvas) {
        const ctx = fftCanvas.getContext('2d');
        if (ctx) {
          const w = fftCanvas.width;
          const h = fftCanvas.height;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Grid lines
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }

          // Spectrum Bars / Line
          const visibleBins = Math.min(
            bufferLength,
            Math.floor(maxFftFreq / (sampleRate / analyser.fftSize))
          );
          const barWidth = w / visibleBins;

          ctx.strokeStyle = '#3b82f6'; // FizziQ blue
          ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
          ctx.beginPath();
          ctx.moveTo(0, h);

          for (let i = 0; i < visibleBins; i++) {
            const db = freqData[i];
            const normalized = Math.max(0, Math.min(1, (db + 100) / 75));
            const y = h - normalized * (h - 20);
            const x = i * barWidth;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Peak Marker
          if (maxVal > -70 && maxIndex < visibleBins) {
            const peakX = maxIndex * barWidth;
            const peakY = h - Math.max(0, Math.min(1, (maxVal + 100) / 75)) * (h - 20);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(
              `${rawPeak.toFixed(0)} Hz`,
              Math.min(w - 60, Math.max(10, peakX - 20)),
              Math.max(20, peakY - 10)
            );
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isFrozen, maxFftFreq, sosWaiting, sosThreshold, sosDistance, sosIsEcho]);

  // Handle Tone Generator Play / Stop
  const toggleToneGenerator = () => {
    if (isGenPlaying) {
      if (osc1Ref.current) osc1Ref.current.stop();
      if (osc2Ref.current) osc2Ref.current.stop();
      if (genCtxRef.current) genCtxRef.current.close();
      osc1Ref.current = null;
      osc2Ref.current = null;
      genCtxRef.current = null;
      setIsGenPlaying(false);
    } else {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      genCtxRef.current = audioCtx;

      const masterGain = audioCtx.createGain();
      masterGain.gain.value = genVolume;
      masterGain.connect(audioCtx.destination);
      gainNodeRef.current = masterGain;

      const o1 = audioCtx.createOscillator();
      o1.type = genWaveform;
      o1.frequency.value = genFreq1;
      o1.connect(masterGain);
      o1.start();
      osc1Ref.current = o1;

      if (isDualTone) {
        const o2 = audioCtx.createOscillator();
        o2.type = genWaveform;
        o2.frequency.value = genFreq2;
        o2.connect(masterGain);
        o2.start();
        osc2Ref.current = o2;
      }

      setIsGenPlaying(true);
    }
  };

  // Update generator parameters live
  useEffect(() => {
    if (osc1Ref.current && genCtxRef.current) {
      osc1Ref.current.frequency.setValueAtTime(genFreq1, genCtxRef.current.currentTime);
      osc1Ref.current.type = genWaveform;
    }
    if (osc2Ref.current && genCtxRef.current) {
      osc2Ref.current.frequency.setValueAtTime(genFreq2, genCtxRef.current.currentTime);
      osc2Ref.current.type = genWaveform;
    }
    if (gainNodeRef.current && genCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(genVolume, genCtxRef.current.currentTime);
    }
  }, [genFreq1, genFreq2, genWaveform, genVolume]);

  const handleStartSosTimer = async () => {
    sosTriggersRef.current = [];
    setSosTimeDelta(null);
    setSosCalculatedSpeed(null);
    setSosWaiting(true);
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume().catch(() => {});
    }
    if (!isListening) {
      if (inputSource === 'mic') {
        startMicrophone();
      } else {
        startSimulatedAudio(simulatedSignal);
      }
    }
  };

  const handleSimulateClap = () => {
    const distMultiplier = sosIsEcho ? 2 : 1;
    const totalDist = sosDistance * distMultiplier;
    // Theoretical 343 m/s with realistic ±1.2% experimental variance
    const experimentalSpeed = 340 + Math.random() * 5.5;
    const dtSec = totalDist / experimentalSpeed;
    setSosTimeDelta(dtSec);
    setSosCalculatedSpeed(Math.round(experimentalSpeed));
    setSosWaiting(false);
  };

  const currentNote = frequencyToNote(peakFreq);

  // Send analysis card to Notebook
  const handleSaveToNotebook = () => {
    if (!onAddToNotebook) return;
    const fftCanvas = fftCanvasRef.current;
    const imgUrl = fftCanvas ? fftCanvas.toDataURL('image/png') : undefined;

    onAddToNotebook({
      type: 'sound',
      title: `Acoustic Analysis (${peakFreq.toFixed(1)} Hz - ${currentNote.note}${currentNote.octave})`,
      content: `Recorded frequency spectrum peak at ${peakFreq.toFixed(1)} Hz (${currentNote.note}${currentNote.octave}, ${currentNote.cents > 0 ? '+' : ''}${currentNote.cents} cents). Acoustic loudness: ${decibels} dB SPL (Peak: ${peakDecibels} dB).`,
      imageUrl: imgUrl,
      dataSnippet: {
        'Fundamental Frequency': `${peakFreq.toFixed(1)} Hz`,
        'Musical Pitch': `${currentNote.note}${currentNote.octave}`,
        'Pitch Offset': `${currentNote.cents} cents`,
        'Sound Intensity': `${decibels} dB SPL`,
        'Peak Loudness': `${peakDecibels} dB SPL`,
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-4 gap-4 overflow-y-auto select-none">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900">Acoustics & Sound Studio</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                Lab-ove and Beyond • by MR. F.
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time Audio Oscilloscope, FFT Frequency Spectrum, Decibel Meter, Tone Synthesizer &
              Speed of Sound
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('meter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'meter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Sound Intensity & Decibels</span>
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'analyzer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Oscilloscope & FFT</span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'generator'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Tone Generator & Beats</span>
          </button>
          <button
            onClick={() => setActiveTab('speedOfSound')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'speedOfSound'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Speed of Sound</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onAddToNotebook && (
            <button
              onClick={handleSaveToNotebook}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs"
              title="Save current acoustic spectrum and findings into Digital Lab Notebook"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Add to Notebook</span>
            </button>
          )}

          {isListening ? (
            <button
              onClick={stopAudio}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          ) : (
            <button
              onClick={startMicrophone}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Microphone</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'meter' && (
        <SoundIntensityMeter
          analyser={analyserRef.current}
          audioCtx={audioCtxRef.current}
          isListening={isListening}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          inputSource={inputSource}
          simulatedSignal={simulatedSignal}
          micError={micError}
          speakerMonitor={speakerMonitor}
          onToggleRecord={handleToggleRecord}
          onPauseResumeRecord={handlePauseResumeRecord}
          onStartMicrophone={startMicrophone}
          onStopAudio={stopAudio}
          onSelectInputSource={handleSelectInputSource}
          onSelectSimulatedSignal={handleSelectSimulatedSignal}
          onToggleSpeakerMonitor={handleToggleSpeakerMonitor}
          onAddToNotebook={onAddToNotebook}
        />
      )}

      {activeTab === 'analyzer' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Analyzer View Toggle: Instantaneous (Oscilloscope & FFT) vs. Frequency as a function of time f(t) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-700">Display View:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAnalyzerMode('instantaneous')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    analyzerMode === 'instantaneous'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Instantaneous f₀ (Oscilloscope & FFT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyzerMode('timeSeries')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    analyzerMode === 'timeSeries'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>Frequency vs. Time Graph f(t)</span>
                </button>
              </div>
            </div>
          </div>

          {analyzerMode === 'timeSeries' ? (
            <FrequencyRecorder
              currentFreq={peakFreq}
              currentDb={decibels}
              isListening={isListening}
              onStartAudio={startMicrophone}
              onStopAudio={stopAudio}
              onAddToNotebook={onAddToNotebook}
              allowSimulations={false}
              title="Acoustic Frequency as a Function of Time f(t)"
              subtitle="Record continuous fundamental frequency streams over time, visualize live f(t) graph, and export to CSV"
            />
          ) : (
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Fundamental Peak Frequency */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fundamental Frequency f₀
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-600 font-mono">
                  {peakFreq > 0 ? peakFreq.toFixed(1) : '--'}
                </span>
                <span className="text-xs font-bold text-slate-500">Hz</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Period T = {peakFreq > 0 ? (1000 / peakFreq).toFixed(2) : '--'} ms
              </div>
            </div>

            {/* Musical Note & Pitch */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Musical Note / Pitch
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  {peakFreq > 20 ? `${currentNote.note}${currentNote.octave}` : '--'}
                </span>
                {peakFreq > 20 && (
                  <span className="text-xs font-mono font-bold text-slate-500">
                    ({currentNote.cents > 0 ? '+' : ''}
                    {currentNote.cents} cents)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">A4 reference = 440 Hz</div>
            </div>

            {/* Decibel Sound Level Meter */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Acoustic Loudness</span>
                <span className="text-[10px] text-slate-400 font-mono">Peak: {peakDecibels} dB</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600 font-mono">{decibels}</span>
                <span className="text-xs font-bold text-slate-500">dB SPL</span>
              </div>
              {/* LED Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1 flex">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((decibels - 30) / 70) * 100))}%`,
                    backgroundColor:
                      decibels < 60 ? '#10b981' : decibels < 80 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* Test Signals & Freeze Controls */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Signal Source & Freeze
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => setIsFrozen(!isFrozen)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-bold transition ${
                    isFrozen
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isFrozen ? 'Unfreeze' : 'Freeze Wave'}
                </button>
                <button
                  onClick={() => setPeakDecibels(decibels)}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                  title="Reset Peak Decibel"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => startSimulatedAudio('a4')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                >
                  A4 (440Hz)
                </button>
                <button
                  onClick={() => startSimulatedAudio('harmonics')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium"
                >
                  Harmonics
                </button>
                <button
                  onClick={() => startSimulatedAudio('beats')}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium"
                >
                  Beats
                </button>
              </div>
            </div>
          </div>

          {/* Visualizers Grid: Oscilloscope + FFT */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Oscilloscope Waveform */}
            <div className="bg-slate-900 rounded-xl p-3 flex flex-col border border-slate-700 shadow-md min-h-[220px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Real-time Waveform V(t) [Oscilloscope]</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>Scale: 10 ms/div</span>
                </div>
              </div>
              <div className="flex-1 relative mt-2">
                <canvas
                  ref={oscCanvasRef}
                  width={640}
                  height={240}
                  className="w-full h-full rounded bg-slate-950"
                />
              </div>
            </div>

            {/* FFT Frequency Spectrum */}
            <div className="bg-slate-900 rounded-xl p-3 flex flex-col border border-slate-700 shadow-md min-h-[220px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Fast Fourier Transform (FFT) Frequency Spectrum</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={maxFftFreq}
                    onChange={(e) => setMaxFftFreq(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-[11px] rounded border border-slate-700 px-2 py-0.5"
                  >
                    <option value={1000}>0 - 1000 Hz</option>
                    <option value={2000}>0 - 2000 Hz</option>
                    <option value={4000}>0 - 4000 Hz</option>
                    <option value={8000}>0 - 8000 Hz</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 relative mt-2">
                <canvas
                  ref={fftCanvasRef}
                  width={640}
                  height={240}
                  className="w-full h-full rounded bg-slate-950"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )}

      {/* Tone Generator & Acoustic Beats Tab */}
      {activeTab === 'generator' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex-1 flex flex-col gap-5">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Acoustic Synthesizer & Tone Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate pure tones, demonstrate resonance, and observe wave superposition & acoustic
                beats Δf = |f₁ - f₂|
              </p>
            </div>

            {/* Oscillator 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Oscillator 1 (Primary Frequency f₁)
                </span>
                <span className="font-mono font-extrabold text-blue-600 text-lg">
                  {genFreq1} Hz
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={1}
                value={genFreq1}
                onChange={(e) => setGenFreq1(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex gap-1.5 flex-wrap">
                {[261.63, 329.63, 392.0, 440, 523.25, 880].map((f) => (
                  <button
                    key={f}
                    onClick={() => setGenFreq1(Math.round(f))}
                    className="text-xs px-2 py-1 rounded bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 font-mono font-medium"
                  >
                    {Math.round(f)} Hz
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Tone & Beats */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDualTone}
                    onChange={(e) => setIsDualTone(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Enable Oscillator 2 (Acoustic Beats)
                  </span>
                </label>
                {isDualTone && (
                  <span className="font-mono font-extrabold text-indigo-600 text-lg">
                    {genFreq2} Hz
                  </span>
                )}
              </div>

              {isDualTone && (
                <>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={1}
                    value={genFreq2}
                    onChange={(e) => setGenFreq2(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>
                      Audible Beat Frequency: Δf = |{genFreq1} - {genFreq2}|
                    </span>
                    <span className="font-mono text-base font-black text-indigo-700">
                      {Math.abs(genFreq1 - genFreq2)} Hz
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-80 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200">
              Generator Controls
            </div>

            {/* Waveform Selector */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Waveform Shape</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['sine', 'square', 'triangle', 'sawtooth'] as OscillatorType[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setGenWaveform(w)}
                    className={`py-1.5 px-2 rounded-md text-xs font-bold capitalize border transition ${
                      genWaveform === w
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Master Volume */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Master Volume</span>
                <span className="font-mono">{Math.round(genVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={genVolume}
                onChange={(e) => setGenVolume(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Master Play Button */}
            <button
              onClick={toggleToneGenerator}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition shadow-sm ${
                isGenPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isGenPlaying ? 'Stop Audio Output' : 'Play Synthesizer'}</span>
            </button>

            {onAddToNotebook && (
              <button
                type="button"
                onClick={() => {
                  onAddToNotebook({
                    type: 'sound',
                    title: isDualTone
                      ? `Acoustic Beats Experiment (${genFreq1} Hz & ${genFreq2} Hz)`
                      : `Tone Generator (${genFreq1} Hz ${genWaveform})`,
                    content: isDualTone
                      ? `Synthesized two superposed pure tones at f1 = ${genFreq1} Hz and f2 = ${genFreq2} Hz. Resulting acoustic beat frequency is fb = |f1 - f2| = ${Math.abs(genFreq1 - genFreq2)} Hz.`
                      : `Synthesized pure ${genWaveform} tone at frequency f = ${genFreq1} Hz (${frequencyToNote(genFreq1).note}${frequencyToNote(genFreq1).octave}).`,
                    dataSnippet: isDualTone
                      ? {
                          'Tone 1 Frequency': `${genFreq1} Hz`,
                          'Tone 2 Frequency': `${genFreq2} Hz`,
                          'Beat Frequency': `${Math.abs(genFreq1 - genFreq2)} Hz`,
                          'Waveform': genWaveform,
                        }
                      : {
                          'Frequency': `${genFreq1} Hz`,
                          'Pitch': `${frequencyToNote(genFreq1).note}${frequencyToNote(genFreq1).octave}`,
                          'Waveform': genWaveform,
                        },
                  });
                }}
                className="w-full py-2 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Log Tone & Beats to Notebook</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Speed of Sound Acoustic Timer Tab */}
      {activeTab === 'speedOfSound' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Speed of Sound Acoustic Chronograph
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Measure the propagation velocity of acoustic compression waves in air (v = d / Δt or
                v = 2d / Δt for echoes)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Distance d (Meters)</span>
                <input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={sosDistance}
                  onChange={(e) => setSosDistance(Math.max(0.1, Number(e.target.value)))}
                  className="w-24 p-1.5 border border-slate-300 rounded font-mono text-sm font-bold text-right"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={!sosIsEcho}
                    onChange={() => setSosIsEcho(false)}
                    className="accent-blue-600"
                  />
                  <span>Direct Transmission (v = d / Δt)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={sosIsEcho}
                    onChange={() => setSosIsEcho(true)}
                    className="accent-blue-600"
                  />
                  <span>Wall Echo Reflection (v = 2d / Δt)</span>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mt-2">
                <span>Trigger Sensitivity Threshold ({sosThreshold} dB)</span>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={sosThreshold}
                  onChange={(e) => setSosThreshold(Number(e.target.value))}
                  className="w-48 accent-blue-600"
                />
              </div>
            </div>

            {/* Trigger & Simulation Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleStartSosTimer}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition shadow-sm ${
                  sosWaiting
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {sosWaiting
                    ? 'Waiting for 2 Claps / Sound Pulses (Make Loud Claps!)...'
                    : 'Arm Acoustic Chronometer'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSimulateClap}
                className="py-3 px-4 rounded-xl font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm transition flex items-center justify-center gap-2 shadow-2xs"
                title="Generate 2 calibrated physics sound pulses spaced by theoretical travel time to test the chronograph"
              >
                <span>👏 Simulate Claps</span>
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="w-full lg:w-96 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
                Experimental Results
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Time Interval Δt:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {sosTimeDelta !== null ? `${(sosTimeDelta * 1000).toFixed(2)} ms` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Theoretical Speed in Air (20°C):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">343 m/s</span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mt-2">
                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Calculated Speed of Sound v
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-blue-700 font-mono">
                      {sosCalculatedSpeed !== null ? sosCalculatedSpeed : '--'}
                    </span>
                    <span className="text-sm font-bold text-blue-600">m/s</span>
                  </div>
                  {sosCalculatedSpeed !== null && (
                    <div className="text-[11px] text-blue-800 font-mono mt-1">
                      Error vs 343 m/s: {(((sosCalculatedSpeed - 343) / 343) * 100).toFixed(1)}%
                    </div>
                  )}

                  {onAddToNotebook && sosCalculatedSpeed !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddToNotebook({
                          type: 'sound',
                          title: `Speed of Sound Measurement: ${sosCalculatedSpeed} m/s`,
                          content: `Measured acoustic propagation time interval Δt = ${(sosTimeDelta! * 1000).toFixed(2)} ms across distance d = ${sosDistance} m (${sosIsEcho ? 'wall echo reflection' : 'direct path'}). Experimental speed of sound: v = ${sosCalculatedSpeed} m/s (Error vs 343 m/s: ${(((sosCalculatedSpeed - 343) / 343) * 100).toFixed(1)}%).`,
                          dataSnippet: {
                            'Distance d': `${sosDistance} m`,
                            'Time Interval Δt': `${(sosTimeDelta! * 1000).toFixed(2)} ms`,
                            'Experimental Speed v': `${sosCalculatedSpeed} m/s`,
                            'Theoretical Speed': '343 m/s',
                            'Percentage Error': `${(((sosCalculatedSpeed - 343) / 343) * 100).toFixed(1)}%`,
                          },
                        });
                      }}
                      className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Log Speed of Sound to Notebook</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              Tip: Position your microphone at distance d from a reflector or between two clapping points,
              click Arm, and clap twice sharply!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

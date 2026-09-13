import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Sun,
  Zap,
  Flame,
  BookOpen,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronRight,
  Compass,
  Activity,
  Layers,
} from 'lucide-react';
import { NotebookCard } from '../../types/physics';
import { FrequencyRecorder } from '../Sound/FrequencyRecorder';

interface PhysicsSuiteProps {
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
  onSelectSampleVideo?: (sampleId: string) => void;
}

export const PhysicsSuite: React.FC<PhysicsSuiteProps> = ({
  onAddToNotebook,
  onSelectSampleVideo,
}) => {
  const [activeSuite, setActiveSuite] = useState<'rotational' | 'optics' | 'circuits' | 'thermo' | 'acoustics'>('rotational');

  // =========================================================================
  // 0. ACOUSTICS & FREQUENCY f(t) STATE
  // =========================================================================
  const [acousticsFreq, setAcousticsFreq] = useState<number>(440);
  const [acousticsDb, setAcousticsDb] = useState<number>(-25);
  const [isAcousticsMicActive, setIsAcousticsMicActive] = useState<boolean>(false);
  const acousticsAudioCtxRef = useRef<AudioContext | null>(null);
  const acousticsAnalyserRef = useRef<AnalyserNode | null>(null);
  const acousticsStreamRef = useRef<MediaStream | null>(null);
  const acousticsAnimRef = useRef<number | null>(null);

  const startAcousticsMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      acousticsStreamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      acousticsAudioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      acousticsAnalyserRef.current = analyser;
      setIsAcousticsMicActive(true);

      const bufferLength = analyser.frequencyBinCount;
      const freqData = new Float32Array(bufferLength);

      const updatePitch = () => {
        if (!analyser || !ctx) return;
        analyser.getFloatFrequencyData(freqData);

        let maxVal = -Infinity;
        let maxIndex = 0;
        const minBin = Math.floor(40 / (ctx.sampleRate / analyser.fftSize));
        const maxBin = Math.floor(5000 / (ctx.sampleRate / analyser.fftSize));

        for (let i = minBin; i < maxBin && i < bufferLength; i++) {
          if (freqData[i] > maxVal) {
            maxVal = freqData[i];
            maxIndex = i;
          }
        }

        if (maxVal > -65) {
          const rawFreq = maxIndex * (ctx.sampleRate / analyser.fftSize);
          setAcousticsFreq(Math.round(rawFreq * 10) / 10);
          setAcousticsDb(Math.round(maxVal * 10) / 10);
        }

        acousticsAnimRef.current = requestAnimationFrame(updatePitch);
      };

      acousticsAnimRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      console.warn('Microphone access unavailable for acoustics suite:', err);
    }
  };

  const stopAcousticsMic = () => {
    if (acousticsAnimRef.current) cancelAnimationFrame(acousticsAnimRef.current);
    if (acousticsStreamRef.current) acousticsStreamRef.current.getTracks().forEach((t) => t.stop());
    if (acousticsAudioCtxRef.current) acousticsAudioCtxRef.current.close();
    acousticsStreamRef.current = null;
    acousticsAudioCtxRef.current = null;
    acousticsAnalyserRef.current = null;
    setIsAcousticsMicActive(false);
  };

  useEffect(() => {
    return () => {
      stopAcousticsMic();
    };
  }, []);

  // =========================================================================
  // 1. ROTATIONAL MOTION STATE
  // =========================================================================
  const [rotShape, setRotShape] = useState<'disk' | 'ring' | 'sphere' | 'rod'>('disk');
  const [rotMass, setRotMass] = useState<number>(2.0); // kg
  const [rotRadius, setRotRadius] = useState<number>(0.5); // m
  const [rotTorque, setRotTorque] = useState<number>(1.5); // N·m
  const [rotOmega, setRotOmega] = useState<number>(0); // rad/s
  const [rotAngle, setRotAngle] = useState<number>(0); // radians
  const [isRotSpinning, setIsRotSpinning] = useState<boolean>(false);
  const rotCanvasRef = useRef<HTMLCanvasElement>(null);
  const rotAnimRef = useRef<number | null>(null);

  // Moment of Inertia calculation
  const getMomentOfInertia = (shape: string, m: number, r: number) => {
    switch (shape) {
      case 'ring':
        return m * r * r;
      case 'sphere':
        return 0.4 * m * r * r;
      case 'rod':
        return (1 / 12) * m * (2 * r) * (2 * r);
      case 'disk':
      default:
        return 0.5 * m * r * r;
    }
  };

  const rotInertia = getMomentOfInertia(rotShape, rotMass, rotRadius);
  const rotAlpha = rotInertia > 0 ? rotTorque / rotInertia : 0; // rad/s^2
  const rotV_tangential = rotOmega * rotRadius; // m/s
  const rotA_centripetal = rotOmega * rotOmega * rotRadius; // m/s^2
  const rotKineticEnergy = 0.5 * rotInertia * rotOmega * rotOmega; // Joules
  const rotAngularMomentum = rotInertia * rotOmega; // kg·m^2/s

  // Rotational Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animateRot = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (isRotSpinning) {
        setRotOmega((prev) => {
          const nextOmega = Math.max(0, prev + rotAlpha * dt - prev * 0.05 * dt); // slight damping
          return nextOmega;
        });
        setRotAngle((prev) => (prev + rotOmega * dt) % (2 * Math.PI));
      }

      // Draw Flywheel Canvas
      const canvas = rotCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const cx = w / 2;
          const cy = h / 2;
          const pixelR = Math.min(cx, cy) * 0.75;

          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Outer Track / Rim
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, pixelR, 0, 2 * Math.PI);
          ctx.stroke();

          // Body fill
          ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
          ctx.beginPath();
          ctx.arc(cx, cy, pixelR, 0, 2 * Math.PI);
          ctx.fill();

          // Spokes / Orientation indicator
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rotAngle);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(pixelR, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 2);
          }

          // Marker dot on rim
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(pixelR, 0, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();

          // Center Pivot
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Direction of rotation arrow
          if (rotOmega > 0) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, pixelR + 14, -0.4, 0.4);
            ctx.stroke();
          }
        }
      }

      rotAnimRef.current = requestAnimationFrame(animateRot);
    };

    rotAnimRef.current = requestAnimationFrame(animateRot);
    return () => {
      if (rotAnimRef.current) cancelAnimationFrame(rotAnimRef.current);
    };
  }, [isRotSpinning, rotAlpha, rotOmega, rotAngle]);

  // =========================================================================
  // 2. OPTICS & WAVE PHYSICS STATE
  // =========================================================================
  const [opticsMode, setOpticsMode] = useState<'lens' | 'snell' | 'diffraction'>('lens');
  const [focalLength, setFocalLength] = useState<number>(15); // cm (+ convex, - concave)
  const [objectDistance, setObjectDistance] = useState<number>(30); // cm
  const [objectHeight, setObjectHeight] = useState<number>(8); // cm

  // Snell's Law
  const [n1, setN1] = useState<number>(1.0); // air
  const [n2, setN2] = useState<number>(1.52); // crown glass
  const [theta1Deg, setTheta1Deg] = useState<number>(35); // degrees

  // Young's Double Slit
  const [slitWavelengthNm, setSlitWavelengthNm] = useState<number>(632.8); // nm (He-Ne laser red)
  const [slitDistanceUm, setSlitDistanceUm] = useState<number>(100); // um
  const [screenDistanceM, setScreenDistanceM] = useState<number>(1.5); // m

  const opticsCanvasRef = useRef<HTMLCanvasElement>(null);

  // Thin lens calculations: 1/f = 1/do + 1/di => di = (f * do) / (do - f)
  const isVirtual = objectDistance === focalLength;
  const imageDistance = objectDistance !== focalLength ? (focalLength * objectDistance) / (objectDistance - focalLength) : 9999;
  const magnification = objectDistance !== 0 ? -imageDistance / objectDistance : 0;
  const imageHeight = magnification * objectHeight;

  // Snell's Law calculations: n1 * sin(t1) = n2 * sin(t2)
  const theta1Rad = (theta1Deg * Math.PI) / 180;
  const sinTheta2 = (n1 * Math.sin(theta1Rad)) / n2;
  const isTIR = sinTheta2 > 1.0;
  const theta2Deg = isTIR ? 0 : (Math.asin(sinTheta2) * 180) / Math.PI;
  const criticalAngleDeg = n1 < n2 ? (Math.asin(n1 / n2) * 180) / Math.PI : (Math.asin(n2 / n1) * 180) / Math.PI;

  // Double slit fringe spacing: dy = (lambda * L) / d
  const fringeSpacingMm = ((slitWavelengthNm * 1e-9 * screenDistanceM) / (slitDistanceUm * 1e-6)) * 1000;

  // Draw Optics Canvas
  useEffect(() => {
    const canvas = opticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    if (opticsMode === 'lens') {
      const cx = w / 2;
      const cy = h / 2;
      const scale = 5; // px per cm

      // Optical Axis
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Lens Plane
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 90);
      ctx.lineTo(cx, cy + 90);
      ctx.stroke();

      // Lens markers
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(focalLength > 0 ? 'Convex (+f)' : 'Concave (-f)', cx - 25, cy - 95);

      // Focal Points
      const fPx = focalLength * scale;
      ctx.fillStyle = '#f59e0b';
      [cx - fPx, cx + fPx].forEach((x, idx) => {
        ctx.beginPath();
        ctx.arc(x, cy, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(idx === 0 ? 'F₁' : 'F₂', x - 6, cy + 18);
      });

      // Object (Arrow on Left)
      const objX = cx - objectDistance * scale;
      const objY = cy - objectHeight * scale;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(objX, cy);
      ctx.lineTo(objX, objY);
      ctx.stroke();
      // Arrow head
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(objX, objY);
      ctx.lineTo(objX - 5, objY + 8);
      ctx.lineTo(objX + 5, objY + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillText(`Object (${objectDistance}cm)`, objX - 30, cy + 15);

      // Image (Arrow)
      if (!isVirtual && Math.abs(imageDistance) < 200) {
        const imgX = cx + imageDistance * scale;
        const imgY = cy - imageHeight * scale;
        ctx.strokeStyle = imageDistance > 0 ? '#ec4899' : '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(imgX, cy);
        ctx.lineTo(imgX, imgY);
        ctx.stroke();
        ctx.fillStyle = imageDistance > 0 ? '#ec4899' : '#a855f7';
        ctx.fillText(
          `${imageDistance > 0 ? 'Real Image' : 'Virtual Image'} (${imageDistance.toFixed(1)}cm)`,
          imgX - 25,
          cy + (imageHeight > 0 ? -10 : 20)
        );

        // Principal Ray 1: Parallel to axis then through focus
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(objX, objY);
        ctx.lineTo(cx, objY);
        ctx.lineTo(imgX, imgY);
        ctx.stroke();

        // Principal Ray 2: Straight through lens center
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.beginPath();
        ctx.moveTo(objX, objY);
        ctx.lineTo(cx, cy);
        ctx.lineTo(imgX, imgY);
        ctx.stroke();
      }
    } else if (opticsMode === 'snell') {
      const cx = w / 2;
      const cy = h / 2;

      // Interface boundary
      ctx.fillStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.fillRect(0, cy, w, cy);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Normal line (dashed)
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`Medium 1 (n₁ = ${n1})`, 20, 40);
      ctx.fillText(`Medium 2 (n₂ = ${n2})`, 20, cy + 40);

      // Incident Ray
      const rayLen = 140;
      const incX = cx - rayLen * Math.sin(theta1Rad);
      const incY = cy - rayLen * Math.cos(theta1Rad);
      ctx.strokeStyle = '#ef4444'; // Red laser
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(incX, incY);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Reflected Ray (Law of Reflection)
      const refX = cx + rayLen * Math.sin(theta1Rad);
      const refY = cy - rayLen * Math.cos(theta1Rad);
      ctx.strokeStyle = isTIR ? '#ef4444' : 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(refX, refY);
      ctx.stroke();

      // Refracted Ray (if not TIR)
      if (!isTIR) {
        const theta2Rad = (theta2Deg * Math.PI) / 180;
        const refrX = cx + rayLen * Math.sin(theta2Rad);
        const refrY = cy + rayLen * Math.cos(theta2Rad);
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(refrX, refrY);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('TOTAL INTERNAL REFLECTION (θ₁ > θ_c)', cx + 20, cy - 30);
      }
    } else {
      // Diffraction & Double slit fringes
      const slitX = 80;
      const screenX = w - 40;
      const cy = h / 2;

      // Barrier
      ctx.fillStyle = '#334155';
      ctx.fillRect(slitX - 4, 20, 8, cy - 30);
      ctx.fillRect(slitX - 4, cy + 30, 8, h - cy - 50);

      // Screen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(screenX, 20, 10, h - 40);

      // Draw interference intensity on screen
      const numFringes = 15;
      for (let i = -numFringes; i <= numFringes; i++) {
        const y = cy + i * (fringeSpacingMm * 4);
        if (y > 20 && y < h - 20) {
          const intensity = Math.pow(Math.cos((i * Math.PI) / 2), 2);
          ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0.08, intensity)})`;
          ctx.fillRect(screenX - 30, y - 6, 28, 12);
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`Double Slit Screen (Fringe Spacing Δy = ${fringeSpacingMm.toFixed(2)} mm)`, 120, 40);
    }
  }, [opticsMode, focalLength, objectDistance, objectHeight, imageDistance, imageHeight, isVirtual, n1, n2, theta1Deg, isTIR, theta2Deg, fringeSpacingMm]);

  // =========================================================================
  // 3. ELECTRICITY & MAGNETISM (E&M) STATE
  // =========================================================================
  const [emMode, setEmMode] = useState<'dc' | 'rc' | 'magnetism'>('dc');
  const [voltage, setVoltage] = useState<number>(12); // Volts
  const [circuitType, setCircuitType] = useState<'series' | 'parallel'>('series');
  const [r1, setR1] = useState<number>(100); // Ohms
  const [r2, setR2] = useState<number>(220); // Ohms
  const [r3, setR3] = useState<number>(330); // Ohms

  // RC Circuit
  const [rcResistanceK, setRcResistanceK] = useState<number>(10); // kOhms
  const [rcCapacitanceU, setRcCapacitanceU] = useState<number>(100); // uF
  const [rcIsCharging, setRcIsCharging] = useState<boolean>(true);

  // Magnetism
  const [solenoidTurns, setSolenoidTurns] = useState<number>(500);
  const [solenoidCurrent, setSolenoidCurrent] = useState<number>(2.0); // Amps
  const [solenoidLengthM, setSolenoidLengthM] = useState<number>(0.25); // m

  const emCanvasRef = useRef<HTMLCanvasElement>(null);

  // DC Circuit Calculations
  const rEquivalent =
    circuitType === 'series'
      ? r1 + r2 + r3
      : 1 / (1 / r1 + 1 / r2 + 1 / r3);
  const totalCurrentAmps = voltage / (rEquivalent || 1);
  const totalPowerWatts = voltage * totalCurrentAmps;

  // RC calculations: tau = R * C (in seconds)
  const rcTauSeconds = (rcResistanceK * 1000 * rcCapacitanceU * 1e-6); // tau = RC

  // Solenoid B = mu0 * (N/L) * I (in Tesla)
  const mu0 = 4 * Math.PI * 1e-7;
  const solenoidTesla = (mu0 * (solenoidTurns / (solenoidLengthM || 0.1)) * solenoidCurrent);
  const solenoidMicroTesla = solenoidTesla * 1e6;

  // Draw Circuit / RC Canvas
  useEffect(() => {
    const canvas = emCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    if (emMode === 'rc') {
      // Draw RC Transient Exponential Curve
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      // Grid
      for (let x = 40; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 30);
        ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.lineTo(40, h - 30);
      ctx.lineTo(w - 20, h - 30);
      ctx.stroke();

      // Exponential Curve Vc(t)
      ctx.strokeStyle = rcIsCharging ? '#38bdf8' : '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const timeSteps = 100;
      const maxT = 5 * rcTauSeconds; // show 5 tau
      for (let i = 0; i <= timeSteps; i++) {
        const t = (i / timeSteps) * maxT;
        const v = rcIsCharging
          ? voltage * (1 - Math.exp(-t / rcTauSeconds))
          : voltage * Math.exp(-t / rcTauSeconds);
        const x = 40 + (i / timeSteps) * (w - 70);
        const y = h - 30 - (v / voltage) * (h - 60);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Tau marker (63.2% V0)
      const tauX = 40 + (1 / 5) * (w - 70);
      const tauY = h - 30 - 0.632 * (h - 60);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tauX, tauY, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`τ = ${(rcTauSeconds * 1000).toFixed(0)} ms (63.2%)`, tauX + 10, tauY);
    } else {
      // Draw Circuit Schematic Box
      const cx = w / 2;
      const cy = h / 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;

      // Loop wire
      ctx.strokeRect(cx - 160, cy - 70, 320, 140);

      // Battery on Left
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 165, cy - 20, 10, 40);
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cx - 170, cy - 15);
      ctx.lineTo(cx - 150, cy - 15);
      ctx.moveTo(cx - 165, cy + 15);
      ctx.lineTo(cx - 155, cy + 15);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${voltage}V`, cx - 200, cy + 5);

      // Resistors on Top/Right
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(
        circuitType === 'series'
          ? `Series: R₁(${r1}Ω) + R₂(${r2}Ω) + R₃(${r3}Ω) = ${rEquivalent.toFixed(1)}Ω`
          : `Parallel: R_eq = ${rEquivalent.toFixed(1)}Ω`,
        cx - 100,
        cy - 85
      );
      ctx.fillText(`Current I = ${(totalCurrentAmps * 1000).toFixed(1)} mA | Power = ${totalPowerWatts.toFixed(2)} W`, cx - 90, cy + 95);
    }
  }, [emMode, voltage, circuitType, r1, r2, r3, rEquivalent, totalCurrentAmps, totalPowerWatts, rcResistanceK, rcCapacitanceU, rcTauSeconds, rcIsCharging]);

  // =========================================================================
  // 4. THERMODYNAMICS STATE
  // =========================================================================
  const [thermoProcess, setThermoProcess] = useState<'isothermal' | 'isobaric' | 'isochoric' | 'carnot'>('isothermal');
  const [gasMoles, setGasMoles] = useState<number>(1.0); // mol
  const [tempKelvin, setTempKelvin] = useState<number>(300); // K
  const [volume1, setVolume1] = useState<number>(10); // Liters
  const [volume2, setVolume2] = useState<number>(25); // Liters
  const [tempColdCarnot, setTempColdCarnot] = useState<number>(280); // K
  const [tempHotCarnot, setTempHotCarnot] = useState<number>(500); // K

  // Calorimetry
  const [calorimeterM1, setCalorimeterM1] = useState<number>(0.5); // kg water
  const [calorimeterT1, setCalorimeterT1] = useState<number>(20); // deg C
  const [calorimeterM2, setCalorimeterM2] = useState<number>(0.2); // kg metal
  const [calorimeterT2, setCalorimeterT2] = useState<number>(100); // deg C
  const [metalSpecificHeat, setMetalSpecificHeat] = useState<number>(385); // Copper 385 J/kg K

  const thermoCanvasRef = useRef<HTMLCanvasElement>(null);

  // Ideal Gas: P = nRT / V (R = 8.314 J/mol K, V in m^3)
  const R_GAS = 8.314;
  const p1Kpa = (gasMoles * R_GAS * tempKelvin) / (volume1 * 1e-3) / 1000;
  const p2Kpa = (gasMoles * R_GAS * tempKelvin) / (volume2 * 1e-3) / 1000;

  // Work done W
  const isothermalWorkJoules = gasMoles * R_GAS * tempKelvin * Math.log(volume2 / volume1);
  const isobaricWorkJoules = p1Kpa * 1000 * (volume2 - volume1) * 1e-3;
  const carnotEfficiency = 1 - tempColdCarnot / tempHotCarnot;

  // Calorimetry equilibrium: (m1*c1*T1 + m2*c2*T2) / (m1*c1 + m2*c2)
  const cWater = 4184; // J/kg K
  const equilibriumTempC =
    (calorimeterM1 * cWater * calorimeterT1 + calorimeterM2 * metalSpecificHeat * calorimeterT2) /
    (calorimeterM1 * cWater + calorimeterM2 * metalSpecificHeat);

  // Draw P-V Diagram Canvas
  useEffect(() => {
    const canvas = thermoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(50, h - 40);
    ctx.lineTo(w - 20, h - 40);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Pressure P (kPa)', 15, 18);
    ctx.fillText('Volume V (Liters)', w - 100, h - 20);

    // P-V Curve
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();

    const maxV = 40;
    const minV = 5;
    const maxP = 500;

    for (let v = minV; v <= maxV; v += 0.5) {
      const p = (gasMoles * R_GAS * tempKelvin) / (v * 1e-3) / 1000;
      const x = 50 + ((v - minV) / (maxV - minV)) * (w - 80);
      const y = h - 40 - (p / maxP) * (h - 70);
      if (v === minV) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill work area under curve between V1 and V2
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    const x1 = 50 + ((volume1 - minV) / (maxV - minV)) * (w - 80);
    const x2 = 50 + ((volume2 - minV) / (maxV - minV)) * (w - 80);
    ctx.moveTo(x1, h - 40);

    for (let v = volume1; v <= volume2; v += 0.5) {
      const p = (gasMoles * R_GAS * tempKelvin) / (v * 1e-3) / 1000;
      const x = 50 + ((v - minV) / (maxV - minV)) * (w - 80);
      const y = h - 40 - (p / maxP) * (h - 70);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(x2, h - 40);
    ctx.closePath();
    ctx.fill();

    // Label Work W
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Work Area W = ${isothermalWorkJoules.toFixed(1)} J`, (x1 + x2) / 2 - 40, h - 60);
  }, [gasMoles, tempKelvin, volume1, volume2, isothermalWorkJoules]);

  // Send to Notebook Helper
  const handleSendSuiteToNotebook = () => {
    if (!onAddToNotebook) return;

    if (activeSuite === 'rotational') {
      const canvas = rotCanvasRef.current;
      const imgUrl = canvas ? canvas.toDataURL('image/png') : undefined;
      onAddToNotebook({
        type: 'physics-suite',
        title: `Rotational Dynamics: ${rotShape.toUpperCase()} Flywheel`,
        content: `Analyzed rotational motion of a ${rotMass} kg ${rotShape} (Radius: ${rotRadius} m) under torque τ = ${rotTorque} N·m. Measured moment of inertia I = ${rotInertia.toFixed(4)} kg·m², angular acceleration α = ${rotAlpha.toFixed(2)} rad/s², and rotational kinetic energy E_rot = ${rotKineticEnergy.toFixed(2)} J.`,
        imageUrl: imgUrl,
        dataSnippet: {
          'Shape Geometry': rotShape,
          'Moment of Inertia I': `${rotInertia.toFixed(4)} kg·m²`,
          'Angular Accel α': `${rotAlpha.toFixed(2)} rad/s²`,
          'Applied Torque τ': `${rotTorque} N·m`,
          'Rotational Energy': `${rotKineticEnergy.toFixed(2)} J`,
          'Angular Momentum L': `${rotAngularMomentum.toFixed(3)} kg·m²/s`,
        },
      });
    } else if (activeSuite === 'optics') {
      const canvas = opticsCanvasRef.current;
      const imgUrl = canvas ? canvas.toDataURL('image/png') : undefined;
      onAddToNotebook({
        type: 'physics-suite',
        title: `Optics Studio: ${opticsMode.toUpperCase()}`,
        content:
          opticsMode === 'lens'
            ? `Thin lens inquiry with focal length f = ${focalLength} cm and object distance do = ${objectDistance} cm. Found image distance di = ${imageDistance.toFixed(1)} cm and magnification M = ${magnification.toFixed(2)} (${imageDistance > 0 ? 'Real' : 'Virtual'}).`
            : `Refraction study through media n₁ = ${n1} to n₂ = ${n2}. Incident angle θ₁ = ${theta1Deg}°, refracted angle θ₂ = ${theta2Deg.toFixed(1)}°, critical angle θ_c = ${criticalAngleDeg.toFixed(1)}°.`,
        imageUrl: imgUrl,
        dataSnippet:
          opticsMode === 'lens'
            ? {
                'Focal Length f': `${focalLength} cm`,
                'Object Distance do': `${objectDistance} cm`,
                'Image Distance di': `${imageDistance.toFixed(1)} cm`,
                'Magnification M': magnification.toFixed(2),
                'Image Nature': imageDistance > 0 ? 'Real & Inverted' : 'Virtual & Upright',
              }
            : {
                'Index n₁': n1,
                'Index n₂': n2,
                'Incident Angle': `${theta1Deg}°`,
                'Refracted Angle': `${theta2Deg.toFixed(1)}°`,
                'Critical Angle': `${criticalAngleDeg.toFixed(1)}°`,
              },
      });
    } else if (activeSuite === 'circuits') {
      onAddToNotebook({
        type: 'physics-suite',
        title: `Electricity & Circuits: ${emMode.toUpperCase()}`,
        content: `DC circuit analysis with ${voltage}V supply across ${circuitType} network. Equivalent resistance R_eq = ${rEquivalent.toFixed(1)} Ω, Total current I = ${(totalCurrentAmps * 1000).toFixed(1)} mA, Power P = ${totalPowerWatts.toFixed(2)} W.`,
        dataSnippet: {
          'Source Voltage': `${voltage} V`,
          'Circuit Topology': circuitType,
          'Equivalent Resistance': `${rEquivalent.toFixed(1)} Ω`,
          'Circuit Current': `${(totalCurrentAmps * 1000).toFixed(1)} mA`,
          'Power Dissipation': `${totalPowerWatts.toFixed(2)} W`,
        },
      });
    } else if (activeSuite === 'acoustics') {
      onAddToNotebook({
        type: 'sound',
        title: `Acoustics & Frequency Kinematics: f(t) Analysis`,
        content: `Evaluated fundamental acoustic frequency f = ${acousticsFreq.toFixed(1)} Hz. Loudness level: ${acousticsDb.toFixed(1)} dB SPL. Period T = ${(1000 / acousticsFreq).toFixed(2)} ms.`,
        dataSnippet: {
          'Frequency': `${acousticsFreq.toFixed(1)} Hz`,
          'Period T': `${(1000 / acousticsFreq).toFixed(2)} ms`,
          'Acoustic Level': `${acousticsDb.toFixed(1)} dB SPL`,
        },
      });
    } else {
      const canvas = thermoCanvasRef.current;
      const imgUrl = canvas ? canvas.toDataURL('image/png') : undefined;
      onAddToNotebook({
        type: 'physics-suite',
        title: `Thermodynamics: Ideal Gas & Calorimetry`,
        content: `Evaluated ${thermoProcess} expansion of ${gasMoles} moles of gas at T = ${tempKelvin} K from ${volume1}L to ${volume2}L. Work done W = ${isothermalWorkJoules.toFixed(1)} J. Calorimetry equilibrium temperature T_f = ${equilibriumTempC.toFixed(2)}°C.`,
        imageUrl: imgUrl,
        dataSnippet: {
          'Process Mode': thermoProcess,
          'Gas Quantity': `${gasMoles} mol`,
          'Temperature': `${tempKelvin} K`,
          'Work Output': `${isothermalWorkJoules.toFixed(1)} J`,
          'Thermal Equilibrium T_f': `${equilibriumTempC.toFixed(2)} °C`,
        },
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-4 gap-4 overflow-y-auto select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900">Physics Laboratory Suites</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                Multi-Topic Physics
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Rotational Dynamics, Wave & Ray Optics, Circuits & E&M, Thermodynamics, and Acoustics f(t)
            </p>
          </div>
        </div>

        {/* Suite Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSuite('rotational')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSuite === 'rotational'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotational Motion</span>
          </button>

          <button
            onClick={() => setActiveSuite('optics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSuite === 'optics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Optics & Waves</span>
          </button>

          <button
            onClick={() => setActiveSuite('circuits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSuite === 'circuits'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Circuits & E&M</span>
          </button>

          <button
            onClick={() => setActiveSuite('thermo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSuite === 'thermo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Thermodynamics</span>
          </button>

          <button
            onClick={() => setActiveSuite('acoustics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSuite === 'acoustics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Acoustics & Frequency f(t)</span>
          </button>
        </div>

        {/* Action Button */}
        {onAddToNotebook && (
          <button
            onClick={handleSendSuiteToNotebook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-xs"
            title="Export simulation and theoretical data to Lab Notebook"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Add to Notebook</span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 1. ROTATIONAL MOTION SUITE */}
      {/* ===================================================================== */}
      {activeSuite === 'rotational' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Left Canvas Visualizer */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Interactive Flywheel & Rotational Dynamics
                </h2>
                <p className="text-[11px] text-slate-500">
                  Moment of Inertia I, Torque τ = Iα, Angular Momentum L = Iω, and Centripetal Accel a_c = ω²R
                </p>
              </div>

              <button
                onClick={() => setIsRotSpinning(!isRotSpinning)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition shadow-xs ${
                  isRotSpinning
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRotSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRotSpinning ? 'Pause Rotation' : 'Spin Flywheel'}</span>
              </button>
            </div>

            <div className="flex-1 relative min-h-[260px]">
              <canvas
                ref={rotCanvasRef}
                width={560}
                height={280}
                className="w-full h-full rounded-xl bg-slate-950"
              />
            </div>

            {/* Quick Link to Real Videos */}
            {onSelectSampleVideo && (
              <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900">
                  🎬 Analyze Real Rotational Motion Experiments:
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectSampleVideo('tracker-bicycle-wheel')}
                    className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded border border-blue-300"
                  >
                    Bicycle Wheel (ω, α)
                  </button>
                  <button
                    onClick={() => onSelectSampleVideo('tracker-skater-300fps')}
                    className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded border border-blue-300"
                  >
                    300 FPS Figure Skater (L = Iω)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Parameters & Readouts */}
          <div className="w-full lg:w-96 flex flex-col gap-3">
            {/* Parameters Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Object Parameters
              </span>

              {/* Geometry Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Body Geometry</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'disk', label: 'Solid Disk (½MR²)' },
                    { id: 'ring', label: 'Hoop/Ring (MR²)' },
                    { id: 'sphere', label: 'Sphere (⅖MR²)' },
                    { id: 'rod', label: 'Rod (¹/₁₂ML²)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setRotShape(s.id as any)}
                      className={`p-1.5 rounded text-[11px] font-bold border transition ${
                        rotShape === s.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mass Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Mass M:</span>
                  <span className="font-mono text-blue-600">{rotMass} kg</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={10.0}
                  step={0.1}
                  value={rotMass}
                  onChange={(e) => setRotMass(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Radius Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Radius R:</span>
                  <span className="font-mono text-blue-600">{rotRadius} m</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={rotRadius}
                  onChange={(e) => setRotRadius(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Torque Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Applied Torque τ:</span>
                  <span className="font-mono text-blue-600">{rotTorque} N·m</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={10.0}
                  step={0.1}
                  value={rotTorque}
                  onChange={(e) => setRotTorque(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Live Rotational Kinematics Readouts */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Kinematics & Energetics
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Moment of Inertia I</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {rotInertia.toFixed(4)} kg·m²
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Angular Accel α</div>
                  <div className="font-mono font-bold text-blue-600 text-sm">
                    {rotAlpha.toFixed(2)} rad/s²
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Angular Velocity ω</div>
                  <div className="font-mono font-bold text-indigo-600 text-sm">
                    {rotOmega.toFixed(2)} rad/s
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {((rotOmega * 60) / (2 * Math.PI)).toFixed(0)} RPM
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Rim Velocity v</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {rotV_tangential.toFixed(2)} m/s
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Centripetal a_c</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {rotA_centripetal.toFixed(1)} m/s²
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Rotational Energy</div>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    {rotKineticEnergy.toFixed(2)} J
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. OPTICS & WAVE PHYSICS SUITE */}
      {/* ===================================================================== */}
      {activeSuite === 'optics' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Ray Optics, Refraction & Wave Diffraction
                </h2>
                <p className="text-[11px] text-slate-500">
                  Thin Lens Equation, Snell's Law of Refraction & Young's Double Slit Interference
                </p>
              </div>

              {/* Optics Sub-mode Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setOpticsMode('lens')}
                  className={`px-2.5 py-1 rounded transition ${
                    opticsMode === 'lens' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Thin Lens
                </button>
                <button
                  onClick={() => setOpticsMode('snell')}
                  className={`px-2.5 py-1 rounded transition ${
                    opticsMode === 'snell' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Snell's Law (TIR)
                </button>
                <button
                  onClick={() => setOpticsMode('diffraction')}
                  className={`px-2.5 py-1 rounded transition ${
                    opticsMode === 'diffraction' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Double Slit
                </button>
              </div>
            </div>

            <div className="flex-1 relative min-h-[260px]">
              <canvas
                ref={opticsCanvasRef}
                width={560}
                height={280}
                className="w-full h-full rounded-xl bg-slate-950"
              />
            </div>
          </div>

          {/* Controls & Results */}
          <div className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {opticsMode === 'lens'
                ? 'Thin Lens Parameters'
                : opticsMode === 'snell'
                ? "Refraction Indices & Angles"
                : 'Interference Parameters'}
            </span>

            {opticsMode === 'lens' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Focal Length f:</span>
                    <span className="font-mono text-blue-600">{focalLength} cm</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    value={focalLength}
                    onChange={(e) => setFocalLength(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Object Distance d_o:</span>
                    <span className="font-mono text-blue-600">{objectDistance} cm</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={objectDistance}
                    onChange={(e) => setObjectDistance(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                  <div className="font-bold text-slate-700">Thin Lens Equation Result:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Image Distance d_i:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {isVirtual ? '∞ (Virtual)' : `${imageDistance.toFixed(1)} cm`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Magnification M:</span>
                    <span className="font-mono font-bold text-slate-900">{magnification.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Image Nature:</span>
                    <span className="font-bold text-indigo-700">
                      {imageDistance > 0 ? 'Real & Inverted' : 'Virtual & Upright'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {opticsMode === 'snell' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Angle of Incidence θ₁:</span>
                    <span className="font-mono text-blue-600">{theta1Deg}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={85}
                    value={theta1Deg}
                    onChange={(e) => setTheta1Deg(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Medium 1 (n₁)</label>
                    <select
                      value={n1}
                      onChange={(e) => setN1(Number(e.target.value))}
                      className="w-full p-1 border rounded bg-slate-50 font-bold"
                    >
                      <option value={1.0}>Air (1.00)</option>
                      <option value={1.33}>Water (1.33)</option>
                      <option value={1.52}>Glass (1.52)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Medium 2 (n₂)</label>
                    <select
                      value={n2}
                      onChange={(e) => setN2(Number(e.target.value))}
                      className="w-full p-1 border rounded bg-slate-50 font-bold"
                    >
                      <option value={1.0}>Air (1.00)</option>
                      <option value={1.33}>Water (1.33)</option>
                      <option value={1.52}>Glass (1.52)</option>
                      <option value={2.42}>Diamond (2.42)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refracted Angle θ₂:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {isTIR ? 'N/A (TIR)' : `${theta2Deg.toFixed(1)}°`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Critical Angle θ_c:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {n1 > n2 ? `${criticalAngleDeg.toFixed(1)}°` : 'None (n₁ < n₂)'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {opticsMode === 'diffraction' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Wavelength λ:</span>
                    <span className="font-mono text-rose-600">{slitWavelengthNm} nm</span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={700}
                    value={slitWavelengthNm}
                    onChange={(e) => setSlitWavelengthNm(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Slit Spacing d:</span>
                    <span className="font-mono text-blue-600">{slitDistanceUm} μm</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    value={slitDistanceUm}
                    onChange={(e) => setSlitDistanceUm(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fringe Spacing Δy:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      {fringeSpacingMm.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">Formula: Δy = λ·L / d</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. CIRCUITS & E&M SUITE */}
      {/* ===================================================================== */}
      {activeSuite === 'circuits' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Electric Circuits & Electromagnetism
                </h2>
                <p className="text-[11px] text-slate-500">
                  Ohm's Law, Kirchhoff's Laws, RC Transient Exponential Curves, & Solenoid Magnetic Fields
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setEmMode('dc')}
                  className={`px-2.5 py-1 rounded transition ${
                    emMode === 'dc' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  DC Circuit
                </button>
                <button
                  onClick={() => setEmMode('rc')}
                  className={`px-2.5 py-1 rounded transition ${
                    emMode === 'rc' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  RC Transient
                </button>
                <button
                  onClick={() => setEmMode('magnetism')}
                  className={`px-2.5 py-1 rounded transition ${
                    emMode === 'magnetism' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Solenoid B-Field
                </button>
              </div>
            </div>

            <div className="flex-1 relative min-h-[260px]">
              <canvas
                ref={emCanvasRef}
                width={560}
                height={280}
                className="w-full h-full rounded-xl bg-slate-950"
              />
            </div>
          </div>

          {/* Right Parameters */}
          <div className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {emMode === 'dc' ? 'DC Circuit Config' : emMode === 'rc' ? 'RC Parameters' : 'Solenoid Geometry'}
            </span>

            {emMode === 'dc' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Battery Voltage:</span>
                    <span className="font-mono text-blue-600">{voltage} V</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={voltage}
                    onChange={(e) => setVoltage(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCircuitType('series')}
                    className={`flex-1 py-1.5 rounded text-xs font-bold border ${
                      circuitType === 'series'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Series
                  </button>
                  <button
                    onClick={() => setCircuitType('parallel')}
                    className={`flex-1 py-1.5 rounded text-xs font-bold border ${
                      circuitType === 'parallel'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Parallel
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Equivalent Resistance R_eq:</span>
                    <span className="font-mono font-bold text-slate-900">{rEquivalent.toFixed(1)} Ω</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Current I:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {(totalCurrentAmps * 1000).toFixed(1)} mA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Power Dissipated P:</span>
                    <span className="font-mono font-bold text-emerald-600">{totalPowerWatts.toFixed(2)} W</span>
                  </div>
                </div>
              </>
            )}

            {emMode === 'rc' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Resistance R:</span>
                    <span className="font-mono text-blue-600">{rcResistanceK} kΩ</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={rcResistanceK}
                    onChange={(e) => setRcResistanceK(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Capacitance C:</span>
                    <span className="font-mono text-blue-600">{rcCapacitanceU} μF</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    value={rcCapacitanceU}
                    onChange={(e) => setRcCapacitanceU(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRcIsCharging(true)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold border ${
                      rcIsCharging
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Charging V_C(t)
                  </button>
                  <button
                    onClick={() => setRcIsCharging(false)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold border ${
                      !rcIsCharging
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Discharging
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time Constant τ = R·C:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      {(rcTauSeconds * 1000).toFixed(1)} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">99.3% Full Charge (5τ):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(5 * rcTauSeconds * 1000).toFixed(1)} ms
                    </span>
                  </div>
                </div>
              </>
            )}

            {emMode === 'magnetism' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Solenoid Coil Turns N:</span>
                    <span className="font-mono text-blue-600">{solenoidTurns} turns</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={50}
                    value={solenoidTurns}
                    onChange={(e) => setSolenoidTurns(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Current I:</span>
                    <span className="font-mono text-blue-600">{solenoidCurrent} A</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={solenoidCurrent}
                    onChange={(e) => setSolenoidCurrent(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                  <div className="font-bold text-slate-700">Internal Magnetic Field B:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">B in Microteslas (μT):</span>
                    <span className="font-mono font-bold text-blue-700 text-base">
                      {solenoidMicroTesla.toFixed(0)} μT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">B in Tesla:</span>
                    <span className="font-mono font-bold text-slate-900">{solenoidTesla.toExponential(3)} T</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">Earth B ≈ 50 μT</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. THERMODYNAMICS SUITE */}
      {/* ===================================================================== */}
      {activeSuite === 'thermo' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  Thermodynamics, P-V Diagrams & Heat Engines
                </h2>
                <p className="text-[11px] text-slate-500">
                  Ideal Gas Law PV = nRT, Work Area W = ∫P dV, Carnot Heat Engine, & Calorimetry
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setThermoProcess('isothermal')}
                  className={`px-2.5 py-1 rounded transition ${
                    thermoProcess === 'isothermal' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Isothermal (T const)
                </button>
                <button
                  onClick={() => setThermoProcess('carnot')}
                  className={`px-2.5 py-1 rounded transition ${
                    thermoProcess === 'carnot' ? 'bg-blue-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Carnot Cycle (η)
                </button>
              </div>
            </div>

            <div className="flex-1 relative min-h-[260px]">
              <canvas
                ref={thermoCanvasRef}
                width={560}
                height={280}
                className="w-full h-full rounded-xl bg-slate-950"
              />
            </div>
          </div>

          {/* Right Parameters & Calorimetry */}
          <div className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Ideal Gas & Heat Parameters
            </span>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Temperature T:</span>
                <span className="font-mono text-amber-600">{tempKelvin} K ({tempKelvin - 273}°C)</span>
              </div>
              <input
                type="range"
                min={200}
                max={600}
                value={tempKelvin}
                onChange={(e) => setTempKelvin(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Volume Range (V₁ → V₂):</span>
                <span className="font-mono text-blue-600">{volume1}L → {volume2}L</span>
              </div>
              <input
                type="range"
                min={12}
                max={35}
                value={volume2}
                onChange={(e) => setVolume2(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Calculations Card */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
              <div className="font-bold text-slate-700">Thermodynamic Results:</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Pressure P₁:</span>
                <span className="font-mono font-bold text-slate-900">{p1Kpa.toFixed(1)} kPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Final Pressure P₂:</span>
                <span className="font-mono font-bold text-slate-900">{p2Kpa.toFixed(1)} kPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Work Done W:</span>
                <span className="font-mono font-bold text-amber-600 text-sm">
                  {isothermalWorkJoules.toFixed(1)} J
                </span>
              </div>
              {thermoProcess === 'carnot' && (
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-500">Carnot Efficiency η:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {(carnotEfficiency * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Calorimetry Mixer */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs flex flex-col gap-1.5 mt-1">
              <div className="font-bold text-amber-900">Calorimetry Heat Exchange:</div>
              <div className="text-[11px] text-amber-800">
                Mixing {calorimeterM1}kg Water at {calorimeterT1}°C with {calorimeterM2}kg Copper at {calorimeterT2}°C:
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-bold text-amber-900">Final Equilibrium T_f:</span>
                <span className="font-mono font-extrabold text-amber-700 text-sm">
                  {equilibriumTempC.toFixed(2)} °C
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. ACOUSTICS & FREQUENCY f(t) SUITE */}
      {/* ===================================================================== */}
      {activeSuite === 'acoustics' && (
        <FrequencyRecorder
          currentFreq={acousticsFreq}
          currentDb={acousticsDb}
          isListening={isAcousticsMicActive}
          onStartAudio={startAcousticsMic}
          onStopAudio={stopAcousticsMic}
          onAddToNotebook={onAddToNotebook}
          allowSimulations={true}
          onSimulateFreq={(f) => {
            setAcousticsFreq(f);
            setAcousticsDb(-20);
          }}
          title="Acoustics & Frequency Kinematics Suite"
          subtitle="Real-time frequency as a function of time f(t), Doppler shift & chirp physical generators, CSV export, and Erase & Restart"
        />
      )}
    </div>
  );
};


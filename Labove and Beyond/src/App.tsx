import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { VideoTracker } from './components/Tracker/VideoTracker';
import { TrackerControls } from './components/Tracker/TrackerControls';
import { KinematicsGraph } from './components/Graphs/KinematicsGraph';
import { DataTable } from './components/Table/DataTable';
import { WebcamRecorder } from './components/Modals/WebcamRecorder';
import { HelpGuide } from './components/Modals/HelpGuide';
import { AutotrackModal } from './components/Tracker/AutotrackModal';
import { SoundStudio } from './components/Sound/SoundStudio';
import { LabNotebook } from './components/Notebook/LabNotebook';
import { PhysicsSuite } from './components/PhysicsSuites/PhysicsSuite';
import { VideoLibraryModal } from './components/Modals/VideoLibraryModal';
import { StroboscopeModal } from './components/Tracker/StroboscopeModal';
import {
  ActiveTool,
  AutotrackConfig,
  AutotrackMatchResult,
  AutotrackTemplate,
  CalibrationScale,
  CoordinateOrigin,
  LabNotebookState,
  NotebookCard,
  Point2D,
  TrackSeries,
  VectorDisplayOptions,
  VideoTrimRange,
  ViewMode,
} from './types/physics';
import { computeCenterOfMass, computeKinematics } from './utils/kinematics';
import { REAL_EXPERIMENT_VIDEOS, resolveMediaUrl } from './utils/videoLibrary';
import { extractTemplate, matchTemplate, seekVideoFrame } from './utils/autotracker';
import { exportToCsv, exportToExcel, exportToJson } from './utils/exportUtils';
import { getLabTemplateForSample } from './data/labTemplates';
import { Play, Pause, ChevronLeft, ChevronRight, X, Sparkles, GripHorizontal } from 'lucide-react';

const INITIAL_NOTEBOOK: LabNotebookState = {
  title: 'Lab 3: Two-Dimensional Projectile Motion & Independence of Motions',
  author: 'Physics Student',
  date: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  description:
    'Investigation of 2D parabolic motion, horizontal velocity invariance, and vertical gravitational acceleration.',
  activeLabId: 'lab-parabola',
  cards: [
    {
      id: 'card-init-1',
      type: 'hypothesis',
      title: 'Research Hypothesis',
      content:
        'For an object undergoing projectile motion under Earth gravity (neglecting air drag), the horizontal velocity vx(t) remains invariant while the vertical acceleration ay(t) remains constant and equal to g = -9.81 m/s².',
      timestamp: '09:00',
    },
    {
      id: 'card-init-2',
      type: 'protocol',
      title: 'Experimental Protocol & Apparatus',
      content:
        '1. High-speed video recording at calibrated frame rate (30 or 60 FPS).\n2. Scale calibration using a 1-meter reference length.\n3. Coordinate system origin set at launch point with upward Y positive.\n4. Automatic cross-correlation tracking with adaptive template evolution.',
      timestamp: '09:05',
    },
  ],
};

const INITIAL_SCALE: CalibrationScale = {
  p1: { x: 140, y: 963 },
  p2: { x: 140, y: 478 },
  distanceInMeters: 1.0,
  isCalibrated: true,
  unit: 'm',
};

const INITIAL_ORIGIN: CoordinateOrigin = {
  origin: { x: 140, y: 963 },
  rotationDeg: 0,
  invertY: true,
};

const INITIAL_SERIES: TrackSeries[] = [
  {
    id: 'series-1',
    name: 'Object 1',
    color: '#2563eb', // FizziQ royal blue
    points: [],
    mass: 0.15,
    visible: true,
  },
];

const INITIAL_AUTOTRACK_CONFIG: AutotrackConfig = {
  templateSize: 32,
  searchRadius: 80,
  threshold: 0.55,
  autoAdvance: true,
  evolutionRate: 0.08,
};

const INITIAL_VECTOR_OPTIONS: VectorDisplayOptions = {
  showVelocity: true,
  showAcceleration: false,
  showForce: false,
  showCenterOfMass: true,
  showStrobe: true,
  showPolar: false,
  vectorScale: 1.0,
  showDataMarkers: true,
  showAccelerationLines: false,
};

export const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeTool, setActiveTool] = useState<ActiveTool>('track');
  const [scale, setScale] = useState<CalibrationScale>(INITIAL_SCALE);
  const [origin, setOrigin] = useState<CoordinateOrigin>(INITIAL_ORIGIN);
  const [seriesList, setSeriesList] = useState<TrackSeries[]>(INITIAL_SERIES);
  const [activeSeriesId, setActiveSeriesId] = useState<string>('series-1');

  // Video state (default to real FizziQ parabolic motion video)
  const [videoUrl, setVideoUrl] = useState<string>('/videos/fizziq_parabole.mp4');
  const [activeSampleId, setActiveSampleId] = useState<string | null>('fizziq-parabola');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(2.5);
  const [fps, setFps] = useState<number>(30);
  const [advanceStep, setAdvanceStep] = useState<number>(1);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [trimRange, setTrimRange] = useState<VideoTrimRange>({
    startFrame: 0,
    endFrame: 100,
    startTime: 0,
    endTime: 10,
    isTrimmed: false,
  });
  const [hoveredPointTime, setHoveredPointTime] = useState<number | null>(null);

  const [vectorOptions, setVectorOptions] = useState<VectorDisplayOptions>(INITIAL_VECTOR_OPTIONS);
  const [showPip, setShowPip] = useState<boolean>(true);
  const [pipPosition, setPipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPipDragging, setIsPipDragging] = useState<boolean>(false);
  const [pipDragOffset, setPipDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isVideoLibraryOpen, setIsVideoLibraryOpen] = useState<boolean>(false);
  const [isStroboscopeOpen, setIsStroboscopeOpen] = useState<boolean>(false);
  const [notebookState, setNotebookState] = useState<LabNotebookState>(INITIAL_NOTEBOOK);

  // Autotracker state
  const [isAutotrackOpen, setIsAutotrackOpen] = useState<boolean>(false);
  const [autotrackConfig, setAutotrackConfig] = useState<AutotrackConfig>(INITIAL_AUTOTRACK_CONFIG);
  const [autotrackTemplate, setAutotrackTemplate] = useState<AutotrackTemplate | null>(null);
  const [lastMatchResult, setLastMatchResult] = useState<AutotrackMatchResult | null>(null);
  const [isSelectingAutotrackFeature, setIsSelectingAutotrackFeature] = useState<boolean>(false);
  const [isAutotracking, setIsAutotracking] = useState<boolean>(false);
  const [autotrackStatus, setAutotrackStatus] = useState<string>('Click target object on video to start');
  const autotrackLoopRef = useRef<boolean>(false);
  const seriesListRef = useRef<TrackSeries[]>(seriesList);
  const lastMatchResultRef = useRef<AutotrackMatchResult | null>(lastMatchResult);
  const autotrackTemplateRef = useRef<AutotrackTemplate | null>(autotrackTemplate);
  const autotrackConfigRef = useRef<AutotrackConfig>(autotrackConfig);
  const trimRangeRef = useRef<VideoTrimRange>(trimRange);
  const autotrackVelocityRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  useEffect(() => {
    seriesListRef.current = seriesList;
  }, [seriesList]);

  useEffect(() => {
    lastMatchResultRef.current = lastMatchResult;
  }, [lastMatchResult]);

  useEffect(() => {
    autotrackTemplateRef.current = autotrackTemplate;
  }, [autotrackTemplate]);

  useEffect(() => {
    autotrackConfigRef.current = autotrackConfig;
  }, [autotrackConfig]);

  useEffect(() => {
    trimRangeRef.current = trimRange;
  }, [trimRange]);

  const currentFrame = Math.round(currentTime * fps);

  // Seamless View Mode change
  const handleViewModeChange = (mode: ViewMode) => {
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        setViewMode(mode);
      });
    } else {
      setViewMode(mode);
    }
  };

  // Draggable PiP Video Window
  const handlePipMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const currentX = pipPosition?.x ?? (window.innerWidth - 304);
    const currentY = pipPosition?.y ?? (window.innerHeight - 260);
    setIsPipDragging(true);
    setPipDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY,
    });
  };

  useEffect(() => {
    if (!isPipDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - pipDragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - pipDragOffset.y));
      setPipPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsPipDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPipDragging, pipDragOffset]);

  // Video time listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (trimRangeRef.current.isTrimmed && video.currentTime >= trimRangeRef.current.endTime) {
        video.pause();
        video.currentTime = trimRangeRef.current.startTime;
        setCurrentTime(trimRangeRef.current.startTime);
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsAutotracking(false);
      autotrackLoopRef.current = false;
    };

    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
        setTrimRange((prev) => {
          if (!prev.isTrimmed) {
            return {
              ...prev,
              endFrame: Math.round(video.duration * fps),
              endTime: video.duration,
            };
          }
          return prev;
        });
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [fps]);

  // Synchronize Picture-in-Picture video
  useEffect(() => {
    if (pipVideoRef.current && Math.abs(pipVideoRef.current.currentTime - currentTime) > 0.04) {
      pipVideoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Recalculate kinematics
  const recomputeAllKinematics = useCallback(
    (seriesArr: TrackSeries[], currentScale: CalibrationScale, currentOrigin: CoordinateOrigin) => {
      return seriesArr.map((s) => {
        const rawPoints = s.points.map((p) => ({
          id: p.id,
          frame: p.frame,
          time: p.time,
          px: p.px,
        }));
        const recomputed = computeKinematics(rawPoints, currentOrigin, currentScale, s.mass);
        return { ...s, points: recomputed };
      });
    },
    []
  );

  // Center of Mass calculation for multi-body collisions
  const centerOfMassPoints = useMemo(() => {
    return computeCenterOfMass(seriesList, origin, scale);
  }, [seriesList, origin, scale]);

  const handleUpdateScale = (newScale: CalibrationScale) => {
    setScale(newScale);
    setSeriesList((prev) => recomputeAllKinematics(prev, newScale, origin));
  };

  const handleUpdateOrigin = (newOrigin: CoordinateOrigin) => {
    setOrigin(newOrigin);
    setSeriesList((prev) => recomputeAllKinematics(prev, scale, newOrigin));
  };

  const handleToggleVector = (key: keyof VectorDisplayOptions) => {
    setVectorOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Add Point
  const handleAddPoint = (seriesId: string, px: Point2D, explicitFrame?: number, explicitTime?: number) => {
    const frameToUse = explicitFrame !== undefined ? explicitFrame : currentFrame;
    const timeToUse = explicitTime !== undefined ? explicitTime : currentTime;

    setSeriesList((prev) => {
      return prev.map((s) => {
        if (s.id !== seriesId) return s;
        const filtered = s.points.filter((pt) => pt.frame !== frameToUse);
        const newRawPoint = {
          id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          frame: frameToUse,
          time: Number(timeToUse.toFixed(4)),
          rawTime: Number(timeToUse.toFixed(4)),
          px,
        };
        const rawList = [
          ...filtered.map((p) => ({
            id: p.id,
            frame: p.frame,
            time: p.rawTime !== undefined ? p.rawTime : p.time,
            rawTime: p.rawTime !== undefined ? p.rawTime : p.time,
            px: p.px,
          })),
          newRawPoint,
        ];
        rawList.sort((a, b) => a.frame - b.frame);
        const newPoints = computeKinematics(rawList, origin, scale, s.mass);
        return { ...s, points: newPoints };
      });
    });
  };

  const handleUpdatePoint = (seriesId: string, pointId: string, px: Point2D) => {
    setSeriesList((prev) => {
      return prev.map((s) => {
        if (s.id !== seriesId) return s;
        const rawList = s.points.map((p) => (p.id === pointId ? { ...p, px } : p));
        const newPoints = computeKinematics(rawList, origin, scale, s.mass);
        return { ...s, points: newPoints };
      });
    });
  };

  const handleDeletePoint = (seriesId: string, pointId: string) => {
    setSeriesList((prev) => {
      return prev.map((s) => {
        if (s.id !== seriesId) return s;
        const rawList = s.points.filter((p) => p.id !== pointId);
        const newPoints = computeKinematics(rawList, origin, scale, s.mass);
        return { ...s, points: newPoints };
      });
    });
  };

  const handleResetPoints = () => {
    if (window.confirm('Clear all tracked points?')) {
      setSeriesList((prev) => prev.map((s) => ({ ...s, points: [] })));
      setAutotrackTemplate(null);
      setLastMatchResult(null);
    }
  };

  // Video Transport Handlers
  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleStepFrame = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const target = Math.max(0, Math.min(video.duration || 10, video.currentTime + delta / fps));
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleSeekTime = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 10, time));
    setCurrentTime(video.currentTime);
  };

  const handleSeekToStart = () => {
    handleSeekTime(0);
  };

  // Series Management
  const handleAddSeries = () => {
    if (seriesList.length >= 3) return;
    const newId = `series-${seriesList.length + 1}`;
    const colors = ['#2563eb', '#dc2626', '#16a34a'];
    const newSeries: TrackSeries = {
      id: newId,
      name: `Object ${seriesList.length + 1}`,
      color: colors[seriesList.length % colors.length],
      points: [],
      mass: 0.15,
      visible: true,
    };
    setSeriesList((prev) => [...prev, newSeries]);
    setActiveSeriesId(newId);
  };

  const handleChangeMass = (seriesId: string, mass: number) => {
    setSeriesList((prev) => {
      const updated = prev.map((s) => (s.id === seriesId ? { ...s, mass } : s));
      return recomputeAllKinematics(updated, scale, origin);
    });
  };

  // Load Real Physics Video Experiment (Student Edition: Always clean slate with 0 points!)
  const loadExperimentVideo = (sampleId: string) => {
    const sample = REAL_EXPERIMENT_VIDEOS.find((s) => s.id === sampleId);
    if (!sample) return;

    setActiveSampleId(sampleId);
    setVideoUrl(sample.videoUrl || '');
    setFps(sample.fps);

    // Sync Lab Notebook with the experiment template
    const labTemplate = getLabTemplateForSample(sampleId);
    setNotebookState((prev) => ({
      ...prev,
      activeLabId: labTemplate.id,
      title: labTemplate.title,
      description: labTemplate.theorySummary,
    }));

    // Auto-calibrate with known real coordinates
    const newScale: CalibrationScale = {
      p1: sample.autoCalibrate.rulerP1,
      p2: sample.autoCalibrate.rulerP2,
      distanceInMeters: sample.rulerRealLength,
      displayValue: sample.rulerRealLength,
      isCalibrated: true,
      unit: 'm',
    };
    setScale(newScale);

    const newOrigin: CoordinateOrigin = {
      origin: sample.autoCalibrate.origin,
      rotationDeg: 0,
      invertY: sample.autoCalibrate.invertY,
    };
    setOrigin(newOrigin);

    // Setup track series with 0 points for students to track
    if (sampleId === 'tracker-collision-pucks') {
      setSeriesList([
        {
          id: 'series-1',
          name: 'Puck A (Red)',
          color: '#ef4444',
          points: [],
          mass: sample.defaultMass,
          visible: true,
        },
        {
          id: 'series-2',
          name: 'Puck B (Blue)',
          color: '#2563eb',
          points: [],
          mass: sample.defaultMass,
          visible: true,
        },
      ]);
      setVectorOptions((prev) => ({ ...prev, showCenterOfMass: true }));
      setActiveSeriesId('series-1');
    } else if (sampleId === 'tracker-two-carts') {
      setSeriesList([
        {
          id: 'series-1',
          name: 'Cart 1',
          color: '#ef4444',
          points: [],
          mass: sample.defaultMass,
          visible: true,
        },
        {
          id: 'series-2',
          name: 'Cart 2',
          color: '#2563eb',
          points: [],
          mass: sample.defaultMass,
          visible: true,
        },
      ]);
      setVectorOptions((prev) => ({ ...prev, showCenterOfMass: true }));
      setActiveSeriesId('series-1');
    } else {
      setSeriesList([
        {
          id: 'series-1',
          name: sample.id.includes('ball') || sample.id.includes('parabola') ? 'Ball' : 'Object 1',
          color: '#2563eb',
          points: [],
          mass: sample.defaultMass,
          visible: true,
        },
      ]);
      setActiveSeriesId('series-1');
    }

    setAutotrackTemplate(null);
    setLastMatchResult(null);

    setTimeout(() => {
      handleSeekToStart();
    }, 200);
  };

  const handleResetScaleToDefault = () => {
    const sample = REAL_EXPERIMENT_VIDEOS.find((s) => s.id === activeSampleId);
    if (sample) {
      handleUpdateScale({
        p1: { ...sample.autoCalibrate.rulerP1 },
        p2: { ...sample.autoCalibrate.rulerP2 },
        distanceInMeters: sample.rulerRealLength,
        displayValue: sample.rulerRealLength,
        unit: 'm',
        isCalibrated: true,
      });
    }
  };

  const handleUploadVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setActiveSampleId(null);
    setSeriesList((prev) => prev.map((s) => ({ ...s, points: [] })));
    setAutotrackTemplate(null);
    setLastMatchResult(null);
    setTimeout(() => {
      handleSeekToStart();
    }, 200);
  };

  const handleSaveWebcamVideo = (url: string) => {
    setVideoUrl(url);
    setActiveSampleId(null);
    setSeriesList((prev) => prev.map((s) => ({ ...s, points: [] })));
    setAutotrackTemplate(null);
    setLastMatchResult(null);
    setTimeout(() => {
      handleSeekToStart();
    }, 200);
  };

  // ----------------------------------------------------
  // Autotracker Implementation
  // ----------------------------------------------------
  const handleSelectFeaturePoint = (px: Point2D) => {
    const video = videoRef.current;
    if (!video) return;

    const t = extractTemplate(video, px, autotrackConfig.templateSize);
    if (t) {
      setAutotrackTemplate(t);
      autotrackTemplateRef.current = t;
      autotrackVelocityRef.current = { dx: 0, dy: 0 };
      const initialMatch: AutotrackMatchResult = {
        found: true,
        bestPoint: px,
        score: 1.0,
        searchWindow: {
          x: px.x - autotrackConfig.searchRadius,
          y: px.y - autotrackConfig.searchRadius,
          width: autotrackConfig.searchRadius * 2,
          height: autotrackConfig.searchRadius * 2,
        },
      };
      setLastMatchResult(initialMatch);
      lastMatchResultRef.current = initialMatch;

      // Record first point at current frame & time
      const frameNow = Math.round(video.currentTime * fps);
      handleAddPoint(activeSeriesId, px, frameNow, video.currentTime);
      setIsSelectingAutotrackFeature(false);
      setAutotrackStatus('Target locked. Ready to autotrack.');
      setIsAutotrackOpen(true);
    }
  };

  const performSingleAutotrackStep = async (): Promise<boolean> => {
    const video = videoRef.current;
    const template = autotrackTemplateRef.current;
    if (!video || !template) return false;

    // Check if reached end of video or trim clip
    const currentTrim = trimRangeRef.current;
    const maxTime = currentTrim.isTrimmed ? currentTrim.endTime : (video.duration || 10) - (1 / fps) * 0.5;
    if (video.currentTime >= maxTime) {
      setAutotrackStatus('Reached end of analysis clip.');
      return false;
    }

    // Advance 1 frame with seekVideoFrame to guarantee pixel buffer is ready
    const nextTime = Math.min(video.duration || 10, video.currentTime + 1 / fps);
    await seekVideoFrame(video, nextTime);
    setCurrentTime(video.currentTime);

    // Inertial parabolic forward prediction using velocity and acceleration
    const activeSeries =
      seriesListRef.current.find((s) => s.id === activeSeriesId) || seriesListRef.current[0];
    const pts = activeSeries ? activeSeries.points : [];

    const lastPt = pts.length > 0 ? pts[pts.length - 1].px : template.centerPx;
    const vel = autotrackVelocityRef.current;

    let predictedPoint = {
      x: lastPt.x + vel.dx,
      y: lastPt.y + vel.dy,
    };

    if (pts.length >= 2) {
      const pLast = pts[pts.length - 1];
      const pPrev = pts[pts.length - 2];
      const vx = pLast.px.x - pPrev.px.x;
      const vy = pLast.px.y - pPrev.px.y;

      let ax = 0;
      let ay = 0;
      if (pts.length >= 3) {
        const pOlder = pts[pts.length - 3];
        const vPrevX = pPrev.px.x - pOlder.px.x;
        const vPrevY = pPrev.px.y - pOlder.px.y;
        ax = vx - vPrevX;
        ay = vy - vPrevY;
      }

      // Parabolic projection: r(t+dt) = r + v*dt + 0.5*a*dt²
      predictedPoint = {
        x: pLast.px.x + vx + 0.5 * ax,
        y: pLast.px.y + vy + 0.5 * ay,
      };
    }

    const cfg = autotrackConfigRef.current;
    const match = matchTemplate(video, template, predictedPoint, cfg);
    setLastMatchResult(match);
    lastMatchResultRef.current = match;

    if (match.found) {
      // Update velocity prediction for next frame
      autotrackVelocityRef.current = {
        dx: match.bestPoint.x - lastPt.x,
        dy: match.bestPoint.y - lastPt.y,
      };

      const targetFrame = Math.round(video.currentTime * fps);
      handleAddPoint(activeSeriesId, match.bestPoint, targetFrame, video.currentTime);
      setAutotrackStatus(
        `Tracked frame ${targetFrame} (${(match.score * 100).toFixed(0)}% match)`
      );
      return true;
    } else {
      setAutotrackStatus(
        `Confidence drop (${(match.score * 100).toFixed(0)}%). Paused for verification.`
      );
      return false;
    }
  };

  const handleStartAutotrack = async () => {
    if (!autotrackTemplate) return;
    const video = videoRef.current;
    if (!video) return;

    // If video is at the end, automatically rewind to start before tracking
    const currentTrim = trimRangeRef.current;
    const maxTime = currentTrim.isTrimmed ? currentTrim.endTime : (video.duration || 10) - (1 / fps) * 0.5;
    if (video.currentTime >= maxTime) {
      const startTime = currentTrim.isTrimmed ? currentTrim.startTime : 0;
      await seekVideoFrame(video, startTime);
      setCurrentTime(video.currentTime);
      autotrackVelocityRef.current = { dx: 0, dy: 0 };
      setAutotrackStatus('Rewound to start. Beginning autotrack...');
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    setIsAutotracking(true);
    autotrackLoopRef.current = true;

    while (autotrackLoopRef.current) {
      const success = await performSingleAutotrackStep();
      if (!success || !autotrackLoopRef.current) {
        break;
      }
      // Small pause for UI rendering
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    setIsAutotracking(false);
    autotrackLoopRef.current = false;
  };

  const handleStopAutotrack = () => {
    setIsAutotracking(false);
    autotrackLoopRef.current = false;
    setAutotrackStatus('Autotrack paused.');
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    if (pipVideoRef.current) {
      pipVideoRef.current.playbackRate = rate;
    }
  };

  const handleAddNotebookCard = (card: Omit<NotebookCard, 'id' | 'timestamp'>) => {
    const newCard: NotebookCard = {
      ...card,
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotebookState((prev) => ({
      ...prev,
      cards: [...prev.cards, newCard],
    }));
  };

  const handleExportExcel = () => {
    const sample = REAL_EXPERIMENT_VIDEOS.find((v) => v.id === activeSampleId);
    exportToExcel(seriesList, scale, origin, sample?.title || 'Kinematics Experiment');
  };

  const handleExportProject = () => {
    const projectData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      activeSampleId,
      videoUrl,
      fps,
      scale,
      origin,
      seriesList,
      vectorOptions,
      notebookState,
    };
    exportToJson(projectData, 'fizziq_experiment.fiz');
  };

  const handleCaptureGraphSnapshot = useCallback(() => {
    const chartCanvas = (document.querySelector('canvas[role="img"]') ||
      document.querySelector('.chartjs-render-monitor') ||
      document.querySelector('.flex-1 canvas')) as HTMLCanvasElement | null;
    const activeS = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];
    const totalPts = activeS?.points.length || 0;
    const imgUrl = chartCanvas && chartCanvas.width > 0 ? chartCanvas.toDataURL('image/png') : undefined;

    return {
      title: `Kinematics Graph Snapshot (${activeS?.name || 'Object 1'})`,
      content: `Recorded kinematics curve across ${totalPts} analyzed frames with calibrated scale ${scale.distanceInMeters} ${scale.unit}.`,
      imageUrl: imgUrl,
      dataSnippet: {
        'Tracked Object': activeS?.name || 'Object 1',
        'Data Points': totalPts,
        'Mass': `${activeS?.mass ?? 0.1} kg`,
        'Calibration Scale': `${scale.distanceInMeters} ${scale.unit}`,
      },
    };
  }, [seriesList, activeSeriesId, scale]);

  const handleCaptureTrajectorySnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      ctx.drawImage(video, 0, 0, w, h);
    } catch {
      // ignore
    }

    seriesList.forEach((s) => {
      if (!s.visible) return;
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = 2;

      if (s.points.length > 1) {
        ctx.beginPath();
        s.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.px.x, pt.px.y);
          else ctx.lineTo(pt.px.x, pt.px.y);
        });
        ctx.stroke();
      }

      s.points.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.px.x, pt.px.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(String(idx + 1), pt.px.x + 6, pt.px.y - 4);
        ctx.fillStyle = s.color;
      });
    });

    if (scale.isCalibrated) {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scale.p1.x, scale.p1.y);
      ctx.lineTo(scale.p2.x, scale.p2.y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, h - 36, w, 36);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('FizziQ Trajectory Capture', 16, h - 13);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    const totalPts = seriesList.reduce((acc, s) => acc + s.points.length, 0);
    ctx.fillText(
      `t = ${currentTime.toFixed(3)}s | Scale: ${scale.distanceInMeters} ${scale.unit} | Points: ${totalPts}`,
      190,
      h - 13
    );

    return canvas.toDataURL('image/png');
  }, [seriesList, scale, currentTime]);

  const handleExportSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext('2d');
    if (!ctx) return;

    // Draw frame
    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

    // Overlay bottom banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, snapCanvas.height - 46, snapCanvas.width, 46);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('FizziQ + Tracker Lab', 20, snapCanvas.height - 18);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Inter, sans-serif';
    const activeSeries = seriesList.find((s) => s.id === activeSeriesId);
    const scalePxLen = Math.hypot(scale.p2.x - scale.p1.x, scale.p2.y - scale.p1.y) || 1;
    const pxPerMeter = (scalePxLen / (scale.distanceInMeters || 1)).toFixed(1);
    ctx.fillText(
      `Frame ${currentFrame} | t = ${currentTime.toFixed(3)}s | Scale: ${pxPerMeter} px/m | Points: ${activeSeries?.points.length || 0}`,
      210,
      snapCanvas.height - 18
    );

    const snapDataUrl = snapCanvas.toDataURL('image/png');

    // Download PNG
    const a = document.createElement('a');
    a.download = `fizziq-tracker-frame-${currentFrame}.png`;
    a.href = snapDataUrl;
    a.click();

    // Auto-record snapshot evidence into Lab Notebook
    handleAddNotebookCard({
      type: 'snapshot',
      title: `Motion Tracker Snapshot Frame ${currentFrame} (t = ${currentTime.toFixed(2)}s)`,
      content: `Video tracker snapshot recorded at frame ${currentFrame} (time = ${currentTime.toFixed(3)}s) with ${activeSeries?.points.length || 0} tracked points. Scale: ${pxPerMeter} px/m.`,
      imageUrl: snapDataUrl,
      dataSnippet: {
        'Video Frame': currentFrame,
        'Time Elapsed': `${currentTime.toFixed(3)} s`,
        'Total Tracked Points': activeSeries?.points.length || 0,
        'Calibration Scale': `${scale.distanceInMeters} ${scale.unit} (${pxPerMeter} px/m)`,
      },
    });
  };

  const totalPointsCount = seriesList.reduce((sum, s) => sum + s.points.length, 0);

  return (
    <div className="h-full h-screen w-full flex flex-col bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onSelectSample={loadExperimentVideo}
        onUploadVideo={handleUploadVideo}
        onOpenWebcam={() => setIsWebcamOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onExportCsv={() => exportToCsv(seriesList)}
        onExportExcel={handleExportExcel}
        onExportProject={handleExportProject}
        onResetPoints={handleResetPoints}
        hasPoints={totalPointsCount > 0}
        activeSampleId={activeSampleId}
        onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Tracker Workspace */}
        <div
          className={`flex flex-col min-h-0 border-r border-slate-300 transition-all duration-200 bg-white ${
            viewMode === 'tracker'
              ? 'w-full'
              : viewMode === 'split'
              ? 'w-full lg:w-[54%] xl:w-[52%]'
              : 'hidden'
          }`}
        >
          <VideoTracker
            videoUrl={videoUrl}
            videoRef={videoRef}
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            scale={scale}
            onUpdateScale={handleUpdateScale}
            onResetScaleToDefault={handleResetScaleToDefault}
            origin={origin}
            onUpdateOrigin={handleUpdateOrigin}
            seriesList={seriesList}
            activeSeriesId={activeSeriesId}
            onAddPoint={handleAddPoint}
            onUpdatePoint={handleUpdatePoint}
            onDeletePoint={handleDeletePoint}
            currentFrame={currentFrame}
            currentTime={currentTime}
            fps={fps}
            advanceStep={advanceStep}
            onStepFrame={handleStepFrame}
            vectorOptions={vectorOptions}
            centerOfMassPoints={centerOfMassPoints}
            hoveredPointTime={hoveredPointTime}
            onHoverPoint={setHoveredPointTime}
            autotrackTemplate={autotrackTemplate}
            autotrackConfig={autotrackConfig}
            lastMatchResult={lastMatchResult}
            isSelectingAutotrackFeature={isSelectingAutotrackFeature}
            onSelectFeaturePoint={handleSelectFeaturePoint}
            onCancelSelectFeature={() => setIsSelectingAutotrackFeature(false)}
            onOpenAutotrack={() => setIsAutotrackOpen(true)}
            duration={duration}
            onSeekToStart={handleSeekToStart}
            onSeekTime={handleSeekTime}
            onResetPoints={handleResetPoints}
          />

          <TrackerControls
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStepFrame={handleStepFrame}
            onSeekToStart={handleSeekToStart}
            currentTime={currentTime}
            duration={duration}
            currentFrame={currentFrame}
            totalFrames={Math.round(duration * fps)}
            fps={fps}
            onChangeFps={setFps}
            onSeekTime={handleSeekTime}
            advanceStep={advanceStep}
            onChangeAdvanceStep={setAdvanceStep}
            playbackRate={playbackRate}
            onChangePlaybackRate={handleChangePlaybackRate}
            trimRange={trimRange}
            onUpdateTrimRange={setTrimRange}
            scale={scale}
            onUpdateScale={handleUpdateScale}
            origin={origin}
            onUpdateOrigin={handleUpdateOrigin}
            seriesList={seriesList}
            activeSeriesId={activeSeriesId}
            onSelectSeries={setActiveSeriesId}
            onAddSeries={handleAddSeries}
            onChangeMass={handleChangeMass}
            pointCount={totalPointsCount}
            vectorOptions={vectorOptions}
            onToggleVector={handleToggleVector}
            onChangeVectorScale={(s) => setVectorOptions((prev) => ({ ...prev, vectorScale: s }))}
            onOpenAutotrack={() => setIsAutotrackOpen(true)}
            onExportSnapshot={handleExportSnapshot}
            onOpenStroboscope={() => setIsStroboscopeOpen(true)}
          />
        </div>

        {/* Scientific Graph Workspace */}
        <div
          className={`flex flex-col min-h-0 transition-all duration-200 bg-slate-50 ${
            viewMode === 'graph'
              ? 'w-full'
              : viewMode === 'split'
              ? 'flex-1'
              : 'hidden'
          }`}
        >
          <KinematicsGraph
            seriesList={seriesList}
            activeSeriesId={activeSeriesId}
            currentTime={currentTime}
            hoveredPointTime={hoveredPointTime}
            onHoverPoint={setHoveredPointTime}
            onSeekTime={handleSeekTime}
            onAddToNotebook={handleAddNotebookCard}
          />
        </div>

        {/* Data Table Spreadsheet Workspace */}
        {viewMode === 'table' && (
          <div className="w-full h-full flex flex-col min-h-0 bg-slate-50">
            <DataTable
              seriesList={seriesList}
              activeSeriesId={activeSeriesId}
              onSelectSeries={setActiveSeriesId}
              currentTime={currentTime}
              fps={fps}
              onSeekTime={handleSeekTime}
              onDeletePoint={handleDeletePoint}
            />
          </div>
        )}

        {/* Sound & Acoustics Studio Workspace */}
        {viewMode === 'sound' && (
          <div className="w-full h-full flex flex-col min-h-0 bg-slate-100">
            <SoundStudio onAddToNotebook={handleAddNotebookCard} />
          </div>
        )}

        {/* Digital Lab Notebook (Cahier d'expériences) Workspace */}
        {viewMode === 'notebook' && (
          <div className="w-full h-full flex flex-col min-h-0 bg-slate-100">
            <LabNotebook
              notebookState={notebookState}
              onUpdateNotebook={setNotebookState}
              seriesList={seriesList}
              scale={scale}
              origin={origin}
              activeSampleId={activeSampleId}
              onJumpToView={handleViewModeChange}
              onCaptureGraphSnapshot={handleCaptureGraphSnapshot}
              onCaptureTrajectorySnapshot={handleCaptureTrajectorySnapshot}
            />
          </div>
        )}

        {/* Multi-Topic Physics Suite (Rotational, Optics, E&M, Thermo) */}
        {viewMode === 'physics-suites' && (
          <div className="w-full h-full flex flex-col min-h-0 bg-slate-100">
            <PhysicsSuite
              onAddToNotebook={handleAddNotebookCard}
              onSelectSampleVideo={(videoId) => {
                loadExperimentVideo(videoId);
                handleViewModeChange('split');
              }}
            />
          </div>
        )}

        {/* Picture-in-Picture Mini Video Player in Graph Mode */}
        {viewMode === 'graph' && showPip && videoUrl && (
          <div
            style={pipPosition ? { left: `${pipPosition.x}px`, top: `${pipPosition.y}px`, bottom: 'auto', right: 'auto' } : undefined}
            className={`fixed z-40 w-72 rounded-xl overflow-hidden bg-white shadow-xl border border-slate-300 flex flex-col select-none ${
              pipPosition ? '' : 'bottom-4 right-4'
            } ${isPipDragging ? 'ring-2 ring-blue-500 shadow-2xl' : ''}`}
          >
            <div
              onMouseDown={handlePipMouseDown}
              className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 cursor-grab active:cursor-grabbing hover:bg-slate-200/70 transition-colors"
              title="Drag to reposition window"
            >
              <span className="flex items-center gap-1.5 text-blue-700">
                <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synchronized Video</span>
              </span>
              <button
                onClick={() => setShowPip(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              className="relative aspect-video bg-black cursor-pointer"
              onClick={handleTogglePlay}
            >
              <video
                ref={pipVideoRef}
                src={resolveMediaUrl(videoUrl)}
                muted
                playsInline
                className="w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute inset-0 bg-black/10 hover:bg-transparent flex items-center justify-center group transition">
                <div className="p-2 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition shadow">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </div>
              </div>
            </div>

            <div className="p-2 bg-slate-50 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => handleStepFrame(-1)}
                className="p-1 rounded hover:bg-slate-200 text-slate-700"
                title="-1 Frame"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleTogglePlay}
                className="p-1 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleStepFrame(1)}
                className="p-1 rounded hover:bg-slate-200 text-slate-700"
                title="+1 Frame"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs font-bold text-blue-700 ml-auto">
                t = {currentTime.toFixed(2)}s
              </span>
            </div>
          </div>
        )}

        {/* Autotracker Floating Modal */}
        <AutotrackModal
          isOpen={isAutotrackOpen}
          onClose={() => setIsAutotrackOpen(false)}
          template={autotrackTemplate}
          config={autotrackConfig}
          onChangeConfig={setAutotrackConfig}
          isAutotracking={isAutotracking}
          onStartAutotrack={handleStartAutotrack}
          onStopAutotrack={handleStopAutotrack}
          onStepAutotrack={performSingleAutotrackStep}
          onResetTemplate={() => {
            setAutotrackTemplate(null);
            setLastMatchResult(null);
            setAutotrackStatus('Template cleared.');
          }}
          onSelectFeatureMode={() => setIsSelectingAutotrackFeature(true)}
          isSelectingFeature={isSelectingAutotrackFeature}
          lastScore={lastMatchResult?.score ?? null}
          statusMessage={autotrackStatus}
          currentTime={currentTime}
          duration={duration}
          fps={fps}
          onSeekToStart={handleSeekToStart}
          vectorOptions={vectorOptions}
          onToggleVector={handleToggleVector}
        />
      </main>

      {/* Camera, Help & Video Library Modals */}
      <VideoLibraryModal
        isOpen={isVideoLibraryOpen}
        onClose={() => setIsVideoLibraryOpen(false)}
        activeSampleId={activeSampleId}
        onSelectVideo={loadExperimentVideo}
      />

      <WebcamRecorder
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onSaveVideo={handleSaveWebcamVideo}
      />

      <HelpGuide isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <StroboscopeModal
        isOpen={isStroboscopeOpen}
        onClose={() => setIsStroboscopeOpen(false)}
        videoUrl={videoUrl}
        fps={fps}
        duration={duration}
        seriesList={seriesList}
        scale={scale}
        onAddToNotebook={handleAddNotebookCard}
      />
    </div>
  );
};

export default App;

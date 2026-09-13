import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Layers,
  Download,
  BookOpen,
  Sparkles,
  X,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { CalibrationScale, NotebookCard, TrackSeries } from '../../types/physics';
import { resolveMediaUrl } from '../../utils/videoLibrary';

interface StroboscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  fps: number;
  duration: number;
  seriesList: TrackSeries[];
  scale: CalibrationScale;
  onAddToNotebook?: (card: Omit<NotebookCard, 'id' | 'timestamp'>) => void;
}

export const StroboscopeModal: React.FC<StroboscopeModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  fps,
  duration,
  seriesList,
  scale,
  onAddToNotebook,
}) => {
  const [frameStep, setFrameStep] = useState<number>(3); // sample every 3 frames
  const [blendMode, setBlendMode] = useState<'lighter' | 'source-over' | 'screen'>('lighter');
  const [opacity, setOpacity] = useState<number>(0.85);
  const [showPointsOverlay, setShowPointsOverlay] = useState<boolean>(true);
  const [showScaleOverlay, setShowScaleOverlay] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Generate Chronophotography composite
  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setPreviewUrl(null);

    const video = hiddenVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setIsGenerating(false);
      return;
    }

    // Wait for video metadata to be ready
    if (!video.videoWidth) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          video.removeEventListener('loadedmetadata', handler);
          resolve();
        };
        video.addEventListener('loadedmetadata', handler);
      });
    }

    const w = video.videoWidth || 960;
    const h = video.videoHeight || 540;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    const totalFrames = Math.max(2, Math.round(duration * fps));
    const step = Math.max(1, frameStep);
    const frameIndices: number[] = [];
    for (let f = 0; f < totalFrames; f += step) {
      frameIndices.push(f);
    }

    // Capture base background from first frame
    await seekFrame(video, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.drawImage(video, 0, 0, w, h);

    // Overlay subsequent sampled frames
    for (let i = 1; i < frameIndices.length; i++) {
      const frameIdx = frameIndices[i];
      const targetTime = frameIdx / fps;
      await seekFrame(video, targetTime);

      ctx.globalCompositeOperation = blendMode;
      ctx.globalAlpha = opacity;
      ctx.drawImage(video, 0, 0, w, h);

      setProgress(Math.round((i / frameIndices.length) * 100));
    }

    // Overlay Tracked Points & Trajectory if enabled
    if (showPointsOverlay) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      seriesList.forEach((series) => {
        if (!series.visible || series.points.length === 0) return;

        // Draw trajectory connector
        ctx.strokeStyle = series.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        series.points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.px.x, pt.px.y);
          else ctx.lineTo(pt.px.x, pt.px.y);
        });
        ctx.stroke();

        // Draw points
        series.points.forEach((pt, idx) => {
          ctx.fillStyle = series.color;
          ctx.beginPath();
          ctx.arc(pt.px.x, pt.px.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw index number
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${idx + 1}`, pt.px.x + 6, pt.px.y - 4);
        });
      });
    }

    // Overlay Scale Ruler if enabled
    if (showScaleOverlay && scale.isCalibrated) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scale.p1.x, scale.p1.y);
      ctx.lineTo(scale.p2.x, scale.p2.y);
      ctx.stroke();

      // End caps
      [scale.p1, scale.p2].forEach((p) => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Measurement Badge
      const midX = (scale.p1.x + scale.p2.x) / 2;
      const midY = (scale.p1.y + scale.p2.y) / 2;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(midX - 35, midY - 18, 70, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${scale.distanceInMeters} m`, midX, midY - 5);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setIsGenerating(false);
    setProgress(100);
  };

  const seekFrame = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = Math.min(duration, Math.max(0, time));
    });
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `chronophotographie_${Date.now()}.png`;
    a.click();
  };

  // Add to Lab Notebook
  const handleSaveToNotebook = () => {
    if (!onAddToNotebook || !previewUrl) return;
    onAddToNotebook({
      type: 'snapshot',
      title: `Chronophotographie / Stroboscopic Motion (ΔN = ${frameStep} frames)`,
      content: `Stroboscopic chronophotograph generated with frame step ΔN = ${frameStep} (${(frameStep / fps).toFixed(3)}s interval) using ${blendMode} blending. Displays spatial progression of motion across video frames.`,
      dataSnippet: {
        'Frame Sampling Interval': `Every ${frameStep} frames (Δt = ${(frameStep / fps).toFixed(3)}s)`,
        'Blending Mode': blendMode,
        'Video Duration': `${duration.toFixed(2)}s (${fps} FPS)`,
        'Tracked Series Count': seriesList.length.toString(),
      },
      imageUrl: previewUrl,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none font-sans">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Hidden video element for seeking */}
        <video
          ref={hiddenVideoRef}
          src={resolveMediaUrl(videoUrl)}
          preload="auto"
          muted
          playsInline
          className="hidden"
        />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Stroboscopic Motion Generator (Chronophotographie)
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                  FizziQ Stroboscope
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Composite multiple video frames into a single high-resolution trajectory photograph
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          {/* Frame Step */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Sampling Step (ΔN)</span>
              <span className="font-mono font-bold text-blue-600">Every {frameStep} frames</span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={frameStep}
              onChange={(e) => setFrameStep(parseInt(e.target.value))}
              disabled={isGenerating}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Blend Mode */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">Overlay Blending</span>
            <select
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value as any)}
              disabled={isGenerating}
              className="py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="lighter">Motion Highlight (Lighter)</option>
              <option value="screen">Screen (Luminous Trail)</option>
              <option value="source-over">Alpha Stacking (Normal)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPointsOverlay}
                onChange={(e) => setShowPointsOverlay(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Points</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showScaleOverlay}
                onChange={(e) => setShowScaleOverlay(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Scale Ruler</span>
            </label>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? `Generating (${progress}%)...` : 'Compose Photograph'}</span>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="p-6 flex-1 bg-slate-900 flex items-center justify-center overflow-hidden relative min-h-[300px]">
          <canvas ref={canvasRef} className="hidden" />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Chronophotographie Composite"
              className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-slate-700"
            />
          ) : (
            <div className="text-center text-slate-400 p-8 flex flex-col items-center gap-2">
              <Camera className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">Ready to generate stroboscopic photo</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Click <strong>"Compose Photograph"</strong> to sample frames across the trajectory and
                composite them onto a single still image.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold">Compositing Video Frames... {progress}%</div>
              <div className="w-48 bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {previewUrl
              ? 'Chronophotograph ready for download or laboratory notebook export.'
              : 'Chronophotographie is a hallmark physics technique for analyzing kinematics trajectories.'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
            >
              Close
            </button>

            {onAddToNotebook && (
              <button
                onClick={handleSaveToNotebook}
                disabled={!previewUrl}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 text-xs font-bold border border-indigo-200 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Add to Notebook</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={!previewUrl}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

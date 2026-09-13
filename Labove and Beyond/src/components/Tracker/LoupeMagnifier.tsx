import React, { useEffect, useRef } from 'react';
import { Point2D } from '../../types/physics';

interface LoupeMagnifierProps {
  cursorPos: Point2D | null;
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  zoom?: number;
  size?: number;
}

export const LoupeMagnifier: React.FC<LoupeMagnifierProps> = ({
  cursorPos,
  videoElement,
  canvasElement,
  zoom = 2.5,
  size = 110,
}) => {
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!cursorPos || !videoElement || !canvasElement || !loupeCanvasRef.current) return;

    const loupeCanvas = loupeCanvasRef.current;
    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;

    loupeCanvas.width = size;
    loupeCanvas.height = size;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Save and clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    // Source rect around cursor
    const srcW = size / zoom;
    const srcH = size / zoom;
    const srcX = cursorPos.x - srcW / 2;
    const srcY = cursorPos.y - srcH / 2;

    // Draw video frame slice
    try {
      ctx.drawImage(videoElement, srcX, srcY, srcW, srcH, 0, 0, size, size);
      // Draw overlay canvas elements if any
      ctx.drawImage(canvasElement, srcX, srcY, srcW, srcH, 0, 0, size, size);
    } catch {
      // ignore cross-origin or video not ready errors
    }

    // Draw center reticle / crosshair
    ctx.strokeStyle = '#ef4444'; // bright red
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Horizontal cross
    ctx.moveTo(size / 2 - 12, size / 2);
    ctx.lineTo(size / 2 + 12, size / 2);
    // Vertical cross
    ctx.moveTo(size / 2, size / 2 - 12);
    ctx.lineTo(size / 2, size / 2 + 12);
    ctx.stroke();

    // Center point dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Border ring
    ctx.strokeStyle = '#06b6d4'; // cyan border
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [cursorPos, videoElement, canvasElement, zoom, size]);

  if (!cursorPos) return null;

  return (
    <div className="absolute top-4 right-4 pointer-events-none z-40 shadow-2xl rounded-2xl bg-slate-900/90 border border-slate-700/80 p-1.5 flex flex-col items-center gap-1 backdrop-blur-md animate-in fade-in duration-100">
      <div className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider">
        Magnifier ({zoom}x)
      </div>
      <canvas ref={loupeCanvasRef} className="rounded-xl shadow-inner border border-slate-700" />
      <div className="text-[10px] font-mono text-cyan-300 font-semibold">
        ({Math.round(cursorPos.x)}, {Math.round(cursorPos.y)}) px
      </div>
    </div>
  );
};

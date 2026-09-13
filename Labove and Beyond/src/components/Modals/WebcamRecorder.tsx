import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Circle, StopCircle, RefreshCw } from 'lucide-react';

interface WebcamRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVideo: (url: string) => void;
}

export const WebcamRecorder: React.FC<WebcamRecorderProps> = ({
  isOpen,
  onClose,
  onSaveVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Request webcam
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Could not access camera. Please ensure camera permissions are granted.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Elapsed timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setElapsed((prev) => prev + 0.1);
      }, 100);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartCountdown = () => {
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countInterval);
          startRecording();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const options = { mimeType: 'video/webm;codecs=vp9' };
    const recorder = MediaRecorder.isTypeSupported(options.mimeType)
      ? new MediaRecorder(streamRef.current, options)
      : new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      onSaveVideo(url);
      onClose();
    };

    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Live Camera Experiment Recorder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Error display */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-rose-400 text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Countdown display */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="text-7xl font-bold font-mono text-cyan-400 animate-ping">
                {countdown}
              </div>
            </div>
          )}

          {/* Recording indicator badge */}
          {isRecording && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/90 text-white font-mono text-xs font-bold animate-pulse shadow-lg">
              <Circle className="w-3 h-3 fill-white" />
              <span>REC {elapsed.toFixed(1)}s</span>
            </div>
          )}
        </div>

        {/* Controls footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <p className="text-xs text-slate-400">
            Hold up a 1-meter stick in frame to calibrate easily later!
          </p>

          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartCountdown}
                disabled={!!errorMsg || countdown !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-rose-500/20"
              >
                <Circle className="w-3.5 h-3.5 fill-white" />
                <span>Start Recording (3s timer)</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs transition shadow-lg"
              >
                <StopCircle className="w-4 h-4 text-rose-600" />
                <span>Stop & Load Video</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

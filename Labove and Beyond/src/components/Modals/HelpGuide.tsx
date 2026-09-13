import React from 'react';
import { X, Crosshair, Ruler, Compass, TrendingUp, Sparkles, BookOpen } from 'lucide-react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Physics Kinematics Lab Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Quick Start Tutorial
            </h4>
            <p className="leading-relaxed text-slate-300">
              Welcome to <strong>FizziQ Lab</strong>! You can measure motion, analyze 2D trajectories, calculate velocities and accelerations, and verify fundamental physics laws like gravity (g = 9.80 m/s²) and conservation of energy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Ruler className="w-4 h-4" />
                <span>1. Scale Calibration</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Click <strong>Scale</strong> in the bottom toolbar. Drag the green handles P1 and P2 over a known object in the video (such as the 1.00m reference stick) and enter its real-world length in meters.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Compass className="w-4 h-4" />
                <span>2. Coordinate System Axes</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Click <strong>Axes</strong>. Drag the center circle to choose where $(0,0)$ should be (e.g. at the launch point or ground). You can also rotate the axes or flip $+Y$ upwards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Crosshair className="w-4 h-4" />
                <span>3. Frame-by-Frame Tracking</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Select <strong>Track</strong> mode. Hover over the moving object to see the magnified subpixel loupe. Click to mark the object's position — the video will automatically advance to the next frame!
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>4. Seamless Graphs & Curve Fit</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Switch views effortlessly anytime! In Graph view, select variables like $Y(t)$, $V_y(t)$, or $E_m(t)$. Click <strong>Curve Fit</strong> to fit a quadratic equation and measure experimental gravity ($g$).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h5 className="font-bold text-slate-200">Bidirectional Synchronization</h5>
            <p className="text-slate-400 leading-relaxed">
              Whenever you scrub the video player or click playback, a synchronized vertical time indicator travels through all graphs. Clicking or hovering on any point in the graphs immediately highlights and jumps the video to that exact frame.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

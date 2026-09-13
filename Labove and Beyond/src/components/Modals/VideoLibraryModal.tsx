import React, { useState, useMemo } from 'react';
import {
  Film,
  Search,
  Play,
  Ruler,
  Compass,
  X,
  Sparkles,
} from 'lucide-react';
import { REAL_EXPERIMENT_VIDEOS, resolveMediaUrl } from '../../utils/videoLibrary';
import { PhysicsExperimentSample } from '../../types/physics';

interface VideoLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSampleId: string | null;
  onSelectVideo: (sampleId: string) => void;
}

const CATEGORIES = [
  'All Experiments',
  'FizziQ Official',
  'Tracker Lab',
  '1D & 2D Kinematics',
  'Harmonic Motion & Oscillations',
  'Collisions & Momentum',
  'Sports Biomechanics',
  'Rotational Dynamics',
  'Dynamics & Friction',
] as const;

export const VideoLibraryModal: React.FC<VideoLibraryModalProps> = ({
  isOpen,
  onClose,
  activeSampleId,
  onSelectVideo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Experiments');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fizziqCount = useMemo(() => REAL_EXPERIMENT_VIDEOS.filter((v) => v.source === 'FizziQ').length, []);
  const trackerCount = useMemo(() => REAL_EXPERIMENT_VIDEOS.filter((v) => v.source === 'Tracker').length, []);

  const filteredVideos = useMemo(() => {
    return REAL_EXPERIMENT_VIDEOS.filter((v) => {
      const matchesSearch =
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'All Experiments') return true;
      if (selectedCategory === 'FizziQ Official') return v.source === 'FizziQ';
      if (selectedCategory === 'Tracker Lab') return v.source === 'Tracker';
      if (selectedCategory === '1D & 2D Kinematics') {
        return v.category.includes('Kinematics') || v.category.includes('Gravity') || v.category.includes('Projectiles');
      }
      if (selectedCategory === 'Harmonic Motion & Oscillations') {
        return v.category.includes('Harmonic') || v.category.includes('Oscillations') || v.category.includes('Polar');
      }
      if (selectedCategory === 'Collisions & Momentum') {
        return v.category.includes('Momentum') || v.category.includes('Collision') || v.category.includes('Multi-Body');
      }
      if (selectedCategory === 'Sports Biomechanics') {
        return v.category.includes('Sports') || v.category.includes('Biomechanics');
      }
      if (selectedCategory === 'Rotational Dynamics') {
        return v.category.includes('Rotational') || v.category.includes('Angular') || v.category.includes('Cycloids') || v.category.includes('Curves');
      }
      if (selectedCategory === 'Dynamics & Friction') {
        return v.category.includes('Dynamics') || v.category.includes('Friction') || v.category.includes('Force') || v.category.includes('Fluid') || v.category.includes('Traffic');
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
              <Film className="w-5 h-5" />
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 tracking-tight">
                  Physics Video Library
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  57 Interactive Labs
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {fizziqCount} FizziQ
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                  {trackerCount} Tracker
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                  {REAL_EXPERIMENT_VIDEOS.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Official high-framerate laboratory kinematics from FizziQ (fizziq.org) & Open Source Physics Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              🧑‍🎓 Student Laboratory Edition
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
            />
          </div>
        </div>

        {/* Video Grid */}
        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
          {filteredVideos.map((sample: PhysicsExperimentSample) => {
            const isActive = activeSampleId === sample.id;
            return (
              <div
                key={sample.id}
                className={`flex flex-col rounded-xl border p-3.5 transition-all duration-150 bg-white hover:shadow-md ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Poster Thumbnail or Gradient Preview */}
                {sample.posterUrl ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 mb-2.5 shrink-0 border border-slate-100 group">
                    <img
                      src={resolveMediaUrl(sample.posterUrl)}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-medium backdrop-blur-xs">
                      {sample.fps} FPS
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 mb-2.5 shrink-0 flex items-center justify-center border border-slate-700/50">
                    <Film className="w-8 h-8 text-slate-400 opacity-60" />
                    <span className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-medium backdrop-blur-xs">
                      {sample.fps} FPS
                    </span>
                  </div>
                )}
                {/* Card Header & Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        sample.source === 'FizziQ'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {sample.source}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      🔬 Lab
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {sample.fps} FPS
                  </span>
                </div>

                {/* Title & Category */}
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-0.5" title={sample.title}>
                  {sample.title}
                </h3>
                <span className="text-[11px] font-semibold text-blue-600 mb-2">
                  {sample.category}
                </span>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-3 mb-3 leading-relaxed flex-1">
                  {sample.description}
                </p>

                {/* Calibration Highlights */}
                <div className="grid grid-cols-2 gap-2 py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] mb-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Ruler className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Scale: <strong className="text-slate-800">{sample.rulerRealLength} m</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Compass className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Mass: <strong className="text-slate-800">{sample.defaultMass} kg</strong></span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    onSelectVideo(sample.id);
                    onClose();
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition mt-auto ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                  title="Open video experiment for student hands-on tracking and graphing"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isActive ? 'Current Experiment (Loaded)' : 'Start Experiment'}</span>
                </button>
              </div>
            );
          })}

          {filteredVideos.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No videos found matching your search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>All videos include pre-configured reference scale calibration and coordinate origin.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

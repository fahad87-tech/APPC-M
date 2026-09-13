import React, { useState, useRef, useEffect } from 'react';
import {
  Columns,
  Video,
  LineChart,
  Table,
  Upload,
  Camera,
  Download,
  HelpCircle,
  RotateCcw,
  Film,
  Activity,
  BookOpen,
  FileSpreadsheet,
  ChevronDown,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { ViewMode } from '../types/physics';
import { REAL_EXPERIMENT_VIDEOS } from '../utils/videoLibrary';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSelectSample: (sampleId: string) => void;
  onUploadVideo: (file: File) => void;
  onOpenWebcam: () => void;
  onOpenHelp: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportProject: () => void;
  onResetPoints: () => void;
  hasPoints: boolean;
  activeSampleId: string | null;
  onOpenVideoLibrary?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  onSelectSample,
  onUploadVideo,
  onOpenWebcam,
  onOpenHelp,
  onExportCsv,
  onExportExcel,
  onExportProject,
  onResetPoints,
  hasPoints,
  activeSampleId,
  onOpenVideoLibrary,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadVideo(e.target.files[0]);
    }
  };

  return (
    <header className="h-14 min-h-[3.5rem] max-h-14 border-b border-slate-200 bg-white px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-xs overflow-hidden">
      {/* Brand & Title (FizziQ Blue & Tracker Edition) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div className="shrink-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-slate-900 text-sm xl:text-base tracking-tight whitespace-nowrap">
              Lab-ove and Beyond
            </span>
            <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs whitespace-nowrap shrink-0">
              by MR. F.
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium hidden 2xl:block whitespace-nowrap">
            Scientific Kinematics, Acoustics & Experiment Studio • by MR. F.
          </p>
        </div>

        {/* Student Edition Badge */}
        <div className="ml-1 sm:ml-2 hidden md:flex items-center shrink-0">
          <span className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
            🧑‍🎓 Student Edition
          </span>
        </div>
      </div>

      {/* Seamless View Mode Switcher */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner shrink-0 mx-1">
        <button
          onClick={() => onViewModeChange('split')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'split'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Split screen: Video Tracker and Graphs side-by-side"
        >
          <Columns className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">Split</span>
        </button>

        <button
          onClick={() => onViewModeChange('tracker')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'tracker'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Focus Video Tracker"
        >
          <Video className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">Tracker</span>
        </button>

        <button
          onClick={() => onViewModeChange('graph')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'graph'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Focus Scientific Graphs with Mini Video Overlay"
        >
          <LineChart className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">Graph</span>
        </button>

        <button
          onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'table'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Data Table Spreadsheet"
        >
          <Table className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">Table</span>
        </button>

        <button
          onClick={() => onViewModeChange('sound')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'sound'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="FizziQ Sound & Acoustics Studio: Oscilloscope, FFT, dB meter, Tone Generator"
        >
          <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden 2xl:inline">Sound</span>
        </button>

        <button
          onClick={() => onViewModeChange('physics-suites')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'physics-suites'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="Multi-Topic Physics Suites: Rotational Dynamics, Optics, Circuits & E&M, Thermodynamics"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden 2xl:inline">Suites</span>
        </button>

        <button
          onClick={() => onViewModeChange('notebook')}
          className={`flex items-center gap-1 px-2 xl:px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            viewMode === 'notebook'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
          title="FizziQ Digital Lab Notebook: Cahier d'expériences report builder"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="hidden 2xl:inline">Notebook</span>
        </button>
      </div>

      {/* Real Videos, Tools & Export */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Real Physics Video Selector & Library Browser */}
        <div className="flex items-center gap-1.5">
          <select
            value={activeSampleId || ''}
            onChange={(e) => e.target.value && onSelectSample(e.target.value)}
            className="bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 hover:border-slate-400 transition cursor-pointer shadow-xs max-w-[150px] sm:max-w-[200px] truncate"
          >
            <option value="" disabled>
              🎬 Load Physics Video...
            </option>
            <optgroup label="Real FizziQ Experiments">
              {REAL_EXPERIMENT_VIDEOS.filter((v) => v.source === 'FizziQ').map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Real Tracker Analysis Experiments">
              {REAL_EXPERIMENT_VIDEOS.filter((v) => v.source === 'Tracker').map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </optgroup>
          </select>

          {onOpenVideoLibrary && (
            <button
              onClick={onOpenVideoLibrary}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition shadow-2xs shrink-0"
              title="Browse full video experiment library with search, categories, and physics principles"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Library</span>
            </button>
          )}
        </div>

        {/* Video Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          accept="video/mp4,video/webm,video/quicktime,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
          title="Upload Local Video (MP4, WebM, MOV)"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Webcam button */}
        <button
          onClick={onOpenWebcam}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
          title="Record Experiment using Laptop Webcam"
        >
          <Camera className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

        {/* Multi-Format Export Dropdown */}
        <div className="relative" ref={exportDropdownRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={!hasPoints}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition shadow-xs"
            title="Export Kinematics Data (Excel XLSX, CSV, Project State)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs font-semibold">
              <button
                onClick={() => {
                  onExportExcel();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold">Excel Workbook (.xlsx)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Multi-sheet formatted tables
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportCsv();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left border-t border-slate-100"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold">CSV Spreadsheet (.csv)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    For Python, MATLAB, Sheets
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportProject();
                  setIsExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition text-left border-t border-slate-100"
              >
                <FileCode className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-bold">Project State (.fiz)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Full experiment session save
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Reset points */}
        {hasPoints && (
          <button
            onClick={onResetPoints}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition shadow-xs"
            title="Clear all tracked points"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Help guide */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shadow-xs"
          title="Physics Lab User Guide"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
        </button>
      </div>
    </header>
  );
};


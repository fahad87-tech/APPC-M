import React, { useState } from 'react';
import { TrackSeries } from '../../types/physics';
import { Download, Copy, Check, Trash2 } from 'lucide-react';
import { exportToCsv } from '../../utils/exportUtils';

interface DataTableProps {
  seriesList: TrackSeries[];
  activeSeriesId: string;
  onSelectSeries: (id: string) => void;
  currentTime: number;
  fps: number;
  onSeekTime: (time: number) => void;
  onDeletePoint?: (seriesId: string, pointId: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  seriesList,
  activeSeriesId,
  onSelectSeries,
  currentTime,
  fps,
  onSeekTime,
  onDeletePoint,
}) => {
  const [copied, setCopied] = useState(false);
  const activeSeries = seriesList.find((s) => s.id === activeSeriesId) || seriesList[0];

  const handleCopy = () => {
    if (!activeSeries || activeSeries.points.length === 0) return;

    const headers = [
      'Index',
      'Frame',
      'Time (s)',
      'X (m)',
      'Y (m)',
      'R (m)',
      'Theta (deg)',
      'Vx (m/s)',
      'Vy (m/s)',
      'V (m/s)',
      'Vr (m/s)',
      'Vtheta (m/s)',
      'Omega (rad/s)',
      'Ax (m/s²)',
      'Ay (m/s²)',
      'A (m/s²)',
      'Ac (m/s²)',
      'At (m/s²)',
      'Alpha (rad/s²)',
      'Px (kg·m/s)',
      'Py (kg·m/s)',
      'P (kg·m/s)',
      'Fx (N)',
      'Fy (N)',
      'F (N)',
      'L (kg·m²/s)',
      'Tau (N·m)',
      'Ek (J)',
      'Ep (J)',
      'Em (J)',
      'Work (J)',
    ];

    const rows = activeSeries.points.map((pt, i) => [
      i + 1,
      pt.frame,
      pt.time.toFixed(4),
      pt.x.toFixed(4),
      pt.y.toFixed(4),
      pt.r?.toFixed(4) ?? '',
      pt.theta?.toFixed(2) ?? '',
      pt.vx ?? '',
      pt.vy ?? '',
      pt.v ?? '',
      pt.vr ?? '',
      pt.vtheta ?? '',
      pt.omega ?? '',
      pt.ax ?? '',
      pt.ay ?? '',
      pt.a ?? '',
      pt.ac ?? '',
      pt.at ?? '',
      pt.alpha ?? '',
      pt.px_m ?? '',
      pt.py_m ?? '',
      pt.p ?? '',
      pt.fx ?? '',
      pt.fy ?? '',
      pt.f ?? '',
      pt.angularMomentum ?? '',
      pt.torque ?? '',
      pt.kineticEnergy ?? '',
      pt.potentialEnergy ?? '',
      pt.totalEnergy ?? '',
      pt.work ?? '',
    ]);

    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-4 gap-3 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Physics Kinematics & Dynamics Spreadsheet
          </h2>

          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
            {seriesList.map((series) => (
              <button
                key={series.id}
                onClick={() => onSelectSeries(series.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                  activeSeriesId === series.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span>{series.name}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({series.points.length})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!activeSeries || activeSeries.points.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-bold border border-slate-300 transition shadow-xs"
            title="Copy Table to Clipboard (Excel / Google Sheets compatible)"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied TSV!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={() => exportToCsv(seriesList)}
            disabled={!activeSeries || activeSeries.points.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-auto shadow-xs">
        {activeSeries && activeSeries.points.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-300 font-mono text-[11px] text-slate-600 font-bold">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Frame</th>
                <th className="py-2.5 px-3">Time (s)</th>
                <th className="py-2.5 px-3 text-blue-700">X (m)</th>
                <th className="py-2.5 px-3 text-blue-700">Y (m)</th>
                <th className="py-2.5 px-3 text-teal-700">R (m)</th>
                <th className="py-2.5 px-3 text-teal-700">θ (°)</th>
                <th className="py-2.5 px-3 text-emerald-700">Vx (m/s)</th>
                <th className="py-2.5 px-3 text-emerald-700">Vy (m/s)</th>
                <th className="py-2.5 px-3 text-amber-700">V (m/s)</th>
                <th className="py-2.5 px-3 text-purple-700">ω (rad/s)</th>
                <th className="py-2.5 px-3 text-rose-700">Ax (m/s²)</th>
                <th className="py-2.5 px-3 text-rose-700">Ay (m/s²)</th>
                <th className="py-2.5 px-3 text-rose-800">A (m/s²)</th>
                <th className="py-2.5 px-3 text-orange-700">Ac (m/s²)</th>
                <th className="py-2.5 px-3 text-indigo-700">P (kg·m/s)</th>
                <th className="py-2.5 px-3 text-violet-700">F (N)</th>
                <th className="py-2.5 px-3 text-orange-600">Ek (J)</th>
                <th className="py-2.5 px-3 text-blue-600">Ep (J)</th>
                <th className="py-2.5 px-3 text-pink-700">Em (J)</th>
                <th className="py-2.5 px-3 text-emerald-600">W (J)</th>
                {onDeletePoint && (
                  <th className="py-2.5 px-3 text-center text-rose-600">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {activeSeries.points.map((pt, index) => {
                const isCurrent = Math.abs(pt.time - currentTime) < 0.5 / fps;
                return (
                  <tr
                    key={pt.id}
                    onClick={() => onSeekTime(pt.time)}
                    className={`cursor-pointer transition ${
                      isCurrent
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400">{index + 1}</td>
                    <td className="py-2 px-3 text-slate-500">{pt.frame}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{pt.time.toFixed(3)}</td>
                    <td className="py-2 px-3 text-blue-700">{pt.x.toFixed(4)}</td>
                    <td className="py-2 px-3 text-blue-700">{pt.y.toFixed(4)}</td>
                    <td className="py-2 px-3 text-teal-700">{pt.r?.toFixed(4) ?? '—'}</td>
                    <td className="py-2 px-3 text-teal-700">{pt.theta?.toFixed(1) ?? '—'}</td>
                    <td className="py-2 px-3 text-emerald-700">{pt.vx ?? '—'}</td>
                    <td className="py-2 px-3 text-emerald-700">{pt.vy ?? '—'}</td>
                    <td className="py-2 px-3 text-amber-700 font-bold">{pt.v ?? '—'}</td>
                    <td className="py-2 px-3 text-purple-700">{pt.omega ?? '—'}</td>
                    <td className="py-2 px-3 text-rose-700">{pt.ax ?? '—'}</td>
                    <td className="py-2 px-3 text-rose-700">{pt.ay ?? '—'}</td>
                    <td className="py-2 px-3 text-rose-800 font-bold">{pt.a ?? '—'}</td>
                    <td className="py-2 px-3 text-orange-700">{pt.ac ?? '—'}</td>
                    <td className="py-2 px-3 text-indigo-700">{pt.p ?? '—'}</td>
                    <td className="py-2 px-3 text-violet-700">{pt.f ?? '—'}</td>
                    <td className="py-2 px-3 text-orange-600">{pt.kineticEnergy ?? '—'}</td>
                    <td className="py-2 px-3 text-blue-600">{pt.potentialEnergy ?? '—'}</td>
                    <td className="py-2 px-3 text-pink-700 font-bold">{pt.totalEnergy ?? '—'}</td>
                    <td className="py-2 px-3 text-emerald-600">{pt.work ?? '—'}</td>
                    {onDeletePoint && (
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePoint(activeSeries.id, pt.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title={`Delete point #${index + 1} (Frame ${pt.frame})`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 gap-2">
            <p className="text-sm font-semibold">No points tracked yet.</p>
            <p className="text-xs text-slate-500">
              Switch to Tracker mode and click on an object or use Autotracker to record motion coordinates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

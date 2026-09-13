import * as XLSX from 'xlsx';
import { CalibrationScale, CoordinateOrigin, TrackSeries } from '../types/physics';

/**
 * Generates and downloads a native multi-sheet Excel (.xlsx) workbook of the kinematics experiment
 */
export function exportToExcel(
  seriesList: TrackSeries[],
  scale?: CalibrationScale,
  origin?: CoordinateOrigin,
  videoTitle = 'Physics Experiment',
  filename = 'fizziq_kinematics_data.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Metadata & Calibration Info
  const scalePxLen = scale ? Math.hypot(scale.p2.x - scale.p1.x, scale.p2.y - scale.p1.y) : 0;
  const pxPerMeter = scale ? scalePxLen / (scale.distanceInMeters || 1) : 0;

  const metaData: (string | number)[][] = [
    ['FizziQ + Tracker Scientific Experiment Report', ''],
    ['Experiment Title', videoTitle],
    ['Date Exported', new Date().toLocaleString()],
    ['Total Tracked Series', seriesList.length],
    ['Total Points Recorded', seriesList.reduce((sum, s) => sum + s.points.length, 0)],
    ['', ''],
    ['CALIBRATION & COORDINATE SYSTEM', ''],
    ['Scale Reference Length', scale ? `${scale.distanceInMeters} m (${scale.unit})` : 'N/A'],
    ['Scale Pixel Length', scale ? `${scalePxLen.toFixed(2)} px` : 'N/A'],
    ['Pixel Ratio', scale ? `${pxPerMeter.toFixed(2)} px/m` : 'N/A'],
    ['Origin Pixel Coordinates', origin ? `(${origin.origin.x}, ${origin.origin.y})` : 'N/A'],
    ['Axes Inversion X (Leftwards = +X)', origin?.invertX ? 'Flipped (+X Left)' : 'Standard (+X Right)'],
    ['Axes Inversion Y (Upwards = +Y)', origin?.invertY ? 'Enabled (+Y Up)' : 'Disabled (+Y Down)'],
    ['Time Shift (t=0 Offset)', origin?.timeOffset ? `${origin.timeOffset} s` : '0 s'],
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(metaData);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Experiment Info');

  // Sheet 2: Kinematics (All Objects)
  const kinRows: (string | number)[][] = [];
  kinRows.push([
    'Series',
    'Point #',
    'Frame',
    'Time (s)',
    'X (m)',
    'Y (m)',
    'Vx (m/s)',
    'Vy (m/s)',
    'Speed V (m/s)',
    'Ax (m/s²)',
    'Ay (m/s²)',
    'Total Accel A (m/s²)',
    'Radial r (m)',
    'Theta (deg)',
  ]);

  seriesList.forEach((s) => {
    s.points.forEach((pt, idx) => {
      kinRows.push([
        s.name,
        idx + 1,
        pt.frame,
        Number(pt.time.toFixed(4)),
        Number(pt.x.toFixed(4)),
        Number(pt.y.toFixed(4)),
        pt.vx !== undefined ? Number(pt.vx.toFixed(4)) : '',
        pt.vy !== undefined ? Number(pt.vy.toFixed(4)) : '',
        pt.v !== undefined ? Number(pt.v.toFixed(4)) : '',
        pt.ax !== undefined ? Number(pt.ax.toFixed(4)) : '',
        pt.ay !== undefined ? Number(pt.ay.toFixed(4)) : '',
        pt.a !== undefined ? Number(pt.a.toFixed(4)) : '',
        pt.r !== undefined ? Number(pt.r.toFixed(4)) : '',
        pt.theta !== undefined ? Number(pt.theta.toFixed(2)) : '',
      ]);
    });
  });
  const wsKin = XLSX.utils.aoa_to_sheet(kinRows);
  XLSX.utils.book_append_sheet(wb, wsKin, 'Kinematics Data');

  // Sheet 3: Energy & Momentum
  const energyRows: (string | number)[][] = [];
  energyRows.push([
    'Series',
    'Frame',
    'Time (s)',
    'Mass (kg)',
    'Kinetic Energy (J)',
    'Potential Energy (J)',
    'Total Mechanical Energy (J)',
    'Px Momentum (kg·m/s)',
    'Py Momentum (kg·m/s)',
    'Total Momentum P (kg·m/s)',
    'Net Force Fx (N)',
    'Net Force Fy (N)',
  ]);

  seriesList.forEach((s) => {
    s.points.forEach((pt) => {
      energyRows.push([
        s.name,
        pt.frame,
        Number(pt.time.toFixed(4)),
        s.mass,
        pt.kineticEnergy !== undefined ? Number(pt.kineticEnergy.toFixed(4)) : '',
        pt.potentialEnergy !== undefined ? Number(pt.potentialEnergy.toFixed(4)) : '',
        pt.totalEnergy !== undefined ? Number(pt.totalEnergy.toFixed(4)) : '',
        pt.px_m !== undefined ? Number(pt.px_m.toFixed(4)) : '',
        pt.py_m !== undefined ? Number(pt.py_m.toFixed(4)) : '',
        pt.p !== undefined ? Number(pt.p.toFixed(4)) : '',
        pt.fx !== undefined ? Number(pt.fx.toFixed(4)) : '',
        pt.fy !== undefined ? Number(pt.fy.toFixed(4)) : '',
      ]);
    });
  });
  const wsEnergy = XLSX.utils.aoa_to_sheet(energyRows);
  XLSX.utils.book_append_sheet(wb, wsEnergy, 'Energy & Dynamics');

  // Trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Generates and downloads a CSV spreadsheet of the tracked kinematics data
 */
export function exportToCsv(seriesList: TrackSeries[], filename = 'fizziq_kinematics_data.csv') {
  const headers = [
    'Series',
    'Point #',
    'Frame',
    'Time (s)',
    'X (m)',
    'Y (m)',
    'Vx (m/s)',
    'Vy (m/s)',
    'Speed V (m/s)',
    'Ax (m/s²)',
    'Ay (m/s²)',
    'Total Accel A (m/s²)',
    'Kinetic Energy (J)',
    'Potential Energy (J)',
    'Total Energy (J)',
  ];

  const rows: string[] = [headers.join(',')];

  seriesList.forEach((series) => {
    series.points.forEach((pt, index) => {
      rows.push(
        [
          `"${series.name}"`,
          index + 1,
          pt.frame,
          pt.time.toFixed(4),
          pt.x.toFixed(4),
          pt.y.toFixed(4),
          pt.vx !== undefined ? pt.vx.toFixed(4) : '',
          pt.vy !== undefined ? pt.vy.toFixed(4) : '',
          pt.v !== undefined ? pt.v.toFixed(4) : '',
          pt.ax !== undefined ? pt.ax.toFixed(4) : '',
          pt.ay !== undefined ? pt.ay.toFixed(4) : '',
          pt.a !== undefined ? pt.a.toFixed(4) : '',
          pt.kineticEnergy !== undefined ? pt.kineticEnergy.toFixed(4) : '',
          pt.potentialEnergy !== undefined ? pt.potentialEnergy.toFixed(4) : '',
          pt.totalEnergy !== undefined ? pt.totalEnergy.toFixed(4) : '',
        ].join(',')
      );
    });
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Downloads full experiment state as JSON (.fiz or .json)
 */
export function exportToJson(data: unknown, filename = 'fizziq_experiment.fiz') {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Browser download helper
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

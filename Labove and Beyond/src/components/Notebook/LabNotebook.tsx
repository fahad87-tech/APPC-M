import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Printer,
  Download,
  FileText,
  Sparkles,
  Camera,
  LineChart,
  CheckCircle2,
  Calendar,
  User,
  Users,
  GraduationCap,
  Calculator,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import {
  LabNotebookState,
  NotebookCard,
  TrackSeries,
  CalibrationScale,
  CoordinateOrigin,
} from '../../types/physics';
import {
  LAB_WORKSHEET_TEMPLATES,
  getLabTemplateForSample,
  LabWorksheetTemplate,
} from '../../data/labTemplates';
import { MathRenderer } from '../Common/MathRenderer';

interface LabNotebookProps {
  notebookState: LabNotebookState;
  onUpdateNotebook: (newState: LabNotebookState) => void;
  seriesList: TrackSeries[];
  scale: CalibrationScale;
  origin: CoordinateOrigin;
  activeSampleId?: string | null;
  onJumpToView?: (view: 'split' | 'tracker' | 'graph' | 'sound') => void;
  onCaptureGraphSnapshot?: () => {
    imageUrl?: string;
    dataSnippet?: Record<string, string | number>;
    title: string;
    content: string;
  } | null;
  onCaptureTrajectorySnapshot?: () => string | null;
}

export const LabNotebook: React.FC<LabNotebookProps> = ({
  notebookState,
  onUpdateNotebook,
  seriesList,
  scale,
  origin,
  activeSampleId,
  onJumpToView,
  onCaptureGraphSnapshot,
  onCaptureTrajectorySnapshot,
}) => {
  const [showTheory, setShowTheory] = useState<boolean>(true);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => {
    if (notebookState.activeLabId) return notebookState.activeLabId;
    if (activeSampleId) return getLabTemplateForSample(activeSampleId).id;
    return 'lab-uniform-motion';
  });

  // Current active template
  const currentTemplate: LabWorksheetTemplate = useMemo(() => {
    const found = LAB_WORKSHEET_TEMPLATES.find((t) => t.id === activeTemplateId);
    return found || getLabTemplateForSample(activeSampleId || 'fizziq-uniform-ball');
  }, [activeTemplateId, activeSampleId]);

  // Switch template
  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplateId(templateId);
    const tmpl = LAB_WORKSHEET_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    onUpdateNotebook({
      ...notebookState,
      activeLabId: templateId,
      title: tmpl.title,
      description: tmpl.theorySummary,
    });
  };

  // Top-level field updates
  const handleUpdateField = (field: keyof LabNotebookState, val: any) => {
    onUpdateNotebook({ ...notebookState, [field]: val });
  };

  // Answer updates
  const handleUpdateAnswer = (questionId: string, answer: string) => {
    const currentAnswers = notebookState.answers || {};
    onUpdateNotebook({
      ...notebookState,
      answers: { ...currentAnswers, [questionId]: answer },
    });
  };

  // Calculation value updates
  const handleUpdateStudentValue = (questionId: string, value: number) => {
    const currentValues = notebookState.studentValues || {};
    onUpdateNotebook({
      ...notebookState,
      studentValues: { ...currentValues, [questionId]: value },
    });
  };

  // Add Card
  const handleAddCard = (
    type: NotebookCard['type'],
    customTitle?: string,
    customContent?: string,
    imageUrl?: string,
    snippet?: Record<string, string | number>
  ) => {
    const titles: Record<NotebookCard['type'], string> = {
      hypothesis: 'Scientific Hypothesis',
      protocol: 'Experimental Protocol & Setup',
      text: 'Observation Notes',
      snapshot: 'Motion Tracker Video Frame Snapshot',
      graph: 'Kinematics Graph & Regression Fit',
      sound: 'Acoustics & Frequency Spectrum',
      'physics-suite': 'Physics Simulation Snapshot',
      conclusion: 'Scientific Conclusion & Discussion',
    };

    const newCard: NotebookCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: customTitle || titles[type],
      content:
        customContent ||
        (type === 'hypothesis'
          ? 'We hypothesize that the motion conforms to our kinematic theoretical model.'
          : type === 'conclusion'
          ? 'The experimental data supports the physical law within experimental uncertainty.'
          : 'Document your observations, protocol details, or mathematical notes here.'),
      imageUrl,
      dataSnippet: snippet,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateNotebook({
      ...notebookState,
      cards: [newCard, ...notebookState.cards],
    });
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    onUpdateNotebook({
      ...notebookState,
      cards: notebookState.cards.filter((c) => c.id !== id),
    });
  };

  // 1-Click Attach Graph Snapshot
  const handleAttachGraph = () => {
    if (onCaptureGraphSnapshot) {
      const snap = onCaptureGraphSnapshot();
      if (snap) {
        handleAddCard('graph', snap.title, snap.content, snap.imageUrl, snap.dataSnippet);
        return;
      }
    }
    const totalPts = seriesList.reduce((sum, s) => sum + s.points.length, 0);
    const snippet: Record<string, string | number> = {
      'Active Lab': currentTemplate.title,
      'Total Tracked Points': totalPts,
      'Scale Calibration': `${scale.distanceInMeters} m`,
    };
    handleAddCard(
      'graph',
      `Kinematics Graph: ${currentTemplate.title}`,
      `Kinematics graph captured with ${totalPts} points recorded across the experimental run.`,
      undefined,
      snippet
    );
  };

  // 1-Click Attach Trajectory Snapshot
  const handleAttachTrajectory = () => {
    let imgDataUrl: string | undefined = undefined;
    if (onCaptureTrajectorySnapshot) {
      const url = onCaptureTrajectorySnapshot();
      if (url) imgDataUrl = url;
    }
    const totalPts = seriesList.reduce((sum, s) => sum + s.points.length, 0);
    const snippet: Record<string, string | number> = {
      'Tracked Points': totalPts,
      'Ruler Reference': `${scale.distanceInMeters} m (${scale.unit})`,
      'Coordinate Axes': `${origin.invertX ? '+X Left' : '+X Right'}, ${origin.invertY ? '+Y Up' : '+Y Down'}`,
    };
    handleAddCard(
      'snapshot',
      `Trajectory Snapshot: ${currentTemplate.title}`,
      `Video frame capture showing spatial path and tracked particle reticles.`,
      imgDataUrl,
      snippet
    );
  };

  // 1-Click Attach Data Table Summary
  const handleAttachDataTable = () => {
    const activeSeries = seriesList[0];
    const pts = activeSeries ? activeSeries.points : [];
    if (pts.length === 0) {
      handleAddCard(
        'text',
        'Data Table Summary (Empty)',
        'No points tracked yet. Use the Tracker to record coordinates before embedding a summary table.'
      );
      return;
    }
    const xVals = pts.map((p) => p.x);
    const yVals = pts.map((p) => p.y);
    const vVals = pts.map((p) => p.v || 0);
    const maxV = Math.max(...vVals);
    const timeSpan = pts[pts.length - 1].time - pts[0].time;

    const snippet: Record<string, string | number> = {
      'Total Data Points': pts.length,
      'Time Duration': `${timeSpan.toFixed(3)} s`,
      'Min X': `${Math.min(...xVals).toFixed(3)} m`,
      'Max X': `${Math.max(...xVals).toFixed(3)} m`,
      'Min Y': `${Math.min(...yVals).toFixed(3)} m`,
      'Max Y': `${Math.max(...yVals).toFixed(3)} m`,
      'Peak Speed': `${maxV.toFixed(3)} m/s`,
    };

    handleAddCard(
      'text',
      `Data Summary Table: ${activeSeries.name}`,
      `Tabulated kinematics metrics collected from ${pts.length} frames between t = ${pts[0].time.toFixed(3)}s and t = ${pts[pts.length - 1].time.toFixed(3)}s.`,
      undefined,
      snippet
    );
  };

  // 1-Click Print / PDF Handout
  const handlePrint = () => {
    window.print();
  };

  // 1-Click Markdown Export
  const handleExportMarkdown = () => {
    let md = `# ${notebookState.title || currentTemplate.title}\n\n`;
    md += `**Course:** ${notebookState.courseName || currentTemplate.course}  \n`;
    md += `**Student Name:** ${notebookState.author || 'Student'}  \n`;
    if (notebookState.partnerName) {
      md += `**Lab Partner:** ${notebookState.partnerName}  \n`;
    }
    md += `**Date:** ${notebookState.date}  \n\n`;

    md += `## 1. Learning Objectives\n`;
    currentTemplate.objectives.forEach((obj) => {
      md += `- ${obj}\n`;
    });
    md += `\n`;

    md += `## 2. Theoretical Background & Principles\n`;
    md += `${currentTemplate.theorySummary}\n\n`;
    md += `**Key Equations:**\n`;
    currentTemplate.relevantFormulas.forEach((f) => {
      md += `- $${f}$\n`;
    });
    md += `\n`;

    md += `## 3. Experimental Calibration & Setup\n`;
    md += `- **Reference Scale:** ${scale.distanceInMeters} m (${scale.unit})\n`;
    md += `- **Tracked Series Count:** ${seriesList.length}\n`;
    md += `- **Total Measured Points:** ${seriesList.reduce((sum, s) => sum + s.points.length, 0)}\n\n`;

    md += `## 4. Guided Inquiry Questions & Student Answers\n\n`;
    currentTemplate.questions.forEach((q) => {
      md += `### ${q.prompt}\n\n`;
      const ans = (notebookState.answers && notebookState.answers[q.id]) || '';
      md += `${ans ? ans : '*(No answer provided)*'}\n\n`;

      if (q.category === 'calculation' && q.expectedValue !== undefined) {
        const val = notebookState.studentValues && notebookState.studentValues[q.id];
        if (val !== undefined && val !== null) {
          const err = (Math.abs(val - q.expectedValue) / q.expectedValue) * 100;
          md += `**Calculated Value:** ${val} ${q.unit || ''} (Expected: ${q.expectedValue} ${q.unit || ''}, Percent Error: ${err.toFixed(2)}%)\n\n`;
        }
      }
    });

    if (notebookState.cards.length > 0) {
      md += `## 5. Experimental Data & Evidence Cards\n\n`;
      notebookState.cards.forEach((card, idx) => {
        md += `### ${idx + 1}. ${card.title} (${card.type.toUpperCase()})\n\n`;
        md += `${card.content}\n\n`;
        if (card.dataSnippet) {
          md += `| Parameter | Value |\n|---|---|\n`;
          Object.entries(card.dataSnippet).forEach(([k, v]) => {
            md += `| ${k} | ${v} |\n`;
          });
          md += `\n`;
        }
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(notebookState.title || currentTemplate.title).toLowerCase().replace(/\s+/g, '_')}_lab_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPoints = seriesList.reduce((sum, s) => sum + s.points.length, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-y-auto font-sans print:bg-white print:p-0">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900">Interactive Lab Notebook</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                🧑‍🎓 Student Edition
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                {totalPoints} Points Logged
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Curriculum-aligned physics investigation: Hypotheses, Guided Questions, Graph Snapshots & Error Analysis
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lab Worksheet Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={activeTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {LAB_WORKSHEET_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.title}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

          {/* 1-Click Attachments Toolbar */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={handleAttachGraph}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-white text-blue-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 shadow-2xs transition"
              title="Attach current kinematics graph with regression equation and R²"
            >
              <LineChart className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Graph</span>
            </button>

            <button
              type="button"
              onClick={handleAttachTrajectory}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-white text-emerald-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 shadow-2xs transition"
              title="Capture video frame with particle trajectory and reticles"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Trajectory</span>
            </button>

            <button
              type="button"
              onClick={handleAttachDataTable}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-white text-purple-700 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 shadow-2xs transition"
              title="Embed data table summary of measured velocities and time intervals"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Data Table</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddCard('text')}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              title="Add general text or observation notes card"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-300 mx-0.5" />

          {/* Export to Markdown */}
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-xs"
            title="Download complete lab report as Markdown document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export MD</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            title="Print or Save clean PDF report formatted for classroom submission"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Worksheet Container */}
      <div className="max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col gap-6 print:p-0 print:max-w-full">
        {/* Lab Header Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-blue-600">
                <GraduationCap className="w-4 h-4" />
                {currentTemplate.course}
              </span>
              <span className="font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                Lab-ove and Beyond • by MR. F.
              </span>
            </div>

            {/* Editable Lab Title */}
            <input
              type="text"
              value={notebookState.title || currentTemplate.title}
              onChange={(e) => handleUpdateField('title', e.target.value)}
              placeholder="Lab Experiment Title"
              className="text-2xl md:text-3xl font-extrabold text-slate-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-600 rounded px-1 -ml-1"
            />

            {/* Student & Course Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Student Name
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <input
                    type="text"
                    value={notebookState.author}
                    onChange={(e) => handleUpdateField('author', e.target.value)}
                    placeholder="Student Name"
                    className="bg-transparent font-bold text-slate-800 focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Lab Partner
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <input
                    type="text"
                    value={notebookState.partnerName || ''}
                    onChange={(e) => handleUpdateField('partnerName', e.target.value)}
                    placeholder="Partner Name"
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Course / Period
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={notebookState.courseName || currentTemplate.course}
                    onChange={(e) => handleUpdateField('courseName', e.target.value)}
                    placeholder="Physics Course"
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Date of Experiment
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <input
                    type="text"
                    value={notebookState.date}
                    onChange={(e) => handleUpdateField('date', e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="mt-6">
            <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              🎯 Learning Objectives
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm text-slate-700">
              {currentTemplate.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Theoretical Background & Equations Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                📚 Theoretical Background & Key Equations
              </h2>
            </div>
            <button
              onClick={() => setShowTheory(!showTheory)}
              className="text-xs md:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 print:hidden"
            >
              <span>{showTheory ? 'Collapse' : 'Expand'}</span>
              {showTheory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showTheory && (
            <div className="flex flex-col gap-4 text-sm text-slate-700 leading-relaxed animate-in fade-in duration-150">
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-sm md:text-[15px] leading-relaxed">
                <MathRenderer content={currentTemplate.theorySummary} />
              </div>

              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 md:p-5 flex flex-col gap-2.5">
                <span className="font-bold text-blue-950 text-xs md:text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Fundamental Governing Equations (Rendered with KaTeX):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-1">
                  {currentTemplate.relevantFormulas.map((formula, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-blue-200 shadow-xs flex items-center justify-center text-center overflow-x-auto"
                    >
                      <MathRenderer content={formula} block className="text-sm md:text-base font-bold text-slate-900" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Calibration Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase">Reference Scale:</span>
                  <strong className="text-slate-900 font-mono text-xs md:text-sm">{scale.distanceInMeters} {scale.unit || 'm'}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase">Coordinate Axes:</span>
                  <strong className="text-slate-900 font-mono text-xs md:text-sm">
                    {origin.invertX ? '+X Left' : '+X Right'}, {origin.invertY ? '+Y Up' : '+Y Down'}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase">Active Series:</span>
                  <strong className="text-slate-900 font-mono text-xs md:text-sm">{seriesList.length} Body ({seriesList[0]?.name || 'Object 1'})</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[11px] uppercase">Recorded Points:</span>
                  <strong className="text-blue-600 font-mono text-xs md:text-sm">{totalPoints} points</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guided Inquiry Questions & Student Answer Spaces */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                ✍️ Guided Scientific Inquiry & Questions
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Respond to each inquiry question using your tracked experimental data and attached graphs.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {currentTemplate.questions.length} Inquiries
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {currentTemplate.questions.map((q) => {
              const studentAnswer = (notebookState.answers && notebookState.answers[q.id]) || '';
              const studentValue = notebookState.studentValues && notebookState.studentValues[q.id];
              const hasCalc = q.category === 'calculation' && q.expectedValue !== undefined;
              const percentError =
                hasCalc && studentValue !== undefined && studentValue !== null
                  ? (Math.abs(studentValue - q.expectedValue!) / q.expectedValue!) * 100
                  : null;

              return (
                <div
                  key={q.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-blue-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm md:text-base font-bold text-slate-800 leading-snug">
                      <MathRenderer content={q.prompt} />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 shrink-0">
                      {q.category}
                    </span>
                  </div>

                  {q.hint && (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50/90 px-3 py-1.5 rounded-lg border border-blue-100">
                      <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
                      <div><MathRenderer content={q.hint} /></div>
                    </div>
                  )}

                  {/* Student Answer Text Area */}
                  <textarea
                    rows={4}
                    value={studentAnswer}
                    onChange={(e) => handleUpdateAnswer(q.id, e.target.value)}
                    placeholder="Enter your scientific explanation, mathematical derivation, or interpretation here..."
                    className="w-full p-3.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition leading-relaxed resize-y"
                  />

                  {/* Quantitative Calculation Box (if question is calculation type) */}
                  {hasCalc && (
                    <div className="mt-1 p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-700">Enter Measured Value:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={studentValue !== undefined && studentValue !== null ? studentValue : ''}
                          onChange={(e) => handleUpdateStudentValue(q.id, parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 9.75"
                          className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="font-mono text-slate-600 font-semibold">{q.unit}</span>
                      </div>

                      {percentError !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-xs">
                            Expected: <strong className="text-slate-700">{q.expectedValue} {q.unit}</strong>
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                              percentError <= (q.tolerancePercent || 15)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Error: {percentError.toFixed(2)}%</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attached Evidence, Graphs, and Snapshots Grid */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                📊 Attached Graphs, Trajectories & Evidence Cards
              </h2>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {notebookState.cards.length} Attachments
              </span>
            </div>

            <button
              onClick={handleAttachGraph}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 print:hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach New</span>
            </button>
          </div>

          {notebookState.cards.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2">
              <LineChart className="w-8 h-8 opacity-40 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">No graphs or snapshots attached yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Click <strong>+ Graph</strong> or <strong>+ Trajectory</strong> at the top to capture your live measurements and embed them into this lab worksheet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notebookState.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  {/* Card Image Preview (if present) */}
                  {card.imageUrl && (
                    <div className="relative w-full h-44 bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] backdrop-blur-xs">
                        {card.type.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-slate-800">{card.title}</h4>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition print:hidden"
                          title="Remove card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <MathRenderer content={card.content} />
                      </div>
                    </div>

                    {/* Data Snippet Table */}
                    {card.dataSnippet && (
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-[11px] grid grid-cols-2 gap-1.5 font-mono">
                        {Object.entries(card.dataSnippet).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-bold text-slate-800 truncate">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono text-right border-t border-slate-100 pt-2">
                      Logged at {card.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info & Classroom submission notice */}
        <div className="text-center text-xs text-slate-400 py-4 print:text-black">
          <span>
            Generated by Lab-ove and Beyond by MR. F. • Ready for teacher evaluation & classroom grading
          </span>
        </div>
      </div>
    </div>
  );
};

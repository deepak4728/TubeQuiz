import React from 'react';
import { FileText, Video, Sparkles, Upload, FileCode2, Download } from 'lucide-react';

interface HeaderProps {
  onOpenJsonModal: () => void;
  onLoadSample: () => void;
  onExportJson: () => void;
  hasQuiz: boolean;
  questionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenJsonModal,
  onLoadSample,
  onExportJson,
  hasQuiz,
  questionCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-900 tracking-tight">TubeQuiz</h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                60/40 Exam PDF
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              YouTube Video Q&A via Gemini API &bull; 60% Questions &bull; 40% Handwritten Notes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onLoadSample}
            type="button"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center space-x-1.5"
            title="Load ready-to-test sample quiz data"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Load Sample</span>
          </button>

          <button
            onClick={onOpenJsonModal}
            type="button"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center space-x-1.5"
            title="Upload or Paste JSON"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload JSON</span>
          </button>

          {hasQuiz && (
            <button
              onClick={onExportJson}
              type="button"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition flex items-center space-x-1.5"
              title="Download Quiz JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

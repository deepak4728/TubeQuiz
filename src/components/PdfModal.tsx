import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  Settings,
  Sparkles,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  Columns
} from 'lucide-react';
import { QuizData, PdfOptions } from '../types/quiz';
import { generateTwoColumnQuizPdf, GeneratedPdfResult } from '../utils/pdfGenerator';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizData;
}

export const PdfModal: React.FC<PdfModalProps> = ({ isOpen, onClose, quiz }) => {
  const [pdfResult, setPdfResult] = useState<GeneratedPdfResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'simulation'>('pdf');

  // PDF generation options
  const [options, setOptions] = useState<PdfOptions>({
    includeAnswerSheet: true,
    notesStyle: 'lines',
    fontSize: 'standard',
    accentColor: '#2563eb',
  });

  const generate = () => {
    setIsRendering(true);
    try {
      if (pdfResult?.blobUrl) {
        URL.revokeObjectURL(pdfResult.blobUrl);
      }
      const result = generateTwoColumnQuizPdf(quiz, options);
      setPdfResult(result);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generate();
    }
    return () => {
      if (pdfResult?.blobUrl) {
        URL.revokeObjectURL(pdfResult.blobUrl);
      }
    };
  }, [isOpen, options.notesStyle, options.includeAnswerSheet]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!pdfResult) return;
    const cleanTitle = (quiz.videoTitle || 'TubeQuiz')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    pdfResult.doc.save(`${cleanTitle}_60-40_Notes.pdf`);
  };

  const handlePrint = () => {
    if (!pdfResult?.blobUrl) return;
    const printWindow = window.open(pdfResult.blobUrl);
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  60/40 Split PDF Preview
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                  60% Questions | 40% Ruled Notes
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {quiz.videoTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-200/80 p-0.5 rounded-lg flex text-xs font-medium mr-2">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-2.5 py-1 rounded-md transition ${
                  viewMode === 'pdf'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vector PDF
              </button>
              <button
                onClick={() => setViewMode('simulation')}
                className={`px-2.5 py-1 rounded-md transition ${
                  viewMode === 'simulation'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interactive View
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center space-x-1.5 transition"
              title="Download 60/40 PDF"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs transition"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Toolbar for PDF Options */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-slate-800 flex items-center space-x-1">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes Margin (40% Column):</span>
            </span>

            <div className="flex items-center space-x-1">
              {(['lines', 'grid', 'blank'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setOptions((prev) => ({ ...prev, notesStyle: style }))}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    options.notesStyle === style
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {style === 'lines' ? 'Ruled Lines' : style === 'grid' ? 'Quad Grid' : 'Blank'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.includeAnswerSheet}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, includeAnswerSheet: e.target.checked }))
              }
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span>Include Answer Sheet &amp; Explanations at end</span>
          </label>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-slate-200/70 p-2 sm:p-4 overflow-auto flex items-center justify-center">
          {viewMode === 'pdf' ? (
            pdfResult?.blobUrl ? (
              <iframe
                src={`${pdfResult.blobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-xl bg-white shadow-md border border-slate-300"
                title="60-40 Split PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-sm font-medium">Generating 60/40 two-column PDF...</p>
              </div>
            )
          ) : (
            /* Interactive Simulation of 60/40 Split Sheet */
            <div className="w-full max-w-4xl h-full overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-300 p-6">
              <div className="border-b-2 border-blue-600 pb-3 mb-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{quiz.videoTitle}</h4>
                  <p className="text-xs text-slate-500">
                    60-40 Ratio Split Layout &bull; {quiz.totalQuestions} Questions
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  A4 Page Layout Simulation
                </div>
              </div>

              {/* 60% Left / 40% Right Split Row */}
              <div className="grid grid-cols-12 gap-6 min-h-[500px]">
                {/* 60% Width Questions Column (7 out of 12 cols = 58.3% ~ 60%) */}
                <div className="col-span-7 pr-3 border-r-2 border-dashed border-slate-300 space-y-5">
                  <div className="bg-blue-50/60 p-2 rounded-lg text-xs font-semibold text-blue-800 flex items-center justify-between">
                    <span>QUESTIONS COLUMN (60% WIDTH)</span>
                    <span className="text-[10px] text-blue-600 font-normal">Direct from video</span>
                  </div>

                  {quiz.questions.map((q, idx) => (
                    <div key={q.id || idx} className="space-y-2 pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                          Q{q.questionNumber || idx + 1}
                        </span>
                        {q.timestamp && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 rounded">
                            {q.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-900">{q.question}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-1 pl-1">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="text-[11px] text-slate-600 flex items-start space-x-1.5">
                              <span className="text-slate-400 font-mono">( )</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 40% Width Handwritten Notes Column (5 out of 12 cols = 41.7% ~ 40%) */}
                <div className="col-span-5 pl-1 space-y-4">
                  <div className="bg-slate-100 p-2 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>HANDWRITTEN NOTES (40% WIDTH)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Student workspace</span>
                  </div>

                  {/* Visual notebook ruled lines */}
                  <div className="space-y-4 pt-2">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-7 border-b border-slate-200/90 flex items-center justify-end pr-1 text-[9px] text-slate-300 font-mono select-none"
                      >
                        {i % 4 === 0 ? 'scratchpad' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {options.includeAnswerSheet && (
                <div className="mt-8 pt-6 border-t-2 border-slate-800">
                  <h5 className="font-bold text-sm text-slate-900 mb-2">
                    Answer Sheet &amp; Explanations
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {quiz.questions.map((q, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-emerald-700 mr-2">Q{idx + 1}:</span>
                        <span className="font-semibold text-slate-800">{q.correctAnswer}</span>
                        <p className="text-[11px] text-slate-500 mt-1">{q.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Formatted to two-column 60% question / 40% handwritten note standard for print and tablet study.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save .PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

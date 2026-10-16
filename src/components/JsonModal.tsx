import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Download,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Sparkles
} from 'lucide-react';
import { QuizData } from '../types/quiz';
import { SAMPLE_QUIZ } from '../data/sampleQuiz';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuiz: QuizData;
  onApplyJson: (newQuiz: QuizData) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  onClose,
  currentQuiz,
  onApplyJson,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(currentQuiz, null, 2));
      setError(null);
      setFileName(null);
    }
  }, [isOpen, currentQuiz]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Validate JSON
        const parsed = JSON.parse(content);
        setJsonText(JSON.stringify(parsed, null, 2));
        setError(null);
      } catch (err: any) {
        setError(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);

      // Normalize if array of questions directly or full QuizData
      let formatted: QuizData;
      if (Array.isArray(parsed)) {
        formatted = {
          videoTitle: 'Uploaded Custom Quiz',
          videoUrl: '',
          totalQuestions: parsed.length,
          questions: parsed.map((item, idx) => ({
            id: item.id || idx + 1,
            questionNumber: item.questionNumber || idx + 1,
            question: item.question || 'Untitled Question',
            options: item.options || [],
            correctAnswer: item.correctAnswer || item.answer || 'Not specified',
            explanation: item.explanation || 'Uploaded by user.',
            timestamp: item.timestamp,
            points: item.points || 1,
          })),
        };
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        formatted = {
          videoTitle: parsed.exam_title || parsed.videoTitle || 'Uploaded Custom Quiz',
          videoUrl: parsed.videoUrl || '',
          totalQuestions: parsed.questions.length,
          summary: parsed.summary,
          questions: parsed.questions.map((item: any, idx: number) => {
            // Handle options if it's an object like {"A": "...", "B": "..."}
            let normalizedOptions: string[] = [];
            if (Array.isArray(item.options)) {
              normalizedOptions = item.options;
            } else if (item.options && typeof item.options === 'object') {
              normalizedOptions = Object.entries(item.options).map(
                ([k, v]) => `${k}) ${v}`
              );
            }

            // Map single letter answer (e.g. "B") to full option text if needed
            let finalAnswer = item.correctAnswer || item.answer || 'Not specified';
            if (finalAnswer.length === 1 && /^[A-D]$/i.test(finalAnswer)) {
              const foundOpt = normalizedOptions.find((opt) =>
                opt.trim().toUpperCase().startsWith(finalAnswer.toUpperCase() + ')')
              );
              if (foundOpt) {
                finalAnswer = foundOpt;
              }
            }

            return {
              id: item.id || idx + 1,
              questionNumber: item.questionNumber || item.id || idx + 1,
              question: item.question || 'Untitled Question',
              options: normalizedOptions,
              correctAnswer: finalAnswer,
              explanation: item.explanation || 'Answer verified from custom JSON.',
              timestamp: item.timestamp,
              points: item.points || 1,
            };
          }),
        };
      } else {
        throw new Error('JSON must contain a "questions" array or be an array of question objects.');
      }

      onApplyJson(formatted);
      onClose();
    } catch (err: any) {
      setError(`Cannot apply JSON: ${err.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentQuiz.videoTitle || 'quiz').replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleTemplate = () => {
    setJsonText(JSON.stringify(SAMPLE_QUIZ, null, 2));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                Custom JSON Upload &amp; Editor
              </h3>
              <p className="text-xs text-slate-500">
                Upload your own JSON format or edit the questions directly without using Gemini API.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Upload Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium shadow-2xs transition">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload .JSON File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {fileName && (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium">
                Loaded: {fileName}
              </span>
            )}

            <button
              type="button"
              onClick={handleLoadSampleTemplate}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Template Sample</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 p-4 bg-slate-900 overflow-hidden flex flex-col">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            spellCheck={false}
            className="w-full h-full bg-transparent text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-emerald-900"
            placeholder="Paste your JSON format here..."
          />
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">
            Applying this JSON will re-render the quiz and 60/40 PDF instantly without calling Gemini API.
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl transition"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply to Quiz &amp; PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

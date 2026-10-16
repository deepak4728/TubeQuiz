import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Sparkles,
  BookOpen,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QuizData, QuestionItem } from '../types/quiz';

interface QuizRendererProps {
  quiz: QuizData;
  onGeneratePdf: (action: 'preview' | 'download') => void;
  onOpenJsonEditor: () => void;
  isGeneratingPdf?: boolean;
}

export const QuizRenderer: React.FC<QuizRendererProps> = ({
  quiz,
  onGeneratePdf,
  onOpenJsonEditor,
  isGeneratingPdf = false,
}) => {
  // Store user answers { questionId: selectedOptionString }
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState<boolean>(true); // user prompt requests "renders the quiz along with answer sheet at the end all at once"
  const [videoTimestampJump, setVideoTimestampJump] = useState<string | null>(null);

  const handleSelectOption = (questionId: number, option: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const resetQuiz = () => {
    setUserAnswers({});
  };

  // Calculate score
  const totalQuestions = quiz.questions.length;
  let correctCount = 0;
  quiz.questions.forEach((q) => {
    const userAns = userAnswers[q.id];
    if (userAns) {
      // compare option letter or text
      const cleanUserAns = userAns.trim().toLowerCase();
      const cleanCorrect = q.correctAnswer.trim().toLowerCase();
      if (
        cleanUserAns === cleanCorrect ||
        cleanCorrect.startsWith(cleanUserAns.charAt(0)) ||
        cleanUserAns.includes(cleanCorrect) ||
        cleanCorrect.includes(cleanUserAns)
      ) {
        correctCount++;
      }
    }
  });

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-8">
      {/* Quiz Header & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Ready &bull; {totalQuestions} Questions Found
              </span>
              {quiz.videoId && (
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  ID: {quiz.videoId}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {quiz.videoTitle}
            </h2>
            {quiz.summary && (
              <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {quiz.summary}
              </p>
            )}
          </div>

          {/* PDF Format & Download Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onGeneratePdf('preview')}
              disabled={isGeneratingPdf}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-medium text-xs sm:text-sm shadow-xs transition"
              title="Preview the 60/40 two-column PDF in interactive viewer"
            >
              <Eye className="w-4 h-4" />
              <span>Show 60/40 PDF</span>
            </button>

            <button
              onClick={() => onGeneratePdf('download')}
              disabled={isGeneratingPdf}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-50 text-white font-medium text-xs sm:text-sm shadow-xs transition"
              title="Directly save PDF with 60% question column and 40% handwritten notes column"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Save PDF</span>
            </button>

            <button
              onClick={onOpenJsonEditor}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition"
              title="View, edit or upload custom JSON"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              <span>Edit JSON</span>
            </button>
          </div>
        </div>

        {/* Live Quiz Score Tracker */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
              <span>Answered:</span>
              <span className="font-bold text-blue-600">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            {answeredCount > 0 && (
              <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Score: {correctCount} / {answeredCount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <span>{showAnswers ? 'Hide Answer Sheet' : 'Show Answer Sheet'}</span>
              {showAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {answeredCount > 0 && (
              <button
                onClick={resetQuiz}
                className="text-slate-500 hover:text-slate-700 flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Step Tracker */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          {/* Progress Header & Percentage */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 flex items-center space-x-1">
                <span>Quiz Progress</span>
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-600">
                {answeredCount} of {totalQuestions} completed ({Math.round((answeredCount / (totalQuestions || 1)) * 100)}%)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {answeredCount === totalQuestions && totalQuestions > 0 ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>All Answered!</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const firstUnanswered = quiz.questions.find((q) => !userAnswers[q.id]);
                    if (firstUnanswered) {
                      const num = firstUnanswered.questionNumber || 1;
                      document.getElementById(`question-${num}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline"
                >
                  Jump to next unanswered &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
              style={{
                width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Question Step Tracker / Navigator */}
          <div className="pt-2">
            <div className="flex flex-wrap gap-2 pb-1">
              {quiz.questions.map((q, idx) => {
                const qNum = q.questionNumber || idx + 1;
                const userAns = userAnswers[q.id];
                const isAnswered = Boolean(userAns);
                const isCorrect =
                  isAnswered &&
                  (userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                    q.correctAnswer.toLowerCase().startsWith(userAns.trim().toLowerCase().charAt(0)));

                let buttonStyles =
                  'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50/50';

                if (isAnswered) {
                  if (isCorrect) {
                    buttonStyles =
                      'bg-emerald-500 text-white border-emerald-600 shadow-2xs shadow-emerald-500/20';
                  } else {
                    buttonStyles =
                      'bg-rose-500 text-white border-rose-600 shadow-2xs shadow-rose-500/20';
                  }
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`question-${qNum}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-blue-500');
                        setTimeout(() => {
                          el.classList.remove('ring-2', 'ring-blue-500');
                        }, 1200);
                      }
                    }}
                    title={`Question ${qNum}: ${isAnswered ? (isCorrect ? 'Answered Correctly' : 'Answered Incorrectly') : 'Not answered yet'} (Click to jump)`}
                    className={`shrink-0 w-8 h-8 rounded-lg border text-xs font-bold transition flex items-center justify-center relative ${buttonStyles}`}
                  >
                    {isAnswered ? (
                      isCorrect ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )
                    ) : (
                      <span>{qNum}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-4 text-[11px] text-slate-400 mt-2 px-0.5">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                <span>Unanswered</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Correct</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Incorrect</span>
              </span>
              <span className="text-slate-400 ml-auto hidden sm:inline">
                Click any step to jump to question
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded YouTube Jump Bar (Optional popup if user clicked a timestamp) */}
      {videoTimestampJump && quiz.videoId && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-sm">
              Playing video from discussed timestamp: <strong className="text-amber-300 font-mono">{videoTimestampJump}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={`https://www.youtube.com/watch?v=${quiz.videoId}&t=${videoTimestampJump.replace(':', 'm')}s`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
            >
              <span>Open at {videoTimestampJump}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setVideoTimestampJump(null)}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Questions List (Rendered cleanly with standard HTML & CSS) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Questions Discussed in Video</span>
          </h3>
          <span className="text-xs text-slate-500">
            Interactive practice mode &bull; Select choices below
          </span>
        </div>

        {quiz.questions.map((q, idx) => {
          const qNum = q.questionNumber || idx + 1;
          const selected = userAnswers[q.id];
          const isCorrect =
            selected &&
            (selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
              q.correctAnswer.toLowerCase().startsWith(selected.trim().toLowerCase().charAt(0)));

          return (
            <div
              key={q.id || idx}
              id={`question-${qNum}`}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition p-5 sm:p-6"
            >
              {/* Question Meta Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/50">
                    Q{qNum}
                  </span>
                  {q.timestamp && (
                    <button
                      type="button"
                      onClick={() => setVideoTimestampJump(q.timestamp || null)}
                      className="inline-flex items-center space-x-1 text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100 transition"
                      title="Jump to where this question appears in the video"
                    >
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{q.timestamp} in video</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {selected && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1 ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  )}
                  {q.points && (
                    <span className="text-xs text-slate-400 font-medium">
                      {q.points} pt
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h4 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug mb-4">
                {q.question}
              </h4>

              {/* Options */}
              {q.options && q.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = selected === opt;
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`text-left p-3.5 rounded-xl border text-sm transition flex items-start space-x-3 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-medium ring-1 ring-blue-500'
                            : 'bg-slate-50/40 border-slate-200/80 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 text-slate-500 bg-white'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Open Problem / Short Answer:</span> Discussed by speaker during lecture. Check the answer sheet below for the solution.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Answer Sheet at the End All At Once (User Prompt Requirement) */}
      {showAnswers && (
        <div id="answer-sheet" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Answer Key</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white">
                Answer Sheet &amp; Video Explanations
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Verified solutions and citations directly from the YouTube presenter discussion.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onGeneratePdf('preview')}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>60/40 PDF Preview</span>
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {quiz.questions.map((q, idx) => {
              const qNum = q.questionNumber || idx + 1;
              const userAns = userAnswers[q.id];
              const isMatch =
                userAns &&
                (userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                  q.correctAnswer.toLowerCase().startsWith(userAns.trim().toLowerCase().charAt(0)));

              return (
                <div
                  key={q.id || idx}
                  className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 sm:p-5 hover:border-slate-600 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                        {qNum}
                      </span>
                      <h5 className="font-semibold text-sm text-slate-200">
                        Q{qNum}: {q.question.substring(0, 65)}...
                      </h5>
                    </div>

                    {q.timestamp && (
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md self-start sm:self-center">
                        Timestamp: {q.timestamp}
                      </span>
                    )}
                  </div>

                  {/* Correct Answer Highlight */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 mb-2.5">
                    <div className="text-xs text-slate-400 font-medium mb-1">Correct Answer:</div>
                    <div className="text-sm font-bold text-emerald-400 leading-snug">
                      {q.correctAnswer}
                    </div>

                    {userAns && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-xs flex items-center space-x-2">
                        <span className="text-slate-400">Your choice:</span>
                        <span
                          className={`font-semibold ${
                            isMatch ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {userAns} {isMatch ? '(Correct)' : '(Incorrect)'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Explanation from video */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                    <strong className="text-slate-200 font-semibold block mb-0.5">
                      Video Explanation:
                    </strong>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

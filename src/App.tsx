import React, { useState } from 'react';
import {
  Youtube,
  Sparkles,
  Upload,
  Printer,
  FileText,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Play
} from 'lucide-react';

interface QuestionItem {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string } | string[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
}

interface ExamData {
  exam_title: string;
  total_questions: number;
  summary?: string;
  questions: QuestionItem[];
}

export default function App() {
  const [inputMode, setInputMode] = useState<'youtube' | 'upload' | 'paste'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Layout Controls
  const [questionCols, setQuestionCols] = useState<number>(1);
  const [notesPlacement, setNotesPlacement] = useState<string>('page-side');
  const [notesStyle, setNotesStyle] = useState<string>('pattern-blank');
  const [roughHeight, setRoughHeight] = useState<number>(140);
  const [sideWidth, setSideWidth] = useState<number>(40);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);

  // Exam Data
  const [examData, setExamData] = useState<ExamData>({
    exam_title: 'YouTube Exam Paper & Rough Sheet Generator',
    total_questions: 0,
    questions: []
  });

  // Helper to extract YouTube ID
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
    );
    if (match) return match[1];
    try {
      const parsed = new URL(trimmed);
      if (parsed.searchParams.has('v')) {
        const v = parsed.searchParams.get('v');
        if (v && /^[\w-]{11}$/.test(v)) return v;
      }
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const last = pathParts[pathParts.length - 1];
      if (last && /^[\w-]{11}$/.test(last)) return last;
    } catch {
      // ignore
    }
    return null;
  };

  const videoId = extractYouTubeId(youtubeUrl);

  const getGeminiPrompt = () => {
    const url = youtubeUrl.trim() || '[PASTE YOUTUBE URL HERE]';
    return `Act as an Expert Exam Extractor and Curriculum Transcriber. 

Analyze the provided YouTube video (exam marathon / lecture slides) and extract every unique multiple-choice question (MCQ).

### Extraction Instructions:
1. Slide & Transcript Inspection:
   - Identify every MCQ shown on the screen/slides.
   - Extract the question text, all four options (A, B, C, D), and deduce the verified correct answer from the instructor's discussion.
2. Translation:
   - Translate all question stems and options into clear, grammatically accurate English.
3. Deduplication & Numbering:
   - Identify and discard duplicate questions so every question appears only once.
   - Assign sequential IDs starting from 1 (1, 2, 3...).

### STRICT OUTPUT FORMAT:
- Output the raw JSON strictly inside a single Markdown code fence labeled \`json\` (\`\`\`json ... \`\`\`) so that the UI renders a one-click "Copy" button.
- Do NOT write any introduction, greetings, summaries, notes, or concluding conversational text before or after the code block.

### JSON Schema:
\`\`\`json
{
  "exam_title": "<Descriptive Exam Name Subject Title>",
  "total_questions": <Total count of unique questions>,
  "questions": [
    {
      "id": 1,
      "question": "<Question statement in English>",
      "options": {
        "A": "<Option A text>",
        "B": "<Option B text>",
        "C": "<Option C text>",
        "D": "<Option D text>"
      },
      "answer": "<Single capital letter: A, B, C, or D>"
    }
  ]
}
\`\`\`

Analyze this video link and generate the JSON:
${url}`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getGeminiPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        loadParsedJson(parsed);
      } catch (err: any) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      loadParsedJson(parsed);
    } catch (err: any) {
      alert('Invalid JSON syntax: ' + err.message);
    }
  };

  const loadParsedJson = (parsed: any) => {
    let rawQuestions = parsed.questions || parsed;
    if (!Array.isArray(rawQuestions)) rawQuestions = [];

    const normalized: QuestionItem[] = rawQuestions.map((q: any, idx: number) => {
      let opts: { A: string; B: string; C: string; D: string } = { A: '', B: '', C: '', D: '' };
      if (Array.isArray(q.options)) {
        opts = {
          A: q.options[0] || '',
          B: q.options[1] || '',
          C: q.options[2] || '',
          D: q.options[3] || '',
        };
      } else if (q.options && typeof q.options === 'object') {
        opts = {
          A: q.options.A || q.options['A'] || '',
          B: q.options.B || q.options['B'] || '',
          C: q.options.C || q.options['C'] || '',
          D: q.options.D || q.options['D'] || '',
        };
      }

      let ans = q.correctAnswer || q.answer || 'A';
      if (ans.includes(')')) ans = ans.charAt(0);
      ans = ans.toUpperCase().trim();
      if (!['A', 'B', 'C', 'D'].includes(ans)) ans = 'A';

      return {
        id: q.id || idx + 1,
        question: q.question || '',
        options: opts,
        answer: ans,
        explanation: q.explanation || '',
      };
    });

    const formatted: ExamData = {
      exam_title: parsed.exam_title || parsed.videoTitle || 'Imported Examination Paper',
      total_questions: normalized.length,
      summary: parsed.summary,
      questions: normalized,
    };

    setExamData(formatted);
    setJsonText(JSON.stringify(formatted, null, 2));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-6 print:p-0 print:bg-white">
      {/* Floating Control Panel */}
      <div className="no-print max-w-[1040px] mx-auto mb-7 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Youtube className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">TubeQuiz</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 uppercase tracking-wider">
                  Exam Notes Generator
                </span>
              </div>
              <p className="text-xs text-slate-500">Transform YouTube lectures &amp; MCQs into customizable exam sheets with scratchpads</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setInputMode('youtube')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                inputMode === 'youtube' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              YouTube Video &amp; Prompt
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                inputMode === 'upload' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Upload JSON
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                inputMode === 'paste' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Paste JSON
            </button>
          </div>
        </div>

        {/* Input Mode Container */}
        {inputMode === 'youtube' && (
          <div className="space-y-3.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube video or live link (e.g. https://www.youtube.com/watch?v=...)"
                className="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-xs"
              />
            </div>

            {/* Fluid Responsive Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition space-x-2 cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied Prompt!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-200" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const promptText = getGeminiPrompt();
                  navigator.clipboard.writeText(promptText);
                  alert('Prompt copied to clipboard! Opening Gemini. Paste (Ctrl+V) the prompt into the chat box.');
                  window.open('https://gemini.google.com/app', '_blank');
                }}
                className="flex-1 min-w-[180px] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition space-x-2 cursor-pointer"
                title="Copies prompt & opens Gemini"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Open New Gemini Chat</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>

            {/* Embedded YouTube Player when URL is provided */}
            {videoId && (
              <div className="my-4 p-4 bg-slate-900 rounded-2xl overflow-hidden shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 px-1">
                  <span className="font-medium flex items-center space-x-1.5">
                    <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span>Video Preview Player</span>
                  </span>
                  <span className="font-mono text-slate-400">ID: {videoId}</span>
                </div>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                    title="YouTube video player"
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {inputMode === 'upload' && (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">Click or drag a <code>.json</code> file here</div>
            <div className="text-xs text-slate-500 mt-1">Upload extracted question bank directly</div>
          </div>
        )}

        {inputMode === 'paste' && (
          <div className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste questions JSON data here..."
              className="w-full h-28 p-3 border border-slate-300 rounded-xl font-mono text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handlePasteApply}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Apply JSON Data
            </button>
          </div>
        )}

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-200">
          {/* 1. Columns */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Question Columns</span>
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
              {[1, 2, 3].map((col) => (
                <button
                  key={col}
                  onClick={() => setQuestionCols(col)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    questionCols === col ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {col} Col{col > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Notes Placement */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rough / Notes Placement</span>
            <select
              value={notesPlacement}
              onChange={(e) => setNotesPlacement(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="page-bottom">Bottom of Each Page (Once per page)</option>
              <option value="page-side">Single Side Column (Full Page Margin)</option>
              <option value="dedicated-page">Full Blank Sheet at End of Exam</option>
              <option value="none">None (Questions Only)</option>
            </select>
          </div>

          {/* 3. Notes Background Style */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes Background Style</span>
            <select
              value={notesStyle}
              onChange={(e) => setNotesStyle(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pattern-blank">Fully Blank (Clean White)</option>
              <option value="pattern-ruled">Ruled Notebook Lines</option>
              <option value="pattern-grid">Grid / Graph Pattern</option>
            </select>
          </div>
        </div>

        {/* Sliders Row */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6">
          {notesPlacement === 'page-bottom' && (
            <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Rough Box Height:</label>
              <input
                type="range"
                min="80"
                max="250"
                value={roughHeight}
                onChange={(e) => setRoughHeight(Number(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer"
              />
              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">{roughHeight}px</span>
            </div>
          )}

          {notesPlacement === 'page-side' && (
            <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Side Margin Width:</label>
              <input
                type="range"
                min="15"
                max="45"
                value={sideWidth}
                onChange={(e) => setSideWidth(Number(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer"
              />
              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">{sideWidth}%</span>
            </div>
          )}

          <label className="flex items-center space-x-2 cursor-pointer select-none ml-auto">
            <input
              type="checkbox"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span className="text-xs font-semibold text-slate-700">Include Official Answer Key at End</span>
          </label>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500 font-medium">
            Questions: {questionCols} Cols | Loaded: {examData.questions.length} questions
          </span>
          <div className="w-full sm:w-auto flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.print();
              }}
              disabled={examData.questions.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
              title="Print or Save complete PDF (Cmd+P / Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Exam Document in Scrollable Container */}
      <div
        id="printable-exam"
        className="max-w-[1040px] mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200 max-h-[75vh] overflow-y-auto"
      >
        {/* Header Watermark / Logo */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 text-[11px] text-slate-400 uppercase font-semibold">
          <span className="flex items-center space-x-1.5">
            <span className="w-4 h-4 rounded bg-indigo-600 text-white inline-flex items-center justify-center text-[10px] font-extrabold">T</span>
            <span>TubeQuiz Exam Notes</span>
          </span>
          <span>Customizable Exam Paper</span>
        </div>

        <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-slate-900">
            {examData.exam_title}
          </h1>
          <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mt-2">
            <span>Total Questions: {examData.questions.length}</span>
            <span>{questionCols} Columns Layout</span>
            <span>{includeAnswerKey ? 'Answer Key Attached' : 'Questions Only'}</span>
          </div>
        </div>

        {/* Questions Body */}
        {notesPlacement === 'page-bottom' ? (
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-0 align-top">
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${questionCols}, minmax(0, 1fr))`,
                    }}
                  >
                    {examData.questions.map((q, idx) => {
                      const opts = typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : { A: '', B: '', C: '', D: '' };
                      return (
                        <div key={q.id || idx} className="text-xs sm:text-sm leading-relaxed pb-3 break-inside-avoid">
                          <div className="font-bold text-slate-900 mb-1.5">
                            Q{q.id || idx + 1}. {q.question}
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
                            <div><span className="font-semibold text-slate-900">(A)</span> {opts.A}</div>
                            <div><span className="font-semibold text-slate-900">(B)</span> {opts.B}</div>
                            <div><span className="font-semibold text-slate-900">(C)</span> {opts.C}</div>
                            <div><span className="font-semibold text-slate-900">(D)</span> {opts.D}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="p-0 pt-4">
                  <div className="mt-4 border-1.5 border-dashed border-slate-400 rounded-xl overflow-hidden break-inside-avoid">
                    <div className="bg-slate-100 border-b border-dashed border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center py-1 select-none">
                      SPACE FOR ROUGH WORK / रफ कार्य के लिए स्थान
                    </div>
                    <div
                      className={`w-full ${notesStyle === 'pattern-ruled' ? 'bg-ruled' : notesStyle === 'pattern-grid' ? 'bg-grid' : 'bg-white'}`}
                      style={{ height: `${roughHeight}px` }}
                    />
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        ) : notesPlacement === 'page-side' ? (
          <div className="flex gap-6 w-full">
            <div className="flex-1">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${questionCols}, minmax(0, 1fr))`,
                }}
              >
                {examData.questions.map((q, idx) => {
                  const opts = typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : { A: '', B: '', C: '', D: '' };
                  return (
                    <div key={q.id || idx} className="text-xs sm:text-sm leading-relaxed pb-3 break-inside-avoid">
                      <div className="font-bold text-slate-900 mb-1.5">
                        Q{q.id || idx + 1}. {q.question}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
                        <div><span className="font-semibold text-slate-900">(A)</span> {opts.A}</div>
                        <div><span className="font-semibold text-slate-900">(B)</span> {opts.B}</div>
                        <div><span className="font-semibold text-slate-900">(C)</span> {opts.C}</div>
                        <div><span className="font-semibold text-slate-900">(D)</span> {opts.D}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className="border-l-1.5 border-dashed border-slate-400 pl-4 flex flex-col shrink-0"
              style={{ width: `${sideWidth}%` }}
            >
              <div className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase text-center py-1 rounded-lg mb-2">
                ROUGH WORK
              </div>
              <div
                className={`flex-1 min-h-[600px] rounded-lg ${notesStyle === 'pattern-ruled' ? 'bg-ruled' : notesStyle === 'pattern-grid' ? 'bg-grid' : 'bg-white'}`}
              />
            </div>
          </div>
        ) : (
          <div>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${questionCols}, minmax(0, 1fr))`,
              }}
            >
              {examData.questions.map((q, idx) => {
                const opts = typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : { A: '', B: '', C: '', D: '' };
                return (
                  <div key={q.id || idx} className="text-xs sm:text-sm leading-relaxed pb-3 break-inside-avoid">
                    <div className="font-bold text-slate-900 mb-1.5">
                      Q{q.id || idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
                      <div><span className="font-semibold text-slate-900">(A)</span> {opts.A}</div>
                      <div><span className="font-semibold text-slate-900">(B)</span> {opts.B}</div>
                      <div><span className="font-semibold text-slate-900">(C)</span> {opts.C}</div>
                      <div><span className="font-semibold text-slate-900">(D)</span> {opts.D}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {notesPlacement === 'dedicated-page' && (
              <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-400 break-before-page">
                <h3 className="text-center font-bold text-base uppercase text-slate-800 mb-4">
                  SPACE FOR ROUGH WORK / रफ कार्य
                </h3>
                <div
                  className={`w-full h-[800px] border-1.5 border-dashed border-slate-300 rounded-xl ${notesStyle === 'pattern-ruled' ? 'bg-ruled' : notesStyle === 'pattern-grid' ? 'bg-grid' : 'bg-white'}`}
                />
              </div>
            )}
          </div>
        )}

        {/* Official Answer Key Sheet */}
        {includeAnswerKey && examData.questions.length > 0 && (
          <div className="mt-12 pt-6 border-t-2 border-dashed border-slate-400 break-before-page">
            <h3 className="text-center font-bold text-base uppercase tracking-wider text-slate-900 mb-4">
              Official Answer Sheet (Key)
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {examData.questions.map((q, idx) => (
                <div key={idx} className="border border-slate-300 p-2 text-center rounded-lg bg-slate-50 text-xs">
                  <span className="font-bold text-slate-500 mr-1">{q.id || idx + 1}.</span>
                  <span className="font-extrabold text-indigo-600">{q.answer || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Watermark */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          Generated with TubeQuiz &bull; Customizable Exam Notes &amp; Scratchpad Sheet
        </div>
      </div>
    </div>
  );
}

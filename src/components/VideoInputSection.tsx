import React, { useState } from 'react';
import { Youtube, Search, Sparkles, Loader2, PlayCircle, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SAMPLE_VIDEOS } from '../data/sampleQuiz';

interface VideoInputSectionProps {
  onExtractQuestions: (url: string) => Promise<void>;
  isLoading: boolean;
  statusMessage?: string;
  error?: string | null;
  currentUrl: string;
}

export const VideoInputSection: React.FC<VideoInputSectionProps> = ({
  onExtractQuestions,
  isLoading,
  statusMessage,
  error,
  currentUrl,
}) => {
  const [url, setUrl] = useState(currentUrl);

  const getYouTubeId = (inputUrl: string): string | null => {
    if (!inputUrl) return null;
    const trimmed = inputUrl.trim();
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

  const videoId = getYouTubeId(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onExtractQuestions(url.trim());
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onExtractQuestions(sampleUrl);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <Youtube className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Extract Questions from YouTube Video
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gemini processes the video content to detect and extract only questions directly discussed, shown, or solved by the speaker.
          </p>
        </div>

        <div className="flex items-center text-xs text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg px-3 py-1.5 self-start lg:self-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
          <span>Strict video-only extraction &bull; No outside trivia</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Youtube className="w-5 h-5 text-red-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
              disabled={isLoading}
              className="block w-full pl-11 pr-24 py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="absolute inset-y-0 right-2 px-2 text-xs font-medium text-slate-400 hover:text-slate-600 my-auto h-7"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-sm shadow-blue-600/30 transition shrink-0 space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing Video...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Extract with Gemini</span>
              </>
            )}
          </button>
        </div>

        {/* Video Thumbnail Preview Pill */}
        {videoId && (
          <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video thumbnail"
                className="w-14 h-9 object-cover rounded shrink-0 border border-slate-200"
              />
              <div className="truncate">
                <span className="font-medium text-slate-800 block truncate">
                  YouTube Video ID: {videoId}
                </span>
                <span className="text-slate-500">Ready for Gemini analysis</span>
              </div>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>Watch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Loading status progress indicator */}
        {isLoading && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center space-x-3 text-blue-800 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <div>
              <p className="font-medium">{statusMessage || 'Analyzing video contents and question timestamps with Gemini 3.8 Flash...'}</p>
              <p className="text-blue-600/80 text-[11px] mt-0.5">Fetching quiz questions, verified correct answers, and explanation citations.</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Extraction Failed</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

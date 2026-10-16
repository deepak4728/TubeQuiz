import { QuizData } from '../types/quiz';

export const EMPTY_QUIZ: QuizData = {
  videoTitle: 'Enter a YouTube Video URL to Extract Questions',
  videoUrl: '',
  totalQuestions: 0,
  summary: 'Paste any YouTube video link above and click Extract with Gemini to generate your quiz and 60/40 notes sheet.',
  questions: []
};

export const SAMPLE_QUIZ: QuizData = EMPTY_QUIZ;

export const SAMPLE_VIDEOS = [];

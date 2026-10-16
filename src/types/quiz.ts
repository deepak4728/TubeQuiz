export interface QuestionItem {
  id: number;
  questionNumber: number;
  timestamp?: string;
  question: string;
  type?: 'multiple_choice' | 'true_false' | 'short_answer' | string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points?: number;
}

export interface QuizData {
  videoTitle: string;
  videoId?: string;
  videoUrl: string;
  totalQuestions: number;
  summary?: string;
  extractedAt?: string;
  questions: QuestionItem[];
}

export interface PdfOptions {
  includeAnswerSheet: boolean;
  notesStyle: 'lines' | 'grid' | 'blank';
  fontSize: 'standard' | 'compact' | 'spacious';
  accentColor: string;
}

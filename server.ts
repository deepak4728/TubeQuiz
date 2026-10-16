import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client according to instructions
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper: extract YouTube Video ID with full support for /live/, shorts, embed, youtu.be, and queries
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Match standard paths including /live/, /shorts/, /embed/, /v/, watch?v=
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  if (match) return match[1];

  // Fallback URL parsing for ?v= query parameter or clean path
  try {
    const parsed = new URL(trimmed);
    if (parsed.searchParams.has('v')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
    }
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && /^[\w-]{11}$/.test(lastPart)) return lastPart;
  } catch {
    // ignore
  }

  return null;
}

// Fetch basic oEmbed metadata for accurate title and author
async function fetchYouTubeMetadata(videoId: string): Promise<{ title: string; author: string }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || '',
        author: data.author_name || '',
      };
    }
  } catch (err) {
    console.warn('oEmbed fetch warning:', err);
  }
  return { title: '', author: '' };
}

// API endpoint to extract questions strictly from YouTube video
app.post('/api/extract-questions', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid YouTube video URL.' });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({
        error:
          'Invalid YouTube URL. Please provide a standard YouTube video link (e.g. https://www.youtube.com/watch?v=..., https://youtu.be/..., or https://www.youtube.com/live/...).',
      });
    }

    // Retrieve video details from YouTube oEmbed
    const meta = await fetchYouTubeMetadata(videoId);
    const effectiveTitle = meta.title || 'YouTube Video Lecture';
    const effectiveAuthor = meta.author || 'Instructor / Presenter';

    const ai = getGeminiClient();

    const systemInstruction = `You are a specialized educational AI examiner.
Your job is to extract questions that are EXPLICITLY discussed, displayed on slides/screen, asked, or solved inside the provided YouTube video.
STRICT CONSTRAINT:
- ONLY extract questions that are actually available, discussed, or solved in this video.
- Do NOT generate questions from outside knowledge or unmentioned topics.
- Every single extracted question MUST include exactly 4 multiple-choice options in the 'options' array (e.g. ["A) ...", "B) ...", "C) ...", "D) ..."]). If the video presents open-ended or discussion questions, formulate 4 plausible options based on the video lecture where one is correct.
- Maintain the original language (e.g., Hindi, English, or bilingual) used by the presenter for accuracy.
- Include the exact correct answer and the presenter's explanation/working shown in the video.
- Always include an approximate timestamp (e.g. "05:30") where the question or answer is discussed in the video.`;

    const prompt = `Analyze this YouTube video:
Video Title: "${effectiveTitle}"
Channel / Author: "${effectiveAuthor}"
Video URL: https://www.youtube.com/watch?v=${videoId}
Original Link: ${url}

Examine the questions, practice problems, mock test questions, or marathon quiz items discussed, solved, and taught inside this video.
CRITICAL REQUIREMENT: Extract a comprehensive set of 15 to 25 distinct questions discussed in the video, their options (4 multiple-choice options each), the correct answer confirmed in the video, and the presenter's explanation/working. Do not stop at only a few questions; provide a thorough question set.

Format the output strictly according to this JSON schema:
- videoTitle: "${effectiveTitle}"
- videoId: "${videoId}"
- videoUrl: "https://www.youtube.com/watch?v=${videoId}"
- totalQuestions: number of questions found (aim for 15-25)
- summary: A 1-2 sentence overview of the subject and questions discussed in the video.
- questions: Array of 15 to 25 questions strictly from the video, each with:
  * id: number (1, 2, 3...)
  * questionNumber: number
  * timestamp: string (e.g. "05:20")
  * question: clear question text discussed in the video
  * type: "multiple_choice" or "true_false" or "short_answer"
  * options: array of 4 options (e.g. ["A) Option 1", "B) Option 2", ...])
  * correctAnswer: the correct option or answer stated in the video
  * explanation: concise explanation based on the presenter's discussion
  * points: default 1`;

    // Resilient generation with fallback across models if high demand or quota is encountered
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;
    let textOutput: string | undefined = undefined;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                videoTitle: { type: Type.STRING },
                videoId: { type: Type.STRING },
                videoUrl: { type: Type.STRING },
                totalQuestions: { type: Type.INTEGER },
                summary: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      questionNumber: { type: Type.INTEGER },
                      timestamp: { type: Type.STRING },
                      question: { type: Type.STRING },
                      type: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      points: { type: Type.INTEGER },
                    },
                    required: ['id', 'question', 'correctAnswer', 'explanation'],
                  },
                },
              },
              required: ['videoTitle', 'questions', 'totalQuestions'],
            },
          },
        });

        if (response.text) {
          textOutput = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} extraction attempt error:`, err.message);
        lastError = err;
        // Continue to fallback model
      }
    }

    if (!textOutput) {
      throw lastError || new Error('Could not extract questions with Gemini models.');
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(textOutput);
    } catch {
      // Clean possible markdown code fences if any
      const cleaned = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Ensure questions array exists
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      parsedData.questions = [];
    }

    parsedData.videoTitle = parsedData.videoTitle || effectiveTitle;
    parsedData.videoId = videoId;
    parsedData.videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    parsedData.totalQuestions = parsedData.questions.length;

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error processing YouTube video questions with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process YouTube video. Please verify the URL or try again.',
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Application server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

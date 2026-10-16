# 🎓 TubeQuiz — YouTube Exam & Rough Sheet Notes Generator

> Transform YouTube exam marathons, lectures, and MCQ review slides into printable, customizable exam papers with side scratchpad margins and official answer sheets.

🔗 **Live App**: [https://tubequiz.ai.studio/](https://tubequiz.ai.studio/)

---

## 🌟 Highlights & Features

- 📹 **YouTube Video Preview & Auto-Sync**: Paste any YouTube exam or lecture link to preview video and audio alongside your exam worksheet.
- ⚡ **One-Click Gemini Prompt Extraction**: Generates structured exam extraction prompts tailored for Gemini to extract all MCQs, translate stems and options into English, deduplicate questions, and deduce instructor-verified answers.
- 🚀 **Open in Gemini Integration**: One-click button copies your customized prompt and instantly opens Gemini chat.
- 📝 **Customizable Rough Work & Notes Margins**:
  - **Side Scratchpad Margin**: Configurable margin width (15%–45%) beside questions for scratchpad calculations and note-taking.
  - **Bottom Rough Boxes**: Per-question adjustable height scratchpads.
  - **Dedicated Full Pages**: Full blank, ruled, or grid rough sheets at the end of the question paper.
- 🖨️ **Seamless Print & Save PDF (`Cmd + P` / `Ctrl + P`)**:
  - Automatically isolates the printable exam document and strips UI toolbars.
  - Expands scrollable areas across multiple A4 pages cleanly.
  - Embeds headers, watermarks, question numbers, options, and official answer keys.
- 📂 **Multi-Input Support**:
  - Direct YouTube URL input.
  - Upload JSON file.
  - Paste raw JSON.

---

## 📋 JSON Schema Support

TubeQuiz accepts structured JSON directly output by Gemini:

```json
{
  "exam_title": "Subject Name / Exam Marathon Title",
  "total_questions": 50,
  "questions": [
    {
      "id": 1,
      "question": "Which protocol operates at the transport layer of the OSI model?",
      "options": {
        "A": "IP",
        "B": "TCP",
        "C": "HTTP",
        "D": "ARP"
      },
      "answer": "B"
    }
  ]
}
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Server**: Express (TypeScript with `tsx`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/deepak4728/tubequiz.git
   cd tubequiz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## 📄 License

MIT License. Feel free to use, modify, and distribute for educational and non-commercial purposes.

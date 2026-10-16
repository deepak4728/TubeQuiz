import { jsPDF } from 'jspdf';
import { QuizData, PdfOptions } from '../types/quiz';

export interface GeneratedPdfResult {
  doc: jsPDF;
  blob: Blob;
  blobUrl: string;
  totalPages: number;
}

export function generateTwoColumnQuizPdf(
  quiz: QuizData,
  options: PdfOptions = {
    includeAnswerSheet: true,
    notesStyle: 'lines',
    fontSize: 'standard',
    accentColor: '#2563eb',
  }
): GeneratedPdfResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 12;
  const marginRight = 12;
  const marginTop = 18;
  const marginBottom = 15;

  const contentWidth = pageWidth - marginLeft - marginRight; // 186mm
  const columnGap = 5;
  // 60% left column for questions, 40% right column for handwritten notes
  const leftColWidth = Math.floor(contentWidth * 0.6) - columnGap / 2; // ~109mm
  const rightColX = marginLeft + leftColWidth + columnGap; // 12 + 109 + 5 = 126mm
  const rightColWidth = pageWidth - marginRight - rightColX; // ~72mm
  const dividerX = marginLeft + leftColWidth + columnGap / 2; // boundary line

  const contentBottomLimit = pageHeight - marginBottom;

  let currentPage = 1;

  // Helper to draw the persistent 40% right column for handwritten notes on any page
  const drawNotesColumn = (pageNumber: number) => {
    // Header for notes column
    doc.saveGraphicsState();
    doc.setFillColor(248, 250, 252); // light slate background
    doc.rect(rightColX, marginTop - 4, rightColWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('HANDWRITTEN NOTES & SCRATCHPAD', rightColX + 3, marginTop + 1.5);

    // Subtle note instruction
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Reserved 40% workspace for formulas & reasoning)', rightColX + 3, marginTop + 5.5);

    // Vertical Divider Line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.line(dividerX, marginTop - 4, dividerX, contentBottomLimit);

    // Draw Ruling Lines or Grid inside right 40% column
    if (options.notesStyle === 'lines') {
      const lineSpacing = 7; // standard notebook line spacing 7mm
      doc.setDrawColor(226, 232, 240); // very soft blue/slate line
      doc.setLineWidth(0.2);
      for (let y = marginTop + 11; y < contentBottomLimit; y += lineSpacing) {
        doc.line(rightColX + 2, y, rightColX + rightColWidth - 2, y);
      }
    } else if (options.notesStyle === 'grid') {
      const gridSpacing = 5;
      doc.setDrawColor(235, 238, 242);
      doc.setLineWidth(0.15);
      // horizontal
      for (let y = marginTop + 9; y < contentBottomLimit; y += gridSpacing) {
        doc.line(rightColX + 2, y, rightColX + rightColWidth - 2, y);
      }
      // vertical
      for (let x = rightColX + 2; x < rightColX + rightColWidth; x += gridSpacing) {
        doc.line(x, marginTop + 9, x, contentBottomLimit);
      }
    }
    doc.restoreGraphicsState();
  };

  // Running Header & Footer for a page
  const drawHeaderFooter = (pageNumber: number) => {
    doc.saveGraphicsState();
    // Top banner bar
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, marginTop - 7, pageWidth - marginRight, marginTop - 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const titleTrunc = (quiz.videoTitle || 'YouTube Video Quiz').substring(0, 55);
    doc.text(titleTrunc, marginLeft, marginTop - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`TubeQuiz 60/40 Split Note Sheet`, pageWidth - marginRight, marginTop - 9, { align: 'right' });

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, contentBottomLimit + 3, pageWidth - marginRight, contentBottomLimit + 3);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      quiz.videoUrl ? `Source: ${quiz.videoUrl.substring(0, 50)}...` : 'Generated with Gemini AI',
      marginLeft,
      contentBottomLimit + 7
    );
    doc.text(`Page ${pageNumber}`, pageWidth - marginRight, contentBottomLimit + 7, { align: 'right' });
    doc.restoreGraphicsState();
  };

  // Start Page 1
  drawNotesColumn(currentPage);

  // Document Title Header in the Left Column
  let currentY = marginTop;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(quiz.videoTitle || 'Video Quiz & Test Set', leftColWidth);
  doc.text(titleLines, marginLeft, currentY);
  currentY += titleLines.length * 5.5 + 2;

  // Metadata badge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const metaText = `Total Questions: ${quiz.totalQuestions || quiz.questions.length}  |  Strictly from Video Content`;
  doc.text(metaText, marginLeft, currentY);
  currentY += 4.5;

  if (quiz.summary) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const summaryLines = doc.splitTextToSize(`Overview: ${quiz.summary}`, leftColWidth);
    doc.text(summaryLines, marginLeft, currentY);
    currentY += summaryLines.length * 3.8 + 3;
  }

  // Divider below header in left column
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginLeft, currentY, marginLeft + leftColWidth, currentY);
  currentY += 6;

  // Render each question
  quiz.questions.forEach((q, idx) => {
    const qNum = q.questionNumber || idx + 1;
    const timeBadge = q.timestamp ? ` [${q.timestamp}]` : '';

    // Estimate height needed for this question
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const qTextLines = doc.splitTextToSize(`Q${qNum}.${timeBadge} ${q.question}`, leftColWidth);
    let estimatedHeight = qTextLines.length * 4.5 + 4;

    const optLinesList: string[][] = [];
    if (q.options && q.options.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      q.options.forEach((opt) => {
        const lines = doc.splitTextToSize(`(  )  ${opt}`, leftColWidth - 4);
        optLinesList.push(lines);
        estimatedHeight += lines.length * 3.8 + 2;
      });
    } else {
      // Space for short answer / written response
      estimatedHeight += 12;
    }
    estimatedHeight += 5; // bottom spacing

    // Check if question fits on current page
    if (currentY + estimatedHeight > contentBottomLimit) {
      // Finish current page
      drawHeaderFooter(currentPage);
      // New page
      doc.addPage();
      currentPage++;
      currentY = marginTop;
      drawNotesColumn(currentPage);
    }

    // Draw Question Card Background / Accent
    doc.saveGraphicsState();
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginLeft - 1, currentY - 3, leftColWidth + 2, 7, 1.5, 1.5, 'F');

    // Question Number & Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138); // dark blue
    doc.text(`Q${qNum}.${timeBadge}`, marginLeft + 1, currentY + 1.5);

    if (q.points) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`[${q.points} pt]`, marginLeft + leftColWidth - 1, currentY + 1.5, { align: 'right' });
    }
    doc.restoreGraphicsState();

    currentY += 6;

    // Full Question Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const pureQuestionLines = doc.splitTextToSize(q.question, leftColWidth);
    doc.text(pureQuestionLines, marginLeft, currentY);
    currentY += pureQuestionLines.length * 4.2 + 2.5;

    // Render Options
    if (q.options && q.options.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      q.options.forEach((opt, optIdx) => {
        const optLines = optLinesList[optIdx] || doc.splitTextToSize(`(  )  ${opt}`, leftColWidth - 4);
        doc.text(optLines, marginLeft + 3, currentY);
        currentY += optLines.length * 3.8 + 2;
      });
    } else {
      // Short response blank lines
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Answer:', marginLeft + 3, currentY);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(marginLeft + 15, currentY, marginLeft + leftColWidth - 5, currentY);
      currentY += 8;
    }

    // Light separator between questions
    currentY += 2;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, currentY, marginLeft + leftColWidth, currentY);
    currentY += 4;
  });

  // Finish current page's header/footer
  drawHeaderFooter(currentPage);

  // If Answer Sheet is enabled, append Answer Sheet section
  if (options.includeAnswerSheet) {
    doc.addPage();
    currentPage++;
    currentY = marginTop;

    // Answer Sheet Header
    doc.saveGraphicsState();
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginLeft, currentY - 5, contentWidth, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('COMPLETE ANSWER SHEET & VIDEO EXPLANATIONS', marginLeft + 4, currentY + 1.5);
    doc.restoreGraphicsState();

    currentY += 12;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Answers and explanations derived directly from presenter discussion in the YouTube video.',
      marginLeft,
      currentY
    );
    currentY += 6;

    // Render Answer Key in 2 sub-columns or full width
    const ansColWidth = contentWidth / 2 - 4;

    quiz.questions.forEach((q, idx) => {
      const qNum = q.questionNumber || idx + 1;
      const timeTag = q.timestamp ? ` [At ${q.timestamp}]` : '';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      const answerHead = `Q${qNum}: ${q.correctAnswer || 'Answer discussed in video'}${timeTag}`;
      const headLines = doc.splitTextToSize(answerHead, contentWidth);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const explanationLines = doc.splitTextToSize(`Explanation: ${q.explanation || 'Refer to video lecture.'}`, contentWidth);

      const itemHeight = (headLines.length + explanationLines.length) * 4 + 6;

      if (currentY + itemHeight > contentBottomLimit) {
        drawHeaderFooter(currentPage);
        doc.addPage();
        currentPage++;
        currentY = marginTop;
      }

      // Answer block card
      doc.saveGraphicsState();
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(marginLeft, currentY - 2, contentWidth, itemHeight - 2, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52); // emerald-800
      doc.text(headLines, marginLeft + 3, currentY + 2.5);

      const headOffset = headLines.length * 4.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(explanationLines, marginLeft + 3, currentY + 2.5 + headOffset);
      doc.restoreGraphicsState();

      currentY += itemHeight + 3;
    });

    drawHeaderFooter(currentPage);
  }

  // Now, update total pages in header/footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    doc.setFillColor(255, 255, 255);
    // cover previous page indicator with clean white box
    doc.rect(pageWidth - marginRight - 25, contentBottomLimit + 4, 25, 6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, contentBottomLimit + 7, {
      align: 'right',
    });
    doc.restoreGraphicsState();
  }

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    doc,
    blob,
    blobUrl,
    totalPages,
  };
}

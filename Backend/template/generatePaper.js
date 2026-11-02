import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sanitizes text so pdf-lib StandardFonts (WinAnsi encoding) never crashes on LaTeX or special symbols.
 */
const sanitizeWinAnsi = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/\$\$/g, '')
        .replace(/\$/g, '')
        .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
        .replace(/\\times/g, 'x')
        .replace(/\\div/g, '/')
        .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
        .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
};

/**
 * Splits a single string into wrapped lines that fit within `maxWidth`.
 */
const wrapText = (text, maxWidth, targetFont, fontSize) => {
    const cleanText = sanitizeWinAnsi(text);
    const paragraphs = cleanText.split('\n');
    const lines = [];

    for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            lines.push('');
            continue;
        }

        let currentLine = words[0];
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = `${currentLine} ${word}`;
            const width = targetFont.widthOfTextAtSize(testLine, fontSize);
            if (width <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = `   ${word}`;
            }
        }
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
};

/**
 * Generates a fillable PDF worksheet/exam paper from paper metadata + questions array
 * following the exact layout and AcroForm field conventions of generate_science.js.
 *
 * @param {Object} payload - Paper metadata and questions from req.body
 * @returns {Promise<{ pdfBytes: Uint8Array, filename: string, outputPath: string }>}
 */
export async function buildPaperPdf(payload = {}) {
    // Support both { paper: {...}, questions: [...] } and flat { name, subject, ..., questions: [...] }
    const paper = payload.paper || payload;
    const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];

    const name = paper.name || paper.title || 'ASSESSMENT PAPER';
    const description = paper.description || '';
    const subject = paper.subject || 'GENERAL';
    const grade = paper.grade !== undefined && paper.grade !== null ? String(paper.grade) : '______';
    const duration = paper.duration !== undefined && paper.duration !== null ? `${paper.duration} MINS` : '______';
    const maxMarks = paper.max_marks !== undefined && paper.max_marks !== null ? String(paper.max_marks) : '______';
    const rawFilename =
        paper.filename ||
        `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const filename = rawFilename.endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`;

    // Sort questions by question_number ascending
    const questions = [...rawQuestions].sort(
        (a, b) => (Number(a.question_number) || 0) - (Number(b.question_number) || 0)
    );

    // Create PDF document & embed standard fonts
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const form = pdfDoc.getForm();

    // A4 Page Setup
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const usableWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = 800;
    let mcqFieldCounter = 1;

    // Helper: draw text at x, y
    const drawText = (text, size = 11, isBold = false, x = margin) => {
        const safeText = sanitizeWinAnsi(text);
        page.drawText(safeText, {
            x,
            y,
            size,
            font: isBold ? boldFont : font,
            color: rgb(0, 0, 0),
        });
    };

    // Helper: draw centered text
    const drawCenteredText = (text, size = 12, isBold = true) => {
        const safeText = sanitizeWinAnsi(text);
        const activeFont = isBold ? boldFont : font;
        const textWidth = activeFont.widthOfTextAtSize(safeText, size);
        const x = Math.max(margin, (pageWidth - textWidth) / 2);
        page.drawText(safeText, {
            x,
            y,
            size,
            font: activeFont,
            color: rgb(0, 0, 0),
        });
    };

    // Helper: check if we need a new page
    const checkPageBreak = (spaceNeeded) => {
        if (y - spaceNeeded < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = 800;
        }
    };

    // Helper: section heading with underline & right-aligned section marks
    const addSectionHeading = (title, marksLabel = '') => {
        checkPageBreak(40);
        const safeTitle = sanitizeWinAnsi(title);
        drawText(safeTitle, 12, true);
        const textWidth = boldFont.widthOfTextAtSize(safeTitle, 12);

        page.drawLine({
            start: { x: margin, y: y - 2 },
            end: { x: margin + Math.min(textWidth, usableWidth), y: y - 2 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        if (marksLabel) {
            const safeMarks = sanitizeWinAnsi(marksLabel);
            const marksWidth = boldFont.widthOfTextAtSize(safeMarks, 12);
            page.drawText(safeMarks, {
                x: pageWidth - margin - marksWidth,
                y,
                size: 12,
                font: boldFont,
                color: rgb(0, 0, 0),
            });
        }
        y -= 25;
    };

    // Helper: add an Objective (MCQ) question with checkboxes
    const addMCQ = (questionLines, options, questionMarks) => {
        const spaceNeeded = questionLines.length * 15 + options.length * 22 + 30;
        checkPageBreak(spaceNeeded);

        questionLines.forEach((line, idx) => {
            drawText(line, 11, false);
            if (idx === 0 && questionMarks !== undefined && questionMarks !== null) {
                const markStr = `[${questionMarks}M]`;
                const markW = font.widthOfTextAtSize(markStr, 10);
                page.drawText(markStr, {
                    x: pageWidth - margin - markW,
                    y,
                    size: 10,
                    font,
                    color: rgb(0.3, 0.3, 0.3),
                });
            }
            y -= 15;
        });
        y -= 5;

        options.forEach((optionText) => {
            checkPageBreak(25);
            const cb = form.createCheckBox(`mcq_option_${mcqFieldCounter++}`);
            cb.addToPage(page, { x: margin, y: y - 2, width: 12, height: 12 });

            const wrappedOptLines = wrapText(optionText, usableWidth - 25, font, 11);
            wrappedOptLines.forEach((optLine, optIdx) => {
                page.drawText(sanitizeWinAnsi(optLine), {
                    x: margin + 20,
                    y,
                    size: 11,
                    font,
                    color: rgb(0, 0, 0),
                });
                if (optIdx < wrappedOptLines.length - 1) {
                    y -= 15;
                }
            });
            y -= 22;
        });
        y -= 15;
    };

    // Helper: add a Subjective question with a named multiline text box
    const addQuestionWithNamedTextBox = (questionLines, fieldName, boxHeight = 60, questionMarks) => {
        const linesHeight = questionLines.length * 15;
        checkPageBreak(linesHeight + boxHeight + 40);

        questionLines.forEach((line, idx) => {
            drawText(line, 11, false);
            if (idx === 0 && questionMarks !== undefined && questionMarks !== null) {
                const markStr = `[${questionMarks}M]`;
                const markW = font.widthOfTextAtSize(markStr, 10);
                page.drawText(markStr, {
                    x: pageWidth - margin - markW,
                    y,
                    size: 10,
                    font,
                    color: rgb(0.3, 0.3, 0.3),
                });
            }
            y -= 15;
        });
        y -= 5;

        const textField = form.createTextField(fieldName);
        textField.enableMultiline();
        textField.acroField.setDefaultAppearance('/Helv 11 Tf 0 g');
        textField.addToPage(page, {
            x: margin,
            y: y - boxHeight,
            width: usableWidth,
            height: boxHeight,
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1,
        });

        y -= boxHeight + 20;
    };

    drawCenteredText(name.toUpperCase(), 14, true);
    y -= 22;

    if (description) {
        const descLines = wrapText(description.toUpperCase(), usableWidth, boldFont, 11);
        descLines.forEach((line) => {
            drawCenteredText(line.trim(), 11, true);
            y -= 18;
        });
        y -= 4;
    }

    // Left: SUBJECT | Right: MAX MARKS
    drawText(`SUBJECT: ${String(subject).toUpperCase()}`, 11, true, margin);
    const maxMarksLabel = `MAX MARKS: ${maxMarks}`;
    const maxMarksWidth = boldFont.widthOfTextAtSize(sanitizeWinAnsi(maxMarksLabel), 11);
    drawText(maxMarksLabel, 11, true, pageWidth - margin - maxMarksWidth);
    y -= 18;

    // Left: GRADE / CLASS | Right: DURATION
    drawText(`CLASS / GRADE: ${grade}`, 11, true, margin);
    const durationLabel = `DURATION: ${String(duration).toUpperCase()}`;
    const durationWidth = boldFont.widthOfTextAtSize(sanitizeWinAnsi(durationLabel), 11);
    drawText(durationLabel, 11, true, pageWidth - margin - durationWidth);
    y -= 24;

    // Horizontal rule
    page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    y -= 25;

    // ─────────────────────────────────────────────
    // QUESTIONS RENDERING (Grouped by Section Heading)
    // ─────────────────────────────────────────────
    let currentHeading = null;

    questions.forEach((q, idx) => {
        const qNum = q.question_number ?? idx + 1;
        const qType = String(q.type || 'subjective').toLowerCase().trim();
        const qHeading = (q.heading || '').trim();
        const qMarks = q.marks !== undefined && q.marks !== null ? Number(q.marks) : null;

        // Render section heading whenever it changes
        if (qHeading && qHeading !== currentHeading) {
            currentHeading = qHeading;

            // Compute section marks summary for consecutive questions sharing this heading
            let sectionCount = 0;
            let sectionTotalMarks = 0;
            for (let j = idx; j < questions.length; j++) {
                if ((questions[j].heading || '').trim() === currentHeading) {
                    sectionCount++;
                    sectionTotalMarks += Number(questions[j].marks) || 0;
                } else {
                    break;
                }
            }

            const marksSummary =
                sectionTotalMarks > 0
                    ? qMarks && sectionTotalMarks === qMarks * sectionCount
                        ? `(${qMarks}X${sectionCount}=${sectionTotalMarks}M)`
                        : `(${sectionTotalMarks}M)`
                    : '';

            addSectionHeading(currentHeading, marksSummary);
        }

        // Prefix question number if not already prefixed
        const rawQuestionText = String(q.question || '').trim();
        const hasNumberPrefix = /^[0-9]+[a-zA-Z]?\.\s/.test(rawQuestionText);
        const formattedPrompt = hasNumberPrefix ? rawQuestionText : `${qNum}. ${rawQuestionText}`;
        const questionLines = wrapText(formattedPrompt, usableWidth - 40, font, 11);

        if (qType === 'objective') {
            // Parse options array (jsonb or JSON string)
            let rawOptions = [];
            if (Array.isArray(q.options)) {
                rawOptions = q.options;
            } else if (typeof q.options === 'string' && q.options.trim().length > 0) {
                try {
                    rawOptions = JSON.parse(q.options);
                } catch (e) {
                    rawOptions = [];
                }
            }

            const formattedOptions = rawOptions.map((opt, optIdx) => {
                if (opt && typeof opt === 'object') {
                    const label = (opt.label || String.fromCharCode(97 + optIdx)).toLowerCase();
                    return `${label}. ${opt.text ?? opt.value ?? ''}`;
                }
                const label = String.fromCharCode(97 + optIdx);
                return `${label}. ${String(opt)}`;
            });

            addMCQ(questionLines, formattedOptions, qMarks);
        } else {
            // Dynamic text box height based on marks
            let boxHeight = 60;
            if (qMarks !== null) {
                if (qMarks <= 1) boxHeight = 40;
                else if (qMarks > 1 && qMarks <= 2) boxHeight = 70;
                else if (qMarks > 2 && qMarks <= 3) boxHeight = 150;
                else if (qMarks > 3) boxHeight = 200;
            }

            addQuestionWithNamedTextBox(questionLines, `answer_${qNum}`, boxHeight, qMarks);
        }
    });

    // Save to Backend/template/templatePDFs/<filename>
    const outDir = path.join(__dirname, 'templatePDFs');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(outDir, filename);
    fs.writeFileSync(outputPath, pdfBytes);

    return { pdfBytes, filename, outputPath };
}

export default buildPaperPdf;


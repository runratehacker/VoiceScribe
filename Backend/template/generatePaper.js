import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import unicodeit from 'unicodeit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replaceLatexWithUnicode =
    typeof unicodeit?.replace === 'function'
        ? unicodeit.replace
        : typeof unicodeit?.default?.replace === 'function'
          ? unicodeit.default.replace
          : (s) => s;

const SUPERSCRIPT_MAP = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
};

const SUBSCRIPT_MAP = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'o': 'ₒ', 'u': 'ᵤ', 'x': 'ₓ', 'n': 'ₙ',
};

/**
 * Converts LaTeX expressions into real Unicode math glyphs using `unicodeit`
 * plus structured fraction/root/exponent rules for embedded Unicode TTF fonts.
 */
const formatLatexToUnicode = (str, activeFont = null) => {
    if (!str) return '';
    let out = String(str)
        .replace(/\$\$/g, '')
        .replace(/\$/g, '')
        // Strip \left and \right sizing prefixes
        .replace(/\\left/g, '')
        .replace(/\\right/g, '')
        // Unwrap \text{...}, \mathrm{...}, \textbf{...}, \textit{...}
        .replace(/\\(?:text|mathrm|textbf|textit|mathbf)\{([^{}]*)\}/g, '$1')
        // Pre-normalize degrees before unicodeit so ^{\circ} becomes ° cleanly
        .replace(/\^\{\\circ\}|\^\\circ|\\circ|\\degree/g, '°');

    // Convert \frac{num}{den} (run twice to handle nested fractions)
    const formatFraction = (_, num, den) => {
        const cleanNum = num.trim();
        const cleanDen = den.trim();
        const fmtNum = /[+\-\s]/.test(cleanNum) ? `(${cleanNum})` : cleanNum;
        const fmtDen = /[+\-\s]/.test(cleanDen) ? `(${cleanDen})` : cleanDen;
        return `${fmtNum}/${fmtDen}`;
    };
    out = out
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, formatFraction)
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, formatFraction);

    // Roots with real Unicode radical signs (√, ³√, ⁴√)
    out = out
        .replace(/\\sqrt\[3\]\{([^{}]*)\}/g, (_, rad) =>
            /[+\-\s]/.test(rad.trim()) ? `³√(${rad.trim()})` : `³√${rad.trim()}`
        )
        .replace(/\\sqrt\[4\]\{([^{}]*)\}/g, (_, rad) =>
            /[+\-\s]/.test(rad.trim()) ? `⁴√(${rad.trim()})` : `⁴√${rad.trim()}`
        )
        .replace(/\\sqrt\[([^{}\]]+)\]\{([^{}]*)\}/g, 'root($1, $2)')
        .replace(/\\sqrt\{([^{}]*)\}/g, (_, rad) =>
            /[+\-\s]/.test(rad.trim()) ? `√(${rad.trim()})` : `√${rad.trim()}`
        );

    // Convert remaining LaTeX superscripts ^{...} and subscripts _{...} into Unicode
    out = out.replace(/\^\{([^{}]+)\}/g, (_, exp) => {
        const chars = [...exp];
        if (chars.every((c) => SUPERSCRIPT_MAP[c])) {
            return chars.map((c) => SUPERSCRIPT_MAP[c]).join('');
        }
        return `^(${exp})`;
    });
    out = out.replace(/_\{([^{}]+)\}/g, (_, sub) => {
        const chars = [...sub];
        if (chars.every((c) => SUBSCRIPT_MAP[c])) {
            return chars.map((c) => SUBSCRIPT_MAP[c]).join('');
        }
        return `_(${sub})`;
    });

    // Run unicodeit to convert \pi -> π, \theta -> θ, \leq -> ≤, \geq -> ≥, \neq -> ≠, \times -> ×, x^2 -> x², etc.
    out = replaceLatexWithUnicode(out);

    // Clean up any leftover ^∘ from unicodeit and remaining braces
    out = out
        .replace(/\^∘/g, '°')
        .replace(/[{}]/g, '');

    // Ensure every character is supported by the embedded font so pdf-lib never throws
    if (activeFont && typeof activeFont.encodeText === 'function') {
        out = [...out]
            .filter((ch) => {
                if (ch === '\n') return true;
                try {
                    activeFont.encodeText(ch);
                    return true;
                } catch {
                    return false;
                }
            })
            .join('');
    }

    return out;
};

/**
 * Splits a single string into wrapped lines that fit within `maxWidth`.
 */
const wrapText = (text, maxWidth, targetFont, fontSize) => {
    const cleanText = formatLatexToUnicode(text, targetFont);
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

    // Create PDF document & embed Unicode TTF fonts via @pdf-lib/fontkit
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const regularFontPath = path.join(__dirname, 'fonts', 'segoeui.ttf');
    const boldFontPath = path.join(__dirname, 'fonts', 'segoeuib.ttf');

    let font;
    let boldFont;
    if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
        font = await pdfDoc.embedFont(fs.readFileSync(regularFontPath));
        boldFont = await pdfDoc.embedFont(fs.readFileSync(boldFontPath));
    } else {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

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
        const activeFont = isBold ? boldFont : font;
        const safeText = formatLatexToUnicode(text, activeFont);
        page.drawText(safeText, {
            x,
            y,
            size,
            font: activeFont,
            color: rgb(0, 0, 0),
        });
    };

    // Helper: draw centered text
    const drawCenteredText = (text, size = 12, isBold = true) => {
        const activeFont = isBold ? boldFont : font;
        const safeText = formatLatexToUnicode(text, activeFont);
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
    const addSectionHeading = (title, marksLabel = '', minFollowingSpace = 40) => {
        checkPageBreak(Math.max(40, 25 + minFollowingSpace));
        const safeTitle = formatLatexToUnicode(title, boldFont);
        drawText(safeTitle, 12, true);
        const textWidth = boldFont.widthOfTextAtSize(safeTitle, 12);

        page.drawLine({
            start: { x: margin, y: y - 2 },
            end: { x: margin + Math.min(textWidth, usableWidth), y: y - 2 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        if (marksLabel) {
            const safeMarks = formatLatexToUnicode(marksLabel, boldFont);
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
                page.drawText(formatLatexToUnicode(optLine, font), {
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
    const maxMarksWidth = boldFont.widthOfTextAtSize(formatLatexToUnicode(maxMarksLabel, boldFont), 11);
    drawText(maxMarksLabel, 11, true, pageWidth - margin - maxMarksWidth);
    y -= 18;

    // Left: GRADE / CLASS | Right: DURATION
    drawText(`CLASS / GRADE: ${grade}`, 11, true, margin);
    const durationLabel = `DURATION: ${String(duration).toUpperCase()}`;
    const durationWidth = boldFont.widthOfTextAtSize(formatLatexToUnicode(durationLabel, boldFont), 11);
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

        // Prefix question number if not already prefixed
        const rawQuestionText = String(q.question || '').trim();
        const hasNumberPrefix = /^[0-9]+[a-zA-Z]?\.\s/.test(rawQuestionText);
        const formattedPrompt = hasNumberPrefix ? rawQuestionText : `${qNum}. ${rawQuestionText}`;
        const questionLines = wrapText(formattedPrompt, usableWidth - 40, font, 11);

        // Pre-calculate options or box height so section heading never gets orphaned at page bottom
        let formattedOptions = [];
        let boxHeight = 60;

        if (qType === 'objective') {
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

            formattedOptions = rawOptions.map((opt, optIdx) => {
                if (opt && typeof opt === 'object') {
                    const label = (opt.label || String.fromCharCode(97 + optIdx)).toLowerCase();
                    return `${label}. ${opt.text ?? opt.value ?? ''}`;
                }
                const label = String.fromCharCode(97 + optIdx);
                return `${label}. ${String(opt)}`;
            });
        } else {
            if (qMarks !== null) {
                if (qMarks <= 1) boxHeight = 40;
                else if (qMarks > 1 && qMarks <= 2) boxHeight = 70;
                else if (qMarks > 2 && qMarks <= 3) boxHeight = 150;
                else if (qMarks > 3) boxHeight = 200;
            }
        }

        const firstQuestionSpaceNeeded =
            qType === 'objective'
                ? questionLines.length * 15 + formattedOptions.length * 22 + 30
                : questionLines.length * 15 + boxHeight + 40;

        // Render section heading whenever it changes (ensuring heading + first question fit together)
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

            addSectionHeading(currentHeading, marksSummary, firstQuestionSpaceNeeded);
        }

        if (qType === 'objective') {
            addMCQ(questionLines, formattedOptions, qMarks);
        } else {
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


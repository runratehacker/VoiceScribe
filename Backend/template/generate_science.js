import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createScienceTest() {
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();

    // Embed standard fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Initialize the PDF Form feature
    const form = pdfDoc.getForm();

    // Page setup (A4 Size)
    let page = pdfDoc.addPage([595.28, 841.89]);
    let y = 800;
    const margin = 50;
    const usableWidth = 595.28 - (margin * 2);
    let fieldCounter = 1;

    // Helper to draw standard text
    const drawText = (text, size = 11, isBold = false, x = margin) => {
        page.drawText(text, { x, y, size, font: isBold ? boldFont : font, color: rgb(0, 0, 0) });
    };

    // Helper to check if we need a new page
    const checkPageBreak = (spaceNeeded) => {
        if (y - spaceNeeded < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 800;
        }
    };

    // Helper to add a multiple-choice question with checkboxes
    const addMCQ = (questionLines, options) => {
        const spaceNeeded = (questionLines.length * 15) + (options.length * 22) + 30;
        checkPageBreak(spaceNeeded);

        questionLines.forEach(line => {
            drawText(line, 11, false);
            y -= 15;
        });
        y -= 5;

        options.forEach((option) => {
            const cb = form.createCheckBox(`mcq_option_${fieldCounter++}`);
            cb.addToPage(page, { x: margin, y: y - 2, width: 12, height: 12 });
            page.drawText(option, { x: margin + 20, y, size: 11, font, color: rgb(0, 0, 0) });
            y -= 22;
        });
        y -= 15;
    };

    // Helper to add a question with a named text box
    const addQuestionWithNamedTextBox = (questionLines, fieldName, boxHeight = 60) => {
        const linesHeight = questionLines.length * 15;
        checkPageBreak(linesHeight + boxHeight + 40);

        questionLines.forEach(line => {
            drawText(line, 11, false);
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

        y -= (boxHeight + 20);
    };

    // Helper for section headings
    const addSectionHeading = (title, marks = '') => {
        checkPageBreak(40);
        drawText(title, 12, true);
        const textWidth = boldFont.widthOfTextAtSize(title, 12);
        page.drawLine({
            start: { x: margin, y: y - 2 },
            end: { x: margin + textWidth, y: y - 2 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        if (marks) {
            const marksWidth = boldFont.widthOfTextAtSize(marks, 12);
            page.drawText(marks, {
                x: 595.28 - margin - marksWidth,
                y,
                size: 12,
                font: boldFont,
                color: rgb(0, 0, 0),
            });
        }
        y -= 25;
    };

    // ─────────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────────
    page.drawText('DELHI PUBLIC SCHOOL BANGALORE NORTH', { x: 135, y, size: 14, font: boldFont, color: rgb(0, 0, 0) }); y -= 22;
    page.drawText('ACADEMIC SESSION 2025-2026', { x: 195, y, size: 12, font: boldFont, color: rgb(0, 0, 0) }); y -= 20;
    page.drawText('ANNUAL EXAMINATION', { x: 220, y, size: 12, font: boldFont, color: rgb(0, 0, 0) }); y -= 20;
    page.drawText('SET: ______', { x: 265, y, size: 11, font: boldFont, color: rgb(0, 0, 0) }); y -= 22;

    page.drawText('SUBJECT: SCIENCE', { x: margin, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('MAX MARKS: 60', { x: 400, y, size: 11, font: boldFont, color: rgb(0, 0, 0) }); y -= 18;
    page.drawText('CLASS: V SEC: ______', { x: margin, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('DURATION: 2.5 HOURS', { x: 380, y, size: 11, font: boldFont, color: rgb(0, 0, 0) }); y -= 28;

    // Horizontal rule
    page.drawLine({ start: { x: margin, y }, end: { x: 595.28 - margin, y }, thickness: 1, color: rgb(0, 0, 0) });
    y -= 25;

    // ─────────────────────────────────────────────
    // SECTION I: MULTIPLE CHOICE QUESTIONS
    // ─────────────────────────────────────────────
    addSectionHeading('I. MULTIPLE CHOICE QUESTIONS:', '(1X10=10 M)');

    // Q1
    addMCQ(
        [
            '1. Ravi wants to load a heavy box into a truck. Instead of lifting it straight up, he uses a ramp.',
            '   Why does using the ramp makes his work easier?'
        ],
        [
            'a. It increases the weight of the box.',
            'b. It reduces the distance moved.',
            'c. It reduces the force needed.',
            'd. It changes the shape of the box.'
        ]
    );

    // Q2
    addMCQ(
        [
            '2. A student pulls a rope to hoist a flag upward using a wheel and rope system.',
            '   Which simple machine is used?'
        ],
        [
            'a. Pulley',
            'b. wedge',
            'c. wheel and axle',
            'd. lever'
        ]
    );

    // Q3
    addMCQ(
        [
            '3. The force responsible for the paper pieces moving towards the plastic comb after rubbing',
            '   on the head is called ________________'
        ],
        [
            'a. magnetic force',
            'b. frictional force',
            'c. electrostatic force',
            'd. gravitational force'
        ]
    );

    // Q4
    addMCQ(
        [
            '4. Which of the following is NOT an example of energy transformation?'
        ],
        [
            'a. Speaking',
            'b. Television',
            'c. Radio',
            'd. Candle'
        ]
    );

    // Q5
    addMCQ(
        [
            '5. An empty farm near a village is used for dumping garbage. After a few months, the area',
            '   smells bad, plants stop growing and animals often fall sick. This is caused due to ____________'
        ],
        [
            'a. Noise pollution',
            'b. Air pollution',
            'c. Land pollution',
            'd. Water pollution'
        ]
    );

    // Q6
    addMCQ(
        [
            '6. Animal dung, especially that of cattle such as cows and buffaloes is used to produce a fuel',
            '   called ______________'
        ],
        [
            'a. petroleum',
            'b. biogas',
            'c. coal',
            'd. LPG'
        ]
    );

    // Q7
    addMCQ(
        [
            '7. Even when a person is sleeping or resting, the heart continues to beat and pump blood',
            '   throughout the body without stopping. This action is carried out by ______________'
        ],
        [
            'a. voluntary muscles',
            'b. skeletal muscles',
            'c. cardiac muscles',
            'd. striated muscles'
        ]
    );

    // Q8
    addMCQ(
        [
            '8. While playing, Tina rotates her arm in a circle at the shoulder and bends her elbow to throw',
            '   a ball. Which joint is present in the shoulder?'
        ],
        [
            'a. Hinge joint',
            'b. Ball and socket joint',
            'c. Gliding joint',
            'd. Pivot joint'
        ]
    );

    // Q9
    addMCQ(
        [
            '9. Ravi accidentally touches a hot vessel. His hand is pulled back immediately before he feels',
            '   the pain and only after a moment does he realize what happened. This shows that the',
            '   response was first controlled by the _________.'
        ],
        [
            'a. brain only',
            'b. heart',
            'c. muscles',
            'd. spinal cord'
        ]
    );

    // Q10
    addMCQ(
        [
            '10. Involuntary actions such as breathing, heartbeat, digestion are controlled by the ________.'
        ],
        [
            'a. cerebrum',
            'b. cerebellum',
            'c. brainstem',
            'd. spinal cord'
        ]
    );

    // ─────────────────────────────────────────────
    // SECTION II: NAME THE FOLLOWING
    // ─────────────────────────────────────────────
    addSectionHeading('II. NAME THE FOLLOWING:', '(1X4=4M)');

    addQuestionWithNamedTextBox(
        ['1. The substance that causes pollution.'],
        'answer_11',
        35
    );

    addQuestionWithNamedTextBox(
        ['2. The fixed point around which a lever turns.'],
        'answer_12',
        35
    );

    addQuestionWithNamedTextBox(
        ['3. A push or pull that makes an object move.'],
        'answer_13',
        35
    );

    addQuestionWithNamedTextBox(
        ['4. Strong bands of tissues that attach one bone to another.'],
        'answer_14',
        35
    );

    // ─────────────────────────────────────────────
    // SECTION III: ANSWER THE FOLLOWING
    // ─────────────────────────────────────────────
    addSectionHeading('III. ANSWER THE FOLLOWING:', '(2X5=10M)');

    addQuestionWithNamedTextBox(
        [
            '1. Give the difference between biodegradable waste and non-biodegradable waste along with',
            '   an example.'
        ],
        'answer_15',
        75
    );

    addQuestionWithNamedTextBox(
        [
            '2. Why is a screw better than a nail?'
        ],
        'answer_16',
        65
    );

    addQuestionWithNamedTextBox(
        [
            '3. What are the different functions of the skeletal system?'
        ],
        'answer_17',
        70
    );

    addQuestionWithNamedTextBox(
        [
            '4. With the help of a mind map mention any two types of simple machines with their advantage.'
        ],
        'answer_18',
        75
    );

    addQuestionWithNamedTextBox(
        [
            '5. How many pairs of ribs are present in the human body? To which bones the ribs are attached',
            '   at the front and the back? Why are the last two pairs of ribs called as floating ribs?'
        ],
        'answer_19',
        80
    );

    // Ensure templatePDFs directory exists
    const outDir = path.join(__dirname, 'templatePDFs');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(outDir, 'Science_Annual_Exam.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`PDF successfully generated as ${outputPath}`);
}

createScienceTest().catch(err => {
    console.error('Error generating Science test PDF:', err);
    process.exit(1);
});

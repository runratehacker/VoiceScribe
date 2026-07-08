import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function createSSTWorksheet() {
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();

    // Embed standard fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Initialize the PDF Form feature
    const form = pdfDoc.getForm();

    // Page setup
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    let y = 800;
    const margin = 50;
    const usableWidth = 595.28 - (margin * 2);
    let fieldCounter = 1;

    // Helper to draw standard text
    const drawText = (text, size = 11, isBold = false) => {
        page.drawText(text, { x: margin, y, size, font: isBold ? boldFont : font, color: rgb(0, 0, 0) });
    };

    // Helper to check if we need a new page
    const checkPageBreak = (spaceNeeded) => {
        if (y - spaceNeeded < margin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 800; // Reset Y to top of new page
        }
    };

    // Helper to add a multiple-choice question with checkboxes
    const addMCQ = (questionLines, options) => {
        // Estimate space needed for question lines + options + padding
        const spaceNeeded = (questionLines.length * 15) + (options.length * 20) + 30;
        checkPageBreak(spaceNeeded);

        // Draw question text
        questionLines.forEach(line => {
            drawText(line, 11, false);
            y -= 15;
        });
        y -= 5; // Extra gap before options

        // Draw checkboxes and options
        options.forEach((option) => {
            const cb = form.createCheckBox(`mcq_option_${fieldCounter++}`);

            // Adjust y-2 so the bottom of the checkbox aligns well with the text baseline
            cb.addToPage(page, { x: margin, y: y - 2, width: 12, height: 12 });
            page.drawText(option, { x: margin + 20, y, size: 11, font: font, color: rgb(0, 0, 0) });

            y -= 20;
        });
        y -= 15; // Gap after the question block
    };

    // Helper to add a question and a fillable text box below it
    const addQuestionWithTextBox = (questionText, boxHeight = 50) => {
        checkPageBreak(boxHeight + 40); // Ensure space for text + box + padding

        // 1. Draw Question
        drawText(questionText, 11, false);
        y -= 20; // Move down for the box

        // 2. Create Text Field
        const textField = form.createTextField(`answer_${fieldCounter++}`);

        // 3. Enable multiple lines
        textField.enableMultiline();

        // 4. FIX FOR THE ERROR: Manually set the Default Appearance (/DA)
        textField.acroField.setDefaultAppearance('/Helv 11 Tf 0 g');

        // 5. Add box to page
        textField.addToPage(page, {
            x: margin,
            y: y - boxHeight, // y coordinate is the bottom-left of the box
            width: usableWidth,
            height: boxHeight,
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1,
        });

        y -= (boxHeight + 20); // Move down for the next question
    };

    // --- HEADER ---
    page.drawText('DELHI PUBLIC SCHOOL BANGALORE NORTH', { x: 150, y, size: 14, font: boldFont }); y -= 20;
    page.drawText('SOCIAL SCIENCE WS', { x: 230, y, size: 12, font: boldFont }); y -= 30;
    page.drawText('CLASS: VIII', { x: margin, y, size: 11, font: boldFont });
    // Note: The original document specified "SUB: MATHEMATICS" in the header. Retaining literal translation.
    page.drawText('SUB: MATHEMATICS', { x: 400, y, size: 11, font: boldFont }); y -= 40;

    // --- QUESTIONS ---

    // Q1: Assertion & Reasoning (MCQ)
    addMCQ([
        "1. Two statements are given in the question below as Assertion (A) and Reasoning (R).",
        "Read the statements and choose the appropriate option",
        " ",
        "Assertion: Brahman Pandits gave different interpretations of local laws.",
        "Reasoning: There were different schools of dharmashastra and hence it caused misinterpretation.",

    ], [
        "(a) Both A and R are true, and R is the correct explanation of A.",
        "(b) Both A and R are true, but R is not the correct explanation of A",
        "(c) A is true but R is false",
        "(d) A is false but R is true"
    ]);

    // Q2: Soil Profile (MCQ)
    addMCQ([
        "2. In a soil profile, this layer is found as the second topmost layer.",
        "It mainly consists of sand, silt and clay. In the upper part of this layer, some humus",
        "and vegetation materials are found.",
        " ",
        "Which of the following layer of the soil profile is described above?"
    ], [
        "(a) Sub soil",
        "(b) Weathered rock",
        "(c) Top soil",
        "(d) Parent rock"
    ]);

    // Q3: Short Answer
    addQuestionWithTextBox("3. List any 4 ways in which the Right to Equality is ensured for all citizens.", 100);

    // Q4: Short Answer
    addQuestionWithTextBox("4. What role does a constitution play in a democratic nation?", 120);

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('SST_Worksheet_Generated.pdf', pdfBytes);
    console.log('PDF successfully generated as SST_Worksheet_Generated.pdf');
}

createSSTWorksheet().catch(err => console.error(err));
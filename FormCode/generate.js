const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createWorksheet() {
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

    // Helper to add a question and a fillable text box below it
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
        // '/Helv' = Helvetica font, '10' = Font Size, '0 g' = Black text color
        textField.acroField.setDefaultAppearance('/Helv 13 Tf 0 g');
        
        // 5. Add box to page
        textField.addToPage(page, {
            x: margin,
            y: y - boxHeight, // y coordinate is the bottom-left of the box
            width: usableWidth,
            height: boxHeight,
            borderColor: rgb(0.5, 0.5, 0.5), // Gray border so they can see the box
            borderWidth: 1,
        });
        
        y -= (boxHeight + 20); // Move down for the next question
    };

    // Helper for main section headings
    const addHeading = (text) => {
        checkPageBreak(40);
        drawText(text, 12, true);
        y -= 25;
    };

    // --- HEADER ---
    page.drawText('DELHI PUBLIC SCHOOL BANGALORE NORTH', { x: 160, y, size: 14, font: boldFont }); y -= 20;
    page.drawText('REMEDIAL WORKSHEET', { x: 220, y, size: 12, font: boldFont }); y -= 30;
    page.drawText('CLASS: VIII', { x: margin, y, size: 11, font: boldFont });
    page.drawText('SUB: MATHEMATICS', { x: 400, y, size: 11, font: boldFont }); y -= 20;
    page.drawText('TOPIC: FACTORIZATION', { x: 220, y, size: 11, font: boldFont }); y -= 40;


    // --- QUESTIONS ---
    addHeading('1. Factorize using identities');
    addQuestionWithTextBox('a) 81p^2 q^2 - 49');
    addQuestionWithTextBox('b) 16a^2 - 25/4a^2');

    addHeading('2. Factorize using identities');
    addQuestionWithTextBox('a) h^2 - 13h - 30');
    addQuestionWithTextBox('b) x^2 - 8xy - 48y^2');
    addQuestionWithTextBox('c) p^2 + p - 72');

    addHeading('3. Factorize and divide');
    addQuestionWithTextBox('a) (p^2 + 11p + 28) / (p + 4)', 60);
    addQuestionWithTextBox('b) 4yz(z^2 + 6z - 16) / 2y(z + 8)', 60);

    addHeading('4. Divide using long division');
    addQuestionWithTextBox('a) 6x^2 + 7x - 20 by 2x + 5', 70);
    addQuestionWithTextBox('b) 3x^3 + 4x^2 + 5x + 18 by x + 2', 70);

    addHeading('5. Solve using identity');
    addQuestionWithTextBox('a) 51^2 - 49^2');
    addQuestionWithTextBox('b) (1.02)^2 - (0.98)^2');

    addHeading('6. Solve:');
    addQuestionWithTextBox('(x^4 - 1) / (x - 1)', 60);

    addHeading('7. Verify whether the following equations are correct. Rewrite correctly.');
    addQuestionWithTextBox('(i) (a + 6)^2 = a^2 + 12a + 36', 60);
    addQuestionWithTextBox('(ii) (2a)^2 + 5a = 4a + 5a', 60);

    addHeading('8. Solve for:');
    addQuestionWithTextBox('(4x^2 - 100) / 6(x + 5)', 60);

    addHeading('9. Factorize each of the following by regrouping:');
    addQuestionWithTextBox('(i) x^2 + xy + 9x + 9y');
    addQuestionWithTextBox('(ii) 6xy - 4y + 6 - 9x');

    addHeading('10. State True(T) Or False(F):');
    addQuestionWithTextBox('1. (2x - 5) / 2x = -5', 30);
    addQuestionWithTextBox('2. 3(y - 2) = 3y - 2', 30);
    addQuestionWithTextBox('3. 4x + 3y = 7xy', 30);
    addQuestionWithTextBox('4. (3x)^2 + 4(3x) + 5 = 3x^2 + 12x + 5', 30);
    addQuestionWithTextBox('5. a(5a + 2) = 5a^2 + 2a', 30);

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('Factorisation_Worksheet.pdf', pdfBytes);
    console.log('PDF successfully generated as Factorisation_Worksheet.pdf');
}

createWorksheet().catch(err => console.error(err));
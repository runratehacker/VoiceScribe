import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fillForm = async (req, res) => {
    try {
        const { formFields } = req.body;
        let fields = {};

        // Parse incoming fields (handles both text values and boolean checkbox states)
        if (formFields) {
            Object.keys(formFields).forEach((key) => {
                const field = formFields[key];
                // Ignore metadata fields like headings and Instruction
                if (field && typeof field === 'object' && ('value' in field || 'type' in field)) {
                    fields[key] = field.type === 'checkbox' ? field.filled : field.value;
                }
            });
        }

        // 1. Read the SST template
        const templatePath = path.join(__dirname, '../../template/SST_Worksheet_Generated.pdf');
        const formPdfBytes = fs.readFileSync(templatePath);

        // 2. Load the document
        const pdfDoc = await PDFDocument.load(formPdfBytes);
        const form = pdfDoc.getForm();

        // 3. Helper to safely fill text fields
        const safelySetText = (fieldName, value) => {
            if (value && value !== "NULL") {
                try {
                    form.getTextField(fieldName).setText(String(value));
                } catch (err) {
                    console.warn(`Could not set text for field ${fieldName}`);
                }
            }
        };

        // 3b. Helper to safely fill checkboxes
        const safelySetCheckbox = (fieldName, isChecked) => {
            if (isChecked !== undefined && isChecked !== null) {
                try {
                    const cb = form.getCheckBox(fieldName);
                    if (isChecked) {
                        cb.check();
                    } else {
                        cb.uncheck();
                    }
                } catch (err) {
                    console.warn(`Could not set checkbox for field ${fieldName}`);
                }
            }
        };

        // 4. Fill answer fields
        // MCQs
        const mapOptionToCheckbox = (questionValue, baseIndex) => {
            if (!questionValue) return;
            const val = String(questionValue).toUpperCase().trim();
            let offset = -1;
            if (val === 'A') offset = 0;
            else if (val === 'B') offset = 1;
            else if (val === 'C') offset = 2;
            else if (val === 'D') offset = 3;
            
            if (offset !== -1) {
                safelySetCheckbox(`mcq_option_${baseIndex + offset}`, true);
            }
        };

        mapOptionToCheckbox(fields['question_1'], 1);
        mapOptionToCheckbox(fields['question_2'], 5);
        
        // Subjective answers 9-10
        for (let i = 9; i <= 10; i++) {
            safelySetText(`answer_${i}`, fields[`answer_${i}`]);
        }

        // 5. Serialize and send
        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="filled_sst_worksheet.pdf"');
        res.status(200).send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
}

export default fillForm;

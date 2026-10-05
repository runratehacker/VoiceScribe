import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { GoogleGenAI } from '@google/genai';

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

        // Initialize Gemini client for LaTeX conversion if necessary
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Identify fields that contain LaTeX (dollar signs)
        const textFieldsToConvert = {};
        for (const [key, value] of Object.entries(fields)) {
            if (typeof value === 'string' && value.includes('$')) {
                textFieldsToConvert[key] = value;
            }
        }

        // If there are any LaTeX fields, ask Gemini to flatten them into plain Unicode / ASCII
        if (Object.keys(textFieldsToConvert).length > 0) {
            const prompt = `
Translate the following LaTeX answers into highly readable plain-text suitable for filling in a plain text PDF form field.
Do not change any of the English words, only convert the LaTeX $...$ or $$...$$ blocks into readable ASCII text characters.
CRITICAL: The PDF library only supports standard WinAnsi (ASCII) characters. DO NOT use special Unicode math symbols, fractions, or superscripts/subscripts that fall outside basic ASCII.
Return the exact same JSON object structure but with the values translated. DO NOT return markdown formatting (like \`\`\`json), ONLY return the raw JSON object string.

JSON:
${JSON.stringify(textFieldsToConvert)}
            `.trim();

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: prompt,
                });

                let responseText = response.text.trim();

                // Strip markdown formatting if Gemini includes it anyway
                if (responseText.startsWith('```json')) {
                    responseText = responseText.substring(7, responseText.length - 3).trim();
                } else if (responseText.startsWith('```')) {
                    responseText = responseText.substring(3, responseText.length - 3).trim();
                }

                const translatedFields = JSON.parse(responseText);

                // Merge translated fields back into the main fields object
                for (const [key, val] of Object.entries(translatedFields)) {
                    fields[key] = val;
                }
            } catch (llmError) {
                console.error("LLM LaTeX Conversion Error:", llmError);
                // Gracefully continue with the original fields
            }
        }

        // 1. Read the Science template
        const templatePath = path.join(__dirname, '../../template/templatePDFs/Science_Annual_Exam.pdf');
        
        let formPdfBytes;
        try {
            formPdfBytes = fs.readFileSync(templatePath);
        } catch (err) {
            console.warn("Template PDF not found, returning 404.");
            return res.status(404).json({ error: "Template PDF not found on server" });
        }

        // 2. Load the document
        const pdfDoc = await PDFDocument.load(formPdfBytes);
        const form = pdfDoc.getForm();

        // 3. Helper to safely fill text fields
        const safelySetText = (fieldName, value) => {
            if (value && value !== "NULL") {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) field.setText(String(value));
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
                    if (cb) {
                        if (isChecked) {
                            cb.check();
                        } else {
                            cb.uncheck();
                        }
                    }
                } catch (err) {
                    console.warn(`Could not set checkbox for field ${fieldName}`);
                }
            }
        };

        // 4. Fill answer fields
        // MCQs (answer_1 to answer_10)
        const mapOptionToCheckbox = (questionValue, baseIndex) => {
            // Ensure at most one option is checked by clearing all 4 options first
            for (let i = 0; i < 4; i++) {
                safelySetCheckbox(`mcq_option_${baseIndex + i}`, false);
            }

            if (!questionValue) return;
            const val = String(questionValue).toUpperCase().trim();
            let offset = -1;
            if (val === 'A' || val.startsWith('A.') || val.startsWith('A)') || val === 'OPTION A') offset = 0;
            else if (val === 'B' || val.startsWith('B.') || val.startsWith('B)') || val === 'OPTION B') offset = 1;
            else if (val === 'C' || val.startsWith('C.') || val.startsWith('C)') || val === 'OPTION C') offset = 2;
            else if (val === 'D' || val.startsWith('D.') || val.startsWith('D)') || val === 'OPTION D') offset = 3;
            
            if (offset !== -1) {
                safelySetCheckbox(`mcq_option_${baseIndex + offset}`, true);
            }
        };

        mapOptionToCheckbox(fields['answer_1'], 1);
        mapOptionToCheckbox(fields['answer_2'], 5);
        mapOptionToCheckbox(fields['answer_3'], 9);
        mapOptionToCheckbox(fields['answer_4'], 13);
        mapOptionToCheckbox(fields['answer_5'], 17);
        mapOptionToCheckbox(fields['answer_6'], 21);
        mapOptionToCheckbox(fields['answer_7'], 25);
        mapOptionToCheckbox(fields['answer_8'], 29);
        mapOptionToCheckbox(fields['answer_9'], 33);
        mapOptionToCheckbox(fields['answer_10'], 37);

        // Section II: Name the Following
        safelySetText('answer_11', fields['answer_11']);
        safelySetText('answer_12', fields['answer_12']);
        safelySetText('answer_13', fields['answer_13']);
        safelySetText('answer_14', fields['answer_14']);

        // Section III: Answer the Following
        safelySetText('answer_15', fields['answer_15']);
        safelySetText('answer_16', fields['answer_16']);
        safelySetText('answer_17', fields['answer_17']);
        safelySetText('answer_18', fields['answer_18']);
        safelySetText('answer_19', fields['answer_19']);

        // 5. Serialize and send
        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="filled_science_annual_exam.pdf"');
        res.status(200).send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
};

export default fillForm;

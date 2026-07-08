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

        // Initialize Gemini client (ensure process.env.GEMINI_API_KEY is available)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Identify fields that contain LaTeX (dollar signs)
        const textFieldsToConvert = {};
        for (const [key, value] of Object.entries(fields)) {
            if (typeof value === 'string' && value.includes('$')) {
                textFieldsToConvert[key] = value;
            }
        }

        // If there are any LaTeX fields, ask Gemini to flatten them
        if (Object.keys(textFieldsToConvert).length > 0) {
            const prompt = `
Translate the following LaTeX math answers into highly readable Unicode plain-text suitable for filling in a plain text PDF form field.
Do not change any of the English words, only convert the LaTeX $...$ or $$...$$ blocks into readable text characters.
For example, convert $\\frac{x^2}{2}$ into x² / 2.
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
                // If it fails, we gracefully continue with the original fields
            }
        }

        // 1. Read the factorization template
        // We assume Factorisation_Worksheet.pdf is located in the template/templatePDFs folder
        const templatePath = path.join(__dirname, '../../template/templatePDFs/Factorisation_Worksheet.pdf');
        const formPdfBytes = fs.readFileSync(templatePath);

        // 2. Load the document
        const pdfDoc = await PDFDocument.load(formPdfBytes);
        const form = pdfDoc.getForm();

        // 3. Helper to safely fill text fields (avoids errors if field is missing from request)
        const safelySetText = (fieldName, value) => {
            if (value && value !== "NULL") {
                try {
                    form.getTextField(fieldName).setText(String(value));
                } catch (err) {
                    console.warn(`Could not set text for field ${fieldName}`);
                }
            }
        };

        // 4. Fill answer fields
        for (let i = 1; i <= 22; i++) {
            safelySetText(`answer_${i}`, fields[`answer_${i}`]);
        }

        // 5. Serialize and send
        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="filled_factorization.pdf"');
        res.status(200).send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
}

export default fillForm;

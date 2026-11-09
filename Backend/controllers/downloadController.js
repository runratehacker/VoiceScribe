import { PDFDocument } from 'pdf-lib';
import { GoogleGenAI } from '@google/genai';
import supabase from '../supabase.js';

const downloadController = async (req, res) => {

    try {

        const studentId = Number(req.user.id);
        const paperId = Number(req.params.paperid);

        const { formFields } = req.body;
        let fields = {};

        // 1. Parse incoming formFields:
        // { "formFields": { "answer_1": { "value": "C" }, "answer_2": { "value": "..." } } }

        if (formFields && typeof formFields === 'object') {
            Object.keys(formFields).forEach((key) => {
                const field = formFields[key];
                if (field && typeof field === 'object' && ('value' in field || 'type' in field)) {
                    fields[key] = field.type === 'checkbox' ? field.filled : field.value;
                } else if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
                    fields[key] = field;
                }
            });
        }

        // 2. Convert any LaTeX ($...$) answers to plain ASCII text via Gemini
        const textFieldsToConvert = {};
        for (const [key, value] of Object.entries(fields)) {
            if (typeof value === 'string' && value.includes('$')) {
                textFieldsToConvert[key] = value;
            }
        }

        if (Object.keys(textFieldsToConvert).length > 0 && process.env.GEMINI_API_KEY) {

            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
                    config: {
                        responseMimeType: 'application/json',
                    },
                });

                let responseText = response.text.trim();

                const translatedFields = JSON.parse(responseText);

                for (const [key, val] of Object.entries(translatedFields)) {
                    fields[key] = val;
                }

            } catch (llmError) {
                console.error('LLM LaTeX Conversion Error:', llmError);
            }
        }

        // 3. Fetch filename from PAPER table in Supabase
        const { data: paper, error: paperError } = await supabase
            .from('PAPER')
            .select('filename,teacher_id')
            .eq('id', paperId)
            .single();

        if (paperError || !paper || !paper.filename) {
            return res.status(404).json({ error: 'Paper or filename not found in database' });
        }

        const teacher_id = parseInt(paper.teacher_id);

        // 4. Download Template PDF from Supabase Storage ('papers' bucket)
        const filename = paper.filename;
        let formPdfBytes = null;

        for (const storagePath of [`public/${filename}`]) {
            const { data: blobData, error: storageError } = await supabase.storage
                .from('papers')
                .download(storagePath);

            if (!storageError && blobData) {
                formPdfBytes = Buffer.from(await blobData.arrayBuffer());
                break;
            }
        }

        if (!formPdfBytes) {
            return res.status(404).json({ error: 'Template PDF not found in storage' });
        }

        // 5. Load PDF and Fill Fields Dynamically
        const pdfDoc = await PDFDocument.load(formPdfBytes);
        const form = pdfDoc.getForm();

        const hasTextField = (fieldName) => {
            try {
                return Boolean(form.getTextField(fieldName));
            } catch {
                return false;
            }
        };

        const hasCheckBox = (fieldName) => {
            try {
                return Boolean(form.getCheckBox(fieldName));
            } catch {
                return false;
            }
        };

        const safelySetText = (fieldName, value) => {
            if (value !== undefined && value !== null && value !== '' && value !== 'NULL') {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) field.setText(String(value));
                } catch (err) {
                    console.warn(`Could not set text for field ${fieldName}`);
                }
            }
        };

        const safelySetCheckbox = (fieldName, isChecked) => {
            if (isChecked !== undefined && isChecked !== null) {
                try {
                    const cb = form.getCheckBox(fieldName);
                    if (cb) {
                        if (isChecked) cb.check();
                        else cb.uncheck();
                    }
                } catch (err) {
                    console.warn(`Could not set checkbox for field ${fieldName}`);
                }
            }
        };

        const mapOptionToCheckbox = (questionValue, baseIndex, optionCount = 4) => {
            for (let i = 0; i < optionCount; i++) {
                safelySetCheckbox(`mcq_option_${baseIndex + i}`, false);
            }

            if (!questionValue) return;
            const val = String(questionValue).toUpperCase().trim();
            let offset = -1;
            if (val === 'A' || val.startsWith('A.') || val.startsWith('A)') || val === 'OPTION A') offset = 0;
            else if (val === 'B' || val.startsWith('B.') || val.startsWith('B)') || val === 'OPTION B') offset = 1;
            else if (val === 'C' || val.startsWith('C.') || val.startsWith('C)') || val === 'OPTION C') offset = 2;
            else if (val === 'D' || val.startsWith('D.') || val.startsWith('D)') || val === 'OPTION D') offset = 3;

            if (offset !== -1 && offset < optionCount) {
                safelySetCheckbox(`mcq_option_${baseIndex + offset}`, true);
            }
        };


        let maxQuestionNum = 0;
        Object.keys(fields).forEach((key) => {
            const match = key.match(/^answer_(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxQuestionNum) maxQuestionNum = num;
            }
        });

        let mcqFieldCounter = 1;

        for (let qNum = 1; qNum <= maxQuestionNum; qNum++) {
            const fieldKey = `answer_${qNum}`;
            const answerValue = fields[fieldKey];

            if (hasTextField(fieldKey)) {
                safelySetText(fieldKey, answerValue);
            } else if (hasCheckBox(`mcq_option_${mcqFieldCounter}`)) {
                mapOptionToCheckbox(answerValue, mcqFieldCounter, 4);
                mcqFieldCounter += 4;
            }
        }

        // 6. Serialize and save filled PDF
        const pdfBytes = await pdfDoc.save();
        const outputFilename = `filled_${filename}`;

        let { data: saveData, error: saveError } = await supabase.storage.from('recordedPapers').upload(`public/${outputFilename}_${studentId}`,

            Buffer.from(pdfBytes), {
            contentType: 'application/pdf',
            upsert: true,
        }
        );

        if (saveError) {
            console.error('PDF Save Error:', saveError);
            return res.status(500).json({ error: 'Failed to save PDF in database' });
        }

        let { data: data1, error: error1 } = await supabase.storage.from('recordedPapers').createSignedUrl(`public/${outputFilename}_${studentId}`, 60, {
            download: true
        })

        if (error1) {
            console.log(error1);
            return res.status(500).json({ error: 'Failed to create signed URL' });
        }

        let { data: saveTableData, error: saveTableError } = await supabase.from('RECORDED_PAPER').insert({
            paper_id: paperId,
            student_id: studentId,
            teacher_id: teacher_id,
            filename: `${outputFilename}_${studentId}`
        });

        if (saveTableError) {
            console.log(saveTableError);
            return res.status(500).json({ error: 'Failed to save PDF in database' });
        }

        return res.status(200).json({
            message: 'PDF generated and saved successfully',
            filename,
            signedUrl: data1.signedUrl
        });

    } catch (error) {

        console.error('PDF Generation Error:', error);
        return res.status(500).json({ error: 'Failed to generate PDF' });

    }
};

export default downloadController;

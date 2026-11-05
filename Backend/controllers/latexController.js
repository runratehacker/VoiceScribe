import { GoogleGenAI } from '@google/genai';


const formatLatexController = async (req, res) => {

    try {

        const payload = req.body;
        const questions = Array.isArray(payload.questions) ? payload.questions : [];

        if (questions.length === 0) {

            return res.status(200).json(payload);
        }

        if (!process.env.GEMINI_API_KEY) {

            return res.status(500).json({
                message: 'GEMINI API KEY is missing',
            });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `
            You are a strict LaTeX formatter for an educational examination platform.
            Given the following JSON array of exam questions, convert any mathematical expressions, equations, fractions, exponents, roots, variables, or scientific formulas inside the "question" string and each option's "text" string into proper inline LaTeX wrapped in single dollar signs ($...$).

            Rules:
            1. Do NOT change any English words, grammar, question numbers, headings, marks, types, or option labels.
            2. Wrap mathematical expressions in $...$ (for example: convert "(p^2 + 11p + 28) / (p + 4)" into "$\\frac{p^2 + 11p + 28}{p + 4}$", or "81p^2 q^2 - 49" into "$81p^2q^2 - 49$").
            3. If a question or option is purely plain English with no math/formulas, leave it unchanged.
            4. If an expression is already valid LaTeX wrapped in $...$, keep it properly formatted.
            5. Return ONLY the raw JSON array of questions with the exact same structure. Do NOT include markdown code fences (like \`\`\`json).

            Questions JSON:
            ${JSON.stringify(questions)}
                    `.trim();

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });

        let responseText = (response.text || '').trim();

        const formattedQuestions = JSON.parse(responseText);

        return res.status(200).json({
            ...payload,
            questions: Array.isArray(formattedQuestions) ? formattedQuestions : questions,
        });

    } catch (error) {

        console.error('Error formatting LaTeX with Gemini Flash:', error);

        return res.status(500).json({
            message: 'Failed to format questions into LaTeX',
            error: error.message,
        });

    }
};

export default formatLatexController;


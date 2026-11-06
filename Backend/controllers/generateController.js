import supabase from "../supabase.js";
import buildPaperPdf from "../template/generatePaper.js";

const generatePaper = async (req, res) => {

    try {

        const { pdfBytes, filename, outputPath } = await buildPaperPdf(req.body);


        let { data, error } = await supabase.storage.from('papers').upload(`public/${filename}`,

            Buffer.from(pdfBytes),
            {
                contentType: 'application/pdf',
                upsert: true,
            }
        );

        if (error) {

            console.error('Storage upload error:', error);

            return res.status(500).json({
                message: 'Error saving paper in the Database',
                error: error.message
            });
        }


        let { data: data1, error: error1 } = await supabase.storage.from('papers')
            .createSignedUrl(`public/${filename}`, 60, { download: true });


        const { data: paper_id, error: saveError } = await supabase.from('PAPER').insert(
            {
                teacher_id: 1,
                name: req.body.name,
                description: req.body.description,
                subject: req.body.subject,
                grade: req.body.grade,
                duration: req.body.duration,
                max_marks: req.body.max_marks,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                filename: filename

            })
            .select('id')
            .single();

        if (saveError) {
            console.log(saveError);
            return res.status(500).json({
                message: 'Error in saving Paper in the database',
                error: saveError.message
            });
        }


        const paperId = paper_id?.id;

        const questions = req.body.questions;

        if (questions.length > 0 && paperId) {

            const qObject = questions.map((question, idx) => ({

                paper_id: paperId,
                question_number: question.question_number,
                heading: question.heading,
                question: question.question,
                type: question.type,
                options: question.type === 'objective' ? (question.options || []) : [],
                marks: Number(question.marks)

            }));

            const { error: questionsError } = await supabase.from('QUESTIONS').insert(qObject);


            if (questionsError) {

                console.log(questionsError);

                return res.status(500).json({
                    message: 'Paper created, but failed to save questions in database',
                    error: questionsError.message
                });
            }
        }


        return res.status(200).json({
            message: 'PDF generated and saved successfully',
            filename,
            outputPath,
            signedUrl: data1?.signedUrl,
            paperId
        });

    } catch (error) {

        console.error('Error Generating paper:', error);

        return res.status(500).json({
            message: 'Failed to generate paper PDF',
            error: error.message,
        });
    }
};

export default generatePaper;
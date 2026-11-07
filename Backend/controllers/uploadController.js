import supabase from "../supabase.js";


const uploadPaper = async (req, res) => {

    try {

        const { total_marks, student_id, teacher_id, paper_id } = req.body;

        if (!req.file) {
            return res.status(400).json({
                message: 'No PDF attached'
            });
        }

        const fileBuffer = req.file.buffer;

        const paperid = Number(paper_id);

        const { data, error } = await supabase.from('PAPER').select('filename').eq('id', paperid).single();

        if (error || !data) {
            return res.status(400).json({
                message: 'Invalid paper id'
            });
        }

        const filename = data.filename;

        const { data: storageData, error: uploadError } = await supabase.storage.from('evaluatedPapers').upload(`public/${filename}_${student_id}_evaluated`,

            fileBuffer,
            {
                contentType: 'application/pdf',
                upsert: true,
            }
        );

        if (uploadError) {
            return res.status(400).json({
                message: 'Failed to upload in storage'
            });

        }

        const { data: saveData, error: saveError } = await supabase.from('EVALUATED_PAPER').insert({

            paper_id: paperid,
            student_id: student_id,
            teacher_id: teacher_id,
            total_marks: total_marks,
            filename: `${filename}_${student_id}_evaluated`

        })

        if (saveError) {

            console.log(saveError);

            return res.status(400).json({
                message: 'Failed to save in evalauted paper table'
            });
        }

        return res.status(200).json({
            message: 'Evaluated paper uplaoded successfully and saved in Database'
        });


    } catch (error) {

        return res.status(200).json({
            message: 'Failed to upload paper to Database'
        });

    }

}

export { uploadPaper };
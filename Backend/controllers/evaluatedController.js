import { error } from 'pdf-lib';
import supabase from '../supabase.js';

const getEvaluatedPaper = async (req, res) => {

    try {

        const { studentid } = req.params;

        const student_id = Number(studentid);

        const { data: studentData, error: studentError } = await supabase.from('EVALUATED_PAPER').select('filename').eq('student_id', student_id).single();

        if (studentError) {

            return res.status(200).json({
                message: 'Failed to fetch from evaluated_paper database'
            });

        }

        const filename = studentData?.filename;

        const { data: paperData, error: paperError } = await supabase.storage.from('evaluatedPapers')
            .createSignedUrl(`public/${filename}`, 60, { download: true });

        if (paperError) {

            return res.status(200).json({
                message: 'Failed to fetch from evaluatedPapers storage',
                error: paperError
            });
        }


        return res.status(200).json({
            message: 'PDF feteched successfully from supabase storage',
            signedUrl: paperData?.signedUrl,
        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Failed to fetch evaluated Paper',
            error: error.message,
        });

    }

}

export { getEvaluatedPaper };
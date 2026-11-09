import { error } from 'pdf-lib';
import supabase from '../supabase.js';

const getEvaluatedPaperStudent = async (req, res) => {

    try {

        const student_id = Number(req.user.id);

        const { data: studentData, error: studentError } = await supabase.from('EVALUATED_PAPER').select('filename,paper_id,total_marks,created_at').eq('student_id', student_id);

        if (studentError) {

            return res.status(200).json({
                message: 'Failed to fetch from evaluated_paper database'
            });

        }

        const filePaths = studentData.map(item => `public/${item.filename}`);

        const { data: paperData, error: paperError } = await supabase.storage.from('evaluatedPapers')
            .createSignedUrls(filePaths, 60, { download: true });

        if (paperError) {

            return res.status(200).json({
                message: 'Failed to fetch from evaluatedPapers storage',
                error: paperError
            });
        }

        const urls = paperData.map(item => item.signedUrl);

        const paperids = studentData.map(item => item.paper_id);
        const total_marks = studentData.map(item => item.total_marks);
        const created_at = studentData.map(item => item.created_at);


        return res.status(200).json({
            message: 'PDF feteched successfully from supabase storage',
            signedUrl: urls,
            paperids,
            total_marks,
            created_at
        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Failed to fetch evaluated Paper',
            error: error.message,
        });

    }

}

const getEvaluatedPaperTeacher = async (req, res) => {

    try {

        const teacher_id = Number(req.user.id);

        const { data: teacherData, error: teacherError } = await supabase.from('EVALUATED_PAPER').select('filename,paper_id,total_marks,student_id,created_at').eq('teacher_id', teacher_id);

        if (teacherError) {

            return res.status(200).json({
                message: 'Failed to fetch from evaluated_paper database'
            });

        }

        const filePaths = teacherData.map(item => `public/${item.filename}`);

        const { data: paperData, error: paperError } = await supabase.storage.from('evaluatedPapers')
            .createSignedUrls(filePaths, 60, { download: true });

        if (paperError) {

            return res.status(200).json({
                message: 'Failed to fetch from evaluatedPapers storage',
                error: paperError
            });
        }

        const urls = paperData.map(item => item.signedUrl);

        const paperids = teacherData.map(item => item.paper_id);
        const total_marks = teacherData.map(item => item.total_marks);
        const student_ids = teacherData.map(item => item.student_id);
        const created_at = teacherData.map(item => item.created_at);

        return res.status(200).json({
            message: 'PDF feteched successfully from supabase storage',
            signedUrl: urls,
            paperids,
            student_ids,
            total_marks,
            created_at
        });


    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: 'Failed to fetch evaluated Paper',
            error: error.message,
        });

    }

}

export { getEvaluatedPaperStudent, getEvaluatedPaperTeacher };


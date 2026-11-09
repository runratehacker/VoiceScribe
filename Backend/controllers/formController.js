import downloadController from "./downloadController.js";
import supabase from "../supabase.js";

const getQuestions = async (req, res) => {

    try {

        const paperid = parseInt(req.params.paperid);

        const { error, data } = await supabase.from("QUESTIONS").select("*").eq("paper_id", paperid)

        if (error) throw error;
        res.status(200).json(data);

    } catch (error) {

        console.log(error.message);
        res.status(500).json({ message: "Database Error Occurred" });
    }
}

const getAllPapers = async (req, res) => {

    try {

        const { error, data } = await supabase.from("PAPER").select("*");

        if (error) throw error;
        res.status(200).json(data);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
    }
}

const getAllStudents = async (req, res) => {

    try {

        const { error, data } = await supabase.from("STUDENT").select("*");

        if (error) throw error;
        res.status(200).json(data);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server Error" });
    }

}

const getRecordedPapers = async (req, res) => {

    try {

        const teacher_id = Number(req.user.id);

        const { error, data } = await supabase.from("RECORDED_PAPER").select("filename,student_id,paper_id,created_at").eq("teacher_id", teacher_id);

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Failed to fetch filename of Recorded Paper" });
        }

        const filePaths = data.map(item => `public/${item.filename}`);

        const { data: paperData, error: paperError } = await supabase.storage.from('recordedPapers')
            .createSignedUrls(filePaths, 60, { download: true });

        if (paperError) {
            return res.status(500).json({ message: "Failed to fetch signed URL of Recorded Paper" });
        }

        const paperids = data.map(item => item.paper_id);
        const studentids = data.map(item => item.student_id);

        const created_at = data.map(item => item.created_at);

        const urls = paperData.map(item => item.signedUrl);

        return res.status(200).json({
            message: 'Recorded Paper fetched successfully',
            paperids,
            studentids,
            created_at,
            signedUrl: urls
        });



    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server Error" });
    }
}


export { getQuestions, getAllPapers, getAllStudents, getRecordedPapers }

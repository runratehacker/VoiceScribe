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
export { getQuestions, getAllPapers, getAllStudents }

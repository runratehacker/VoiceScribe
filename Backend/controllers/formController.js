import { downloadControllers } from "./Form/downloadControllers.js";
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

// Gets controller for the form 
// What does the controller do ? 
// Fill in the details extracted from the user into the form.
// Generate PDF and send it to the client

const getFormController = async (req, res) => {

    try {
        const { formid } = req.params;

        const selectedController = downloadControllers.find(controller => controller.id === parseInt(formid));


        if (!selectedController) {
            return res.status(404).json({ message: "Form Controller not found" });
        }

        // executing the controller function with the given request and response
        await selectedController.controller(req, res);


    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
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

export { getQuestions, getFormController, getAllPapers }
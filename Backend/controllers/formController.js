import forms from "../models/formFields.js";
import { downloadControllers } from "./Form/downloadControllers.js";

const getFormFields = async (req, res) => {
    try {
        const { formid } = req.params;

        // Find the form object in the exported array where id matches the requested formid
        const selectedForm = forms.find(form => form.id === formid);

        if (!selectedForm) {
            return res.status(404).json({ message: "Form not found" });
        }

        // Return only the formFields object inside the matched form
        res.status(200).json(selectedForm.formFields);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
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


const getAllForms = async (req, res) => {
    try {
        res.status(200).json(forms);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export { getFormFields, getFormController, getAllForms }